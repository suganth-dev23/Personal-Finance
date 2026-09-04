import React, { useState, useMemo } from 'react';
import { Plus, Edit3, Trash2, AlertCircle, CheckCircle, PieChart, ShieldAlert, Sparkles, TrendingDown } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Budget } from '../../types/finance';
import { formatINR, formatCompactINR } from '../../utils/currency';
import { ProgressBar } from '../common/ProgressBar';
import { IconRenderer } from '../common/IconRenderer';
import { BudgetModal } from './BudgetModal';

export const BudgetsView: React.FC = () => {
  const {
    budgets,
    categories,
    categorySpendingThisMonth,
    deleteBudget,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const totalBudgeted = useMemo(() => {
    return budgets.reduce((acc, b) => acc + b.monthlyLimit, 0);
  }, [budgets]);

  const totalSpentInBudgeted = useMemo(() => {
    const budgetNames = new Set(budgets.map(b => b.category.toLowerCase()));
    return categorySpendingThisMonth
      .filter(c => budgetNames.has(c.category.toLowerCase()))
      .reduce((acc, c) => acc + c.spent, 0);
  }, [budgets, categorySpendingThisMonth]);

  const remainingBudget = totalBudgeted - totalSpentInBudgeted;
  const overallPercent = totalBudgeted > 0 ? Math.min(100, Math.round((totalSpentInBudgeted / totalBudgeted) * 100)) : 0;
  const isOverTotal = remainingBudget < 0;

  const categoryMap = useMemo(() => {
    return new Map(categories.map(c => [c.name.toLowerCase(), c]));
  }, [categories]);

  const spendingMap = useMemo(() => {
    return new Map(categorySpendingThisMonth.map(c => [c.category.toLowerCase(), c.spent]));
  }, [categorySpendingThisMonth]);

  const handleEdit = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedBudget(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Overview: Modern Obsidian & Glowing Emerald Gauge */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl shadow-slate-950/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-3 h-3 text-emerald-400" /> Monthly Budget Status
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {overallPercent}% Used
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                {formatINR(Math.abs(remainingBudget))}
              </span>
              <span className={`text-sm font-bold ${isOverTotal ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isOverTotal ? 'over budget' : 'remaining'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Of {formatINR(totalBudgeted)} total monthly allocated limit
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Set New Budget</span>
            </button>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2 font-medium">
            <span>Spent: {formatINR(totalSpentInBudgeted)}</span>
            <span>Limit: {formatINR(totalBudgeted)}</span>
          </div>
          <div className="h-3 w-full bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isOverTotal
                  ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                  : overallPercent >= 85
                  ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_14px_rgba(16,185,129,0.5)]'
              }`}
              style={{ width: `${Math.min(100, overallPercent)}%` }}
            />
          </div>
        </div>

        {/* Micro-metrics Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Allowed</span>
            <p className="text-sm sm:text-base font-extrabold text-white mt-0.5">{formatCompactINR(totalBudgeted)}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Actual Spent</span>
            <p className="text-sm sm:text-base font-extrabold text-rose-400 mt-0.5">{formatCompactINR(totalSpentInBudgeted)}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Categories</span>
            <p className="text-sm sm:text-base font-extrabold text-white mt-0.5">{budgets.length} active</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pace Status</span>
            <p className={`text-sm sm:text-base font-extrabold mt-0.5 ${isOverTotal ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isOverTotal ? 'Over Budget' : overallPercent >= 85 ? 'Near Ceiling' : 'Safe Velocity'}
            </p>
          </div>
        </div>
      </div>

      {/* Categories Budgets Grid */}
      {budgets.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <PieChart className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No category budgets defined</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Set spending caps for categories like Dining, Groceries, Shopping or Fuel to stay in total control.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/25 transition-all"
          >
            Create Your First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map(b => {
            const catInfo = categoryMap.get(b.category.toLowerCase());
            const spent = spendingMap.get(b.category.toLowerCase()) || 0;
            const remaining = b.monthlyLimit - spent;
            const percentUsed = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
            const isOver = spent > b.monthlyLimit;
            const isNear = !isOver && percentUsed >= 80;

            return (
              <div
                key={b.id}
                className={`group bg-white dark:bg-slate-900/90 rounded-3xl p-5 border transition-all duration-300 shadow-sm hover:shadow-md ${
                  isOver
                    ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/20'
                    : isNear
                    ? 'border-amber-300 dark:border-amber-900/60'
                    : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: `${catInfo?.color || '#10b981'}20`,
                        color: catInfo?.color || '#10b981',
                      }}
                    >
                      <IconRenderer name={catInfo?.icon || 'Tag'} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {b.category}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        Limit: <span className="font-bold text-slate-700 dark:text-slate-300">{formatINR(b.monthlyLimit)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(b)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Limit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Remove budget for ${b.category}?`)) {
                          deleteBudget(b.id);
                        }
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress & Numbers */}
                <div className="mt-5 space-y-2.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Spent: </span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{formatINR(spent)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">{remaining >= 0 ? 'Remaining: ' : 'Over: '}</span>
                      <span
                        className={`font-extrabold ${
                          remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formatINR(Math.abs(remaining))}
                      </span>
                    </div>
                  </div>

                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver
                          ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                          : isNear
                          ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                          : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                      }`}
                      style={{ width: `${Math.min(100, percentUsed)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span className="font-semibold text-slate-400">{percentUsed.toFixed(0)}% utilized</span>
                    {isOver ? (
                      <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Exceeded by {formatINR(spent - b.monthlyLimit)}
                      </span>
                    ) : isNear ? (
                      <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Near limit
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        On track
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialBudget={selectedBudget}
      />
    </div>
  );
};
