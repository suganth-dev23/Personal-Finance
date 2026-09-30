import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  UploadCloud,
  Sparkles,
  Users,
  CalendarClock,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction } from '../../types/finance';
import { CashFlowChart } from './CashFlowChart';
import { CategoryExpenseChart } from './CategoryExpenseChart';
import { BudgetHealthWidget } from './BudgetHealthWidget';
import { RecentTransactions } from './RecentTransactions';
import { AIInsightsWidget } from './AIInsightsWidget';
import { CashFlowRunwayCard, RecurringBillsCard } from './RecurringAndRunwayWidget';
import { OwedSummaryWidget } from './OwedSummaryWidget';
import { formatINR } from '../../utils/currency';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { HealthGauge } from '../gamification/HealthGauge';
import { HealthGaugeCompact } from '../gamification/HealthGaugeCompact';
import { useStaggerChildren } from '../../hooks/useStaggerChildren';

interface DashboardViewProps {
  onOpenAddTx: () => void;
  onEditTransaction?: (tx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenAddTx, onEditTransaction }) => {
  const { containerRef: summaryStripRef, getChildStyle: getSummaryStyle } = useStaggerChildren(50);
  const [mobileTab, setMobileTab] = useState<'overview' | 'commitments'>('overview');

  const handleTabChange = (tab: 'overview' | 'commitments') => {
    setMobileTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const {
    transactions,
    totalBalance,
    totalNetWorth,
    peerBalanceSummary,
    totalInvestmentValue,
    totalInvestmentGainLoss,
    totalInvestmentGainLossPct,
    emergencyFund,
    emergencyFundRunwayMonths,
    currentMonthIncome,
    currentMonthExpense,
    currentMonthNet,
    currentMonthSavingsRate,
    setCurrentView,
    resetToDemoData,
  } = useFinance();

  return (
    <div className="space-y-6">
      {/* Welcome Banner when starting fresh (Mineral Card with Gold Accent) */}
      {transactions.length === 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-card-dark border border-amber-500/30 p-6 sm:p-8 text-white shadow-md">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F5B742] to-transparent opacity-80" />
          <div className="max-w-2xl space-y-3 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-extrabold uppercase tracking-wider text-amber-400">
              <Sparkles className="w-3.5 h-3.5 text-[#F5B742]" />
              <span>Clean Slate Ready</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white">
              Welcome to your personal INR Wealth Tracker
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Start building your financial ledger. Log your monthly income, set category budgets, track investments, or import your bank &amp; UPI statement.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenAddTx}
                className="press flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add First Transaction</span>
              </button>

              <button
                onClick={() => setCurrentView('import')}
                className="press flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 transition-all shadow-xs"
              >
                <UploadCloud className="w-4 h-4 text-amber-400" />
                <span>Import Statement (CSV/PDF)</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Load sample Indian demo dataset (Swiggy, Zepto, HDFC Salary, SIPs, Goals)?')) {
                    resetToDemoData();
                  }
                }}
                className="press px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Load Demo Dataset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL 1: THE MASTER WEALTH LEDGER ANCHOR */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-white dark:bg-card-dark border border-slate-200/90 dark:border-border-dark p-4 sm:p-8 shadow-xs ${
          mobileTab !== 'overview' ? 'hidden sm:block' : ''
        }`}
      >
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
                TOTAL NET WORTH
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mb-1">
              Consolidated Personal Wealth (Assets &minus; Liabilities)
            </p>

            <div className="mt-1">
              <div className="flex flex-wrap items-baseline gap-3 mt-0.5">
                <h2 className="font-numeric text-2xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                  <AnimatedNumber value={totalNetWorth} showDirection={false} animateOnMount={true} />
                </h2>
                <span
                  className={`font-numeric text-xs font-semibold px-2.5 py-1 rounded-md ${
                    currentMonthNet >= 0
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {currentMonthNet >= 0 ? '+' : ''}{formatINR(currentMonthNet)} cashflow this month
                </span>
              </div>
              <p className="hidden sm:flex text-xs text-slate-500 dark:text-slate-400 mt-2 items-center gap-2 flex-wrap">
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
                  {peerBalanceSummary.displayText}
                </button>
              </p>
            </div>
          </div>

          {/* Action Cluster (Desktop) */}
          <div className="hidden sm:flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenAddTx}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-sm font-bold text-slate-950 shadow-sm hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Add transaction</span>
            </button>

            <button
              onClick={() => setCurrentView('people')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-inset-dark dark:hover:bg-[#1C2433] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-border-dark text-xs sm:text-sm font-medium transition-all active:scale-95"
            >
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Split bill</span>
            </button>
          </div>
        </div>


        {/* Integrated Flow & Asset Shelves */}
        <div ref={summaryStripRef} className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 sm:mt-7 sm:pt-6 border-t border-slate-100 dark:border-border-dark">
          <div
            style={getSummaryStyle(0)}
            onClick={() => setCurrentView('transactions')}
            className="animate-slide-up cursor-pointer p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 dark:bg-inset-dark hover:bg-slate-100 dark:hover:bg-[#1C2433] border border-slate-100 dark:border-border-dark transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Bank & Cash
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Liquid</span>
            </div>
            <p className="font-numeric text-base sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
              <AnimatedNumber value={totalBalance} animateOnMount={true} />
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
              +{formatINR(currentMonthIncome)} in this mo
            </span>
          </div>

          <div
            style={getSummaryStyle(1)}
            onClick={() => setCurrentView('transactions')}
            className="animate-slide-up cursor-pointer p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 dark:bg-inset-dark hover:bg-slate-100 dark:hover:bg-[#1C2433] border border-slate-100 dark:border-border-dark transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Monthly spend
              </span>
              <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">↓</span>
            </div>
            <p className="font-numeric text-base sm:text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              -<AnimatedNumber value={currentMonthExpense} animateOnMount={true} />
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
              Debits &amp; UPI
            </span>
          </div>

          <div
            style={getSummaryStyle(2)}
            onClick={() => setCurrentView('investments')}
            className="animate-slide-up cursor-pointer p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 dark:bg-inset-dark hover:bg-slate-100 dark:hover:bg-[#1C2433] border border-slate-100 dark:border-border-dark transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                <span className="sm:hidden">Investments</span>
                <span className="hidden sm:inline">Invested assets</span>
              </span>
              <span className="text-xs font-numeric font-bold text-[#C28834] dark:text-[#F5B742]">
                {totalInvestmentGainLoss >= 0 ? '+' : ''}{totalInvestmentGainLossPct.toFixed(1)}%
              </span>
            </div>
            <p className="font-numeric text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              <AnimatedNumber value={totalInvestmentValue} animateOnMount={true} />
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
              MF, Stocks, Gold, FDs
            </span>
          </div>

          <div
            style={getSummaryStyle(3)}
            onClick={() => setCurrentView('emergency')}
            className="animate-slide-up cursor-pointer p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 dark:bg-inset-dark hover:bg-slate-100 dark:hover:bg-[#1C2433] border border-slate-100 dark:border-border-dark transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Liquid runway
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {emergencyFund.targetMonths}m goal
              </span>
            </div>
            <p className="font-numeric text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {emergencyFundRunwayMonths.toFixed(1)} mos
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block truncate font-numeric">
              <AnimatedNumber value={emergencyFund.currentSaved} animateOnMount={true} /> saved
            </span>
          </div>
        </div>
      </div>

      {/* MOBILE SEGMENTED VIEW SWITCHER (sm:hidden) - Sticky beneath top navbar */}
      <div className="sm:hidden sticky top-14 z-20 -mx-4 px-4 py-2 bg-[#F8F9FA]/95 dark:bg-[#0B0E14]/95 backdrop-blur-md transition-all">
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-inset-dark border border-slate-200/80 dark:border-border-dark text-xs font-bold shadow-xs">
          <button
            type="button"
            onClick={() => handleTabChange('overview')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all ${
              mobileTab === 'overview'
                ? 'bg-white dark:bg-active-dark text-slate-900 dark:text-[#F5B742] shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('commitments')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all ${
              mobileTab === 'commitments'
                ? 'bg-white dark:bg-active-dark text-slate-900 dark:text-[#F5B742] shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Commitments</span>
          </button>
        </div>
      </div>

      {/* MOBILE CONTENT ACCORDING TO ACTIVE SEGMENT */}
      <div className="sm:hidden space-y-4">
        {mobileTab === 'overview' && (
          <>
            <CashFlowChart />
            <CategoryExpenseChart />
            <HealthGaugeCompact />
            <BudgetHealthWidget />
            <RecentTransactions onEditTransaction={onEditTransaction} />
          </>
        )}
        {mobileTab === 'commitments' && (
          <>
            <CashFlowRunwayCard />
            <RecurringBillsCard />
            <OwedSummaryWidget />
            <AIInsightsWidget />
          </>
        )}
      </div>

      {/* DESKTOP CONTENT (ALL LEVELS IN COMPREHENSIVE GRID) */}
      <div className="hidden sm:block space-y-6">
        {/* LEVEL 2: CASH FLOW VELOCITY & CATEGORY ALLOCATION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <CashFlowChart />
          </div>
          <div className="lg:col-span-5">
            <CategoryExpenseChart />
          </div>
        </div>

        {/* FINANCIAL HEALTH INDEX & 5 PILLARS GAUGE */}
        <div>
          <HealthGauge />
        </div>

        {/* LEVEL 3: OPERATIONAL ACTIVITY & BUDGET HEALTH */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7">
            <RecentTransactions onEditTransaction={onEditTransaction} />
          </div>
          <div className="lg:col-span-5">
            <BudgetHealthWidget />
          </div>
        </div>

        {/* LEVEL 4: FINANCIAL COMMITMENTS & OBLIGATIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          <CashFlowRunwayCard />
          <RecurringBillsCard />
          <OwedSummaryWidget />
        </div>

        {/* LEVEL 5: AI FINANCIAL HEALTH ASSISTANT */}
        <div>
          <AIInsightsWidget />
        </div>
      </div>
    </div>
  );
};
