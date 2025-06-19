#!/bin/bash

# Ultra Quick Deploy - Just the deployment part
# Use this if resources are already set up

set -e

PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
SERVICE_NAME="archivion-media-library"
BUCKET_NAME="tubesltka2425"
DB_ID="dbtubesltka2425"
SERVICE_ACCOUNT_EMAIL="archivion-service@${PROJECT_ID}.iam.gserviceaccount.com"

echo "⚡ Quick Deploy to Cloud Run"
echo "Project: $PROJECT_ID"
echo ""

# Create minimal Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
EOF

# Deploy
echo "🚀 Deploying..."
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --service-account $SERVICE_ACCOUNT_EMAIL \
    --set-env-vars "GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID,GCS_BUCKET_NAME=$BUCKET_NAME,FIRESTORE_DATABASE_ID=$DB_ID,GOOGLE_CLOUD_KEY_FILE=./key-files.json" \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --port 3000 \
    --quiet

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')
rm -f Dockerfile

echo ""
echo "✅ Deployed! $SERVICE_URL"
