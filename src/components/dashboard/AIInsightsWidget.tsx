import React from 'react';
import { Sparkles, ArrowRight, Key } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatDateTime } from '../../utils/date';

export const AIInsightsWidget: React.FC = () => {
 const { aiReports, aiSettings, setCurrentView } = useFinance();
 const latestReport = aiReports[0];

 return (
 <div className="relative overflow-hidden rounded-2xl bg-surface border border-line p-4 sm:p-6 shadow-xs">
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
 {/* Left identity cluster */}
 <div className="flex items-start gap-3.5 max-w-sm shrink-0">
 <div className="w-10 h-10 rounded-2xl bg-primary-tint dark:bg-warning-tint flex items-center justify-center text-reward dark:text-reward shrink-0 mt-0.5">
 <Sparkles className="w-5 h-5" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h3 className="text-sm font-bold text-ink-1">
 AI Financial Health Assistant
 </h3>
 <span className="text-xs font-semibold bg-sunken text-ink-2 px-2 py-0.5 rounded-full border border-line">
 BYOK
 </span>
 </div>
 <p className="text-xs text-ink-3 mt-0.5">
 Private analysis via {aiSettings.provider.toUpperCase()}
 </p>
 </div>
 </div>

 {/* Center / Summary Content */}
 <div className="flex-1 min-w-0">
 {latestReport ? (
 <div className="bg-sunken rounded-2xl p-3.5 border border-line">
 <div className="flex items-center justify-between text-xs text-ink-3 mb-1">
 <span className="font-semibold text-ink-2">Latest Intelligence Report</span>
 <span>{formatDateTime(latestReport.createdAt)}</span>
 </div>
 <p className="text-xs line-clamp-2 text-ink-2 leading-relaxed">
 {latestReport.summaryText}
 </p>
 </div>
 ) : (
 <div className="bg-sunken rounded-2xl p-3.5 border border-dashed border-line">
 <p className="text-xs text-ink-2">
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
 className="flex items-center gap-1.5 text-xs font-semibold text-reward dark:text-reward hover:underline"
 >
 <Key className="w-3.5 h-3.5" />
 <span>Configure API key</span>
 </button>
 ) : (
 <span className="text-xs text-ink-3 font-medium flex items-center gap-1.5">
 <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
 <span>API key connected</span>
 </span>
 )}

 <button
 onClick={() => setCurrentView('ai')}
 className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs transition-colors shadow-xs active:scale-95 shrink-0"
 >
 <span>{latestReport ? 'View full report' : 'Generate summary'}</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 </div>
 );
};
