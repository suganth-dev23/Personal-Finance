import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatINR, formatCompactINR } from '../../utils/currency';
import { getRelativeMonthsList, getMonthName } from '../../utils/date';

export const CashFlowChart: React.FC = () => {
  const { transactions } = useFinance();

  const chartData = useMemo(() => {
    const months = getRelativeMonthsList(6); // last 6 months

    return months.map(m => {
      const monthTxs = transactions.filter(t => t.date.startsWith(m.key));
      const income = monthTxs.filter(t => t.type === 'credit').reduce((a, b) => a + b.amount, 0);
      const expense = monthTxs.filter(t => t.type === 'debit').reduce((a, b) => a + b.amount, 0);
      const net = income - expense;

      return {
        monthKey: m.key,
        name: m.label,
        Income: income,
        Expenses: expense,
        NetSavings: net,
      };
    });
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
          <p className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
            {label}
          </p>
          {payload.map((item: any) => (
            <div key={item.name} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: item.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}:</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatINR(item.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Cash Flow Trend (6 Months)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Income vs. Expenses vs. Net Savings in INR
          </p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={value => formatCompactINR(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
              formatter={(value) => <span className="text-slate-600 dark:text-slate-400 font-medium">{value}</span>}
            />
            <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Line
              type="monotone"
              dataKey="NetSavings"
              name="Net Savings"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#6366f1' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
