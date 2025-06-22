#!/bin/bash

set -e

PROJECT_ID="elaborate-helix-461618-j3"
REGION="us-central1"
SERVICE_NAME="archivion-app-library"
GCS_BUCKET_NAME="buketmedialtka"
FIRESTORE_DATABASE_ID="dbmedialtka"
SERVICE_ACCOUNT_EMAIL="archivion-service@elaborate-helix-461618-j3.iam.gserviceaccount.com"
KEY_FILE="key-files.json"

gcloud config set project $PROJECT_ID

gcloud services enable cloudbuild.googleapis.com --quiet
gcloud services enable run.googleapis.com --quiet
gcloud services enable storage.googleapis.com --quiet
gcloud services enable firestore.googleapis.com --quiet

rm -f Dockerfile .dockerignore

cp key-files.json service-account-key.json

cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY service-account-key.json ./key-files.json

RUN echo "=== Key file verification ===" && \
    ls -la ./key-files.json && \
    echo "File size: $(wc -c < ./key-files.json) bytes" && \
    head -1 ./key-files.json && \
    echo "=== End verification ==="

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
EOF

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

SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

rm -f Dockerfile .dockerignore service-account-key.json