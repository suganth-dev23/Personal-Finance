import React, { useState, useEffect } from 'react';
import { CheckCircle2, Receipt } from 'lucide-react';
import { Modal } from '../common/Modal';
import { RecurringPayment } from '../../types/finance';
import { numberToWordsINR } from '../../utils/currency';
import { Money } from '../ui';
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
 <div className="rounded-xl border border-line bg-sunken p-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
 <Receipt className="h-5 w-5" />
 </div>
 <div>
 <h4 className="text-sm font-bold text-ink-1 leading-tight">
 {payment.name}
 </h4>
 <p className="text-xs text-ink-3">
 {payment.category} • {payment.frequency.toUpperCase()}
 </p>
 </div>
 </div>
 <div className="text-right">
 <span className="text-xs text-ink-3">Scheduled</span>
 <div>
 <Money value={payment.amount} size="sm" tone="neutral" />
 </div>
 </div>
 </div>
 </div>

 {/* Due Date Indicator */}
 <div className="flex items-center justify-between rounded-xl bg-sunken px-3.5 py-2.5 text-xs text-ink-2 border border-line">
 <span className="font-medium">Cycle Due Date</span>
 <span className="font-bold text-ink-1 font-numeric">
 {formatDate(targetDueDate)}
 </span>
 </div>

 {/* Actual Amount Paid (editable for variable bills like BESCOM / gas) */}
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-1.5">
 Actual Paid Amount (INR ₹) *
 </label>
 <div className="relative rounded-xl shadow-sm">
 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-3 font-bold text-lg">
 ₹
 </div>
 <input
 type="number"
 step="any"
 inputMode="decimal"
 required
 value={amountStr}
 onChange={e => setAmountStr(e.target.value)}
 placeholder="e.g. 2500"
 className="w-full rounded-xl border border-line bg-sunken pl-8 pr-4 py-2.5 text-ink-1 font-bold text-lg font-numeric focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
 />
 </div>
 {parsedAmount > 0 && (
 <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium italic">
 {numberToWordsINR(parsedAmount)}
 </p>
 )}
 </div>

 {/* Transaction Ledger Record Toggle */}
 <div className="rounded-xl border border-line bg-sunken p-3.5 transition-colors">
 <label className="flex items-start gap-3 cursor-pointer">
 <input
 type="checkbox"
 checked={recordInLedger}
 onChange={e => setRecordInLedger(e.target.checked)}
 className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700"
 />
 <div className="flex-1">
 <span className="text-sm font-semibold text-ink-1 flex items-center gap-1.5">
 Record as Debit in Transactions ledger
 </span>
 <p className="text-xs text-ink-3 mt-0.5">
 Automatically logs a ₹{parsedAmount.toLocaleString('en-IN')} expense in your ledger dated today under{' '}
 <span className="font-semibold text-ink-2">{payment.category}</span>.
 Toggling this only affects this single occurrence.
 </p>
 </div>
 </label>
 </div>

 {/* Action Buttons */}
 <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
 <button
 type="button"
 onClick={onClose}
 className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink-2 hover:bg-sunken transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="inline-flex items-center gap-2 rounded-xl bg-primary hover:opacity-95 text-on-primary px-5 py-2.5 text-sm font-bold text-slate-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors active:scale-95"
 >
 <CheckCircle2 className="h-4 w-4" />
 <span>Confirm Payment</span>
 </button>
 </div>
 </form>
 </Modal>
 );
};
