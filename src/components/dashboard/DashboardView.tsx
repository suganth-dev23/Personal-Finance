import React from 'react';
import {
  Wallet,
  TrendingUp,
  ShieldCheck,
  Target,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  UploadCloud,
  Sparkles,
  Users,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { StatCard } from '../common/StatCard';
import { CashFlowChart } from './CashFlowChart';
import { CategoryExpenseChart } from './CategoryExpenseChart';
import { BudgetHealthWidget } from './BudgetHealthWidget';
import { RecentTransactions } from './RecentTransactions';
import { AIInsightsWidget } from './AIInsightsWidget';
import { CashFlowRunwayCard, RecurringBillsCard } from './RecurringAndRunwayWidget';
import { OwedSummaryWidget } from './OwedSummaryWidget';
import { formatINR } from '../../utils/currency';
import { useCountUp } from '../../hooks/useCountUp';

interface DashboardViewProps {
  onOpenAddTx: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenAddTx }) => {
  const {
    transactions,
    totalBalance,
    totalInvestmentValue,
    totalInvestmentGainLoss,
    totalInvestmentGainLossPct,
    emergencyFund,
    emergencyFundRunwayMonths,
    totalGoalsSaved,
    totalGoalsTarget,
    currentMonthIncome,
    currentMonthExpense,
    currentMonthNet,
    currentMonthSavingsRate,
    totalOwedToMe,
    totalIOwe,
    setCurrentView,
    resetToDemoData,
  } = useFinance();

  // Smooth number count-up animations for hero metrics
  const animatedTotalBalance = useCountUp(totalBalance);
  const animatedIncome = useCountUp(currentMonthIncome);
  const animatedExpense = useCountUp(currentMonthExpense);
  const animatedInvestment = useCountUp(totalInvestmentValue);
  const animatedLiquid = useCountUp(emergencyFund.currentSaved);

  return (
    <div className="space-y-6">
      {/* Welcome Banner when starting fresh */}
      {transactions.length === 0 && (
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="max-w-2xl space-y-3 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider text-emerald-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Clean Slate Ready</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Welcome to your personal INR Wealth Tracker
            </h2>
            <p className="text-sm text-emerald-100 leading-relaxed">
              Start building your financial ledger. Log your monthly income, set category budgets, track investments, or import your bank & UPI statement.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenAddTx}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs sm:text-sm hover:bg-white/90 transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4 text-amber-500" />
                <span>Add First Transaction</span>
              </button>

              <button
                onClick={() => setCurrentView('import')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Import Statement (CSV/PDF)</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Load sample Indian demo dataset (Swiggy, Zepto, HDFC Salary, SIPs, Goals)?')) {
                    resetToDemoData();
                  }
                }}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
              >
                Load Demo Dataset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL 1: THE MASTER WEALTH LEDGER ANCHOR */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#131822] border border-slate-200/90 dark:border-[#202836] p-6 sm:p-8 shadow-xs">
        {/* Suvarna gold accent hairline at top edge */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F5B742] to-transparent opacity-80" />

        {/* Master Header: Net Worth & Action Cluster */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400">
                <Wallet className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                PRIMARY WEALTH LEDGER
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Net Worth Aggregate
            </p>

            <div className="mt-1">
              <div className="flex flex-wrap items-baseline gap-3 mt-0.5">
                <h2 className="font-numeric text-4xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                  {formatINR(animatedTotalBalance)}
                </h2>
                <span
                  className={`font-numeric text-xs font-semibold px-2.5 py-1 rounded-md ${
                    currentMonthNet >= 0
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {currentMonthNet >= 0 ? '+' : ''}{formatINR(currentMonthNet)} net this month
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
                <span>Monthly savings rate:</span>
                <span className="font-numeric font-bold text-slate-800 dark:text-slate-200">
                  {currentMonthSavingsRate.toFixed(1)}%
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={() => setCurrentView('people')}
                  className="hover:underline text-indigo-600 dark:text-indigo-400 font-medium"
                >
                  {totalOwedToMe > 0
                    ? `Friends owe ₹${totalOwedToMe.toLocaleString('en-IN')}`
                    : totalIOwe > 0
                    ? `You owe ₹${totalIOwe.toLocaleString('en-IN')}`
                    : 'Split accounts settled'}
                </button>
              </p>
            </div>
          </div>

          {/* Action Cluster */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={onOpenAddTx}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-sm font-bold text-slate-950 shadow-sm hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Add transaction</span>
            </button>

            <button
              onClick={() => setCurrentView('people')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#171E2A] dark:hover:bg-[#1C2433] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-[#202836] text-xs sm:text-sm font-medium transition-all active:scale-95"
            >
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Split bill</span>
            </button>

            <button
              onClick={() => setCurrentView('import')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#171E2A] dark:hover:bg-[#1C2433] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-[#202836] text-xs sm:text-sm font-medium transition-all active:scale-95"
            >
              <UploadCloud className="w-4 h-4 text-slate-400" />
              <span>Import</span>
            </button>
          </div>
        </div>

        {/* Integrated Flow & Asset Shelves */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-7 pt-6 border-t border-slate-100 dark:border-[#202836]">
          <div
            onClick={() => setCurrentView('transactions')}
            className="cursor-pointer p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#171E2A] hover:bg-slate-100 dark:hover:bg-[#1C2433] border border-slate-100 dark:border-[#202836] transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Monthly inflow
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">↑</span>
            </div>
            <p className="font-numeric text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              +{formatINR(animatedIncome)}
            </p>
            <span className="text-xs text-slate-400 mt-0.5 block truncate">
              Credits &amp; earnings
            </span>
          </div>

          <div
            onClick={() => setCurrentView('transactions')}
            className="cursor-pointer p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#171E2A] hover:bg-slate-100 dark:hover:bg-[#1C2433] border border-slate-100 dark:border-[#202836] transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Monthly outflow
              </span>
              <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">↓</span>
            </div>
            <p className="font-numeric text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              -{formatINR(animatedExpense)}
            </p>
            <span className="text-xs text-slate-400 mt-0.5 block truncate">
              Debits &amp; UPI spend
            </span>
          </div>

          <div
            onClick={() => setCurrentView('investments')}
            className="cursor-pointer p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#171E2A] hover:bg-slate-100 dark:hover:bg-[#1C2433] border border-slate-100 dark:border-[#202836] transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Invested assets
              </span>
              <span className="text-xs font-numeric font-bold text-[#C28834] dark:text-[#F5B742]">
                {totalInvestmentGainLoss >= 0 ? '+' : ''}{totalInvestmentGainLossPct.toFixed(1)}%
              </span>
            </div>
            <p className="font-numeric text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {formatINR(animatedInvestment)}
            </p>
            <span className="text-xs text-slate-400 mt-0.5 block truncate">
              MF, Stocks, Gold, FDs
            </span>
          </div>

          <div
            onClick={() => setCurrentView('emergency')}
            className="cursor-pointer p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#171E2A] hover:bg-slate-100 dark:hover:bg-[#1C2433] border border-slate-100 dark:border-[#202836] transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Liquid runway
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {emergencyFund.targetMonths}m goal
              </span>
            </div>
            <p className="font-numeric text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {emergencyFundRunwayMonths.toFixed(1)} mos
            </p>
            <span className="text-xs text-slate-400 mt-0.5 block truncate font-numeric">
              {formatINR(animatedLiquid)} liquid
            </span>
          </div>
        </div>
      </div>

      {/* LEVEL 2: CASH FLOW VELOCITY & CATEGORY ALLOCATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <CashFlowChart />
        </div>
        <div className="lg:col-span-5">
          <CategoryExpenseChart />
        </div>
      </div>

      {/* LEVEL 3: OPERATIONAL ACTIVITY & BUDGET HEALTH (BALANCED 1:1 ROW) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Recent Transactions: Primary Operational Ledger (7 cols) */}
        <div className="lg:col-span-7">
          <RecentTransactions />
        </div>

        {/* Budget Health Watchlist (5 cols): 1:1 Height Alignment */}
        <div className="lg:col-span-5">
          <BudgetHealthWidget />
        </div>
      </div>

      {/* LEVEL 4: FINANCIAL COMMITMENTS & OBLIGATIONS (BALANCED 3-COLUMN ROW) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        <CashFlowRunwayCard />
        <RecurringBillsCard />
        <OwedSummaryWidget />
      </div>

      {/* LEVEL 5: AI FINANCIAL HEALTH ASSISTANT (FULL-WIDTH STUDIO BANNER) */}
      <div>
        <AIInsightsWidget />
      </div>
    </div>
  );
};
