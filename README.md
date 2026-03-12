# BEE COOP

Route-based Next.js website for BEE COOP, deployed through Firebase App Hosting and backed by Firebase Auth, Firestore, Storage, GitHub Actions, and a GCP backup ledger.

## Architecture

- Runtime: Next.js App Router on Firebase App Hosting
- Public routes: `/`, `/clinic`, `/report-harm`, `/community`, `/library`, `/news`
- Secure routes: `/account/login`, `/account/profile`, `/admin/login`, `/admin`
- Backend: Firebase Auth for sign-in, Firestore collections for operational data, Storage for evidence uploads
- Server-side writes: public and secure form submissions land through Next route handlers using Firebase Admin

## Core collections

- `users`
- `profiles`
- `clinicSignups`
- `consultations`
- `incidentReports`
- `communityPosts`
- `communityComments`
- `newsletterSubscribers`
- `identityVerifications`
- `matchRequests`
- `deletionRequests`
- `auditEvents`
- `backupRuns`

## Local development

```bash
npm install
npm run dev
```

Recommended environment variables are listed in [`.env.example`](/Users/user1/Desktop/BEE-PREC/.env.example) and [`docs/ops/env-inventory.md`](/Users/user1/Desktop/BEE-PREC/docs/ops/env-inventory.md).

## Quality checks

```bash
npm run lint
npm run build
npm run test:unit
npm run test:e2e
```

## Deployment model

- `main`: production branch connected to Firebase App Hosting
- `MAROON-staging`: staging branch connected to Firebase App Hosting
- GitHub Actions provide release gates, route smoke tests, backup ledger generation, and restore-drill evidence
- Firestore rules, indexes, and Storage rules remain repo-managed

See:

- [`apphosting.yaml`](/Users/user1/Desktop/BEE-PREC/apphosting.yaml)
- [`apphosting.staging.yaml`](/Users/user1/Desktop/BEE-PREC/apphosting.staging.yaml)
- [`docs/ops/app-hosting-setup.md`](/Users/user1/Desktop/BEE-PREC/docs/ops/app-hosting-setup.md)

## Backup operations

- Nightly ledger workflow: [`.github/workflows/backup-ledger.yml`](/Users/user1/Desktop/BEE-PREC/.github/workflows/backup-ledger.yml)
- Monthly restore drill workflow: [`.github/workflows/restore-drill.yml`](/Users/user1/Desktop/BEE-PREC/.github/workflows/restore-drill.yml)
- Backup generation script: [`scripts/backup/generate_ledger.mjs`](/Users/user1/Desktop/BEE-PREC/scripts/backup/generate_ledger.mjs)
- Restore drill script: [`scripts/backup/restore_drill.mjs`](/Users/user1/Desktop/BEE-PREC/scripts/backup/restore_drill.mjs)

## Current constraint

The repository is now set up for the App Hosting architecture, but the live GCP / Firebase App Hosting connection, backup buckets, and recovery project still need to be configured with authenticated access in the target environment.
