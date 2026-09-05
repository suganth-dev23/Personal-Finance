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
    note: 'Google AI Studio offers a free tier with high limits and zero backend needed. 100% direct client communication.',
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
    alert('API Key stored securely in your browser local storage!');
  };

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setErrorMsg(`Please enter and save your ${selectedProviderInfo.name} API key first.`);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* BYOK Settings Card: Modern Minimalist AI Studio */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#131822] text-slate-900 dark:text-white p-6 sm:p-8 border border-slate-200/90 dark:border-[#202836] shadow-sm space-y-6">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F5B742] to-transparent opacity-80" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-[#F5B742] border border-amber-500/20">
                <Sparkles className="w-3 h-3 text-[#F5B742]" /> AI Financial Advisor (BYOK)
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                100% Private Client-Side
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Financial Health Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Get an instant, actionable breakdown of cash flows, burn rate, and investment velocity directly with zero server telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Zero-Telemetry</span>
            </span>
          </div>
        </div>

        {/* Provider Tabs */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            Select AI Intelligence Engine
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
                  className={`p-4 rounded-2xl text-left border transition-all duration-200 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/40'
                      : 'border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {info.name}
                    </span>
                    {pKey === 'gemini' && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        FREE TIER
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-1">{info.tag}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Provider Note & Key input */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#171E2A] border border-slate-200/80 dark:border-[#202836] space-y-3.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-900 dark:text-white">{selectedProviderInfo.name}: </span>
              {selectedProviderInfo.note}
            </p>
            <a
              href={selectedProviderInfo.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Get API Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <div className="relative flex-1">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={`Paste your ${selectedProviderInfo.name} API Key...`}
                className="w-full pl-10 pr-20 py-2.5 bg-white dark:bg-[#131822] border border-slate-200/90 dark:border-[#202836] rounded-xl text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>

            <button
              onClick={handleSaveKey}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#202836] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold border border-slate-200/80 dark:border-[#202836] transition-colors"
            >
              Save Key
            </button>
          </div>
        </div>

        {/* Generate Button & Context Pill */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-slate-200/80 dark:border-[#202836]">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-2 items-center">
            <span>Context:</span>
            <span className="font-semibold text-slate-900 dark:text-white font-numeric">Income: {formatINR(currentMonthIncome)}</span>
            <span>•</span>
            <span className="font-semibold text-slate-900 dark:text-white font-numeric">Expenses: {formatINR(currentMonthExpense)}</span>
            <span>•</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-numeric">Savings: {currentMonthSavingsRate.toFixed(1)}%</span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Financial Telemetry...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Generate Health Assessment</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-xs text-rose-600 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1">
              <span className="font-bold">Error: </span>
              {errorMsg}
            </div>
          </div>
        )}
      </div>

      {/* Generated Report Card */}
      {activeReport ? (
        <div className="bg-white dark:bg-[#131822] rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 dark:border-[#202836] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#202836]">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#171E2A] hover:bg-slate-200 dark:hover:bg-[#202836] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors border border-slate-200/60 dark:border-[#202836]"
                title="Copy Markdown"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                onClick={() => handleDownload(activeReport.summaryText)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#171E2A] hover:bg-slate-200 dark:hover:bg-[#202836] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors border border-slate-200/60 dark:border-[#202836]"
                title="Export as Markdown file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export MD</span>
              </button>
            </div>
          </div>

          {/* Render Summary Content */}
          <div className="prose dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans bg-slate-50/50 dark:bg-[#171E2A]/50 p-6 rounded-2xl border border-slate-100 dark:border-[#202836]">
            {activeReport.summaryText}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-[#131822] rounded-3xl border border-dashed border-slate-200/90 dark:border-[#202836] p-8">
          <Bot className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No summary generated yet
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Choose your AI provider above, paste your API key, and click "Generate Health Assessment".
          </p>
        </div>
      )}

      {/* Report History */}
      {aiReports.length > 1 && (
        <div className="bg-white dark:bg-[#131822] rounded-3xl p-6 shadow-sm border border-slate-200/90 dark:border-[#202836]">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Past Reports History ({aiReports.length})
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-[#202836]">
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
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#171E2A]"
                    title="Copy"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteAIReport(rep.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
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
