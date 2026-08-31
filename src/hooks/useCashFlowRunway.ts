import { useMemo } from 'react';
import { Transaction } from '../types/finance';

export type RunwayStatus = 'sustainable' | 'abundant' | 'healthy' | 'moderate' | 'critical';

export interface CashFlowRunwayResult {
  averageMonthlyIncome: number;
  averageMonthlyExpense: number;
  netMonthlyCashFlow: number; // positive = surplus, negative = deficit/burn
  monthlyBurnRate: number; // >= 0 (only positive if spending exceeds income)
  runwayMonths: number; // months of runway based on net burn
  expenseOnlyRunwayMonths: number; // months if income drops to 0
  status: RunwayStatus;
  statusLabel: string;
  statusColor: string;
  totalLiquidBalance: number;
}

/**
 * Hook to estimate months of cash-flow runway based on historical monthly burn rate and current balance.
 */
export function useCashFlowRunway(
  transactions: Transaction[],
  currentBalance: number
): CashFlowRunwayResult {
  return useMemo(() => {
    const monthlyData: Record<string, { income: number; expense: number }> = {};

    transactions.forEach(tx => {
      const ym = tx.date.substring(0, 7);
      if (!monthlyData[ym]) {
        monthlyData[ym] = { income: 0, expense: 0 };
      }
      if (tx.type === 'credit') {
        monthlyData[ym].income += tx.amount;
      } else {
        monthlyData[ym].expense += tx.amount;
      }
    });

    const months = Object.keys(monthlyData);
    const monthsCount = Math.max(1, months.length);

    let totalIncome = 0;
    let totalExpense = 0;

    months.forEach(m => {
      totalIncome += monthlyData[m].income;
      totalExpense += monthlyData[m].expense;
    });

    const averageMonthlyIncome = months.length > 0 ? totalIncome / monthsCount : 0;
    const averageMonthlyExpense = months.length > 0 ? totalExpense / monthsCount : 0;
    const netMonthlyCashFlow = averageMonthlyIncome - averageMonthlyExpense;

    const monthlyBurnRate = netMonthlyCashFlow < 0 ? Math.abs(netMonthlyCashFlow) : 0;

    const liquidBalance = Math.max(0, currentBalance);

    const expenseOnlyRunwayMonths =
      averageMonthlyExpense > 0 ? Number((liquidBalance / averageMonthlyExpense).toFixed(1)) : 0;

    let runwayMonths = 0;
    let status: RunwayStatus = 'healthy';
    let statusLabel = 'Healthy Runway';
    let statusColor = 'text-emerald-600 dark:text-emerald-400';

    if (averageMonthlyExpense === 0 && liquidBalance === 0) {
      status = 'moderate';
      statusLabel = 'No Activity';
      statusColor = 'text-slate-500';
      runwayMonths = 0;
    } else if (netMonthlyCashFlow >= 0) {
      status = 'sustainable';
      statusLabel = 'Cash-Flow Positive (+ Surplus)';
      statusColor = 'text-emerald-600 dark:text-emerald-400';
      runwayMonths = Infinity;
    } else {
      runwayMonths = monthlyBurnRate > 0 ? Number((liquidBalance / monthlyBurnRate).toFixed(1)) : 0;

      if (runwayMonths >= 12) {
        status = 'abundant';
        statusLabel = 'Abundant Runway (12+ months)';
        statusColor = 'text-teal-600 dark:text-teal-400';
      } else if (runwayMonths >= 6) {
        status = 'healthy';
        statusLabel = 'Healthy Runway (6-12 months)';
        statusColor = 'text-emerald-600 dark:text-emerald-400';
      } else if (runwayMonths >= 3) {
        status = 'moderate';
        statusLabel = 'Moderate Runway (3-6 months)';
        statusColor = 'text-amber-600 dark:text-amber-400';
      } else {
        status = 'critical';
        statusLabel = 'Critical Runway (< 3 months)';
        statusColor = 'text-rose-600 dark:text-rose-400';
      }
    }

    return {
      averageMonthlyIncome,
      averageMonthlyExpense,
      netMonthlyCashFlow,
      monthlyBurnRate,
      runwayMonths,
      expenseOnlyRunwayMonths,
      status,
      statusLabel,
      statusColor,
      totalLiquidBalance: liquidBalance,
    };
  }, [transactions, currentBalance]);
}
