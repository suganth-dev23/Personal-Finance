import React from 'react';
import { Sparkles, ArrowRight, Key } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatDateTime } from '../../utils/date';

export const AIInsightsWidget: React.FC = () => {
  const { aiReports, aiSettings, setCurrentView } = useFinance();
  const latestReport = aiReports[0];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#131822] border border-slate-200/90 dark:border-[#202836] p-6 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left identity cluster */}
        <div className="flex items-start gap-3.5 max-w-sm shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center text-[#C28834] dark:text-[#F5B742] shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                AI Financial Health Assistant
              </h3>
              <span className="text-[10px] font-semibold bg-slate-100 dark:bg-[#171E2A] text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-[#202836]">
                BYOK
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Private analysis via {aiSettings.provider.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Center / Summary Content */}
        <div className="flex-1 min-w-0">
          {latestReport ? (
            <div className="bg-slate-50 dark:bg-[#171E2A]/70 rounded-2xl p-3.5 border border-slate-100 dark:border-[#202836]">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Latest Intelligence Report</span>
                <span>{formatDateTime(latestReport.createdAt)}</span>
              </div>
              <p className="text-xs line-clamp-2 text-slate-700 dark:text-slate-200 leading-relaxed">
                {latestReport.summaryText}
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-[#171E2A]/40 rounded-2xl p-3.5 border border-dashed border-slate-200 dark:border-[#202836]">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Actionable wealth guidance, risk alerts, and tax optimization recommendations tailored to your INR accounts.
              </p>
            </div>
          )}
        </div>

        {/* Right Action Cluster */}
        <div className="flex sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between sm:justify-end gap-3 shrink-0">
          {!aiSettings.apiKey ? (
            <button
              onClick={() => setCurrentView('ai')}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#C28834] dark:text-[#F5B742] hover:underline"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Configure API key</span>
            </button>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>API key connected</span>
            </span>
          )}

          <button
            onClick={() => setCurrentView('ai')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs transition-all shadow-xs active:scale-95 shrink-0"
          >
            <span>{latestReport ? 'View full report' : 'Generate summary'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
