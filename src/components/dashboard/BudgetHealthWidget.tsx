import React from 'react';
import { AlertCircle, CheckCircle, ChevronRight, PieChart } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { ProgressBar } from '../common/ProgressBar';
import { formatINR } from '../../utils/currency';

export const BudgetHealthWidget: React.FC = () => {
  const { categorySpendingThisMonth, setCurrentView } = useFinance();

  const budgetedCategories = categorySpendingThisMonth.filter(c => c.budget > 0);

  const overBudgetCategories = budgetedCategories.filter(c => c.spent > c.budget);
  const nearBudgetCategories = budgetedCategories.filter(c => c.spent <= c.budget && c.percentUsed >= 80);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Budget Watchlist
              </h3>
              <p className="text-xs text-slate-400">
                {budgetedCategories.length} categories budgeted this month
              </p>
            </div>
          </div>

          <button
            onClick={() => setCurrentView('budgets')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
          >
            <span>Manage</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alerts if any */}
        {overBudgetCategories.length > 0 ? (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-rose-700 dark:text-rose-300">
              <span className="font-bold">{overBudgetCategories.length} category over budget: </span>
              {overBudgetCategories.map(c => c.category).join(', ')}
            </div>
          </div>
        ) : nearBudgetCategories.length > 0 ? (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700 dark:text-amber-300">
              <span className="font-bold">{nearBudgetCategories.length} categories near limit (80%+): </span>
              {nearBudgetCategories.map(c => c.category).join(', ')}
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              All categories are within healthy limits this month!
            </span>
          </div>
        )}

        {/* Top 3 Budget Progress items */}
        <div className="space-y-3">
          {budgetedCategories.slice(0, 3).map(cat => (
            <div key={cat.category} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.category}</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {formatINR(cat.spent)} <span className="text-slate-400">/ {formatINR(cat.budget)}</span>
                </span>
              </div>
              <ProgressBar
                value={cat.spent}
                max={cat.budget}
                alertThresholds
                size="sm"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
