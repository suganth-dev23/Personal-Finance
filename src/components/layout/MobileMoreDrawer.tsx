import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Tags,
  ShieldCheck,
  UploadCloud,
  Settings,
  Sparkles,
  Sun,
  Moon,
  Users,
} from 'lucide-react';
import { useFinance, AppView } from '../../context/FinanceContext';

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMoreDrawer: React.FC<MobileMoreDrawerProps> = ({ isOpen, onClose }) => {
  const { currentView, setCurrentView, darkMode, setDarkMode } = useFinance();
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setShouldRender(true);
      document.body.style.overflow = 'hidden';

      const frameId = requestAnimationFrame(() => {
        setIsAnimatingIn(true);
      });

      return () => {
        cancelAnimationFrame(frameId);
        document.body.style.overflow = 'unset';
      };
    } else {
      setIsAnimatingIn(false);
      closeTimerRef.current = window.setTimeout(() => {
        setShouldRender(false);
      }, 200);

      return () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const ALL_SECTIONS: { id: AppView; label: string; icon: React.ElementType }[] = [
    { id: 'people', label: 'People / Splits & IOUs', icon: Users },
    { id: 'categories', label: 'Spending Categories', icon: Tags },
    { id: 'emergency', label: 'Emergency Fund (6-Mo)', icon: ShieldCheck },
    { id: 'import', label: 'Import Statement (CSV/PDF)', icon: UploadCloud },
    { id: 'ai', label: 'AI Health Summary (BYOK)', icon: Sparkles },
    { id: 'settings', label: 'Settings & Data Backup', icon: Settings },
  ];

  const handleSelect = (view: AppView) => {
    setCurrentView(view);
    onClose();
  };

  return (
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
        className={`relative bg-white dark:bg-[#131822] rounded-t-3xl p-6 border-t border-slate-200/90 dark:border-[#202836] shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto transition-transform duration-250 ease-out transform ${
          isAnimatingIn ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#202836]">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            All DhanVeda Features
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#171E2A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          {ALL_SECTIONS.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 dark:bg-[#171E2A] dark:text-[#F5B742]'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#171E2A]/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-slate-900 dark:text-[#F5B742]' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-[#202836] flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Theme</span>
          <button
            onClick={() => setDarkMode(prev => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#171E2A] hover:bg-slate-200 dark:hover:bg-[#202836] text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors active:scale-95"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />}
            <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
