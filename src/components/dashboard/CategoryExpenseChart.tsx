import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatINR, formatCompactINR } from '../../utils/currency';
import { IconRenderer } from '../common/IconRenderer';

export const CategoryExpenseChart: React.FC = () => {
  const { categorySpendingThisMonth, currentMonthExpense } = useFinance();

  const expenseCategories = categorySpendingThisMonth.filter(c => c.spent > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = currentMonthExpense > 0 ? (data.spent / currentMonthExpense) * 100 : 0;
      return (
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-xs">
          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            {data.category}
          </p>
          <p className="text-slate-600 dark:text-slate-300 font-semibold mt-1">
            {formatINR(data.spent)} ({pct.toFixed(1)}%)
          </p>
          {data.budget > 0 && (
            <p className="text-slate-400 text-[11px] mt-0.5">
              Budget: {formatINR(data.budget)} ({data.percentUsed.toFixed(0)}% used)
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Spending by Category
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            This month's expenses breakdown
          </p>
        </div>
        <span className="text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
          {formatINR(currentMonthExpense)}
        </span>
      </div>

      {expenseCategories.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <p className="text-xs">No expenses logged for this month yet.</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
          {/* Donut Chart */}
          <div className="w-full sm:w-1/2 h-[200px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategories}
                  dataKey="spent"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  stroke="none"
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                {formatCompactINR(currentMonthExpense)}
              </span>
            </div>
          </div>

          {/* Top categories legend list */}
          <div className="w-full sm:w-1/2 space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {expenseCategories.slice(0, 5).map(cat => {
              const pct = currentMonthExpense > 0 ? (cat.spent / currentMonthExpense) * 100 : 0;
              return (
                <div key={cat.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {cat.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatINR(cat.spent)}
                    </span>
                    <span className="text-[11px] text-slate-400 w-9 text-right font-medium">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
