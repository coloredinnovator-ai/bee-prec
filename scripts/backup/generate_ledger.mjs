import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { Storage } from "@google-cloud/storage";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const outputDir = join(process.cwd(), "artifacts", "backup-ledger");

function mustEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID ?? "nanny-tech";
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey
      }),
      projectId
    });
  }

  return initializeApp({ projectId });
}

async function getLatestObject(bucketName, prefix) {
  const storage = new Storage();
  const [files] = await storage.bucket(bucketName).getFiles({ prefix });

  if (files.length === 0) {
    return null;
  }

  const latest = [...files].sort((left, right) => {
    const leftUpdated = new Date(left.metadata.updated ?? 0).getTime();
    const rightUpdated = new Date(right.metadata.updated ?? 0).getTime();
    return rightUpdated - leftUpdated;
  })[0];

  return {
    name: latest.name,
    updated: latest.metadata.updated ?? null,
    size: latest.metadata.size ?? null
  };
}

async function main() {
  const firestoreBackupBucket = mustEnv("FIRESTORE_BACKUP_BUCKET");
  const firestoreBackupPrefix = process.env.FIRESTORE_BACKUP_PREFIX ?? "firestore";
  const storageBackupBucket = mustEnv("STORAGE_BACKUP_BUCKET");
  const storageInventoryPrefix = process.env.STORAGE_INVENTORY_PREFIX ?? "inventory";
  const backupCollection = process.env.BACKUP_LEDGER_COLLECTION ?? "backupRuns";

  const [latestFirestore, latestStorage] = await Promise.all([
    getLatestObject(firestoreBackupBucket, firestoreBackupPrefix),
    getLatestObject(storageBackupBucket, storageInventoryPrefix)
  ]);

  const status = latestFirestore && latestStorage ? "healthy" : "degraded";
  const summary = status === "healthy" ? "Firestore export and storage backup metadata found." : "One or more backup artifacts missing.";
  const ledger = {
    generatedAt: new Date().toISOString(),
    status,
    summary,
    firestore: {
      bucket: firestoreBackupBucket,
      prefix: firestoreBackupPrefix,
      latestObject: latestFirestore
    },
    storage: {
      bucket: storageBackupBucket,
      prefix: storageInventoryPrefix,
      latestObject: latestStorage
    }
  };

  const markdown = `# Backup Ledger

- Generated at: ${ledger.generatedAt}
- Status: ${ledger.status}
- Summary: ${ledger.summary}
- Firestore bucket: ${firestoreBackupBucket}
- Firestore latest object: ${latestFirestore?.name ?? "missing"}
- Storage bucket: ${storageBackupBucket}
- Storage latest object: ${latestStorage?.name ?? "missing"}
`;

  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, "backup-ledger.json"), JSON.stringify(ledger, null, 2));
  await writeFile(join(outputDir, "backup-ledger.md"), markdown);

  try {
    const app = getAdminApp();
    const db = getFirestore(app);
    await db.collection(backupCollection).add({
      status,
      summary,
      firestoreBucket: firestoreBackupBucket,
      firestoreObject: latestFirestore?.name ?? null,
      storageBucket: storageBackupBucket,
      storageObject: latestStorage?.name ?? null,
      createdAt: FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.warn("Unable to persist backup ledger to Firestore:", error);
  }

  console.log(markdown);

  if (status !== "healthy") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
