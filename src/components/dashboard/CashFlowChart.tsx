import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Waves, BarChart3 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatINR, formatCompactINR } from '../../utils/currency';
import { getRelativeMonthsList } from '../../utils/date';

export const CashFlowChart: React.FC = () => {
  const { transactions } = useFinance();
  const [chartMode, setChartMode] = useState<'wave' | 'bars'>('wave');

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
        <div className="bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5">
          <p className="font-bold text-white border-b border-slate-800 pb-1">
            {label}
          </p>
          {payload.map((item: any) => (
            <div key={item.name} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: item.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}:</span>
              </span>
              <span className="font-bold text-white">
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
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Cash Flow Trend</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              6 Months
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {chartMode === 'wave' ? 'Glowing net cash flow trajectory' : 'Income vs Expenses vs Net Savings in INR'}
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setChartMode('wave')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              chartMode === 'wave'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Minimalist Wave Flow"
          >
            <Waves className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Wave</span>
          </button>
          <button
            type="button"
            onClick={() => setChartMode('bars')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              chartMode === 'bars'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Comparison Bars"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bars</span>
          </button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'wave' ? (
            <AreaChart data={chartData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="emeraldCashFlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.12)" />
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
                formatter={value => <span className="text-slate-600 dark:text-slate-400 font-medium">{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="NetSavings"
                name="Net Flow"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#emeraldCashFlow)"
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#020617' }}
                activeDot={{ r: 6, fill: '#34d399' }}
              />
              <Line
                type="monotone"
                dataKey="Income"
                name="Income"
                stroke="#38bdf8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Expenses"
                name="Expenses"
                stroke="#f43f5e"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </AreaChart>
          ) : (
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
                formatter={value => <span className="text-slate-600 dark:text-slate-400 font-medium">{value}</span>}
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
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
