#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${1:-nanny-tech}"
HOST="${2:-bee-prec-site.web.app}"
ENVIRONMENT="${3:-production}"
NOTIFICATION_CHANNEL="${4:-}"
CHECK_DISPLAY_NAME="${5:-BEE COOP ${ENVIRONMENT} uptime}"
POLICY_DISPLAY_NAME="${6:-BEE COOP ${ENVIRONMENT} availability}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "Usage: $0 <project_id> [host] [environment] [notification_channel] [check_display_name] [policy_display_name]"
  exit 1
fi

echo "Bootstrapping GCP monitoring for ${HOST} in ${PROJECT_ID} (${ENVIRONMENT})"
command -v gcloud >/dev/null 2>&1 || { echo "gcloud CLI is required." >&2; exit 1; }

gcloud config set project "${PROJECT_ID}" >/dev/null
gcloud services enable monitoring.googleapis.com logging.googleapis.com

UPTIME_CHECK_NAME="$(gcloud monitoring uptime list-configs --project="${PROJECT_ID}" \
  --filter="displayName=${CHECK_DISPLAY_NAME}" \
  --format='value(name)' | head -n 1)"

if [[ -z "${UPTIME_CHECK_NAME}" ]]; then
  echo "Creating uptime check: ${CHECK_DISPLAY_NAME}"
  gcloud monitoring uptime create "${CHECK_DISPLAY_NAME}" \
    --project="${PROJECT_ID}" \
    --resource-type=uptime-url \
    --resource-labels=project_id="${PROJECT_ID}",host="${HOST}" \
    --path="/" \
    --protocol=https \
    --status-codes=200 \
    --period=5 \
    --timeout=10 \
    --user-labels=service=bee-coop,environment="${ENVIRONMENT}"
else
  echo "Uptime check already exists: ${UPTIME_CHECK_NAME}"
fi

POLICY_NAME="$(gcloud alpha monitoring policies list --project="${PROJECT_ID}" \
  --filter="display_name=\"${POLICY_DISPLAY_NAME}\"" \
  --format='value(name)' | head -n 1)"

if [[ -n "${NOTIFICATION_CHANNEL}" && -z "${POLICY_NAME}" ]]; then
  echo "Creating alert policy: ${POLICY_DISPLAY_NAME}"
  gcloud alpha monitoring policies create \
    --project="${PROJECT_ID}" \
    --display-name="${POLICY_DISPLAY_NAME}" \
    --combiner=OR \
    --documentation-format=text/markdown \
    --documentation="BEE COOP ${ENVIRONMENT} endpoint (${HOST}) failed the scheduled uptime check." \
    --condition-display-name="BEE COOP ${ENVIRONMENT} uptime failed" \
    --condition-filter="metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\" AND resource.type=\"uptime_url\" AND resource.label.host=\"${HOST}\"" \
    --duration=300s \
    --if="< 1" \
    --trigger-count=1 \
    --notification-channels="${NOTIFICATION_CHANNEL}"
elif [[ -z "${NOTIFICATION_CHANNEL}" ]]; then
  echo "Skipping alert policy creation because no notification channel was provided."
  echo "Create a notification channel in Cloud Monitoring and rerun with:"
  echo "  ./scripts/bootstrap_gcp_observability.sh ${PROJECT_ID} ${HOST} ${ENVIRONMENT} <notification_channel_id>"
else
  echo "Alert policy already exists: ${POLICY_NAME}"
fi

echo "Monitoring bootstrap complete."
