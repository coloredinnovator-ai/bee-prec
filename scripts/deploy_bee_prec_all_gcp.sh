#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${1:-nanny-tech}"
PUBLIC_DIR="${2:-public}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "Usage: $0 [project_id] [public]"
  echo "Example: $0 nanny-tech public"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_SCRIPT="${SCRIPT_DIR}/deploy_bee_prec_gcp.sh"
ALLOW_MULTI_ENV_DEPLOY="${ALLOW_MULTI_ENV_DEPLOY:-0}"
CANONICAL_PUBLIC_DIR="$(cd "${SCRIPT_DIR}/../public" && pwd)"

if [[ ! -x "${DEPLOY_SCRIPT}" ]]; then
  echo "Error: deploy script not found or not executable at ${DEPLOY_SCRIPT}"
  exit 1
fi

if [[ "${PUBLIC_DIR}" = /* ]]; then
  PUBLIC_DIR_PATH="${PUBLIC_DIR}"
else
  PUBLIC_DIR_PATH="${SCRIPT_DIR}/../${PUBLIC_DIR}"
fi

if [[ ! -d "${PUBLIC_DIR_PATH}" ]]; then
  echo "Error: public directory '${PUBLIC_DIR}' not found."
  echo "Pass an absolute path or a path relative to the repo root."
  exit 1
fi

PUBLIC_DIR_PATH="$(cd "${PUBLIC_DIR_PATH}" && pwd)"

if [[ "${PUBLIC_DIR_PATH}" != "${CANONICAL_PUBLIC_DIR}" ]]; then
  echo "Error: Firebase Hosting is wired to the repo-root public directory via firebase.json."
  echo "Pass 'public' (or the absolute path to ${CANONICAL_PUBLIC_DIR}) to validate and deploy the actual hosted bundle."
  exit 1
fi

if [[ "${ALLOW_MULTI_ENV_DEPLOY}" != "1" ]]; then
  echo "Error: multi-environment deploys are disabled by default because they bypass the branch-to-environment release contract."
  echo "Deploy production from main with:"
  echo "  ./scripts/deploy_bee_prec_gcp.sh ${PROJECT_ID} bee-prec-site ${PUBLIC_DIR}"
  echo "Deploy staging from MAROON-staging with:"
  echo "  ./scripts/deploy_bee_prec_gcp.sh ${PROJECT_ID} bee-prec-site-staging ${PUBLIC_DIR}"
  echo "Set ALLOW_MULTI_ENV_DEPLOY=1 only for an emergency override."
  exit 1
fi

echo "WARNING: forcing production and staging deploys from one checkout."
echo "This bypasses the normal branch/environment contract and should only be used for emergency recovery."

echo "Deploying BEE COOP production..."
ALLOW_BRANCH_BYPASS=1 DEPLOY_RULES=1 "${DEPLOY_SCRIPT}" "${PROJECT_ID}" "bee-prec-site" "${PUBLIC_DIR}"

echo "Deploying BEE COOP staging..."
ALLOW_BRANCH_BYPASS=1 DEPLOY_RULES=0 "${DEPLOY_SCRIPT}" "${PROJECT_ID}" "bee-prec-site-staging" "${PUBLIC_DIR}"

echo "Deployment complete for project ${PROJECT_ID}."
