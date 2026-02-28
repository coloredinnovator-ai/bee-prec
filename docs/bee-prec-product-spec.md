# BEE COOP Product Specification (Rewritten and Prioritized)

## 1) Vision

BEE COOP is a cooperative legal services and community platform owned by a legal team, built to provide:

- Accessible consultation pathways for people and businesses
- A trusted channel for reporting misconduct and harm
- A moderated community space for discussion and support
- Reliable controls for user profile and content deletion

The platform must feel safe, accountable, and professional while remaining easy for the public to use.

## 2) Core user stories

### 2.1 Public visitor
- Can learn what BEE COOP is and how support works.
- Can request a consultation without technical friction.
- Can submit a report about a business or incident.
- Can browse community posts, with visible safety standards.
- Can request deletion of their own profile data/messages.

### 2.2 Client (registered user)
- Can submit and track consultation requests.
- Can create reports with optional attachments and details.
- Can participate in community discussion within visibility and policy rules.
- Can fully delete their own profile data and message history.

### 2.3 Lawyer / admin
- Can review and manage consultation requests.
- Can triage reports, escalate where needed, and update status.
- Can moderate community content.
- Can apply policy actions with auditability and traceability.

## 3) Functional requirements

### 3.1 Consultation module
- Intake form with reason, urgency, business type, and preferred contact method.
- Case tracking states: `new`, `reviewing`, `scheduled`, `closed`.
- Optional follow-up notes and outcome fields for lawyers.

### 3.2 Reporting module (“Report Crime/Business Harm”)
- Structured incident form:
  - reporter identity / anonymous mode (policy dependent)
  - category, location, date/time, description
  - evidence uploads and timeline notes
- Triage workflow:
  - new → verification needed → under review → resolved / forwarded.
- Priority tagging and alerting for urgent/high-risk cases.

### 3.3 Community “fan/peer” space
- User posts and comments (topic-based).
- Rate and report mechanisms.
- Moderation queue for flagged content.
- Soft-delete support for user deletions.

### 3.4 Profiles and deletion controls
- User account profile (display name, contact preferences, role).
- Privacy settings: visibility and messaging controls.
- Delete profile:
  - confirms impact before deletion
  - removes public identity from community content
  - keeps legal hold items if policy requires retention
  - produces deletion confirmation record.

### 3.5 Trust and governance
- Lawyer ownership model reflected in admin roles.
- Legal-consistency policy for sensitive reports and records.
- Transparent moderation policy surfaced in UI.
- Immutable audit log for moderation actions and content changes.

## 4) Non-functional requirements

- Security-first design with least privilege and role-based access.
- All critical writes and deletes captured with server-side rules.
- Read/write auditability for legal defensibility.
- Responsive, mobile-first UI with accessible patterns.
- Incident response playbook for abuse/spam/security abuse.

## 5) Suggested Firebase implementation (foundational)

- Firebase Hosting: two targets already configured.
  - `bee-prec-site` (production)
  - `bee-prec-site-staging` (staging)
- Firebase Auth: user and lawyer/admin roles.
- Firestore:
  - `users`, `consultations`, `reports`, `communityPosts`, `communityComments`,
    `deletionRequests`, `auditEvents`
- Firebase Functions:
  - report intake validation and moderation triggers
  - role checks and status workflow transitions
- Cloud Storage:
  - secure attachments and evidence files
- Security Rules:
  - data access by role and ownership
  - hard delete controls and retention protections

## 6) Launch-ready checklist

1. Set legal/privacy policy and terms language.
2. Define role matrix (public, client, lawyer, admin, super-admin).
3. Implement consultation intake + consultation tracking.
4. Implement report intake + moderation workflow.
5. Implement community posts/comments + moderation queue.
6. Implement account deletion pipeline + confirmation.
7. Hardening pass for rules, logging, and alerts.
8. Final QA of branching deployment and staging/prod parity.

---

## 7) Translation of your request (plain-language)

BEE COOP should be a professional, lawyer-owned platform where people can ask for legal help, report harmful business behavior or crimes, and engage in a safe community space. Users need control over their accounts and message history, including deletion where appropriate. The platform should be secure, auditable, and ready for real-world legal operations while staying simple to use.
