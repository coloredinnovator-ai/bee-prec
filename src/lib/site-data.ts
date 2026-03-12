export const primaryNav = [
  { href: "/", label: "Overview" },
  { href: "/clinic", label: "Clinic" },
  { href: "/report-harm", label: "Report Harm" },
  { href: "/community", label: "Community" },
  { href: "/library", label: "Library" },
  { href: "/news", label: "News" }
];

export const secureNav = [
  { href: "/account/login", label: "Member Login" },
  { href: "/account/profile", label: "Profile" },
  { href: "/admin/login", label: "Admin" }
];

export const operatingLanes = [
  {
    title: "Clinic intake",
    href: "/clinic",
    body: "Structured intake for cooperative launches, restructures, governance repairs, and member-capital questions."
  },
  {
    title: "Protected reporting",
    href: "/report-harm",
    body: "A safer path for incident reports, evidence intake, and lawyer-led review with auditable handling."
  },
  {
    title: "Member community",
    href: "/community",
    body: "A moderated member-facing space with clearer boundaries between public trust content and internal discussion."
  },
  {
    title: "Operations ledger",
    href: "/admin",
    body: "GitHub, App Hosting, audit events, and GCP backup evidence now operate as one delivery spine."
  }
];

export const trustSignals = [
  { label: "Deploy path", value: "GitHub -> Firebase App Hosting" },
  { label: "Audit model", value: "Server-side writes + audit events" },
  { label: "Backup stance", value: "GCS payloads + GitHub ledger" },
  { label: "Website shape", value: "Route-based, mobile-first, public/admin split" }
];

export const homepageHighlights = [
  {
    eyebrow: "Legal core",
    title: "Public trust first",
    copy: "The front door is now a clear website with separate lanes for clinic work, reporting, and member coordination."
  },
  {
    eyebrow: "Operations",
    title: "GitHub-backed governance",
    copy: "Release history, workflow evidence, backup manifests, and restore drills stay visible from the repository instead of living in one-off notes."
  },
  {
    eyebrow: "Security",
    title: "Narrower write surface",
    copy: "Sensitive actions move off direct browser writes and into validated server handlers with Firebase Admin role checks."
  }
];

export const libraryResources = [
  {
    title: "ICA Cooperative Law Database",
    href: "https://www.ica.coop/en/co-operatives/co-operative-law-database",
    summary: "Global cooperative law references curated by the International Cooperative Alliance."
  },
  {
    title: "US Federation of Worker Cooperatives",
    href: "https://www.usworker.coop/resources/",
    summary: "Templates, governance guides, and legal primers for worker-owned entities."
  },
  {
    title: "Platform Co-op Playbook",
    href: "https://platform.coop/now/playbook",
    summary: "Practical guidance for digital cooperatives, shared governance, and non-extractive models."
  },
  {
    title: "Grounded Solutions CLT Resources",
    href: "https://groundedsolutions.org/resources",
    summary: "Community land trust tools, model language, and stewardship frameworks."
  },
  {
    title: "Community-Wealth.org",
    href: "https://community-wealth.org/",
    summary: "Case studies and democratic ownership research spanning cooperatives, trusts, and public commons."
  },
  {
    title: "United Nations Cooperative Resources",
    href: "https://www.un.org/development/desa/cooperatives/",
    summary: "International policy and development material relevant to cooperative formation."
  }
];

export const newsItems = [
  {
    title: "Platform co-ops continue shaping AI and data trust debates",
    date: "2026-02-10",
    href: "https://platform.coop/"
  },
  {
    title: "Global co-op policy round-up",
    date: "2026-02-15",
    href: "https://www.thenews.coop/"
  },
  {
    title: "Via Campesina on food sovereignty and land stewardship",
    date: "2026-02-27",
    href: "https://viacampesina.org/en/"
  },
  {
    title: "MST examples of worker-owned agrarian reform cooperatives",
    date: "2026-02-27",
    href: "https://mst.org.br/english/"
  }
];

export const communityGuidelines = [
  "Support over spectacle: harm reports and member disputes are handled with care-first moderation.",
  "Sensitive legal details belong in intake or report flows, not public threads.",
  "All moderation actions are expected to leave an auditable trail.",
  "Verified staff roles can triage, resolve, or suppress content when safety requires it."
];

export const adminModules = [
  "Clinic pipeline",
  "Incident triage",
  "Community moderation",
  "Identity verification",
  "Deletion requests",
  "Backup ledger"
];

export const sampleCommunityPosts = [
  {
    id: "sample-1",
    title: "Housing co-op bylaws review checklist",
    body: "Looking for a clean checklist before we circulate draft bylaws to founding members. What sequence helped your co-op avoid governance drift?",
    authorName: "Founding Circle",
    createdAt: "2026-03-01T19:00:00.000Z"
  },
  {
    id: "sample-2",
    title: "Member-capital options for worker-owned food projects",
    body: "We are comparing grants, preferred shares, and member loans. Interested in examples that kept control democratic without starving the launch budget.",
    authorName: "Kitchen Table Co-op",
    createdAt: "2026-02-27T18:30:00.000Z"
  },
  {
    id: "sample-3",
    title: "Community safety response map",
    body: "Drafting a response ladder for harassment reports that protects members and avoids ad hoc moderator decisions.",
    authorName: "Care Working Group",
    createdAt: "2026-02-24T15:20:00.000Z"
  }
];

export const roleOptions = [
  { value: "member", label: "Member" },
  { value: "pendingLawyer", label: "Lawyer / reviewer" }
];
