#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${1:-nanny-tech}"
FLUTTER_PROJECT_PATH="${2:-}"
ANDROID_PACKAGE="${3:-com.beeprec.client}"
IOS_BUNDLE_ID="${4:-com.beeprec.client}"

if [[ -z "${FLUTTER_PROJECT_PATH}" ]]; then
  echo "Usage: $0 <PROJECT_ID> <FLUTTER_PROJECT_PATH> [android_package] [ios_bundle_id]"
  echo "Example: $0 nanny-tech ./my_flutter_app com.beeprec.client com.beeprec.client"
  exit 1
fi

if ! command -v flutterfire >/dev/null 2>&1; then
  echo "Installing flutterfire_cli..."
  dart pub global activate flutterfire_cli
fi

export PATH="$HOME/.pub-cache/bin:$PATH"

if ! command -v flutter >/dev/null 2>&1; then
  echo "Error: flutter command not found in PATH."
  exit 1
fi

if [ ! -f "${FLUTTER_PROJECT_PATH}/pubspec.yaml" ]; then
  echo "Error: pubspec.yaml not found in ${FLUTTER_PROJECT_PATH}"
  echo "Hint: pass a valid Flutter project root."
  exit 1
fi

cd "${FLUTTER_PROJECT_PATH}"

flutterfire configure \
  --project "${PROJECT_ID}" \
  --platforms web,android,ios \
  --android-package-name "${ANDROID_PACKAGE}" \
  --ios-bundle-id "${IOS_BUNDLE_ID}" \
  --out "lib/firebase_options.dart"

echo "Firebase wiring complete."
echo "Commit generated file(s) in your Flutter project:"
echo " - lib/firebase_options.dart"
