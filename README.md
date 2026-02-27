# Bee-Prec

Client website repository for Bee-Prec.

## Project scope
- App: Bee-Prec community/legal co-op platform
- Firebase project: `nanny-tech`
- Hosting targets:
  - production: `bee-prec-site`
  - staging: `bee-prec-site-staging`
- Repository branch: `main`

## Repo layout
- Public app: `public/index.html`, `public/app.js`, `public/styles.css`
- Firebase security config:
  - `firestore.rules`
  - `storage.rules`
- Deployment config: `.github/workflows/firebase-hosting-merge.yml`
- Firebase project/link map: `.firebaserc`, `firebase.json`

## Deployment model (remote-first, no local publish required)
1. All publishing is handled by GitHub-hosted CI (`.github/workflows/firebase-hosting-merge.yml`) and deploys directly to Firebase Hosting.
2. Push to `main` to deploy production (`bee-prec-site`).
3. Push to `MAROON-staging` to deploy staging (`bee-prec-site-staging`).
4. You can also run:
   - `workflow_dispatch` in GitHub Actions (branch selector: `main` or `MAROON-staging`) to deploy without local CLI access.

## Optional local helpers
- Local-only helper scripts are kept for debugging or manual recovery:
  - `./scripts/bootstrap_web_firebase.sh`
  - `./scripts/deploy_bee_prec_gcp.sh`
  - `./scripts/deploy_bee_prec_all_gcp.sh`
4. GitHub branch checks
   - `git status --short --branch`
   - `git log --oneline -n 3`

## One-time required action (if not yet done)
- Firebase Storage must be initialized for `nanny-tech` before initial Storage deploy.
- Open: https://console.firebase.google.com/project/nanny-tech/storage
- Click **Get Started**

## After Storage is initialized
Run:
- `firebase deploy --project nanny-tech --only storage --non-interactive`

## GitHub + CI
- Workflow: `.github/workflows/firebase-hosting-merge.yml`
- It deploys hosting for main and staging targets on push and on manual `workflow_dispatch`.
- Confirm latest GH run:
  - `gh run list -R coloredinnovator-ai/bee-prec --workflow="Deploy to Firebase Hosting" --limit 3`

## Custom domain (web production)
The default production URL is:
- https://bee-prec-site.web.app

To use your own domain, add it in Firebase Console:
- Open: https://console.firebase.google.com/project/nanny-tech/hosting/sites/bee-prec-site
- Add custom domain and follow DNS TXT/CNAME steps.

If you are managing DNS in Google Cloud:
- Create/verify a DNS zone for your domain.
- Add the verification TXT and CNAME records from Firebase.
- Keep SSL/TLS in Firebase-managed mode (default).

## Static web deployment helpers
- Bootstrap check:
  - `./scripts/bootstrap_web_firebase.sh nanny-tech bee-prec-site public`
- Deploy:
  - `./scripts/deploy_bee_prec_gcp.sh nanny-tech bee-prec-site public`
