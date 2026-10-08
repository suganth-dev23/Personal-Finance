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

  const currentSaved = roundMoney(emergencyFund.currentSaved || 0);

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

    const trimmedAmount = amount.trim();
    const num = Number(trimmedAmount);
    if (!trimmedAmount || isNaN(num) || !Number.isFinite(num) || num <= 0 || !isValidAmount(num)) {
      setErrorMessage(`Please enter a valid positive amount between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT.toLocaleString('en-IN')}`);
      reset();
      return;
    }

    const roundedNum = roundMoney(num);
    if (roundedNum <= 0) {
      setErrorMessage('Amount must be greater than zero.');
      reset();
      return;
    }

    const sanitizedDate = sanitizeDateString(date);
    if (!sanitizedDate || !isValidDate(sanitizedDate)) {
      setErrorMessage(`Please enter a valid date between ${MIN_DATE_STRING} and ${getMaxDateString()}`);
      reset();
      return;
    }

    if (type === 'withdrawal') {
      if (currentSaved <= 0) {
        setErrorMessage('Cannot withdraw: Emergency reserve balance is currently ₹0.00.');
        reset();
        return;
      }
      if (roundedNum > currentSaved) {
        setErrorMessage(
          `Withdrawal amount (₹${roundedNum.toLocaleString('en-IN')}) cannot exceed current emergency reserve balance (₹${currentSaved.toLocaleString('en-IN')})`
        );
        reset();
        return;
      }
    }

    const trimmedNote = note.trim();
    if (trimmedNote.length > 200) {
      setErrorMessage('Note cannot exceed 200 characters.');
      reset();
      return;
    }

    addEmergencyContribution(roundedNum, type, trimmedNote || undefined, sanitizedDate);
    setAmount('');
    setNote('');
    setErrorMessage(null);
    onClose();
  };

  const parsedAmount = Number(amount.trim());
  const isValidParsedAmount = !isNaN(parsedAmount) && Number.isFinite(parsedAmount) && parsedAmount > 0;
  const isWithdrawalDisabled = type === 'withdrawal' && currentSaved <= 0;

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

        {isWithdrawalDisabled && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>Emergency reserve balance is ₹0.00. Deposits must be made before you can withdraw.</span>
          </div>
        )}

        {/* Available Reserve Balance Indicator */}
        <div className="p-3 bg-sunken rounded-xl border border-line text-xs flex items-center justify-between">
          <span className="text-ink-3">Available Reserve:</span>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-ink-1 font-numeric">
              <Money value={currentSaved} size="xs" />
            </span>
            {type === 'withdrawal' && currentSaved > 0 && (
              <button
                type="button"
                onClick={() => {
                  setAmount(currentSaved.toString());
                  setErrorMessage(null);
                }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Max
              </button>
            )}
          </div>
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
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-ink-2 hover:text-ink-1'
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
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-ink-2 hover:text-ink-1'
              }`}
            >
              Emergency Withdrawal
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-3">
              Amount (INR ₹) *
            </label>
            {type === 'withdrawal' && currentSaved > 0 && (
              <span className="text-xs text-ink-3 font-numeric">
                Max ₹{currentSaved.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <div className="relative rounded-xl shadow-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-3 font-bold text-lg">
              ₹
            </div>
            <input
              type="number"
              step="0.01"
              min={MIN_AMOUNT}
              max={type === 'withdrawal' ? currentSaved : MAX_AMOUNT}
              inputMode="decimal"
              required
              disabled={isWithdrawalDisabled}
              value={amount}
              onChange={e => {
                setAmount(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="0.00"
              className="w-full rounded-xl border border-line bg-surface pl-8 pr-4 py-2.5 text-ink-1 font-bold text-lg font-numeric focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
          {isValidParsedAmount && (
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium italic">
              {numberToWordsINR(parsedAmount)}
            </p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-1.5">
            Date *
          </label>
          <input
            type="date"
            min={MIN_DATE_STRING}
            max={getMaxDateString()}
            required
            disabled={isWithdrawalDisabled}
            value={date}
            onChange={e => {
              setDate(e.target.value);
              setErrorMessage(null);
            }}
            className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink-1 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        {/* Note */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-3">
              Note / Reason (Optional)
            </label>
            <span className="text-xs text-ink-3 font-numeric">
              {note.length}/200
            </span>
          </div>
          <input
            type="text"
            maxLength={200}
            disabled={isWithdrawalDisabled}
            value={note}
            onChange={e => {
              setNote(e.target.value);
              setErrorMessage(null);
            }}
            placeholder="e.g. Monthly allocation, medical urgent expense, bonus transfer"
            className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink-1 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
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
            disabled={isSubmitting || isWithdrawalDisabled}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold text-on-primary transition-colors duration-150 ${
              isSubmitting || isWithdrawalDisabled
                ? 'bg-ink-3/40 cursor-not-allowed opacity-50'
                : 'bg-primary hover:opacity-95 shadow-xs active:scale-95'
            }`}
          >
            Save Record
          </button>
        </div>
      </form>
    </Modal>
  );
};
