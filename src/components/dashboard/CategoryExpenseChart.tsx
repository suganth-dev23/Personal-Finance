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
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { AnimatedNumber } from '../common/AnimatedNumber';

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
 const reducedMotion = useReducedMotion();

 const safeSpending = Array.isArray(categorySpendingThisMonth) ? categorySpendingThisMonth : [];
 const safeCurrentMonthExpense = Number.isFinite(currentMonthExpense) && currentMonthExpense > 0 ? currentMonthExpense : 0;
 const expenseCategories = safeSpending.filter(c => Number.isFinite(c.spent) && c.spent > 0);
 const otherCategories = expenseCategories.slice(5);
 const otherSpent = otherCategories.reduce((sum, c) => sum + (Number.isFinite(c.spent) ? c.spent : 0), 0);
 const otherPct = safeCurrentMonthExpense > 0 ? (otherSpent / safeCurrentMonthExpense) * 100 : 0;

 const CustomTooltip = ({ active, payload }: any) => {
 if (active && payload && payload.length) {
 const data = payload[0].payload;
 const pct = safeCurrentMonthExpense > 0 ? (data.spent / safeCurrentMonthExpense) * 100 : 0;
 return (
 <div className="bg-surface/95 p-3 rounded-xl shadow-xl border border-line text-xs">
 <p className="font-bold text-ink-1 flex items-center gap-2">
 <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color || '#F5B742' }} />
 {data.category}
 </p>
 <p className="font-numeric text-ink-2 font-semibold mt-1">
 {formatINR(data.spent)} ({pct.toFixed(1)}%)
 </p>
 {data.budget > 0 && (
 <p className="font-numeric text-ink-3 text-xs mt-0.5">
 Budget: {formatINR(data.budget)} ({data.percentUsed.toFixed(0)}% used)
 </p>
 )}
 </div>
 );
 }
 return null;
 };

 return (
 <div className="bg-surface rounded-2xl p-4 sm:p-6 shadow-xs border border-line flex flex-col h-full">
 <div className="flex items-center justify-between mb-2">
 <div>
 <h3 className="text-base font-bold text-ink-1">
 Spending by category
 </h3>
 <p className="text-xs text-ink-3 mt-0.5">
 This month's debits breakdown
 </p>
 </div>
 <span className="font-numeric text-xs font-bold text-ink-1 bg-sunken px-2.5 py-1 rounded-xl border border-line">
 {formatINR(currentMonthExpense)}
 </span>
 </div>

 {expenseCategories.length === 0 ? (
 <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-ink-3">
 <p className="text-xs">No expenses logged for this month yet.</p>
 </div>
 ) : (
 <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
 {/* Donut Chart */}
 <div className="w-full sm:w-1/2 h-[200px] relative flex items-center justify-center">
 <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
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
 isAnimationActive={!reducedMotion}
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
 <span className="text-xs uppercase font-medium text-ink-3">Total</span>
 <span className="font-numeric text-xs font-bold text-ink-1">
 <AnimatedNumber value={currentMonthExpense} formatter={formatCompactINR} animateOnMount={true} />
 </span>
 </div>
 </div>

 {/* Top categories legend list */}
 <div className="w-full sm:w-1/2 space-y-2 max-h-[220px] overflow-y-auto pr-1">
 {expenseCategories.slice(0, 5).map((cat, idx) => {
 const pct = safeCurrentMonthExpense > 0 ? (cat.spent / safeCurrentMonthExpense) * 100 : 0;
 const swatch = cat.color || PALETTE_FALLBACK[idx % PALETTE_FALLBACK.length];
 return (
 <div key={cat.category} className="flex items-center justify-between text-xs">
 <div className="flex items-center gap-2 truncate">
 <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: swatch }} />
 <span className="font-medium text-ink-2 truncate">
 {cat.category}
 </span>
 </div>
 <div className="flex items-center gap-2 flex-shrink-0 font-numeric">
 <span className="font-semibold text-ink-1">
 {formatINR(cat.spent)}
 </span>
 <span className="text-xs text-ink-3 w-9 text-right font-medium">
 {pct.toFixed(0)}%
 </span>
 </div>
 </div>
 );
 })}

 {otherCategories.length > 0 && (
 <div className="flex items-center justify-between text-xs pt-1 border-t border-line">
 <div className="flex items-center gap-2 truncate">
 <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-slate-400 dark:bg-slate-500" />
 <span className="font-medium text-ink-3 truncate">
 Other ({otherCategories.length})
 </span>
 </div>
 <div className="flex items-center gap-2 flex-shrink-0 font-numeric">
 <span className="font-semibold text-ink-2">
 {formatINR(otherSpent)}
 </span>
 <span className="text-xs text-ink-3 w-9 text-right font-medium">
 {otherPct.toFixed(0)}%
 </span>
 </div>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 );
};
