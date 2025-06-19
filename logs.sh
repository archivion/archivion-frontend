#!/bin/bash

# View logs quickly
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="archivion-media-library"

echo "📊 Viewing logs for $SERVICE_NAME"
echo "Press Ctrl+C to stop"
echo ""

gcloud logs tail --follow \
    --filter="resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" \
    --format="table(timestamp,severity,textPayload)"
