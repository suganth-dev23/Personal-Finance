import React from 'react';
import { ShieldCheck, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';
import { useFinance } from '../../context/FinanceContext';
import { AnimatedNumber } from '../common/AnimatedNumber';

export const HealthGaugeCompact: React.FC = () => {
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

  const clampedScore = Math.min(100, Math.max(0, overallScore || 0));

  const statusColor =
    grade === 'Excellent'
      ? 'text-[#F5B742] bg-amber-500/10 border-amber-500/20'
      : grade === 'Good'
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : grade === 'Fair'
      ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
      : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';

  const pillars = [
    { label: 'Savings', score: savingsScore, max: 25, color: 'bg-emerald-500' },
    { label: 'Budget', score: budgetScore, max: 25, color: 'bg-amber-500' },
    { label: 'Reserve', score: emergencyScore, max: 20, color: 'bg-sky-500' },
    { label: 'Debt', score: debtScore, max: 15, color: 'bg-indigo-500' },
    { label: 'Streak', score: consistencyScore, max: 15, color: 'bg-[#F5B742]' },
  ];

  return (
    <button
      type="button"
      aria-label={`Financial Health Score: ${Math.round(overallScore)} out of 100, Grade ${grade}. Tap to view badges.`}
      onClick={() => setCurrentView('badges')}
      className="press w-full text-left relative overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-slate-200/90 dark:border-border-dark p-3.5 shadow-xs cursor-pointer"
    >
      {/* Gold hairline */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F5B742] to-transparent opacity-80" />

      {/* Row 1: Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-[#F5B742] border border-amber-500/20 shrink-0">
            <ShieldCheck className="w-2.5 h-2.5" /> Pulse
          </span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${statusColor}`}>
            {grade}
          </span>
        </div>
        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
          Vault ({unlockedCount ?? 0}/{(badges?.length ?? 0)})
          <ChevronRight className="w-3 h-3" />
        </span>
      </div>

      {/* Row 2: Horizontal Score Bar + Number + Trend */}
      <div className="flex items-center gap-3 mb-3">
        {/* Horizontal gradient bar matching HealthGauge gold terminus */}
        <div
          className="flex-1 h-2.5 bg-slate-100 dark:bg-inset-dark rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(overallScore)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall financial health score"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 via-emerald-500 to-[#F5B742] transition-[width] duration-700 ease-out"
            style={{ width: `${clampedScore}%` }}
          />
        </div>
        <div className="flex items-baseline gap-1 shrink-0">
          <span className="font-numeric text-xl font-black text-slate-900 dark:text-white">
            <AnimatedNumber value={overallScore} format={n => Math.round(n).toString()} />
          </span>
          <span className="text-[10px] font-bold text-slate-400 font-numeric">/100</span>
        </div>
        {/* Trend indicator */}
        <div
          className="shrink-0"
          title={`Trend: ${trend === 'up' ? 'Improving' : trend === 'down' ? 'Softening' : 'Stable'}`}
        >
          {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" aria-label="Improving" />}
          {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-rose-500 animate-pulse-danger-infinite" aria-label="Softening" />}
          {trend === 'neutral' && <Minus className="w-3.5 h-3.5 text-slate-400" aria-label="Stable" />}
        </div>
      </div>

      {/* Row 3: Compact 5-Pillar Mini-Bars */}
      <div className="space-y-1.5">
        {pillars.map(p => (
          <div key={p.label} className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 w-12 shrink-0 truncate">
              {p.label}
            </span>
            <div
              className="flex-1 h-1 bg-slate-100 dark:bg-inset-dark rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={p.score}
              aria-valuemin={0}
              aria-valuemax={p.max}
              aria-label={`${p.label} score: ${p.score} out of ${p.max}`}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-500 ease-out ${p.color}`}
                style={{ width: `${Math.max(0, Math.min(100, Math.round(((p.score ?? 0) / (p.max || 1)) * 100)))}%` }}
              />
            </div>
            <span className="text-[10px] font-numeric font-bold text-slate-600 dark:text-slate-300 w-8 text-right shrink-0">
              {p.score}/{p.max}
            </span>
          </div>
        ))}
      </div>
    </button>
  );
};
