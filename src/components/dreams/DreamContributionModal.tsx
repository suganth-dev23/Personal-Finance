import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { DreamGoal } from '../../types/finance';
import { getTodayString, sanitizeDateString } from '../../utils/date';
import { formatINR, numberToWordsINR } from '../../utils/currency';
import { useSubmitOnce } from '../../hooks/useSubmitOnce';
import { MAX_AMOUNT, MIN_AMOUNT, MIN_DATE_STRING, getMaxDateString, isValidAmount, isValidDate, roundMoney } from '../../utils/validation';

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
  const [formError, setFormError] = useState<string | null>(null);
  const { isSubmitting, startSubmit, reset } = useSubmitOnce();
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      prevIsOpenRef.current = false;
      return;
    }
    const isOpening = isOpen && !prevIsOpenRef.current;
    if (isOpening) {
      reset();
      setAmount('');
      setDate(getTodayString());
      setNote('');
      setFormError(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, reset]);

  if (!dream) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!startSubmit()) return;

    const num = parseFloat(amount);
    if (!amount.trim() || isNaN(num) || !isValidAmount(num)) {
      setFormError(`Please enter a valid contribution amount between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT.toLocaleString('en-IN')}`);
      reset();
      return;
    }

    const validDate = sanitizeDateString(date);
    if (!validDate || !isValidDate(validDate)) {
      setFormError(`Please enter a valid date between ${MIN_DATE_STRING} and ${getMaxDateString()}`);
      reset();
      return;
    }

    addDreamContribution(dream.id, roundMoney(num), note.trim() || undefined, validDate);

    setAmount('');
    setNote('');
    setFormError(null);
    onClose();
  };

  const parsedAmount = parseFloat(amount) || 0;
  const remaining = Math.max(0, dream.targetAmount - dream.currentSaved);
  const isOverAchieving = parsedAmount > remaining && remaining > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Savings to "${dream.name}"`}
      subtitle={`Goal Target: ${formatINR(dream.targetAmount)} • Remaining: ${formatINR(remaining)}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-400">
            {formError}
          </div>
        )}

        {isOverAchieving && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
            <span>🎉 This savings amount will complete and exceed your goal target by {formatINR(parsedAmount - remaining)}!</span>
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-1.5">
            Contribution Amount (INR ₹) *
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-3 font-bold text-lg">
              ₹
            </div>
            <input
              type="number"
              step="0.01"
              min={MIN_AMOUNT}
              max={MAX_AMOUNT}
              inputMode="decimal"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-line bg-surface pl-8 pr-4 py-2.5 text-ink-1 font-bold text-lg font-numeric focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
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
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-1.5">
            Date
          </label>
          <input
            type="date"
            min={MIN_DATE_STRING}
            max={getMaxDateString()}
            required
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink-1 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-1.5">
            Note / Source (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Freelance payout, monthly goal SIP, bonus"
            className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink-1 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-2 hover:bg-sunken transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold text-on-primary transition-colors duration-150 ${
              isSubmitting ? 'bg-ink-3/40 cursor-not-allowed opacity-50' : 'bg-primary hover:opacity-95 shadow-sm active:scale-95'
            }`}
          >
            Save Contribution
          </button>
        </div>
      </form>
    </Modal>
  );
};
