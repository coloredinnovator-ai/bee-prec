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
  - Firebase Web app created in project `nanny-tech` (App ID: `1:269966152674:web:f6c19b36ddf1eba2b75fbb`)
  - Firebase Android app created in project `nanny-tech` (App ID: `1:269966152674:android:f366c86ce40d9937b75fbb`, package: `com.beeprec.client`)
- Firebase iOS app created in project `nanny-tech` (App ID: `1:269966152674:ios:7d11719b9131a4ebb75fbb`, bundle ID: `com.beeprec.client`)
- Deployment config: `.github/workflows/firebase-hosting-merge.yml`
- Firebase project/link map: `.firebaserc`, `firebase.json`
- Flutter project scaffold (created): `bee-prec-app`

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
- Firebase apps for Bee-Prec in project `nanny-tech`:
  - Web App ID: `1:269966152674:web:f6c19b36ddf1eba2b75fbb`
  - Android App ID: `1:269966152674:android:f366c86ce40d9937b75fbb`
  - iOS App ID: `1:269966152674:ios:7d11719b9131a4ebb75fbb`
- In a Flutter project, wire Firebase with:
  - `dart pub global activate flutterfire_cli`
  - `flutterfire configure --project nanny-tech --platforms web,android,ios`
  - if your mobile package/bundle IDs differ, use:
    - `flutterfire configure --project nanny-tech --platforms android --android-package-name <your.android.package.id>`
    - `flutterfire configure --project nanny-tech --platforms ios --ios-bundle-id <your.ios.bundle.id>`
- Fast start:
  - `./scripts/bootstrap_flutter_firebase.sh nanny-tech /path/to/flutter/app com.beeprec.client com.beeprec.client`
- Current Flutter starter bootstrap is already done for `bee-prec-app`:
  - `cd bee-prec-app`
  - `flutter pub get`
  - `flutter run -d chrome`
- iOS configure note:
  - Full iOS Firebase sync with `flutterfire` requires `xcodeproj` on macOS Ruby path.
  - If missing, install `xcodeproj` or run iOS steps from a standard Apple development machine.
