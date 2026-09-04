import React, { useState, useMemo } from 'react';
import {
  Plus,
  TrendingUp,
  Edit3,
  Trash2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Investment } from '../../types/finance';
import { formatINR, formatCompactINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { PortfolioAllocationChart } from './PortfolioAllocationChart';
import { InvestmentModal } from './InvestmentModal';

export const InvestmentsView: React.FC = () => {
  const {
    investments,
    totalInvestedAmount,
    totalInvestmentValue,
    totalInvestmentGainLoss,
    totalInvestmentGainLossPct,
    deleteInvestment,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const totalMonthlySIP = useMemo(() => {
    return investments.reduce((acc, i) => acc + (i.sipAmount || 0), 0);
  }, [investments]);

  const filteredList = useMemo(() => {
    if (filterType === 'all') return investments;
    return investments.filter(i => i.type.toLowerCase() === filterType.toLowerCase());
  }, [investments, filterType]);

  const handleEdit = (inv: Investment) => {
    setSelectedInvestment(inv);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedInvestment(null);
    setIsModalOpen(true);
  };

  // Category color mapping
  const CATEGORY_COLORS: Record<string, string> = {
    'Mutual Funds': '#10b981', // Emerald
    'Stocks': '#06b6d4', // Cyan
    'Gold / SGB': '#f59e0b', // Gold / Amber
    'Fixed Deposit (FD)': '#8b5cf6', // Violet
    'Recurring Deposit (RD)': '#a855f7',
    'PPF / EPF': '#3b82f6',
    'Crypto': '#ec4899',
    'Other': '#64748b',
  };

  // Asset allocation segments
  const assetSegments = useMemo(() => {
    const map: Record<string, { value: number; invested: number; count: number }> = {};
    investments.forEach(i => {
      if (!map[i.type]) {
        map[i.type] = { value: 0, invested: 0, count: 0 };
      }
      map[i.type].value += i.currentValue;
      map[i.type].invested += i.investedAmount;
      map[i.type].count += 1;
    });

    const total = totalInvestmentValue || 1;
    return Object.entries(map).map(([type, data]) => {
      const gain = data.value - data.invested;
      const gainPct = data.invested > 0 ? (gain / data.invested) * 100 : 0;
      return {
        type,
        value: data.value,
        invested: data.invested,
        gain,
        gainPct,
        count: data.count,
        percentage: totalInvestmentValue > 0 ? (data.value / total) * 100 : 0,
        color: CATEGORY_COLORS[type] || '#64748b',
      };
    }).sort((a, b) => b.value - a.value);
  }, [investments, totalInvestmentValue]);

  return (
    <div className="space-y-6">
      {/* Modern Minimalist Portfolio Hero Card (from Portfolio v2 Mockup) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Glow orb */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Portfolio Valuation
            </span>
            <div className="flex flex-wrap items-baseline gap-3 mt-1.5">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                {formatINR(totalInvestmentValue)}
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                  totalInvestmentGainLoss >= 0
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                <span>
                  {totalInvestmentGainLoss >= 0 ? '+' : ''}{formatINR(totalInvestmentGainLoss)} ({totalInvestmentGainLossPct >= 0 ? '+' : ''}{totalInvestmentGainLossPct.toFixed(1)}%)
                </span>
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Invested: <span className="font-semibold text-slate-200">{formatINR(totalInvestedAmount)}</span> • Monthly SIPs: <span className="font-semibold text-indigo-400">{formatINR(totalMonthlySIP)}</span>
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-900/40 transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Holding</span>
          </button>
        </div>

        {/* Horizontal Asset Allocation Bar (from Mockup) */}
        {investments.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-800/80 relative z-10">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5 font-medium">
              <span>Asset Allocation Breakdown</span>
              <span>{investments.length} Total Holdings</span>
            </div>

            {/* Segmented bar */}
            <div className="h-3 w-full rounded-full bg-slate-800/80 overflow-hidden flex gap-0.5 p-0.5">
              {assetSegments.map(seg => (
                <div
                  key={seg.type}
                  style={{ width: `${Math.max(seg.percentage, 2)}%`, backgroundColor: seg.color }}
                  className="h-full rounded-full transition-all duration-500"
                  title={`${seg.type}: ${seg.percentage.toFixed(1)}%`}
                />
              ))}
            </div>

            {/* Chips legend */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3.5 text-xs">
              {assetSegments.map(seg => (
                <button
                  key={seg.type}
                  onClick={() => setFilterType(filterType === seg.type ? 'all' : seg.type)}
                  className={`flex items-center gap-1.5 transition-all hover:opacity-80 ${
                    filterType === seg.type ? 'ring-1 ring-white/50 rounded-lg px-1.5 py-0.5' : ''
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="text-slate-300 font-semibold">{seg.type}</span>
                  <span className="text-slate-400 font-medium">{seg.percentage.toFixed(0)}%</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Asset Category Cards Grid */}
      {assetSegments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {assetSegments.map(seg => (
            <div
              key={seg.type}
              onClick={() => setFilterType(filterType === seg.type ? 'all' : seg.type)}
              className={`cursor-pointer bg-white dark:bg-slate-900 rounded-3xl p-5 border transition-all hover:shadow-md ${
                filterType === seg.type
                  ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-800 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {seg.type}
                </span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
              </div>

              <p className="text-xl font-black text-slate-900 dark:text-white mt-2">
                {formatINR(seg.value)}
              </p>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                <span className="text-slate-400 font-medium">
                  {seg.count} {seg.count === 1 ? 'holding' : 'holdings'}
                </span>
                <span
                  className={`font-bold ${
                    seg.gain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {seg.gain >= 0 ? '+' : ''}{seg.gainPct.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Donut Chart View (Collapsible / Secondary) */}
      {investments.length > 0 && <PortfolioAllocationChart investments={investments} />}

      {/* Holdings List with Filters */}
      {investments.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-200">No investment holdings logged yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Track your Mutual Funds, Indian Equities, Fixed Deposits, Gold/SGB, EPF/PPF, or NPS in one place.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Add Your First Holding
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Individual Holdings ({filteredList.length})
            </h3>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-medium">Filter:</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Asset Classes</option>
                <option value="Mutual Funds">Mutual Funds</option>
                <option value="Stocks">Stocks</option>
                <option value="Fixed Deposit (FD)">Fixed Deposit (FD)</option>
                <option value="Gold / SGB">Gold / SGB</option>
                <option value="PPF / EPF">PPF / EPF</option>
                <option value="Crypto">Crypto</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Scheme / Asset</th>
                  <th className="py-3 px-4">Asset Class</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4 text-right">Invested</th>
                  <th className="py-3 px-4 text-right">Current Value</th>
                  <th className="py-3 px-4 text-right">Gain / Loss</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {filteredList.map(inv => {
                  const gain = inv.currentValue - inv.investedAmount;
                  const gainPct = inv.investedAmount > 0 ? (gain / inv.investedAmount) * 100 : 0;
                  const isProfitable = gain >= 0;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        <div>
                          <p>{inv.name}</p>
                          {inv.sipAmount && (
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">
                              SIP: {formatINR(inv.sipAmount)}/mo {inv.sipDay ? `(Day ${inv.sipDay})` : ''}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs font-medium text-slate-600 dark:text-slate-400">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                          {inv.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        {inv.platform || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                        {formatINR(inv.investedAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-slate-900 dark:text-white">
                        {formatINR(inv.currentValue)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-bold ${
                            isProfitable
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          }`}
                        >
                          {isProfitable ? '+' : ''}{gainPct.toFixed(1)}% ({formatINR(gain)})
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(inv)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit Valuation"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete holding "${inv.name}"?`)) {
                                deleteInvestment(inv.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete Holding"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InvestmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialInvestment={selectedInvestment}
      />
    </div>
  );
};
