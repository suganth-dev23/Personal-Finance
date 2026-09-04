import React from 'react';
import {
  Repeat,
  Flame,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useRecurringTransactions } from '../../hooks/useRecurringTransactions';
import { useCashFlowRunway } from '../../hooks/useCashFlowRunway';
import { formatINR } from '../../utils/currency';

export const RecurringAndRunwayWidget: React.FC = () => {
  const { transactions, totalBalance, notRecurringTxIds, toggleNotRecurring } = useFinance();

  const {
    recurringExpenses,
    recurringIncomes,
    totalMonthlyRecurringExpenses,
  } = useRecurringTransactions(transactions, notRecurringTxIds);

  const runway = useCashFlowRunway(transactions, totalBalance);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Cash-Flow Runway & Burn Analysis Card */}
      <div className="lg:col-span-5 bg-white dark:bg-[#131822] rounded-3xl p-6 border border-slate-200/90 dark:border-[#202836] shadow-sm flex flex-col justify-between space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 dark:bg-teal-500/15 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Cash-Flow Runway
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Net monthly burn & longevity</p>
            </div>
          </div>

          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              runway.status === 'sustainable' || runway.status === 'abundant'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : runway.status === 'healthy'
                ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
                : runway.status === 'moderate'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
            }`}
          >
            {runway.statusLabel}
          </span>
        </div>

        {/* Big Metric Display */}
        <div className="bg-slate-50 dark:bg-[#171E2A]/70 rounded-2xl p-4 border border-slate-100 dark:border-[#202836]">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Estimated liquid longevity
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-bold font-numeric text-slate-900 dark:text-white tracking-tight">
              {runway.runwayMonths === Infinity
                ? 'Sustainable'
                : `${runway.runwayMonths.toFixed(1)} mos`}
            </span>
            {runway.runwayMonths === Infinity && (
              <span className="text-xs font-semibold font-numeric text-emerald-600 dark:text-emerald-400">
                (Surplus: +{formatINR(runway.netMonthlyCashFlow)}/mo)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Zero-income baseline runway: <span className="font-semibold font-numeric text-slate-700 dark:text-slate-300">{runway.expenseOnlyRunwayMonths} months</span>
          </p>
        </div>

        {/* Burn Rate Sub-Stats */}
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-[#202836]">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avg monthly spend</span>
            <p className="text-sm font-semibold font-numeric text-slate-800 dark:text-slate-200 mt-0.5">
              {formatINR(runway.averageMonthlyExpense)}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avg monthly inflow</span>
            <p className="text-sm font-semibold font-numeric text-emerald-600 dark:text-emerald-400 mt-0.5">
              +{formatINR(runway.averageMonthlyIncome)}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Detected Recurring Subscriptions & Fixed Commitments */}
      <div className="lg:col-span-7 bg-white dark:bg-[#131822] rounded-3xl p-6 border border-slate-200/90 dark:border-[#202836] shadow-sm flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#171E2A] flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Detected Recurring & Bills
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Auto-clustered (28–32 day cycle) with manual override
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400">Fixed monthly: </span>
            <span className="text-xs font-semibold font-numeric text-slate-900 dark:text-white">
              {formatINR(totalMonthlyRecurringExpenses)}
            </span>
          </div>
        </div>

        {recurringExpenses.length === 0 && recurringIncomes.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 dark:bg-[#171E2A]/40 rounded-2xl border border-dashed border-slate-200 dark:border-[#202836] p-4">
            <Sparkles className="w-5 h-5 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              No repeating monthly subscriptions detected yet
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              As you log recurring expenses (e.g. Netflix, Rent, Electricity, SIPs) over 28-32 day cycles, they will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {recurringExpenses.map(item => (
              <div
                key={item.clusterId}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#171E2A]/70 border border-slate-100 dark:border-[#202836] hover:border-slate-200 dark:hover:border-[#273243] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#202836] text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>Every ~{item.intervalDays}d</span>
                      <span>•</span>
                      <span>Next: {item.nextEstimatedDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <span className="text-xs font-semibold font-numeric text-[#F43F5E] dark:text-rose-400">
                    -{formatINR(item.averageAmount)}
                  </span>
                  <button
                    onClick={() => {
                      if (item.transactionIds[0]) {
                        toggleNotRecurring(item.transactionIds[0]);
                      }
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[10px] font-medium flex items-center gap-0.5"
                    title="Mark this transaction as not recurring"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Not recurring</span>
                  </button>
                </div>
              </div>
            ))}

            {recurringIncomes.map(item => (
              <div
                key={item.clusterId}
                className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100/70 dark:border-emerald-900/30 hover:border-emerald-200 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Salary / Inflow</span>
                      <span>•</span>
                      <span>Every ~{item.intervalDays}d</span>
                      <span>•</span>
                      <span>Next: {item.nextEstimatedDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <span className="text-xs font-semibold font-numeric text-emerald-600 dark:text-emerald-400">
                    +{formatINR(item.averageAmount)}
                  </span>
                  <button
                    onClick={() => {
                      if (item.transactionIds[0]) {
                        toggleNotRecurring(item.transactionIds[0]);
                      }
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[10px] font-medium flex items-center gap-0.5"
                    title="Mark this transaction as not recurring"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Not recurring</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
