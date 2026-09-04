import React from 'react';
import { Plus, UploadCloud, Sparkles, Sun, Moon, RefreshCw } from 'lucide-react';
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
  categories: { title: 'Spending Categories', subtitle: 'Default and custom category breakdown & icons' },
  emergency: { title: 'Emergency Fund', subtitle: 'Build and track your 6-month living expenses safety net' },
  investments: { title: 'Investments Portfolio', subtitle: 'Track Stocks, Mutual Funds, FD, Gold, EPF & Crypto' },
  dreams: { title: 'Dreams & Goals', subtitle: 'Achieve your milestones with target-date saving plans' },
  ai: { title: 'AI Financial Health Summary', subtitle: 'Bring-Your-Own-Key private AI insights (Gemini / OpenAI / Claude)' },
  import: { title: 'Statement & Bill Import', subtitle: 'Parse PDF & CSV bank statements with auto-categorization' },
  settings: { title: 'App Settings & Backup', subtitle: 'API keys, local storage data export & demo data' },
};

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
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 py-4 flex items-center justify-between transition-colors">
      {/* Title info */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            {meta.title}
          </h1>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold transition-colors"
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
        <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <span className="text-slate-400">In:</span>{' '}
            <span className="font-bold text-emerald-600 dark:text-emerald-400">+{formatINR(currentMonthIncome)}</span>
          </div>
          <div className="w-px h-3 bg-slate-300 dark:bg-slate-600"></div>
          <div>
            <span className="text-slate-400">Out:</span>{' '}
            <span className="font-bold text-rose-600 dark:text-rose-400">-{formatINR(currentMonthExpense)}</span>
          </div>
        </div>

        {/* AI Quick Button */}
        {currentView !== 'ai' && (
          <button
            onClick={() => setCurrentView('ai')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/60 dark:hover:bg-violet-900/60 border border-violet-200 dark:border-violet-800/80 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span>AI Health</span>
          </button>
        )}

        {/* Import Quick Button */}
        {currentView !== 'import' && (
          <button
            onClick={() => setCurrentView('import')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>
        )}

        {/* Add Transaction Button */}
        <button
          onClick={onOpenAddTx}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-emerald-600/30 transition-all duration-150 transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">Add</span>
        </button>

        {/* Mobile Theme Toggle */}
        <button
          onClick={() => setDarkMode(prev => !prev)}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
