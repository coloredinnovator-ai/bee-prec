import { NextResponse } from "next/server";

import { recordAuditEvent } from "@/lib/audit";
import { assertRole, getAuthContextFromRequest, getRequestMetadata } from "@/lib/auth";
import { getAdminServices, isAdminRuntimeLikelyReady, toIsoDate } from "@/lib/firebase/admin";

export const runtime = "nodejs";

async function countCollection(collectionName: string) {
  const { db } = getAdminServices();
  const snapshot = await db.collection(collectionName).count().get();
  return snapshot.data().count;
}

async function latestItems(collectionName: string, limitCount = 5) {
  const { db } = getAdminServices();
  return db.collection(collectionName).orderBy("createdAt", "desc").limit(limitCount).get();
}

export async function GET(request: Request) {
  if (!isAdminRuntimeLikelyReady()) {
    return NextResponse.json({ ok: false, error: "Firebase admin runtime is not configured." }, { status: 503 });
  }

  const authContext = await getAuthContextFromRequest(request);

  if (!assertRole(authContext, ["lawyer", "admin", "pendingLawyer"])) {
    return NextResponse.json({ ok: false, error: "Staff access required." }, { status: 403 });
  }

  try {
    const [clinicCount, reportCount, communityCount, backupCount, clinicDocs, reportDocs, backupDocs, auditDocs] = await Promise.all([
      countCollection("clinicSignups"),
      countCollection("incidentReports"),
      countCollection("communityPosts"),
      countCollection("backupRuns"),
      latestItems("clinicSignups"),
      latestItems("incidentReports"),
      latestItems("backupRuns"),
      latestItems("auditEvents")
    ]);

    await recordAuditEvent({
      eventType: "admin.overview.viewed",
      actorType: "staff",
      actorId: authContext?.uid,
      actorEmail: authContext?.email,
      targetCollection: "auditEvents",
      status: "observed",
      ...getRequestMetadata(request)
    });

    return NextResponse.json({
      ok: true,
      counts: {
        clinicIntakes: clinicCount,
        reports: reportCount,
        communityPosts: communityCount,
        backupRuns: backupCount
      },
      latestClinic: clinicDocs.docs.map((docItem) => {
        const data = docItem.data();
        return {
          id: docItem.id,
          name: data.name ?? "Unnamed",
          helpType: data.helpType ?? "unknown",
          createdAt: toIsoDate(data.createdAt)
        };
      }),
      latestReports: reportDocs.docs.map((docItem) => {
        const data = docItem.data();
        return {
          id: docItem.id,
          title: data.title ?? "Untitled",
          status: data.status ?? "open",
          createdAt: toIsoDate(data.createdAt)
        };
      }),
      latestBackups: backupDocs.docs.map((docItem) => {
        const data = docItem.data();
        return {
          id: docItem.id,
          status: data.status ?? "unknown",
          summary: data.summary ?? "No summary",
          createdAt: toIsoDate(data.createdAt)
        };
      }),
      latestAuditEvents: auditDocs.docs.map((docItem) => {
        const data = docItem.data();
        return {
          id: docItem.id,
          eventType: data.eventType ?? "unknown",
          actorType: data.actorType ?? "unknown",
          createdAt: toIsoDate(data.createdAt)
        };
      })
    });
  } catch (error) {
    console.error("Admin overview failed", error);
    return NextResponse.json({ ok: false, error: "Unable to load admin overview." }, { status: 500 });
  }
}
