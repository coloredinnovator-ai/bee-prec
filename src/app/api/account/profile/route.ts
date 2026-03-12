import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { recordAuditEvent } from "@/lib/audit";
import { getAuthContextFromRequest, getRequestMetadata } from "@/lib/auth";
import { getAdminServices, isAdminRuntimeLikelyReady, toIsoDate } from "@/lib/firebase/admin";
import { profileInputSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAdminRuntimeLikelyReady()) {
    return NextResponse.json({ ok: false, error: "Firebase admin runtime is not configured." }, { status: 503 });
  }

  const authContext = await getAuthContextFromRequest(request);

  if (!authContext) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  try {
    const { db } = getAdminServices();
    const [userDoc, profileDoc] = await Promise.all([
      db.collection("users").doc(authContext.uid).get(),
      db.collection("profiles").doc(authContext.uid).get()
    ]);
    const user = userDoc.exists ? userDoc.data() : null;
    const profile = profileDoc.exists ? profileDoc.data() : null;

    return NextResponse.json({
      ok: true,
      user: {
        role: user?.role ?? "member",
        updatedAt: toIsoDate(user?.updatedAt)
      },
      profile: {
        displayName: profile?.displayName ?? authContext.displayName,
        handle: profile?.handle ?? "",
        organization: profile?.organization ?? "",
        location: profile?.location ?? "",
        website: profile?.website ?? "",
        bio: profile?.bio ?? "",
        focusAreas: Array.isArray(profile?.focusAreas) ? profile?.focusAreas : [],
        visibility: profile?.visibility ?? "members",
        offlineAccessRequested: Boolean(profile?.offlineAccessRequested),
        matchingOptIn: Boolean(profile?.matchingOptIn),
        updatedAt: toIsoDate(profile?.updatedAt)
      }
    });
  } catch (error) {
    console.error("Profile fetch failed", error);
    return NextResponse.json({ ok: false, error: "Unable to load profile." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRuntimeLikelyReady()) {
    return NextResponse.json({ ok: false, error: "Firebase admin runtime is not configured." }, { status: 503 });
  }

  try {
    const authContext = await getAuthContextFromRequest(request);

    if (!authContext) {
      return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }

    const payload = profileInputSchema.parse(await request.json());
    const { db, FieldValue } = getAdminServices();
    const profileRef = db.collection("profiles").doc(authContext.uid);
    const userRef = db.collection("users").doc(authContext.uid);
    const existingProfile = await profileRef.get();

    await profileRef.set(
      {
        uid: authContext.uid,
        displayName: payload.displayName,
        handle: payload.handle || "",
        organization: payload.organization ?? "",
        location: payload.location ?? "",
        website: payload.website || "",
        bio: payload.bio || "",
        focusAreas: payload.focusAreas,
        visibility: payload.visibility,
        offlineAccessRequested: payload.offlineAccessRequested,
        matchingOptIn: payload.matchingOptIn,
        verified: existingProfile.exists ? existingProfile.data()?.verified ?? false : false,
        avatarUrl: existingProfile.exists ? existingProfile.data()?.avatarUrl ?? "" : "",
        avatarPath: existingProfile.exists ? existingProfile.data()?.avatarPath ?? "" : "",
        createdAt: existingProfile.exists ? existingProfile.data()?.createdAt : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    await userRef.set(
      {
        displayName: payload.displayName,
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    await recordAuditEvent({
      eventType: "profile.updated",
      actorType: authContext.role === "member" ? "member" : "staff",
      actorId: authContext.uid,
      actorEmail: authContext.email,
      targetCollection: "profiles",
      targetId: authContext.uid,
      detail: {
        visibility: payload.visibility
      },
      ...getRequestMetadata(request)
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? "Invalid profile payload." }, { status: 400 });
    }

    console.error("Profile update failed", error);
    return NextResponse.json({ ok: false, error: "Unable to update profile." }, { status: 500 });
  }
}
