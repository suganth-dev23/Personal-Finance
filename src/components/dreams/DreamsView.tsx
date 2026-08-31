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
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { DreamGoal } from '../../types/finance';
import { formatINR, formatCompactINR } from '../../utils/currency';
import { formatDate, calculateMonthsDiff } from '../../utils/date';
import { IconRenderer } from '../common/IconRenderer';
import { ProgressBar } from '../common/ProgressBar';
import { DreamModal } from './DreamModal';
import { DreamContributionModal } from './DreamContributionModal';

export const DreamsView: React.FC = () => {
  const { dreams, deleteDream, totalGoalsTarget, totalGoalsSaved } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDream, setSelectedDream] = useState<DreamGoal | null>(null);

  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [targetContributionDream, setTargetContributionDream] = useState<DreamGoal | null>(null);

  const overallPercent = totalGoalsTarget > 0 ? (totalGoalsSaved / totalGoalsTarget) * 100 : 0;

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
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Dreams & Milestone Goals Tracker
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Turn your aspirational dreams into achievable targets with auto-calculated monthly saving plans
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-emerald-600/30 transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Goal</span>
          </button>
        </div>

        {/* 3 Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Target Across Goals
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {formatINR(totalGoalsTarget)}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Saved So Far
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatINR(totalGoalsSaved)}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Overall Progress
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {overallPercent.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar value={totalGoalsSaved} max={totalGoalsTarget} size="md" color="#6366f1" />
        </div>
      </div>

      {/* Goals Grid */}
      {dreams.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-200">No active goals yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Add a dream like a vacation, gadget, or down payment to track your savings journey.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {dreams.map(dream => {
            const percent = dream.targetAmount > 0 ? (dream.currentSaved / dream.targetAmount) * 100 : 0;
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

            return (
              <div
                key={dream.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all"
              >
                {/* Accent top stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: dream.color || '#3b82f6' }}
                />

                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs"
                        style={{
                          backgroundColor: `${dream.color || '#3b82f6'}20`,
                          color: dream.color || '#3b82f6',
                        }}
                      >
                        <IconRenderer name={dream.icon || 'Target'} className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                            {dream.name}
                          </h3>
                          {dream.priority === 'high' && (
                            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                              High
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{dream.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(dream)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
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
                        <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                          {formatINR(dream.currentSaved)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Target
                        </span>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                          {formatINR(dream.targetAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-500">{percent.toFixed(1)}% Complete</span>
                        <span className={isCompleted ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                          {isCompleted ? 'Accomplished 🎉' : `${formatINR(remaining)} to go`}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(percent, 100)}%`,
                            backgroundColor: dream.color || '#3b82f6',
                          }}
                        />
                      </div>
                    </div>

                    {/* Deadline & Suggested Monthly Savings */}
                    {dream.targetDate && !isCompleted && monthsLeft !== null && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Target: {formatDate(dream.targetDate)}</span>
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {monthsLeft} months left
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-bold pt-1 border-t border-slate-200/60 dark:border-slate-700">
                          <span className="text-indigo-600 dark:text-indigo-400">Suggested Plan:</span>
                          <span className="text-slate-900 dark:text-white">{formatINR(suggestedMonthly)} / month</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {dream.contributions?.length || 0} contributions
                  </span>
                  <button
                    onClick={() => handleOpenContribution(dream)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 text-xs font-bold transition-colors"
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
