# PWA Setup Scripts

This directory contains scripts for setting up Progressive Web App (PWA) features.

## Files

- `setup-pwa.sh` - Main setup script that generates all PWA files
- `generate-icons.py` - Python script that generates app icons from SVG source

## Usage

### Quick Setup
```bash
npm run setup-pwa
```

### Manual Setup
```bash
# Copy PWA files
cp public/manifest.json manifest.json
cp public/sw.js sw.js
cp public/offline.html offline.html

# Generate icons
python3 scripts/generate-icons.py

# Update paths
sed -i 's|/public/icons/|/icons/|g' manifest.json
```

## Requirements

- Python 3
- Pillow (PIL) library: `pip3 install Pillow`

## Generated Files

The scripts create these files in the project root:
- `manifest.json` - Web app manifest
- `sw.js` - Service worker
- `offline.html` - Offline page
- `icons/` - Directory with generated PNG icons

These files are ignored by git and should be regenerated when needed.
