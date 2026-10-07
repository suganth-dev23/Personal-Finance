import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { getTodayString, sanitizeDateString } from '../../utils/date';
import { numberToWordsINR } from '../../utils/currency';
import { Money } from '../ui';
import { useSubmitOnce } from '../../hooks/useSubmitOnce';
import { MAX_AMOUNT, MIN_AMOUNT, MIN_DATE_STRING, getMaxDateString, isValidAmount, isValidDate, roundMoney } from '../../utils/validation';

interface EmergencyContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyContributionModal: React.FC<EmergencyContributionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { emergencyFund, addEmergencyContribution } = useFinance();
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [date, setDate] = useState(getTodayString());
  const [note, setNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
      setType('deposit');
      setDate(getTodayString());
      setNote('');
      setErrorMessage(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, reset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!startSubmit()) return;

    const num = parseFloat(amount);
    if (isNaN(num) || !isValidAmount(num)) {
      setErrorMessage(`Please enter a valid amount between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT.toLocaleString('en-IN')}`);
      reset();
      return;
    }

    const sanitizedDate = sanitizeDateString(date);
    if (!sanitizedDate || !isValidDate(sanitizedDate)) {
      setErrorMessage(`Please enter a valid date between ${MIN_DATE_STRING} and ${getMaxDateString()}`);
      reset();
      return;
    }

    if (type === 'withdrawal' && num > emergencyFund.currentSaved) {
      setErrorMessage(
        `Withdrawal amount (₹${num.toLocaleString('en-IN')}) cannot exceed current emergency reserve balance (₹${emergencyFund.currentSaved.toLocaleString('en-IN')})`
      );
      reset();
      return;
    }

    addEmergencyContribution(roundMoney(num), type, note.trim() || undefined, sanitizedDate);
    setAmount('');
    setNote('');
    setErrorMessage(null);
    onClose();
  };

  const parsedAmount = parseFloat(amount) || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'deposit' ? 'Add to Emergency Fund' : 'Log Emergency Fund Withdrawal'}
      subtitle="Keep your safety reserve logs updated"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Available Reserve Balance Indicator */}
        <div className="p-3 bg-sunken rounded-xl border border-line text-xs flex items-center justify-between">
          <span className="text-ink-3">Available Reserve:</span>
          <span className="font-extrabold text-ink-1">
            <Money value={emergencyFund.currentSaved} size="xs" />
          </span>
        </div>

        {/* Type Toggle */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-1.5">
            Action Type
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-sunken rounded-xl border border-line">
            <button
              type="button"
              onClick={() => {
                setType('deposit');
                setErrorMessage(null);
              }}
              className={`py-2 px-3 rounded-xl text-sm font-bold transition-colors ${
                type === 'deposit'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-ink-2'
              }`}
            >
              Deposit / Top-up
            </button>
            <button
              type="button"
              onClick={() => {
                setType('withdrawal');
                setErrorMessage(null);
              }}
              className={`py-2 px-3 rounded-xl text-sm font-bold transition-colors ${
                type === 'withdrawal'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-ink-2'
              }`}
            >
              Emergency Withdrawal
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-1.5">
            Amount (INR ₹) *
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
              onChange={e => {
                setAmount(e.target.value);
                setErrorMessage(null);
              }}
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
            Note / Reason (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Monthly allocation, medical urgent expense, bonus transfer"
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
              isSubmitting
                ? 'bg-ink-3/40 cursor-not-allowed opacity-50'
                : 'bg-primary hover:opacity-95 shadow-sm active:scale-95'
            }`}
          >
            Save Record
          </button>
        </div>
      </form>
    </Modal>
  );
};
