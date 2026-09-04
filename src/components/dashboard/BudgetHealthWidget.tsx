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

  const totalBudget = budgetedCategories.reduce((acc, c) => acc + c.budget, 0);
  const totalSpent = budgetedCategories.reduce((acc, c) => acc + c.spent, 0);
  const overallPct = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

  return (
    <div className="bg-white dark:bg-[#131822] rounded-3xl p-6 shadow-xs border border-slate-200/90 dark:border-[#202836] flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Budget watchlist
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {budgetedCategories.length} categories budgeted this month
            </p>
          </div>

          <button
            onClick={() => setCurrentView('budgets')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
          >
            <span>Manage</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alerts if any */}
        {overBudgetCategories.length > 0 ? (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-700 dark:text-rose-300">
              <span className="font-semibold">{overBudgetCategories.length} category exceeded: </span>
              {overBudgetCategories.map(c => c.category).join(', ')}
            </div>
          </div>
        ) : nearBudgetCategories.length > 0 ? (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-[#F5B742] shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-200">
              <span className="font-semibold">{nearBudgetCategories.length} categories near ceiling: </span>
              {nearBudgetCategories.map(c => c.category).join(', ')}
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              All categories within healthy limits
            </span>
          </div>
        )}

        {/* Budget Progress items */}
        {budgetedCategories.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">No category budgets established yet.</p>
            <button
              onClick={() => setCurrentView('budgets')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Set category limits →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {budgetedCategories.slice(0, 4).map(cat => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{cat.category}</span>
                  <span className="font-numeric text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatINR(cat.spent)}</span>
                    <span className="text-slate-400 dark:text-slate-500"> / {formatINR(cat.budget)}</span>
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
        )}
      </div>

      {totalBudget > 0 && (
        <div className="pt-3.5 mt-4 border-t border-slate-100 dark:border-[#202836] flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Monthly budget total</span>
          <span className="font-numeric font-semibold text-slate-800 dark:text-slate-200">
            {formatINR(totalSpent)} <span className="text-slate-400 dark:text-slate-500 font-normal">/ {formatINR(totalBudget)} ({overallPct}%)</span>
          </span>
        </div>
      )}
    </div>
  );
};
