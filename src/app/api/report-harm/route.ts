import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { recordAuditEvent } from "@/lib/audit";
import { getAuthContextFromRequest, getRequestMetadata } from "@/lib/auth";
import { getAdminServices, isAdminRuntimeLikelyReady } from "@/lib/firebase/admin";
import { reportInputSchema } from "@/lib/validators";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminRuntimeLikelyReady()) {
    return NextResponse.json({ ok: false, error: "Firebase admin runtime is not configured." }, { status: 503 });
  }

  try {
    const metadata = getRequestMetadata(request);
    const authContext = await getAuthContextFromRequest(request);
    const formData = await request.formData();
    const occurredAtValue = formData.get("occurredAt");
    const occurredAtDate = new Date(String(occurredAtValue));

    if (Number.isNaN(occurredAtDate.getTime())) {
      return NextResponse.json({ ok: false, error: "Occurrence date is invalid." }, { status: 400 });
    }

    const parsed = reportInputSchema.parse({
      title: formData.get("title"),
      category: formData.get("category"),
      priority: formData.get("priority"),
      businessName: formData.get("businessName"),
      location: formData.get("location"),
      body: formData.get("body"),
      occurredAt: occurredAtDate.toISOString(),
      anonymous: formData.get("anonymous") === "on",
      reporterAlias: formData.get("reporterAlias"),
      reporterEmail: formData.get("reporterEmail")
    });
    const attachment = formData.get("attachment");
    const { db, storage, FieldValue } = getAdminServices();
    const docRef = db.collection("incidentReports").doc();
    let attachmentPath: string | null = null;

    if (attachment instanceof File && attachment.size > 0) {
      if (attachment.size > 5 * 1024 * 1024) {
        return NextResponse.json({ ok: false, error: "Attachment must be 5MB or smaller." }, { status: 400 });
      }

      if (!allowedMimeTypes.has(attachment.type)) {
        return NextResponse.json({ ok: false, error: "Attachment type is not allowed." }, { status: 400 });
      }

      const storagePath = `incidents/${authContext?.uid ?? "public"}/${docRef.id}/${attachment.name || randomUUID()}`;
      const buffer = Buffer.from(await attachment.arrayBuffer());
      await storage.bucket().file(storagePath).save(buffer, {
        contentType: attachment.type,
        resumable: false,
        metadata: {
          cacheControl: "private,max-age=0"
        }
      });
      attachmentPath = storagePath;
    }

    await docRef.set({
      title: parsed.title,
      category: parsed.category,
      priority: parsed.priority,
      businessName: parsed.businessName ?? "",
      location: parsed.location ?? "",
      body: parsed.body,
      occurredAt: new Date(parsed.occurredAt),
      anonymous: parsed.anonymous,
      reporterAlias:
        parsed.anonymous && !parsed.reporterAlias ? "Anonymous" : parsed.reporterAlias || authContext?.displayName || "Public reporter",
      reporterEmail: parsed.reporterEmail || null,
      reportedBy: authContext?.uid ?? "public",
      status: "open",
      hasAttachment: Boolean(attachmentPath),
      attachmentPath,
      attachmentUrl: attachmentPath ? `gs://${storage.bucket().name}/${attachmentPath}` : "",
      source: "website-v2",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      deleted: false
    });

    await recordAuditEvent({
      eventType: "incident.report.created",
      actorType: authContext ? "member" : "public",
      actorId: authContext?.uid,
      actorEmail: authContext?.email,
      targetCollection: "incidentReports",
      targetId: docRef.id,
      detail: {
        category: parsed.category,
        priority: parsed.priority,
        hasAttachment: Boolean(attachmentPath)
      },
      ...metadata
    });

    return NextResponse.json({ ok: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? "Invalid report payload." }, { status: 400 });
    }

    console.error("Report intake failed", error);
    return NextResponse.json({ ok: false, error: "Unable to submit report." }, { status: 500 });
  }
}
