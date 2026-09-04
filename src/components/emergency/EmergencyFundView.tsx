import React, { useState } from 'react';
import { ShieldCheck, Plus, ArrowDownLeft, ArrowUpRight, AlertTriangle, CheckCircle2, Sliders, Calendar, Sparkles, Shield } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatINR, formatCompactINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';
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
  const percentFunded = effectiveTarget > 0 ? Math.min(100, Math.round((emergencyFund.currentSaved / effectiveTarget) * 100)) : 0;
  const deficit = Math.max(0, effectiveTarget - emergencyFund.currentSaved);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = manualTarget ? parseFloat(manualTarget) : undefined;
    updateEmergencySettings(targetMonths, parsedTarget);
    setIsSettingsOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Runway Meter: Modern Minimalist Mineral Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#131822] text-slate-900 dark:text-white p-6 sm:p-8 border border-slate-200/90 dark:border-[#202836] shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Emergency Safety Reserve
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {emergencyFund.targetMonths} Months Goal
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-numeric">
                {formatINR(emergencyFund.currentSaved)}
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                secured liquid cash
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Secures <span className="font-numeric font-bold">{emergencyFundRunwayMonths.toFixed(1)}</span> months of baseline living expenses without selling investments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-[#171E2A] hover:bg-slate-200 dark:hover:bg-[#202836] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#202836] rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95"
            >
              <Sliders className="w-4 h-4 text-slate-400" />
              <span>Adjust Target</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all duration-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Log Contribution</span>
            </button>
          </div>
        </div>

        {/* Settings Panel if toggled */}
        {isSettingsOpen && (
          <form onSubmit={handleSaveSettings} className="mt-6 p-5 bg-slate-50 dark:bg-[#171E2A] rounded-2xl border border-slate-200/80 dark:border-[#202836] space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Customize Emergency Target
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Duration (Months of Expenses)
                </label>
                <select
                  value={targetMonths}
                  onChange={e => setTargetMonths(parseInt(e.target.value))}
                  className="w-full py-2.5 px-3.5 bg-white dark:bg-[#131822] border border-slate-200/90 dark:border-[#202836] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value={3}>3 Months (Aggressive / High Job Security)</option>
                  <option value={6}>6 Months (Standard Recommended)</option>
                  <option value={9}>9 Months (Conservative / Single Earner)</option>
                  <option value={12}>12 Months (Freelancer / Business Owner)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Custom Target Amount (INR ₹)
                </label>
                <input
                  type="number"
                  value={manualTarget}
                  onChange={e => setManualTarget(e.target.value)}
                  placeholder="e.g. 360000"
                  className="w-full py-2.5 px-3.5 bg-white dark:bg-[#131822] border border-slate-200/90 dark:border-[#202836] rounded-xl text-sm text-slate-900 dark:text-white font-numeric focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all"
              >
                Save Settings
              </button>
            </div>
          </form>
        )}

        {/* Progress Track */}
        <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-[#202836]">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
            <span className="font-numeric">{percentFunded}% Funded</span>
            <span>{deficit > 0 ? <span className="font-numeric">{formatINR(deficit)} to reach goal</span> : '100% Fully Funded 🎉'}</span>
          </div>
          <div className="h-3 w-full bg-slate-100 dark:bg-[#171E2A] rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-[#202836]">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${percentFunded}%` }}
            />
          </div>
        </div>

        {/* 4 Metric Pillars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-slate-50 dark:bg-[#171E2A] border border-slate-200/80 dark:border-[#202836] rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Saved</span>
            <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-numeric">{formatCompactINR(emergencyFund.currentSaved)}</p>
          </div>
          <div className="bg-slate-50 dark:bg-[#171E2A] border border-slate-200/80 dark:border-[#202836] rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Fund</span>
            <p className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 font-numeric">{formatCompactINR(effectiveTarget)}</p>
          </div>
          <div className="bg-slate-50 dark:bg-[#171E2A] border border-slate-200/80 dark:border-[#202836] rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Runway Secured</span>
            <p className="text-sm sm:text-base font-extrabold text-teal-600 dark:text-teal-400 mt-0.5 font-numeric">{emergencyFundRunwayMonths.toFixed(1)} Months</p>
          </div>
          <div className="bg-slate-50 dark:bg-[#171E2A] border border-slate-200/80 dark:border-[#202836] rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shield Status</span>
            <p className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {percentFunded >= 100 ? 'Fully Shielded' : percentFunded >= 50 ? 'Moderate' : 'Under Target'}
            </p>
          </div>
        </div>
      </div>

      {/* Contribution & Withdrawal History */}
      <div className="bg-white dark:bg-[#131822] rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 dark:border-[#202836]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Contribution & Activity Log
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical ledger of safety deposits and emergency withdrawals
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#171E2A] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-[#202836]">
            {emergencyFund.contributions.length} records
          </span>
        </div>

        {emergencyFund.contributions.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200/90 dark:border-[#202836] rounded-2xl">
            <Shield className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-400">
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
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-[#171E2A]/60 hover:bg-slate-100 dark:hover:bg-[#171E2A] border border-slate-100 dark:border-[#202836] flex items-center justify-between gap-4 transition-colors"
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
                      <p className="font-bold text-sm text-slate-900 dark:text-white">
                        {item.note || (isDeposit ? 'Safety Reserve Deposit' : 'Emergency Withdrawal')}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(item.date)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-base font-extrabold font-numeric ${isDeposit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
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
