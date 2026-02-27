# Bee-Prec

Client website repository for Bee-Prec.

## Project scope

- App: Bee-Prec community/legal co-op platform
- Firebase project: `nanny-tech`
- Hosting targets:
  - production: `bee-prec-site`
  - staging: `bee-prec-site-staging`
- Repository default branch: `main`

## Deployment model (remote-first)

Nothing is published locally for routine releases. GitHub Actions is the single deployment path.

1. Push to `main` deploys production (`bee-prec-site`).
2. Push to `MAROON-staging` deploys staging (`bee-prec-site-staging`).
3. `workflow_dispatch` in GitHub Actions can also trigger deploy by selecting:
   - `main` (production)
   - `MAROON-staging` (staging)
4. Deploy flow is strict and centralized in `.github/workflows/firebase-hosting-merge.yml`:
   - Firebase Hosting
   - Firestore rules
   - Storage rules
   - Rules deployment command:
     `npx firebase-tools deploy --project nanny-tech --only firestore:rules,storage --non-interactive`

5. Staging and production jobs run independently by branch and both now enforce rules deployment instead of tolerant/fallback behavior.

## Status (2026-02-27, UTC)

- `main` push workflow run `22504968481`: success (`deploy-main`).
- `MAROON-staging` manual dispatch run `22505025938`: success (`deploy-staging`).
- CI is fully remote (GCP-hosted runners only); local run/test execution is not part of release path.

## GitHub Actions

- Deploy pipeline: `.github/workflows/firebase-hosting-merge.yml`
  - Produces production/staging hosting deployments.
  - Pushes Firestore and Storage security rules on deploy.
  - Uses `FIREBASE_SERVICE_ACCOUNT_NANNY_TECH` secret in GitHub repository settings.

- Health checks pipeline: `.github/workflows/bee-prec-smoke-tests.yml`
  - Scheduled every 30 minutes
  - Validates site reachability and basic content marker
  - Supports manual dispatch

## Required repository settings

Repository Secret:

- `FIREBASE_SERVICE_ACCOUNT_NANNY_TECH` (Firebase service account JSON for project `nanny-tech`)

Branch protections (recommended):

- Require review on `main`
- Require status checks from deploy workflow before merge

## GCP / Operations bootstrap

For production operations observability in GCP:

```bash
./scripts/bootstrap_gcp_observability.sh nanny-tech bee-prec-site.web.app production [notification_channel_id]
```

- `notification_channel_id` is optional, but recommended for paging or email/Webhook alerts.
- If omitted, the script will create the uptime check and skip policy notification wiring.

## Custom domain

Current production Firebase URL:

- https://bee-prec-site.web.app

To use your own domain:

1. Open Firebase Hosting for `bee-prec-site`
2. Add and verify your domain
3. Add DNS TXT/CNAME records from Firebase

## Helpful checks

```bash
git status --short --branch
git log --oneline -n 3
```

## Local scripts (for controlled manual recovery only)

- `./scripts/deploy_bee_prec_gcp.sh`
- `./scripts/deploy_bee_prec_all_gcp.sh`
- `./scripts/bootstrap_web_firebase.sh`
- `./scripts/bootstrap_gcp_observability.sh`
