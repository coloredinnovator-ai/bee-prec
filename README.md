# BEE COOP

Client website repository for the BEE COOP platform. The current codebase is a Next.js 15 app backed by Firebase and GCP deployment automation.

## Local development

- Prerequisites: Node.js
- Install dependencies: `npm install`
- Start the app: `npm run dev`
- Environment template: `.env.example`
- App routes live under `app/`, shared UI under `components/`, and Firebase helpers under `lib/`

## Deployment targets

- Firebase project: `nanny-tech`
- Production hosting target: `bee-prec-site`
- Staging hosting target: `bee-prec-site-staging`
- Default branch: `main`

## Release model

GitHub Actions is the primary deployment path.

1. Push to `main` deploys production.
2. Push to `MAROON-staging` deploys staging.
3. `workflow_dispatch` can be used for controlled manual deploys.
4. `.github/workflows/firebase-hosting-merge.yml` deploys:
   - Firebase Hosting
   - Firestore rules
   - Storage rules

## CI and operations assets

- Health checks: `.github/workflows/bee-prec-smoke-tests.yml`
- Security scanning: CodeQL, Semgrep, ZAP, hardening, and red-team workflows in `.github/workflows/`
- Firebase bootstrap and deployment helpers in `scripts/`
- Product and data documentation in `docs/`

## Required repository settings

- `FIREBASE_SERVICE_ACCOUNT_NANNY_TECH` (Firebase service account JSON for project `nanny-tech`)

## GCP / Operations bootstrap

For production operations observability in GCP:

```bash
./scripts/bootstrap_gcp_observability.sh nanny-tech bee-prec-site.web.app production [notification_channel_id]
```

- `notification_channel_id` is optional, but recommended for paging or email/Webhook alerts.
- If omitted, the script will create the uptime check and skip policy notification wiring.

## Key paths

- `app/`
- `components/`
- `lib/`
- `public/`
- `scripts/`
- `docs/`
