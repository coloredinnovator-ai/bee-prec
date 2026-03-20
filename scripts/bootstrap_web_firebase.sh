#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${1:-nanny-tech}"
HOSTING_TARGET="${2:-bee-prec-site}"
PUBLIC_DIR="${3:-public}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

case "${HOSTING_TARGET}" in
  bee-prec-site)
    EXPECTED_BRANCH="main"
    ;;
  bee-prec-site-staging)
    EXPECTED_BRANCH="MAROON-staging"
    ;;
  *)
    EXPECTED_BRANCH="main"
    ;;
esac

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

if [[ "${PUBLIC_DIR}" = /* ]]; then
  PUBLIC_DIR_PATH="${PUBLIC_DIR}"
else
  PUBLIC_DIR_PATH="${SCRIPT_DIR}/../${PUBLIC_DIR}"
fi

if [[ ! -d "${PUBLIC_DIR_PATH}" ]]; then
  echo "Usage: $0 <PROJECT_ID> [hosting_target] [public_dir]"
  echo "Error: public directory '${PUBLIC_DIR}' not found."
  exit 1
fi

if [[ ! -f "${PUBLIC_DIR_PATH}/index.html" ]]; then
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
echo "Release branch: ${EXPECTED_BRANCH}"
echo "Public dir: ${PUBLIC_DIR}"
echo "Run: ./scripts/deploy_bee_prec_gcp.sh ${PROJECT_ID} ${HOSTING_TARGET} ${PUBLIC_DIR}"
echo "That deploy path now applies shared Firestore and Storage rules before hosting."
echo "Multi-environment deploys are disabled by default; use one branch per environment."
echo "GitHub rules deploys also require the FIREBASE_SERVICE_ACCOUNT_NANNY_TECH secret to have roles/serviceusage.serviceUsageConsumer."
