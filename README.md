# BEE COOP

Client repository for the BEE COOP platform. This repo currently contains two surfaces:

- `public/`: the static Firebase Hosting site that is currently deployed and serves as the live public intake/runtime
- `app/`: a Next.js 15 member and operator portal that is validated in CI but is not the current Hosting deploy target

The Next.js app and the static site share the same repo, but they are not the same deploy target. The Firebase workflows in this repo currently publish the `public/` site, while the Next app is validated locally and in CI. Treat `public/` as the production public surface until a written cutover changes the workflows. Treat `app/` as the authenticated member and operator surface under active completion.

## Local development

- Prerequisites: Node.js
- Install dependencies: `npm install`
- Start the Next app: `npm run dev`
- Validate the Next app: `npm run validate:app`
- Environment template: `.env.example`
- Next app routes live under `app/`, shared UI under `components/`, and Firebase helpers under `lib/`
- Static Firebase Hosting assets live under `public/`

## Deployment targets

- Firebase project: `nanny-tech`
- Production hosting target: `bee-prec-site`
- Staging hosting target: `bee-prec-site-staging`
- Default branch: `main`

## Release model

GitHub Actions is the primary deployment path for the static site.

1. Push to `main` deploys production.
2. Push to `MAROON-staging` deploys staging.
3. `workflow_dispatch` can be used for controlled manual deploys.
4. `.github/workflows/firebase-hosting-merge.yml` deploys:
   - Firebase Hosting
   - Firestore rules
   - Storage rules
5. The Next.js app is still part of the repo, but its runtime is not the current Firebase Hosting output.
6. Treat the static Firebase site as the live public/member intake surface until a separate written cutover moves traffic to the Next.js runtime.
7. Do not assume `app/` changes are live in production unless the release path is explicitly changed in GitHub workflows and deployment docs.

## Runtime ownership

- Public intake, clinic signup, newsletter capture, and static moderation widgets live under `public/`.
- Authenticated member editing, operator queues, legal tools, and attorney dashboards live under `app/`.
- If a workflow is moved between surfaces, update both this README and the Firebase/GitHub deploy contract in the same change.

## CI and operations assets

- Health checks: `.github/workflows/bee-prec-smoke-tests.yml`
- Security scanning: CodeQL, Semgrep, ZAP, hardening, and red-team workflows in `.github/workflows/`
- Firebase bootstrap and deployment helpers in `scripts/`
- Product and data documentation in `docs/`
- Use `npm run validate:app` to validate the Next.js app locally.

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
