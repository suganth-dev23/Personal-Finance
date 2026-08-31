import React, { useState } from 'react';
import { ShieldCheck, Plus, ArrowDownLeft, ArrowUpRight, AlertTriangle, CheckCircle2, Sliders, Calendar } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatINR, formatCompactINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { ProgressBar } from '../common/ProgressBar';
import { EmergencyContributionModal } from './EmergencyContributionModal';

export const EmergencyFundView: React.FC = () => {
  const {
    emergencyFund,
    emergencyFundRunwayMonths,
    updateEmergencySettings,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [targetMonths, setTargetMonths] = useState(emergencyFund.targetMonths || 6);
  const [manualTarget, setManualTarget] = useState(emergencyFund.manualTargetAmount ? emergencyFund.manualTargetAmount.toString() : '');

  const effectiveTarget = emergencyFund.manualTargetAmount || 360000;
  const percentFunded = effectiveTarget > 0 ? (emergencyFund.currentSaved / effectiveTarget) * 100 : 0;
  const deficit = Math.max(0, effectiveTarget - emergencyFund.currentSaved);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = manualTarget ? parseFloat(manualTarget) : undefined;
    updateEmergencySettings(targetMonths, parsedTarget);
    setIsSettingsOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Runway Meter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Emergency Safety Reserve
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {emergencyFund.targetMonths} Months Goal
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                A liquid financial buffer to protect against unforeseen medical bills, job transitions, or major household emergencies without liquidating investments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Adjust Target</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-emerald-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Log Contribution</span>
            </button>
          </div>
        </div>

        {/* Settings Panel if toggled */}
        {isSettingsOpen && (
          <form onSubmit={handleSaveSettings} className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Customize Emergency Target
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Duration (Months of Expenses)
                </label>
                <select
                  value={targetMonths}
                  onChange={e => setTargetMonths(parseInt(e.target.value))}
                  className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                >
                  <option value={3}>3 Months (Aggressive / High Job Security)</option>
                  <option value={6}>6 Months (Standard Recommended)</option>
                  <option value={9}>9 Months (Conservative / Single Earner)</option>
                  <option value={12}>12 Months (Freelancer / Business Owner)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Custom Target Amount (INR ₹)
                </label>
                <input
                  type="number"
                  value={manualTarget}
                  onChange={e => setManualTarget(e.target.value)}
                  placeholder="e.g. 360000"
                  className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                Save Settings
              </button>
            </div>
          </form>
        )}

        {/* 3 Metric Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Current Saved
            </span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {formatINR(emergencyFund.currentSaved)}
            </p>
            <span className="text-xs text-slate-400">
              Liquid savings in Bank/Sweep-in FD
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Target Goal ({emergencyFund.targetMonths} Months)
            </span>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
              {formatINR(effectiveTarget)}
            </p>
            <span className="text-xs text-slate-400">
              {deficit > 0 ? `${formatINR(deficit)} remaining to target` : 'Fully funded! 🎉'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Runway Secured
            </span>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {emergencyFundRunwayMonths.toFixed(1)} Months
            </p>
            <span className="text-xs text-slate-400">
              Based on your monthly living baseline
            </span>
          </div>
        </div>

        {/* Big visual progress */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-300">
              {percentFunded.toFixed(1)}% Completed
            </span>
            <span className={percentFunded >= 100 ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
              {percentFunded >= 100 ? 'Target Reached 🛡️' : `${formatINR(deficit)} to complete`}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-700"
              style={{ width: `${Math.min(percentFunded, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Contribution & Withdrawal History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Contribution & Activity Log
            </h3>
            <p className="text-xs text-slate-400">
              Historical ledger of deposits and emergency withdrawals
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {emergencyFund.contributions.length} entries
          </span>
        </div>

        {emergencyFund.contributions.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">
            No contributions logged yet. Click "Log Contribution" to record your first deposit.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {emergencyFund.contributions.map(item => {
              const isDeposit = item.type === 'deposit';

              return (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isDeposit
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-rose-500/10 text-rose-600'
                      }`}
                    >
                      {isDeposit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">
                        {item.note || (isDeposit ? 'Emergency Deposit' : 'Emergency Withdrawal')}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(item.date)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-bold text-sm">
                    <span className={isDeposit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}>
                      {isDeposit ? '+' : '-'}{formatINR(item.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <EmergencyContributionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
