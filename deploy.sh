#!/bin/bash

# Simple Deployment Script for Archivion Media Library
# This version assumes all GCP resources already exist

set -e

echo "🚀 Memulai Deployment Archivion Media Library ke Cloud Run"
echo "================================================="

# Hardcoded values sesuai dengan .env.local dan key-files.json Anda
PROJECT_ID="elaborate-helix-461618-j3"
REGION="us-central1"
SERVICE_NAME="archivion-app-library"
GCS_BUCKET_NAME="buketmedialtka"
FIRESTORE_DATABASE_ID="dbmedialtka"
SERVICE_ACCOUNT_EMAIL="archivion-service@elaborate-helix-461618-j3.iam.gserviceaccount.com"
KEY_FILE="key-files.json"

echo "📋 Proyek: $PROJECT_ID"
echo "🔧 Konfigurasi:"
echo "  Region: $REGION"
echo "  Nama Layanan Cloud Run: $SERVICE_NAME"
echo "  Nama Bucket GCS: $GCS_BUCKET_NAME"
echo "  ID Database Firestore: $FIRESTORE_DATABASE_ID"
echo "  Email Akun Layanan: $SERVICE_ACCOUNT_EMAIL"
echo ""

# Cek apakah key file ada dan readable
if [ ! -f "$KEY_FILE" ]; then
    echo "❌ File $KEY_FILE tidak ditemukan di direktori saat ini!"
    echo "Pastikan file $KEY_FILE ada di root proyek Anda."
    exit 1
fi

if [ ! -r "$KEY_FILE" ]; then
    echo "❌ File $KEY_FILE tidak dapat dibaca!"
    echo "Coba jalankan: chmod 644 $KEY_FILE"
    exit 1
fi

echo "✅ File $KEY_FILE ditemukan dan dapat dibaca"

# Set project untuk gcloud
echo "🔧 Setting gcloud project..."
gcloud config set project $PROJECT_ID

# Mengaktifkan API yang diperlukan
echo "📡 Mengaktifkan API..."
gcloud services enable cloudbuild.googleapis.com --quiet
gcloud services enable run.googleapis.com --quiet
gcloud services enable storage.googleapis.com --quiet
gcloud services enable firestore.googleapis.com --quiet

# Hapus file Docker lama jika ada
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
.dockerignore
*.md
deploy.sh
debug-deploy.sh
check-logs.sh
quick-deploy.sh
cleanup.sh
# Allow both key file names
!key-files.json
!service-account-key.json
EOF

echo "📦 Files yang akan di-upload:"
echo "  - key-files.json: $([ -f key-files.json ] && echo "✅" || echo "❌")"
echo "  - service-account-key.json: $([ -f service-account-key.json ] && echo "✅" || echo "❌")"

# Deploy ke Cloud Run
echo "🚀 Melakukan Deployment ke Cloud Run: $SERVICE_NAME..."
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

# Mendapatkan URL layanan
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

# Cleanup
rm -f Dockerfile .dockerignore service-account-key.json

echo ""
echo "✅ Deployment Selesai!"
echo ""
echo "🌐 Archivion Media Library Anda aktif di:"
echo "   $SERVICE_URL"
echo ""
echo "🔧 Perintah Berguna:"
echo "  Lihat log: ./check-logs.sh"
echo "  Update aplikasi: ./deploy.sh"
echo ""
echo "🎉 Selamat ngoding!"
