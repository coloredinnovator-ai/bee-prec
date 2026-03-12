/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

const functions = require("@google-cloud/functions-framework");
const { google } = require("googleapis");

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function buildOutputUriPrefix(bucket, prefix) {
  const safePrefix = prefix.replace(/^\/+|\/+$/g, "");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return `gs://${bucket}/${safePrefix}/${timestamp}`;
}

async function runExport() {
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.PROJECT_ID;

  if (!projectId) {
    throw new Error("Missing Google Cloud project ID in runtime environment.");
  }

  const backupBucket = getRequiredEnv("BACKUP_BUCKET");
  const backupPrefix = process.env.BACKUP_PREFIX || "firestore";
  const databaseId = process.env.FIRESTORE_DATABASE || "(default)";
  const outputUriPrefix = buildOutputUriPrefix(backupBucket, backupPrefix);

  const auth = await google.auth.getClient({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"]
  });
  const firestore = google.firestore({ version: "v1", auth });

  const response = await firestore.projects.databases.exportDocuments({
    name: `projects/${projectId}/databases/${databaseId}`,
    requestBody: {
      outputUriPrefix
    }
  });

  console.log(
    JSON.stringify({
      projectId,
      databaseId,
      outputUriPrefix,
      operation: response.data.name || null
    })
  );

  return response.data;
}

exports.exportFirestore = async () => {
  return runExport();
};

async function exportFirestoreHttp(_req, res) {
  try {
    const result = await runExport();
    res.status(200).json({
      ok: true,
      operation: result.name || null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Firestore export failed."
    });
  }
}

async function exportFirestorePubSub(cloudEvent) {
  void cloudEvent;
  await runExport();
}

functions.http("exportFirestoreHttp", exportFirestoreHttp);
functions.cloudEvent("exportFirestorePubSub", exportFirestorePubSub);

exports.exportFirestoreHttp = exportFirestoreHttp;
exports.exportFirestorePubSub = exportFirestorePubSub;
