#!/bin/bash

# Simple Deployment Script for Archivion Media Library
# No prompts - just run and deploy!

set -e

echo "🚀 Deploying Archivion Media Library to Cloud Run"
echo "================================================="

# Get current project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No project selected. Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📋 Project: $PROJECT_ID"

# Set default configuration
REGION="us-central1"
SERVICE_NAME="archivion-media-library"
SERVICE_ACCOUNT_NAME="archivion-service"
SERVICE_ACCOUNT_EMAIL="archivion-service@$(gcloud config get-value project).iam.gserviceaccount.com"

echo "🔧 Configuration:"
echo "  Region: $REGION"
echo "  Service: $SERVICE_NAME"
echo "  Bucket: tubesltka2425"
echo "  Database: dbtubesltka2425"
echo ""

# Enable required APIs
echo "📡 Enabling APIs..."
gcloud services enable cloudbuild.googleapis.com --quiet
gcloud services enable run.googleapis.com --quiet
gcloud services enable storage.googleapis.com --quiet
gcloud services enable firestore.googleapis.com --quiet

# Create storage bucket if not exists
echo "🪣 Setting up storage bucket..."
if ! gsutil ls -b gs://tubesltka2425 > /dev/null 2>&1; then
    gsutil mb -l $REGION gs://tubesltka2425
    gsutil iam ch allUsers:objectViewer gs://tubesltka2425
    echo "✅ Bucket created: gs://tubesltka2425"
else
    echo "ℹ️ Bucket exists: gs://tubesltka2425"
fi

# Create Firestore database if not exists
echo "🗄️ Setting up Firestore database..."
if ! gcloud firestore databases describe --database=dbtubesltka2425 > /dev/null 2>&1; then
    gcloud firestore databases create --database=dbtubesltka2425 --location=$REGION --type=firestore-native --quiet
    echo "✅ Firestore database created: dbtubesltka2425"
else
    echo "ℹ️ Firestore database exists: dbtubesltka2425"
fi

# Create service account if not exists
echo "👤 Setting up service account..."
if ! gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL > /dev/null 2>&1; then
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="Archivion Media Library Service Account" --quiet

    # Grant permissions
    gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
        --role="roles/storage.admin" --quiet

    gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
        --role="roles/datastore.user" --quiet

    echo "✅ Service account created: $SERVICE_ACCOUNT_EMAIL"
else
    echo "ℹ️ Service account exists: $SERVICE_ACCOUNT_EMAIL"
fi

# Create service account key
KEY_FILE="key-files.json"
echo "🔐 Creating service account key..."
gcloud iam service-accounts keys create key-files.json \
    --iam-account=$SERVICE_ACCOUNT_EMAIL --quiet

# Create Dockerfile
echo "🐳 Creating Dockerfile..."
cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
EOF

# Create .dockerignore
cat > .dockerignore << 'EOF'
node_modules
.next
.git
.env*
README.md
.dockerignore
*.md
deploy.sh
EOF

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --service-account $SERVICE_ACCOUNT_EMAIL \
    --set-env-vars "GOOGLE_CLOUD_PROJECT_ID=$(gcloud config get-value project),GCS_BUCKET_NAME=tubesltka2425,FIRESTORE_DATABASE_ID=dbtubesltka2425,GOOGLE_CLOUD_KEY_FILE=./key-files.json" \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --port 3000 \
    --quiet

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

# Cleanup local files
rm -f Dockerfile .dockerignore

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "🌐 Your Archivion Media Library is live at:"
echo "   $SERVICE_URL"
echo ""
echo "📋 Resources Created:"
echo "  • Cloud Run Service: $SERVICE_NAME"
echo "  • Storage Bucket: gs://$BUCKET_NAME"
echo "  • Firestore Database: $DB_ID"
echo "  • Service Account: $SERVICE_ACCOUNT_EMAIL"
echo ""
echo "🔧 Useful Commands:"
echo "  View logs: gcloud logs tail --follow --filter=\"resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME\""
echo "  Update app: ./deploy.sh"
echo "  Delete service: gcloud run services delete $SERVICE_NAME --region $REGION"
echo ""
echo "🎉 Happy coding!"
