import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Tags,
  ShieldCheck,
  TrendingUp,
  Target,
  Sparkles,
  UploadCloud,
  Settings,
  Moon,
  Sun,
  Plus,
  Users,
} from 'lucide-react';
import { useFinance, AppView } from '../../context/FinanceContext';
import { formatINR } from '../../utils/currency';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'people', label: 'People / Splits', icon: Users },
  { id: 'budgets', label: 'Budgets', icon: PieChart },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'emergency', label: 'Emergency Fund', icon: ShieldCheck },
  { id: 'investments', label: 'Investments', icon: TrendingUp },
  { id: 'dreams', label: 'Goals & Dreams', icon: Target },
  { id: 'ai', label: 'AI Health Summary', icon: Sparkles },
  { id: 'import', label: 'Import Statement', icon: UploadCloud },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  onOpenAddTx: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenAddTx }) => {
  const { currentView, setCurrentView, darkMode, setDarkMode, totalBalance } = useFinance();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-emerald-500/20">
            ₹
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none tracking-tight">
              DhanVeda
            </h1>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
              INR Wealth & Health
            </p>
          </div>
        </div>

        {/* Quick Balance Preview */}
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Total Net Worth
          </p>
          <p className="text-base font-bold text-slate-900 dark:text-emerald-400 mt-0.5">
            {formatINR(totalBalance)}
          </p>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={onOpenAddTx}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/25 transition-all duration-150 transform active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isAI = item.id === 'ai';

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isAI
                      ? 'text-violet-500 animate-pulse'
                      : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {isAI && (
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300">
                  BYOK
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Theme Toggle */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>100% Local Storage</span>
        </div>
        <button
          onClick={() => setDarkMode(prev => !prev)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
