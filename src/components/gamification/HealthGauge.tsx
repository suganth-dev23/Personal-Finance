import React from 'react';
import { ShieldCheck, TrendingUp, TrendingDown, Minus, ArrowRight, Award, HelpCircle } from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';
import { useFinance } from '../../context/FinanceContext';
import { AnimatedNumber } from '../common/AnimatedNumber';

export const HealthGauge: React.FC = () => {
  const { healthScore, unlockedCount, badges } = useGamification();
  const { setCurrentView } = useFinance();

  const {
    overallScore,
    grade,
    savingsScore,
    budgetScore,
    emergencyScore,
    debtScore,
    consistencyScore,
    trend,
  } = healthScore;

  // Arc math: Radius = 85, Center = (120, 120)
  // Half-circle arc length = PI * 85 ~= 267.04
  const ARC_LENGTH = 267.04;
  const clampedScore = Math.min(100, Math.max(0, overallScore));
  const strokeOffset = ARC_LENGTH - (ARC_LENGTH * clampedScore) / 100;

  const statusColor =
    grade === 'Excellent'
      ? 'text-[#F5B742] bg-amber-500/10 border-amber-500/20'
      : grade === 'Good'
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : grade === 'Fair'
      ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
      : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';

  const statusLabel =
    grade === 'Excellent'
      ? 'Prime Financial Health'
      : grade === 'Good'
      ? 'Strong Financial Health'
      : grade === 'Fair'
      ? 'Moderate Cushion'
      : 'Requires Attention';

  // 5 Health Pillars configuration
  const pillars = [
    {
      label: 'Savings Rate',
      score: savingsScore,
      max: 25,
      unit: '% monthly saved',
      color: 'bg-emerald-500',
    },
    {
      label: 'Budget Adherence',
      score: budgetScore,
      max: 25,
      unit: 'category discipline',
      color: 'bg-amber-500',
    },
    {
      label: 'Emergency Reserve',
      score: emergencyScore,
      max: 20,
      unit: 'months liquid buffer',
      color: 'bg-sky-500',
    },
    {
      label: 'Debt & Liabilities',
      score: debtScore,
      max: 15,
      unit: 'net peer IOUs',
      color: 'bg-indigo-500',
    },
    {
      label: 'Logging Consistency',
      score: consistencyScore,
      max: 15,
      unit: 'daily active streak',
      color: 'bg-[#F5B742]',
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#131822] border border-slate-200/90 dark:border-[#202836] p-6 sm:p-7 shadow-xs">
      {/* Top hairline */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F5B742] to-transparent opacity-80" />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-[#F5B742] border border-amber-500/20">
              <ShieldCheck className="w-3 h-3" /> Financial Pulse
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${statusColor}`}>
              Grade {grade}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Financial Health Index
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time deterministic score calculated across 5 fiscal pillars
          </p>
        </div>

        <button
          onClick={() => setCurrentView('badges')}
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#C28834] dark:text-[#F5B742] hover:underline"
        >
          <span>Vault ({unlockedCount}/{badges.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Gauge and Center Visual */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-56 h-36 flex items-center justify-center">
            <svg viewBox="0 0 240 140" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="healthGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F43F5E" />
                  <stop offset="35%" stopColor="#F59E0B" />
                  <stop offset="70%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#F5B742" />
                </linearGradient>
              </defs>

              {/* Background Track Arc */}
              <path
                d="M 35 120 A 85 85 0 0 1 205 120"
                fill="none"
                stroke="currentColor"
                strokeWidth="14"
                strokeLinecap="round"
                className="text-slate-100 dark:text-[#171E2A]"
              />

              {/* Active Metric Gradient Arc */}
              <path
                d="M 35 120 A 85 85 0 0 1 205 120"
                fill="none"
                stroke="url(#healthGaugeGrad)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={ARC_LENGTH}
                strokeDashoffset={strokeOffset}
                style={{
                  transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />

              {/* Glowing Endpoint Indicator Bead on the Arc Track */}
              {(() => {
                const scoreFraction = clampedScore / 100;
                const rad = Math.PI * (1 - scoreFraction);
                const indX = 120 + 85 * Math.cos(rad);
                const indY = 120 - 85 * Math.sin(rad);
                return (
                  <g className="transition-all duration-1000 ease-out">
                    <circle
                      cx={indX}
                      cy={indY}
                      r="8"
                      className="fill-white dark:fill-[#131822] stroke-[#F5B742]"
                      strokeWidth="2.5"
                    />
                    <circle
                      cx={indX}
                      cy={indY}
                      r="3.5"
                      className="fill-[#F5B742]"
                    />
                  </g>
                );
              })()}
            </svg>

            {/* Score Number Cleanly Centered Inside Arc Cavity */}
            <div className="absolute inset-x-0 bottom-2 flex flex-col items-center justify-center pointer-events-none">
              <div className="flex items-baseline gap-1">
                <span className={`font-numeric text-3xl sm:text-4xl font-black ${
                  grade === 'Needs Attention'
                    ? 'text-rose-600 dark:text-rose-400'
                    : grade === 'Fair'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-900 dark:text-white'
                }`}>
                  <AnimatedNumber
                    value={overallScore}
                    format={n => Math.round(n).toString()}
                  />
                </span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-numeric">/100</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {statusLabel}
            </span>
            <div className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {trend === 'up' ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> Improving
                </span>
              ) : trend === 'down' ? (
                <span className="text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md flex items-center font-bold animate-pulse-danger">
                  <TrendingDown className="w-3 h-3 mr-0.5" /> Softening
                </span>
              ) : (
                <span className="flex items-center">
                  <Minus className="w-3 h-3 mr-0.5" /> Stable
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: 5 Pillar breakdown */}
        <div className="lg:col-span-7 space-y-2.5">
          {pillars.map(pillar => {
            const pct = Math.min(100, Math.round((pillar.score / pillar.max) * 100));
            return (
              <div key={pillar.label} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {pillar.label}
                  </span>
                  <div className="flex items-center gap-1.5 font-numeric">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {pillar.score}
                    </span>
                    <span className="text-slate-400">/ {pillar.max}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({pct}%)
                    </span>
                  </div>
                </div>

                <div className="h-1.5 w-full bg-slate-100 dark:bg-[#171E2A] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${pillar.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer link to Badges & Dynamic Advice */}
      {(() => {
        const isDeclining = trend === 'down' || grade === 'Needs Attention';
        const adviceTip =
          budgetScore < 15
            ? 'Alert: Spending exceeding category limits is weighing down your score. Review your active budget caps.'
            : savingsScore < 12
            ? 'Tip: Monthly savings rate is under pressure. Lowering discretionary spend will boost your score.'
            : debtScore < 10
            ? 'Tip: Outstanding peer split balances are pending. Settle balances to recover points.'
            : consistencyScore < 8
            ? 'Tip: Daily logging momentum slowed down. Record today’s activity to restore consistency.'
            : 'Score softening this week — review recent expenses and budget caps to return to prime grade.';

        return (
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#202836] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              {isDeclining ? (
                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                  <TrendingDown className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{adviceTip}</span>
                </span>
              ) : (
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Award className="w-4 h-4 shrink-0 text-[#F5B742]" />
                  <span>Keep your savings rate above 20% &amp; maintain category budgets to reach Level 90+ score.</span>
                </span>
              )}
            </div>

            <button
              onClick={() => setCurrentView('badges')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#171E2A] hover:bg-slate-200 dark:hover:bg-[#202836] text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors self-start sm:self-auto shrink-0"
            >
              <span>Achievement Vault</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })()}
    </div>
  );
};
