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
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#131822] h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 dark:border-[#202836]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5B742] via-[#E5A732] to-[#B27824] flex items-center justify-center text-[#0B0E14] font-black text-xl shadow-md shadow-[#F5B742]/20 border border-[#F5B742]/30">
            ₹
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white leading-none tracking-tight">
              DhanVeda
            </h1>
            <p className="text-xs font-medium text-[#C28834] dark:text-[#F5B742]/90 mt-1">
              INR Wealth & Health
            </p>
          </div>
        </div>

        {/* Quick Balance Preview */}
        <div className="mt-4 p-3.5 bg-slate-50 dark:bg-[#171E2A]/70 rounded-2xl border border-slate-100 dark:border-[#202836]">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Total net worth
          </p>
          <p className="text-base font-bold font-numeric text-slate-900 dark:text-white mt-0.5">
            {formatINR(totalBalance)}
          </p>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={onOpenAddTx}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm shadow-sm transition-all duration-150 transform active:scale-[0.98]"
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
                  ? 'bg-slate-100 text-slate-900 dark:bg-[#171E2A] dark:text-[#F5B742] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-[#171E2A]/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? 'text-slate-900 dark:text-[#F5B742]'
                      : isAI
                      ? 'text-[#C28834] dark:text-[#F5B742]'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {isAI && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F5B742]/15 text-[#925F18] dark:text-[#F5B742]">
                  BYOK
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Theme Toggle */}
      <div className="p-4 border-t border-slate-100 dark:border-[#202836] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>100% Local Storage</span>
        </div>
        <button
          onClick={() => setDarkMode(prev => !prev)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#171E2A] transition-colors"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
