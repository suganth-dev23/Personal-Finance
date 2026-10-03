import { AppView } from '../context/FinanceContext';

export const VIEW_TITLES: Record<AppView, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of your net worth, cash flow & budget health' },
  transactions: { title: 'Transactions', subtitle: 'Search, filter, and manage all your bank & UPI records' },
  people: { title: 'People & Splits', subtitle: 'Track IOUs, who owes you, who you owe, and settlements' },
  budgets: { title: 'Budgets', subtitle: 'Set limits per category and track spending velocity' },
  recurring: { title: 'Recurring Payments', subtitle: 'Fixed commitments, subscriptions, EMIs, and monthly bills' },
  categories: { title: 'Categories', subtitle: 'Default and custom category breakdown & icons' },
  emergency: { title: 'Emergency Fund', subtitle: 'Build and track your 6-month living expenses safety net' },
  investments: { title: 'Investments', subtitle: 'Track Stocks, Mutual Funds, FD, Gold, EPF & Crypto' },
  dreams: { title: 'Goals & Dreams', subtitle: 'Achieve your milestones with target-date saving plans' },
  badges: { title: 'Achievements', subtitle: 'Trophies, unlockable financial discipline milestones & XP' },
  ai: { title: 'AI Health Summary', subtitle: 'Bring-Your-Own-Key private AI insights (Gemini / OpenAI / Claude)' },
  settings: { title: 'Settings', subtitle: 'API keys, local storage data export & demo data' },
  import: { title: 'Import Statement', subtitle: 'Parse PDF & CSV bank statements with auto-categorization' },
};
