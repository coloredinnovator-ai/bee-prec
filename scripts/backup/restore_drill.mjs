import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { Storage } from "@google-cloud/storage";

const outputDir = join(process.cwd(), "artifacts", "restore-drill");

function mustEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function getLatestObject(bucketName, prefix) {
  const storage = new Storage();
  const [files] = await storage.bucket(bucketName).getFiles({ prefix });

  if (files.length === 0) {
    return null;
  }

  return [...files].sort((left, right) => {
    const leftUpdated = new Date(left.metadata.updated ?? 0).getTime();
    const rightUpdated = new Date(right.metadata.updated ?? 0).getTime();
    return rightUpdated - leftUpdated;
  })[0];
}

async function main() {
  const mode = process.env.RESTORE_MODE ?? "dry-run";
  const firestoreBackupBucket = mustEnv("FIRESTORE_BACKUP_BUCKET");
  const firestoreBackupPrefix = process.env.FIRESTORE_BACKUP_PREFIX ?? "firestore";
  const storageBackupBucket = mustEnv("STORAGE_BACKUP_BUCKET");
  const storageInventoryPrefix = process.env.STORAGE_INVENTORY_PREFIX ?? "inventory";
  const recoveryProjectId = process.env.RECOVERY_PROJECT_ID ?? "";
  const recoveryCollections = process.env.RECOVERY_COLLECTIONS ?? "";

  const [latestFirestore, latestStorage] = await Promise.all([
    getLatestObject(firestoreBackupBucket, firestoreBackupPrefix),
    getLatestObject(storageBackupBucket, storageInventoryPrefix)
  ]);

  const summary = {
    generatedAt: new Date().toISOString(),
    mode,
    firestoreBackupBucket,
    firestoreBackupPrefix,
    latestFirestoreObject: latestFirestore?.name ?? null,
    storageBackupBucket,
    storageInventoryPrefix,
    latestStorageObject: latestStorage?.name ?? null,
    recoveryProjectId,
    recoveryCollections
  };

  const markdown = `# Restore Drill

- Generated at: ${summary.generatedAt}
- Mode: ${mode}
- Firestore export object: ${summary.latestFirestoreObject ?? "missing"}
- Storage backup object: ${summary.latestStorageObject ?? "missing"}
- Recovery project: ${recoveryProjectId || "not configured"}
- Recovery collections: ${recoveryCollections || "not configured"}

## Next commands

\`\`\`bash
gcloud firestore import "gs://${firestoreBackupBucket}/${summary.latestFirestoreObject ?? "<missing>"}" --project "${recoveryProjectId || "<set RECOVERY_PROJECT_ID>"}" --collection-ids="${recoveryCollections || "<set RECOVERY_COLLECTIONS>"}"
\`\`\`
`;

  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, "restore-drill.json"), JSON.stringify(summary, null, 2));
  await writeFile(join(outputDir, "restore-drill.md"), markdown);

  console.log(markdown);

  if (!latestFirestore || !latestStorage || !recoveryProjectId || !recoveryCollections) {
    process.exitCode = 1;
    return;
  }

  if (mode !== "execute") {
    return;
  }

  console.error("Execute mode requested. Run the printed gcloud import command in a recovery project with explicit approval.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
