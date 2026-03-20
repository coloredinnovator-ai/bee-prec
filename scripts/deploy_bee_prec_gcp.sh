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

if [[ "${HOSTING_TARGET}" != "bee-prec-site" && "${HOSTING_TARGET}" != "bee-prec-site-staging" ]]; then
  echo "Usage: $0 <PROJECT_ID> [hosting_target] [public_dir]"
  echo "Error: hosting target must be 'bee-prec-site' or 'bee-prec-site-staging'."
  exit 1
fi

if [[ ! -d "${PUBLIC_DIR}" ]]; then
  echo "Error: ${PUBLIC_DIR} directory not found."
  exit 1
fi

if [[ ! -x "$(command -v firebase)" ]]; then
  echo "Error: firebase CLI command not found in PATH."
  exit 1
fi

if [[ ! -f "${PUBLIC_DIR}/index.html" ]]; then
  echo "Error: expected index.html in ${PUBLIC_DIR}."
  exit 1
fi

if [[ ! -f "${PUBLIC_DIR}/site.js" ]]; then
  echo "Error: expected site.js in ${PUBLIC_DIR}."
  exit 1
fi

cd "$(dirname "$0")/.."
if [[ ! -f "${PUBLIC_DIR}/index.html" ]]; then
  echo "Error: ${PUBLIC_DIR}/index.html not found at repo root."
  exit 1
fi
cd - >/dev/null

echo "Deploying BEE COOP web to hosting target '${HOSTING_TARGET}' in project '${PROJECT_ID}'."
firebase deploy \
  --project "${PROJECT_ID}" \
  --only "hosting:${HOSTING_TARGET}" \
  --non-interactive
