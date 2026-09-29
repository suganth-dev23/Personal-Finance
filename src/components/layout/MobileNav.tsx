import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Users,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface MobileNavProps {
  onOpenMore: () => void;
  onOpenAddTx: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenMore, onOpenAddTx }) => {
  const { currentView, setCurrentView } = useFinance();

  return (
    <nav
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#0B0E14]/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-[#202836] px-3 py-1.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] flex items-center justify-between shadow-[0_-8px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.6)]"
    >
      {/* 1. Home */}
      <button
        type="button"
        onClick={() => setCurrentView('dashboard')}
        className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[48px] rounded-2xl transition-all duration-150 press ${
          currentView === 'dashboard'
            ? 'text-[#C28834] dark:text-[#F5B742] font-bold'
            : 'text-slate-400 dark:text-slate-500 font-medium hover:text-slate-700 dark:hover:text-slate-300'
        }`}
      >
        <LayoutDashboard
          className={`w-5 h-5 transition-transform ${
            currentView === 'dashboard' ? 'scale-110 dark:drop-shadow-[0_0_8px_rgba(245,183,66,0.35)]' : ''
          }`}
        />
        <span className="text-[11px] mt-0.5 tracking-tight font-medium">Home</span>
      </button>

      {/* 2. Ledger / Transactions */}
      <button
        type="button"
        onClick={() => setCurrentView('transactions')}
        className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[48px] rounded-2xl transition-all duration-150 press ${
          currentView === 'transactions'
            ? 'text-[#C28834] dark:text-[#F5B742] font-bold'
            : 'text-slate-400 dark:text-slate-500 font-medium hover:text-slate-700 dark:hover:text-slate-300'
        }`}
      >
        <Receipt
          className={`w-5 h-5 transition-transform ${
            currentView === 'transactions' ? 'scale-110 dark:drop-shadow-[0_0_8px_rgba(245,183,66,0.35)]' : ''
          }`}
        />
        <span className="text-[11px] mt-0.5 tracking-tight font-medium">Ledger</span>
      </button>

      {/* 3. Center Elevated Quick-Add Action Button */}
      <div className="flex-shrink-0 px-2">
        <button
          type="button"
          onClick={onOpenAddTx}
          aria-label="Add transaction or split"
          className="relative -top-3 w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-[0_6px_20px_rgba(245,183,66,0.45)] border-2 border-white dark:border-[#0B0E14] press hover:brightness-105 transition-all duration-150"
        >
          <Plus className="w-6 h-6 stroke-[2.75]" />
        </button>
      </div>

      {/* 4. Splits & IOUs */}
      <button
        type="button"
        onClick={() => setCurrentView('people')}
        className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[48px] rounded-2xl transition-all duration-150 press ${
          currentView === 'people'
            ? 'text-[#C28834] dark:text-[#F5B742] font-bold'
            : 'text-slate-400 dark:text-slate-500 font-medium hover:text-slate-700 dark:hover:text-slate-300'
        }`}
      >
        <Users
          className={`w-5 h-5 transition-transform ${
            currentView === 'people' ? 'scale-110 dark:drop-shadow-[0_0_8px_rgba(245,183,66,0.35)]' : ''
          }`}
        />
        <span className="text-[11px] mt-0.5 tracking-tight font-medium">Splits</span>
      </button>

      {/* 5. More Drawer */}
      <button
        type="button"
        onClick={onOpenMore}
        className="flex-1 flex flex-col items-center justify-center py-1 min-h-[48px] rounded-2xl text-slate-400 dark:text-slate-500 font-medium hover:text-slate-700 dark:hover:text-slate-300 press transition-all duration-150"
      >
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-[11px] mt-0.5 tracking-tight font-medium">More</span>
      </button>
    </nav>
  );
};
