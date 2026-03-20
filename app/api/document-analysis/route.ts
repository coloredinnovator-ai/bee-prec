import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const DOCUMENT_MODEL =
  process.env.GEMINI_DOCUMENT_MODEL ||
  process.env.GEMINI_MODEL ||
  'gemini-3.1-pro-preview';

const MAX_DOCUMENT_BYTES = Number(process.env.DOCUMENT_ANALYSIS_MAX_BYTES || 5 * 1024 * 1024);
const MAX_FILE_NAME_LENGTH = Number(process.env.DOCUMENT_ANALYSIS_MAX_FILE_NAME_LENGTH || 160);
const MAX_PROMPT_LENGTH = Number(process.env.DOCUMENT_ANALYSIS_MAX_PROMPT_LENGTH || 5000);
const RATE_LIMIT_WINDOW_MS = Number(process.env.DOCUMENT_ANALYSIS_RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.DOCUMENT_ANALYSIS_RATE_LIMIT_MAX_REQUESTS || 10);
const MAX_BASE64_BYTES = Math.ceil(MAX_DOCUMENT_BYTES / 3) * 4;
const MAX_REQUEST_BODY_BYTES =
  Number(process.env.DOCUMENT_ANALYSIS_MAX_REQUEST_BODY_BYTES || (MAX_BASE64_BYTES + 256 * 1024));
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
]);

const DOCUMENT_ANALYSIS_RATE_LIMIT_COLLECTION = '_internal_document_analysis_rate_limits';

async function verifyRequiredUser(request: Request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Authentication is required for document analysis.');
  }

  try {
    const token = authHeader.slice('Bearer '.length);
    const decodedToken = await adminAuth.verifyIdToken(token, true);
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    if (userRecord.disabled) {
      throw new Error('disabled-user');
    }
    return decodedToken;
  } catch (error) {
    console.warn('Token verification failed for document analysis:', error);
    throw new Error('Your session could not be verified. Sign in again and retry.');
  }
}

async function enforceDocumentAnalysisRateLimit(userId: string) {
  const docRef = adminDb.collection(DOCUMENT_ANALYSIS_RATE_LIMIT_COLLECTION).doc(userId);
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  return adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(docRef);
    const existing = snapshot.data();
    const priorTimestamps = Array.isArray(existing?.timestamps) ? existing.timestamps : [];
    const activeTimestamps = priorTimestamps
      .filter((value: unknown) => typeof value === 'number' && value >= windowStart)
      .sort((left: number, right: number) => left - right);

    if (activeTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
      const oldestActive = activeTimestamps[0];
      const retryAfterMs = Math.max(0, oldestActive + RATE_LIMIT_WINDOW_MS - now);
      return {
        allowed: false,
        retryAfterMs,
      };
    }

    activeTimestamps.push(now);
    transaction.set(
      docRef,
      {
        timestamps: activeTimestamps,
        updatedAt: new Date(now),
      },
      { merge: true }
    );

    return {
      allowed: true,
      retryAfterMs: 0,
    };
  });
}

function hasStrictBase64Encoding(value: string) {
  return value.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

async function readRequestBodyWithLimit(request: Request, maxBytes: number) {
  const reader = request.body?.getReader();
  if (!reader) {
    return '';
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      throw new Error('request-body-too-large');
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder('utf-8', { fatal: true }).decode(merged);
}

function isUtf8TextDocument(bytes: Buffer) {
  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return !decoded.includes('\u0000');
  } catch {
    return false;
  }
}

function detectDocumentMimeType(bytes: Buffer) {
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return 'application/pdf';
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (isUtf8TextDocument(bytes)) {
    return 'text/plain';
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini is not configured on the server.' },
        { status: 503 }
      );
    }

    const verifiedUser = await verifyRequiredUser(request);

    const contentLengthHeader = request.headers.get('content-length');
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BODY_BYTES) {
      return NextResponse.json(
        {
          error: `Encoded request body too large. Maximum supported upload size is ${Math.floor(
            MAX_DOCUMENT_BYTES / (1024 * 1024)
          )} MB.`,
        },
        { status: 413 }
      );
    }

    let rawBody = '';
    try {
      rawBody = await readRequestBodyWithLimit(request, MAX_REQUEST_BODY_BYTES);
    } catch (error) {
      if (error instanceof TypeError) {
        return NextResponse.json({ error: 'Request body must be valid UTF-8 JSON.' }, { status: 400 });
      }
      if (error instanceof Error && error.message === 'request-body-too-large') {
        return NextResponse.json(
          {
            error: `Encoded request body too large. Maximum supported upload size is ${Math.floor(
              MAX_DOCUMENT_BYTES / (1024 * 1024)
            )} MB.`,
          },
          { status: 413 }
        );
      }
      throw error;
    }

    let parsedBody: { fileName?: unknown; mimeType?: unknown; base64Data?: unknown; prompt?: unknown };
    try {
      parsedBody = JSON.parse(rawBody || '{}');
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }

    const { fileName, mimeType, base64Data, prompt } = parsedBody;

    if (!fileName || !mimeType || !base64Data) {
      return NextResponse.json(
        { error: 'fileName, mimeType, and base64Data are required.' },
        { status: 400 }
      );
    }

    const normalizedFileName = typeof fileName === 'string' ? fileName.trim() : '';
    if (!normalizedFileName || normalizedFileName.length > MAX_FILE_NAME_LENGTH) {
      return NextResponse.json(
        { error: `fileName must be a non-empty string under ${MAX_FILE_NAME_LENGTH + 1} characters.` },
        { status: 400 }
      );
    }

    const normalizedMimeType = typeof mimeType === 'string' ? mimeType.trim().toLowerCase() : '';
    if (!ALLOWED_DOCUMENT_MIME_TYPES.has(normalizedMimeType)) {
      return NextResponse.json(
        { error: 'Unsupported document type. Upload a PDF, PNG, JPG, or TXT file.' },
        { status: 400 }
      );
    }

    if (typeof base64Data !== 'string' || base64Data.length === 0) {
      return NextResponse.json(
        { error: 'base64Data must be a non-empty base64 string.' },
        { status: 400 }
      );
    }

    if (base64Data.length > MAX_BASE64_BYTES || !hasStrictBase64Encoding(base64Data)) {
      return NextResponse.json(
        { error: 'The uploaded document payload is not valid base64.' },
        { status: 400 }
      );
    }

    let decodedBytes: Buffer;
    try {
      decodedBytes = Buffer.from(base64Data, 'base64');
    } catch (error) {
      console.warn('Base64 decoding failed for document analysis:', error);
      return NextResponse.json(
        { error: 'The uploaded document payload is not valid base64.' },
        { status: 400 }
      );
    }

    if (!decodedBytes.length) {
      return NextResponse.json(
        { error: 'The uploaded document is empty.' },
        { status: 400 }
      );
    }

    if (decodedBytes.length > MAX_DOCUMENT_BYTES) {
      return NextResponse.json(
        { error: `Document too large. Maximum supported size is ${Math.floor(MAX_DOCUMENT_BYTES / (1024 * 1024))} MB.` },
        { status: 413 }
      );
    }

    const detectedMimeType = detectDocumentMimeType(decodedBytes);
    if (!detectedMimeType || detectedMimeType !== normalizedMimeType) {
      return NextResponse.json(
        { error: 'The uploaded document contents do not match the declared document type.' },
        { status: 400 }
      );
    }

    if (prompt != null && typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'prompt must be a string when provided.' },
        { status: 400 }
      );
    }

    const normalizedPrompt = typeof prompt === 'string' ? prompt.trim() : '';
    const analysisPrompt =
      normalizedPrompt ||
      `Analyze this document for a cooperative enterprise.
1. Summarize the document.
2. Identify legal or operational risks.
3. Recommend next actions for a cooperative board.
Return the result in clean Markdown.`;

    if (analysisPrompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Prompt too long. Maximum supported prompt length is ${MAX_PROMPT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const rateLimit = await enforceDocumentAnalysisRateLimit(verifiedUser.uid);
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(1, Math.ceil(rateLimit.retryAfterMs / 1000));
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Try again in about ${retryAfterSeconds} seconds.`,
          retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
          },
        }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: DOCUMENT_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: detectedMimeType,
              data: base64Data,
            },
          },
          {
            text: analysisPrompt,
          },
        ],
      },
    });

    const result = response.text?.trim();

    if (!result) {
      return NextResponse.json(
        { error: `No analysis was generated for ${fileName}.` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      result,
      model: DOCUMENT_MODEL,
      fileName: normalizedFileName,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes('session could not be verified')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error('Document analysis route failed:', error);
    return NextResponse.json(
      { error: 'Failed to analyze the document.' },
      { status: 500 }
    );
  }
}
