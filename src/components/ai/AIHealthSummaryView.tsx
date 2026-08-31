import React, { useState } from 'react';
import {
  Sparkles,
  Key,
  Bot,
  AlertCircle,
  CheckCircle,
  Copy,
  Download,
  Trash2,
  Calendar,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { AIProvider } from '../../types/finance';
import { DEFAULT_AI_MODELS, generateFinancialSummary } from '../../services/aiService';
import { formatDateTime } from '../../utils/date';
import { formatINR } from '../../utils/currency';

const PROVIDER_INFO: Record<AIProvider, { name: string; tag: string; link: string; defaultModel: string; note: string }> = {
  gemini: {
    name: 'Google Gemini',
    tag: 'Recommended (Generous Free Tier)',
    link: 'https://aistudio.google.com/app/apikey',
    defaultModel: DEFAULT_AI_MODELS.gemini,
    note: 'Google AI Studio offers a free tier with strong throughput and low-cost access, ideal for personal finance summaries without a backend.',
  },
  openai: {
    name: 'OpenAI (ChatGPT)',
    tag: 'Requires API Credits',
    link: 'https://platform.openai.com/api-keys',
    defaultModel: DEFAULT_AI_MODELS.openai,
    note: 'Requires an active OpenAI developer account with billing or prepaid trial credits.',
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    tag: 'Requires API Credits',
    link: 'https://console.anthropic.com/settings/keys',
    defaultModel: DEFAULT_AI_MODELS.anthropic,
    note: 'Requires an active Anthropic Console account with prepaid API credits. Direct browser mode is supported.',
  },
};

export const AIHealthSummaryView: React.FC = () => {
  const {
    aiSettings,
    updateAISettings,
    aiReports,
    saveAIReport,
    deleteAIReport,
    getAggregatesForAI,
    currentMonthIncome,
    currentMonthExpense,
    currentMonthNet,
    currentMonthSavingsRate,
    totalInvestmentValue,
    emergencyFundRunwayMonths,
  } = useFinance();

  const [provider, setProvider] = useState<AIProvider>(aiSettings.provider || 'gemini');
  const [apiKey, setApiKey] = useState(aiSettings.apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedProviderInfo = PROVIDER_INFO[provider];

  const handleSaveKey = () => {
    updateAISettings({
      provider,
      apiKey: apiKey.trim(),
      model: PROVIDER_INFO[provider].defaultModel,
    });
    alert('API Key updated and stored securely in your browser local storage!');
  };

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setErrorMsg(`Please enter and save your ${selectedProviderInfo.name} API key first.`);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // Save settings first
      const defaultModel = PROVIDER_INFO[provider].defaultModel;
      updateAISettings({
        provider,
        apiKey: apiKey.trim(),
        model: defaultModel,
      });

      const aggregates = getAggregatesForAI();
      const summaryText = await generateFinancialSummary(
        { provider, apiKey: apiKey.trim(), model: defaultModel },
        aggregates
      );

      // Save report
      saveAIReport({
        provider,
        model: defaultModel,
        summaryText,
        financialSnapshot: {
          monthlyIncome: currentMonthIncome,
          monthlyExpense: currentMonthExpense,
          savingsRate: currentMonthSavingsRate,
          topExpenseCategory: aggregates.categorySpending[0]?.category || 'N/A',
          emergencyFundMonths: emergencyFundRunwayMonths,
          totalInvestments: totalInvestmentValue,
          activeGoalsCount: aggregates.goals.length,
        },
      });
    } catch (err: any) {
      setErrorMsg(err.message || `Couldn't reach ${selectedProviderInfo.name}. Please check your API key in Settings.`);
    } finally {
      setLoading(false);
    }
  };

  const activeReport = aiReports[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (text: string) => {
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dhanveda_ai_financial_summary_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* BYOK Settings Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Bring Your Own Key (BYOK) AI Assistant</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  100% Private
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Your API key is stored exclusively in your browser's Local Storage and only sent directly to the AI provider.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>No Backend / Zero Telemetry</span>
            </span>
          </div>
        </div>

        {/* Provider Tabs */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Select AI Intelligence Provider
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(PROVIDER_INFO) as AIProvider[]).map(pKey => {
              const info = PROVIDER_INFO[pKey];
              const isSelected = provider === pKey;

              return (
                <button
                  key={pKey}
                  type="button"
                  onClick={() => {
                    setProvider(pKey);
                    if (aiSettings.provider === pKey) {
                      setApiKey(aiSettings.apiKey || '');
                    }
                  }}
                  className={`p-3.5 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/30 ring-2 ring-violet-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {info.name}
                    </span>
                    {pKey === 'gemini' && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        FREE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{info.tag}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Provider Note & Key input */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-900 dark:text-white">{selectedProviderInfo.name}: </span>
              {selectedProviderInfo.note}
            </p>
            <a
              href={selectedProviderInfo.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Get Free Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <div className="relative flex-1">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={`Paste your ${selectedProviderInfo.name} API Key here...`}
                className="w-full pl-9 pr-20 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 hover:text-slate-600"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>

            <button
              onClick={handleSaveKey}
              className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
            >
              Save Key
            </button>
          </div>
        </div>

        {/* Generate Button & Error Alert */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Current Analysis Context: <span className="font-semibold text-slate-800 dark:text-slate-200">Income: {formatINR(currentMonthIncome)}, Expenses: {formatINR(currentMonthExpense)}, Savings Rate: {currentMonthSavingsRate.toFixed(1)}%</span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-violet-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing Financial Data...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generate Financial Health Summary</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Error Generating Summary: </span>
              {errorMsg}
            </div>
          </div>
        )}
      </div>

      {/* Generated Report Card */}
      {activeReport ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Latest Financial Health Assessment
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Generated via {activeReport.provider.toUpperCase()} ({activeReport.model}) on {formatDateTime(activeReport.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(activeReport.summaryText)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                title="Copy Markdown"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                onClick={() => handleDownload(activeReport.summaryText)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                title="Export as Markdown file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export MD</span>
              </button>
            </div>
          </div>

          {/* Render Summary Content */}
          <div className="prose dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
            {activeReport.summaryText}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
          <Bot className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-200">
            No summary generated yet
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Choose your AI provider above, paste your API key, and click "Generate Financial Health Summary".
          </p>
        </div>
      )}

      {/* Report History */}
      {aiReports.length > 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Past Reports History ({aiReports.length})
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {aiReports.slice(1).map(rep => (
              <div key={rep.id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Summary via {rep.provider.toUpperCase()}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatDateTime(rep.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(rep.summaryText)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    title="Copy"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteAIReport(rep.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
