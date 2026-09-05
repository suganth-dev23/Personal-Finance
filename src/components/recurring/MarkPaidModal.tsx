import React, { useState, useEffect } from 'react';
import { CheckCircle2, Receipt } from 'lucide-react';
import { Modal } from '../common/Modal';
import { RecurringPayment } from '../../types/finance';
import { formatINR, numberToWordsINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';

interface MarkPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: RecurringPayment | null;
  targetDueDate: string;
  onConfirm: (
    paymentId: string,
    dueDate: string,
    actualAmount: number,
    createTransaction: boolean
  ) => void;
}

export const MarkPaidModal: React.FC<MarkPaidModalProps> = ({
  isOpen,
  onClose,
  payment,
  targetDueDate,
  onConfirm,
}) => {
  const [amountStr, setAmountStr] = useState<string>('');
  const [recordInLedger, setRecordInLedger] = useState<boolean>(true);

  useEffect(() => {
    if (payment) {
      setAmountStr(payment.amount.toString());
      // Default to the template's autoLogTransaction preference for this occurrence
      setRecordInLedger(Boolean(payment.autoLogTransaction));
    }
  }, [payment, targetDueDate, isOpen]);

  if (!payment) return null;

  const parsedAmount = parseFloat(amountStr) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    onConfirm(payment.id, targetDueDate, parsedAmount, recordInLedger);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Payment as Paid"
      subtitle={`Record payment for ${payment.name} — Due ${formatDate(targetDueDate)}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Commitment Summary Card */}
        <div className="rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#131822] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {payment.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {payment.category} • {payment.frequency.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 dark:text-slate-500">Scheduled</span>
              <p className="text-sm font-bold font-numeric text-slate-700 dark:text-slate-300">
                {formatINR(payment.amount)}
              </p>
            </div>
          </div>
        </div>

        {/* Due Date Indicator */}
        <div className="flex items-center justify-between rounded-xl bg-slate-100 dark:bg-[#171E2A] px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-200/90 dark:border-[#202836]">
          <span className="font-medium">Cycle Due Date</span>
          <span className="font-bold text-slate-900 dark:text-white font-numeric">
            {formatDate(targetDueDate)}
          </span>
        </div>

        {/* Actual Amount Paid (editable for variable bills like BESCOM / gas) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Actual Paid Amount (INR ₹) *
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-bold text-lg">
              ₹
            </div>
            <input
              type="number"
              step="any"
              required
              value={amountStr}
              onChange={e => setAmountStr(e.target.value)}
              placeholder="e.g. 2500"
              className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] pl-8 pr-4 py-2.5 text-slate-900 dark:text-white font-bold text-lg font-numeric focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          {parsedAmount > 0 && (
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium italic">
              {numberToWordsINR(parsedAmount)}
            </p>
          )}
        </div>

        {/* Transaction Ledger Record Toggle */}
        <div className="rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] p-3.5 transition-colors">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={recordInLedger}
              onChange={e => setRecordInLedger(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700"
            />
            <div className="flex-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                Record as Debit in Transactions ledger
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically logs a ₹{parsedAmount.toLocaleString('en-IN')} expense in your ledger dated today under{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">{payment.category}</span>.
                Toggling this only affects this single occurrence.
              </p>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/90 dark:border-[#202836]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200/90 dark:border-[#202836] px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1c2433] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Confirm Payment</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
