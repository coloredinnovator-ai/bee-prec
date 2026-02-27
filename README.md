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

## Terminal setup (strict web / no Flutter)
1. Authenticate
   - `gcloud auth login`
   - `firebase login`
2. Verify project context
   - `gcloud config set project nanny-tech`
   - `firebase use nanny-tech`
3. Bootstrap and deploy from this folder (`/Users/user1/Desktop/BEE-PREC`)
   - `cd /Users/user1/Desktop/BEE-PREC`
   - `./scripts/bootstrap_web_firebase.sh nanny-tech bee-prec-site public`
   - `./scripts/deploy_bee_prec_gcp.sh nanny-tech bee-prec-site public`
   - For staging: `./scripts/deploy_bee_prec_gcp.sh nanny-tech bee-prec-site-staging public`
   - Deploy both production and staging in one command:
     - `./scripts/deploy_bee_prec_all_gcp.sh nanny-tech public`
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
