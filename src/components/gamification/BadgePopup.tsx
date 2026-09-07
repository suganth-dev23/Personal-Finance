import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, X, Sparkles, Award, Star, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Badge, BadgeTier } from '../../types/finance';
import { IconRenderer } from '../common/IconRenderer';
import { dualSideCannons } from '../../utils/confetti';

const TIER_CONFIG: Record<BadgeTier, { label: string; border: string; bg: string; text: string; glow: string }> = {
  bronze: {
    label: 'Bronze Achievement',
    border: 'border-amber-700/40',
    bg: 'bg-amber-900/10 text-amber-700 dark:text-amber-400',
    text: 'text-amber-700 dark:text-amber-400',
    glow: 'rgba(180, 83, 9, 0.25)',
  },
  silver: {
    label: 'Silver Achievement',
    border: 'border-slate-300 dark:border-slate-600',
    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200',
    text: 'text-slate-700 dark:text-slate-200',
    glow: 'rgba(148, 163, 184, 0.25)',
  },
  gold: {
    label: 'Gold Achievement',
    border: 'border-amber-400 dark:border-[#F5B742]',
    bg: 'bg-amber-500/15 text-amber-700 dark:text-[#F5B742]',
    text: 'text-amber-700 dark:text-[#F5B742]',
    glow: 'rgba(245, 183, 66, 0.35)',
  },
  diamond: {
    label: 'Diamond Achievement',
    border: 'border-cyan-400 dark:border-cyan-300',
    bg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300',
    text: 'text-cyan-600 dark:text-cyan-300',
    glow: 'rgba(56, 189, 248, 0.35)',
  },
};

export const BadgePopup: React.FC = () => {
  const { subscribeFinanceEvent, setCurrentView } = useFinance();
  const [badgeQueue, setBadgeQueue] = useState<Badge[]>([]);
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to badge_earned finance event
  useEffect(() => {
    if (!subscribeFinanceEvent) return;

    const unsubscribe = subscribeFinanceEvent((event) => {
      if (event.type === 'badge_earned' && event.badge) {
        setBadgeQueue(prev => [...prev, event.badge as Badge]);
      }
    });

    return unsubscribe;
  }, [subscribeFinanceEvent]);

  // Handle queue progression
  useEffect(() => {
    if (!currentBadge && badgeQueue.length > 0) {
      const nextBadge = badgeQueue[0];
      setBadgeQueue(prev => prev.slice(1));
      setCurrentBadge(nextBadge);
      dualSideCannons();

      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
      autoDismissTimerRef.current = setTimeout(() => {
        setCurrentBadge(null);
      }, 5000);
    }
  }, [currentBadge, badgeQueue]);

  const handleDismiss = useCallback(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
    }
    setCurrentBadge(null);
  }, []);

  const handleViewVault = useCallback(() => {
    handleDismiss();
    setCurrentView('badges');
  }, [handleDismiss, setCurrentView]);

  if (!currentBadge || typeof document === 'undefined') {
    return null;
  }

  const tier = currentBadge.tier || 'bronze';
  const config = TIER_CONFIG[tier];

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={handleDismiss}
      />

      {/* Celebratory Modal Card */}
      <div
        className={`relative z-10 max-w-md w-full rounded-3xl bg-white dark:bg-[#131822] border-2 ${config.border} p-7 text-center shadow-2xl animate-badge-unlock overflow-hidden`}
        style={{
          boxShadow: `0 20px 50px -10px ${config.glow}`,
        }}
      >
        {/* Background decorative radiant glow */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-60"
          style={{ backgroundColor: config.glow }}
        />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#171E2A] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tier Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-5 border border-current shadow-xs"
          style={{ backgroundColor: `${config.glow}`, color: 'inherit' }}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className={config.text}>{config.label}</span>
        </div>

        {/* Center Badge Icon Container */}
        <div className="relative mx-auto w-24 h-24 mb-5 flex items-center justify-center">
          {/* Animated concentric rings */}
          <div className="absolute inset-0 rounded-3xl border border-dashed border-amber-400/40 animate-spin-slow" />
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg ${config.bg} border ${config.border}`}
          >
            <IconRenderer
              name={currentBadge.icon || 'Award'}
              className={`w-10 h-10 ${config.text}`}
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Badge Title & XP */}
        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          {currentBadge.name}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto mb-5">
          {currentBadge.description}
        </p>

        {/* XP Award Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-[#F5B742] border border-amber-500/25 mb-6">
          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
          <span className="font-numeric font-extrabold text-base">+{currentBadge.xp} XP</span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">added to your score</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleViewVault}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#171E2A] dark:hover:bg-[#202836] text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold transition-colors"
          >
            View Trophy Vault
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95"
          >
            Collect &amp; Continue
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
