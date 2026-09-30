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
  Cloud,
  CloudOff,
  UploadCloud,
  Activity,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { AIProvider } from '../../types/finance';
import { DEFAULT_AI_MODELS } from '../../services/aiService';
import { googleAuthService } from '../../services/googleAuth';
import { GoogleSyncSetupModal } from './GoogleSyncSetupModal';
import { StatementImportView } from '../import/StatementImportView';

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
    currentView,
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<'settings' | 'import'>(
    currentView === 'import' ? 'import' : 'settings'
  );
  const [provider, setProvider] = useState<AIProvider>(aiSettings.provider || 'gemini');
  const [apiKey, setApiKey] = useState(aiSettings.apiKey || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [motionPref, setMotionPref] = useState<'system' | 'standard' | 'reduced'>(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      const stored = localStorage.getItem('dhanveda_motion');
      if (stored === 'off') return 'reduced';
      if (stored === 'on') return 'standard';
    } catch {}
    const attr = document.documentElement.dataset.motion;
    if (attr === 'off') return 'reduced';
    if (attr === 'on') return 'standard';
    return 'system';
  });

  const handleMotionChange = (pref: 'system' | 'standard' | 'reduced') => {
    setMotionPref(pref);
    if (typeof window === 'undefined') return;
    try {
      if (pref === 'system') {
        delete document.documentElement.dataset.motion;
        localStorage.removeItem('dhanveda_motion');
      } else if (pref === 'standard') {
        document.documentElement.dataset.motion = 'on';
        localStorage.setItem('dhanveda_motion', 'on');
      } else if (pref === 'reduced') {
        document.documentElement.dataset.motion = 'off';
        localStorage.setItem('dhanveda_motion', 'off');
      }
      window.dispatchEvent(new CustomEvent('dhanveda-motion-change'));
    } catch (err) {
      console.error('Failed to update motion preference:', err);
    }
  };

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
      {/* Settings vs Statement Import Tabs */}
      <div className="flex items-center p-1 bg-slate-100 dark:bg-inset-dark rounded-2xl border border-slate-200/80 dark:border-border-dark max-w-md shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
            activeTab === 'settings'
              ? 'bg-white dark:bg-active-dark text-slate-900 dark:text-[#F5B742] shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>General & Sync</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('import')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
            activeTab === 'import'
              ? 'bg-white dark:bg-active-dark text-slate-900 dark:text-[#F5B742] shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Statement Import</span>
        </button>
      </div>

      {activeTab === 'import' ? (
        <StatementImportView />
      ) : (
        <>
          {/* Privacy Guarantee Header: Mineral Card with Gold Security Highlight */}
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-card-dark text-slate-900 dark:text-white p-6 sm:p-8 border border-slate-200/90 dark:border-border-dark shadow-sm">
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
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200/80 dark:border-border-dark">
          <div className="rounded-2xl bg-slate-50 dark:bg-inset-dark p-3.5 border border-slate-200/60 dark:border-border-dark/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Local Engine</span>
            <p className="text-lg font-bold font-numeric text-slate-900 dark:text-white mt-0.5">IndexedDB v4</p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-inset-dark p-3.5 border border-slate-200/60 dark:border-border-dark/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Cloud Sync</span>
            <p className={`text-lg font-bold mt-0.5 ${isDriveConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
              {isDriveConnected ? 'Drive Connected' : 'Offline Mode'}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-inset-dark p-3.5 border border-slate-200/60 dark:border-border-dark/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Ledger Count</span>
            <p className="text-lg font-bold font-numeric text-slate-900 dark:text-white mt-0.5">{transactions.length} records</p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-inset-dark p-3.5 border border-slate-200/60 dark:border-border-dark/60">
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
      <div className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-sm border border-slate-200/90 dark:border-border-dark space-y-4">
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
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-inset-dark dark:text-slate-400 dark:border dark:border-border-dark">
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
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-inset-dark hover:bg-slate-200 dark:hover:bg-active-dark text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-border-dark rounded-xl text-xs font-bold transition-colors shrink-0"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Setup Guide / Client ID</span>
          </button>
        </div>

        {/* Sync Info Banner */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-border-dark bg-slate-50 dark:bg-inset-dark space-y-3">
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

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/60 dark:border-border-dark">
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
                    className="press flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
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
                    className="press flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-200 dark:bg-active-dark hover:bg-rose-100 dark:hover:bg-rose-950/50 hover:text-rose-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
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
                  className="press flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{googleAuthService.hasClientId() ? 'Connect Google Drive' : 'Configure Client ID'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Appearance & Motion Preferences (Task E.5) */}
      <div className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-sm border border-slate-200/90 dark:border-border-dark space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 dark:text-[#F5B742] shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Appearance &amp; Motion
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Control UI animation speed, count-up tweens, chart transitions, and celebration effects.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-amber-600 dark:text-[#F5B742] px-3 py-1 rounded-full bg-amber-500/10 self-start sm:self-auto">
            {motionPref === 'system' ? 'System Driven' : motionPref === 'standard' ? 'Full Dynamic Motion' : 'Calm / Reduced'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={() => handleMotionChange('system')}
            className={`p-4 rounded-2xl border text-left transition-[color,background-color,border-color,box-shadow] press ${
              motionPref === 'system'
                ? 'border-amber-500/70 bg-amber-500/10 ring-1 ring-amber-500/30 shadow-xs'
                : 'border-slate-200/80 dark:border-border-dark bg-slate-50 dark:bg-inset-dark hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                motionPref === 'system' ? 'text-amber-600 dark:text-[#F5B742]' : 'text-slate-500 dark:text-slate-400'
              }`}>
                Auto
              </span>
              {motionPref === 'system' && <CheckCircle className="w-4 h-4 text-amber-500 dark:text-[#F5B742]" />}
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">System Default</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Synchronizes automatically with your device operating system accessibility settings.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleMotionChange('standard')}
            className={`p-4 rounded-2xl border text-left transition-[color,background-color,border-color,box-shadow] press ${
              motionPref === 'standard'
                ? 'border-amber-500/70 bg-amber-500/10 ring-1 ring-amber-500/30 shadow-xs'
                : 'border-slate-200/80 dark:border-border-dark bg-slate-50 dark:bg-inset-dark hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                motionPref === 'standard' ? 'text-amber-600 dark:text-[#F5B742]' : 'text-slate-500 dark:text-slate-400'
              }`}>
                Rich
              </span>
              {motionPref === 'standard' && <CheckCircle className="w-4 h-4 text-amber-500 dark:text-[#F5B742]" />}
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Standard Motion</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Fluid count-ups, staggered list entries, celebration confetti, and smooth card lifts.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleMotionChange('reduced')}
            className={`p-4 rounded-2xl border text-left transition-[color,background-color,border-color,box-shadow] press ${
              motionPref === 'reduced'
                ? 'border-amber-500/70 bg-amber-500/10 ring-1 ring-amber-500/30 shadow-xs'
                : 'border-slate-200/80 dark:border-border-dark bg-slate-50 dark:bg-inset-dark hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                motionPref === 'reduced' ? 'text-amber-600 dark:text-[#F5B742]' : 'text-slate-500 dark:text-slate-400'
              }`}>
                Calm
              </span>
              {motionPref === 'reduced' && <CheckCircle className="w-4 h-4 text-amber-500 dark:text-[#F5B742]" />}
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Reduced Motion</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Instant view transitions, static chart renders, zero looped animations for calm focus.
            </p>
          </button>
        </div>
      </div>

      {/* Currency & Locale Preferences */}
      <div className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-sm border border-slate-200/90 dark:border-border-dark space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Currency & Regional Formats</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-inset-dark rounded-2xl border border-slate-200/80 dark:border-border-dark">
            <span className="text-slate-400 font-semibold block">Currency Symbol</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white mt-1 block font-numeric">
              ₹ (INR - Indian Rupee)
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-inset-dark rounded-2xl border border-slate-200/80 dark:border-border-dark">
            <span className="text-slate-400 font-semibold block">Numbering Standard</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white mt-1 block font-numeric">
              Indian Comma (1,25,000)
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-inset-dark rounded-2xl border border-slate-200/80 dark:border-border-dark">
            <span className="text-slate-400 font-semibold block">Compact Units</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white mt-1 block">
              L (Lakhs) & Cr (Crores)
            </span>
          </div>
        </div>
      </div>

      {/* AI Key Settings */}
      <div className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-sm border border-slate-200/90 dark:border-border-dark space-y-4">
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
                className="w-full py-2.5 px-3 bg-slate-50 dark:bg-inset-dark border border-slate-200/90 dark:border-border-dark rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                className="w-full py-2.5 px-3 bg-slate-50 dark:bg-inset-dark border border-slate-200/90 dark:border-border-dark rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="press px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Update AI Key
            </button>
          </div>
        </form>
      </div>

      {/* Data Backup, Restore & Demo Reset */}
      <div className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-sm border border-slate-200/90 dark:border-border-dark space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Data Backup & Management
        </h3>
        <p className="text-xs text-slate-400 font-numeric">
          Currently tracking {transactions.length} transactions, {budgets.length} budgets, {investments.length} investment holdings, and {dreams.length} goals.
        </p>

        {importStatus && (
          <div className="p-3 bg-slate-100 dark:bg-inset-dark border border-slate-200/80 dark:border-border-dark rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-200">
            {importStatus}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export JSON */}
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-border-dark bg-slate-50 dark:bg-inset-dark flex flex-col justify-between">
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
              className="press mt-4 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-border-dark bg-slate-50 dark:bg-inset-dark flex flex-col justify-between">
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
                className="press mt-4 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-200 dark:bg-active-dark hover:bg-slate-300 dark:hover:bg-active-dark/80 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Select Backup File</span>
              </button>
            </div>
          </div>

          {/* Bank & Credit Card Statement Import */}
          <div className="sm:col-span-2 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-amber-500 dark:text-[#F5B742]" />
                <span>Bank &amp; Credit Card Statement Import</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Auto-parse and categorize statements from HDFC, SBI, ICICI, Axis &amp; UPI (CSV or PDF).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('import')}
              className="press flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
            >
              <span>Open Statement Importer</span>
              <UploadCloud className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Reset / Demo options */}
        <div className="pt-4 border-t border-slate-100 dark:border-border-dark flex flex-col sm:flex-row items-center justify-between gap-3">
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
        </>
      )}
    </div>
  );
};
