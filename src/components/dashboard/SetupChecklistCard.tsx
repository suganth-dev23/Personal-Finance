import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  X,
  ChevronRight,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Card, Button } from '../ui';

interface SetupChecklistCardProps {
  onOpenAddTx?: () => void;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  action: () => void;
  actionLabel: string;
}

export const SetupChecklistCard: React.FC<SetupChecklistCardProps> = ({ onOpenAddTx }) => {
  const {
    transactions,
    budgets,
    emergencyFund,
    dreams,
    investments: _investments,
    setCurrentView,
  } = useFinance();

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('dhanveda_setup_checklist_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleReset = () => {
      setIsDismissed(false);
    };

    window.addEventListener('dhanveda-checklist-reset', handleReset);
    return () => {
      window.removeEventListener('dhanveda-checklist-reset', handleReset);
    };
  }, []);

  const items: ChecklistItem[] = useMemo(() => [
    {
      id: 'transaction',
      title: 'Log your first transaction',
      description: 'Track income, expense, or transfers to activate cash flow charts.',
      isCompleted: transactions.length > 0,
      action: () => {
        if (onOpenAddTx) {
          onOpenAddTx();
        } else {
          setCurrentView('transactions');
        }
      },
      actionLabel: 'Log Transaction',
    },
    {
      id: 'budget',
      title: 'Set a category budget',
      description: 'Establish spending limits to keep monthly discretionary expenses under control.',
      isCompleted: budgets.length > 0,
      action: () => setCurrentView('budgets'),
      actionLabel: 'Set Budget',
    },
    {
      id: 'emergency',
      title: 'Set emergency fund target',
      description: 'Calibrate your 3–6 month reserve runway baseline for peace of mind.',
      isCompleted: (((emergencyFund as any)?.targetAmount ?? emergencyFund?.manualTargetAmount ?? 0) > 0) || (emergencyFund?.targetMonths ?? 0) > 0,
      action: () => setCurrentView('emergency'),
      actionLabel: 'Configure Target',
    },
    {
      id: 'dream',
      title: 'Create a milestone dream',
      description: 'Define an aspirational financial goal to unlock target-date tracking.',
      isCompleted: dreams.length > 0,
      action: () => setCurrentView('dreams'),
      actionLabel: 'Create Dream',
    },
  ], [transactions.length, budgets.length, emergencyFund, dreams.length, onOpenAddTx, setCurrentView]);

  const completedCount = useMemo(() => items.filter(i => i.isCompleted).length, [items]);
  const totalCount = items.length;
  const percent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allCompleted = completedCount === totalCount;

  const handleDismiss = () => {
    try {
      localStorage.setItem('dhanveda_setup_checklist_dismissed', 'true');
    } catch {}
    setIsDismissed(true);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <Card
      variant="surface"
      padding="none"
      className="relative overflow-hidden rounded-2xl border-line p-5 sm:p-6 shadow-sm"
    >
      {/* Top accent gold hairline */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-reward-fill to-transparent opacity-80" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-tint text-primary text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Setup Checklist</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-ink-1 tracking-tight">
            {allCompleted ? 'Setup Complete!' : 'Get Started with DhanVeda'}
          </h3>
          <p className="text-xs text-ink-3">
            {allCompleted
              ? 'All foundational setup milestones are complete. Your financial compass is calibrated!'
              : `${completedCount} of ${totalCount} foundations configured (${Math.round(percent)}%)`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1.5 rounded-xl text-ink-3 hover:text-ink-1 hover:bg-sunken transition-colors press"
          aria-label="Dismiss setup checklist"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-sunken rounded-full h-2 overflow-hidden border border-line mb-5">
        <div
          role="progressbar"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Setup checklist completion"
          className="h-full bg-gradient-to-r from-emerald-500 to-reward-fill transition-[width] duration-500 rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Items list or Celebratory state */}
      {allCompleted ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-ink-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink-1">Ready for Daily Financial Clarity</p>
              <p className="text-xs text-ink-3">You can dismiss this card or revisit views anytime via the sidebar.</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDismiss}
            className="self-end sm:self-auto shrink-0"
          >
            Dismiss Checklist
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border transition-colors ${
                item.isCompleted
                  ? 'bg-sunken/60 border-line opacity-80'
                  : 'bg-surface border-line hover:border-line-input'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="mt-0.5 shrink-0">
                  {item.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-ink-3" />
                  )}
                </span>
                <div className="min-w-0">
                  <h4
                    className={`text-xs font-bold truncate ${
                      item.isCompleted ? 'text-ink-3 line-through' : 'text-ink-1'
                    }`}
                  >
                    {item.title}
                  </h4>
                  <p className="text-xs text-ink-3 mt-0.5 leading-snug line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              {!item.isCompleted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={item.action}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5 text-ink-3" />}
                  className="shrink-0 text-xs text-primary hover:text-primary-hover font-semibold px-2 py-1 h-auto"
                >
                  {item.actionLabel}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
