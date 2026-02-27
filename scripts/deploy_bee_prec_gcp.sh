#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${1:-nanny-tech}"
FLUTTER_PROJECT_PATH="${2:-bee-prec-app}"
HOSTING_TARGET="${3:-bee-prec-site}"

if [[ ! -x "$(command -v flutter)" ]]; then
  echo "Error: flutter command not found in PATH."
  exit 1
fi

if [[ ! -x "$(command -v firebase)" ]]; then
  echo "Error: firebase CLI command not found in PATH."
  exit 1
fi

if [[ ! -f "${FLUTTER_PROJECT_PATH}/pubspec.yaml" ]]; then
  echo "Error: pubspec.yaml not found in ${FLUTTER_PROJECT_PATH}"
  exit 1
fi

cd "${FLUTTER_PROJECT_PATH}"
flutter --version
flutter pub get
flutter build web --release
cd - >/dev/null

firebase deploy \
  --project "${PROJECT_ID}" \
  --only "hosting:${HOSTING_TARGET}" \
  --non-interactive

