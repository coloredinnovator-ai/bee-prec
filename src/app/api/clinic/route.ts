import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { recordAuditEvent } from "@/lib/audit";
import { getRequestMetadata } from "@/lib/auth";
import { getAdminServices, isAdminRuntimeLikelyReady } from "@/lib/firebase/admin";
import { clinicInputSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminRuntimeLikelyReady()) {
    return NextResponse.json({ ok: false, error: "Firebase admin runtime is not configured." }, { status: 503 });
  }

  try {
    const payload = clinicInputSchema.parse(await request.json());
    const { db, FieldValue } = getAdminServices();
    const docRef = await db.collection("clinicSignups").add({
      ...payload,
      emailLower: payload.email.toLowerCase(),
      status: "received",
      source: "website-v2",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    const metadata = getRequestMetadata(request);

    await recordAuditEvent({
      eventType: "clinic.signup.created",
      actorType: "public",
      targetCollection: "clinicSignups",
      targetId: docRef.id,
      detail: {
        stage: payload.stage,
        helpType: payload.helpType
      },
      ...metadata
    });

    return NextResponse.json({ ok: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? "Invalid clinic intake." }, { status: 400 });
    }

    console.error("Clinic intake failed", error);
    return NextResponse.json({ ok: false, error: "Unable to submit clinic intake." }, { status: 500 });
  }
}
