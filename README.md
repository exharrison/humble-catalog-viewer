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
- JSON data files from humble (https://github.com/exharrison/humblebundle-ebook-downloader) and fanatical (https://github.com/exharrison/fanatical-ebook-downloader)

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
   # --- Optional: Enable session authentication ---
   # Environment=ENABLE_SESSION_AUTH=true
   # Environment=APP_USERNAME=myuser
   # Environment=APP_PASSWORD=mypassword
   # Environment=SESSION_SECRET=some-long-random-string
   # --- Optional: Enable guest mode ---
   # Environment=GUEST_MODE=true
   # ---------------------------------------------

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

## Optional Session Authentication

You can enable session-based authentication to require a login before accessing the webapp. By default, authentication is **disabled** and anyone can access the app.

### Enabling Authentication

Set the following environment variable before starting the app:

```bash
export ENABLE_SESSION_AUTH=true
```

You can also set these in your systemd service file or Docker environment.

#### Required Environment Variables
- `ENABLE_SESSION_AUTH=true` — Enable session authentication (default: disabled)
- `APP_USERNAME` — Username for login (default: `admin`)
- `APP_PASSWORD` — Password for login (default: `password`)
- `SESSION_SECRET` — Secret for session encryption (default: `change_this_secret`)

**Note:** The `SESSION_SECRET` is used to encrypt and sign session cookies. For production, use a long, random string. You can generate one with: `openssl rand -base64 32`

#### Example (Linux/macOS)
```bash
export ENABLE_SESSION_AUTH=true
export APP_USERNAME=myuser
export APP_PASSWORD=mypassword
export SESSION_SECRET=some-long-random-string
npm start
```

#### Example (systemd)
Add to your service file:
```ini
Environment=ENABLE_SESSION_AUTH=true
Environment=APP_USERNAME=myuser
Environment=APP_PASSWORD=mypassword
Environment=SESSION_SECRET=some-long-random-string
```

Then reload and restart:
```bash
sudo systemctl daemon-reload
sudo systemctl restart humble-catalog-viewer
```

#### Example (Docker Compose)
```yaml
services:
  humble-catalog-viewer:
    image: your-image
    environment:
      - ENABLE_SESSION_AUTH=true
      - APP_USERNAME=myuser
      - APP_PASSWORD=mypassword
      - SESSION_SECRET=some-long-random-string
```

### Guest (Browsing) Mode

Guest mode allows users to browse bundles and books without logging in, but download links are hidden. This is useful for demo or public browsing scenarios.

**Guest mode is disabled by default.**

#### Enabling Guest Mode
You can enable guest mode in one of two ways:

- **Environment variable:**
  ```bash
  export GUEST_MODE=true
  npm start
  ```
- **Command line flag:**
  ```bash
  node server.js --guest
  # or
  node server.js --guest-mode
  ```
- **systemd:**
  Add to your service file:
  ```ini
  Environment=GUEST_MODE=true
  ```

#### How Guest Mode Works
- When enabled, users can log in as a guest by entering `guest` as the username (any password).
- Alternatively, visiting `/guest` in the browser will start a guest session.
- Guest users can browse all bundles and books, but will not see download links.
- If guest mode is not enabled, the guest login and `/guest` route are disabled.

### Testing Authentication and Guest Mode

1. **Start the app** with authentication and (optionally) guest mode enabled
2. **Visit** `http://localhost:3000`
3. **You should be redirected** to `/login`
4. **Enter your credentials** (username/password from environment variables) or `guest` as the username (if guest mode is enabled)
5. **After login**, you'll be redirected to the main catalog page
6. **Logout** using the `/logout` route

### Disabling Authentication

Unset or set `ENABLE_SESSION_AUTH` to anything other than `true` (e.g., not set, or `false`). The app will run with **no authentication** (default behavior).
