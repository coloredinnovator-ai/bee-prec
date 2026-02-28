#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${1:-nanny-tech}"
HOSTING_TARGET="${2:-bee-prec-site}"
PUBLIC_DIR="${3:-public}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "Usage: $0 <PROJECT_ID> [hosting_target] [public_dir]"
  echo "Example: $0 nanny-tech bee-prec-site public"
  exit 1
fi

if [[ -z "${HOSTING_TARGET}" ]]; then
  HOSTING_TARGET="bee-prec-site"
fi

if [[ "${HOSTING_TARGET}" != "bee-prec-site" && "${HOSTING_TARGET}" != "bee-prec-site-staging" ]]; then
  echo "Error: hosting target must be 'bee-prec-site' or 'bee-prec-site-staging'."
  exit 1
fi

if [[ ! -d "${PUBLIC_DIR}" ]]; then
  echo "Usage: $0 <PROJECT_ID> [hosting_target] [public_dir]"
  echo "Error: public directory '${PUBLIC_DIR}' not found."
  exit 1
fi

if [[ ! -f "${PUBLIC_DIR}/index.html" ]]; then
  echo "Error: ${PUBLIC_DIR}/index.html missing. Ensure the static web root exists."
  exit 1
fi

if ! command -v firebase >/dev/null 2>&1; then
  echo "Error: firebase CLI command not found in PATH."
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "Error: gcloud CLI command not found in PATH."
  exit 1
fi

gcloud config set project "${PROJECT_ID}" >/dev/null
firebase use "${PROJECT_ID}" >/dev/null

if [[ -n "${HOSTING_TARGET}" ]]; then
  firebase target:apply hosting "${HOSTING_TARGET}" "${HOSTING_TARGET}" >/dev/null 2>&1 || true
fi

echo "BEE COOP web bootstrap complete."
echo "Project: ${PROJECT_ID}"
echo "Hosting target: ${HOSTING_TARGET}"
echo "Public dir: ${PUBLIC_DIR}"
echo "Run: ./scripts/deploy_bee_prec_gcp.sh ${PROJECT_ID} ${HOSTING_TARGET} ${PUBLIC_DIR}"
