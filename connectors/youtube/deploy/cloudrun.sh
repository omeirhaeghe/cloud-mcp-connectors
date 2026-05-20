#!/usr/bin/env bash
set -euo pipefail

# Deploy the YouTube connector to Google Cloud Run.
#
# Required env:
#   PROJECT_ID         your GCP project ID
#   YOUTUBE_API_KEY    YouTube Data API v3 key
#
# Optional env:
#   REGION             default: us-central1
#   SERVICE            default: youtube-connector
#   REPO               Artifact Registry repo, default: cloud-connectors

: "${PROJECT_ID:?Set PROJECT_ID (your GCP project ID)}"
: "${YOUTUBE_API_KEY:?Set YOUTUBE_API_KEY}"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-youtube-connector}"
REPO="${REPO:-cloud-connectors}"

cd "$(dirname "$0")/../../.."

TAG="$(git rev-parse --short HEAD 2>/dev/null || date +%s)"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/youtube:${TAG}"

gcloud config set project "$PROJECT_ID" >/dev/null

echo "==> enabling required services"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com

echo "==> ensuring Artifact Registry repo '$REPO' exists in $REGION"
gcloud artifacts repositories describe "$REPO" --location="$REGION" >/dev/null 2>&1 \
  || gcloud artifacts repositories create "$REPO" \
       --repository-format=docker \
       --location="$REGION" \
       --description="Cloud Connectors images"

echo "==> storing YOUTUBE_API_KEY in Secret Manager"
if gcloud secrets describe youtube-api-key >/dev/null 2>&1; then
  printf '%s' "$YOUTUBE_API_KEY" | gcloud secrets versions add youtube-api-key --data-file=-
else
  printf '%s' "$YOUTUBE_API_KEY" | gcloud secrets create youtube-api-key \
    --data-file=- --replication-policy=automatic
fi

echo "==> granting Cloud Run runtime SA access to the secret"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud secrets add-iam-policy-binding youtube-api-key \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/secretmanager.secretAccessor" >/dev/null

echo "==> building image via Cloud Build: $IMAGE"
TMP_CB="$(mktemp)"
trap 'rm -f "$TMP_CB"' EXIT
cat > "$TMP_CB" <<EOF
steps:
  - name: gcr.io/cloud-builders/docker
    env: ['DOCKER_BUILDKIT=1']
    args: ['build', '-f', 'connectors/youtube/Dockerfile', '-t', '${IMAGE}', '.']
  - name: gcr.io/cloud-builders/docker
    args: ['push', '${IMAGE}']
images:
  - '${IMAGE}'
options:
  machineType: E2_HIGHCPU_8
EOF
gcloud builds submit --config="$TMP_CB" .

echo "==> deploying Cloud Run service '$SERVICE'"
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --port 4001 \
  --allow-unauthenticated \
  --set-secrets YOUTUBE_API_KEY=youtube-api-key:latest \
  --min-instances 0 \
  --max-instances 2 \
  --cpu 1 --memory 512Mi

URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"
echo
echo "deployed: $SERVICE"
echo "MCP endpoint: ${URL}/mcp"
