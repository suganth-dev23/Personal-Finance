import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { RecurringPayment, RecurrenceFrequency, PaymentMethod } from '../../types/finance';
import { numberToWordsINR } from '../../utils/currency';
import { getTodayString } from '../../utils/date';

interface RecurringPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPayment?: RecurringPayment | null;
  onSave: (paymentData: Omit<RecurringPayment, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const FREQUENCIES: { label: string; value: RecurrenceFrequency }[] = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Yearly', value: 'yearly' },
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'UPI',
  'Credit Card',
  'Debit Card',
  'Net Banking',
  'Bank Transfer',
  'Cash',
  'Cheque',
  'Wallet',
  'Other',
];

export const RecurringPaymentModal: React.FC<RecurringPaymentModalProps> = ({
  isOpen,
  onClose,
  initialPayment,
  onSave,
}) => {
  const { categories } = useFinance();

  const [name, setName] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>(getTodayString());
  const [endDate, setEndDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [autoLogTransaction, setAutoLogTransaction] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (initialPayment) {
      setName(initialPayment.name);
      setAmountStr(initialPayment.amount.toString());
      setCategory(initialPayment.category);
      setFrequency(initialPayment.frequency);
      setDayOfMonth(initialPayment.dayOfMonth || 1);
      setStartDate(initialPayment.startDate);
      setEndDate(initialPayment.endDate || '');
      setPaymentMethod(initialPayment.paymentMethod || 'UPI');
      setAutoLogTransaction(initialPayment.autoLogTransaction);
      setNotes(initialPayment.notes || '');
    } else {
      setName('');
      setAmountStr('');
      setCategory(categories[0]?.name || 'Bills & Utilities');
      setFrequency('monthly');
      // Default dayOfMonth to today's day of month
      const todayDay = new Date().getDate();
      setDayOfMonth(todayDay);
      setStartDate(getTodayString());
      setEndDate('');
      setPaymentMethod('UPI');
      setAutoLogTransaction(true);
      setNotes('');
    }
  }, [initialPayment, isOpen, categories]);

  const parsedAmount = parseFloat(amountStr) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a commitment title (e.g., Netflix, Rent, SIP)');
      return;
    }
    if (parsedAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    onSave({
      name: name.trim(),
      amount: parsedAmount,
      category: category || categories[0]?.name || 'Bills & Utilities',
      frequency,
      dayOfMonth: frequency !== 'weekly' ? dayOfMonth : undefined,
      startDate,
      endDate: endDate ? endDate : undefined,
      isActive: initialPayment ? initialPayment.isActive : true,
      paymentMethod,
      autoLogTransaction,
      notes: notes.trim() ? notes.trim() : undefined,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialPayment ? 'Edit Recurring Payment' : 'New Recurring Payment'}
      subtitle="Declare a fixed recurring expense, subscription, EMI, or SIP for automatic tracking"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title / Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Commitment Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. House Rent, Netflix 4K, Zerodha Nifty SIP, JioFiber"
            className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        {/* Amount & Frequency row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Amount (INR ₹) *
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
                placeholder="e.g. 15000"
                className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] pl-8 pr-4 py-2.5 text-slate-900 dark:text-white font-bold text-lg font-numeric focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            {parsedAmount > 0 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium italic">
                {numberToWordsINR(parsedAmount)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Frequency *
            </label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value as RecurrenceFrequency)}
              className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              {FREQUENCIES.map(f => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Day of Month (if not weekly) */}
        {frequency !== 'weekly' && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Due Day of Month (1 – 31) *
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="31"
                required
                value={dayOfMonth}
                onChange={e => setDayOfMonth(Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 1)))}
                className="w-28 rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white font-numeric font-bold focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                e.g. 5th of every month
              </span>
            </div>

            {dayOfMonth >= 29 && (
              <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-700 dark:text-amber-300">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Short month protection:</strong> In months with fewer than {dayOfMonth} days (like February with 28/29 days or April/June with 30 days), this bill will automatically adjust to the last valid day of that month.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Category & Payment Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Category *
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              {categories.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              {PAYMENT_METHODS.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Start Date & End Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Start Date *
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white font-numeric focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
              placeholder="Leave empty for ongoing"
              className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white font-numeric focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              For loans, EMIs, or finite subscriptions
            </p>
          </div>
        </div>

        {/* Auto Log Transaction Toggle */}
        <div className="rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#131822] p-3.5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoLogTransaction}
              onChange={e => setAutoLogTransaction(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700"
            />
            <div className="flex-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Pre-select "Record in Transactions" when marking paid
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                When checked, marking this bill paid will default to logging an expense in your transaction history. You can still untoggle it per occurrence.
              </p>
            </div>
          </label>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Notes / Account Ref (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Consumer ID 10928374, HDFC Bank Auto-Debit, 1-year prepaid plan"
            className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none resize-none"
          />
        </div>

        {/* Actions */}
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
            className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-sm hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors"
          >
            {initialPayment ? 'Update Commitment' : 'Add Commitment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
