import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const LEGAL_MODEL =
  process.env.GEMINI_LEGAL_MODEL ||
  process.env.GEMINI_MODEL ||
  'gemini-3-flash-preview';
const MAX_SUBJECT_LENGTH = Number(process.env.LEGAL_ASSIST_MAX_SUBJECT_LENGTH || 160);
const MAX_MESSAGE_LENGTH = Number(process.env.LEGAL_ASSIST_MAX_MESSAGE_LENGTH || 5000);
const MAX_ATTORNEY_NAME_LENGTH = Number(process.env.LEGAL_ASSIST_MAX_ATTORNEY_NAME_LENGTH || 120);
const RATE_LIMIT_WINDOW_MS = Number(process.env.LEGAL_ASSIST_RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.LEGAL_ASSIST_RATE_LIMIT_MAX_REQUESTS || 12);
const LEGAL_ASSIST_RATE_LIMIT_COLLECTION = '_internal_legal_assist_rate_limits';

async function verifyRequiredUser(request: Request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Authentication is required for legal guidance.');
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    return await adminAuth.verifyIdToken(token);
  } catch (error) {
    console.warn('Legal assist token verification failed:', error);
    throw new Error('Your session could not be verified. Sign in again and retry.');
  }
}

async function enforceLegalAssistRateLimit(userId: string) {
  const docRef = adminDb.collection(LEGAL_ASSIST_RATE_LIMIT_COLLECTION).doc(userId);
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

export async function POST(request: Request) {
  try {
    const verifiedUser = await verifyRequiredUser(request);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini is not configured on the server.' },
        { status: 503 }
      );
    }

    const { subject, message, attorneyName } = await request.json();

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required.' },
        { status: 400 }
      );
    }

    const normalizedSubject = typeof subject === 'string' ? subject.trim() : '';
    const normalizedMessage = typeof message === 'string' ? message.trim() : '';
    const normalizedAttorneyName =
      typeof attorneyName === 'string' ? attorneyName.trim() : null;

    if (!normalizedSubject || normalizedSubject.length > MAX_SUBJECT_LENGTH) {
      return NextResponse.json(
        { error: `Subject must be a non-empty string under ${MAX_SUBJECT_LENGTH + 1} characters.` },
        { status: 400 }
      );
    }

    if (!normalizedMessage || normalizedMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be a non-empty string under ${MAX_MESSAGE_LENGTH + 1} characters.` },
        { status: 400 }
      );
    }

    if (normalizedAttorneyName && normalizedAttorneyName.length > MAX_ATTORNEY_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Attorney name must be under ${MAX_ATTORNEY_NAME_LENGTH + 1} characters.` },
        { status: 400 }
      );
    }

    const rateLimit = await enforceLegalAssistRateLimit(verifiedUser.uid);
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
    const prompt = normalizedAttorneyName
      ? `You are a legal assistant supporting a cooperative legal network. Summarize the user's request for attorney ${normalizedAttorneyName}, identify the legal themes involved, and provide a concise intake note that a human attorney can review quickly. Include a disclaimer that this is not legal advice.

Subject: ${normalizedSubject}
Message: ${normalizedMessage}`
      : `You are a legal assistant for B-PREC (Cooperative Legal Nexus). The user is asking about a cooperative legal matter. Provide a helpful, professional, and informative response. Include a clear disclaimer that this is AI-generated guidance and not official legal advice.

Subject: ${normalizedSubject}
Message: ${normalizedMessage}`;

    const response = await ai.models.generateContent({
      model: LEGAL_MODEL,
      contents: prompt,
    });

    const text = response.text?.trim();

    if (!text) {
      return NextResponse.json(
        { error: 'No legal guidance was generated.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      response: text,
      model: LEGAL_MODEL,
      userId: verifiedUser.uid,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes('session could not be verified')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error('Legal assist route failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate legal guidance.' },
      { status: 500 }
    );
  }
}
