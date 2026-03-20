#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${1:-nanny-tech}"
PUBLIC_DIR="${2:-public}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "Usage: $0 [project_id] [public_dir]"
  echo "Example: $0 nanny-tech public"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_SCRIPT="${SCRIPT_DIR}/deploy_bee_prec_gcp.sh"

if [[ ! -x "${DEPLOY_SCRIPT}" ]]; then
  echo "Error: deploy script not found or not executable at ${DEPLOY_SCRIPT}"
  exit 1
fi

if [[ ! -d "${SCRIPT_DIR}/../${PUBLIC_DIR}" ]]; then
  echo "Error: public directory '${PUBLIC_DIR}' not found."
  echo "Run from repo root or pass a relative path under the repo root."
  exit 1
fi

echo "Deploying BEE COOP production..."
DEPLOY_RULES=1 "${DEPLOY_SCRIPT}" "${PROJECT_ID}" "bee-prec-site" "${PUBLIC_DIR}"

echo "Deploying BEE COOP staging..."
DEPLOY_RULES=0 "${DEPLOY_SCRIPT}" "${PROJECT_ID}" "bee-prec-site-staging" "${PUBLIC_DIR}"

echo "Deployment complete for project ${PROJECT_ID}."
