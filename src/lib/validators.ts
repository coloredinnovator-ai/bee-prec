import { z } from "zod";

const safeText = (max: number) => z.string().trim().min(1).max(max);
const safeOptionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

export const clinicInputSchema = z.object({
  name: safeText(80),
  email: z.email().max(160),
  organization: safeOptionalText(120),
  location: safeOptionalText(120),
  stage: z.enum(["idea", "planning", "pilot", "ready-to-launch"]),
  helpType: z.enum(["legal-coop-setup", "governance", "funding", "member-structure", "other"]),
  preferredContact: safeOptionalText(120),
  description: safeText(1200),
  consent: z.literal(true)
});

export const reportInputSchema = z.object({
  title: safeText(120),
  category: z.enum(["fraud", "harassment", "discrimination", "stolenBusinessData", "other"]),
  priority: z.enum(["low", "medium", "high"]),
  businessName: safeOptionalText(80),
  location: safeOptionalText(80),
  body: safeText(5000),
  occurredAt: z.iso.datetime(),
  anonymous: z.boolean().default(true),
  reporterAlias: safeOptionalText(80),
  reporterEmail: z.email().max(160).optional().or(z.literal(""))
});

export const profileInputSchema = z.object({
  displayName: safeText(80),
  handle: z
    .string()
    .trim()
    .max(40)
    .regex(/^[a-zA-Z0-9._-]*$/)
    .optional()
    .or(z.literal("")),
  organization: safeOptionalText(120),
  location: safeOptionalText(80),
  website: z.url().max(160).optional().or(z.literal("")),
  bio: z.string().trim().max(400).optional().or(z.literal("")),
  focusAreas: z.array(z.string().trim().min(1).max(24)).max(8),
  visibility: z.enum(["members", "public"]),
  offlineAccessRequested: z.boolean(),
  matchingOptIn: z.boolean()
});

export const bootstrapInputSchema = z.object({
  displayName: safeText(80),
  requestedRole: z.enum(["member", "pendingLawyer"]).default("member"),
  lawyerCode: safeOptionalText(80)
});

export const communityPostSchema = z.object({
  title: safeText(160),
  body: safeText(5000)
});

export function splitFocusAreas(rawValue: string) {
  return rawValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 8);
}
