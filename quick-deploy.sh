#!/bin/bash

# Ultra Quick Deploy - Hanya update image Cloud Run
# Script ini TIDAK membuat atau menghapus resource GCP apa pun
# Hanya melakukan build dan deploy ulang image ke Cloud Run service yang sudah ada

set -e

# Konfigurasi (hardcoded sesuai dengan setup yang ada)
PROJECT_ID="elaborate-helix-461618-j3"
REGION="us-central1"
SERVICE_NAME="archivion-app-library"
GCS_BUCKET_NAME="buketmedialtka"
FIRESTORE_DATABASE_ID="dbmedialtka"
SERVICE_ACCOUNT_EMAIL="archivion-service@elaborate-helix-461618-j3.iam.gserviceaccount.com"

echo "⚡ Quick Deploy - Update Image Only"
echo "=================================="
echo "📋 Project: $PROJECT_ID"
echo "🔧 Service: $SERVICE_NAME"
echo ""

# Verifikasi file key ada
if [ ! -f "key-files.json" ]; then
    echo "❌ Error: key-files.json tidak ditemukan!"
    echo "   Pastikan file key-files.json ada di direktori root"
    exit 1
fi

echo "✅ File key-files.json ditemukan"

# Set gcloud project
echo "🔧 Setting gcloud project..."
gcloud config set project $PROJECT_ID --quiet

# Bersihkan file Docker lama jika ada
echo "🧹 Membersihkan file Docker lama..."
rm -f Dockerfile .dockerignore

# Buat backup key file dengan nama yang berbeda untuk memastikan ter-copy
echo "🔑 Membuat backup key file..."
cp key-files.json service-account-key.json

# Membuat Dockerfile baru dengan copy key file menggunakan nama backup
echo "🐳 Membuat Dockerfile..."
cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy service account key with backup name first
COPY service-account-key.json ./key-files.json

# Verify key file is copied
RUN echo "=== Key file verification ===" && \
    ls -la ./key-files.json && \
    echo "File size: $(wc -c < ./key-files.json) bytes" && \
    head -1 ./key-files.json && \
    echo "=== End verification ==="

# Copy rest of the source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
EOF

# Membuat .dockerignore yang tidak mengabaikan key files
cat > .dockerignore << 'EOF'
node_modules
.next
.git
.env*
README.md
*.md
deploy.sh
quick-deploy.sh
cleanup.sh
debug-deploy.sh
alternative-deploy.sh
check-logs.sh
# Allow both key file names
!key-files.json
!service-account-key.json
EOF

echo "📦 Files yang akan di-upload:"
echo "  - key-files.json: $([ -f key-files.json ] && echo "✅" || echo "❌")"
echo "  - service-account-key.json: $([ -f service-account-key.json ] && echo "✅" || echo "❌")"

# Deploy ke Cloud Run (update image)
echo "🚀 Updating Cloud Run service: $SERVICE_NAME..."
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --service-account $SERVICE_ACCOUNT_EMAIL \
    --set-env-vars "GOOGLE_CLOUD_PROJECT_ID=${PROJECT_ID},GCS_BUCKET_NAME=${GCS_BUCKET_NAME},FIRESTORE_DATABASE_ID=${FIRESTORE_DATABASE_ID},GOOGLE_CLOUD_KEY_FILE=./key-files.json" \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --port 3000 \
    --quiet

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

# Cleanup temporary files
rm -f Dockerfile .dockerignore service-account-key.json

echo ""
echo "✅ Quick Deploy Complete!"
echo ""
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "📋 What was updated:"
echo "  • Cloud Run service image: $SERVICE_NAME"
echo ""
echo "📋 Resources NOT touched:"
echo "  • GCS Bucket: $GCS_BUCKET_NAME (unchanged)"
echo "  • Firestore Database: $FIRESTORE_DATABASE_ID (unchanged)"
echo "  • Service Account: $SERVICE_ACCOUNT_EMAIL (unchanged)"
echo ""
echo "🔧 Useful commands:"
echo "  Check logs: ./check-logs.sh"
echo "  Quick redeploy: ./quick-deploy.sh"
echo ""
echo "🎉 Done!"
