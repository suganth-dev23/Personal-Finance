import { FinanceEvent } from '../context/FinanceContext';
import { formatINR } from '../utils/currency';
import { burstConfetti, goldShower, subtleSparkle } from '../utils/confetti';

export interface ToastPayload {
  variant: 'success' | 'warning' | 'danger' | 'milestone' | 'badge' | 'info';
  title: string;
  message?: string;
  triggerConfetti?: () => void;
}

export function mapFinanceEventToFeedback(event: FinanceEvent): ToastPayload | null {
  switch (event.type) {
    case 'transaction_added': {
      if (event.silent) return null;
      const isCredit = event.tx.type === 'credit';
      return {
        variant: isCredit ? 'success' : 'info',
        title: isCredit ? 'Income Credited' : 'Expense Logged',
        message: `${formatINR(event.tx.amount)} · ${event.tx.category}`,
      };
    }
    case 'transaction_deleted':
      return {
        variant: 'info',
        title: event.count === 1 ? 'Transaction Removed' : `${event.count} Transactions Removed`,
      };
    case 'budget_exceeded':
      return {
        variant: 'danger',
        title: `Budget Exceeded: ${event.category}`,
        message: `Spent ${formatINR(event.spent)} of ${formatINR(event.limit)} monthly limit`,
      };
    case 'dream_contributed':
      if (event.isCompleted) return null; // handled by dream_completed
      return {
        variant: 'success',
        title: 'Goal Savings Logged',
        message: `${formatINR(event.amount)} added to ${event.dreamName}`,
        triggerConfetti: () => subtleSparkle(),
      };
    case 'dream_completed':
      return {
        variant: 'milestone',
        title: 'Dream Goal Achieved! 🎉',
        message: `Target reached for "${event.dream.name}" (${formatINR(event.dream.targetAmount)})!`,
        triggerConfetti: () => burstConfetti(),
      };
    case 'emergency_contributed': {
      if (event.fundType === 'deposit') {
        if (event.isFullyFunded) {
          return {
            variant: 'milestone',
            title: 'Emergency Fund Fully Shielded! 🛡️',
            message: `${formatINR(event.amount)} deposited. You hit your safety target!`,
            triggerConfetti: () => goldShower(),
          };
        }
        return {
          variant: 'success',
          title: 'Reserve Contribution Logged',
          message: `+${formatINR(event.amount)} added to your Emergency Reserve`,
          triggerConfetti: () => subtleSparkle(),
        };
      }
      return {
        variant: 'warning',
        title: 'Emergency Reserve Withdrawal',
        message: `-${formatINR(event.amount)} withdrawn from reserve`,
      };
    }
    case 'recurring_paid':
      return {
        variant: 'success',
        title: 'Payment Confirmed ✓',
        message: `${event.paymentName} (${formatINR(event.amount)}) marked as paid`,
      };
    case 'settlement_recorded':
      return {
        variant: 'success',
        title: 'Settlement Recorded',
        message: `${formatINR(event.amount)} settled with ${event.contactName}`,
        triggerConfetti: () => subtleSparkle(),
      };
    case 'streak_continued':
      return {
        variant: 'milestone',
        title: `🔥 ${event.days}-Day Streak!`,
        message: 'Consistent logging builds long-term wealth discipline',
        triggerConfetti: () => subtleSparkle(),
      };
    case 'streak_broken':
      return {
        variant: 'info',
        title: 'Streak Reset',
        message: 'Start fresh today by logging your transactions',
      };
    case 'badge_earned':
      return {
        variant: 'badge',
        title: `Badge Unlocked: ${event.badge.name}! 🏆`,
        message: event.badge.description,
        triggerConfetti: () => goldShower(),
      };
    default:
      return null;
  }
}
