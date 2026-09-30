import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Lock,
  CheckCircle2,
  Search,
  Sparkles,
  Zap,
  Target,
  Flame,
  ShieldCheck,
  TrendingUp,
  Star,
} from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';
import { BadgeCategory, BadgeTier } from '../../types/finance';
import { ProgressBar } from '../common/ProgressBar';
import { EmptyState } from '../common/EmptyState';
import { IconRenderer } from '../common/IconRenderer';
import { useStaggerChildren } from '../../hooks/useStaggerChildren';

type FilterCategory = 'all' | BadgeCategory;
type FilterStatus = 'all' | 'unlocked' | 'locked';

const CATEGORY_TABS: { id: FilterCategory; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All Badges', icon: Trophy },
  { id: 'budgeting', label: 'Budgeting', icon: ShieldCheck },
  { id: 'saving', label: 'Saving & Goals', icon: Target },
  { id: 'investing', label: 'Investing', icon: TrendingUp },
  { id: 'consistency', label: 'Consistency', icon: Flame },
  { id: 'milestone', label: 'Milestones', icon: Zap },
];

const TIER_STYLES: Record<BadgeTier, { border: string; bg: string; text: string; label: string }> = {
  bronze: {
    border: 'border-amber-700/30 dark:border-amber-700/40 hover:border-amber-700/60',
    bg: 'bg-amber-900/10 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400',
    text: 'text-amber-700 dark:text-amber-400',
    label: 'Bronze',
  },
  silver: {
    border: 'border-slate-300 dark:border-slate-700 hover:border-slate-400',
    bg: 'bg-slate-100 dark:bg-inset-dark text-slate-700 dark:text-slate-300',
    text: 'text-slate-600 dark:text-slate-300',
    label: 'Silver',
  },
  gold: {
    border: 'border-amber-400/50 dark:border-[#F5B742]/50 hover:border-[#F5B742] shadow-xs hover:shadow-amber-500/10',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-[#F5B742]',
    text: 'text-amber-700 dark:text-[#F5B742]',
    label: 'Gold',
  },
  diamond: {
    border: 'border-cyan-400/60 dark:border-cyan-400/50 hover:border-cyan-400 shadow-xs hover:shadow-cyan-500/10',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
    text: 'text-cyan-700 dark:text-cyan-300',
    label: 'Diamond',
  },
};

export const BadgeShowcase: React.FC = () => {
  const { containerRef: badgeGridRef, getChildStyle } = useStaggerChildren(40);
  const { badges, unlockedCount, totalXP, levelInfo, streak, healthScore } = useGamification();

  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const percentComplete = badges.length > 0 ? Math.round((unlockedCount / badges.length) * 100) : 0;

  // Filter badges
  const filteredBadges = useMemo(() => {
    return badges.filter(badge => {
      // Category filter
      if (selectedCategory !== 'all' && badge.category !== selectedCategory) {
        return false;
      }
      // Status filter
      const isUnlocked = Boolean(badge.unlockedAt) || badge.progress === 100;
      if (selectedStatus === 'unlocked' && !isUnlocked) return false;
      if (selectedStatus === 'locked' && isUnlocked) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = badge.name.toLowerCase().includes(q);
        const matchesDesc = badge.description.toLowerCase().includes(q);
        return matchesName || matchesDesc;
      }

      return true;
    });
  }, [badges, selectedCategory, selectedStatus, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Hero Overview: Mineral Card with Suvarna Gold Accent */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-card-dark text-slate-900 dark:text-white p-6 sm:p-8 border border-slate-200/90 dark:border-border-dark shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F5B742] to-transparent opacity-80" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400">
                <Trophy className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                ACHIEVEMENT VAULT &amp; TROPHIES
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Financial Discipline Mastery
            </p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-black font-numeric tracking-tight text-slate-900 dark:text-white">
                {unlockedCount}{' '}
                <span className="text-xl sm:text-2xl font-semibold text-slate-400 dark:text-slate-500 font-sans">
                  of {badges.length} Unlocked
                </span>
              </h2>
              <span className="text-xs font-bold font-numeric px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-[#F5B742] border border-amber-500/20">
                {percentComplete}% Completed
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Level <span className="font-numeric font-semibold">{levelInfo.level}</span> Wealth Architect • <span className="font-numeric font-semibold">{totalXP}</span> Total XP Earned • <span className="font-numeric font-semibold">{badges.length - unlockedCount}</span> Badges Awaiting Unlock
            </p>
          </div>

          {/* Level Progress Widget in Hero */}
          <div className="w-full md:w-80 bg-slate-50 dark:bg-inset-dark p-4 rounded-2xl border border-slate-200/70 dark:border-border-dark">
            <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
              <span className="text-amber-700 dark:text-[#F5B742]">
                Level <span className="font-numeric">{levelInfo.level}</span> Progress
              </span>
              <span className="font-numeric text-slate-600 dark:text-slate-300">
                {levelInfo.progress}%
              </span>
            </div>
            <ProgressBar value={levelInfo.progress} max={100} size="sm" glowOnMilestone />
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-numeric">
              <span>{totalXP} XP</span>
              <span>{levelInfo.xpToNext} XP to Level {levelInfo.level + 1}</span>
            </div>
          </div>
        </div>

        {/* 4-column summary strip */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200/80 dark:border-border-dark">
          <div className="rounded-2xl bg-slate-50 dark:bg-inset-dark p-3.5 border border-slate-200/60 dark:border-border-dark/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Badges Earned</span>
            <p className="text-lg font-bold font-numeric text-slate-900 dark:text-white mt-0.5">
              {unlockedCount} / {badges.length}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-inset-dark p-3.5 border border-slate-200/60 dark:border-border-dark/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Total XP</span>
            <p className="text-lg font-bold font-numeric text-[#F5B742] mt-0.5">
              {totalXP} XP
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-inset-dark p-3.5 border border-slate-200/60 dark:border-border-dark/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Logging Streak</span>
            <p className="text-lg font-bold font-numeric text-emerald-600 dark:text-emerald-400 mt-0.5">
              {streak.currentStreak} Days
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-inset-dark p-3.5 border border-slate-200/60 dark:border-border-dark/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Health Rating</span>
            <p className="text-lg font-bold font-numeric text-slate-900 dark:text-white mt-0.5">
              Grade {healthScore.grade} ({healthScore.overallScore} pts)
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-card-dark rounded-3xl p-5 border border-slate-200/90 dark:border-border-dark shadow-xs space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`press flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-inset-dark text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-active-dark'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filters: Status & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-border-dark">
          {/* Status Buttons */}
          <div className="flex items-center gap-1.5">
            {(['all', 'unlocked', 'locked'] as FilterStatus[]).map(status => {
              const isActive = selectedStatus === status;
              const label =
                status === 'all'
                  ? 'All'
                  : status === 'unlocked'
                  ? `Earned (${unlockedCount})`
                  : `Locked (${badges.length - unlockedCount})`;

              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`press px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-700 dark:text-[#F5B742] border border-amber-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-inset-dark'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search achievements..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-inset-dark border border-slate-200/80 dark:border-border-dark text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      {filteredBadges.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No achievements match filter"
          description="Try resetting your category or status filters to view your trophy collection."
          actionLabel="Clear Filters"
          onAction={() => {
            setSelectedCategory('all');
            setSelectedStatus('all');
            setSearchQuery('');
          }}
        />
      ) : (
        <div ref={badgeGridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBadges.map((badge, idx) => {
            const isUnlocked = Boolean(badge.unlockedAt) || badge.progress === 100;
            const tierStyle = TIER_STYLES[badge.tier || 'bronze'];

            return (
              <div
                key={badge.id}
                style={getChildStyle(idx)}
                className={`group lift relative overflow-hidden rounded-3xl p-5 border transition-all duration-300 shadow-xs hover:shadow-md animate-slide-up ${
                  isUnlocked
                    ? `bg-white dark:bg-card-dark ${tierStyle.border}`
                    : 'bg-slate-50/50 dark:bg-card-dark/50 border-slate-200/70 dark:border-border-dark/60 opacity-85'
                }`}
              >
                {/* Header: Icon Box and Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105 ${
                        isUnlocked
                          ? tierStyle.bg
                          : 'bg-slate-100 dark:bg-inset-dark text-slate-400'
                      }`}
                    >
                      <IconRenderer
                        name={badge.icon || 'Award'}
                        className={`w-6 h-6 ${isUnlocked ? tierStyle.text : 'text-slate-400 dark:text-slate-500'}`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isUnlocked
                              ? `${tierStyle.bg} border-current`
                              : 'bg-slate-100 dark:bg-inset-dark text-slate-400 border-slate-200 dark:border-border-dark'
                          }`}
                        >
                          {tierStyle.label}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {badge.category}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {badge.name}
                      </h3>
                    </div>
                  </div>

                  {/* Lock or Check status */}
                  <div>
                    {isUnlocked ? (
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 dark:bg-inset-dark text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                  {badge.description}
                </p>

                {/* Footer Progress & XP */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-border-dark flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[11px] font-semibold">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="font-numeric text-slate-800 dark:text-slate-200 font-bold">
                      +{badge.xp} XP
                    </span>
                  </div>

                  {isUnlocked ? (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Earned
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      {typeof badge.currentCount === 'number' && typeof badge.targetCount === 'number' ? (
                        <span className="font-numeric text-[11px] text-slate-400 font-medium">
                          {badge.currentCount}/{badge.targetCount} ({badge.progress}%)
                        </span>
                      ) : (
                        <span className="font-numeric text-[11px] text-slate-400 font-medium">
                          {badge.progress}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress bar for locked badges */}
                {!isUnlocked && (badge.progress ?? 0) > 0 && (
                    <div
                      className="h-1 w-full bg-slate-100 dark:bg-inset-dark rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={Math.round(badge.progress ?? 0)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${badge.name} unlock progress`}
                    >
                      <div
                        className="h-full bg-amber-500/70 rounded-full transition-[width] duration-500"
                        style={{ width: `${badge.progress}%` }}
                      />
                    </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
