#!/bin/bash

SERVICE_NAME="archivion-fresh-2025"
REGION="us-central1"

echo "📋 Checking logs for $SERVICE_NAME..."
echo "======================================"

# Get recent logs
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" \
    --limit=50 \
    --format="table(timestamp,severity,textPayload)" \
    --project="elaborate-helix-461618-j3"

echo ""
echo "🔄 For live logs, run:"
echo "gcloud logs tail --follow --filter=\"resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME\""
