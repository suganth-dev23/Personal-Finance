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
import { RecurringAndRunwayWidget } from './RecurringAndRunwayWidget';
import { OwedSummaryWidget } from './OwedSummaryWidget';
import { formatINR } from '../../utils/currency';

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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-xs sm:text-sm hover:bg-emerald-50 transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Add First Transaction</span>
              </button>

              <button
                onClick={() => setCurrentView('import')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all"
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

      {/* Minimalist Flow Hero Card (inspired by Variant 1B) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Glow orb in background */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Net Balance
            </span>
            <div className="flex flex-wrap items-baseline gap-3 mt-1.5">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {formatINR(totalBalance)}
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  currentMonthNet >= 0
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                <span>{currentMonthNet >= 0 ? '+' : ''}{formatINR(currentMonthNet)} this month</span>
              </span>
            </div>

            {/* Split Tracker Pill (from Variant 1B) */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setCurrentView('people')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all active:scale-95"
                title="View People & Expense Splits"
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Split Tracker:</span>
                {totalOwedToMe > 0 ? (
                  <span className="font-bold text-emerald-400">Friends owe you {formatINR(totalOwedToMe)}</span>
                ) : totalIOwe > 0 ? (
                  <span className="font-bold text-rose-400">You owe {formatINR(totalIOwe)}</span>
                ) : (
                  <span className="text-slate-400 font-medium">All Settled</span>
                )}
              </button>

              <span className="hidden sm:inline text-xs text-slate-400 font-medium">
                • {currentMonthSavingsRate.toFixed(1)}% savings rate
              </span>
            </div>
          </div>

          {/* 4 Circular Action Buttons matching Variant 1A/1B */}
          <div className="flex items-center gap-3 sm:gap-4 self-start md:self-auto pt-1 md:pt-0">
            <button
              onClick={onOpenAddTx}
              className="flex flex-col items-center gap-1.5 group"
              title="Add Transaction"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 group-hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/40 transition-all active:scale-95">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors">
                Add
              </span>
            </button>

            <button
              onClick={() => setCurrentView('people')}
              className="flex flex-col items-center gap-1.5 group"
              title="Split IOU / People"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-indigo-400 flex items-center justify-center border border-slate-700 transition-all active:scale-95">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                Split
              </span>
            </button>

            <button
              onClick={() => setCurrentView('investments')}
              className="flex flex-col items-center gap-1.5 group"
              title="Investments Portfolio"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-teal-400 flex items-center justify-center border border-slate-700 transition-all active:scale-95">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                Invest
              </span>
            </button>

            <button
              onClick={() => setCurrentView('ai')}
              className="flex flex-col items-center gap-1.5 group"
              title="AI Health Analytics"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-violet-400 flex items-center justify-center border border-slate-700 transition-all active:scale-95">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                AI Health
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Prominent Metric Cards (Income, Expense, Portfolio, Emergency Runway) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setCurrentView('transactions')}
          className="cursor-pointer bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Monthly Income
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            +{formatINR(currentMonthIncome)}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Credits &amp; Salary this month
          </span>
        </div>

        <div
          onClick={() => setCurrentView('transactions')}
          className="cursor-pointer bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Monthly Expenses
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            -{formatINR(currentMonthExpense)}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Debits &amp; UPI spending
          </span>
        </div>

        <div
          onClick={() => setCurrentView('investments')}
          className="cursor-pointer bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Invested Portfolio
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatINR(totalInvestmentValue)}
          </p>
          <span className="text-xs text-teal-600 dark:text-teal-400 font-bold mt-1 block">
            {totalInvestmentGainLoss >= 0 ? '+' : ''}{totalInvestmentGainLossPct.toFixed(1)}% gain
          </span>
        </div>

        <div
          onClick={() => setCurrentView('emergency')}
          className="cursor-pointer bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Emergency Runway
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {emergencyFundRunwayMonths.toFixed(1)} Mo
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Funded: {formatINR(emergencyFund.currentSaved)}
          </span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <CashFlowChart />
        </div>
        <div className="lg:col-span-5">
          <CategoryExpenseChart />
        </div>
      </div>

      {/* Derived Analytics: Cash-Flow Runway & Recurring Subscriptions */}
      <RecurringAndRunwayWidget />

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div>
          <BudgetHealthWidget />
        </div>
        <div>
          <OwedSummaryWidget />
        </div>
        <div>
          <AIInsightsWidget />
        </div>
        <div>
          <RecentTransactions />
        </div>
      </div>
    </div>
  );
};
