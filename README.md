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
- Firebase Flutter entrypoint:
  - Flutter Web app created in project `nanny-tech` (App ID: `1:269966152674:web:f6c19b36ddf1eba2b75fbb`)
- Deployment config: `.github/workflows/firebase-hosting-merge.yml`
- Firebase project/link map: `.firebaserc`, `firebase.json`

## Terminal setup (Yolo runbook)
1. Authenticate
   - `gcloud auth login`
   - `firebase login`
2. Verify project context
   - `gcloud config set project nanny-tech`
   - `firebase use nanny-tech`
3. Deploy everything from this folder (`/Users/user1/Desktop/BEE-PREC`)
   - `cd /Users/user1/Desktop/BEE-PREC`
   - `firebase deploy --project nanny-tech --non-interactive --only hosting:bee-prec-site,hosting:bee-prec-site-staging,firestore,storage`
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
- It deploys hosting for main and staging targets on push.
- Confirm latest GH run:
  - `gh run list -R coloredinnovator-ai/bee-prec --workflow="Deploy to Firebase Hosting" --limit 3`

## Flutter + Firebase
- Firebase Web app for Flutter was created in `nanny-tech`:
  - App ID: `1:269966152674:web:f6c19b36ddf1eba2b75fbb`
- In a Flutter project, wire Firebase with:
  - `dart pub global activate flutterfire_cli`
  - `flutterfire configure --project nanny-tech --android-package-name <com.yourcompany.bee_prec>`
  - optionally scope to web only: `flutterfire configure --project nanny-tech --platforms web`
- If needed for a new Android/iOS app, use:
  - `firebase apps:create ANDROID "Bee-Prec Flutter Android" --project nanny-tech --package-name <com.yourcompany.bee_prec>`
  - `firebase apps:create IOS "Bee-Prec Flutter iOS" --project nanny-tech --bundle-id <com.yourcompany.beePrec>`
