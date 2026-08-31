import React, { useState, useMemo } from 'react';
import { Plus, Edit3, Trash2, AlertCircle, CheckCircle, PieChart, ShieldAlert } from 'lucide-react';
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
    currentMonthExpense,
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

  const overallPercent = totalBudgeted > 0 ? (totalSpentInBudgeted / totalBudgeted) * 100 : 0;

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
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Monthly Budget Utilization
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracking your total allowed spending vs. actual expenses this month
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-emerald-600/30 transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Set New Budget</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Budget Limit
            </span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {formatINR(totalBudgeted)}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Spent in Budgeted
            </span>
            <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
              {formatINR(totalSpentInBudgeted)}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Remaining Allowance
            </span>
            <p
              className={`text-xl font-extrabold mt-0.5 ${
                totalBudgeted - totalSpentInBudgeted >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatINR(totalBudgeted - totalSpentInBudgeted)}
            </p>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mt-4">
          <ProgressBar
            value={totalSpentInBudgeted}
            max={totalBudgeted}
            showPercentage
            alertThresholds
            size="md"
          />
        </div>
      </div>

      {/* Categories Budgets Grid */}
      {budgets.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <PieChart className="w-6 h-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-200">No category budgets set yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Set monthly limits for categories like Food, Groceries, Rent, or Shopping to track spending limits.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Set Your First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                className={`bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border transition-all ${
                  isOver
                    ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/20'
                    : isNear
                    ? 'border-amber-300 dark:border-amber-900/60'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: `${catInfo?.color || '#64748b'}20`,
                        color: catInfo?.color || '#64748b',
                      }}
                    >
                      <IconRenderer name={catInfo?.icon || 'Tag'} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {b.category}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Limit: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatINR(b.monthlyLimit)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(b)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress & Numbers */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <div>
                      <span className="text-slate-400">Spent: </span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatINR(spent)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">{remaining >= 0 ? 'Left: ' : 'Exceeded: '}</span>
                      <span
                        className={`font-bold ${
                          remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formatINR(Math.abs(remaining))}
                      </span>
                    </div>
                  </div>

                  <ProgressBar
                    value={spent}
                    max={b.monthlyLimit}
                    alertThresholds
                    size="md"
                  />

                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span className="text-slate-400">{percentUsed.toFixed(0)}% utilized</span>
                    {isOver ? (
                      <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        Over Budget by {formatINR(spent - b.monthlyLimit)}
                      </span>
                    ) : isNear ? (
                      <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Near Limit ({percentUsed.toFixed(0)}%)
                      </span>
                    ) : (
                      <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        On Track
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
