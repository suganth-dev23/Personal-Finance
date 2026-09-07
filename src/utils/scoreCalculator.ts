import { FinancialHealthScore } from '../types/finance';

export interface ScoreInputData {
  monthlySavingsRate: number; // e.g. 24.5%
  budgetedCategories: { spent: number; budget: number; percentUsed: number }[];
  emergencyFundRunwayMonths: number;
  totalIOwe: number;
  totalOwedToMe: number;
  currentStreak: number;
  previousScore?: number;
}

/**
 * Deterministic Financial Health Score Calculator (0 - 100 scale)
 *
 * Breakdown:
 * 1. Savings Rate: 0 - 25 points
 * 2. Budget Adherence: 0 - 25 points
 * 3. Emergency Reserve: 0 - 20 points
 * 4. Debt & Liabilities: 0 - 15 points
 * 5. Tracking Consistency: 0 - 15 points
 */
export function calculateFinancialHealthScore(data: ScoreInputData): FinancialHealthScore {
  // 1. Savings Rate (0 - 25)
  let savingsScore = 0;
  const rate = data.monthlySavingsRate;
  if (rate >= 30) savingsScore = 25;
  else if (rate >= 20) savingsScore = 20 + Math.round(((rate - 20) / 10) * 5);
  else if (rate >= 10) savingsScore = 14 + Math.round(((rate - 10) / 10) * 6);
  else if (rate >= 0) savingsScore = Math.max(0, Math.round((rate / 10) * 14));
  else savingsScore = 0;

  // 2. Budget Adherence (0 - 25)
  let budgetScore = 15; // default neutral if no budgets defined
  if (data.budgetedCategories.length > 0) {
    const underBudgetCount = data.budgetedCategories.filter(c => c.spent <= c.budget).length;
    const ratio = underBudgetCount / data.budgetedCategories.length;
    const avgPercentUsed =
      data.budgetedCategories.reduce((sum, c) => sum + c.percentUsed, 0) /
      data.budgetedCategories.length;

    let base = Math.round(ratio * 20);
    // Bonus for maintaining generous room across all limits
    if (avgPercentUsed <= 80 && ratio === 1) {
      base += 5;
    } else if (ratio === 1) {
      base += 3;
    }
    budgetScore = Math.min(25, Math.max(0, base));
  }

  // 3. Emergency Reserve (0 - 20)
  let emergencyScore = 0;
  const runway = data.emergencyFundRunwayMonths;
  if (runway >= 6) emergencyScore = 20;
  else if (runway >= 4) emergencyScore = 16 + Math.round(((runway - 4) / 2) * 4);
  else if (runway >= 2) emergencyScore = 10 + Math.round(((runway - 2) / 2) * 6);
  else if (runway >= 1) emergencyScore = 5 + Math.round(((runway - 1) / 1) * 5);
  else emergencyScore = Math.max(0, Math.round(runway * 5));

  // 4. Debt & Liabilities (0 - 15)
  let debtScore = 15;
  if (data.totalIOwe === 0) {
    debtScore = 15;
  } else if (data.totalIOwe <= data.totalOwedToMe) {
    debtScore = 13;
  } else {
    const netDebt = data.totalIOwe - data.totalOwedToMe;
    if (netDebt <= 2000) debtScore = 11;
    else if (netDebt <= 10000) debtScore = 8;
    else if (netDebt <= 50000) debtScore = 5;
    else debtScore = 2;
  }

  // 5. Tracking Consistency (0 - 15)
  let consistencyScore = 3;
  const streak = data.currentStreak;
  if (streak >= 30) consistencyScore = 15;
  else if (streak >= 14) consistencyScore = 13;
  else if (streak >= 7) consistencyScore = 11;
  else if (streak >= 3) consistencyScore = 8;
  else if (streak >= 1) consistencyScore = 5;

  const overallScore = Math.min(100, Math.max(0, savingsScore + budgetScore + emergencyScore + debtScore + consistencyScore));

  let grade: FinancialHealthScore['grade'] = 'Needs Attention';
  if (overallScore >= 80) grade = 'Excellent';
  else if (overallScore >= 65) grade = 'Good';
  else if (overallScore >= 50) grade = 'Fair';

  let trend: FinancialHealthScore['trend'] = 'neutral';
  if (data.previousScore !== undefined) {
    if (overallScore > data.previousScore + 1) trend = 'up';
    else if (overallScore < data.previousScore - 1) trend = 'down';
  }

  return {
    overallScore,
    savingsScore,
    budgetScore,
    emergencyScore,
    debtScore,
    consistencyScore,
    grade,
    trend,
  };
}
