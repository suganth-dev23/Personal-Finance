import React from 'react';
import { Flame, Trophy, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';
import { useFinance } from '../../context/FinanceContext';
import { AnimatedNumber } from './AnimatedNumber';
import { getTodayString } from '../../utils/date';

interface StreakBannerProps {
  compact?: boolean;
}

export const StreakBanner: React.FC<StreakBannerProps> = ({ compact = false }) => {
  const { streak, levelInfo } = useGamification();
  const { setCurrentView } = useFinance();
  const isLoggedToday = streak.lastActiveDate === getTodayString();

  const isTitan = streak.currentStreak >= 30;
  const isHabit = streak.currentStreak >= 7;
  const isSpark = streak.currentStreak >= 3;
  const isStreakBroken = streak.currentStreak === 0 || (streak.longestStreak > 2 && streak.currentStreak <= 1 && !isLoggedToday);

  const streakTierLabel = isStreakBroken
    ? 'Streak Interrupted'
    : isTitan
    ? 'Titan Discipline'
    : isHabit
    ? 'Habit Formed'
    : isSpark
    ? 'Momentum Building'
    : 'Day Initiator';

  if (compact) {
    return (
      <button
        onClick={() => setCurrentView('badges')}
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer ${
          isStreakBroken
            ? 'bg-slate-50/60 dark:bg-[#171E2A]/60 border-slate-200/80 dark:border-[#202836] text-slate-500 hover:bg-slate-100 dark:hover:bg-[#202836]'
            : isHabit
            ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-[#F5B742] hover:bg-amber-500/20'
            : 'bg-slate-50 dark:bg-[#171E2A] border-slate-200/90 dark:border-[#202836] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#202836]'
        }`}
        title={`Current streak: ${streak.currentStreak} days. Best: ${streak.longestStreak} days. Click to view Achievements.`}
      >
        <Flame
          className={`w-4 h-4 transition-transform group-hover:scale-110 ${
            isStreakBroken
              ? 'text-slate-400 dark:text-slate-500 animate-desaturate-pulse opacity-60'
              : isTitan
              ? 'text-amber-500 animate-pulse-gold fill-amber-500'
              : isHabit
              ? 'text-amber-500 fill-amber-500/60'
              : 'text-amber-600 dark:text-amber-400'
          }`}
        />
        <span className="font-numeric font-bold text-xs sm:text-sm">
          {streak.currentStreak}d
        </span>
        <span className="hidden sm:inline text-[11px] font-medium opacity-80">
          streak
        </span>
      </button>
    );
  }

  return (
    <div
      onClick={() => setCurrentView('badges')}
      className={`group relative overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md ${
        isStreakBroken
          ? 'bg-slate-50/50 dark:bg-[#131822] border-slate-200/90 dark:border-[#202836] hover:border-amber-500/30'
          : isTitan
          ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/40 ring-1 ring-amber-500/20'
          : isHabit
          ? 'bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/30'
          : 'bg-slate-50/70 dark:bg-[#171E2A]/70 border-slate-200/90 dark:border-[#202836] hover:border-amber-500/30'
      }`}
    >
      {/* Background glow decoration */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-amber-500/10 blur-xl pointer-events-none group-hover:bg-amber-500/15 transition-colors" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Flame and Numbers */}
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-transform group-hover:scale-105 ${
              isStreakBroken
                ? 'bg-slate-100 dark:bg-[#171E2A] text-slate-400 border border-slate-200/80 dark:border-[#202836]'
                : isTitan
                ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/25'
                : isHabit
                ? 'bg-amber-500/20 text-[#F5B742] border border-amber-500/30'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            <Flame
              className={`w-6 h-6 ${
                isStreakBroken
                  ? 'text-slate-400 dark:text-slate-500 fill-slate-300 dark:fill-slate-600 animate-desaturate-pulse opacity-60'
                  : isTitan
                  ? 'fill-slate-950 animate-pulse-gold'
                  : isHabit
                  ? 'fill-amber-500/40'
                  : ''
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                isStreakBroken ? 'text-slate-500 dark:text-slate-400' : 'text-amber-700 dark:text-[#F5B742]'
              }`}>
                {streakTierLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-[#202836] text-slate-600 dark:text-slate-300">
                <Trophy className="w-2.5 h-2.5 text-amber-500" />
                Best: {streak.longestStreak}d
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black font-numeric tracking-tight text-slate-900 dark:text-white">
                <AnimatedNumber
                  value={streak.currentStreak}
                  format={n => Math.round(n).toString()}
                />
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {streak.currentStreak === 1 ? 'day logging streak' : 'days logging streak'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Daily status & Level Info */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="text-left sm:text-right">
            <div className="flex items-center sm:justify-end gap-1.5 text-xs font-semibold">
              {isLoggedToday ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Logged today
                </span>
              ) : isStreakBroken ? (
                <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Streak broken · Log today
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-[#F5B742]">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Active today needed
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Level {levelInfo.level} • {levelInfo.xpToNext} XP to Lv.{levelInfo.level + 1}
            </p>
          </div>

          <div className="hidden xs:flex h-9 w-9 rounded-xl bg-slate-100 dark:bg-[#202836] items-center justify-center text-slate-400 group-hover:text-[#F5B742] transition-colors">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
