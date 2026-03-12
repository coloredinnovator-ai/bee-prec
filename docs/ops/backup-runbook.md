# Backup Runbook

## Goals

- Firestore exports land in a dedicated backup bucket.
- Storage objects are protected with soft delete and mirrored into a restricted backup location.
- GitHub Actions produce a nightly ledger artifact and a Firestore `backupRuns` record.

## Required GCP setup

1. Create or designate a Firestore backup bucket.
2. Enable scheduled exports using the official Firestore export pattern.
3. Enable soft delete on the primary Storage bucket.
4. Enable inventory reports for the primary Storage bucket.
5. Configure bucket-to-bucket replication or scheduled copy into a restricted backup bucket.
6. Set the GitHub secrets listed in [`env-inventory.md`](/Users/user1/Desktop/BEE-PREC/docs/ops/env-inventory.md).

## GitHub workflow

- Workflow: [`backup-ledger.yml`](/Users/user1/Desktop/BEE-PREC/.github/workflows/backup-ledger.yml)
- Script: [`scripts/backup/generate_ledger.mjs`](/Users/user1/Desktop/BEE-PREC/scripts/backup/generate_ledger.mjs)

## Output

- `artifacts/backup-ledger/backup-ledger.json`
- `artifacts/backup-ledger/backup-ledger.md`
- Firestore `backupRuns` document if Admin access is available

## Failure response

1. Inspect the workflow summary and artifact.
2. Confirm the latest export prefix and inventory prefix are still writing objects.
3. Rotate the GitHub service account secret if authentication failed.
4. Record remediation in GitHub before re-running the workflow.
