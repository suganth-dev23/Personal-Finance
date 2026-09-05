/**
 * Recurring Payment Date & Calculation Utilities
 * 
 * Handles schedule calculation, month rollover, short-month day clamping (e.g. 31st in 30-day months),
 * and monthly financial normalization.
 */

import type { RecurringPayment, RecurringPaymentLog, RecurrenceFrequency } from '../types/finance';

/**
 * Returns the maximum days in a given year and month (1-indexed month: 1=Jan, 12=Dec).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Clamps target day of month to the maximum available days in that month.
 * e.g., 31 in April (month 4) -> 30, 31 in Feb 2026 -> 28
 */
export function clampDayOfMonth(year: number, month: number, targetDay: number): number {
  const maxDays = getDaysInMonth(year, month);
  return Math.max(1, Math.min(targetDay, maxDays));
}

/**
 * Formats a Date object or components to YYYY-MM-DD
 */
export function formatDateISO(year: number, month: number, day: number): string {
  const y = year.toString().padStart(4, '0');
  const m = month.toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse YYYY-MM-DD into [year, month, day]
 */
export function parseDateISO(dateStr: string): [number, number, number] {
  const parts = dateStr.split('-');
  return [parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10)];
}

/**
 * Normalizes payment amount to a monthly financial commitment figure.
 */
export function calculateMonthlyEquivalent(amount: number, frequency: RecurrenceFrequency): number {
  if (amount <= 0) return 0;
  switch (frequency) {
    case 'weekly':
      return Math.round((amount * 52) / 12);
    case 'monthly':
      return amount;
    case 'quarterly':
      return Math.round(amount / 3);
    case 'yearly':
      return Math.round(amount / 12);
    default:
      return amount;
  }
}

/**
 * Checks whether a given due date has already been marked as paid in the logs.
 */
export function isOccurrencePaid(
  paymentId: string,
  dueDate: string,
  logs: RecurringPaymentLog[]
): boolean {
  return logs.some(
    log => log.recurringPaymentId === paymentId && log.dueDate === dueDate && Boolean(log.paidDate)
  );
}

/**
 * Calculates candidate due dates for a RecurringPayment around a given reference date.
 * Returns the relevant unpaid due date or the next upcoming due date.
 */
export function getPaymentSchedule(
  payment: RecurringPayment,
  logs: RecurringPaymentLog[],
  refDate: Date = new Date()
): {
  activeDueDate: string | null;
  isOverdue: boolean;
  daysDiff: number; // negative = days overdue, 0 = due today, positive = days until due
  nextCycleDueDate: string | null;
} {
  const refYear = refDate.getFullYear();
  const refMonth = refDate.getMonth() + 1; // 1-12
  const refDay = refDate.getDate();
  const todayStr = formatDateISO(refYear, refMonth, refDay);

  const [startYear, startMonth, startDay] = parseDateISO(payment.startDate);

  // If start date is in the future, the first occurrence cannot be before startDate
  if (payment.startDate > todayStr) {
    const candidate = payment.startDate;
    const isPaid = isOccurrencePaid(payment.id, candidate, logs);
    if (!isPaid) {
      const daysDiff = Math.round(
        (new Date(candidate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        activeDueDate: candidate,
        isOverdue: false,
        daysDiff,
        nextCycleDueDate: candidate,
      };
    }
  }

  // Monthly frequency handling (most common for bills, rent, SIP, subscriptions)
  if (payment.frequency === 'monthly') {
    const targetDay = payment.dayOfMonth || startDay || 1;

    // Check candidate for current month
    const thisMonthDay = clampDayOfMonth(refYear, refMonth, targetDay);
    const thisMonthDueDate = formatDateISO(refYear, refMonth, thisMonthDay);

    const isThisMonthPaid = isOccurrencePaid(payment.id, thisMonthDueDate, logs);

    // If today is past this month's due date and it's NOT paid -> It is OVERDUE
    if (todayStr > thisMonthDueDate && !isThisMonthPaid && thisMonthDueDate >= payment.startDate) {
      const daysDiff = Math.round(
        (new Date(thisMonthDueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if end date has passed
      if (!payment.endDate || thisMonthDueDate <= payment.endDate) {
        // Calculate next month's cycle
        let nextM = refMonth + 1;
        let nextY = refYear;
        if (nextM > 12) {
          nextM = 1;
          nextY += 1;
        }
        const nextDay = clampDayOfMonth(nextY, nextM, targetDay);
        const nextCycle = formatDateISO(nextY, nextM, nextDay);

        return {
          activeDueDate: thisMonthDueDate,
          isOverdue: true,
          daysDiff,
          nextCycleDueDate: (!payment.endDate || nextCycle <= payment.endDate) ? nextCycle : null,
        };
      }
    }

    // If this month's due date is still upcoming (today <= thisMonthDueDate) and unpaid
    if (!isThisMonthPaid && thisMonthDueDate >= payment.startDate) {
      const daysDiff = Math.round(
        (new Date(thisMonthDueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (!payment.endDate || thisMonthDueDate <= payment.endDate) {
        return {
          activeDueDate: thisMonthDueDate,
          isOverdue: false,
          daysDiff,
          nextCycleDueDate: thisMonthDueDate,
        };
      }
    }

    // Otherwise, this month is already paid! Roll over to next month
    let nextMonth = refMonth + 1;
    let nextYear = refYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    const nextMonthDay = clampDayOfMonth(nextYear, nextMonth, targetDay);
    const nextMonthDueDate = formatDateISO(nextYear, nextMonth, nextMonthDay);

    if (payment.endDate && nextMonthDueDate > payment.endDate) {
      return { activeDueDate: null, isOverdue: false, daysDiff: 0, nextCycleDueDate: null };
    }

    const daysDiff = Math.round(
      (new Date(nextMonthDueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      activeDueDate: nextMonthDueDate,
      isOverdue: false,
      daysDiff,
      nextCycleDueDate: nextMonthDueDate,
    };
  }

  // Quarterly frequency (every 3 months from startDate)
  if (payment.frequency === 'quarterly') {
    const targetDay = payment.dayOfMonth || startDay || 1;
    // Iterate quarters forward from startDate until we find current or upcoming cycle
    let curY = startYear;
    let curM = startMonth;

    while (true) {
      const day = clampDayOfMonth(curY, curM, targetDay);
      const dueDate = formatDateISO(curY, curM, day);

      if (payment.endDate && dueDate > payment.endDate) {
        return { activeDueDate: null, isOverdue: false, daysDiff: 0, nextCycleDueDate: null };
      }

      const isPaid = isOccurrencePaid(payment.id, dueDate, logs);
      const daysDiff = Math.round(
        (new Date(dueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (!isPaid && daysDiff < 0) {
        return { activeDueDate: dueDate, isOverdue: true, daysDiff, nextCycleDueDate: dueDate };
      }

      if (!isPaid && daysDiff >= 0) {
        return { activeDueDate: dueDate, isOverdue: false, daysDiff, nextCycleDueDate: dueDate };
      }

      // advance 3 months
      curM += 3;
      if (curM > 12) {
        curY += Math.floor((curM - 1) / 12);
        curM = ((curM - 1) % 12) + 1;
      }

      // Safety escape if too far in the future
      if (curY > refYear + 5) break;
    }
  }

  // Yearly frequency (once a year on startMonth / targetDay)
  if (payment.frequency === 'yearly') {
    const targetDay = payment.dayOfMonth || startDay || 1;
    let yearCandidate = refYear;
    const day = clampDayOfMonth(yearCandidate, startMonth, targetDay);
    let dueDate = formatDateISO(yearCandidate, startMonth, day);

    let isPaid = isOccurrencePaid(payment.id, dueDate, logs);
    if (isPaid || (todayStr > dueDate && dueDate < payment.startDate)) {
      yearCandidate += 1;
      const nextDay = clampDayOfMonth(yearCandidate, startMonth, targetDay);
      dueDate = formatDateISO(yearCandidate, startMonth, nextDay);
      isPaid = isOccurrencePaid(payment.id, dueDate, logs);
    }

    if (payment.endDate && dueDate > payment.endDate) {
      return { activeDueDate: null, isOverdue: false, daysDiff: 0, nextCycleDueDate: null };
    }

    const daysDiff = Math.round(
      (new Date(dueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      activeDueDate: dueDate,
      isOverdue: !isPaid && daysDiff < 0,
      daysDiff,
      nextCycleDueDate: dueDate,
    };
  }

  // Weekly frequency (every 7 days from startDate)
  if (payment.frequency === 'weekly') {
    const startObj = new Date(payment.startDate);
    const dayOfWeek = startObj.getDay(); // 0-6

    // Find candidate date in current week
    const refObj = new Date(refYear, refMonth - 1, refDay);
    const diff = (dayOfWeek - refObj.getDay() + 7) % 7;
    const candidateObj = new Date(refObj);
    candidateObj.setDate(refObj.getDate() + diff);

    const candidateStr = formatDateISO(
      candidateObj.getFullYear(),
      candidateObj.getMonth() + 1,
      candidateObj.getDate()
    );

    const isPaid = isOccurrencePaid(payment.id, candidateStr, logs);
    const daysDiff = Math.round(
      (new Date(candidateStr).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      activeDueDate: candidateStr,
      isOverdue: !isPaid && daysDiff < 0,
      daysDiff,
      nextCycleDueDate: candidateStr,
    };
  }

  return { activeDueDate: null, isOverdue: false, daysDiff: 0, nextCycleDueDate: null };
}
