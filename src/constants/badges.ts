import { Badge, Transaction, Budget, DreamGoal, EmergencyFund, Investment, RecurringPaymentLog, SettlementRecord, StreakData } from '../types/finance';

export interface BadgeEvaluationContext {
  transactions: Transaction[];
  budgets: Budget[];
  categorySpendingThisMonth: { category: string; spent: number; budget: number; percentUsed: number }[];
  dreams: DreamGoal[];
  emergencyFund: EmergencyFund;
  emergencyFundRunwayMonths: number;
  investments: Investment[];
  totalInvestmentValue: number;
  totalInvestmentGainLoss: number;
  recurringPaymentLogs: RecurringPaymentLog[];
  settlements: SettlementRecord[];
  streak: StreakData;
  isDriveConnected: boolean;
}

export interface BadgeDefinition extends Omit<Badge, 'unlockedAt' | 'progress' | 'currentCount' | 'targetCount'> {
  evaluate: (ctx: BadgeEvaluationContext) => {
    isUnlocked: boolean;
    progress?: number;
    currentCount?: number;
    targetCount?: number;
  };
}

export const ALL_BADGES: BadgeDefinition[] = [
  // ── 1. BUDGETING DISCIPLINE ──
  {
    id: 'budget_starter',
    name: 'Budget Architect',
    description: 'Set up your first monthly category spending limit.',
    category: 'budgeting',
    tier: 'bronze',
    icon: 'PieChart',
    xp: 100,
    evaluate: ctx => {
      const count = Array.isArray(ctx?.budgets) ? ctx.budgets.length : 0;
      return {
        isUnlocked: count >= 1,
        progress: count >= 1 ? 100 : 0,
        currentCount: count,
        targetCount: 1,
      };
    },
  },
  {
    id: 'budget_disciplined',
    name: 'Master of Restraint',
    description: 'Establish 3 or more active category budgets.',
    category: 'budgeting',
    tier: 'silver',
    icon: 'ShieldCheck',
    xp: 250,
    evaluate: ctx => {
      const count = Array.isArray(ctx?.budgets) ? ctx.budgets.length : 0;
      return {
        isUnlocked: count >= 3,
        progress: Math.min(100, Math.round((count / 3) * 100)),
        currentCount: count,
        targetCount: 3,
      };
    },
  },
  {
    id: 'budget_zero_waste',
    name: 'Frugal Titan',
    description: 'Spend under 80% across all budgeted categories with active limits (evaluated mid-month onwards).',
    category: 'budgeting',
    tier: 'gold',
    icon: 'Zap',
    xp: 500,
    evaluate: ctx => {
      const categories = Array.isArray(ctx?.categorySpendingThisMonth) ? ctx.categorySpendingThisMonth : [];
      const budgeted = categories.filter(c => c && Number.isFinite(c.budget) && c.budget > 0);
      const dayOfMonth = new Date().getDate();
      const hasActivity = budgeted.some(c => Number.isFinite(c.spent) && c.spent > 0);
      if (budgeted.length < 2 || !hasActivity || dayOfMonth < 15) {
        return { isUnlocked: false, progress: budgeted.length >= 2 ? 50 : 0 };
      }
      const allUnder80 = budgeted.every(c => Number.isFinite(c.percentUsed) && c.percentUsed <= 80);
      return {
        isUnlocked: allUnder80,
        progress: allUnder80 ? 100 : 50,
      };
    },
  },
  {
    id: 'budget_centurion',
    name: 'Zero-Deficit Master',
    description: 'Keep all budgeted categories strictly under 100% through the month with at least 2 budgets set.',
    category: 'budgeting',
    tier: 'diamond',
    icon: 'Award',
    xp: 1000,
    evaluate: ctx => {
      const categories = Array.isArray(ctx?.categorySpendingThisMonth) ? ctx.categorySpendingThisMonth : [];
      const budgeted = categories.filter(c => c && Number.isFinite(c.budget) && c.budget > 0);
      const dayOfMonth = new Date().getDate();
      const transactions = Array.isArray(ctx?.transactions) ? ctx.transactions : [];
      const totalDebits = transactions.filter(t => t && t.type === 'debit').length;
      if (budgeted.length < 2 || dayOfMonth < 25 || totalDebits < 5) {
        return { isUnlocked: false, progress: budgeted.length >= 2 ? 75 : 0 };
      }
      const allUnder = budgeted.every(c => Number.isFinite(c.percentUsed) && c.percentUsed <= 100);
      return {
        isUnlocked: allUnder,
        progress: allUnder ? 100 : 75,
      };
    },
  },

  // ── 2. SAVING & DREAMS ──
  {
    id: 'save_first_dream',
    name: 'Dream Seed',
    description: 'Create your first milestone dream goal.',
    category: 'saving',
    tier: 'bronze',
    icon: 'Target',
    xp: 100,
    evaluate: ctx => {
      const count = Array.isArray(ctx?.dreams) ? ctx.dreams.length : 0;
      return {
        isUnlocked: count >= 1,
        progress: count >= 1 ? 100 : 0,
        currentCount: count,
        targetCount: 1,
      };
    },
  },
  {
    id: 'save_multi_goals',
    name: 'Visionary Saver',
    description: 'Actively save toward 3 or more dream goals simultaneously.',
    category: 'saving',
    tier: 'silver',
    icon: 'Compass',
    xp: 300,
    evaluate: ctx => {
      const dreams = Array.isArray(ctx?.dreams) ? ctx.dreams : [];
      const activeFunded = dreams.filter(d => d && Number.isFinite(d.currentSaved) && d.currentSaved > 0);
      const count = activeFunded.length;
      return {
        isUnlocked: count >= 3,
        progress: Math.min(100, Math.round((count / 3) * 100)),
        currentCount: count,
        targetCount: 3,
      };
    },
  },
  {
    id: 'save_first_completed',
    name: 'Dream Manifested',
    description: 'Accumulate 100% of the funds needed to complete a dream goal.',
    category: 'saving',
    tier: 'gold',
    icon: 'Trophy',
    xp: 500,
    evaluate: ctx => {
      const dreams = Array.isArray(ctx?.dreams) ? ctx.dreams : [];
      const completed = dreams.some(
        d => d && Number.isFinite(d.currentSaved) && Number.isFinite(d.targetAmount) && d.targetAmount > 0 && d.currentSaved >= d.targetAmount
      );
      return {
        isUnlocked: completed,
        progress: completed ? 100 : 0,
      };
    },
  },
  {
    id: 'save_emergency_starter',
    name: 'Shield Bearer',
    description: 'Deposit your first funds into the Emergency Safety Reserve.',
    category: 'saving',
    tier: 'bronze',
    icon: 'Shield',
    xp: 100,
    evaluate: ctx => {
      const hasSaved = Number.isFinite(ctx?.emergencyFund?.currentSaved) && ctx.emergencyFund.currentSaved > 0;
      return {
        isUnlocked: hasSaved,
        progress: hasSaved ? 100 : 0,
      };
    },
  },
  {
    id: 'save_emergency_half',
    name: 'Halfway Shielded',
    description: 'Secure 3 or more months of living expenses in emergency reserve.',
    category: 'saving',
    tier: 'silver',
    icon: 'ShieldCheck',
    xp: 350,
    evaluate: ctx => {
      const runway = Number.isFinite(ctx?.emergencyFundRunwayMonths) ? Math.max(0, ctx.emergencyFundRunwayMonths) : 0;
      return {
        isUnlocked: runway >= 3,
        progress: Math.min(100, Math.round((runway / 3) * 100)),
        currentCount: Math.round(runway * 10) / 10,
        targetCount: 3,
      };
    },
  },
  {
    id: 'save_emergency_full',
    name: 'Fortress of Solitude',
    description: 'Secure 6+ months of runway or fully fund your target emergency reserve.',
    category: 'saving',
    tier: 'diamond',
    icon: 'Crown',
    xp: 1000,
    evaluate: ctx => {
      const runway = Number.isFinite(ctx?.emergencyFundRunwayMonths) ? Math.max(0, ctx.emergencyFundRunwayMonths) : 0;
      const currentSaved = Number.isFinite(ctx?.emergencyFund?.currentSaved) ? Math.max(0, ctx.emergencyFund.currentSaved) : 0;
      const target = (ctx?.emergencyFund?.manualTargetAmount && ctx.emergencyFund.manualTargetAmount > 0)
        ? ctx.emergencyFund.manualTargetAmount
        : 360000;
      const isFunded = currentSaved >= target || runway >= 6;
      return {
        isUnlocked: isFunded,
        progress: isFunded ? 100 : Math.min(99, Math.max(0, Math.round((currentSaved / target) * 100))),
      };
    },
  },

  // ── 3. INVESTING & ASSETS ──
  {
    id: 'invest_first',
    name: 'Market Initiate',
    description: 'Add your first investment asset to your wealth portfolio.',
    category: 'investing',
    tier: 'bronze',
    icon: 'TrendingUp',
    xp: 100,
    evaluate: ctx => {
      const count = Array.isArray(ctx?.investments) ? ctx.investments.length : 0;
      return {
        isUnlocked: count >= 1,
        progress: count >= 1 ? 100 : 0,
        currentCount: count,
        targetCount: 1,
      };
    },
  },
  {
    id: 'invest_portfolio_diversified',
    name: 'Asset Allocator',
    description: 'Diversify portfolio across 3 or more distinct asset types.',
    category: 'investing',
    tier: 'silver',
    icon: 'Layers',
    xp: 300,
    evaluate: ctx => {
      const investments = Array.isArray(ctx?.investments) ? ctx.investments : [];
      const activeInvestments = investments.filter(
        i => i && ((Number.isFinite(i.currentValue) && i.currentValue > 0) || (Number.isFinite(i.investedAmount) && i.investedAmount > 0))
      );
      const types = new Set(activeInvestments.map(i => i.type).filter(Boolean));
      const count = types.size;
      return {
        isUnlocked: count >= 3,
        progress: Math.min(100, Math.round((count / 3) * 100)),
        currentCount: count,
        targetCount: 3,
      };
    },
  },
  {
    id: 'invest_positive_returns',
    name: 'Green Shoots',
    description: 'Achieve net positive overall returns on your invested capital.',
    category: 'investing',
    tier: 'silver',
    icon: 'Activity',
    xp: 250,
    evaluate: ctx => {
      const investments = Array.isArray(ctx?.investments) ? ctx.investments : [];
      const hasInvestments = investments.length > 0;
      const gainLoss = Number.isFinite(ctx?.totalInvestmentGainLoss) ? ctx.totalInvestmentGainLoss : 0;
      const isPositive = hasInvestments && gainLoss > 0;
      return {
        isUnlocked: isPositive,
        progress: isPositive ? 100 : 0,
      };
    },
  },
  {
    id: 'invest_crorepati_journey',
    name: 'Wealth Compounder',
    description: 'Grow your portfolio valuation past ₹5,00,000.',
    category: 'investing',
    tier: 'diamond',
    icon: 'Gem',
    xp: 1200,
    evaluate: ctx => {
      const val = Number.isFinite(ctx?.totalInvestmentValue) ? Math.max(0, ctx.totalInvestmentValue) : 0;
      return {
        isUnlocked: val >= 500000,
        progress: Math.min(100, Math.round((val / 500000) * 100)),
        currentCount: val,
        targetCount: 500000,
      };
    },
  },

  // ── 4. CONSISTENCY & STREAKS ──
  {
    id: 'streak_3_days',
    name: 'Spark of Habit',
    description: 'Log transactions 3 consecutive days in a row.',
    category: 'consistency',
    tier: 'bronze',
    icon: 'Flame',
    xp: 150,
    evaluate: ctx => {
      const cur = Number.isFinite(ctx?.streak?.currentStreak) ? ctx.streak.currentStreak : 0;
      const longest = Number.isFinite(ctx?.streak?.longestStreak) ? ctx.streak.longestStreak : 0;
      const streak = Math.max(0, cur, longest);
      return {
        isUnlocked: streak >= 3,
        progress: Math.min(100, Math.round((streak / 3) * 100)),
        currentCount: streak,
        targetCount: 3,
      };
    },
  },
  {
    id: 'streak_7_days',
    name: 'Habit Formed',
    description: 'Maintain a 7-day transaction tracking streak.',
    category: 'consistency',
    tier: 'silver',
    icon: 'Flame',
    xp: 350,
    evaluate: ctx => {
      const cur = Number.isFinite(ctx?.streak?.currentStreak) ? ctx.streak.currentStreak : 0;
      const longest = Number.isFinite(ctx?.streak?.longestStreak) ? ctx.streak.longestStreak : 0;
      const streak = Math.max(0, cur, longest);
      return {
        isUnlocked: streak >= 7,
        progress: Math.min(100, Math.round((streak / 7) * 100)),
        currentCount: streak,
        targetCount: 7,
      };
    },
  },
  {
    id: 'streak_30_days',
    name: 'Discipline Unstoppable',
    description: 'Achieve a continuous 30-day streak of active financial tracking.',
    category: 'consistency',
    tier: 'gold',
    icon: 'Flame',
    xp: 800,
    evaluate: ctx => {
      const cur = Number.isFinite(ctx?.streak?.currentStreak) ? ctx.streak.currentStreak : 0;
      const longest = Number.isFinite(ctx?.streak?.longestStreak) ? ctx.streak.longestStreak : 0;
      const streak = Math.max(0, cur, longest);
      return {
        isUnlocked: streak >= 30,
        progress: Math.min(100, Math.round((streak / 30) * 100)),
        currentCount: streak,
        targetCount: 30,
      };
    },
  },

  // ── 5. MILESTONES & ORGANIZATION ──
  {
    id: 'first_tx',
    name: 'Day Zero',
    description: 'Record your very first entry in the transaction ledger.',
    category: 'milestone',
    tier: 'bronze',
    icon: 'Sparkles',
    xp: 50,
    evaluate: ctx => {
      const count = Array.isArray(ctx?.transactions) ? ctx.transactions.length : 0;
      return {
        isUnlocked: count >= 1,
        progress: count >= 1 ? 100 : 0,
        currentCount: count,
        targetCount: 1,
      };
    },
  },
  {
    id: 'ledger_50_tx',
    name: 'Century Club Apprentice',
    description: 'Track 50 or more financial records in your ledger.',
    category: 'milestone',
    tier: 'silver',
    icon: 'Receipt',
    xp: 250,
    evaluate: ctx => {
      const count = Array.isArray(ctx?.transactions) ? ctx.transactions.length : 0;
      return {
        isUnlocked: count >= 50,
        progress: Math.min(100, Math.round((count / 50) * 100)),
        currentCount: count,
        targetCount: 50,
      };
    },
  },
  {
    id: 'first_bill_paid',
    name: 'Punctual Payer',
    description: 'Mark a recurring bill or subscription as paid.',
    category: 'milestone',
    tier: 'bronze',
    icon: 'CheckCircle2',
    xp: 100,
    evaluate: ctx => {
      const logs = Array.isArray(ctx?.recurringPaymentLogs) ? ctx.recurringPaymentLogs : [];
      const count = logs.filter(l => l && Boolean(l.paidDate)).length;
      return {
        isUnlocked: count >= 1,
        progress: count >= 1 ? 100 : 0,
        currentCount: count,
        targetCount: 1,
      };
    },
  },
  {
    id: 'split_settled',
    name: 'Fair Share',
    description: 'Record a split settlement with a friend or colleague.',
    category: 'milestone',
    tier: 'bronze',
    icon: 'Users',
    xp: 100,
    evaluate: ctx => {
      const settlements = Array.isArray(ctx?.settlements) ? ctx.settlements : [];
      const count = settlements.length;
      return {
        isUnlocked: count >= 1,
        progress: count >= 1 ? 100 : 0,
        currentCount: count,
        targetCount: 1,
      };
    },
  },
  {
    id: 'drive_cloud_synced',
    name: 'Cloud Sovereign',
    description: 'Connect Google Drive for private, cross-device sync.',
    category: 'milestone',
    tier: 'silver',
    icon: 'CloudUpload',
    xp: 250,
    evaluate: ctx => {
      const isConnected = Boolean(ctx?.isDriveConnected);
      return {
        isUnlocked: isConnected,
        progress: isConnected ? 100 : 0,
      };
    },
  },
];
