import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Investment } from '../../types/finance';
import { formatINR, formatCompactINR } from '../../utils/currency';
import { INDIAN_WEALTH_PALETTE } from '../../constants/theme';

interface PortfolioAllocationChartProps {
  investments: Investment[];
}

const TYPE_COLORS = INDIAN_WEALTH_PALETTE;

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
      color: TYPE_COLORS[type] || '#64748B',
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
        <div className="bg-slate-900/95 dark:bg-[#171E2A] p-3 rounded-xl shadow-xl border border-slate-700 dark:border-[#202836] text-xs font-numeric">
          <p className="font-bold text-white flex items-center gap-2 font-sans">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            {data.name}
          </p>
          <p className="text-slate-300 font-semibold mt-1">
            Valuation: {formatINR(data.value)} ({data.percentage.toFixed(1)}%)
          </p>
          <p className="text-slate-400 text-xs mt-0.5">
            Invested: {formatINR(data.invested)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-[#131822] rounded-3xl p-6 shadow-xs border border-slate-200/90 dark:border-[#202836] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Asset class allocation
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Diversification across Indian wealth buckets</p>
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
                  animationDuration={500}
                  animationEasing="ease-out"
                >
                  {allocationData.map(entry => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] uppercase font-medium text-slate-400">Total Portfolio</span>
              <span className="font-numeric text-sm font-bold text-slate-900 dark:text-slate-100">
                {formatCompactINR(totalPortfolioValue)}
              </span>
            </div>
          </div>

          <div className="w-full sm:w-1/2 space-y-2 max-h-52 overflow-y-auto pr-1">
            {allocationData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 font-numeric">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatINR(item.value)}
                  </span>
                  <span className="text-[11px] text-slate-400 w-10 text-right font-medium">
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
