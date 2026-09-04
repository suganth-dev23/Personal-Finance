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

const PALETTE_FALLBACK = [
  '#10B981', // Emerald
  '#F5B742', // Suvarna Gold
  '#6366F1', // Indigo
  '#F43F5E', // Rose Crimson
  '#0D9488', // Teal
  '#06B6D4', // Cyan
  '#8B5CF6', // Violet
  '#64748B', // Slate
];

export const CategoryExpenseChart: React.FC = () => {
  const { categorySpendingThisMonth, currentMonthExpense } = useFinance();

  const expenseCategories = categorySpendingThisMonth.filter(c => c.spent > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = currentMonthExpense > 0 ? (data.spent / currentMonthExpense) * 100 : 0;
      return (
        <div className="bg-slate-900/95 dark:bg-[#171E2A] p-3 rounded-xl shadow-xl border border-slate-700 dark:border-[#202836] text-xs">
          <p className="font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color || '#F5B742' }} />
            {data.category}
          </p>
          <p className="font-numeric text-slate-300 font-semibold mt-1">
            {formatINR(data.spent)} ({pct.toFixed(1)}%)
          </p>
          {data.budget > 0 && (
            <p className="font-numeric text-slate-400 text-xs mt-0.5">
              Budget: {formatINR(data.budget)} ({data.percentUsed.toFixed(0)}% used)
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-[#131822] rounded-3xl p-6 shadow-xs border border-slate-200/90 dark:border-[#202836] flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Spending by category
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            This month's debits breakdown
          </p>
        </div>
        <span className="font-numeric text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-[#171E2A] px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-[#202836]">
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
                  animationDuration={500}
                  animationEasing="ease-out"
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || PALETTE_FALLBACK[index % PALETTE_FALLBACK.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] uppercase font-medium text-slate-400">Total</span>
              <span className="font-numeric text-xs font-bold text-slate-900 dark:text-slate-100">
                {formatCompactINR(currentMonthExpense)}
              </span>
            </div>
          </div>

          {/* Top categories legend list */}
          <div className="w-full sm:w-1/2 space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {expenseCategories.slice(0, 5).map((cat, idx) => {
              const pct = currentMonthExpense > 0 ? (cat.spent / currentMonthExpense) * 100 : 0;
              const swatch = cat.color || PALETTE_FALLBACK[idx % PALETTE_FALLBACK.length];
              return (
                <div key={cat.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: swatch }} />
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                      {cat.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 font-numeric">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
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
