#!/bin/bash

# Clean up all resources
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
SERVICE_NAME="archivion-media-library"
BUCKET_NAME="${PROJECT_ID}-media-storage"
DB_ID="media-metadata-db"
SERVICE_ACCOUNT_EMAIL="archivion-service@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🗑️ Cleanup Archivion Resources"
echo "=============================="
echo "This will delete EVERYTHING!"
echo ""
read -p "Type 'DELETE' to confirm: " CONFIRM

if [ "$CONFIRM" != "DELETE" ]; then
    echo "❌ Cancelled"
    exit 1
fi

echo ""
echo "🗑️ Deleting resources..."

# Delete Cloud Run
gcloud run services delete $SERVICE_NAME --region $REGION --quiet 2>/dev/null || echo "Service not found"

# Delete bucket
gsutil -m rm -r gs://$BUCKET_NAME 2>/dev/null || echo "Bucket not found"

# Delete Firestore database
gcloud firestore databases delete --database=$DB_ID --quiet 2>/dev/null || echo "Database not found"

# Delete service account
gcloud iam service-accounts delete $SERVICE_ACCOUNT_EMAIL --quiet 2>/dev/null || echo "Service account not found"

# Clean local files
rm -f service-account-key.json Dockerfile .dockerignore

echo ""
echo "✅ Cleanup complete!"
