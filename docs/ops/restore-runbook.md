# Restore Runbook

## Purpose

Prove that the latest Firestore export and latest Storage backup metadata can be located and used for a controlled recovery.

## Workflow

- Workflow: [`restore-drill.yml`](/Users/user1/Desktop/BEE-PREC/.github/workflows/restore-drill.yml)
- Script: [`scripts/backup/restore_drill.mjs`](/Users/user1/Desktop/BEE-PREC/scripts/backup/restore_drill.mjs)

## Modes

- Default mode: verification and dry-run command plan.
- Execute mode: enabled by setting `RESTORE_MODE=execute` and providing recovery project settings.

## Recovery checklist

1. Confirm the latest Firestore export object path.
2. Confirm the latest Storage inventory or backup object path.
3. Confirm `RECOVERY_PROJECT_ID` and `RECOVERY_COLLECTIONS`.
4. Run the restore drill workflow.
5. Review the uploaded artifact and Firestore `backupRuns` update.
6. If execute mode is enabled, verify the recovery project contains the imported data set.

## Known constraint

The repository now contains the drill tooling, but a live destructive-safe recovery environment still must be provisioned in GCP before execute mode is used.
