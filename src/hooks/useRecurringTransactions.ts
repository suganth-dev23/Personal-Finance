import { useMemo } from 'react';
import { Transaction } from '../types/finance';

/**
 * Calculates string similarity between two descriptions (0 to 1)
 */
function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  words1.forEach(w => {
    if (words2.has(w)) intersection++;
  });

  return (2 * intersection) / (words1.size + words2.size);
}

export interface RecurringCluster {
  clusterId: string;
  description: string;
  category: string;
  type: 'credit' | 'debit';
  averageAmount: number;
  latestAmount: number;
  intervalDays: number;
  occurrenceCount: number;
  lastDate: string;
  nextEstimatedDate: string;
  transactionIds: string[];
}

export interface RecurringTransactionsResult {
  recurringExpenses: RecurringCluster[];
  recurringIncomes: RecurringCluster[];
  totalMonthlyRecurringExpenses: number;
  totalMonthlyRecurringIncome: number;
}

/**
 * Hook to detect recurring transactions (subscriptions, rent, SIPs, utilities, salaries)
 * within 28–32 days recurrence tolerance, respecting user exclusion overrides.
 */
export function useRecurringTransactions(
  transactions: Transaction[],
  notRecurringTxIds?: Set<string>
): RecurringTransactionsResult {
  return useMemo(() => {
    // Filter out transactions explicitly marked by the user as "not recurring"
    const validTransactions = transactions.filter(
      t => !notRecurringTxIds || !notRecurringTxIds.has(t.id)
    );

    // Group into potential clusters by fuzzy description + category + type
    const clusters: Transaction[][] = [];

    validTransactions.forEach(tx => {
      let matchedCluster: Transaction[] | null = null;

      for (const cluster of clusters) {
        const rep = cluster[0];
        // Check matching type
        if (rep.type !== tx.type) continue;

        // Check similarity on description or category match
        const sim = stringSimilarity(rep.description, tx.description);
        if (sim >= 0.55 || (rep.category === tx.category && sim >= 0.35)) {
          matchedCluster = cluster;
          break;
        }
      }

      if (matchedCluster) {
        matchedCluster.push(tx);
      } else {
        clusters.push([tx]);
      }
    });

    const detectedRecurring: RecurringCluster[] = [];

    clusters.forEach((cluster, idx) => {
      // Need at least 2 transactions to establish a recurrence interval
      if (cluster.length < 2) return;

      // Sort chronological ascending
      const sorted = [...cluster].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Check day intervals between consecutive events
      const intervals: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const d1 = new Date(sorted[i - 1].date).getTime();
        const d2 = new Date(sorted[i].date).getTime();
        const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
        intervals.push(diffDays);
      }

      // Check if majority of intervals are roughly monthly (28–34 days)
      const monthlyMatches = intervals.filter(days => days >= 27 && days <= 35);
      const isRecurring = (monthlyMatches.length / intervals.length) >= 0.5;

      if (isRecurring) {
        const totalAmt = sorted.reduce((sum, t) => sum + t.amount, 0);
        const avgAmt = totalAmt / sorted.length;
        const avgInterval = Math.round(
          intervals.reduce((sum, i) => sum + i, 0) / intervals.length
        );

        const latestTx = sorted[sorted.length - 1];
        const lastDateObj = new Date(latestTx.date);

        // Project next estimated date (+avgInterval days)
        const nextDateObj = new Date(lastDateObj);
        nextDateObj.setDate(nextDateObj.getDate() + (avgInterval || 30));
        const nextEstimatedDate = nextDateObj.toISOString().split('T')[0];

        detectedRecurring.push({
          clusterId: `rec-${idx}-${latestTx.id}`,
          description: latestTx.description,
          category: latestTx.category,
          type: latestTx.type,
          averageAmount: avgAmt,
          latestAmount: latestTx.amount,
          intervalDays: avgInterval,
          occurrenceCount: sorted.length,
          lastDate: latestTx.date,
          nextEstimatedDate,
          transactionIds: sorted.map(t => t.id),
        });
      }
    });

    const recurringExpenses = detectedRecurring.filter(c => c.type === 'debit');
    const recurringIncomes = detectedRecurring.filter(c => c.type === 'credit');

    const totalMonthlyRecurringExpenses = recurringExpenses.reduce(
      (sum, c) => sum + c.averageAmount,
      0
    );
    const totalMonthlyRecurringIncome = recurringIncomes.reduce(
      (sum, c) => sum + c.averageAmount,
      0
    );

    return {
      recurringExpenses,
      recurringIncomes,
      totalMonthlyRecurringExpenses,
      totalMonthlyRecurringIncome,
    };
  }, [transactions, notRecurringTxIds]);
}
