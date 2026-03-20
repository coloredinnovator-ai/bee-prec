import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { adminAuth } from '@/lib/firebase-admin';

const LEGAL_MODEL =
  process.env.GEMINI_LEGAL_MODEL ||
  process.env.GEMINI_MODEL ||
  'gemini-3-flash-preview';

async function verifyRequiredUser(request: Request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    return await adminAuth.verifyIdToken(token);
  } catch (error) {
    console.warn('Legal assist token verification failed:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const verifiedUser = await verifyRequiredUser(request);

    if (!verifiedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

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

    const ai = new GoogleGenAI({ apiKey });
    const prompt = attorneyName
      ? `You are a legal assistant supporting a cooperative legal network. Summarize the user's request for attorney ${attorneyName}, identify the legal themes involved, and provide a concise intake note that a human attorney can review quickly. Include a disclaimer that this is not legal advice.

Subject: ${subject}
Message: ${message}`
      : `You are a legal assistant for B-PREC (Cooperative Legal Nexus). The user is asking about a cooperative legal matter. Provide a helpful, professional, and informative response. Include a clear disclaimer that this is AI-generated guidance and not official legal advice.

Subject: ${subject}
Message: ${message}`;

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
    console.error('Legal assist route failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate legal guidance.' },
      { status: 500 }
    );
  }
}
