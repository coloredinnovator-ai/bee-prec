#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${1:-nanny-tech}"
HOSTING_TARGET="${2:-bee-prec-site}"
PUBLIC_DIR="${3:-public}"
DEPLOY_RULES="${DEPLOY_RULES:-1}"
ALLOW_BRANCH_BYPASS="${ALLOW_BRANCH_BYPASS:-0}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CANONICAL_PUBLIC_DIR="${REPO_ROOT}/public"

case "${HOSTING_TARGET}" in
  bee-prec-site)
    EXPECTED_BRANCH="main"
    ENVIRONMENT_NAME="production"
    ;;
  bee-prec-site-staging)
    EXPECTED_BRANCH="MAROON-staging"
    ENVIRONMENT_NAME="staging"
    ;;
  *)
    EXPECTED_BRANCH=""
    ENVIRONMENT_NAME=""
    ;;
esac

if [[ -z "${PROJECT_ID}" ]]; then
  echo "Usage: $0 <PROJECT_ID> [hosting_target] [public]"
  echo "Example: $0 nanny-tech bee-prec-site public"
  exit 1
fi

if [[ "${HOSTING_TARGET}" != "bee-prec-site" && "${HOSTING_TARGET}" != "bee-prec-site-staging" ]]; then
  echo "Usage: $0 <PROJECT_ID> [hosting_target] [public]"
  echo "Error: hosting target must be 'bee-prec-site' or 'bee-prec-site-staging'."
  exit 1
fi

if [[ "${PUBLIC_DIR}" = /* ]]; then
  PUBLIC_DIR_PATH="${PUBLIC_DIR}"
else
  PUBLIC_DIR_PATH="${REPO_ROOT}/${PUBLIC_DIR}"
fi

if [[ ! -d "${PUBLIC_DIR_PATH}" ]]; then
  echo "Error: ${PUBLIC_DIR} directory not found."
  exit 1
fi

PUBLIC_DIR_PATH="$(cd "${PUBLIC_DIR_PATH}" && pwd)"
CANONICAL_PUBLIC_DIR="$(cd "${CANONICAL_PUBLIC_DIR}" && pwd)"

if [[ "${PUBLIC_DIR_PATH}" != "${CANONICAL_PUBLIC_DIR}" ]]; then
  echo "Error: Firebase Hosting is wired to the repo-root public directory via firebase.json."
  echo "Pass 'public' (or the absolute path to ${CANONICAL_PUBLIC_DIR}) to validate the actual deployed bundle."
  exit 1
fi

if [[ ! -x "$(command -v firebase)" ]]; then
  echo "Error: firebase CLI command not found in PATH."
  exit 1
fi

if [[ ! -f "${PUBLIC_DIR_PATH}/index.html" ]]; then
  echo "Error: expected index.html in ${PUBLIC_DIR}."
  exit 1
fi

if [[ ! -f "${PUBLIC_DIR_PATH}/site.js" ]]; then
  echo "Error: expected site.js in ${PUBLIC_DIR}."
  exit 1
fi

cd "${REPO_ROOT}"

if [[ ! -f firebase.json || ! -f .firebaserc ]]; then
  echo "Error: firebase.json and .firebaserc must exist at the repo root."
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
if [[ "${ALLOW_BRANCH_BYPASS}" != "1" && -n "${CURRENT_BRANCH}" && "${CURRENT_BRANCH}" != "${EXPECTED_BRANCH}" ]]; then
  echo "Error: target '${HOSTING_TARGET}' must be deployed from branch '${EXPECTED_BRANCH}', but current branch is '${CURRENT_BRANCH}'."
  echo "Use ALLOW_BRANCH_BYPASS=1 only for an emergency override."
  exit 1
fi

if [[ "${DEPLOY_RULES}" == "1" ]]; then
  if [[ ! -f firestore.rules || ! -f storage.rules ]]; then
    echo "Error: firestore.rules and storage.rules must exist at the repo root when DEPLOY_RULES=1."
    exit 1
  fi
  echo "Deploying shared Firestore and Storage rules for ${ENVIRONMENT_NAME} in project '${PROJECT_ID}'."
  firebase deploy \
    --project "${PROJECT_ID}" \
    --only "firestore:rules,storage" \
    --non-interactive
fi

echo "Deploying BEE COOP ${ENVIRONMENT_NAME} web to hosting target '${HOSTING_TARGET}' in project '${PROJECT_ID}'."
firebase deploy \
  --project "${PROJECT_ID}" \
  --only "hosting:${HOSTING_TARGET}" \
  --non-interactive
