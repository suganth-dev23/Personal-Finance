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
    <header className="sticky top-0 z-20 bg-surface/95 border-b border-line px-4 sm:px-8 py-4 flex items-center justify-between transition-colors">
      {/* Title info */}
 <div>
 <div className="flex items-center gap-2 min-w-0">
 <h1 className="text-lg sm:text-2xl font-black text-ink-1 tracking-tight leading-none truncate max-w-[180px] sm:max-w-none">
 {meta.title}
 </h1>
 <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sunken text-ink-2 border border-line">
 {monthName} {year}
 </span>
 </div>
 <p className="hidden md:block text-xs font-medium text-ink-3 mt-1">
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
 className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sunken hover:bg-line text-xs font-medium transition-colors press"
 >
 {syncStatus === 'syncing' ? (
 <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
 ) : syncStatus === 'error' ? (
 <span className="w-2 h-2 rounded-full bg-negative"></span>
 ) : (
 <span className="w-2 h-2 rounded-full bg-positive"></span>
 )}
 <span className="hidden md:inline text-ink-2">
 {syncStatus === 'syncing' ? 'Syncing...' : 'Drive Synced'}
 </span>
 </button>
 ) : null}

 {/* Month flow pill */}
 <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-sunken border border-line text-xs">
 <div>
 <span className="text-ink-3">In:</span>{' '}
 <span className="font-semibold font-numeric text-positive">+{formatINR(currentMonthIncome)}</span>
 </div>
 <div className="w-px h-3 bg-line"></div>
 <div>
 <span className="text-ink-3">Out:</span>{' '}
 <span className="font-semibold font-numeric text-ink-1">-{formatINR(currentMonthExpense)}</span>
 </div>
 </div>

 {/* Daily Streak Indicator */}
 <StreakBanner compact={true} />

 {/* AI Quick Button */}
 {currentView !== 'ai' && (
 <button
 onClick={() => setCurrentView('ai')}
 className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-reward bg-reward-tint hover:bg-reward-fill/20 border border-reward/30 transition-colors press"
 >
 <Sparkles className="w-3.5 h-3.5 text-reward" />
 <span>AI Health</span>
 </button>
 )}

 {/* Add Transaction Button (Tablet only, desktop uses Sidebar CTA to prevent duplication) */}
 <button
 onClick={onOpenAddTx}
 className="hidden sm:flex lg:hidden items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:opacity-95 text-on-primary font-bold text-xs sm:text-sm shadow-xs transition-colors press"
 >
 <Plus className="w-4 h-4" />
 <span>Add</span>
 </button>

 {/* Mobile Theme Toggle */}
 <button
 onClick={() => setDarkMode(prev => !prev)}
 className="lg:hidden p-2 rounded-xl text-ink-3 hover:bg-sunken transition-colors press"
 title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
 aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
 >
 {darkMode ? <Sun className="w-4 h-4 text-reward" /> : <Moon className="w-4 h-4" />}
 </button>
 </div>
 </header>
 );
};
