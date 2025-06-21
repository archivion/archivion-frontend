#!/bin/bash

echo "🔍 Debug Pre-Deployment Check"
echo "=============================="

# Check required files
echo "📁 Checking required files:"
files=("package.json" "key-files.json" ".env.local")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  - $file: ✅ Found"
    else
        echo "  - $file: ❌ Missing"
    fi
done

echo ""

# Check key file content (safely)
echo "🔑 Key file info:"
if [ -f "key-files.json" ]; then
    # Use jq if available, otherwise use grep
    if command -v jq &> /dev/null; then
        PROJECT_ID=$(jq -r '.project_id // "Not found"' key-files.json)
        CLIENT_EMAIL=$(jq -r '.client_email // "Not found"' key-files.json)
    else
        PROJECT_ID=$(grep -o '"project_id"[^,]*' key-files.json | cut -d'"' -f4 || echo "Not found")
        CLIENT_EMAIL=$(grep -o '"client_email"[^,]*' key-files.json | cut -d'"' -f4 || echo "Not found")
    fi
    echo "  - Project ID: $PROJECT_ID"
    echo "  - Client Email: $CLIENT_EMAIL"
    echo "  - File size: $(wc -c < key-files.json) bytes"
    echo "  - File permissions: $(ls -l key-files.json | cut -d' ' -f1)"
else
    echo "  - ❌ key-files.json not found"
fi

echo ""

# Check environment variables
echo "🌍 Environment variables from .env.local:"
if [ -f ".env.local" ]; then
    grep -v '^#' .env.local | grep -v '^$'
else
    echo "  - ❌ .env.local not found"
fi

echo ""

# Check for conflicting files
echo "🗂️ Checking for conflicting files:"
conflicting_files=("Dockerfile" ".dockerignore")
for file in "${conflicting_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  - $file: ⚠️ Found (will be overwritten)"
        echo "    Content preview:"
        head -3 "$file" | sed 's/^/      /'
    else
        echo "  - $file: ✅ Not found (good)"
    fi
done

echo ""

# Check gcloud configuration
echo "🔧 Google Cloud configuration:"
if command -v gcloud &> /dev/null; then
    CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "Not set")
    echo "  - Current project: $CURRENT_PROJECT"
    echo "  - Expected project: elaborate-helix-461618-j3"
    if [ "$CURRENT_PROJECT" != "elaborate-helix-461618-j3" ]; then
        echo "  - ⚠️ Project mismatch! Run: gcloud config set project elaborate-helix-461618-j3"
    fi
else
    echo "  - ❌ gcloud not found"
fi

echo ""
echo "🚀 Ready to deploy? Run: ./deploy.sh"
