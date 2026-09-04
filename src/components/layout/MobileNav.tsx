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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#0B0E14]/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-[#202836] px-2 py-1.5 pb-2.5 flex items-center justify-around shadow-[0_-8px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
      {PRIMARY_MOBILE_ITEMS.map(item => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        const isAI = item.id === 'ai';

        return (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 ${
              isActive
                ? 'text-slate-900 dark:text-[#F5B742] font-bold bg-slate-100 dark:bg-[#171E2A]'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon
              className={`w-5 h-5 transition-transform duration-200 ${
                isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(245,183,66,0.4)]' : ''
              } ${isAI && !isActive ? 'text-[#C28834] dark:text-[#F5B742]' : ''}`}
            />
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            {isActive && (
              <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-[#F5B742] shadow-[0_0_6px_rgba(245,183,66,0.8)]" />
            )}
          </button>
        );
      })}

      {/* More button */}
      <button
        onClick={onOpenMore}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 tracking-tight">More</span>
      </button>
    </div>
  );
};
