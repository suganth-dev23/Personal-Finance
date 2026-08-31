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
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { AIProvider } from '../../types/finance';
import { DEFAULT_AI_MODELS } from '../../services/aiService';

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
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [provider, setProvider] = useState<AIProvider>(aiSettings.provider || 'gemini');
  const [apiKey, setApiKey] = useState(aiSettings.apiKey || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Privacy Guarantee Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Data Privacy & Local Storage Guarantee
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              DhanVeda is architected as a pure client-side single-page application. All financial records, custom categories, investments, and API keys are stored solely inside your browser's private <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-emerald-600 font-mono">localStorage</code>. No telemetry, database, or third-party server ever receives your financial numbers.
            </p>
          </div>
        </div>
      </div>

      {/* Currency & Locale Preferences */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Currency & Regional Formats</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 font-semibold block">Currency Symbol</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white mt-1 block">
              ₹ (INR - Indian Rupee)
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 font-semibold block">Numbering Standard</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white mt-1 block">
              Indian Comma (1,25,000)
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 font-semibold block">Compact Units</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white mt-1 block">
              L (Lakhs) & Cr (Crores)
            </span>
          </div>
        </div>
      </div>

      {/* AI Key Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span>AI Assistant Settings (BYOK)</span>
          </h3>
          {saveSuccess && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
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
                className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
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
                className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Update AI Key
            </button>
          </div>
        </form>
      </div>

      {/* Data Backup, Restore & Demo Reset */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Data Backup & Management
        </h3>
        <p className="text-xs text-slate-400">
          Currently tracking {transactions.length} transactions, {budgets.length} budgets, {investments.length} investment holdings, and {dreams.length} goals.
        </p>

        {importStatus && (
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200">
            {importStatus}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export JSON */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Export Full Backup (JSON)
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Save an encrypted/raw JSON file with all your finances to keep a local backup or migrate between devices.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportBackup}
              className="mt-4 flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
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
                className="mt-4 w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Select Backup File</span>
              </button>
            </div>
          </div>
        </div>

        {/* Reset / Demo options */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset app state to realistic Indian sample demo data? (Swiggy, Zepto, HDFC Salary, SIPs, Gold, Goals)')) {
                resetToDemoData();
                alert('Demo data loaded successfully!');
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
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
    </div>
  );
};
