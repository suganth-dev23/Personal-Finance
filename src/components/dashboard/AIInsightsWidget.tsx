import React from 'react';
import { Sparkles, ArrowRight, Bot, Key } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatDateTime } from '../../utils/date';

export const AIInsightsWidget: React.FC = () => {
  const { aiReports, aiSettings, setCurrentView } = useFinance();

  const latestReport = aiReports[0];

  return (
    <div className="bg-white dark:bg-[#131822] rounded-3xl p-6 border border-slate-200/90 dark:border-[#202836] shadow-sm relative flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5B742]/10 dark:bg-[#F5B742]/15 flex items-center justify-center text-[#C28834] dark:text-[#F5B742]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Financial Health Assistant</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Private, BYOK analysis via {aiSettings.provider.toUpperCase()}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold bg-slate-100 dark:bg-[#171E2A] text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-[#202836]">
            Local only
          </span>
        </div>

        {latestReport ? (
          <div className="mt-3 bg-slate-50 dark:bg-[#171E2A]/70 rounded-2xl p-4 border border-slate-100 dark:border-[#202836]">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="font-medium">Latest summary</span>
              <span>{formatDateTime(latestReport.createdAt)}</span>
            </div>
            <p className="text-xs line-clamp-3 text-slate-700 dark:text-slate-200 leading-relaxed">
              {latestReport.summaryText.slice(0, 180)}...
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Get instant actionable financial advice, savings recommendations, and risk alerts based on your current Indian expenses and goal progress.
          </p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#202836]">
        {!aiSettings.apiKey ? (
          <button
            onClick={() => setCurrentView('ai')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#C28834] dark:text-[#F5B742] hover:underline"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Add API key in settings</span>
          </button>
        ) : (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>API key connected</span>
          </span>
        )}

        <button
          onClick={() => setCurrentView('ai')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs transition-all shadow-sm active:scale-95"
        >
          <span>{latestReport ? 'View full report' : 'Generate summary'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
