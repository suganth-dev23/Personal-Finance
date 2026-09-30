import React from 'react';
import { Plus, Sparkles, Sun, Moon, RefreshCw } from 'lucide-react';
import { useFinance, AppView } from '../../context/FinanceContext';
import { formatINR } from '../../utils/currency';
import { getCurrentMonthYear } from '../../utils/date';

interface NavbarProps {
  onOpenAddTx: () => void;
}

const VIEW_TITLES: Record<AppView, { title: string; subtitle: string }> = {
  dashboard: { title: 'Financial Dashboard', subtitle: 'Overview of your net worth, cash flow & budget health' },
  transactions: { title: 'Transaction History', subtitle: 'Search, filter, and manage all your bank & UPI records' },
  people: { title: 'People & Expense Splits', subtitle: 'Track IOUs, who owes you, who you owe, and settlements' },
  budgets: { title: 'Monthly Budgets', subtitle: 'Set limits per category and track spending velocity' },
  recurring: { title: 'Recurring Payments', subtitle: 'Fixed commitments, subscriptions, EMIs, and monthly bills' },
  categories: { title: 'Spending Categories', subtitle: 'Default and custom category breakdown & icons' },
  emergency: { title: 'Emergency Fund', subtitle: 'Build and track your 6-month living expenses safety net' },
  investments: { title: 'Investments Portfolio', subtitle: 'Track Stocks, Mutual Funds, FD, Gold, EPF & Crypto' },
  dreams: { title: 'Dreams & Goals', subtitle: 'Achieve your milestones with target-date saving plans' },
  ai: { title: 'AI Financial Health Summary', subtitle: 'Bring-Your-Own-Key private AI insights (Gemini / OpenAI / Claude)' },
  import: { title: 'Statement & Bill Import', subtitle: 'Parse PDF & CSV bank statements with auto-categorization' },
  settings: { title: 'App Settings & Backup', subtitle: 'API keys, local storage data export & demo data' },
  badges: { title: 'Achievements & Badges', subtitle: 'Trophies, unlockable financial discipline milestones & XP' },
};

import { StreakBanner } from '../common/StreakBanner';

export const Navbar: React.FC<NavbarProps> = ({ onOpenAddTx }) => {
  const {
    currentView,
    setCurrentView,
    darkMode,
    setDarkMode,
    currentMonthIncome,
    currentMonthExpense,
    syncStatus,
    isDriveConnected,
    triggerSync,
  } = useFinance();
  const { monthName, year } = getCurrentMonthYear();
  const meta = VIEW_TITLES[currentView] || { title: 'DhanVeda', subtitle: '' };

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#0B0E14]/90 backdrop-blur-md border-b border-slate-200/90 dark:border-border-dark px-4 sm:px-8 py-4 flex items-center justify-between transition-colors">
      {/* Title info */}
      <div>
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none truncate max-w-[180px] sm:max-w-none">
            {meta.title}
          </h1>
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-inset-dark text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-border-dark">
            {monthName} {year}
          </span>
        </div>
        <p className="hidden md:block text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
          {meta.subtitle}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2.5">
        {/* Google Drive Sync Status Button */}
        {isDriveConnected ? (
          <button
            onClick={() => triggerSync(true)}
            title={syncStatus === 'syncing' ? 'Syncing with Google Drive...' : 'Google Drive Synced. Click to sync now.'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-inset-dark dark:hover:bg-active-dark text-xs font-medium transition-colors press"
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
            ) : syncStatus === 'error' ? (
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
            <span className="hidden md:inline text-slate-600 dark:text-slate-300">
              {syncStatus === 'syncing' ? 'Syncing...' : 'Drive Synced'}
            </span>
          </button>
        ) : null}

        {/* Month flow pill */}
        <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-card-dark border border-slate-200/90 dark:border-border-dark text-xs">
          <div>
            <span className="text-slate-400">In:</span>{' '}
            <span className="font-semibold font-numeric text-emerald-600 dark:text-emerald-400">+{formatINR(currentMonthIncome)}</span>
          </div>
          <div className="w-px h-3 bg-slate-300 dark:bg-active-dark"></div>
          <div>
            <span className="text-slate-400">Out:</span>{' '}
            <span className="font-semibold font-numeric text-[#F43F5E] dark:text-rose-400">-{formatINR(currentMonthExpense)}</span>
          </div>
        </div>

        {/* Daily Streak Indicator */}
        <StreakBanner compact={true} />

        {/* AI Quick Button */}
        {currentView !== 'ai' && (
          <button
            onClick={() => setCurrentView('ai')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#C28834] dark:text-[#F5B742] bg-[#F5B742]/10 hover:bg-[#F5B742]/20 dark:bg-[#F5B742]/10 dark:hover:bg-[#F5B742]/20 border border-[#F5B742]/30 transition-colors press"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C28834] dark:text-[#F5B742]" />
            <span>AI Health</span>
          </button>
        )}

        {/* Add Transaction Button (Desktop/Tablet) */}
        <button
          onClick={onOpenAddTx}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs sm:text-sm shadow-sm transition-all press"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>

        {/* Mobile Theme Toggle */}
        <button
          onClick={() => setDarkMode(prev => !prev)}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-inset-dark transition-colors press"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
