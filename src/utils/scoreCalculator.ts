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
 *
 * Fully protected against division by zero, NaN/Infinity inputs, and negative values.
 */
export function calculateFinancialHealthScore(data: ScoreInputData): FinancialHealthScore {
  // 1. Savings Rate (0 - 25)
  let savingsScore = 0;
  const rate = Number.isFinite(data?.monthlySavingsRate) ? data.monthlySavingsRate : 0;
  if (rate >= 30) savingsScore = 25;
  else if (rate >= 20) savingsScore = 20 + Math.round(((rate - 20) / 10) * 5);
  else if (rate >= 10) savingsScore = 14 + Math.round(((rate - 10) / 10) * 6);
  else if (rate >= 0) savingsScore = Math.max(0, Math.round((rate / 10) * 14));
  else savingsScore = 0;
  savingsScore = Math.min(25, Math.max(0, Number.isFinite(savingsScore) ? savingsScore : 0));

  // 2. Budget Adherence (0 - 25)
  let budgetScore = 15; // default neutral if no budgets defined
  if (Array.isArray(data?.budgetedCategories) && data.budgetedCategories.length > 0) {
    const validCategories = data.budgetedCategories.filter(
      c => c && Number.isFinite(c.spent) && Number.isFinite(c.budget) && c.budget > 0
    );
    if (validCategories.length > 0) {
      const underBudgetCount = validCategories.filter(c => c.spent <= c.budget).length;
      const ratio = underBudgetCount / validCategories.length;
      const avgPercentUsed =
        validCategories.reduce((sum, c) => {
          const pct = Number.isFinite(c.percentUsed) ? c.percentUsed : (c.spent / c.budget) * 100;
          return sum + (Number.isFinite(pct) ? pct : 0);
        }, 0) / validCategories.length;

      let base = Math.round(ratio * 20);
      // Bonus for maintaining generous room across all limits
      if (avgPercentUsed <= 80 && ratio === 1) {
        base += 5;
      } else if (ratio === 1) {
        base += 3;
      }
      budgetScore = Math.min(25, Math.max(0, Number.isFinite(base) ? base : 0));
    }
  }

  // 3. Emergency Reserve (0 - 20)
  let emergencyScore = 0;
  const runway = Number.isFinite(data?.emergencyFundRunwayMonths) ? Math.max(0, data.emergencyFundRunwayMonths) : 0;
  if (runway >= 6) emergencyScore = 20;
  else if (runway >= 4) emergencyScore = 16 + Math.round(((runway - 4) / 2) * 4);
  else if (runway >= 2) emergencyScore = 10 + Math.round(((runway - 2) / 2) * 6);
  else if (runway >= 1) emergencyScore = 5 + Math.round(((runway - 1) / 1) * 5);
  else emergencyScore = Math.max(0, Math.round(runway * 5));
  emergencyScore = Math.min(20, Math.max(0, Number.isFinite(emergencyScore) ? emergencyScore : 0));

  // 4. Debt & Liabilities (0 - 15)
  let debtScore = 15;
  const totalIOwe = Number.isFinite(data?.totalIOwe) ? Math.max(0, data.totalIOwe) : 0;
  const totalOwedToMe = Number.isFinite(data?.totalOwedToMe) ? Math.max(0, data.totalOwedToMe) : 0;
  if (totalIOwe === 0) {
    debtScore = 15;
  } else if (totalIOwe <= totalOwedToMe) {
    debtScore = 13;
  } else {
    const netDebt = totalIOwe - totalOwedToMe;
    if (netDebt <= 2000) debtScore = 11;
    else if (netDebt <= 10000) debtScore = 8;
    else if (netDebt <= 50000) debtScore = 5;
    else debtScore = 2;
  }
  debtScore = Math.min(15, Math.max(0, Number.isFinite(debtScore) ? debtScore : 0));

  // 5. Tracking Consistency (0 - 15)
  let consistencyScore = 3;
  const streak = Number.isFinite(data?.currentStreak) ? Math.max(0, data.currentStreak) : 0;
  if (streak >= 30) consistencyScore = 15;
  else if (streak >= 14) consistencyScore = 13;
  else if (streak >= 7) consistencyScore = 11;
  else if (streak >= 3) consistencyScore = 8;
  else if (streak >= 1) consistencyScore = 5;
  consistencyScore = Math.min(15, Math.max(0, Number.isFinite(consistencyScore) ? consistencyScore : 0));

  const rawOverall = savingsScore + budgetScore + emergencyScore + debtScore + consistencyScore;
  const overallScore = Math.min(100, Math.max(0, Number.isFinite(rawOverall) ? rawOverall : 0));

  let grade: FinancialHealthScore['grade'] = 'Needs Attention';
  if (overallScore >= 80) grade = 'Excellent';
  else if (overallScore >= 65) grade = 'Good';
  else if (overallScore >= 50) grade = 'Fair';

  let trend: FinancialHealthScore['trend'] = 'neutral';
  if (data?.previousScore !== undefined && Number.isFinite(data.previousScore)) {
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
