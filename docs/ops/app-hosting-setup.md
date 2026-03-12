# App Hosting Setup

1. Create a Firebase App Hosting backend for `main` and connect it to the `coloredinnovator-ai/bee-prec` repository.
2. Set the production branch to `main` and apply [`apphosting.yaml`](/Users/user1/Desktop/BEE-PREC/apphosting.yaml).
3. Create a staging backend connected to `MAROON-staging` and apply [`apphosting.staging.yaml`](/Users/user1/Desktop/BEE-PREC/apphosting.staging.yaml).
4. Add the runtime and public web environment variables listed in [`env-inventory.md`](/Users/user1/Desktop/BEE-PREC/docs/ops/env-inventory.md).
5. Keep Firestore rules and indexes managed from this repo via `firebase deploy --only firestore,storage`.
6. Treat GitHub Actions as guardrails and backup evidence. App Hosting owns the actual branch-triggered rollout.

## Branch model

- `main`: production
- `MAROON-staging`: staging
- pull requests: validation only

## Required follow-up

- Enable the composite index in [`firestore.indexes.json`](/Users/user1/Desktop/BEE-PREC/firestore.indexes.json).
- Confirm the App Hosting service account has Firestore and Storage access.
- Confirm the GitHub repository secret `FIREBASE_SERVICE_ACCOUNT_NANNY_TECH` is current.
