import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  Transaction,
  Category,
  Budget,
  EmergencyFund,
  Investment,
  DreamGoal,
  AISettings,
  AIHealthReport,
  Contact,
  SettlementRecord,
  TombstoneRecord,
  SyncableStoreName,
} from '../types/finance';

export interface UserPreferences {
  id: string; // 'general'
  darkMode: boolean;
  notRecurringTxIds: string[]; // Set of transaction IDs marked as not recurring
  updatedAt?: string;
}

export interface DhanVedaDBSchema extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      'by-date': string;
      'by-category': string;
      'by-type': string;
    };
  };
  categories: {
    key: string;
    value: Category;
  };
  budgets: {
    key: string;
    value: Budget;
  };
  emergencyFund: {
    key: string;
    value: EmergencyFund & { id: string };
  };
  investments: {
    key: string;
    value: Investment;
  };
  dreams: {
    key: string;
    value: DreamGoal;
  };
  aiSettings: {
    key: string;
    value: AISettings & { id: string };
  };
  aiReports: {
    key: string;
    value: AIHealthReport;
  };
  userPreferences: {
    key: string;
    value: UserPreferences;
  };
  contacts: {
    key: string;
    value: Contact;
  };
  settlements: {
    key: string;
    value: SettlementRecord;
    indexes: {
      'by-contactId': string;
      'by-date': string;
    };
  };
  tombstones: {
    key: string;
    value: TombstoneRecord;
    indexes: {
      'by-store': string;
      'by-deletedAt': string;
    };
  };
}

const DB_NAME = 'dhanveda_db';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<DhanVedaDBSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<DhanVedaDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<DhanVedaDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('by-date', 'date');
          txStore.createIndex('by-category', 'category');
          txStore.createIndex('by-type', 'type');
        }

        // Categories store
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }

        // Budgets store
        if (!db.objectStoreNames.contains('budgets')) {
          db.createObjectStore('budgets', { keyPath: 'id' });
        }

        // Emergency fund store (single record with id: 'current')
        if (!db.objectStoreNames.contains('emergencyFund')) {
          db.createObjectStore('emergencyFund', { keyPath: 'id' });
        }

        // Investments store
        if (!db.objectStoreNames.contains('investments')) {
          db.createObjectStore('investments', { keyPath: 'id' });
        }

        // Dreams / Goals store
        if (!db.objectStoreNames.contains('dreams')) {
          db.createObjectStore('dreams', { keyPath: 'id' });
        }

        // AI Settings store (single record with id: 'current')
        if (!db.objectStoreNames.contains('aiSettings')) {
          db.createObjectStore('aiSettings', { keyPath: 'id' });
        }

        // AI Reports history store
        if (!db.objectStoreNames.contains('aiReports')) {
          db.createObjectStore('aiReports', { keyPath: 'id' });
        }

        // User preferences store
        if (!db.objectStoreNames.contains('userPreferences')) {
          db.createObjectStore('userPreferences', { keyPath: 'id' });
        }

        // Contacts store
        if (!db.objectStoreNames.contains('contacts')) {
          db.createObjectStore('contacts', { keyPath: 'id' });
        }

        // Settlements store
        if (!db.objectStoreNames.contains('settlements')) {
          const setStore = db.createObjectStore('settlements', { keyPath: 'id' });
          setStore.createIndex('by-contactId', 'contactId');
          setStore.createIndex('by-date', 'date');
        }

        // Tombstones store (version 3)
        if (!db.objectStoreNames.contains('tombstones')) {
          const tombStore = db.createObjectStore('tombstones', { keyPath: 'id' });
          tombStore.createIndex('by-store', 'store');
          tombStore.createIndex('by-deletedAt', 'deletedAt');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Lossless one-time migration from localStorage (v2 and v1 prefixes) to IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<boolean> {
  try {
    const db = await getDB();
    const prefixes = ['dhanveda_finances_v2_', 'dhanveda_finances_v1_'];
    let migratedCount = 0;

    for (const prefix of prefixes) {
      // 1. Transactions
      const txKey = `${prefix}transactions`;
      const rawTx = localStorage.getItem(txKey);
      if (rawTx) {
        try {
          const parsed = JSON.parse(rawTx);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const tx = db.transaction('transactions', 'readwrite');
            for (const item of parsed) {
              if (item && item.id) {
                await tx.store.put(item);
              }
            }
            await tx.done;
          }
          localStorage.removeItem(txKey);
          migratedCount++;
        } catch (e) {
          console.error(`[DB Migration] Failed parsing ${txKey}:`, e);
        }
      }

      // 2. Categories
      const catKey = `${prefix}categories`;
      const rawCat = localStorage.getItem(catKey);
      if (rawCat) {
        try {
          const parsed = JSON.parse(rawCat);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const tx = db.transaction('categories', 'readwrite');
            for (const item of parsed) {
              if (item && item.id) {
                await tx.store.put(item);
              }
            }
            await tx.done;
          }
          localStorage.removeItem(catKey);
          migratedCount++;
        } catch (e) {
          console.error(`[DB Migration] Failed parsing ${catKey}:`, e);
        }
      }

      // 3. Budgets
      const bKey = `${prefix}budgets`;
      const rawBudgets = localStorage.getItem(bKey);
      if (rawBudgets) {
        try {
          const parsed = JSON.parse(rawBudgets);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const tx = db.transaction('budgets', 'readwrite');
            for (const item of parsed) {
              if (item && item.id) {
                await tx.store.put(item);
              }
            }
            await tx.done;
          }
          localStorage.removeItem(bKey);
          migratedCount++;
        } catch (e) {
          console.error(`[DB Migration] Failed parsing ${bKey}:`, e);
        }
      }

      // 4. Emergency Fund
      const emKey = `${prefix}emergency_fund`;
      const rawEm = localStorage.getItem(emKey);
      if (rawEm) {
        try {
          const parsed = JSON.parse(rawEm);
          if (parsed && typeof parsed === 'object') {
            await db.put('emergencyFund', { ...parsed, id: 'current' });
          }
          localStorage.removeItem(emKey);
          migratedCount++;
        } catch (e) {
          console.error(`[DB Migration] Failed parsing ${emKey}:`, e);
        }
      }

      // 5. Investments
      const invKey = `${prefix}investments`;
      const rawInv = localStorage.getItem(invKey);
      if (rawInv) {
        try {
          const parsed = JSON.parse(rawInv);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const tx = db.transaction('investments', 'readwrite');
            for (const item of parsed) {
              if (item && item.id) {
                await tx.store.put(item);
              }
            }
            await tx.done;
          }
          localStorage.removeItem(invKey);
          migratedCount++;
        } catch (e) {
          console.error(`[DB Migration] Failed parsing ${invKey}:`, e);
        }
      }

      // 6. Dreams
      const dreamKey = `${prefix}dreams`;
      const rawDreams = localStorage.getItem(dreamKey);
      if (rawDreams) {
        try {
          const parsed = JSON.parse(rawDreams);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const tx = db.transaction('dreams', 'readwrite');
            for (const item of parsed) {
              if (item && item.id) {
                await tx.store.put(item);
              }
            }
            await tx.done;
          }
          localStorage.removeItem(dreamKey);
          migratedCount++;
        } catch (e) {
          console.error(`[DB Migration] Failed parsing ${dreamKey}:`, e);
        }
      }

      // 7. AI Settings
      const aiSetKey = `${prefix}ai_settings`;
      const rawAISet = localStorage.getItem(aiSetKey);
      if (rawAISet) {
        try {
          const parsed = JSON.parse(rawAISet);
          if (parsed && typeof parsed === 'object') {
            await db.put('aiSettings', { ...parsed, id: 'current' });
          }
          localStorage.removeItem(aiSetKey);
          migratedCount++;
        } catch (e) {
          console.error(`[DB Migration] Failed parsing ${aiSetKey}:`, e);
        }
      }

      // 8. AI Reports
      const aiRepKey = `${prefix}ai_reports`;
      const rawAIRep = localStorage.getItem(aiRepKey);
      if (rawAIRep) {
        try {
          const parsed = JSON.parse(rawAIRep);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const tx = db.transaction('aiReports', 'readwrite');
            for (const item of parsed) {
              if (item && item.id) {
                await tx.store.put(item);
              }
            }
            await tx.done;
          }
          localStorage.removeItem(aiRepKey);
          migratedCount++;
        } catch (e) {
          console.error(`[DB Migration] Failed parsing ${aiRepKey}:`, e);
        }
      }

      // 9. Dark Mode Preference
      const darkKey = `${prefix}dark_mode`;
      const rawDark = localStorage.getItem(darkKey);
      if (rawDark !== null) {
        try {
          const isDark = JSON.parse(rawDark);
          const currentPrefs = (await db.get('userPreferences', 'general')) || {
            id: 'general',
            darkMode: Boolean(isDark),
            notRecurringTxIds: [],
          };
          await db.put('userPreferences', { ...currentPrefs, darkMode: Boolean(isDark) });
          localStorage.removeItem(darkKey);
          migratedCount++;
        } catch (e) {
          console.error(`[DB Migration] Failed parsing ${darkKey}:`, e);
        }
      }
    }

    // Also run split data normalization
    await normalizeSplitData();

    return migratedCount > 0;
  } catch (error) {
    console.error('[DB Migration] Overall migration encountered error:', error);
    return false;
  }
}

export async function normalizeSplitData(): Promise<void> {
  try {
    const db = await getDB();
    const txStore = db.transaction('transactions', 'readwrite');
    const allTxs = await txStore.store.getAll();

    const txToSplitEntryIdMap = new Map<string, string>();

    for (const tx of allTxs) {
      if (tx.splitWith && !Array.isArray(tx.splitWith) && typeof tx.splitWith === 'object') {
        const oldSplit = tx.splitWith as any;
        const splitId = oldSplit.id || `split-${tx.id}-1`;
        tx.splitWith = [{
          id: splitId,
          contactId: oldSplit.contactId,
          label: oldSplit.label,
          amount: oldSplit.amount,
          direction: oldSplit.direction || 'they_owe_me',
          settled: Boolean(oldSplit.settled),
        }];
        txToSplitEntryIdMap.set(tx.id, splitId);
        await txStore.store.put(tx);
      } else if (Array.isArray(tx.splitWith) && tx.splitWith.length > 0) {
        if (tx.splitWith[0]?.id) {
          txToSplitEntryIdMap.set(tx.id, tx.splitWith[0].id);
        }
      }
    }
    await txStore.done;

    const setStore = db.transaction('settlements', 'readwrite');
    const allSets = await setStore.store.getAll();
    for (const s of allSets) {
      if (s.sourceTransactionId && !s.sourceSplitEntryId) {
        const mappedSplitId = txToSplitEntryIdMap.get(s.sourceTransactionId);
        if (mappedSplitId) {
          s.sourceSplitEntryId = mappedSplitId;
          await setStore.store.put(s);
        }
      }
    }
    await setStore.done;
  } catch (e) {
    console.error('[DB Migration] normalizeSplitData error:', e);
  }
}

// Storage helpers
export async function getAllFromStore<T>(
  storeName: 'transactions' | 'categories' | 'budgets' | 'investments' | 'dreams' | 'aiReports' | 'contacts' | 'settlements'
): Promise<T[]> {
  const db = await getDB();
  return (await db.getAll(storeName)) as T[];
}

export async function saveAllToStore<T extends { id: string }>(
  storeName: 'transactions' | 'categories' | 'budgets' | 'investments' | 'dreams' | 'aiReports' | 'contacts' | 'settlements',
  items: T[]
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');
  await tx.store.clear();
  for (const item of items) {
    if (item && item.id) {
      await tx.store.put(item as any);
    }
  }
  await tx.done;
}

export async function getSingleRecord<T>(
  storeName: 'emergencyFund' | 'aiSettings' | 'userPreferences',
  id = 'current'
): Promise<T | undefined> {
  const db = await getDB();
  return (await db.get(storeName, id)) as T | undefined;
}

export async function saveSingleRecord<T extends { id: string }>(
  storeName: 'emergencyFund' | 'aiSettings' | 'userPreferences',
  data: T
): Promise<void> {
  const db = await getDB();
  await db.put(storeName, data as any);
}

export async function clearAllStores(): Promise<void> {
  const db = await getDB();
  await Promise.all([
    db.clear('transactions'),
    db.clear('budgets'),
    db.clear('investments'),
    db.clear('dreams'),
    db.clear('aiReports'),
    db.clear('contacts'),
    db.clear('settlements'),
    db.put('emergencyFund', {
      id: 'current',
      targetMonths: 6,
      monthlyExpenseBaseline: 50000,
      currentSaved: 0,
      contributions: [],
    }),
  ]);
}

/**
 * Record a tombstone when a record is deleted so the deletion propagates across devices during sync.
 */
export async function addTombstone(store: SyncableStoreName, id: string): Promise<void> {
  try {
    const db = await getDB();
    const tombstone: TombstoneRecord = {
      id,
      store,
      deletedAt: new Date().toISOString(),
    };
    await db.put('tombstones', tombstone);
  } catch (err) {
    console.error('[DB] Error recording tombstone:', err);
  }
}

/**
 * Get all active tombstones from IndexedDB.
 */
export async function getTombstones(): Promise<TombstoneRecord[]> {
  try {
    const db = await getDB();
    return await db.getAll('tombstones');
  } catch (err) {
    console.error('[DB] Error getting tombstones:', err);
    return [];
  }
}

/**
 * Save merged tombstones to IndexedDB.
 */
export async function saveTombstones(records: TombstoneRecord[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('tombstones', 'readwrite');
    for (const record of records) {
      if (record && record.id) {
        await tx.store.put(record);
      }
    }
    await tx.done;
  } catch (err) {
    console.error('[DB] Error saving tombstones:', err);
  }
}

/**
 * Purge tombstones older than the retention window (defaults to 90 days).
 */
export async function purgeOldTombstones(retentionDays = 90): Promise<void> {
  try {
    const db = await getDB();
    const cutoffTime = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
    const allTombstones = await db.getAll('tombstones');
    const tx = db.transaction('tombstones', 'readwrite');
    for (const t of allTombstones) {
      if (t.deletedAt < cutoffTime) {
        await tx.store.delete(t.id);
      }
    }
    await tx.done;
  } catch (err) {
    console.error('[DB] Error purging old tombstones:', err);
  }
}

/**
 * Generates and returns a persistent unique Device ID for this client installation.
 * Used for deterministic tie-breaking in Last-Write-Wins merge.
 */
export function getDeviceId(): string {
  const STORAGE_KEY = 'dhanveda_device_id';
  let deviceId = localStorage.getItem(STORAGE_KEY);
  if (!deviceId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      deviceId = crypto.randomUUID();
    } else {
      deviceId = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
    }
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  return deviceId;
}

