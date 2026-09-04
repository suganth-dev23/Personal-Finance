import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  ContactBalance,
  SyncStatus,
} from '../types/finance';
import {
  DEFAULT_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_EMERGENCY_FUND,
  INITIAL_INVESTMENTS,
  INITIAL_DREAMS,
} from '../utils/sampleData';
import { getCurrentMonthYear } from '../utils/date';
import { DEFAULT_AI_MODELS, FinancialAggregates } from '../services/aiService';
import {
  migrateFromLocalStorage,
  getAllFromStore,
  saveAllToStore,
  getSingleRecord,
  saveSingleRecord,
  clearAllStores,
  addTombstone,
  UserPreferences,
} from '../utils/db';
import { googleAuthService } from '../services/googleAuth';
import { driveSyncService } from '../services/driveSync';

export type AppView = 
  | 'dashboard'
  | 'transactions'
  | 'budgets'
  | 'categories'
  | 'emergency'
  | 'investments'
  | 'dreams'
  | 'people'
  | 'ai'
  | 'import'
  | 'settings';

interface FinanceContextType {
  // State
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  isInitialized: boolean;
  
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  emergencyFund: EmergencyFund;
  investments: Investment[];
  dreams: DreamGoal[];
  contacts: Contact[];
  settlements: SettlementRecord[];
  aiSettings: AISettings;
  aiReports: AIHealthReport[];
  notRecurringTxIds: Set<string>;
  toggleNotRecurring: (txId: string) => void;

  // Google Drive Cross-Device Sync
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  syncError: string | null;
  isDriveConnected: boolean;
  driveUserEmail: string | null;
  triggerSync: (showFeedback?: boolean) => Promise<boolean>;
  connectDrive: () => Promise<boolean>;
  disconnectDrive: () => Promise<void>;
  reloadFromDB: () => Promise<void>;

  // Transactions CRUD
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  addMultipleTransactions: (txs: Omit<Transaction, 'id' | 'createdAt'>[]) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  deleteMultipleTransactions: (ids: string[]) => void;

  // Contacts & Splits CRUD
  addContact: (contact: Omit<Contact, 'id' | 'createdAt'>) => Contact;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  recordSettlement: (
    contactId: string,
    amount: number,
    note?: string,
    date?: string,
    sourceTransactionId?: string,
    sourceSplitEntryId?: string,
    linkedTransactionId?: string
  ) => SettlementRecord;
  updateSettlement: (id: string, updated: Partial<SettlementRecord>) => void;
  deleteSettlement: (id: string) => void;
  linkSettlementToTransaction: (settlementId: string, transactionId?: string) => void;
  quickToggleSettleTransaction: (transactionId: string, splitEntryId?: string) => SettlementRecord | undefined;
  settleSplitEntry: (
    transactionId: string,
    splitEntryId: string,
    options: {
      settled: boolean;
      settledAmount?: number;
      linkedTransactionId?: string;
      note?: string;
      date?: string;
    }
  ) => SettlementRecord | undefined;

  // Categories CRUD
  addCategory: (cat: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, cat: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Budgets CRUD
  setBudgetForCategory: (category: string, monthlyLimit: number) => void;
  deleteBudget: (id: string) => void;

  // Emergency Fund
  updateEmergencySettings: (targetMonths: number, manualTargetAmount?: number) => void;
  addEmergencyContribution: (amount: number, type: 'deposit' | 'withdrawal', note?: string, date?: string) => void;

  // Investments CRUD
  addInvestment: (inv: Omit<Investment, 'id' | 'lastUpdated'>) => Investment;
  updateInvestment: (id: string, inv: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;

  // Dreams CRUD
  addDream: (dream: Omit<DreamGoal, 'id' | 'createdAt' | 'contributions' | 'currentSaved'> & { initialSaved?: number }) => DreamGoal;
  updateDream: (id: string, dream: Partial<DreamGoal>) => void;
  deleteDream: (id: string) => void;
  addDreamContribution: (dreamId: string, amount: number, note?: string, date?: string) => void;

  // AI
  updateAISettings: (settings: Partial<AISettings>) => void;
  saveAIReport: (report: Omit<AIHealthReport, 'id' | 'createdAt'>) => void;
  deleteAIReport: (id: string) => void;

  // Backup & Reset
  resetToDemoData: () => void;
  clearAllData: () => void;
  exportBackupJSON: () => string;
  importBackupJSON: (jsonStr: string) => boolean;

  // Calculated Metrics
  totalBalance: number;
  currentMonthIncome: number;
  currentMonthExpense: number;
  currentMonthNet: number;
  currentMonthSavingsRate: number;
  totalInvestedAmount: number;
  totalInvestmentValue: number;
  totalInvestmentGainLoss: number;
  totalInvestmentGainLossPct: number;
  emergencyFundRunwayMonths: number;
  totalGoalsTarget: number;
  totalGoalsSaved: number;
  contactBalances: ContactBalance[];
  totalOwedToMe: number;
  totalIOwe: number;
  categorySpendingThisMonth: { category: string; spent: number; budget: number; percentUsed: number; color: string; icon: string }[];
  getAggregatesForAI: () => FinancialAggregates;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const EMPTY_EMERGENCY_FUND: EmergencyFund = {
  targetMonths: 6,
  monthlyExpenseBaseline: 50000,
  currentSaved: 0,
  contributions: [],
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('dhanveda_dark_mode') : null;
    if (saved !== null) {
      return saved === 'true';
    }
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund>(EMPTY_EMERGENCY_FUND);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [dreams, setDreams] = useState<DreamGoal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [notRecurringTxIds, setNotRecurringTxIds] = useState<Set<string>>(new Set());

  const [aiSettings, setAISettings] = useState<AISettings>({
    provider: 'gemini',
    apiKey: '',
    model: DEFAULT_AI_MODELS.gemini,
  });

  const [aiReports, setAIReports] = useState<AIHealthReport[]>([]);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('disconnected');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(driveSyncService.getLastSyncedAt());
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(false);
  const [driveUserEmail, setDriveUserEmail] = useState<string | null>(null);

  // Reload all records from IndexedDB into React state
  const reloadFromDB = useCallback(async () => {
    try {
      const [
        dbTx,
        dbCat,
        dbBudgets,
        dbEm,
        dbInv,
        dbDreams,
        dbContacts,
        dbSettlements,
        dbAiSet,
        dbAiReports,
        dbPrefs,
      ] = await Promise.all([
        getAllFromStore<Transaction>('transactions'),
        getAllFromStore<Category>('categories'),
        getAllFromStore<Budget>('budgets'),
        getSingleRecord<EmergencyFund & { id: string }>('emergencyFund'),
        getAllFromStore<Investment>('investments'),
        getAllFromStore<DreamGoal>('dreams'),
        getAllFromStore<Contact>('contacts'),
        getAllFromStore<SettlementRecord>('settlements'),
        getSingleRecord<AISettings & { id: string }>('aiSettings'),
        getAllFromStore<AIHealthReport>('aiReports'),
        getSingleRecord<UserPreferences>('userPreferences', 'general'),
      ]);

      if (dbTx && Array.isArray(dbTx)) {
        const normalized = dbTx.map(t => {
          if (t.splitWith && !Array.isArray(t.splitWith) && typeof t.splitWith === 'object') {
            const single = t.splitWith as any;
            return {
              ...t,
              splitWith: [{
                id: single.id || `split-${t.id}-1`,
                contactId: single.contactId,
                label: single.label,
                amount: single.amount,
                direction: single.direction || 'they_owe_me',
                settled: Boolean(single.settled),
              }],
            };
          }
          return t;
        });
        setTransactions(normalized);
      }
      if (dbCat && Array.isArray(dbCat) && dbCat.length > 0) setCategories(dbCat);
      if (dbBudgets && Array.isArray(dbBudgets)) setBudgets(dbBudgets);
      if (dbEm) {
        const { id: _id, ...cleanEm } = dbEm;
        setEmergencyFund(cleanEm);
      }
      if (dbInv && Array.isArray(dbInv)) setInvestments(dbInv);
      if (dbDreams && Array.isArray(dbDreams)) setDreams(dbDreams);
      if (dbContacts && Array.isArray(dbContacts)) setContacts(dbContacts);
      if (dbSettlements && Array.isArray(dbSettlements)) setSettlements(dbSettlements);
      if (dbAiSet) {
        const { id: _id, ...cleanAi } = dbAiSet;
        setAISettings({
          provider: cleanAi.provider || 'gemini',
          apiKey: cleanAi.apiKey || '',
          model: cleanAi.model || DEFAULT_AI_MODELS[cleanAi.provider || 'gemini'],
        });
      }
      if (dbAiReports && Array.isArray(dbAiReports)) setAIReports(dbAiReports);
      if (dbPrefs) {
        if (dbPrefs.darkMode !== undefined) setDarkMode(dbPrefs.darkMode);
        if (dbPrefs.notRecurringTxIds && Array.isArray(dbPrefs.notRecurringTxIds)) {
          setNotRecurringTxIds(new Set(dbPrefs.notRecurringTxIds));
        }
      }
    } catch (err) {
      console.error('[FinanceContext] Error reloading from IndexedDB:', err);
    }
  }, []);

  // Initial load from IndexedDB + migrate from localStorage if available
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        await migrateFromLocalStorage();
        if (isMounted) {
          await reloadFromDB();
        }
      } catch (err) {
        console.error('[FinanceContext] Error initializing IndexedDB:', err);
      } finally {
        if (isMounted) setIsInitialized(true);
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, [reloadFromDB]);

  // Sync methods
  const triggerSync = useCallback(async (showFeedback = true): Promise<boolean> => {
    try {
      const ok = await driveSyncService.sync();
      if (ok) {
        await reloadFromDB();
      }
      return ok;
    } catch (err: any) {
      console.error('[FinanceContext] triggerSync error:', err);
      return false;
    }
  }, [reloadFromDB]);

  const connectDrive = useCallback(async (): Promise<boolean> => {
    try {
      setSyncStatus('syncing');
      setSyncError(null);
      const token = await googleAuthService.requestAccessToken(true);
      if (token) {
        const ok = await triggerSync(true);
        return ok;
      }
      setSyncStatus('disconnected');
      return false;
    } catch (err: any) {
      console.error('[FinanceContext] connectDrive error:', err);
      setSyncError(err?.message || 'Failed to connect Google Drive');
      setSyncStatus('error');
      return false;
    }
  }, [triggerSync]);

  const disconnectDrive = useCallback(async (): Promise<void> => {
    await googleAuthService.disconnect();
    setSyncStatus('disconnected');
    setSyncError(null);
  }, []);

  // Subscriptions to Google Auth & Drive Sync
  useEffect(() => {
    return googleAuthService.subscribe((connected, profile) => {
      setIsDriveConnected(connected);
      setDriveUserEmail(profile?.email || null);
      if (!connected) {
        setSyncStatus(googleAuthService.hasClientId() ? 'disconnected' : 'unconfigured');
      }
    });
  }, []);

  useEffect(() => {
    return driveSyncService.subscribe((isSyncing, lastSync, error) => {
      setLastSyncedAt(lastSync);
      setSyncError(error);
      if (isSyncing) {
        setSyncStatus('syncing');
      } else if (error) {
        setSyncStatus('error');
      } else if (lastSync) {
        setSyncStatus('synced');
      } else if (googleAuthService.isConnected()) {
        setSyncStatus('idle');
      }
    });
  }, []);

  // Sync Triggers: on app start (if enabled)
  useEffect(() => {
    if (!isInitialized) return;
    if (googleAuthService.isSyncEnabled()) {
      triggerSync(false);
    }
  }, [isInitialized, triggerSync]);

  // Sync Triggers: on network back online
  useEffect(() => {
    const handleOnline = () => {
      if (googleAuthService.isSyncEnabled()) {
        triggerSync(false);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [triggerSync]);

  // Sync Triggers: every 3 minutes if tab is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        document.visibilityState === 'visible' &&
        navigator.onLine &&
        googleAuthService.isSyncEnabled() &&
        !driveSyncService.isSyncing()
      ) {
        triggerSync(false);
      }
    }, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [triggerSync]);

  // Sync to IndexedDB once initialized
  useEffect(() => {
    if (!isInitialized) return;
    saveAllToStore('transactions', transactions).catch(e => console.error('Error saving transactions:', e));
  }, [transactions, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    saveAllToStore('categories', categories).catch(e => console.error('Error saving categories:', e));
  }, [categories, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    saveAllToStore('budgets', budgets).catch(e => console.error('Error saving budgets:', e));
  }, [budgets, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    saveSingleRecord('emergencyFund', { ...emergencyFund, id: 'current' }).catch(e => console.error('Error saving emergency fund:', e));
  }, [emergencyFund, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    saveAllToStore('investments', investments).catch(e => console.error('Error saving investments:', e));
  }, [investments, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    saveAllToStore('dreams', dreams).catch(e => console.error('Error saving dreams:', e));
  }, [dreams, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    saveAllToStore('contacts', contacts).catch(e => console.error('Error saving contacts:', e));
  }, [contacts, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    saveAllToStore('settlements', settlements).catch(e => console.error('Error saving settlements:', e));
  }, [settlements, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    saveSingleRecord('aiSettings', { ...aiSettings, id: 'current' }).catch(e => console.error('Error saving AI settings:', e));
  }, [aiSettings, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    saveAllToStore('aiReports', aiReports).catch(e => console.error('Error saving AI reports:', e));
  }, [aiReports, isInitialized]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dhanveda_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dhanveda_dark_mode', 'false');
    }
    if (isInitialized) {
      saveSingleRecord('userPreferences', {
        id: 'general',
        darkMode,
        notRecurringTxIds: Array.from(notRecurringTxIds),
        updatedAt: new Date().toISOString(),
      }).catch(e => console.error('Error saving user preferences:', e));
    }
  }, [darkMode, notRecurringTxIds, isInitialized]);

  const toggleNotRecurring = (txId: string) => {
    setNotRecurringTxIds(prev => {
      const next = new Set(prev);
      if (next.has(txId)) {
        next.delete(txId);
      } else {
        next.add(txId);
      }
      return next;
    });
  };

  // Transaction operations
  const addTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>): Transaction => {
    const now = new Date().toISOString();
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    setTransactions(prev => [newTx, ...prev]);
    return newTx;
  };

  const addMultipleTransactions = (txsData: Omit<Transaction, 'id' | 'createdAt'>[]) => {
    const timestamp = Date.now();
    const now = new Date().toISOString();
    const newTxs: Transaction[] = txsData.map((t, idx) => ({
      ...t,
      id: `tx-${timestamp}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      createdAt: now,
      updatedAt: now,
    }));
    setTransactions(prev => [...newTxs, ...prev]);
  };

  const updateTransaction = (id: string, updated: Partial<Transaction>) => {
    setTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updated, updatedAt: new Date().toISOString() } : t))
    );
  };

  const deleteTransaction = (id: string) => {
    addTombstone('transactions', id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    // Clean up any auto-settlements tied to this transaction
    setSettlements(prev => prev.filter(s => s.sourceTransactionId !== id));
  };

  const deleteMultipleTransactions = (ids: string[]) => {
    ids.forEach(id => addTombstone('transactions', id));
    const set = new Set(ids);
    setTransactions(prev => prev.filter(t => !set.has(t.id)));
    setSettlements(prev => prev.filter(s => !s.sourceTransactionId || !set.has(s.sourceTransactionId)));
  };

  // Contact CRUD operations
  const addContact = (contactData: Omit<Contact, 'id' | 'createdAt'>): Contact => {
    const now = new Date().toISOString();
    const newContact: Contact = {
      ...contactData,
      id: `contact-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now.split('T')[0],
      updatedAt: now,
    };
    setContacts(prev => [...prev, newContact]);
    return newContact;
  };

  const updateContact = (id: string, updated: Partial<Contact>) => {
    setContacts(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updated, updatedAt: new Date().toISOString() } : c))
    );
  };

  const deleteContact = (id: string) => {
    addTombstone('contacts', id);
    setContacts(prev => prev.filter(c => c.id !== id));
    setSettlements(prev => prev.filter(s => s.contactId !== id));
    setTransactions(prev =>
      prev.map(t => {
        if (!t.splitWith || !Array.isArray(t.splitWith)) return t;
        const updatedSplits = t.splitWith.map(s =>
          s.contactId === id ? { ...s, contactId: undefined, label: s.label || 'Former Contact' } : s
        );
        return { ...t, splitWith: updatedSplits, updatedAt: new Date().toISOString() };
      })
    );
  };

  const recordSettlement = (
    contactId: string,
    amount: number,
    note?: string,
    date?: string,
    sourceTransactionId?: string,
    sourceSplitEntryId?: string,
    linkedTransactionId?: string
  ): SettlementRecord => {
    const now = new Date().toISOString();
    const newSettlement: SettlementRecord = {
      id: `set-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      contactId,
      amount,
      date: date || now.split('T')[0],
      note: note || 'Settlement payment',
      createdAt: now,
      updatedAt: now,
      sourceTransactionId,
      sourceSplitEntryId,
      linkedTransactionId,
    };
    setSettlements(prev => [newSettlement, ...prev]);
    return newSettlement;
  };

  const deleteSettlement = (id: string) => {
    addTombstone('settlements', id);
    setSettlements(prev => prev.filter(s => s.id !== id));
  };

  const updateSettlement = (id: string, updated: Partial<SettlementRecord>) => {
    setSettlements(prev =>
      prev.map(s => (s.id === id ? { ...s, ...updated, updatedAt: new Date().toISOString() } : s))
    );
  };

  const linkSettlementToTransaction = (settlementId: string, transactionId?: string) => {
    setSettlements(prev =>
      prev.map(s =>
        s.id === settlementId
          ? { ...s, linkedTransactionId: transactionId || undefined, updatedAt: new Date().toISOString() }
          : s
      )
    );
  };

  const quickToggleSettleTransaction = (
    transactionId: string,
    splitEntryId?: string
  ): SettlementRecord | undefined => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx || !tx.splitWith || !Array.isArray(tx.splitWith)) return undefined;

    const targetEntryId = splitEntryId || tx.splitWith[0]?.id;
    if (!targetEntryId) return undefined;

    const targetEntry = tx.splitWith.find(e => e.id === targetEntryId);
    if (!targetEntry) return undefined;

    const isCurrentlySettled = Boolean(targetEntry.settled);
    const now = new Date().toISOString();

    if (!isCurrentlySettled) {
      // 1. Mark that specific splitEntry as settled
      const updatedSplits = tx.splitWith.map(e =>
        e.id === targetEntryId ? { ...e, settled: true } : e
      );
      updateTransaction(transactionId, { splitWith: updatedSplits, updatedAt: now });

      // 2. If it is attached to a contact, record SettlementRecord
      if (targetEntry.contactId) {
        const newSettlement: SettlementRecord = {
          id: `set-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          contactId: targetEntry.contactId,
          date: now.split('T')[0],
          amount: targetEntry.amount,
          note: `Quick settlement for "${tx.description}"`,
          createdAt: now,
          updatedAt: now,
          sourceTransactionId: transactionId,
          sourceSplitEntryId: targetEntryId,
        };
        setSettlements(prev => [newSettlement, ...prev]);
        return newSettlement;
      }
      return undefined;
    } else {
      // 1. Mark that specific splitEntry as unsettled
      const updatedSplits = tx.splitWith.map(e =>
        e.id === targetEntryId ? { ...e, settled: false } : e
      );
      updateTransaction(transactionId, { splitWith: updatedSplits, updatedAt: now });

      // 2. Remove the auto-created settlement record
      const toDelete = settlements.find(
        s =>
          s.sourceTransactionId === transactionId &&
          (s.sourceSplitEntryId === targetEntryId || !s.sourceSplitEntryId)
      );
      if (toDelete) {
        addTombstone('settlements', toDelete.id);
      }
      setSettlements(prev =>
        prev.filter(
          s =>
            !(
              s.sourceTransactionId === transactionId &&
              (s.sourceSplitEntryId === targetEntryId || !s.sourceSplitEntryId)
            )
        )
      );
      return undefined;
    }
  };

  const settleSplitEntry = (
    transactionId: string,
    splitEntryId: string,
    options: {
      settled: boolean;
      settledAmount?: number;
      linkedTransactionId?: string;
      note?: string;
      date?: string;
    }
  ): SettlementRecord | undefined => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx || !tx.splitWith || !Array.isArray(tx.splitWith)) return undefined;

    const targetEntry = tx.splitWith.find(e => e.id === splitEntryId);
    if (!targetEntry) return undefined;
    const now = new Date().toISOString();

    if (options.settled) {
      const finalSettledAmount =
        options.settledAmount !== undefined ? options.settledAmount : targetEntry.amount;
      const isFull = finalSettledAmount >= targetEntry.amount - 0.001;

      const updatedSplits = tx.splitWith.map(e =>
        e.id === splitEntryId
          ? {
              ...e,
              settled: isFull,
              settledAmount: finalSettledAmount,
              linkedTransactionId: options.linkedTransactionId || undefined,
            }
          : e
      );
      updateTransaction(transactionId, { splitWith: updatedSplits, updatedAt: now });

      if (targetEntry.contactId) {
        // Check if a settlement record already exists for this split
        const existingSettlement = settlements.find(
          s =>
            s.sourceTransactionId === transactionId &&
            s.sourceSplitEntryId === splitEntryId
        );

        if (existingSettlement) {
          const updatedRecord: SettlementRecord = {
            ...existingSettlement,
            amount: finalSettledAmount,
            date: options.date || existingSettlement.date,
            note: options.note || existingSettlement.note,
            linkedTransactionId: options.linkedTransactionId || undefined,
            updatedAt: now,
          };
          updateSettlement(existingSettlement.id, updatedRecord);
          return updatedRecord;
        } else {
          const newSettlement: SettlementRecord = {
            id: `set-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            contactId: targetEntry.contactId,
            date: options.date || now.split('T')[0],
            amount: finalSettledAmount,
            note: options.note || `Settlement for "${tx.description}"`,
            createdAt: now,
            updatedAt: now,
            sourceTransactionId: transactionId,
            sourceSplitEntryId: splitEntryId,
            linkedTransactionId: options.linkedTransactionId || undefined,
          };
          setSettlements(prev => [newSettlement, ...prev]);
          return newSettlement;
        }
      }
      return undefined;
    } else {
      // Unsettle
      const updatedSplits = tx.splitWith.map(e =>
        e.id === splitEntryId
          ? {
              ...e,
              settled: false,
              settledAmount: 0,
              linkedTransactionId: undefined,
            }
          : e
      );
      updateTransaction(transactionId, { splitWith: updatedSplits, updatedAt: now });

      // Remove auto-created settlement record
      const toDelete = settlements.find(
        s =>
          s.sourceTransactionId === transactionId &&
          (s.sourceSplitEntryId === splitEntryId || !s.sourceSplitEntryId)
      );
      if (toDelete) {
        addTombstone('settlements', toDelete.id);
      }
      setSettlements(prev =>
        prev.filter(
          s =>
            !(
              s.sourceTransactionId === transactionId &&
              (s.sourceSplitEntryId === splitEntryId || !s.sourceSplitEntryId)
            )
        )
      );
      return undefined;
    }
  };

  // Category operations
  const addCategory = (catData: Omit<Category, 'id'>): Category => {
    const now = new Date().toISOString();
    const newCat: Category = {
      ...catData,
      id: `cat-${Date.now()}`,
      isCustom: true,
      updatedAt: now,
    };
    setCategories(prev => [...prev, newCat]);
    return newCat;
  };

  const updateCategory = (id: string, updated: Partial<Category>) => {
    setCategories(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updated, updatedAt: new Date().toISOString() } : c))
    );
  };

  const deleteCategory = (id: string) => {
    addTombstone('categories', id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Budget operations
  const setBudgetForCategory = (category: string, monthlyLimit: number) => {
    const now = new Date().toISOString();
    setBudgets(prev => {
      const existingIdx = prev.findIndex(b => b.category.toLowerCase() === category.toLowerCase());
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], monthlyLimit, updatedAt: now };
        return next;
      } else {
        return [...prev, { id: `b-${Date.now()}`, category, monthlyLimit, updatedAt: now }];
      }
    });
  };

  const deleteBudget = (id: string) => {
    addTombstone('budgets', id);
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  // Emergency Fund operations
  const updateEmergencySettings = (targetMonths: number, manualTargetAmount?: number) => {
    setEmergencyFund(prev => ({
      ...prev,
      targetMonths,
      manualTargetAmount,
      updatedAt: new Date().toISOString(),
    }));
  };

  const addEmergencyContribution = (
    amount: number,
    type: 'deposit' | 'withdrawal',
    note?: string,
    date?: string
  ) => {
    const now = new Date().toISOString();
    const today = date || now.split('T')[0];
    const newContribution = {
      id: `em-${Date.now()}`,
      date: today,
      amount,
      type,
      note: note || (type === 'deposit' ? 'Emergency Fund Deposit' : 'Emergency Fund Withdrawal'),
      createdAt: now,
      updatedAt: now,
    };

    setEmergencyFund(prev => {
      const newSaved = type === 'deposit' ? prev.currentSaved + amount : Math.max(0, prev.currentSaved - amount);
      return {
        ...prev,
        currentSaved: newSaved,
        contributions: [newContribution, ...prev.contributions],
        updatedAt: now,
      };
    });
  };

  // Investments operations
  const addInvestment = (invData: Omit<Investment, 'id' | 'lastUpdated'>): Investment => {
    const now = new Date().toISOString();
    const newInv: Investment = {
      ...invData,
      id: `inv-${Date.now()}`,
      lastUpdated: now.split('T')[0],
      updatedAt: now,
      logs: [
        {
          id: `log-${Date.now()}`,
          date: now.split('T')[0],
          investedDelta: invData.investedAmount,
          valueDelta: invData.currentValue,
          note: 'Initial holding created',
        },
      ],
    };
    setInvestments(prev => [newInv, ...prev]);
    return newInv;
  };

  const updateInvestment = (id: string, updated: Partial<Investment>) => {
    const now = new Date().toISOString();
    setInvestments(prev =>
      prev.map(i =>
        i.id === id
          ? {
              ...i,
              ...updated,
              lastUpdated: now.split('T')[0],
              updatedAt: now,
            }
          : i
      )
    );
  };

  const deleteInvestment = (id: string) => {
    addTombstone('investments', id);
    setInvestments(prev => prev.filter(i => i.id !== id));
  };

  // Dreams operations
  const addDream = (
    dreamData: Omit<DreamGoal, 'id' | 'createdAt' | 'contributions' | 'currentSaved'> & {
      initialSaved?: number;
    }
  ): DreamGoal => {
    const now = new Date().toISOString();
    const initialSaved = dreamData.initialSaved || 0;
    const today = now.split('T')[0];
    const newDream: DreamGoal = {
      id: `dream-${Date.now()}`,
      name: dreamData.name,
      targetAmount: dreamData.targetAmount,
      currentSaved: initialSaved,
      targetDate: dreamData.targetDate,
      category: dreamData.category || 'General',
      icon: dreamData.icon || 'Target',
      color: dreamData.color || '#3b82f6',
      priority: dreamData.priority || 'medium',
      createdAt: today,
      updatedAt: now,
      contributions: initialSaved > 0 ? [
        {
          id: `dc-${Date.now()}`,
          date: today,
          amount: initialSaved,
          note: 'Initial contribution',
          createdAt: now,
        }
      ] : [],
    };
    setDreams(prev => [newDream, ...prev]);
    return newDream;
  };

  const updateDream = (id: string, updated: Partial<DreamGoal>) => {
    setDreams(prev =>
      prev.map(d => (d.id === id ? { ...d, ...updated, updatedAt: new Date().toISOString() } : d))
    );
  };

  const deleteDream = (id: string) => {
    addTombstone('dreams', id);
    setDreams(prev => prev.filter(d => d.id !== id));
  };

  const addDreamContribution = (dreamId: string, amount: number, note?: string, date?: string) => {
    const now = new Date().toISOString();
    const today = date || now.split('T')[0];
    const newContribution = {
      id: `dc-${Date.now()}`,
      date: today,
      amount,
      note: note || 'Goal Contribution',
      createdAt: now,
      updatedAt: now,
    };

    setDreams(prev =>
      prev.map(d => {
        if (d.id === dreamId) {
          return {
            ...d,
            currentSaved: d.currentSaved + amount,
            contributions: [newContribution, ...(d.contributions || [])],
            updatedAt: now,
          };
        }
        return d;
      })
    );
  };

  // AI Settings
  const updateAISettings = (settings: Partial<AISettings>) => {
    setAISettings(prev => {
      const provider = settings.provider || prev.provider;
      const resolvedModel = settings.model || DEFAULT_AI_MODELS[provider];
      return {
        ...prev,
        ...settings,
        provider,
        model: resolvedModel,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const saveAIReport = (reportData: Omit<AIHealthReport, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const newReport: AIHealthReport = {
      ...reportData,
      id: `rep-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setAIReports(prev => [newReport, ...prev]);
  };

  const deleteAIReport = (id: string) => {
    addTombstone('aiReports', id);
    setAIReports(prev => prev.filter(r => r.id !== id));
  };

  // Reset & Backup
  const resetToDemoData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setCategories(DEFAULT_CATEGORIES);
    setBudgets(INITIAL_BUDGETS);
    setEmergencyFund(INITIAL_EMERGENCY_FUND);
    setInvestments(INITIAL_INVESTMENTS);
    setDreams(INITIAL_DREAMS);
    setContacts([]);
    setSettlements([]);
  };

  const clearAllData = async () => {
    setTransactions([]);
    setBudgets([]);
    setInvestments([]);
    setDreams([]);
    setContacts([]);
    setSettlements([]);
    setAIReports([]);
    setEmergencyFund(EMPTY_EMERGENCY_FUND);
    setNotRecurringTxIds(new Set());
    await clearAllStores();
  };

  const exportBackupJSON = (): string => {
    const backupData = {
      version: '2.1',
      exportedAt: new Date().toISOString(),
      transactions,
      categories,
      budgets,
      emergencyFund,
      investments,
      dreams,
      contacts,
      settlements,
      aiReports,
      userPreferences: {
        darkMode,
        notRecurringTxIds: Array.from(notRecurringTxIds),
      },
    };
    return JSON.stringify(backupData, null, 2);
  };

  const importBackupJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (Array.isArray(data.categories)) setCategories(data.categories);
      if (Array.isArray(data.budgets)) setBudgets(data.budgets);
      if (data.emergencyFund) setEmergencyFund(data.emergencyFund);
      if (Array.isArray(data.investments)) setInvestments(data.investments);
      if (Array.isArray(data.dreams)) setDreams(data.dreams);
      if (Array.isArray(data.contacts)) setContacts(data.contacts);
      if (Array.isArray(data.settlements)) setSettlements(data.settlements);
      if (Array.isArray(data.aiReports)) setAIReports(data.aiReports);
      if (data.userPreferences) {
        if (data.userPreferences.darkMode !== undefined) setDarkMode(data.userPreferences.darkMode);
        if (Array.isArray(data.userPreferences.notRecurringTxIds)) {
          setNotRecurringTxIds(new Set(data.userPreferences.notRecurringTxIds));
        }
      }
      return true;
    } catch (e) {
      console.error('Failed to import backup JSON:', e);
      return false;
    }
  };

  // Calculated Metrics
  const totalBalance = useMemo(() => {
    return transactions.reduce((acc, t) => {
      return t.type === 'credit' ? acc + t.amount : acc - t.amount;
    }, 0);
  }, [transactions]);

  const { key: currentMonthKey, monthName: currentMonthName } = getCurrentMonthYear();

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(currentMonthKey));
  }, [transactions, currentMonthKey]);

  const currentMonthIncome = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'credit')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [currentMonthTransactions]);

  const currentMonthExpense = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'debit')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [currentMonthTransactions]);

  const currentMonthNet = currentMonthIncome - currentMonthExpense;
  const currentMonthSavingsRate = currentMonthIncome > 0 ? (currentMonthNet / currentMonthIncome) * 100 : 0;

  const totalInvestedAmount = useMemo(() => {
    return investments.reduce((acc, i) => acc + i.investedAmount, 0);
  }, [investments]);

  const totalInvestmentValue = useMemo(() => {
    return investments.reduce((acc, i) => acc + i.currentValue, 0);
  }, [investments]);

  const totalInvestmentGainLoss = totalInvestmentValue - totalInvestedAmount;
  const totalInvestmentGainLossPct = totalInvestedAmount > 0 ? (totalInvestmentGainLoss / totalInvestedAmount) * 100 : 0;

  const averageMonthlyExpenses = useMemo(() => {
    const monthExpensesMap: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type === 'debit') {
        const ym = t.date.substring(0, 7);
        monthExpensesMap[ym] = (monthExpensesMap[ym] || 0) + t.amount;
      }
    });

    const expenseValues = Object.values(monthExpensesMap);
    if (expenseValues.length === 0) return 50000;
    const sum = expenseValues.reduce((a, b) => a + b, 0);
    return sum / expenseValues.length;
  }, [transactions]);

  const effectiveMonthlyBaseline = emergencyFund.manualTargetAmount
    ? emergencyFund.manualTargetAmount / emergencyFund.targetMonths
    : averageMonthlyExpenses;

  const emergencyFundRunwayMonths = effectiveMonthlyBaseline > 0
    ? emergencyFund.currentSaved / effectiveMonthlyBaseline
    : 0;

  const totalGoalsTarget = useMemo(() => {
    return dreams.reduce((acc, d) => acc + d.targetAmount, 0);
  }, [dreams]);

  const totalGoalsSaved = useMemo(() => {
    return dreams.reduce((acc, d) => acc + d.currentSaved, 0);
  }, [dreams]);

  // Derived Splits & Owed Metrics
  const contactBalances = useMemo<ContactBalance[]>(() => {
    return contacts.map(contact => {
      let owedToMe = 0;
      let iOweThem = 0;
      let lastUpdated = contact.createdAt;

      transactions.forEach(t => {
        if (t.splitWith && Array.isArray(t.splitWith)) {
          t.splitWith.forEach(entry => {
            if (entry.contactId === contact.id) {
              const fullAmount = entry.amount;
              const settledAmt = entry.settled
                ? (entry.settledAmount !== undefined ? entry.settledAmount : fullAmount)
                : (entry.settledAmount || 0);
              const remaining = Math.max(0, fullAmount - settledAmt);

              if (remaining > 0) {
                if (entry.direction === 'they_owe_me') {
                  owedToMe += remaining;
                } else {
                  iOweThem += remaining;
                }
              }
              if (t.date > lastUpdated) {
                lastUpdated = t.date;
              }
            }
          });
        }
      });

      // Generic settlements for this contact (where !sourceTransactionId)
      // These reduce open debts without overflowing into false negative balances
      const genericSettlements = settlements.filter(
        s => s.contactId === contact.id && !s.sourceTransactionId
      );
      genericSettlements.forEach(s => {
        if (owedToMe > 0) {
          owedToMe = Math.max(0, owedToMe - s.amount);
        } else if (iOweThem > 0) {
          iOweThem = Math.max(0, iOweThem - s.amount);
        }
        if (s.date > lastUpdated) {
          lastUpdated = s.date;
        }
      });

      const netAmount = owedToMe > 0 ? owedToMe : (iOweThem > 0 ? -iOweThem : 0);

      return {
        contactId: contact.id,
        netAmount: Number(netAmount.toFixed(2)),
        lastUpdated,
      };
    });
  }, [contacts, transactions, settlements]);

  const totalOwedToMe = useMemo(() => {
    const namedOwed = contactBalances
      .filter(b => b.netAmount > 0)
      .reduce((acc, b) => acc + b.netAmount, 0);

    let unnamedOwed = 0;
    transactions.forEach(t => {
      if (t.splitWith && Array.isArray(t.splitWith)) {
        t.splitWith.forEach(entry => {
          if (!entry.contactId && entry.direction === 'they_owe_me') {
            const fullAmount = entry.amount;
            const settledAmt = entry.settled
              ? (entry.settledAmount !== undefined ? entry.settledAmount : fullAmount)
              : (entry.settledAmount || 0);
            const remaining = Math.max(0, fullAmount - settledAmt);
            unnamedOwed += remaining;
          }
        });
      }
    });

    return Number((namedOwed + unnamedOwed).toFixed(2));
  }, [contactBalances, transactions]);

  const totalIOwe = useMemo(() => {
    const namedIOwe = contactBalances
      .filter(b => b.netAmount < 0)
      .reduce((acc, b) => acc + Math.abs(b.netAmount), 0);

    let unnamedIOwe = 0;
    transactions.forEach(t => {
      if (t.splitWith && Array.isArray(t.splitWith)) {
        t.splitWith.forEach(entry => {
          if (!entry.contactId && entry.direction === 'i_owe_them') {
            const fullAmount = entry.amount;
            const settledAmt = entry.settled
              ? (entry.settledAmount !== undefined ? entry.settledAmount : fullAmount)
              : (entry.settledAmount || 0);
            const remaining = Math.max(0, fullAmount - settledAmt);
            unnamedIOwe += remaining;
          }
        });
      }
    });

    return Number((namedIOwe + unnamedIOwe).toFixed(2));
  }, [contactBalances, transactions]);

  const categorySpendingThisMonth = useMemo(() => {
    const spendMap: Record<string, number> = {};
    currentMonthTransactions.forEach(t => {
      if (t.type === 'debit') {
        spendMap[t.category] = (spendMap[t.category] || 0) + t.amount;
      }
    });

    const budgetMap = new Map(budgets.map(b => [b.category.toLowerCase(), b.monthlyLimit]));
    const categoryInfoMap = new Map(categories.map(c => [c.name.toLowerCase(), c]));

    const result = Object.entries(spendMap).map(([categoryName, spent]) => {
      const budget = budgetMap.get(categoryName.toLowerCase()) || 0;
      const catInfo = categoryInfoMap.get(categoryName.toLowerCase());
      const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;

      return {
        category: categoryName,
        spent,
        budget,
        percentUsed,
        color: catInfo?.color || '#64748b',
        icon: catInfo?.icon || 'Tag',
      };
    });

    budgets.forEach(b => {
      const alreadyIncluded = result.some(r => r.category.toLowerCase() === b.category.toLowerCase());
      if (!alreadyIncluded) {
        const catInfo = categoryInfoMap.get(b.category.toLowerCase());
        result.push({
          category: b.category,
          spent: 0,
          budget: b.monthlyLimit,
          percentUsed: 0,
          color: catInfo?.color || '#64748b',
          icon: catInfo?.icon || 'Tag',
        });
      }
    });

    return result.sort((a, b) => b.spent - a.spent);
  }, [currentMonthTransactions, budgets, categories]);

  const getAggregatesForAI = (): FinancialAggregates => {
    const invBreakdownMap: Record<string, number> = {};
    investments.forEach(i => {
      invBreakdownMap[i.type] = (invBreakdownMap[i.type] || 0) + i.currentValue;
    });

    const invBreakdown = Object.entries(invBreakdownMap).map(([type, value]) => ({ type, value }));

    const goalsList = dreams.map(d => ({
      name: d.name,
      target: d.targetAmount,
      saved: d.currentSaved,
      targetDate: d.targetDate,
      percentComplete: d.targetAmount > 0 ? (d.currentSaved / d.targetAmount) * 100 : 0,
    }));

    return {
      currentMonthName,
      monthlyIncome: currentMonthIncome,
      monthlyExpenses: currentMonthExpense,
      netSavings: currentMonthNet,
      savingsRate: currentMonthSavingsRate,
      categorySpending: categorySpendingThisMonth.map(c => ({
        category: c.category,
        spent: c.spent,
        budget: c.budget > 0 ? c.budget : undefined,
        percentUsed: c.budget > 0 ? c.percentUsed : undefined,
      })),
      emergencyFund: {
        target: emergencyFund.manualTargetAmount || (effectiveMonthlyBaseline * emergencyFund.targetMonths),
        saved: emergencyFund.currentSaved,
        monthsCovered: emergencyFundRunwayMonths,
        targetMonths: emergencyFund.targetMonths,
      },
      investments: {
        totalInvested: totalInvestedAmount,
        currentValue: totalInvestmentValue,
        totalGainLoss: totalInvestmentGainLoss,
        gainLossPercent: totalInvestmentGainLossPct,
        breakdown: invBreakdown,
      },
      goals: goalsList,
    };
  };

  return (
    <FinanceContext.Provider
      value={{
        currentView,
        setCurrentView,
        darkMode,
        setDarkMode,
        isInitialized,
        transactions,
        categories,
        budgets,
        emergencyFund,
        investments,
        dreams,
        contacts,
        settlements,
        aiSettings,
        aiReports,
        notRecurringTxIds,
        toggleNotRecurring,
        syncStatus,
        lastSyncedAt,
        syncError,
        isDriveConnected,
        driveUserEmail,
        triggerSync,
        connectDrive,
        disconnectDrive,
        reloadFromDB,
        addTransaction,
        addMultipleTransactions,
        updateTransaction,
        deleteTransaction,
        deleteMultipleTransactions,
        addContact,
        updateContact,
        deleteContact,
        recordSettlement,
        updateSettlement,
        deleteSettlement,
        linkSettlementToTransaction,
        quickToggleSettleTransaction,
        settleSplitEntry,
        addCategory,
        updateCategory,
        deleteCategory,
        setBudgetForCategory,
        deleteBudget,
        updateEmergencySettings,
        addEmergencyContribution,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        addDream,
        updateDream,
        deleteDream,
        addDreamContribution,
        updateAISettings,
        saveAIReport,
        deleteAIReport,
        resetToDemoData,
        clearAllData,
        exportBackupJSON,
        importBackupJSON,
        totalBalance,
        currentMonthIncome,
        currentMonthExpense,
        currentMonthNet,
        currentMonthSavingsRate,
        totalInvestedAmount,
        totalInvestmentValue,
        totalInvestmentGainLoss,
        totalInvestmentGainLossPct,
        emergencyFundRunwayMonths,
        totalGoalsTarget,
        totalGoalsSaved,
        contactBalances,
        totalOwedToMe,
        totalIOwe,
        categorySpendingThisMonth,
        getAggregatesForAI,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
