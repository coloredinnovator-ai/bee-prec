import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { adminAuth } from '@/lib/firebase-admin';

const DOCUMENT_MODEL =
  process.env.GEMINI_DOCUMENT_MODEL ||
  process.env.GEMINI_MODEL ||
  'gemini-3.1-pro-preview';

async function verifyOptionalUser(request: Request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    return await adminAuth.verifyIdToken(authHeader.slice('Bearer '.length));
  } catch (error) {
    console.warn('Optional token verification failed for document analysis:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const apiKey =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini is not configured on the server.' },
        { status: 503 }
      );
    }

    const { fileName, mimeType, base64Data, prompt } = await request.json();

    if (!fileName || !mimeType || !base64Data) {
      return NextResponse.json(
        { error: 'fileName, mimeType, and base64Data are required.' },
        { status: 400 }
      );
    }

    const analysisPrompt =
      prompt?.trim() ||
      `Analyze this document for a cooperative enterprise.
1. Summarize the document.
2. Identify legal or operational risks.
3. Recommend next actions for a cooperative board.
Return the result in clean Markdown.`;

    await verifyOptionalUser(request);

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: DOCUMENT_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
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
      fileName,
    });
  } catch (error) {
    console.error('Document analysis route failed:', error);
    return NextResponse.json(
      { error: 'Failed to analyze the document.' },
      { status: 500 }
    );
  }
}
