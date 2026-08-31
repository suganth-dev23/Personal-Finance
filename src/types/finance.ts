export type TransactionType = 'credit' | 'debit';

export type PaymentMethod = 
  | 'UPI'
  | 'Credit Card'
  | 'Debit Card'
  | 'Net Banking'
  | 'Bank Transfer'
  | 'Cash'
  | 'Cheque'
  | 'Wallet'
  | 'Other';

export type TransactionSource = 'manual' | 'imported';

// Direction from the app owner's point of view:
// 'they_owe_me'  → the contact owes the user money (user is owed)
// 'i_owe_them'   → the user owes the contact money
export type OwedDirection = 'they_owe_me' | 'i_owe_them';

export interface Contact {
  id: string;
  name: string;
  createdAt: string;
  notes?: string;
}

export interface SettlementRecord {
  id: string;
  contactId: string;
  date: string;
  amount: number;
  note?: string;
  createdAt: string;
  // Set only when this settlement was auto-created by the one-tap "mark as settled"
  // tick on a transaction row, so the action can be cleanly undone.
  sourceTransactionId?: string;
  sourceSplitEntryId?: string; // Identifies which SplitEntry within that transaction
  // A transaction (imported or manual) that represents this repayment in the cash ledger
  linkedTransactionId?: string;
}

export interface ContactBalance {
  contactId: string;
  netAmount: number; // positive = they owe the user; negative = user owes them
  lastUpdated: string;
}

export interface SplitEntry {
  id: string;               // unique per split line
  contactId?: string;       // omitted for an "unnamed" row
  label?: string;           // fallback display name when contactId is absent, e.g. "Person 2"
  amount: number;           // this person's owed portion
  direction: OwedDirection; // 'they_owe_me' | 'i_owe_them'
  settled: boolean;
  settledAmount?: number;   // amount settled so far (if partial, remainder stays open)
  linkedTransactionId?: string; // direct reference to the bank transaction repayment
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  type: TransactionType;
  category: string;
  paymentMethod: PaymentMethod;
  description: string;
  person?: string; // free-text: who this transaction was with, e.g. "Amit", "Landlord"
  source: TransactionSource;
  tags?: string[];
  referenceId?: string; // UPI ref / Bank transaction ref
  createdAt: string;
  splitWith?: SplitEntry[]; // array of split entries, 0 or more
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // Hex or Tailwind color
  type: 'expense' | 'income' | 'both';
  isCustom?: boolean;
  budgetMonthly?: number;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
}

export interface EmergencyContribution {
  id: string;
  date: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  note?: string;
  createdAt: string;
}

export interface EmergencyFund {
  targetMonths: number; // e.g. 6 months
  monthlyExpenseBaseline?: number; // Auto computed or user defined
  manualTargetAmount?: number;
  currentSaved: number;
  contributions: EmergencyContribution[];
}

export type InvestmentType = 
  | 'Mutual Funds'
  | 'Stocks'
  | 'Fixed Deposit (FD)'
  | 'Recurring Deposit (RD)'
  | 'Gold / SGB'
  | 'Crypto'
  | 'PPF / EPF'
  | 'NPS'
  | 'Real Estate'
  | 'Bonds / Debt'
  | 'Other';

export interface InvestmentLog {
  id: string;
  date: string;
  investedDelta: number;
  valueDelta?: number;
  note?: string;
}

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  investedAmount: number;
  currentValue: number;
  sipAmount?: number; // Monthly SIP if applicable
  sipDay?: number; // 1 to 28
  platform?: string; // e.g. Zerodha, Groww, INDmoney, Kuvera, SBI
  notes?: string;
  lastUpdated: string;
  logs?: InvestmentLog[];
}

export interface DreamContribution {
  id: string;
  date: string;
  amount: number;
  note?: string;
  createdAt: string;
}

export interface DreamGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
  targetDate?: string; // YYYY-MM-DD
  category: string; // e.g. Travel, Gadget, Vehicle, Home, Education
  icon: string;
  color: string;
  priority: 'low' | 'medium' | 'high';
  contributions: DreamContribution[];
  createdAt: string;
}

export type AIProvider = 'gemini' | 'openai' | 'anthropic';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model: string;
  customPromptPrefix?: string;
}

export interface AIHealthReport {
  id: string;
  createdAt: string;
  provider: AIProvider;
  model: string;
  summaryText: string;
  healthScore?: number; // e.g. 85 / 100
  financialSnapshot: {
    monthlyIncome: number;
    monthlyExpense: number;
    savingsRate: number;
    topExpenseCategory: string;
    emergencyFundMonths: number;
    totalInvestments: number;
    activeGoalsCount: number;
  };
}

export interface StagedTransaction extends Omit<Transaction, 'id' | 'createdAt'> {
  tempId: string;
  isDuplicate?: boolean;
  duplicateReason?: string;
  selected: boolean;
  originalRawRow?: any;
}
