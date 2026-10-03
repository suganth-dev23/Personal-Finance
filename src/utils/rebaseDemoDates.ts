import {
  Transaction,
  EmergencyFund,
  Investment,
  DreamGoal,
  RecurringPayment,
  RecurringPaymentLog,
} from '../types/finance';

/**
 * Pure helper to shift date strings (YYYY-MM-DD or ISO) by a whole number of months.
 * Clamps day of month to maximum days in the target month. Preserves time portion if present.
 */
export function shiftDateMonths(dateStr: string, monthDelta: number): string;
export function shiftDateMonths(dateStr: string | undefined, monthDelta: number): string | undefined;
export function shiftDateMonths(dateStr?: string, monthDelta: number = 0): string | undefined {
  if (!dateStr || typeof dateStr !== 'string') return dateStr;
  const [dPart, timePart] = dateStr.split('T');
  const parts = dPart.split('-');
  if (parts.length !== 3) return dateStr;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10); // 1-based (1-12)
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

  const totalMonths = year * 12 + (month - 1) + monthDelta;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;

  const maxDays = new Date(newYear, newMonth, 0).getDate();
  const newDay = Math.min(day, maxDays);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const shiftedDate = `${newYear}-${pad(newMonth)}-${pad(newDay)}`;
  return timePart !== undefined ? `${shiftedDate}T${timePart}` : shiftedDate;
}

export interface DemoDataBundle {
  transactions: Transaction[];
  emergencyFund: EmergencyFund;
  investments: Investment[];
  dreams: DreamGoal[];
  recurringPayments: RecurringPayment[];
  recurringPaymentLogs: RecurringPaymentLog[];
}

/**
 * Rebase demo dataset dates so the latest transaction month (2026-08) lands in the current month.
 * Pure function: does not mutate input arrays or objects.
 */
export function rebaseDemoData(bundle: DemoDataBundle, targetDate: Date = new Date()): DemoDataBundle {
  // Baseline demo data latest transactions are in August 2026 (year 2026, month 8)
  const baseYear = 2026;
  const baseMonth = 8;

  const currentYear = targetDate.getFullYear();
  const currentMonth = targetDate.getMonth() + 1; // 1-12

  const monthDelta = (currentYear * 12 + currentMonth) - (baseYear * 12 + baseMonth);
  if (monthDelta === 0) {
    return bundle;
  }

  const transactions = bundle.transactions.map(tx => ({
    ...tx,
    date: shiftDateMonths(tx.date, monthDelta),
    createdAt: shiftDateMonths(tx.createdAt, monthDelta),
  }));

  const emergencyFund: EmergencyFund = {
    ...bundle.emergencyFund,
    contributions: bundle.emergencyFund.contributions.map(c => ({
      ...c,
      date: shiftDateMonths(c.date, monthDelta),
      createdAt: shiftDateMonths(c.createdAt, monthDelta),
    })),
  };

  const investments = bundle.investments.map(inv => ({
    ...inv,
    lastUpdated: shiftDateMonths(inv.lastUpdated, monthDelta),
  }));

  const dreams = bundle.dreams.map(d => ({
    ...d,
    targetDate: d.targetDate ? shiftDateMonths(d.targetDate, monthDelta) : undefined,
    contributions: d.contributions.map(c => ({
      ...c,
      date: shiftDateMonths(c.date, monthDelta),
      createdAt: shiftDateMonths(c.createdAt, monthDelta),
    })),
  }));

  const recurringPayments = bundle.recurringPayments.map(rp => ({
    ...rp,
    startDate: shiftDateMonths(rp.startDate, monthDelta),
    endDate: rp.endDate ? shiftDateMonths(rp.endDate, monthDelta) : undefined,
  }));

  const recurringPaymentLogs = bundle.recurringPaymentLogs.map(l => ({
    ...l,
    paidDate: l.paidDate ? shiftDateMonths(l.paidDate, monthDelta) : undefined,
    dueDate: shiftDateMonths(l.dueDate, monthDelta),
  }));

  return {
    transactions,
    emergencyFund,
    investments,
    dreams,
    recurringPayments,
    recurringPaymentLogs,
  };
}
