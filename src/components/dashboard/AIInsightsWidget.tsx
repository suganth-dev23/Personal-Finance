import React from 'react';
import { Sparkles, ArrowRight, Bot, Key } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatDateTime } from '../../utils/date';

export const AIInsightsWidget: React.FC = () => {
  const { aiReports, aiSettings, setCurrentView } = useFinance();

  const latestReport = aiReports[0];

  return (
    <div className="bg-gradient-to-br from-violet-600 via-indigo-700 to-purple-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
      {/* Decorative background glow */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
            </span>
            <div>
              <h3 className="text-base font-bold">AI Financial Health Assistant</h3>
              <p className="text-xs text-violet-200">
                Private, BYOK analysis via {aiSettings.provider.toUpperCase()}
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-extrabold bg-violet-900/60 px-2 py-1 rounded-md border border-violet-400/30">
            Local Only
          </span>
        </div>

        {latestReport ? (
          <div className="mt-3 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-xs text-violet-200 mb-1">
              <span>Latest Summary</span>
              <span>{formatDateTime(latestReport.createdAt)}</span>
            </div>
            <p className="text-xs line-clamp-3 text-white/90 leading-relaxed">
              {latestReport.summaryText.slice(0, 180)}...
            </p>
          </div>
        ) : (
          <p className="text-xs text-violet-100/80 mt-2 leading-relaxed">
            Get instant actionable financial advice, savings recommendations, and risk alerts based on your current Indian expenses and goal progress.
          </p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between pt-3 border-t border-white/15">
        {!aiSettings.apiKey ? (
          <button
            onClick={() => setCurrentView('ai')}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Add API Key in Settings</span>
          </button>
        ) : (
          <span className="text-xs text-violet-200 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>API Key Connected</span>
          </span>
        )}

        <button
          onClick={() => setCurrentView('ai')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-violet-950 font-bold text-xs hover:bg-violet-50 transition-all shadow-sm active:scale-95"
        >
          <span>{latestReport ? 'View Full Report' : 'Generate Summary'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
