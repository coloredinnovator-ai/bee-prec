# BEE COOP

Client repository for the BEE COOP static Firebase website.

## Local Development

- Static site assets live under `public/`
- Firebase configuration lives in `firebase.json`, `.firebaserc`, `firestore.rules`, and `storage.rules`
- There is no Next.js or npm application toolchain in this repo anymore
- Edit HTML, CSS, and browser JavaScript directly in `public/`

## Deployment Targets

- Firebase project: `nanny-tech`
- Production hosting target: `bee-prec-site`
- Staging hosting target: `bee-prec-site-staging`
- Default branch: `main`

## Release Model

GitHub Actions is the deployment path for the static website.

1. Push to `main` deploys production.
2. Push to `MAROON-staging` deploys staging.
3. `workflow_dispatch` can be used for controlled manual deploys.
4. `.github/workflows/firebase-hosting-merge.yml` deploys Firebase Hosting plus Firestore and Storage rules.

## CI and Operations Assets

- Health checks: `.github/workflows/bee-prec-smoke-tests.yml`
- Security scanning: CodeQL, Semgrep, ZAP, hardening, and red-team workflows in `.github/workflows/`
- Firebase bootstrap and deployment helpers in `scripts/`
- Product and data documentation in `docs/`

## Required Repository Settings

- `FIREBASE_SERVICE_ACCOUNT_NANNY_TECH` (Firebase service account JSON for project `nanny-tech`)

## GCP / Operations Bootstrap

For production operations observability in GCP:

```bash
./scripts/bootstrap_gcp_observability.sh nanny-tech bee-prec-site.web.app production [notification_channel_id]
```

- `notification_channel_id` is optional, but recommended for paging or email/Webhook alerts.
- If omitted, the script will create the uptime check and skip policy notification wiring.

## Key Paths

- `public/`
- `scripts/`
- `docs/`
