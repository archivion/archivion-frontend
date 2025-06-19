#!/bin/bash

# Quick status check
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
SERVICE_NAME="archivion-media-library"
BUCKET_NAME="${PROJECT_ID}-media-storage"

echo "📊 Archivion Status"
echo "=================="
echo "Project: $PROJECT_ID"
echo ""

# Check Cloud Run
if gcloud run services describe $SERVICE_NAME --region $REGION > /dev/null 2>&1; then
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')
    echo "🚀 Cloud Run: ✅ Running"
    echo "   URL: $SERVICE_URL"
else
    echo "🚀 Cloud Run: ❌ Not deployed"
fi

# Check bucket
if gsutil ls -b gs://$BUCKET_NAME > /dev/null 2>&1; then
    FILE_COUNT=$(gsutil ls gs://$BUCKET_NAME 2>/dev/null | wc -l)
    echo "🪣 Storage: ✅ Active ($FILE_COUNT files)"
else
    echo "🪣 Storage: ❌ Not found"
fi

echo ""
echo "Commands:"
echo "  Deploy: ./deploy.sh"
echo "  Quick deploy: ./quick-deploy.sh"
echo "  Logs: ./logs.sh"
