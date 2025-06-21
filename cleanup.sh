#!/bin/bash

# Cleanup Script - Hanya hapus Cloud Run service
# Script ini TIDAK menghapus resource GCP lainnya (GCS bucket, Firestore, Service Account)
# Hanya menghapus Cloud Run service dan file temporary lokal

set -e

# Konfigurasi (hardcoded sesuai dengan setup yang ada)
PROJECT_ID="elaborate-helix-461618-j3"
REGION="us-central1"
SERVICE_NAME="archivion-app-library"
GCS_BUCKET_NAME="buketmedialtka"
FIRESTORE_DATABASE_ID="dbmedialtka"
SERVICE_ACCOUNT_EMAIL="archivion-service@elaborate-helix-461618-j3.iam.gserviceaccount.com"

echo "🗑️ Cleanup Archivion Resources"
echo "=============================="
echo "📋 Project: $PROJECT_ID"
echo ""
echo "⚠️  PERHATIAN:"
echo "   Script ini HANYA akan menghapus Cloud Run service: $SERVICE_NAME"
echo "   Resource berikut TIDAK akan dihapus:"
echo "   • GCS Bucket: $GCS_BUCKET_NAME"
echo "   • Firestore Database: $FIRESTORE_DATABASE_ID"
echo "   • Service Account: $SERVICE_ACCOUNT_EMAIL"
echo "   • File key-files.json (tetap aman di lokal)"
echo ""
read -p "Ketik 'DELETE' untuk konfirmasi penghapusan Cloud Run service: " CONFIRM

if [ "$CONFIRM" != "DELETE" ]; then
    echo "❌ Dibatalkan"
    exit 1
fi

echo ""
echo "🗑️ Menghapus resources..."

# Set gcloud project
gcloud config set project $PROJECT_ID --quiet

# Delete Cloud Run service only
echo "🔥 Menghapus Cloud Run service: $SERVICE_NAME"
if gcloud run services delete $SERVICE_NAME --region $REGION --quiet 2>/dev/null; then
    echo "✅ Cloud Run service berhasil dihapus"
else
    echo "ℹ️  Cloud Run service tidak ditemukan atau sudah dihapus"
fi

# Clean up local temporary files only
echo "🧹 Membersihkan file temporary lokal..."
rm -f Dockerfile .dockerignore
echo "✅ File temporary lokal dibersihkan"

echo ""
echo "✅ Cleanup selesai!"
echo ""
echo "📋 Yang dihapus:"
echo "  • Cloud Run service: $SERVICE_NAME"
echo "  • File temporary lokal: Dockerfile, .dockerignore"
echo ""
echo "📋 Yang TIDAK dihapus (masih aman):"
echo "  • GCS Bucket: $GCS_BUCKET_NAME"
echo "  • Firestore Database: $FIRESTORE_DATABASE_ID"
echo "  • Service Account: $SERVICE_ACCOUNT_EMAIL"
echo "  • File key-files.json"
echo ""
echo "🔄 Untuk deploy ulang, jalankan: ./deploy.sh"
echo ""
echo "🎉 Done!"
