import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Investment } from '../../types/finance';
import { formatINR, formatCompactINR } from '../../utils/currency';

interface PortfolioAllocationChartProps {
  investments: Investment[];
}

const TYPE_COLORS: Record<string, string> = {
  'Mutual Funds': '#10b981',
  'Stocks': '#3b82f6',
  'Fixed Deposit (FD)': '#eab308',
  'Recurring Deposit (RD)': '#f59e0b',
  'Gold / SGB': '#f97316',
  'Crypto': '#8b5cf6',
  'PPF / EPF': '#06b6d4',
  'NPS': '#6366f1',
  'Real Estate': '#ec4899',
  'Bonds / Debt': '#14b8a6',
  'Other': '#64748b',
};

export const PortfolioAllocationChart: React.FC<PortfolioAllocationChartProps> = ({ investments }) => {
  const allocationData = useMemo(() => {
    const map: Record<string, { value: number; invested: number }> = {};

    investments.forEach(i => {
      if (!map[i.type]) {
        map[i.type] = { value: 0, invested: 0 };
      }
      map[i.type].value += i.currentValue;
      map[i.type].invested += i.investedAmount;
    });

    const totalVal = investments.reduce((a, b) => a + b.currentValue, 0);

    return Object.entries(map).map(([type, stats]) => ({
      name: type,
      value: stats.value,
      invested: stats.invested,
      color: TYPE_COLORS[type] || '#64748b',
      percentage: totalVal > 0 ? (stats.value / totalVal) * 100 : 0,
    })).sort((a, b) => b.value - a.value);
  }, [investments]);

  const totalPortfolioValue = useMemo(() => {
    return investments.reduce((acc, i) => acc + i.currentValue, 0);
  }, [investments]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-xs">
          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            {data.name}
          </p>
          <p className="text-slate-600 dark:text-slate-300 font-semibold mt-1">
            Valuation: {formatINR(data.value)} ({data.percentage.toFixed(1)}%)
          </p>
          <p className="text-slate-400 text-[11px] mt-0.5">
            Invested: {formatINR(data.invested)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Asset Class Allocation
          </h3>
          <p className="text-xs text-slate-400">Diversification across Indian wealth buckets</p>
        </div>
      </div>

      {allocationData.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">No investment holdings logged.</div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6 mt-4">
          <div className="w-full sm:w-1/2 h-[210px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  stroke="none"
                >
                  {allocationData.map(entry => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Portfolio</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {formatCompactINR(totalPortfolioValue)}
              </span>
            </div>
          </div>

          <div className="w-full sm:w-1/2 space-y-2 max-h-52 overflow-y-auto pr-1">
            {allocationData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 font-medium">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatINR(item.value)}
                  </span>
                  <span className="text-[11px] text-slate-400 w-10 text-right">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
