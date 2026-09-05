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
import { formatINR } from '../../utils/currency';
import { InvestmentModal } from './InvestmentModal';
import { PortfolioAllocationChart } from './PortfolioAllocationChart';
import { INDIAN_WEALTH_PALETTE } from '../../constants/theme';

export const InvestmentsView: React.FC = () => {
  const {
    investments,
    totalInvestmentValue,
    totalInvestedAmount,
    totalInvestmentGainLoss,
    totalInvestmentGainLossPct,
    deleteInvestment,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const totalMonthlySIP = useMemo(() => {
    return investments.reduce((sum, i) => sum + (i.sipAmount || 0), 0);
  }, [investments]);

  const filteredList = useMemo(() => {
    if (filterType === 'all') return investments;
    return investments.filter(i => i.type.toLowerCase() === filterType.toLowerCase());
  }, [investments, filterType]);

  const handleOpenAdd = () => {
    setSelectedInvestment(null);
    setIsModalOpen(true);
  };

  const handleEdit = (inv: Investment) => {
    setSelectedInvestment(inv);
    setIsModalOpen(true);
  };

  const CATEGORY_COLORS = INDIAN_WEALTH_PALETTE;

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
  }, [investments, totalInvestmentValue, CATEGORY_COLORS]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Portfolio Hero Card: Mineral Card with Gold Valuation Highlight */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#131822] text-slate-900 dark:text-white p-6 sm:p-8 border border-slate-200/90 dark:border-[#202836] shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F5B742] to-transparent opacity-80" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400">
                <TrendingUp className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                PORTFOLIO WEALTH &amp; ASSETS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Current Valuation &amp; Capital Aggregate
            </p>
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-black font-numeric tracking-tight text-slate-900 dark:text-white">
                {formatINR(totalInvestmentValue)}
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-numeric ${
                  totalInvestmentGainLoss >= 0
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                {totalInvestmentGainLoss >= 0 ? '+' : ''}{formatINR(totalInvestmentGainLoss)} ({totalInvestmentGainLossPct >= 0 ? '+' : ''}{totalInvestmentGainLossPct.toFixed(1)}%)
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Invested: <span className="font-semibold font-numeric text-slate-800 dark:text-slate-200">{formatINR(totalInvestedAmount)}</span> • Monthly SIPs: <span className="font-semibold font-numeric text-[#C28834] dark:text-[#F5B742]">{formatINR(totalMonthlySIP)}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-sm font-bold text-slate-950 shadow-sm hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Add Holding</span>
            </button>
          </div>
        </div>

        {/* 4-column summary strip */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200/80 dark:border-[#202836]">
          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Invested Capital</span>
            <p className="text-lg font-bold font-numeric text-slate-900 dark:text-white mt-0.5">
              {formatINR(totalInvestedAmount)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Total Returns</span>
            <p className={`text-lg font-bold font-numeric mt-0.5 ${
              totalInvestmentGainLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {totalInvestmentGainLoss >= 0 ? '+' : ''}{formatINR(totalInvestmentGainLoss)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Monthly SIPs</span>
            <p className="text-lg font-bold font-numeric text-[#C28834] dark:text-[#F5B742] mt-0.5">
              {formatINR(totalMonthlySIP)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Total Holdings</span>
            <p className="text-lg font-bold font-numeric text-slate-900 dark:text-white mt-0.5">
              {investments.length}
            </p>
          </div>
        </div>

        {/* Horizontal Asset Allocation Bar */}
        {investments.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-[#202836] relative z-10">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5 font-medium">
              <span>Asset Allocation Breakdown</span>
              <span>{investments.length} Total Holdings</span>
            </div>

            {/* Segmented bar */}
            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-[#171E2A] overflow-hidden flex gap-0.5 p-0.5 border border-slate-200/60 dark:border-[#202836]">
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
                  className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="font-medium text-slate-600 dark:text-slate-300">{seg.type}</span>
                  <span className="font-numeric text-slate-400 text-[11px]">{seg.percentage.toFixed(1)}%</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Asset Category Cards Grid */}
      {assetSegments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Asset Class Allocation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Holdings distribution across Indian mutual funds, equities, FDs, and gold
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {assetSegments.length} asset classes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {assetSegments.map(seg => (
              <div
                key={seg.type}
                onClick={() => setFilterType(filterType === seg.type ? 'all' : seg.type)}
                className={`cursor-pointer bg-white dark:bg-[#131822] rounded-3xl p-5 border transition-all hover:shadow-md ${
                  filterType === seg.type
                    ? 'border-[#F5B742] dark:border-[#F5B742] shadow-sm ring-1 ring-[#F5B742]/40'
                    : 'border-slate-200/90 dark:border-[#202836] shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {seg.type}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: seg.color }}
                  />
                </div>

                <p className="text-xl font-bold font-numeric text-slate-900 dark:text-white mt-2">
                  {formatINR(seg.value)}
                </p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-[#202836] text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {seg.count} {seg.count === 1 ? 'holding' : 'holdings'}
                  </span>
                  <span
                    className={`font-semibold font-numeric ${
                      seg.gain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#F43F5E] dark:text-rose-400'
                    }`}
                  >
                    {seg.gain >= 0 ? '+' : ''}{seg.gainPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Donut Chart View (Collapsible / Secondary) */}
      {investments.length > 0 && <PortfolioAllocationChart investments={investments} />}

      {/* Holdings List with Filters */}
      {investments.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#131822] rounded-3xl border border-dashed border-slate-200 dark:border-[#202836] p-8">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-[#F5B742]">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-200">No investment holdings logged yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Track your Mutual Funds, Indian Equities, Fixed Deposits, Gold/SGB, EPF/PPF, or NPS in one place.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-bold shadow-sm"
          >
            Add Your First Holding
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                All Holdings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track performance, SIP schedules, and valuations across brokers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Filter:</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="py-1.5 px-3 bg-slate-100 dark:bg-[#171E2A] border border-slate-200/90 dark:border-[#202836] rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
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

          <div className="bg-white dark:bg-[#131822] rounded-3xl shadow-sm border border-slate-200/90 dark:border-[#202836] p-5 sm:p-6 overflow-hidden">

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-[#202836] text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Scheme / Asset</th>
                  <th className="py-3 px-4">Asset Class</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4 text-right">Invested</th>
                  <th className="py-3 px-4 text-right">Current Value</th>
                  <th className="py-3 px-4 text-right">Gain / Loss</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#202836] text-sm">
                {filteredList.map(inv => {
                  const gain = inv.currentValue - inv.investedAmount;
                  const gainPct = inv.investedAmount > 0 ? (gain / inv.investedAmount) * 100 : 0;
                  const isProfitable = gain >= 0;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-[#171E2A]/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        <div>
                          <p>{inv.name}</p>
                          {inv.sipAmount && (
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal font-numeric">
                              SIP: {formatINR(inv.sipAmount)}/mo {inv.sipDay ? `(Day ${inv.sipDay})` : ''}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs font-medium text-slate-600 dark:text-slate-400">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#171E2A] text-slate-700 dark:text-slate-300">
                          {inv.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {inv.platform || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-semibold font-numeric text-slate-700 dark:text-slate-300">
                        {formatINR(inv.investedAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold font-numeric text-slate-900 dark:text-white">
                        {formatINR(inv.currentValue)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-numeric">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-semibold ${
                            isProfitable
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          }`}
                        >
                          {isProfitable ? '+' : ''}{gainPct.toFixed(1)}% ({formatINR(gain)})
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEdit(inv)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/90 dark:border-[#202836] text-slate-400 hover:bg-slate-50 dark:hover:bg-[#171E2A] hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
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
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/90 dark:border-[#202836] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
