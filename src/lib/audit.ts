import "server-only";

import { getAdminServices } from "@/lib/firebase/admin";

type AuditInput = {
  eventType: string;
  actorType: "public" | "member" | "staff" | "automation";
  actorId?: string | null;
  actorEmail?: string | null;
  targetCollection?: string;
  targetId?: string;
  status?: "accepted" | "rejected" | "observed";
  detail?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
};

export async function recordAuditEvent(input: AuditInput) {
  try {
    const { db, FieldValue } = getAdminServices();

    await db.collection("auditEvents").add({
      eventType: input.eventType,
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      targetCollection: input.targetCollection ?? null,
      targetId: input.targetId ?? null,
      status: input.status ?? "accepted",
      detail: input.detail ?? {},
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      createdAt: FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to record audit event", error);
  }
}
