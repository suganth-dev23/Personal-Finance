import React, { useState, useMemo } from 'react';
import { Plus, Edit3, Trash2, AlertCircle, CheckCircle, PieChart, ShieldAlert } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Budget } from '../../types/finance';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { EmptyState } from '../common/EmptyState';
import { IconRenderer } from '../common/IconRenderer';
import { BudgetModal } from './BudgetModal';
import { useStaggerChildren } from '../../hooks/useStaggerChildren';
import { Button, Card, Money, Stat, Progress } from '../ui';

export const BudgetsView: React.FC = () => {
  const { containerRef: budgetGridRef, getChildStyle } = useStaggerChildren(60);
  const {
    budgets,
    categories,
    categorySpendingThisMonth,
    deleteBudget,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const totalBudgeted = useMemo(() => {
    return budgets.reduce((acc, b) => acc + (Number.isFinite(b.monthlyLimit) && b.monthlyLimit > 0 ? b.monthlyLimit : 0), 0);
  }, [budgets]);

  const totalSpentInBudgeted = useMemo(() => {
    if (budgets.length === 0) return 0;
    const budgetNames = new Set(budgets.map(b => b.category.trim().toLowerCase()));
    return categorySpendingThisMonth
      .filter(c => budgetNames.has(c.category.trim().toLowerCase()))
      .reduce((acc, c) => acc + (Number.isFinite(c.spent) && c.spent > 0 ? c.spent : 0), 0);
  }, [budgets, categorySpendingThisMonth]);

  const remainingBudget = totalBudgeted - totalSpentInBudgeted;
  const overallPercent = totalBudgeted > 0 ? Math.min(100, Math.round((totalSpentInBudgeted / totalBudgeted) * 100)) : 0;
  const isOverTotal = totalBudgeted > 0 && remainingBudget < 0;

  // Spending velocity and pacing calculations with strict Day 1 division-by-zero protection, month rollover, and leap years
  const now = new Date();
  const currentDay = now.getDate();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  // Day 0 of next month accurately gives the total days in current month (28/29 for Feb leap years, 30, or 31)
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  // Guard daysPassed strictly between 1 and totalDays
  const daysPassed = Math.min(totalDays, Math.max(1, currentDay));
  const projectedTotalSpend = daysPassed > 0
    ? Math.round((totalSpentInBudgeted / daysPassed) * totalDays)
    : 0;
  const isPacingFast = !isOverTotal && totalBudgeted > 0 && projectedTotalSpend > totalBudgeted && daysPassed >= 3;

  const categoryMap = useMemo(() => {
    return new Map(categories.map(c => [c.name.trim().toLowerCase(), c]));
  }, [categories]);

  const spendingMap = useMemo(() => {
    return new Map(categorySpendingThisMonth.map(c => [c.category.trim().toLowerCase(), c.spent]));
  }, [categorySpendingThisMonth]);

  const handleEdit = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedBudget(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Hero Overview: Mineral Card with Gold Budget Highlight */}
      <Card variant="hero" padding="none" className="rounded-2xl p-4 sm:p-8">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-reward-fill to-transparent opacity-80" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-primary-tint text-primary">
                <PieChart className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-3">
                MONTHLY BUDGET STATUS
              </span>
            </div>
            <p className="text-xs text-ink-3 mb-1">
              Remaining Spend Allocation
            </p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-black font-numeric tracking-tight text-ink-1">
                <AnimatedNumber value={Math.abs(remainingBudget)} animateOnMount={true} />
              </h2>
              <span
                className={`text-sm font-semibold ${
                  totalBudgeted === 0
                    ? 'text-ink-3'
                    : isOverTotal
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {totalBudgeted === 0 ? 'no limits set' : isOverTotal ? 'over budget' : 'remaining'}
              </span>
            </div>
            <p className="mt-2 text-xs text-ink-3">
              <span className="font-numeric font-semibold">{overallPercent}%</span> used of <Money value={totalBudgeted} size="xs" /> monthly limit • <span className="font-numeric font-semibold">{budgets.length}</span> active category limits
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleOpenAdd}
              leftIcon={<Plus className="h-4 w-4 stroke-[2.5]" />}
            >
              Set New Budget
            </Button>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="mt-6 pt-5 border-t border-line">
          <div className="flex justify-between items-center text-xs text-ink-3 mb-2 font-medium">
            <span className="font-numeric">Spent: <Money value={totalSpentInBudgeted} size="xs" /></span>
            <span className="font-numeric">Limit: <Money value={totalBudgeted} size="xs" /></span>
          </div>
          <Progress
            value={totalSpentInBudgeted}
            max={totalBudgeted > 0 ? totalBudgeted : 1}
            tone="auto"
            size="md"
          />
        </div>

        {/* 4-column summary strip */}
        <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-line">
          <Card variant="sunken" padding="sm" className="rounded-xl sm:rounded-2xl">
            <Stat
              label="Total Allowed"
              value={<Money value={totalBudgeted} compact size="lg" />}
            />
          </Card>
          <Card variant="sunken" padding="sm" className="rounded-xl sm:rounded-2xl">
            <Stat
              label="Actual Spent"
              value={<Money value={totalSpentInBudgeted} compact size="lg" />}
            />
          </Card>
          <Card variant="sunken" padding="sm" className="rounded-xl sm:rounded-2xl">
            <Stat
              label="Active Caps"
              value={<span>{budgets.length}</span>}
            />
          </Card>
          <Card variant="sunken" padding="sm" className="rounded-xl sm:rounded-2xl">
            <Stat
              label="Velocity Status"
              value={
                <span className={`text-sm sm:text-lg font-bold font-numeric ${
                  budgets.length === 0 || totalBudgeted === 0
                    ? 'text-ink-3'
                    : isOverTotal
                    ? 'text-rose-600 dark:text-rose-400'
                    : isPacingFast
                    ? 'text-ink-1'
                    : overallPercent >= 85
                    ? 'text-ink-1'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {budgets.length === 0 || totalBudgeted === 0
                    ? 'No Limits Set'
                    : isOverTotal
                    ? 'Over Budget'
                    : isPacingFast
                    ? 'Pacing Over'
                    : overallPercent >= 85
                    ? 'Near Ceiling'
                    : 'Safe Velocity'}
                </span>
              }
              sub={
                <span className="text-xs text-ink-3">
                  Day {currentDay}/{totalDays} • Proj: {totalBudgeted > 0 ? <Money value={projectedTotalSpend} size="xs" /> : '₹0'}
                </span>
              }
            />
          </Card>
        </div>
      </Card>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-ink-1 tracking-tight">
            Category Spending Limits
          </h3>
          <p className="text-xs text-ink-3">
            Active monthly expenditure caps, pacing status, and overrun protection
          </p>
        </div>
        <span className="text-xs font-semibold text-ink-3">
          {budgets.length} categories
        </span>
      </div>

      {/* Categories Budgets Grid */}
      {budgets.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="No category budgets defined"
          description="Set spending caps for categories like Dining, Groceries, Shopping or Fuel to stay in total control."
          actionLabel="Create Your First Budget"
          onAction={handleOpenAdd}
        />
      ) : (
        <div ref={budgetGridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b, idx) => {
            const trimmedCat = b.category.trim().toLowerCase();
            const catInfo = categoryMap.get(trimmedCat);
            const spent = spendingMap.get(trimmedCat) || 0;
            const monthlyLimit = Number.isFinite(b.monthlyLimit) && b.monthlyLimit > 0 ? b.monthlyLimit : 0;
            const remaining = monthlyLimit - spent;
            const percentUsed = monthlyLimit > 0 ? (spent / monthlyLimit) * 100 : 0;
            const isOver = monthlyLimit > 0 && spent > monthlyLimit;
            const isNear = !isOver && percentUsed >= 80;
            const catProjectedSpend = daysPassed > 0 ? Math.round((spent / daysPassed) * totalDays) : 0;
            const isCategoryPacingFast = !isOver && monthlyLimit > 0 && catProjectedSpend > monthlyLimit && daysPassed >= 3;

            return (
              <div
                key={b.id}
                style={getChildStyle(idx)}
                className="animate-slide-up"
              >
                <Card
                  variant="surface"
                  padding="none"
                  className={`group lift rounded-2xl p-4 sm:p-5 transition-[transform,box-shadow,border-color] duration-200 ${
                    isOver
                      ? 'border-rose-400 dark:border-rose-600/70 ring-2 ring-rose-500/30 animate-shake-then-flash'
                      : isNear
                      ? 'border-warning/30 dark:border-warning/30'
                      : 'border-line hover:border-emerald-500/40 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105"
                        style={{
                          backgroundColor: `${catInfo?.color || '#10b981'}20`,
                          color: catInfo?.color || '#10b981',
                        }}
                      >
                        <IconRenderer name={catInfo?.icon || 'Tag'} className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-ink-1">
                          {b.category}
                        </h3>
                        <p className="text-xs text-ink-3 font-medium">
                          Limit: <Money value={monthlyLimit} size="xs" className="font-bold text-ink-2" />
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(b)}
                        className="press flex h-8 w-8 items-center justify-center rounded-xl border border-line text-ink-3 hover:bg-sunken hover:text-ink-1 transition-colors"
                        title="Edit Limit"
                        aria-label={`Edit ${b.category} budget`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to remove the budget for ${b.category}?`)) {
                            deleteBudget(b.id);
                          }
                        }}
                        className="press flex h-8 w-8 items-center justify-center rounded-xl border border-line text-ink-3 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Budget"
                        aria-label={`Delete ${b.category} budget`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress & Numbers */}
                  <div className="mt-5 space-y-2.5">
                    <div className="flex justify-between items-baseline text-xs">
                      <div>
                        <span className="text-ink-3 font-medium">Spent: </span>
                        <Money value={spent} size="xs" className="font-extrabold text-ink-1" />
                      </div>
                      <div>
                        <span className="text-ink-3 font-medium">{remaining >= 0 ? 'Remaining: ' : 'Over: '}</span>
                        <Money
                          value={Math.abs(remaining)}
                          size="xs"
                          tone={remaining >= 0 ? 'positive' : 'negative'}
                          className="font-extrabold"
                        />
                      </div>
                    </div>

                    <Progress
                      value={spent}
                      max={monthlyLimit > 0 ? monthlyLimit : 1}
                      tone="auto"
                      size="sm"
                    />

                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="font-semibold text-ink-3 font-numeric">{percentUsed.toFixed(0)}% utilized</span>
                      {isOver ? (
                        <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 font-numeric">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Exceeded by <Money value={spent - monthlyLimit} size="xs" className="text-inherit" />
                        </span>
                      ) : isNear ? (
                        <span className="font-bold text-ink-2 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Near limit
                        </span>
                      ) : isCategoryPacingFast ? (
                        <span className="font-semibold text-ink-2 flex items-center gap-1 font-numeric" title={`Projected: ₹${catProjectedSpend} by month-end`}>
                          <AlertCircle className="w-3.5 h-3.5" />
                          Pacing high
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          On track
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBudget(null);
        }}
        initialBudget={selectedBudget}
      />
    </div>
  );
};
