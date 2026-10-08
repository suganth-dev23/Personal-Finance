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
 * Parse YYYY-MM-DD into [year, month, day].
 * Safely handles invalid strings and non-finite numbers.
 */
export function parseDateISO(dateStr: string): [number, number, number] {
  if (!dateStr || typeof dateStr !== 'string') {
    const now = new Date();
    return [now.getFullYear(), now.getMonth() + 1, now.getDate()];
  }
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    const now = new Date();
    return [now.getFullYear(), now.getMonth() + 1, now.getDate()];
  }
  return [y, m, d];
}

/**
 * Calculates deterministic day difference between two YYYY-MM-DD dates using UTC midnight.
 * Positive = dateA is after dateB.
 * Negative = dateA is before dateB.
 */
export function dateDiffInDays(dateA: string, dateB: string): number {
  const [yA, mA, dA] = parseDateISO(dateA);
  const [yB, mB, dB] = parseDateISO(dateB);
  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);
  return Math.round((utcA - utcB) / (1000 * 60 * 60 * 24));
}

/**
 * Adds N days to a YYYY-MM-DD date using UTC arithmetic to avoid timezone shifts.
 */
export function addDaysISO(dateStr: string, days: number): string {
  const [y, m, d] = parseDateISO(dateStr);
  const nextMs = Date.UTC(y, m - 1, d) + days * 86400000;
  const nextDate = new Date(nextMs);
  return formatDateISO(
    nextDate.getUTCFullYear(),
    nextDate.getUTCMonth() + 1,
    nextDate.getUTCDate()
  );
}

/**
 * Normalizes payment amount to a monthly financial commitment figure.
 * Supports daily, weekly, bi-weekly, monthly, quarterly, semi-annually, yearly.
 */
export function calculateMonthlyEquivalent(amount: number, frequency: RecurrenceFrequency | string): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  switch (frequency) {
    case 'daily':
      return Math.round(amount * 30);
    case 'weekly':
      return Math.round(amount * (52 / 12));
    case 'bi-weekly':
    case 'biweekly':
      return Math.round(amount * (26 / 12));
    case 'monthly':
      return Math.round(amount);
    case 'quarterly':
      return Math.round(amount / 3);
    case 'semi-annually':
    case 'half-yearly':
      return Math.round(amount / 6);
    case 'yearly':
      return Math.round(amount / 12);
    default:
      return Math.round(amount);
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
      const daysDiff = dateDiffInDays(candidate, todayStr);
      return {
        activeDueDate: candidate,
        isOverdue: false,
        daysDiff,
        nextCycleDueDate: candidate,
      };
    }
  }

  // 1. Daily frequency
  if (payment.frequency === 'daily') {
    const daysSinceStart = dateDiffInDays(todayStr, payment.startDate);

    if (daysSinceStart < 0) {
      // startDate is in future
      let cand = payment.startDate;
      while (isOccurrencePaid(payment.id, cand, logs)) {
        cand = addDaysISO(cand, 1);
        if (payment.endDate && cand > payment.endDate) {
          return { activeDueDate: null, isOverdue: false, daysDiff: 0, nextCycleDueDate: null };
        }
      }
      return {
        activeDueDate: cand,
        isOverdue: false,
        daysDiff: dateDiffInDays(cand, todayStr),
        nextCycleDueDate: cand,
      };
    }

    // Check if yesterday is unpaid and within start bounds
    const yesterdayStr = addDaysISO(todayStr, -1);
    if (yesterdayStr >= payment.startDate && !isOccurrencePaid(payment.id, yesterdayStr, logs)) {
      if (!payment.endDate || yesterdayStr <= payment.endDate) {
        const nextCycle = !payment.endDate || todayStr <= payment.endDate ? todayStr : null;
        return {
          activeDueDate: yesterdayStr,
          isOverdue: true,
          daysDiff: -1,
          nextCycleDueDate: nextCycle,
        };
      }
    }

    // Check today
    if (!isOccurrencePaid(payment.id, todayStr, logs)) {
      if (!payment.endDate || todayStr <= payment.endDate) {
        const tomorrowStr = addDaysISO(todayStr, 1);
        const nextCycle = !payment.endDate || tomorrowStr <= payment.endDate ? tomorrowStr : null;
        return {
          activeDueDate: todayStr,
          isOverdue: false,
          daysDiff: 0,
          nextCycleDueDate: nextCycle,
        };
      }
    }

    // Today is paid, advance forward to next unpaid day
    let cand = addDaysISO(todayStr, 1);
    while (isOccurrencePaid(payment.id, cand, logs)) {
      cand = addDaysISO(cand, 1);
      if (payment.endDate && cand > payment.endDate) {
        return { activeDueDate: null, isOverdue: false, daysDiff: 0, nextCycleDueDate: null };
      }
      if (dateDiffInDays(cand, todayStr) > 365) break;
    }

    if (payment.endDate && cand > payment.endDate) {
      return { activeDueDate: null, isOverdue: false, daysDiff: 0, nextCycleDueDate: null };
    }

    const diff = dateDiffInDays(cand, todayStr);
    return {
      activeDueDate: cand,
      isOverdue: false,
      daysDiff: diff,
      nextCycleDueDate: cand,
    };
  }

  // 2. Monthly frequency handling (most common for bills, rent, SIP, subscriptions)
  if (payment.frequency === 'monthly') {
    const targetDay = payment.dayOfMonth || startDay || 1;

    // Check candidate for previous month first to catch overdue payments across month boundaries
    let prevM = refMonth - 1;
    let prevY = refYear;
    if (prevM < 1) {
      prevM = 12;
      prevY -= 1;
    }
    const prevMonthDay = clampDayOfMonth(prevY, prevM, targetDay);
    const prevMonthDueDate = formatDateISO(prevY, prevM, prevMonthDay);
    const isPrevMonthPaid = isOccurrencePaid(payment.id, prevMonthDueDate, logs);

    // If previous month's due date is on/after startDate and is UNPAID, it is OVERDUE!
    if (prevMonthDueDate >= payment.startDate && !isPrevMonthPaid) {
      const daysDiff = dateDiffInDays(prevMonthDueDate, todayStr);
      if (!payment.endDate || prevMonthDueDate <= payment.endDate) {
        const thisMonthDay = clampDayOfMonth(refYear, refMonth, targetDay);
        const thisMonthDueDate = formatDateISO(refYear, refMonth, thisMonthDay);
        return {
          activeDueDate: prevMonthDueDate,
          isOverdue: true,
          daysDiff,
          nextCycleDueDate: (!payment.endDate || thisMonthDueDate <= payment.endDate) ? thisMonthDueDate : null,
        };
      }
    }

    // Check candidate for current month
    const thisMonthDay = clampDayOfMonth(refYear, refMonth, targetDay);
    const thisMonthDueDate = formatDateISO(refYear, refMonth, thisMonthDay);
    const isThisMonthPaid = isOccurrencePaid(payment.id, thisMonthDueDate, logs);

    // If today is past this month's due date and it's NOT paid -> It is OVERDUE
    if (todayStr > thisMonthDueDate && !isThisMonthPaid && thisMonthDueDate >= payment.startDate) {
      const daysDiff = dateDiffInDays(thisMonthDueDate, todayStr);

      if (!payment.endDate || thisMonthDueDate <= payment.endDate) {
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

    // If this month's due date is upcoming/today (today <= thisMonthDueDate) and unpaid
    if (!isThisMonthPaid && thisMonthDueDate >= payment.startDate) {
      const daysDiff = dateDiffInDays(thisMonthDueDate, todayStr);

      if (!payment.endDate || thisMonthDueDate <= payment.endDate) {
        return {
          activeDueDate: thisMonthDueDate,
          isOverdue: false,
          daysDiff,
          nextCycleDueDate: thisMonthDueDate,
        };
      }
    }

    // Otherwise, this month is already paid! Roll over to next unpaid month
    let nextMonth = refMonth + 1;
    let nextYear = refYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    let nextMonthDay = clampDayOfMonth(nextYear, nextMonth, targetDay);
    let nextMonthDueDate = formatDateISO(nextYear, nextMonth, nextMonthDay);

    while (isOccurrencePaid(payment.id, nextMonthDueDate, logs)) {
      nextMonth += 1;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }
      nextMonthDay = clampDayOfMonth(nextYear, nextMonth, targetDay);
      nextMonthDueDate = formatDateISO(nextYear, nextMonth, nextMonthDay);
      if (payment.endDate && nextMonthDueDate > payment.endDate) {
        return { activeDueDate: null, isOverdue: false, daysDiff: 0, nextCycleDueDate: null };
      }
      if (nextYear > refYear + 5) break;
    }

    if (payment.endDate && nextMonthDueDate > payment.endDate) {
      return { activeDueDate: null, isOverdue: false, daysDiff: 0, nextCycleDueDate: null };
    }

    const daysDiff = dateDiffInDays(nextMonthDueDate, todayStr);

    return {
      activeDueDate: nextMonthDueDate,
      isOverdue: false,
      daysDiff,
      nextCycleDueDate: nextMonthDueDate,
    };
  }

  // 3. Quarterly frequency (every 3 months from startDate)
  if (payment.frequency === 'quarterly') {
    const targetDay = payment.dayOfMonth || startDay || 1;
    let curY = startYear;
    let curM = startMonth;

    while (true) {
      const day = clampDayOfMonth(curY, curM, targetDay);
      const dueDate = formatDateISO(curY, curM, day);

      if (payment.endDate && dueDate > payment.endDate) {
        return { activeDueDate: null, isOverdue: false, daysDiff: 0, nextCycleDueDate: null };
      }

      const isPaid = isOccurrencePaid(payment.id, dueDate, logs);
      const daysDiff = dateDiffInDays(dueDate, todayStr);

      if (!isPaid) {
        // Next quarter cycle
        let nxtM = curM + 3;
        let nxtY = curY;
        if (nxtM > 12) {
          nxtY += Math.floor((nxtM - 1) / 12);
          nxtM = ((nxtM - 1) % 12) + 1;
        }
        const nxtDay = clampDayOfMonth(nxtY, nxtM, targetDay);
        const nextCycleDate = formatDateISO(nxtY, nxtM, nxtDay);
        const nextCycleDueDate = (!payment.endDate || nextCycleDate <= payment.endDate) ? nextCycleDate : null;

        return {
          activeDueDate: dueDate,
          isOverdue: daysDiff < 0,
          daysDiff,
          nextCycleDueDate: daysDiff < 0 ? nextCycleDueDate : dueDate,
        };
      }

      // advance 3 months
      curM += 3;
      if (curM > 12) {
        curY += Math.floor((curM - 1) / 12);
        curM = ((curM - 1) % 12) + 1;
      }

      if (curY > refYear + 5) break;
    }
  }

  // 4. Yearly frequency (once a year on startMonth / targetDay)
  if (payment.frequency === 'yearly') {
    const targetDay = payment.dayOfMonth || startDay || 1;
    let yearCandidate = refYear;
    const day = clampDayOfMonth(yearCandidate, startMonth, targetDay);
    let dueDate = formatDateISO(yearCandidate, startMonth, day);

    // If dueDate has passed and was before startDate, advance to next year
    if (todayStr > dueDate && dueDate < payment.startDate) {
      yearCandidate += 1;
      const nextDay = clampDayOfMonth(yearCandidate, startMonth, targetDay);
      dueDate = formatDateISO(yearCandidate, startMonth, nextDay);
    }

    // Step forward if this occurrence is already paid
    while (isOccurrencePaid(payment.id, dueDate, logs)) {
      yearCandidate += 1;
      const nextDay = clampDayOfMonth(yearCandidate, startMonth, targetDay);
      dueDate = formatDateISO(yearCandidate, startMonth, nextDay);
      if (payment.endDate && dueDate > payment.endDate) {
        return { activeDueDate: null, isOverdue: false, daysDiff: 0, nextCycleDueDate: null };
      }
      if (yearCandidate > refYear + 5) break;
    }

    if (payment.endDate && dueDate > payment.endDate) {
      return { activeDueDate: null, isOverdue: false, daysDiff: 0, nextCycleDueDate: null };
    }

    const daysDiff = dateDiffInDays(dueDate, todayStr);
    const nextYearDay = clampDayOfMonth(yearCandidate + 1, startMonth, targetDay);
    const nextYearDueDate = formatDateISO(yearCandidate + 1, startMonth, nextYearDay);
    const nextCycle = (!payment.endDate || nextYearDueDate <= payment.endDate) ? nextYearDueDate : null;

    return {
      activeDueDate: dueDate,
      isOverdue: daysDiff < 0,
      daysDiff,
      nextCycleDueDate: daysDiff < 0 ? nextCycle : dueDate,
    };
  }

  // 5. Weekly or Bi-weekly frequency (every 7 or 14 days from startDate)
  if (
    payment.frequency === 'weekly' ||
    (payment.frequency as string) === 'bi-weekly' ||
    (payment.frequency as string) === 'biweekly'
  ) {
    const intervalDays = payment.frequency === 'weekly' ? 7 : 14;
    const daysSinceStart = dateDiffInDays(todayStr, payment.startDate);

    if (daysSinceStart < 0) {
      // Future start date
      let cand = payment.startDate;
      while (isOccurrencePaid(payment.id, cand, logs)) {
        cand = addDaysISO(cand, intervalDays);
        if (payment.endDate && cand > payment.endDate) {
          return { activeDueDate: null, isOverdue: false, daysDiff: 0, nextCycleDueDate: null };
        }
      }
      return {
        activeDueDate: cand,
        isOverdue: false,
        daysDiff: dateDiffInDays(cand, todayStr),
        nextCycleDueDate: cand,
      };
    }

    const periodsElapsed = Math.floor(daysSinceStart / intervalDays);
    const prevOccurrenceStr = addDaysISO(payment.startDate, periodsElapsed * intervalDays);
    const nextOccurrenceStr = addDaysISO(payment.startDate, (periodsElapsed + 1) * intervalDays);

    const isPrevPaid = isOccurrencePaid(payment.id, prevOccurrenceStr, logs);

    // If previous occurrence is on or after startDate and is unpaid
    if (prevOccurrenceStr >= payment.startDate && !isPrevPaid) {
      const daysDiff = dateDiffInDays(prevOccurrenceStr, todayStr);
      if (!payment.endDate || prevOccurrenceStr <= payment.endDate) {
        return {
          activeDueDate: prevOccurrenceStr,
          isOverdue: daysDiff < 0,
          daysDiff,
          nextCycleDueDate: (!payment.endDate || nextOccurrenceStr <= payment.endDate) ? nextOccurrenceStr : null,
        };
      }
    }

    // Previous occurrence is paid, check nextOccurrence and advance if next is also paid
    let candidate = nextOccurrenceStr;
    while (isOccurrencePaid(payment.id, candidate, logs)) {
      candidate = addDaysISO(candidate, intervalDays);
      if (payment.endDate && candidate > payment.endDate) {
        return { activeDueDate: null, isOverdue: false, daysDiff: 0, nextCycleDueDate: null };
      }
      if (dateDiffInDays(candidate, todayStr) > 365) break;
    }

    if (payment.endDate && candidate > payment.endDate) {
      return { activeDueDate: null, isOverdue: false, daysDiff: 0, nextCycleDueDate: null };
    }

    const daysDiff = dateDiffInDays(candidate, todayStr);

    return {
      activeDueDate: candidate,
      isOverdue: false,
      daysDiff,
      nextCycleDueDate: candidate,
    };
  }

  return { activeDueDate: null, isOverdue: false, daysDiff: 0, nextCycleDueDate: null };
}
