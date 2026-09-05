import React, { useState } from 'react';
import {
  Plus,
  Target,
  Edit3,
  Trash2,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { DreamGoal } from '../../types/finance';
import { formatINR, formatCompactINR } from '../../utils/currency';
import { formatDate, calculateMonthsDiff } from '../../utils/date';
import { IconRenderer } from '../common/IconRenderer';
import { DreamModal } from './DreamModal';
import { DreamContributionModal } from './DreamContributionModal';

export const DreamsView: React.FC = () => {
  const { dreams, deleteDream, totalGoalsTarget, totalGoalsSaved } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDream, setSelectedDream] = useState<DreamGoal | null>(null);

  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [targetContributionDream, setTargetContributionDream] = useState<DreamGoal | null>(null);

  const overallPercent = totalGoalsTarget > 0 ? Math.min(100, Math.round((totalGoalsSaved / totalGoalsTarget) * 100)) : 0;
  const completedGoalsCount = dreams.filter(d => d.targetAmount > 0 && d.currentSaved >= d.targetAmount).length;

  const handleEdit = (dream: DreamGoal) => {
    setSelectedDream(dream);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedDream(null);
    setIsModalOpen(true);
  };

  const handleOpenContribution = (dream: DreamGoal) => {
    setTargetContributionDream(dream);
    setIsContributionOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Hero Overview: Mineral Card with Gold Milestone Highlight */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#131822] text-slate-900 dark:text-white p-6 sm:p-8 border border-slate-200/90 dark:border-[#202836] shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F5B742] to-transparent opacity-80" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400">
                <Target className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                MILESTONE GOALS &amp; DREAMS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Total Accumulated Goal Savings
            </p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-black font-numeric tracking-tight text-slate-900 dark:text-white">
                {formatINR(totalGoalsSaved)}
              </h2>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {overallPercent}% reached
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Target across all goals: <span className="font-numeric">{formatINR(totalGoalsTarget)}</span> • {completedGoalsCount} of {dreams.length} completed
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-sm font-bold text-slate-950 shadow-sm hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>New Milestone</span>
            </button>
          </div>
        </div>

        {/* Global Progress Track */}
        <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-[#202836]">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
            <span className="font-numeric">Overall Progress: {overallPercent}%</span>
            <span className="font-numeric">Target: {formatINR(totalGoalsTarget)}</span>
          </div>
          <div className="h-3 w-full bg-slate-100 dark:bg-[#171E2A] rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-[#202836]">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>

        {/* 4-column summary strip */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200/80 dark:border-[#202836]">
          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Total Target</span>
            <p className="text-lg font-bold font-numeric text-slate-900 dark:text-white mt-0.5">{formatCompactINR(totalGoalsTarget)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Total Saved</span>
            <p className="text-lg font-bold font-numeric text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCompactINR(totalGoalsSaved)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Active Dreams</span>
            <p className="text-lg font-bold font-numeric text-slate-900 dark:text-white mt-0.5">{dreams.length} goals</p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Success Rate</span>
            <p className="text-lg font-bold font-numeric text-emerald-600 dark:text-emerald-400 mt-0.5">
              {dreams.length > 0 ? `${Math.round((completedGoalsCount / dreams.length) * 100)}%` : '0%'}
            </p>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Active Milestone Goals
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Target savings, vacations, vehicle purchases, and life dreams
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {dreams.length} goals
        </span>
      </div>

      {/* Goals Grid */}
      {dreams.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#131822] rounded-3xl border border-dashed border-slate-200/90 dark:border-[#202836] p-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-[#F5B742] flex items-center justify-center mx-auto mb-4">
            <Target className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No active goals yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Add a dream like a vacation, gadget, vehicle, or down payment to build an automatic monthly savings plan.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-5 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition-all"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dreams.map(dream => {
            const percent = dream.targetAmount > 0 ? Math.min(100, Math.round((dream.currentSaved / dream.targetAmount) * 100)) : 0;
            const remaining = Math.max(0, dream.targetAmount - dream.currentSaved);
            const isCompleted = percent >= 100;

            // Suggested monthly savings calculation
            let monthsLeft: number | null = null;
            let suggestedMonthly = 0;
            if (dream.targetDate && !isCompleted) {
              const today = new Date().toISOString().split('T')[0];
              monthsLeft = calculateMonthsDiff(today, dream.targetDate);
              suggestedMonthly = monthsLeft > 0 ? Math.ceil(remaining / monthsLeft) : remaining;
            }

            const themeColor = dream.color || '#10b981';

            return (
              <div
                key={dream.id}
                className="group bg-white dark:bg-[#131822] rounded-3xl p-6 border border-slate-200/90 dark:border-[#202836] hover:border-emerald-500/40 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between relative overflow-hidden"
              >
                {/* Accent top stripe glow */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: themeColor }}
                />

                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105"
                        style={{
                          backgroundColor: `${themeColor}20`,
                          color: themeColor,
                        }}
                      >
                        <IconRenderer name={dream.icon || 'Target'} className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                            {dream.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400 font-medium">{dream.category}</span>
                          {dream.priority === 'high' && (
                            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                              High
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(dream)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/90 dark:border-[#202836] text-slate-400 hover:bg-slate-50 dark:hover:bg-[#171E2A] hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        title="Edit Goal"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete goal "${dream.name}"?`)) {
                            deleteDream(dream.id);
                          }
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/90 dark:border-[#202836] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="mt-5 space-y-3">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Saved
                        </span>
                        <p className="text-xl font-extrabold text-slate-900 dark:text-white font-numeric">
                          {formatINR(dream.currentSaved)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Target
                        </span>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 font-numeric">
                          {formatINR(dream.targetAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-500 dark:text-slate-400 font-numeric">{percent}% Complete</span>
                        <span className={isCompleted ? 'text-emerald-500 font-bold' : 'text-slate-400'}>
                          {isCompleted ? 'Accomplished 🎉' : <span className="font-numeric">{formatINR(remaining)} left</span>}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-[#171E2A] rounded-full h-2.5 overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(percent, 100)}%`,
                            backgroundColor: themeColor,
                          }}
                        />
                      </div>
                    </div>

                    {/* Deadline & Suggested Monthly Savings */}
                    {dream.targetDate && !isCompleted && monthsLeft !== null && (
                      <div className="p-3.5 bg-slate-50 dark:bg-[#171E2A] rounded-2xl border border-slate-200/80 dark:border-[#202836] text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Target: {formatDate(dream.targetDate)}</span>
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {monthsLeft} mo. left
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-bold pt-1.5 border-t border-slate-200/60 dark:border-[#202836]">
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Monthly Target:
                          </span>
                          <span className="text-slate-900 dark:text-white font-numeric">{formatINR(suggestedMonthly)} / mo</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#202836] flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    {dream.contributions?.length || 0} contributions
                  </span>
                  <button
                    onClick={() => handleOpenContribution(dream)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#171E2A] hover:bg-amber-500 hover:text-slate-950 dark:hover:bg-[#F5B742] dark:hover:text-slate-950 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all duration-200 active:scale-95 border border-slate-200/60 dark:border-[#202836]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Savings</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DreamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialDream={selectedDream}
      />

      <DreamContributionModal
        isOpen={isContributionOpen}
        onClose={() => setIsContributionOpen(false)}
        dream={targetContributionDream}
      />
    </div>
  );
};
