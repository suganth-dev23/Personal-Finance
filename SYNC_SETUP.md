# DhanVeda — Google Drive Cross-Device Sync Setup Guide

DhanVeda allows you to sync your financial data seamlessly across devices (phone, tablet, laptop) using your own Google Drive account.

---

## 🔒 Privacy & Architecture

- **Zero Third-Party Servers**: Sync is 100% peer-to-cloud directly between your browser and Google Drive API. No external database or intermediate server ever touches your data.
- **Private `appDataFolder`**: Your financial records are saved to an isolated hidden folder inside your Google Drive (`appDataFolder`). This file is invisible in your normal Google Drive file list, preventing accidental deletion or clutter.
- **AI Key Security**: Personal AI provider API keys (`aiSettings.apiKey`) are **never uploaded to Google Drive**. Each device keeps its own key locally in IndexedDB.
- **Offline-First**: You can add transactions offline. When your device reconnects to Wi-Fi/cellular, DhanVeda automatically merges new records using Last-Write-Wins (LWW) conflict resolution with tombstone tracking for deletions.

---

## 🚀 One-Time Google Cloud Setup (5 Minutes)

To use Google Drive Sync, Google requires an OAuth 2.0 Web Client ID. Follow these 4 easy steps:

### Step 1: Create a Google Cloud Project
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Sign in with your personal Google account.
3. Click the project dropdown in the top-left navigation bar and select **New Project**.
4. Name the project **DhanVeda** and click **Create**.
5. Ensure the new project is selected in the project dropdown.

---

### Step 2: Enable the Google Drive API
1. In the search bar at the top, search for **Google Drive API**.
2. Click **Google Drive API** in the results.
3. Click the blue **Enable** button.

---

### Step 3: Configure OAuth Consent Screen
1. In the left navigation sidebar, go to **APIs & Services** > **OAuth consent screen** (or **Audience**).
2. Choose **External** for the User Type and click **Create**.
3. Fill in the required fields:
   - **App name**: `DhanVeda`
   - **User support email**: Select your Gmail address
   - **Developer contact information**: Enter your email address
4. Click **Save and Continue**.
5. On the **Scopes** page, click **Save and Continue** (DhanVeda requests `drive.appdata` dynamically in code).
6. On the **Test users** page:
   - Click **+ Add Users**.
   - Enter your Gmail address (and any other family member's Gmail if sharing).
   - Click **Add** and then **Save and Continue**.
7. Click **Back to Dashboard**.

> [!TIP]
> Leaving your app in **Testing** status is completely free and permanent for personal use with up to 100 test user emails. You do not need Google App Verification.

---

### Step 4: Create OAuth 2.0 Client ID
1. In the left sidebar, click **Credentials**.
2. Click **+ Create Credentials** at the top and choose **OAuth client ID**.
3. Under **Application type**, select **Web application**.
4. Set **Name**: `DhanVeda Web App`.
5. Under **Authorized JavaScript origins**, click **+ Add URI** and add:
   - `http://localhost:5173` *(for local development)*
   - `http://localhost:4173` *(for Vite preview)*
   - `https://yourdomain.com` *(your production hosting domain, e.g. Vercel, Netlify, Cloudflare, etc.)*
6. Leave **Authorized redirect URIs** empty (GIS token flow uses JavaScript popups, not redirect URIs).
7. Click **Create**.
8. A modal will pop up displaying **Your Client ID** (ending in `.apps.googleusercontent.com`). Copy this Client ID.

---

## ⚙️ Connecting Your Client ID in DhanVeda

You have two easy ways to set your Client ID:

### Method A: Directly in the App (Recommended for Instant Setup)
1. Open DhanVeda in your browser.
2. Go to **Settings** > **Google Drive Cloud Sync**.
3. Click **Configure Client ID** (or **Setup Guide**).
4. Paste your copied Client ID into the field and click **Save Client ID**.
5. Click **Connect Google Drive**!

### Method B: Via `.env.local` File (For Developers)
1. In the root of this project folder, create or edit `.env.local`:
   ```env
   VITE_GOOGLE_CLIENT_ID="YOUR_COPIED_CLIENT_ID.apps.googleusercontent.com"
   ```
2. Restart your development server:
   ```bash
   npm run dev
   ```

---

## 📱 Installing on Mobile (PWA)

Once connected on your desktop:
- **Android (Chrome)**: Open your hosted DhanVeda URL, tap the three dots menu (⋮) -> **Install app** (or **Add to Home screen**).
- **iPhone / iPad (Safari)**: Open the URL in Safari, tap the **Share** button (box with upward arrow) -> **Add to Home Screen**.

Open DhanVeda on your mobile device, go to **Settings** > **Google Drive Cloud Sync**, and tap **Connect Google Drive** to authenticate with the same Google account. Your data will instantly sync across both devices!

---

## ❓ Frequently Asked Questions

### Where can I find the sync file in Google Drive?
The file is saved as `dhanveda-sync.json` in the hidden `appDataFolder` of your Drive. Google deliberately hides this folder from `drive.google.com` so other software or accidental clicks cannot delete it.

### What happens if I disconnect Google Drive?
Disconnecting simply revokes the session token and stops automatic syncing. **None of your local data is deleted**. All your transactions, budgets, goals, and history remain safely in your device's IndexedDB.

### What if two devices edit data while offline?
When both reconnect, DhanVeda compares record timestamps (`updatedAt`). The most recent change wins on a per-record basis. If an item was deleted on one device, a 90-day tombstone propagates the deletion so the item doesn't resurrect.
