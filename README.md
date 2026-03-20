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
3. `workflow_dispatch` can be used for controlled manual deploys, but only from `main` or `MAROON-staging`.
4. `.github/workflows/firebase-hosting-merge.yml` deploys:
   - Firestore rules
   - Storage rules
   - Firebase Hosting
5. The Next.js app is still part of the repo, but its runtime is not the current Firebase Hosting output.
6. Treat the static Firebase site as the live public/member intake surface until a separate written cutover moves traffic to the Next.js runtime.
7. Do not assume `app/` changes are live in production unless the release path is explicitly changed in GitHub workflows and deployment docs.
8. `./scripts/deploy_bee_prec_gcp.sh` follows the same contract locally: it deploys shared rules before Hosting and enforces branch-to-environment alignment unless `ALLOW_BRANCH_BYPASS=1` is explicitly set.
9. `./scripts/deploy_bee_prec_all_gcp.sh` is an emergency-only escape hatch and is disabled by default unless `ALLOW_MULTI_ENV_DEPLOY=1` is explicitly set.

## Staging parity

- `MAROON-staging` is the only normal branch that may deploy the staging Hosting target `bee-prec-site-staging`.
- Staging is expected to validate the same static runtime contract as production: the same `public/` surface, the same shared Firestore/Storage rules, and the same Firebase project wiring shape, only against the staging Hosting target.
- Scheduled smoke coverage for both production and staging lives in `.github/workflows/bee-prec-smoke-tests.yml`. Cross-environment parity and deeper security/runtime checks live in `.github/workflows/hardening.yml`.
- If staging intentionally diverges from production behavior, that divergence must be documented here and in the workflow or script contract in the same change.

## Runtime ownership

- Public intake, clinic signup, newsletter capture, and static moderation widgets live under `public/`.
- Authenticated member editing, operator queues, legal tools, and attorney dashboards live under `app/`.
- If a workflow is moved between surfaces, update both this README and the Firebase/GitHub deploy contract in the same change.

## Operator surface contract

- Treat `app/admin` as the canonical admin and board operator surface in the Next.js runtime.
- Treat `app/attorneys/profile` as the canonical attorney consultation and service-catalog surface in the Next.js runtime.
- Some moderation widgets still exist in `public/` because that static Hosting surface remains the live deploy target. Those widgets do not create a separate release contract; they are legacy runtime behavior until a written cutover or removal lands.
- Do not describe a Next.js operator path as "live" unless the corresponding deploy path, smoke coverage, and README contract are updated in the same change.

## Post-release branch contract

- A successful production deploy from `main` does not, by itself, update staging. `MAROON-staging` must still be kept deployable under the same release contract before the next staging run.
- If a production fix changes Hosting behavior, shared rules, or deploy scripts, mirror that fix into `MAROON-staging` before treating staging as a valid rehearsal lane again.
- Do not use emergency bypass flags such as `ALLOW_BRANCH_BYPASS=1` or `ALLOW_MULTI_ENV_DEPLOY=1` as substitutes for normal branch parity.

## CI and operations assets

- Health checks: `.github/workflows/bee-prec-smoke-tests.yml`
- Security scanning: CodeQL, Semgrep, ZAP, hardening, and red-team workflows in `.github/workflows/`
- Firebase bootstrap and deployment helpers in `scripts/`
- Product and data documentation in `docs/`
- Use `npm run validate:app` to validate the Next.js app locally.
- `.github/workflows/nextjs-app-validation.yml` is CI-only for the Next.js surface; it does not publish the live Firebase site.

## Required repository settings

- `FIREBASE_SERVICE_ACCOUNT_NANNY_TECH` (Firebase service account JSON for project `nanny-tech`)
- The GitHub service account used by `FIREBASE_SERVICE_ACCOUNT_NANNY_TECH` must also have `roles/serviceusage.serviceUsageConsumer` so rules deploys can use already-enabled Firebase APIs during release.

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
