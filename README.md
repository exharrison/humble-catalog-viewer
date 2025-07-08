# Humble Catalog Viewer

A web interface for viewing your Humble Bundle and Fanatical book bundles.

## Features
- Browse and search your Humble and Fanatical book bundles
- View book details, formats, and download links (if available)
- Filter and sort bundles by source, download status, and more

## Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or newer recommended)
- [npm](https://www.npmjs.com/)

### Installation
1. Clone this repository:
   ```bash
   git clone <your-repo-url>
   cd humble-catalog-viewer
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Place your data files:
   - `detailed_catalog.json` (from Humble Bundle)
   - `fanatical-book-details.json` (from Fanatical)
   - **These files are ignored by git for your security.**

### Running the App
Start the server:
```bash
npm start
```

Then open your browser and go to [http://localhost:3000](http://localhost:3000)

## Security Notes
- **Sensitive data**: The JSON data files may contain download tokens, game keys, and signed URLs. These files are excluded from version control by `.gitignore`.
- **Do not share** your data files or expose them publicly.

## Project Structure
- `server.js` - Main Express server
- `views/` - EJS templates for web pages
- `public/` - Static assets (images, CSS, etc.)
- `package.json` - Project dependencies and scripts

## License
This project is for personal use. See LICENSE for details (if provided). 

## Running as a systemd Service

To run the Humble Catalog Viewer as a background service on Linux using systemd:

1. **Create a systemd service file** (e.g., `/etc/systemd/system/humble-catalog-viewer.service`):

   ```ini
   [Unit]
   Description=Humble Catalog Viewer Webapp
   After=network.target

   [Service]
   Type=simple
   WorkingDirectory=/path/to/your/humble-catalog-viewer
   ExecStart=/usr/bin/npm start
   Restart=on-failure
   User=yourusername
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```
   - Replace `/path/to/your/humble-catalog-viewer` with the absolute path to your project directory.
   - Replace `yourusername` with the user that should run the service.

2. **Reload systemd and enable the service:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable humble-catalog-viewer
   sudo systemctl start humble-catalog-viewer
   ```

3. **Check the status:**
   ```bash
   sudo systemctl status humble-catalog-viewer
   ```

The app will now start automatically on boot and can be managed with `systemctl`. 