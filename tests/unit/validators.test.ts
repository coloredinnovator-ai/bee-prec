import { describe, expect, it } from "vitest";

import { clinicInputSchema, communityPostSchema, profileInputSchema, reportInputSchema } from "@/lib/validators";

describe("validators", () => {
  it("accepts a valid clinic intake", () => {
    const result = clinicInputSchema.parse({
      name: "BEE Coop",
      email: "team@example.com",
      organization: "Worker circle",
      location: "Oakland, CA",
      stage: "planning",
      helpType: "governance",
      preferredContact: "email",
      description: "We need a governance review.",
      consent: true
    });

    expect(result.stage).toBe("planning");
  });

  it("rejects a report without a valid timestamp", () => {
    expect(() =>
      reportInputSchema.parse({
        title: "Bad actor",
        category: "fraud",
        priority: "high",
        body: "The body",
        occurredAt: "not-a-date",
        anonymous: true
      })
    ).toThrow();
  });

  it("accepts a valid profile payload", () => {
    const result = profileInputSchema.parse({
      displayName: "Bee Member",
      handle: "bee-member",
      organization: "Co-op",
      location: "Los Angeles",
      website: "https://example.com",
      bio: "Collective governance work.",
      focusAreas: ["governance", "housing"],
      visibility: "members",
      offlineAccessRequested: false,
      matchingOptIn: true
    });

    expect(result.focusAreas).toHaveLength(2);
  });

  it("rejects an empty community post", () => {
    expect(() =>
      communityPostSchema.parse({
        title: "",
        body: ""
      })
    ).toThrow();
  });
});
