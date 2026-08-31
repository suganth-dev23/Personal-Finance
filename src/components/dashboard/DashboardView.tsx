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

      {/* 4 Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Net Balance */}
        <StatCard
          title="Total Net Balance"
          amount={totalBalance}
          subtitle={`This Month Net: ${currentMonthNet >= 0 ? '+' : ''}${formatINR(currentMonthNet)}`}
          icon={<Wallet className="w-5 h-5" />}
          iconBgColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          onClick={() => setCurrentView('transactions')}
        />

        {/* Total Invested Portfolio */}
        <StatCard
          title="Portfolio Valuation"
          amount={totalInvestmentValue}
          subtitle="Across Stocks, MFs, Gold, FD"
          icon={<TrendingUp className="w-5 h-5" />}
          iconBgColor="bg-teal-500/10 text-teal-600 dark:text-teal-400"
          trend={{
            value: `${totalInvestmentGainLoss >= 0 ? '+' : ''}${totalInvestmentGainLossPct.toFixed(1)}%`,
            isPositive: totalInvestmentGainLoss >= 0,
            label: 'gain',
          }}
          onClick={() => setCurrentView('investments')}
        />

        {/* Emergency Fund */}
        <StatCard
          title="Emergency Fund"
          amount={emergencyFund.currentSaved}
          subtitle={`${emergencyFundRunwayMonths.toFixed(1)} months living runway`}
          icon={<ShieldCheck className="w-5 h-5" />}
          iconBgColor="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          trend={{
            value: `${Math.min(100, (emergencyFund.currentSaved / (emergencyFund.manualTargetAmount || 360000)) * 100).toFixed(0)}%`,
            isPositive: true,
            label: 'funded',
          }}
          onClick={() => setCurrentView('emergency')}
        />

        {/* Dreams & Goals Saved */}
        <StatCard
          title="Dreams & Goals Saved"
          amount={totalGoalsSaved}
          subtitle={`Target: ${formatINR(totalGoalsTarget)}`}
          icon={<Target className="w-5 h-5" />}
          iconBgColor="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
          trend={{
            value: `${totalGoalsTarget > 0 ? ((totalGoalsSaved / totalGoalsTarget) * 100).toFixed(0) : 0}%`,
            isPositive: true,
            label: 'goal progress',
          }}
          onClick={() => setCurrentView('dreams')}
        />
      </div>

      {/* Monthly Summary Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 sm:gap-8 w-full md:w-auto">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Month's Income
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              +{formatINR(currentMonthIncome)}
            </p>
          </div>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Month's Expenses
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-rose-600 dark:text-rose-400">
              -{formatINR(currentMonthExpense)}
            </p>
          </div>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Savings Rate
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              {currentMonthSavingsRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Quick buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={() => setCurrentView('import')}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Import Statement</span>
          </button>
          <button
            onClick={onOpenAddTx}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </button>
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
