import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { recordAuditEvent } from "@/lib/audit";
import { getAuthContextFromRequest, getRequestMetadata } from "@/lib/auth";
import { getAdminServices, isAdminRuntimeLikelyReady } from "@/lib/firebase/admin";
import { bootstrapInputSchema } from "@/lib/validators";

const lawyerCodes = new Set(["BEEPREC-LAWYER", "BEEPREC-LAWYER-2026"]);

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

    const payload = bootstrapInputSchema.parse(await request.json());

    if (payload.requestedRole === "pendingLawyer" && payload.lawyerCode && !lawyerCodes.has(payload.lawyerCode)) {
      return NextResponse.json({ ok: false, error: "Lawyer code not accepted." }, { status: 403 });
    }

    const { db, FieldValue } = getAdminServices();
    const userRef = db.collection("users").doc(authContext.uid);
    const profileRef = db.collection("profiles").doc(authContext.uid);
    const existingUser = await userRef.get();
    const existingProfile = await profileRef.get();
    const currentRole = typeof existingUser.data()?.role === "string" ? existingUser.data()?.role : null;
    const role =
      currentRole ??
      (payload.requestedRole === "pendingLawyer" && payload.lawyerCode && lawyerCodes.has(payload.lawyerCode)
        ? "pendingLawyer"
        : "member");

    await userRef.set(
      {
        uid: authContext.uid,
        email: authContext.email ?? "",
        displayName: payload.displayName,
        role,
        deleted: false,
        createdAt: existingUser.exists ? existingUser.data()?.createdAt : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    if (!existingProfile.exists) {
      await profileRef.set({
        uid: authContext.uid,
        displayName: payload.displayName,
        handle: "",
        organization: "",
        location: "",
        website: "",
        bio: "",
        focusAreas: [],
        avatarUrl: "",
        avatarPath: "",
        verified: false,
        visibility: "members",
        offlineAccessRequested: false,
        matchingOptIn: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    await recordAuditEvent({
      eventType: "account.bootstrap",
      actorType: role === "member" ? "member" : "staff",
      actorId: authContext.uid,
      actorEmail: authContext.email,
      targetCollection: "users",
      targetId: authContext.uid,
      detail: {
        role
      },
      ...getRequestMetadata(request)
    });

    return NextResponse.json({ ok: true, role });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? "Invalid account payload." }, { status: 400 });
    }

    console.error("Account bootstrap failed", error);
    return NextResponse.json({ ok: false, error: "Unable to bootstrap account." }, { status: 500 });
  }
}
