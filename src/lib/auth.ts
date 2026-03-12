import "server-only";

import { NextResponse } from "next/server";

import { getAdminServices } from "@/lib/firebase/admin";

export type AuthContext = {
  uid: string;
  email: string | null;
  role: string;
  displayName: string;
};

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");

  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

export async function getAuthContextFromRequest(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const { auth, db } = getAdminServices();
  const decoded = await auth.verifyIdToken(token);
  const userDoc = await db.collection("users").doc(decoded.uid).get();
  const userData = userDoc.exists ? userDoc.data() : null;

  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    role: typeof userData?.role === "string" ? userData.role : "member",
    displayName:
      typeof userData?.displayName === "string"
        ? userData.displayName
        : decoded.name || decoded.email || "BEE member"
  } satisfies AuthContext;
}

export function assertRole(context: AuthContext | null, allowedRoles: string[]) {
  return Boolean(context && allowedRoles.includes(context.role));
}

export function getRequestMetadata(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() || "unknown";

  return {
    ipAddress,
    userAgent: request.headers.get("user-agent") || "unknown"
  };
}
