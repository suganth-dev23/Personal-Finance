import React, { useState } from 'react';
import { ShieldCheck, Plus, ArrowDownLeft, ArrowUpRight, Sliders, Calendar, Shield } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatDate } from '../../utils/date';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { useStaggerChildren } from '../../hooks/useStaggerChildren';
import { EmergencyContributionModal } from './EmergencyContributionModal';
import { Button, Card, Money, Stat, Progress } from '../ui';
import { MIN_AMOUNT, MAX_AMOUNT, isValidAmount, roundMoney } from '../../utils/validation';

export const EmergencyFundView: React.FC = () => {
  const { containerRef: metricPillarsRef, getChildStyle } = useStaggerChildren(40);
  const {
    emergencyFund,
    emergencyFundRunwayMonths,
    updateEmergencySettings,
    averageMonthlyExpenses,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [targetMonths, setTargetMonths] = useState(emergencyFund.targetMonths || 6);
  const [manualTarget, setManualTarget] = useState(
    emergencyFund.manualTargetAmount ? emergencyFund.manualTargetAmount.toString() : ''
  );
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const safeTargetMonths = Math.min(12, Math.max(1, Number.isFinite(emergencyFund.targetMonths) ? emergencyFund.targetMonths : 6));
  const safeMonthlyExpenses = Number.isFinite(averageMonthlyExpenses) && averageMonthlyExpenses > 0 ? averageMonthlyExpenses : 50000;
  const computedBaselineTarget = roundMoney(safeTargetMonths * safeMonthlyExpenses);
  const effectiveTarget = Number.isFinite(emergencyFund.manualTargetAmount) && (emergencyFund.manualTargetAmount ?? 0) > 0
    ? roundMoney(emergencyFund.manualTargetAmount as number)
    : computedBaselineTarget;

  const percentFunded = effectiveTarget > 0
    ? Math.round((emergencyFund.currentSaved / effectiveTarget) * 100)
    : (emergencyFund.currentSaved > 0 ? 100 : 0);

  const surplusOrDeficit = effectiveTarget - emergencyFund.currentSaved;

  const formatRunwayMonths = (months: number, saved: number): string => {
    if (!Number.isFinite(months) || isNaN(months) || months < 0) {
      return saved > 0 ? '> 24' : '0.0';
    }
    if (months > 24) {
      return '> 24';
    }
    return months.toFixed(1);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);

    const sanitizedMonths = Math.min(12, Math.max(1, Math.round(Number(targetMonths)) || 6));
    let parsedTarget: number | undefined = undefined;

    const trimmedTarget = manualTarget.trim();
    if (trimmedTarget) {
      const num = Number(trimmedTarget);
      if (isNaN(num) || !Number.isFinite(num) || num <= 0 || !isValidAmount(num)) {
        setSettingsError(
          `Please enter a valid target amount between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT.toLocaleString('en-IN')}, or clear the field to calculate automatically based on duration.`
        );
        return;
      }
      parsedTarget = roundMoney(num);
    }

    updateEmergencySettings(sanitizedMonths, parsedTarget);
    setIsSettingsOpen(false);
  };

  const progressTone = percentFunded >= 100 ? 'positive' : percentFunded >= 50 ? 'primary' : 'warning';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Runway Meter: Mineral Card with Gold Reserve Highlight */}
      <Card variant="hero" padding="none" className="p-4 sm:p-8 rounded-2xl">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-reward-fill to-transparent opacity-80" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Progress
              type="ring"
              value={emergencyFund.currentSaved}
              max={effectiveTarget > 0 ? effectiveTarget : 1}
              tone={progressTone}
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-primary-tint text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-ink-3">
                  EMERGENCY SAFETY RESERVE
                </span>
              </div>
              <p className="text-xs text-ink-3 mb-1">
                Secured Liquid Cash Runway
              </p>
              <div className="flex items-baseline gap-3">
                <h2 className="text-3xl sm:text-4xl font-black font-numeric tracking-tight text-ink-1">
                  <AnimatedNumber value={emergencyFund.currentSaved} animateOnMount={true} />
                </h2>
                <span className={`text-sm font-semibold ${
                  percentFunded >= 100
                    ? 'text-positive'
                    : percentFunded >= 50
                    ? 'text-ink-2'
                    : 'text-negative'
                }`}>
                  {percentFunded}% funded
                </span>
              </div>
              <p className="mt-2 text-xs text-ink-3 flex items-center gap-1 flex-wrap">
                <span>Secures</span>
                <span className="font-numeric font-bold">{formatRunwayMonths(emergencyFundRunwayMonths, emergencyFund.currentSaved)}</span>
                <span>months of baseline expenses • Goal: {safeTargetMonths} months (</span>
                <Money value={effectiveTarget} size="xs" />
                <span>)</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Sliders className="w-4 h-4 text-ink-3" />}
              onClick={() => {
                setSettingsError(null);
                setTargetMonths(emergencyFund.targetMonths || 6);
                setManualTarget(emergencyFund.manualTargetAmount ? emergencyFund.manualTargetAmount.toString() : '');
                setIsSettingsOpen(!isSettingsOpen);
              }}
            >
              Adjust Target
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="h-4 w-4 stroke-[2.5]" />}
              onClick={() => setIsModalOpen(true)}
            >
              Log Contribution
            </Button>
          </div>
        </div>

        {/* Settings Panel if toggled */}
        {isSettingsOpen && (
          <Card variant="sunken" padding="none" className="mt-6 p-5 rounded-2xl">
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-3 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Customize Emergency Target
              </h4>

              {settingsError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{settingsError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Months: Slider + Quick Presets */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-ink-2">
                      Target Duration: <span className="font-bold text-ink-1 font-numeric">{targetMonths} Month{targetMonths === 1 ? '' : 's'}</span>
                    </label>
                    <span className="text-xs text-ink-3 font-medium">1 - 12 months</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={targetMonths}
                    onChange={e => {
                      setTargetMonths(Math.min(12, Math.max(1, parseInt(e.target.value, 10) || 6)));
                      setSettingsError(null);
                    }}
                    className="w-full accent-primary cursor-pointer mb-2"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[3, 6, 9, 12].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setTargetMonths(m);
                          setSettingsError(null);
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors border ${
                          targetMonths === m
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface text-ink-2 hover:bg-sunken border-line'
                        }`}
                      >
                        {m} Months
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Target Amount */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-ink-2">
                      Custom Target Amount (INR ₹)
                    </label>
                    {manualTarget && (
                      <button
                        type="button"
                        onClick={() => {
                          setManualTarget('');
                          setSettingsError(null);
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        Auto-calc
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={MIN_AMOUNT}
                    max={MAX_AMOUNT}
                    value={manualTarget}
                    onChange={e => {
                      setManualTarget(e.target.value);
                      setSettingsError(null);
                    }}
                    placeholder={`Auto: ₹${computedBaselineTarget.toLocaleString('en-IN')}`}
                    className="w-full py-2.5 px-3.5 bg-surface border border-line rounded-xl text-sm text-ink-1 font-numeric focus:outline-none focus:border-primary"
                  />
                  <p className="mt-1 text-xs text-ink-3">
                    Leave blank to calculate from baseline expenses (₹{safeMonthlyExpenses.toLocaleString('en-IN')}/mo)
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Save Settings
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Progress Track */}
        <div className="mt-6 pt-5 border-t border-line">
          <div className="flex justify-between items-center text-xs text-ink-3 mb-2 font-medium">
            <span className="font-numeric">{percentFunded}% Funded</span>
            <span>
              {surplusOrDeficit > 0 ? (
                <span className="inline-flex items-center gap-1 font-numeric">
                  <Money value={surplusOrDeficit} size="xs" />
                  <span>to reach goal</span>
                </span>
              ) : surplusOrDeficit < 0 ? (
                <span className="inline-flex items-center gap-1 font-numeric text-positive">
                  <span>Fully Funded (+</span>
                  <Money value={Math.abs(surplusOrDeficit)} size="xs" />
                  <span>surplus) 🎉</span>
                </span>
              ) : (
                '100% Fully Funded 🎉'
              )}
            </span>
          </div>
          <Progress
            value={emergencyFund.currentSaved}
            max={effectiveTarget > 0 ? effectiveTarget : 1}
            tone={progressTone}
            size="md"
          />
        </div>

        {/* 4 Metric Pillars */}
        <div ref={metricPillarsRef} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-line">
          <div style={getChildStyle(0)} className="animate-slide-up">
            <Card variant="sunken" padding="sm" className="rounded-2xl h-full">
              <Stat label="Current Saved" value={emergencyFund.currentSaved} moneyProps={{ compact: true }} />
            </Card>
          </div>
          <div style={getChildStyle(1)} className="animate-slide-up">
            <Card variant="sunken" padding="sm" className="rounded-2xl h-full">
              <Stat label="Target Fund" value={effectiveTarget} moneyProps={{ compact: true, tone: 'positive' }} />
            </Card>
          </div>
          <div style={getChildStyle(2)} className="animate-slide-up">
            <Card variant="sunken" padding="sm" className="rounded-2xl h-full">
              <Stat label="Runway Secured" value={`${formatRunwayMonths(emergencyFundRunwayMonths, emergencyFund.currentSaved)} Months`} />
            </Card>
          </div>
          <div style={getChildStyle(3)} className="animate-slide-up">
            <Card variant="sunken" padding="sm" className="rounded-2xl h-full">
              <Stat
                label="Shield Status"
                value={
                  <span className={percentFunded >= 100 ? 'text-positive' : percentFunded >= 50 ? 'text-ink-2' : 'text-negative'}>
                    {percentFunded >= 100 ? 'Fully Shielded' : percentFunded >= 50 ? 'Moderate Cushion' : 'Under Target'}
                  </span>
                }
              />
            </Card>
          </div>
        </div>
      </Card>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-ink-1 tracking-tight">
            Contribution &amp; Activity Log
          </h3>
          <p className="text-xs text-ink-3">
            Historical ledger of safety deposits and emergency withdrawals
          </p>
        </div>
        <span className="text-xs font-semibold text-ink-3">
          {emergencyFund.contributions.length} records
        </span>
      </div>

      {/* Contribution & Withdrawal History */}
      <Card variant="surface" padding="none" className="rounded-2xl p-5 sm:p-7">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-ink-1">
              Contribution & Activity Log
            </h3>
            <p className="text-xs text-ink-3 mt-0.5">
              Historical ledger of safety deposits and emergency withdrawals
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sunken text-ink-2 border border-line">
            {emergencyFund.contributions.length} records
          </span>
        </div>

        {emergencyFund.contributions.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-line rounded-2xl">
            <Shield className="w-10 h-10 text-ink-3 mx-auto mb-2" />
            <p className="text-xs text-ink-3">
              No contributions logged yet. Click "Log Contribution" to record your first reserve deposit.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {emergencyFund.contributions.map(item => {
              const isDeposit = item.type === 'deposit';

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-sunken hover:bg-line border border-line flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isDeposit
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isDeposit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-ink-1">
                        {item.note || (isDeposit ? 'Safety Reserve Deposit' : 'Emergency Withdrawal')}
                      </p>
                      <p className="text-xs text-ink-3 mt-0.5 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(item.date)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <Money
                      value={isDeposit ? item.amount : -item.amount}
                      sign="always"
                      tone={isDeposit ? 'positive' : 'negative'}
                      size="md"
                      className="font-extrabold"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <EmergencyContributionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
