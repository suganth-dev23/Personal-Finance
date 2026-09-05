import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Key,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Info,
  Cloud,
  CloudOff,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { AIProvider } from '../../types/finance';
import { DEFAULT_AI_MODELS } from '../../services/aiService';
import { googleAuthService } from '../../services/googleAuth';
import { GoogleSyncSetupModal } from './GoogleSyncSetupModal';

export const SettingsView: React.FC = () => {
  const {
    aiSettings,
    updateAISettings,
    resetToDemoData,
    clearAllData,
    exportBackupJSON,
    importBackupJSON,
    transactions,
    budgets,
    investments,
    dreams,
    categories,
    syncStatus,
    lastSyncedAt,
    syncError,
    isDriveConnected,
    driveUserEmail,
    triggerSync,
    connectDrive,
    disconnectDrive,
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [provider, setProvider] = useState<AIProvider>(aiSettings.provider || 'gemini');
  const [apiKey, setApiKey] = useState(aiSettings.apiKey || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const handleSaveAI = (e: React.FormEvent) => {
    e.preventDefault();
    updateAISettings({
      provider,
      apiKey: apiKey.trim(),
      model: DEFAULT_AI_MODELS[provider],
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dhanveda_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const content = event.target?.result as string;
          const ok = importBackupJSON(content);
          if (ok) {
            setImportStatus('Backup restored successfully!');
          } else {
            setImportStatus('Failed to parse backup JSON file. Format not recognized.');
          }
        } catch {
          setImportStatus('Invalid JSON file format.');
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await triggerSync(true);
    setIsManualSyncing(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Privacy Guarantee Header: Mineral Card with Gold Security Highlight */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#131822] text-slate-900 dark:text-white p-6 sm:p-8 border border-slate-200/90 dark:border-[#202836] shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F5B742] to-transparent opacity-80" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400">
                <Shield className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                DATA SOVEREIGNTY &amp; ARCHITECTURE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Client-Side Storage Guarantee
            </p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                100% Local-First
              </h2>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Private IndexedDB
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              All financial records, goals, and API keys are stored solely inside your browser's private database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-sm font-bold text-slate-950 shadow-sm hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.98]"
            >
              <Download className="h-4 w-4 stroke-[2.5]" />
              <span>Export Full Backup</span>
            </button>
          </div>
        </div>

        {/* 4-column summary strip */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200/80 dark:border-[#202836]">
          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Local Engine</span>
            <p className="text-lg font-bold font-numeric text-slate-900 dark:text-white mt-0.5">IndexedDB v4</p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Cloud Sync</span>
            <p className={`text-lg font-bold mt-0.5 ${isDriveConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
              {isDriveConnected ? 'Drive Connected' : 'Offline Mode'}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Ledger Count</span>
            <p className="text-lg font-bold font-numeric text-slate-900 dark:text-white mt-0.5">{transactions.length} records</p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Categories</span>
            <p className="text-lg font-bold font-numeric text-slate-900 dark:text-white mt-0.5">{categories.length} types</p>
          </div>
        </div>
      </div>

      {/* Section Header: Cloud Sync */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Google Drive Cloud Sync
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multi-device automatic synchronization using your own Google Drive storage
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {isDriveConnected ? 'Active' : 'Disconnected'}
        </span>
      </div>

      {/* Google Drive Cross-Device Sync */}
      <div className="bg-white dark:bg-[#131822] rounded-3xl p-6 shadow-sm border border-slate-200/90 dark:border-[#202836] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 dark:text-[#F5B742] shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Google Drive Cloud Sync &amp; Multi-Device</span>
                {isDriveConnected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-[#171E2A] dark:text-slate-400 dark:border dark:border-[#202836]">
                    Not Connected
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sync peer-to-cloud across mobile and desktop using your private Google Drive app folder.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSetupModalOpen(true)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-[#171E2A] hover:bg-slate-200 dark:hover:bg-[#202836] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#202836] rounded-xl text-xs font-bold transition-colors shrink-0"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Setup Guide / Client ID</span>
          </button>
        </div>

        {/* Sync Info Banner */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block">Google Account</span>
              <span className="text-slate-900 dark:text-white font-bold mt-0.5 truncate block">
                {isDriveConnected ? driveUserEmail || 'Connected' : 'None'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Last Synced</span>
              <span className="text-slate-900 dark:text-white font-bold font-numeric mt-0.5 block">
                {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Never'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Status</span>
              <span className="text-slate-900 dark:text-white font-bold mt-0.5 block">
                {syncStatus === 'syncing' || isManualSyncing
                  ? 'Syncing changes...'
                  : syncError
                  ? `Error: ${syncError}`
                  : isDriveConnected
                  ? 'Up to date'
                  : googleAuthService.hasClientId()
                  ? 'Ready to connect'
                  : 'Needs Client ID'}
              </span>
            </div>
          </div>

          {syncError && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{syncError}</span>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/60 dark:border-[#202836]">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Drive folder: <code>appDataFolder</code>. AI API keys are stored locally &amp; never synced.</span>
            </div>

            <div className="flex items-center gap-2">
              {isDriveConnected ? (
                <>
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={syncStatus === 'syncing' || isManualSyncing}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' || isManualSyncing ? 'animate-spin' : ''}`} />
                    <span>{syncStatus === 'syncing' || isManualSyncing ? 'Syncing...' : 'Sync Now'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Disconnect Google Drive? Your local financial records will remain completely intact.')) {
                        disconnectDrive();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-[#202836] hover:bg-rose-100 dark:hover:bg-rose-950/50 hover:text-rose-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-95"
                  >
                    <CloudOff className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!googleAuthService.hasClientId()) {
                      setIsSetupModalOpen(true);
                    } else {
                      connectDrive();
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{googleAuthService.hasClientId() ? 'Connect Google Drive' : 'Configure Client ID'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Currency & Locale Preferences */}
      <div className="bg-white dark:bg-[#131822] rounded-3xl p-6 shadow-sm border border-slate-200/90 dark:border-[#202836] space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Currency & Regional Formats</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-[#171E2A] rounded-2xl border border-slate-200/80 dark:border-[#202836]">
            <span className="text-slate-400 font-semibold block">Currency Symbol</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white mt-1 block font-numeric">
              ₹ (INR - Indian Rupee)
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-[#171E2A] rounded-2xl border border-slate-200/80 dark:border-[#202836]">
            <span className="text-slate-400 font-semibold block">Numbering Standard</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white mt-1 block font-numeric">
              Indian Comma (1,25,000)
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-[#171E2A] rounded-2xl border border-slate-200/80 dark:border-[#202836]">
            <span className="text-slate-400 font-semibold block">Compact Units</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white mt-1 block">
              L (Lakhs) & Cr (Crores)
            </span>
          </div>
        </div>
      </div>

      {/* AI Key Settings */}
      <div className="bg-white dark:bg-[#131822] rounded-3xl p-6 shadow-sm border border-slate-200/90 dark:border-[#202836] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 dark:text-[#F5B742]" />
            <span>AI Assistant Settings (BYOK)</span>
          </h3>
          {saveSuccess && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Saved!</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSaveAI} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                AI Provider
              </label>
              <select
                value={provider}
                onChange={e => setProvider(e.target.value as AIProvider)}
                className="w-full py-2.5 px-3 bg-slate-50 dark:bg-[#171E2A] border border-slate-200/90 dark:border-[#202836] rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="gemini">Google Gemini (Recommended Free Tier)</option>
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Paste API Key..."
                className="w-full py-2.5 px-3 bg-slate-50 dark:bg-[#171E2A] border border-slate-200/90 dark:border-[#202836] rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              Update AI Key
            </button>
          </div>
        </form>
      </div>

      {/* Data Backup, Restore & Demo Reset */}
      <div className="bg-white dark:bg-[#131822] rounded-3xl p-6 shadow-sm border border-slate-200/90 dark:border-[#202836] space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Data Backup & Management
        </h3>
        <p className="text-xs text-slate-400 font-numeric">
          Currently tracking {transactions.length} transactions, {budgets.length} budgets, {investments.length} investment holdings, and {dreams.length} goals.
        </p>

        {importStatus && (
          <div className="p-3 bg-slate-100 dark:bg-[#171E2A] border border-slate-200/80 dark:border-[#202836] rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-200">
            {importStatus}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export JSON */}
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Export Full Backup (JSON)
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Save a complete JSON file with all your finances to keep an offline backup or migrate between devices.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportBackup}
              className="mt-4 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Restore From Backup (JSON)
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Load your previously saved JSON file to restore your transactions and goals.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json, application/json"
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-200 dark:bg-[#202836] hover:bg-slate-300 dark:hover:bg-[#202836]/80 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Select Backup File</span>
              </button>
            </div>
          </div>
        </div>

        {/* Reset / Demo options */}
        <div className="pt-4 border-t border-slate-100 dark:border-[#202836] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset app state to realistic Indian sample demo data? (Swiggy, Zepto, HDFC Salary, SIPs, Gold, Goals)')) {
                resetToDemoData();
                alert('Demo data loaded successfully!');
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-[#F5B742] hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset with Realistic Indian Sample Data</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('WARNING: Are you sure you want to permanently clear all data from this browser?')) {
                clearAllData();
                alert('All data has been cleared.');
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Local Data</span>
          </button>
        </div>
      </div>

      {/* Google Cloud Drive Sync Setup Modal */}
      <GoogleSyncSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
      />
    </div>
  );
};
