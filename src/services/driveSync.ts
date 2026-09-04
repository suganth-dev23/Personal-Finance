/**
 * Google Drive Cross-Device Sync Engine
 * 
 * Synchronizes client data using a single JSON snapshot stored in the private 'appDataFolder'.
 * Conflict resolution: Per-record Last-Write-Wins (LWW) using ISO `updatedAt` timestamps
 * with deterministic `deviceId` tie-breaking and 90-day tombstone tracking for deletions.
 * 
 * SECURITY: aiSettings.apiKey is strictly excluded from Drive snapshots and preserved locally.
 */

import {
  SyncPayload,
  TombstoneRecord,
  Transaction,
  Category,
  Budget,
  Investment,
  DreamGoal,
  Contact,
  SettlementRecord,
  AIHealthReport,
  EmergencyFund,
  AISettings,
  SyncableStoreName,
} from '../types/finance';
import {
  getAllFromStore,
  saveAllToStore,
  getSingleRecord,
  saveSingleRecord,
  getTombstones,
  saveTombstones,
  purgeOldTombstones,
  getDeviceId,
  UserPreferences,
} from '../utils/db';
import { googleAuthService } from './googleAuth';

const SYNC_FILE_NAME = 'dhanveda-sync.json';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

export class DriveSyncService {
  private syncInProgress = false;
  private lastSyncedAt: string | null = null;
  private lastError: string | null = null;
  private cachedFileId: string | null = null;
  private syncListeners: Array<(isSyncing: boolean, lastSyncedAt: string | null, error: string | null) => void> = [];

  constructor() {
    this.lastSyncedAt = localStorage.getItem('dhanveda_last_synced_at');
  }

  public getLastSyncedAt(): string | null {
    return this.lastSyncedAt;
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  public isSyncing(): boolean {
    return this.syncInProgress;
  }

  public subscribe(listener: (isSyncing: boolean, lastSyncedAt: string | null, error: string | null) => void): () => void {
    this.syncListeners.push(listener);
    listener(this.syncInProgress, this.lastSyncedAt, this.lastError);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.syncListeners.forEach(l => l(this.syncInProgress, this.lastSyncedAt, this.lastError));
  }

  /**
   * Find existing dhanveda-sync.json in appDataFolder
   */
  public async findSyncFile(token: string): Promise<string | null> {
    if (this.cachedFileId) return this.cachedFileId;

    const query = encodeURIComponent(`name = '${SYNC_FILE_NAME}' and trashed = false`);
    const url = `${DRIVE_FILES_URL}?spaces=appDataFolder&q=${query}&fields=files(id,name,modifiedTime)`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Drive search failed with status ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      this.cachedFileId = data.files[0].id;
      return this.cachedFileId;
    }

    return null;
  }

  /**
   * Download remote sync file
   */
  public async downloadSyncFile(fileId: string, token: string): Promise<SyncPayload | null> {
    const res = await fetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 404) return null;

    if (!res.ok) {
      throw new Error(`Drive download failed with status ${res.status}: ${res.statusText}`);
    }

    try {
      const data = await res.json();
      return data as SyncPayload;
    } catch (err) {
      console.warn('[DriveSync] Corrupted or invalid JSON in Drive file:', err);
      return null;
    }
  }

  /**
   * Upload snapshot to Google Drive appDataFolder
   */
  public async uploadSyncFile(payload: SyncPayload, token: string): Promise<string> {
    const fileId = await this.findSyncFile(token);
    const content = JSON.stringify(payload, null, 2);

    if (fileId) {
      // Update existing file
      const res = await fetch(`${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: content,
      });

      if (!res.ok) {
        throw new Error(`Drive update failed: ${res.statusText}`);
      }

      return fileId;
    } else {
      // Create new file with multipart upload in appDataFolder
      const metadata = {
        name: SYNC_FILE_NAME,
        parents: ['appDataFolder'],
        mimeType: 'application/json',
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const multipartBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        content +
        closeDelim;

      const res = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      });

      if (!res.ok) {
        throw new Error(`Drive file creation failed: ${res.statusText}`);
      }

      const fileData = await res.json();
      this.cachedFileId = fileData.id;
      return fileData.id;
    }
  }

  /**
   * Main synchronization procedure:
   * 1. Get authenticated Google Drive access token
   * 2. Download remote snapshot (if exists)
   * 3. Merge local and remote stores with per-record LWW + deterministic deviceId tiebreaker + tombstones
   * 4. Save merged data to local IndexedDB
   * 5. Upload merged snapshot back to Drive
   */
  public async sync(): Promise<boolean> {
    if (this.syncInProgress) return false;

    // Check offline status
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.lastError = 'Offline — sync will resume once reconnected';
      this.notify();
      return false;
    }

    const token = await googleAuthService.getValidAccessToken();
    if (!token) {
      this.lastError = 'Google Drive not connected';
      this.notify();
      return false;
    }

    this.syncInProgress = true;
    this.lastError = null;
    this.notify();

    try {
      const localDeviceId = getDeviceId();
      await purgeOldTombstones(90);

      // 1. Gather all local data
      const [
        localTransactions,
        localCategories,
        localBudgets,
        localInvestments,
        localDreams,
        localContacts,
        localSettlements,
        localAiReports,
        localEmergency,
        localPrefs,
        localAISettings,
        localTombstones,
      ] = await Promise.all([
        getAllFromStore<Transaction>('transactions'),
        getAllFromStore<Category>('categories'),
        getAllFromStore<Budget>('budgets'),
        getAllFromStore<Investment>('investments'),
        getAllFromStore<DreamGoal>('dreams'),
        getAllFromStore<Contact>('contacts'),
        getAllFromStore<SettlementRecord>('settlements'),
        getAllFromStore<AIHealthReport>('aiReports'),
        getSingleRecord<EmergencyFund & { id: string }>('emergencyFund', 'current'),
        getSingleRecord<UserPreferences>('userPreferences', 'general'),
        getSingleRecord<AISettings & { id: string }>('aiSettings', 'current'),
        getTombstones(),
      ]);

      // 2. Fetch remote sync file
      const fileId = await this.findSyncFile(token);
      let remotePayload: SyncPayload | null = null;
      if (fileId) {
        remotePayload = await this.downloadSyncFile(fileId, token);
      }

      // If no remote file exists yet, upload current local snapshot directly
      if (!remotePayload || !remotePayload.stores) {
        const initialPayload: SyncPayload = {
          version: 3,
          deviceId: localDeviceId,
          lastModified: new Date().toISOString(),
          stores: {
            transactions: localTransactions,
            categories: localCategories,
            budgets: localBudgets,
            emergencyFund: localEmergency || {
              id: 'current',
              targetMonths: 6,
              monthlyExpenseBaseline: 50000,
              currentSaved: 0,
              contributions: [],
            },
            investments: localInvestments,
            dreams: localDreams,
            // Strip API key for security!
            aiSettings: {
              id: 'current',
              provider: localAISettings?.provider || 'gemini',
              model: localAISettings?.model || 'gemini-1.5-flash',
              customPromptPrefix: localAISettings?.customPromptPrefix || '',
              updatedAt: localAISettings?.updatedAt || new Date().toISOString(),
            },
            aiReports: localAiReports,
            userPreferences: localPrefs || {
              id: 'general',
              darkMode: false,
              notRecurringTxIds: [],
              updatedAt: new Date().toISOString(),
            },
            contacts: localContacts,
            settlements: localSettlements,
          },
          tombstones: localTombstones,
        };

        await this.uploadSyncFile(initialPayload, token);
        this.lastSyncedAt = new Date().toISOString();
        localStorage.setItem('dhanveda_last_synced_at', this.lastSyncedAt);
        this.syncInProgress = false;
        this.notify();
        return true;
      }

      // 3. MERGE ENGINE
      const remoteDeviceId = remotePayload.deviceId || 'unknown';

      // Merge tombstones (union by id, keep newer deletedAt)
      const mergedTombstonesMap = new Map<string, TombstoneRecord>();
      for (const t of [...localTombstones, ...(remotePayload.tombstones || [])]) {
        if (!t || !t.id) continue;
        const key = `${t.store}:${t.id}`;
        const existing = mergedTombstonesMap.get(key);
        if (!existing || t.deletedAt > existing.deletedAt) {
          mergedTombstonesMap.set(key, t);
        }
      }
      const mergedTombstones = Array.from(mergedTombstonesMap.values());

      // Helper to merge array stores using LWW and tombstone checks
      const mergeArrayStore = <T extends { id: string; updatedAt?: string; createdAt?: string }>(
        storeName: SyncableStoreName,
        localItems: T[],
        remoteItems: T[]
      ): T[] => {
        const itemMap = new Map<string, T>();
        const localMap = new Map(localItems.map(item => [item.id, item]));
        const remoteMap = new Map(remoteItems.map(item => [item.id, item]));
        const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

        for (const id of allIds) {
          const localItem = localMap.get(id);
          const remoteItem = remoteMap.get(id);
          const tombstone = mergedTombstonesMap.get(`${storeName}:${id}`);

          if (localItem && remoteItem) {
            // Compare timestamps
            const localTime = localItem.updatedAt || localItem.createdAt || '1970-01-01';
            const remoteTime = remoteItem.updatedAt || remoteItem.createdAt || '1970-01-01';

            let winner: T;
            if (localTime > remoteTime) {
              winner = localItem;
            } else if (remoteTime > localTime) {
              winner = remoteItem;
            } else {
              // Deterministic tie-breaker using deviceId
              winner = localDeviceId >= remoteDeviceId ? localItem : remoteItem;
            }

            // Check if tombstone is newer than winner
            const winnerTime = winner.updatedAt || winner.createdAt || '1970-01-01';
            if (!tombstone || tombstone.deletedAt < winnerTime) {
              itemMap.set(id, winner);
            }
          } else if (localItem) {
            const localTime = localItem.updatedAt || localItem.createdAt || '1970-01-01';
            if (!tombstone || tombstone.deletedAt < localTime) {
              itemMap.set(id, localItem);
            }
          } else if (remoteItem) {
            const remoteTime = remoteItem.updatedAt || remoteItem.createdAt || '1970-01-01';
            if (!tombstone || tombstone.deletedAt < remoteTime) {
              itemMap.set(id, remoteItem);
            }
          }
        }

        return Array.from(itemMap.values());
      };

      // Merge all 8 multi-item stores
      const mergedTransactions = mergeArrayStore('transactions', localTransactions, remotePayload.stores.transactions || []);
      const mergedCategories = mergeArrayStore('categories', localCategories, remotePayload.stores.categories || []);
      const mergedBudgets = mergeArrayStore('budgets', localBudgets, remotePayload.stores.budgets || []);
      const mergedInvestments = mergeArrayStore('investments', localInvestments, remotePayload.stores.investments || []);
      const mergedDreams = mergeArrayStore('dreams', localDreams, remotePayload.stores.dreams || []);
      const mergedContacts = mergeArrayStore('contacts', localContacts, remotePayload.stores.contacts || []);
      const mergedSettlements = mergeArrayStore('settlements', localSettlements, remotePayload.stores.settlements || []);
      const mergedAiReports = mergeArrayStore('aiReports', localAiReports, remotePayload.stores.aiReports || []);

      // Merge Single-Record Store: EmergencyFund
      const remoteEmergency = remotePayload.stores.emergencyFund;
      let mergedEmergency = localEmergency || {
        id: 'current',
        targetMonths: 6,
        monthlyExpenseBaseline: 50000,
        currentSaved: 0,
        contributions: [],
      };
      if (remoteEmergency) {
        const localTime = localEmergency?.updatedAt || '1970-01-01';
        const remoteTime = remoteEmergency.updatedAt || '1970-01-01';
        if (remoteTime > localTime || (remoteTime === localTime && remoteDeviceId > localDeviceId)) {
          mergedEmergency = remoteEmergency;
        }
      }

      // Merge Single-Record Store: UserPreferences
      const remotePrefs = remotePayload.stores.userPreferences;
      let mergedPrefs = localPrefs || {
        id: 'general',
        darkMode: false,
        notRecurringTxIds: [],
      };
      if (remotePrefs) {
        const localTime = localPrefs?.updatedAt || '1970-01-01';
        const remoteTime = remotePrefs.updatedAt || '1970-01-01';
        if (remoteTime > localTime || (remoteTime === localTime && remoteDeviceId > localDeviceId)) {
          mergedPrefs = remotePrefs;
        }
      }

      // Merge Single-Record Store: AISettings
      // CRITICAL: Always preserve local apiKey from localAISettings to avoid clobbering!
      const localKey = localAISettings?.apiKey || '';
      const remoteAISettings = remotePayload.stores.aiSettings;
      let mergedAiProvider = localAISettings?.provider || 'gemini';
      let mergedAiModel = localAISettings?.model || 'gemini-1.5-flash';
      let mergedAiPrompt = localAISettings?.customPromptPrefix || '';
      let mergedAiUpdatedAt = localAISettings?.updatedAt || new Date().toISOString();

      if (remoteAISettings) {
        const localTime = localAISettings?.updatedAt || '1970-01-01';
        const remoteTime = remoteAISettings.updatedAt || '1970-01-01';
        if (remoteTime > localTime || (remoteTime === localTime && remoteDeviceId > localDeviceId)) {
          mergedAiProvider = remoteAISettings.provider || mergedAiProvider;
          mergedAiModel = remoteAISettings.model || mergedAiModel;
          mergedAiPrompt = remoteAISettings.customPromptPrefix || '';
          mergedAiUpdatedAt = remoteAISettings.updatedAt || new Date().toISOString();
        }
      }

      const mergedAISettings: AISettings & { id: string } = {
        id: 'current',
        provider: mergedAiProvider,
        model: mergedAiModel,
        customPromptPrefix: mergedAiPrompt,
        updatedAt: mergedAiUpdatedAt,
        apiKey: localKey, // Safely preserved!
      };

      // 4. Save merged results to local IndexedDB
      await Promise.all([
        saveAllToStore('transactions', mergedTransactions),
        saveAllToStore('categories', mergedCategories),
        saveAllToStore('budgets', mergedBudgets),
        saveAllToStore('investments', mergedInvestments),
        saveAllToStore('dreams', mergedDreams),
        saveAllToStore('contacts', mergedContacts),
        saveAllToStore('settlements', mergedSettlements),
        saveAllToStore('aiReports', mergedAiReports),
        saveSingleRecord('emergencyFund', mergedEmergency),
        saveSingleRecord('userPreferences', mergedPrefs),
        saveSingleRecord('aiSettings', mergedAISettings),
        saveTombstones(mergedTombstones),
      ]);

      // 5. Upload consolidated snapshot back to Google Drive
      const consolidatedPayload: SyncPayload = {
        version: 3,
        deviceId: localDeviceId,
        lastModified: new Date().toISOString(),
        stores: {
          transactions: mergedTransactions,
          categories: mergedCategories,
          budgets: mergedBudgets,
          emergencyFund: mergedEmergency,
          investments: mergedInvestments,
          dreams: mergedDreams,
          aiSettings: {
            id: 'current',
            provider: mergedAISettings.provider,
            model: mergedAISettings.model,
            customPromptPrefix: mergedAISettings.customPromptPrefix,
            updatedAt: mergedAISettings.updatedAt,
          },
          aiReports: mergedAiReports,
          userPreferences: mergedPrefs,
          contacts: mergedContacts,
          settlements: mergedSettlements,
        },
        tombstones: mergedTombstones,
      };

      await this.uploadSyncFile(consolidatedPayload, token);

      this.lastSyncedAt = new Date().toISOString();
      localStorage.setItem('dhanveda_last_synced_at', this.lastSyncedAt);
      this.syncInProgress = false;
      this.lastError = null;
      this.notify();
      return true;
    } catch (err: any) {
      console.error('[DriveSync] Sync execution failed:', err);
      this.syncInProgress = false;
      this.lastError = err?.message || 'Sync failed';
      this.notify();
      return false;
    }
  }
}

export const driveSyncService = new DriveSyncService();
