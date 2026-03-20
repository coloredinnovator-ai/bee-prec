import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const MAX_SUBJECT_LENGTH = Number(process.env.SEND_NOTIFICATION_MAX_SUBJECT_LENGTH || 160);
const MAX_TEXT_LENGTH = Number(process.env.SEND_NOTIFICATION_MAX_TEXT_LENGTH || 2000);
const MAX_HTML_LENGTH = Number(process.env.SEND_NOTIFICATION_MAX_HTML_LENGTH || 4000);
const RATE_LIMIT_WINDOW_MS = Number(process.env.SEND_NOTIFICATION_RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.SEND_NOTIFICATION_RATE_LIMIT_MAX_REQUESTS || 6);
const SEND_NOTIFICATION_RATE_LIMIT_COLLECTION = '_internal_send_notification_rate_limits';

async function enforceNotificationRateLimit(userId: string) {
  const docRef = adminDb.collection(SEND_NOTIFICATION_RATE_LIMIT_COLLECTION).doc(userId);
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
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const rateLimit = await enforceNotificationRateLimit(decodedToken.uid);
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

    const { to, subject, text, html } = await request.json();

    if (!to || !subject || (!text && !html)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const normalizedTo = typeof to === 'string' ? to.trim() : '';
    const normalizedSubject = typeof subject === 'string' ? subject.trim() : '';
    const normalizedText = typeof text === 'string' ? text.trim() : '';
    const normalizedHtml = typeof html === 'string' ? html.trim() : '';

    if (!normalizedTo || !normalizedSubject || (!normalizedText && !normalizedHtml)) {
      return NextResponse.json(
        { error: 'Invalid notification payload' },
        { status: 400 }
      );
    }

    if (normalizedSubject.length > MAX_SUBJECT_LENGTH) {
      return NextResponse.json(
        { error: `Subject must be under ${MAX_SUBJECT_LENGTH + 1} characters.` },
        { status: 400 }
      );
    }

    if (normalizedText.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Plain-text body must be under ${MAX_TEXT_LENGTH + 1} characters.` },
        { status: 400 }
      );
    }

    if (normalizedHtml.length > MAX_HTML_LENGTH) {
      return NextResponse.json(
        { error: `HTML body must be under ${MAX_HTML_LENGTH + 1} characters.` },
        { status: 400 }
      );
    }

    if (!decodedToken?.email || normalizedTo !== decodedToken.email) {
      return NextResponse.json(
        { error: 'Notifications can only be sent to the authenticated user email.' },
        { status: 403 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is not set. Simulating email send.');
      return NextResponse.json({ success: true, simulated: true });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const data = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: normalizedTo,
      subject: normalizedSubject,
      text: normalizedText,
      html: normalizedHtml,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
