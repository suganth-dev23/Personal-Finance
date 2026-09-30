import React from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Tags,
  ShieldCheck,
  Settings,
  Sparkles,
  Sun,
  Moon,
  CalendarClock,
  Trophy,
  PieChart,
  TrendingUp,
  Target,
} from 'lucide-react';
import { useFinance, AppView } from '../../context/FinanceContext';
import { useOverlayTransition } from '../../hooks/useOverlayTransition';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMoreDrawer: React.FC<MobileMoreDrawerProps> = ({ isOpen, onClose }) => {
  const { currentView, setCurrentView, darkMode, setDarkMode } = useFinance();
  const { shouldRender, isAnimatingIn } = useOverlayTransition({
    isOpen,
    onClose,
    duration: 250,
  });

  const focusTrapRef = useFocusTrap<HTMLDivElement>({
    isActive: Boolean(shouldRender && isAnimatingIn),
    onEscape: onClose,
  });

  if (!shouldRender || typeof document === 'undefined') return null;

  const ALL_SECTIONS: { id: AppView; label: string; desc: string; icon: React.ElementType; fullWidth?: boolean }[] = [
    { id: 'budgets', label: 'Budgets', desc: 'Category limits', icon: PieChart },
    { id: 'investments', label: 'Investments', desc: 'Portfolio & assets', icon: TrendingUp },
    { id: 'dreams', label: 'Goals', desc: 'Target milestones', icon: Target },
    { id: 'emergency', label: 'Emergency', desc: 'Safety runway', icon: ShieldCheck },
    { id: 'recurring', label: 'Recurring', desc: 'Bills & EMIs', icon: CalendarClock },
    { id: 'categories', label: 'Categories', desc: 'Tags & colors', icon: Tags },
    { id: 'ai', label: 'AI Health', desc: 'Smart advisor', icon: Sparkles },
    { id: 'badges', label: 'Badges', desc: 'Milestones & XP', icon: Trophy },
    { id: 'settings', label: 'Settings & Import', desc: 'Drive Sync, Backup & Statement Import', icon: Settings, fullWidth: true },
  ];

  const handleSelect = (view: AppView) => {
    setCurrentView(view);
    onClose();
  };

  const drawerContent = (
    <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 ease-out ${
          isAnimatingIn ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Drawer with slide-up transition */}
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={`relative bg-white dark:bg-card-dark rounded-t-3xl p-4 pt-2.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-slate-200/90 dark:border-border-dark shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto transition-transform duration-250 ease-out transform will-change-transform ${
          isAnimatingIn ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag Pill */}
        <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-active-dark mx-auto mb-1" />

        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-border-dark">
          <div>
            <h3 id="drawer-title" className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              Explore &amp; Planning
            </h3>
            <p className="text-[11px] text-slate-400">All wealth, budgeting and configuration tools</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-inset-dark transition-colors press"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact 2-column Tile Grid */}
        <div className="grid grid-cols-2 gap-2">
          {ALL_SECTIONS.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-2xl text-left transition-all press ${
                  item.fullWidth ? 'col-span-2' : ''
                } ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-[#F5B742] border border-amber-500/30'
                    : 'bg-slate-50/80 dark:bg-inset-dark text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-border-dark hover:bg-slate-100 dark:hover:bg-[#1C2433]'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-amber-500/20 text-[#F5B742]'
                    : 'bg-white dark:bg-active-dark text-slate-600 dark:text-slate-300 shadow-2xs'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-bold leading-tight truncate">{item.label}</span>
                  <span className="block text-[10px] text-slate-400 leading-tight truncate mt-0.5">{item.desc}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-border-dark flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Theme</span>
          <button
            onClick={() => setDarkMode(prev => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-inset-dark hover:bg-slate-200 dark:hover:bg-active-dark text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors press"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />}
            <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};
