import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { DreamGoal } from '../../types/finance';
import { getTodayString } from '../../utils/date';
import { formatINR, numberToWordsINR } from '../../utils/currency';

interface DreamContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dream: DreamGoal | null;
}

export const DreamContributionModal: React.FC<DreamContributionModalProps> = ({
  isOpen,
  onClose,
  dream,
}) => {
  const { addDreamContribution } = useFinance();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [note, setNote] = useState('');

  if (!dream) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid contribution amount');
      return;
    }

    addDreamContribution(dream.id, num, note.trim() || undefined, date);

    // If goal completed or near completion, shoot celebratory confetti!
    if (dream.currentSaved + num >= dream.targetAmount) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }

    setAmount('');
    setNote('');
    onClose();
  };

  const parsedAmount = parseFloat(amount) || 0;
  const remaining = Math.max(0, dream.targetAmount - dream.currentSaved);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Savings to "${dream.name}"`}
      subtitle={`Goal Target: ${formatINR(dream.targetAmount)} • Remaining: ${formatINR(remaining)}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Contribution Amount (INR ₹) *
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-bold text-lg">
              ₹
            </div>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] pl-8 pr-4 py-2.5 text-slate-900 dark:text-white font-bold text-lg font-numeric focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          {parsedAmount > 0 && (
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium italic">
              {numberToWordsINR(parsedAmount)}
            </p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Date
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Note / Source (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Freelance payout, monthly goal SIP, bonus"
            className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#202836]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#171E2A] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-sm transition-all duration-150 active:scale-95"
          >
            Save Contribution
          </button>
        </div>
      </form>
    </Modal>
  );
};
