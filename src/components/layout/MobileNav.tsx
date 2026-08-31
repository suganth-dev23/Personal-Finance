import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  TrendingUp,
  Target,
  Sparkles,
  MoreHorizontal,
} from 'lucide-react';
import { useFinance, AppView } from '../../context/FinanceContext';

export const MobileNav: React.FC<{ onOpenMore: () => void }> = ({ onOpenMore }) => {
  const { currentView, setCurrentView } = useFinance();

  const PRIMARY_MOBILE_ITEMS: { id: AppView; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'transactions', label: 'History', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'investments', label: 'Invest', icon: TrendingUp },
    { id: 'dreams', label: 'Goals', icon: Target },
    { id: 'ai', label: 'AI', icon: Sparkles },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 flex items-center justify-around shadow-lg">
      {PRIMARY_MOBILE_ITEMS.map(item => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        const isAI = item.id === 'ai';

        return (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 font-medium'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} ${isAI && !isActive ? 'text-violet-500' : ''}`} />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </button>
        );
      })}

      {/* More button */}
      <button
        onClick={onOpenMore}
        className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-slate-500 dark:text-slate-400 font-medium"
      >
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">More</span>
      </button>
    </div>
  );
};
