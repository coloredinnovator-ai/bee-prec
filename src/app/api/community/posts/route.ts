import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { recordAuditEvent } from "@/lib/audit";
import { getAuthContextFromRequest, getRequestMetadata } from "@/lib/auth";
import { getAdminServices, isAdminRuntimeLikelyReady } from "@/lib/firebase/admin";
import { communityPostSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminRuntimeLikelyReady()) {
    return NextResponse.json({ ok: false, error: "Firebase admin runtime is not configured." }, { status: 503 });
  }

  try {
    const authContext = await getAuthContextFromRequest(request);

    if (!authContext) {
      return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }

    const payload = communityPostSchema.parse(await request.json());
    const { db, FieldValue } = getAdminServices();
    const docRef = await db.collection("communityPosts").add({
      title: payload.title,
      body: payload.body,
      createdBy: authContext.uid,
      authorName: authContext.displayName,
      flags: 0,
      removed: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    await recordAuditEvent({
      eventType: "community.post.created",
      actorType: authContext.role === "member" ? "member" : "staff",
      actorId: authContext.uid,
      actorEmail: authContext.email,
      targetCollection: "communityPosts",
      targetId: docRef.id,
      ...getRequestMetadata(request)
    });

    return NextResponse.json({ ok: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? "Invalid community post." }, { status: 400 });
    }

    console.error("Community post failed", error);
    return NextResponse.json({ ok: false, error: "Unable to publish post." }, { status: 500 });
  }
}
