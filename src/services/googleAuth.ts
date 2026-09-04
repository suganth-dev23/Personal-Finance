/**
 * Google Identity Services (GIS) OAuth 2.0 Token Client Integration
 * 
 * Uses client-side token flow with minimal scope: 'https://www.googleapis.com/auth/drive.appdata'
 * Access tokens are held IN-MEMORY ONLY for security (never saved in localStorage or IndexedDB).
 */

const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata email profile openid';

interface TokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

interface UserProfile {
  email?: string;
  name?: string;
  picture?: string;
}

class GoogleAuthService {
  private clientId: string = '';
  private tokenClient: TokenClient | null = null;
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private userProfile: UserProfile | null = null;
  private authStateListeners: Array<(connected: boolean, profile: UserProfile | null) => void> = [];
  private tokenRequestResolve: ((token: string) => void) | null = null;
  private tokenRequestReject: ((error: Error) => void) | null = null;
  private isConnecting: boolean = false;

  constructor() {
    // Load Client ID from Vite env if available
    const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (envClientId && typeof envClientId === 'string' && envClientId.trim()) {
      this.clientId = envClientId.trim();
    } else {
      // Fallback check local override in localStorage
      const localClientId = localStorage.getItem('dhanveda_google_client_id');
      if (localClientId && localClientId.trim()) {
        this.clientId = localClientId.trim();
      }
    }
  }

  public getClientId(): string {
    return this.clientId;
  }

  public setCustomClientId(clientId: string) {
    this.clientId = clientId.trim();
    if (this.clientId) {
      localStorage.setItem('dhanveda_google_client_id', this.clientId);
    } else {
      localStorage.removeItem('dhanveda_google_client_id');
    }
    this.tokenClient = null; // Re-initialize with new client ID
  }

  public hasClientId(): boolean {
    return Boolean(this.clientId && this.clientId.includes('.apps.googleusercontent.com'));
  }

  /**
   * Initializes the GIS Token Client if the google script has loaded.
   */
  public async ensureTokenClient(): Promise<boolean> {
    if (this.tokenClient) return true;
    if (!this.hasClientId()) return false;

    // Wait up to 5 seconds for google.accounts.oauth2 to be available from <script src="https://accounts.google.com/gsi/client">
    let attempts = 0;
    while (attempts < 50) {
      if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
        break;
      }
      await new Promise(res => setTimeout(res, 100));
      attempts++;
    }

    if (!window.google?.accounts?.oauth2) {
      console.warn('[GoogleAuth] Google Identity Services script not yet loaded or blocked by browser.');
      return false;
    }

    try {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: DRIVE_APPDATA_SCOPE,
        callback: (tokenResponse: any) => {
          this.handleTokenCallback(tokenResponse);
        },
        error_callback: (err: any) => {
          console.error('[GoogleAuth] Token client error:', err);
          this.isConnecting = false;
          if (this.tokenRequestReject) {
            this.tokenRequestReject(new Error(err?.message || 'Google Auth Error'));
            this.tokenRequestReject = null;
            this.tokenRequestResolve = null;
          }
        },
      });
      return true;
    } catch (err) {
      console.error('[GoogleAuth] Failed to initialize GIS Token Client:', err);
      return false;
    }
  }

  private async handleTokenCallback(tokenResponse: any) {
    this.isConnecting = false;
    if (tokenResponse.error) {
      console.error('[GoogleAuth] Token response error:', tokenResponse.error);
      if (this.tokenRequestReject) {
        this.tokenRequestReject(new Error(tokenResponse.error));
      }
      this.tokenRequestResolve = null;
      this.tokenRequestReject = null;
      return;
    }

    if (tokenResponse.access_token) {
      this.accessToken = tokenResponse.access_token;
      // Expires in tokenResponse.expires_in seconds (usually 3599s), convert to ms timestamp
      const expiresInSeconds = parseInt(tokenResponse.expires_in, 10) || 3500;
      this.tokenExpiresAt = Date.now() + expiresInSeconds * 1000;

      // Mark connected in session flag (so app knows to prompt silent refresh on next reload)
      localStorage.setItem('dhanveda_drive_sync_enabled', 'true');

      // Fetch user profile for UI
      try {
        await this.fetchUserProfile(this.accessToken!);
      } catch (e) {
        console.warn('[GoogleAuth] Failed to load user profile:', e);
      }

      this.notifyListeners(true, this.userProfile);

      if (this.tokenRequestResolve) {
        this.tokenRequestResolve(this.accessToken!);
        this.tokenRequestResolve = null;
        this.tokenRequestReject = null;
      }
    }
  }

  /**
   * Request an access token.
   * @param interactive If true, opens Google popup prompt; if false, attempts silent prompt
   */
  public async requestAccessToken(interactive: boolean = true): Promise<string> {
    const ready = await this.ensureTokenClient();
    if (!ready || !this.tokenClient) {
      throw new Error('Google Drive API Client ID is not configured or GIS script unavailable.');
    }

    // If we already have a valid token that hasn't expired (with 2m buffer), return it
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt - 120000) {
      return this.accessToken;
    }

    if (this.isConnecting) {
      // Already a pending request
      return new Promise((resolve, reject) => {
        this.tokenRequestResolve = resolve;
        this.tokenRequestReject = reject;
      });
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      this.tokenRequestResolve = resolve;
      this.tokenRequestReject = reject;

      try {
        // 'select_account' or empty prompt
        this.tokenClient!.requestAccessToken({
          prompt: interactive ? 'consent' : '',
        });
      } catch (err: any) {
        this.isConnecting = false;
        reject(err);
      }
    });
  }

  /**
   * Returns a valid access token or null if not authenticated.
   * Attempts silent refresh if sync was previously enabled.
   */
  public async getValidAccessToken(): Promise<string | null> {
    // 1. In-memory token still valid
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt - 120000) {
      return this.accessToken;
    }

    // 2. If sync was previously connected by the user, try silent refresh
    if (this.isSyncEnabled()) {
      try {
        return await this.requestAccessToken(false);
      } catch (err) {
        console.warn('[GoogleAuth] Silent token refresh failed, user may need interactive sign-in:', err);
      }
    }

    return null;
  }

  public isConnected(): boolean {
    return Boolean(this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt);
  }

  public isSyncEnabled(): boolean {
    return localStorage.getItem('dhanveda_drive_sync_enabled') === 'true';
  }

  public getUserProfile(): UserProfile | null {
    return this.userProfile;
  }

  public async fetchUserProfile(token: string): Promise<UserProfile> {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch userinfo: ${response.statusText}`);
    }

    const data = await response.json();
    this.userProfile = {
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
    return this.userProfile;
  }

  /**
   * Disconnects Google Drive sync: revokes access token and clears in-memory state.
   * NEVER deletes local data.
   */
  public async disconnect(): Promise<void> {
    if (this.accessToken && window.google?.accounts?.oauth2?.revoke) {
      try {
        window.google.accounts.oauth2.revoke(this.accessToken, () => {
          console.log('[GoogleAuth] Access token revoked.');
        });
      } catch (e) {
        console.warn('[GoogleAuth] Revoke error:', e);
      }
    }

    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.userProfile = null;
    localStorage.removeItem('dhanveda_drive_sync_enabled');
    this.notifyListeners(false, null);
  }

  public subscribe(listener: (connected: boolean, profile: UserProfile | null) => void): () => void {
    this.authStateListeners.push(listener);
    // Initial emission
    listener(this.isConnected(), this.userProfile);
    return () => {
      this.authStateListeners = this.authStateListeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(connected: boolean, profile: UserProfile | null) {
    this.authStateListeners.forEach(listener => listener(connected, profile));
  }
}

export const googleAuthService = new GoogleAuthService();
