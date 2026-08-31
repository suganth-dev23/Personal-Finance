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

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Wealth & Investment Portfolio
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive valuation across Mutual Funds, Equities, FDs, SGBs, EPF & Crypto
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-emerald-600/30 transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Investment</span>
          </button>
        </div>

        {/* 4 Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Current Portfolio Value
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {formatINR(totalInvestmentValue)}
            </p>
            <span className="text-xs text-slate-400">({formatCompactINR(totalInvestmentValue)})</span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Invested Capital
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">
              {formatINR(totalInvestedAmount)}
            </p>
            <span className="text-xs text-slate-400">Cost basis</span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Overall Return (P&L)
            </span>
            <p
              className={`text-xl sm:text-2xl font-extrabold mt-0.5 flex items-center gap-1 ${
                totalInvestmentGainLoss >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {totalInvestmentGainLoss >= 0 ? '+' : ''}{formatINR(totalInvestmentGainLoss)}
            </p>
            <span
              className={`text-xs font-bold ${
                totalInvestmentGainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {totalInvestmentGainLoss >= 0 ? '▲' : '▼'} {totalInvestmentGainLossPct.toFixed(2)}% ROI
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Monthly SIPs
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {formatINR(totalMonthlySIP)}
            </p>
            <span className="text-xs text-slate-400">Automated monthly flow</span>
          </div>
        </div>
      </div>

      {/* Asset Allocation Donut Chart */}
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
