#!/bin/bash
# PWA Setup Script
# Generates all PWA files from source files

set -e  # Exit on any error

echo "🚀 Setting up PWA files..."

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3 and try again."
    exit 1
fi

# Check if PIL is available
if ! python3 -c "from PIL import Image" 2>/dev/null; then
    echo "❌ PIL (Pillow) is required but not installed."
    echo "Installing Pillow..."
    pip3 install Pillow
fi

# Create directories
echo "📁 Creating directories..."
mkdir -p icons
mkdir -p public/icons

# Copy PWA files to root
echo "📋 Copying PWA files..."
cp public/manifest.json manifest.json
cp public/sw.js sw.js
cp public/offline.html offline.html

# Update manifest to use correct icon paths
echo "🔧 Updating manifest icon paths..."
sed -i 's|/public/icons/|/icons/|g' manifest.json

# Update service worker to use correct paths
echo "🔧 Updating service worker paths..."
sed -i 's|/public/manifest.json|/manifest.json|g' sw.js
sed -i 's|/public/icons/|/icons/|g' sw.js

# Generate icons
echo "🎨 Generating app icons..."
python3 scripts/generate-icons.py

echo "✅ PWA setup complete!"
echo ""
echo "Generated files:"
echo "  - manifest.json (web app manifest)"
echo "  - sw.js (service worker)"
echo "  - offline.html (offline page)"
echo "  - icons/ (app icons directory)"
echo ""
echo "You can now start your server with: npm start"
echo "PWA features will be available at https://your-domain.com"
