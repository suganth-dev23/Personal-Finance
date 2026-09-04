import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, SplitEntry, OwedDirection } from '../../types/finance';
import { formatINR } from '../../utils/currency';

interface EditSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  splitEntry: SplitEntry | null;
}

export const EditSplitModal: React.FC<EditSplitModalProps> = ({
  isOpen,
  onClose,
  transaction,
  splitEntry,
}) => {
  const { contacts, updateTransaction } = useFinance();

  const [contactId, setContactId] = useState<string>('');
  const [direction, setDirection] = useState<OwedDirection>('they_owe_me');
  const [amount, setAmount] = useState<string>('');
  const [isSettled, setIsSettled] = useState<boolean>(false);

  useEffect(() => {
    if (splitEntry && isOpen) {
      setContactId(splitEntry.contactId || '');
      setDirection(splitEntry.direction);
      setAmount(splitEntry.amount.toString());
      setIsSettled(splitEntry.settled);
    }
  }, [splitEntry, isOpen]);

  if (!transaction || !splitEntry) return null;

  const otherSplitsTotal = (transaction.splitWith || [])
    .filter(s => s.id !== splitEntry.id)
    .reduce((sum, s) => sum + s.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid split amount greater than ₹0');
      return;
    }

    if (otherSplitsTotal + parsedAmount > transaction.amount + 0.01) {
      alert(
        `Total splits (₹${(otherSplitsTotal + parsedAmount).toFixed(2)}) cannot exceed total transaction amount of ${formatINR(transaction.amount)}`
      );
      return;
    }

    if (!transaction.splitWith) return;

    const updatedSplits = transaction.splitWith.map(s =>
      s.id === splitEntry.id
        ? {
            ...s,
            contactId: contactId || undefined,
            label: contactId ? undefined : s.label || 'Unnamed Person',
            amount: parsedAmount,
            direction,
            settled: isSettled,
          }
        : s
    );

    updateTransaction(transaction.id, { splitWith: updatedSplits });
    onClose();
  };

  const handleRemoveSplit = () => {
    if (window.confirm('Remove this split entry from the transaction?')) {
      if (!transaction.splitWith) return;
      const updatedSplits = transaction.splitWith.filter(s => s.id !== splitEntry.id);
      updateTransaction(transaction.id, {
        splitWith: updatedSplits.length > 0 ? updatedSplits : undefined,
      });
      onClose();
    }
  };

  const parsedAmount = parseFloat(amount) || 0;
  const yourShare = Math.max(0, transaction.amount - otherSplitsTotal - parsedAmount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Split / IOU"
      subtitle={`Transaction: ${transaction.description} (${formatINR(transaction.amount)})`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contact Picker */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Person
          </label>
          <select
            value={contactId}
            onChange={e => setContactId(e.target.value)}
            className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          >
            <option value="">(Unnamed Person / Label)</option>
            {contacts.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Direction Toggle */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Direction
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-[#171E2A] rounded-xl border border-transparent dark:border-[#202836]">
            <button
              type="button"
              onClick={() => setDirection('they_owe_me')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                direction === 'they_owe_me'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              They Owe Me
            </button>
            <button
              type="button"
              onClick={() => setDirection('i_owe_them')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                direction === 'i_owe_them'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              I Owe Them
            </button>
          </div>
        </div>

        {/* Split Amount */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Owed Amount (₹) *
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="font-numeric tabular-nums w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-500 font-numeric">
            Total transaction: {formatINR(transaction.amount)} · Your share: <span className="font-bold text-slate-900 dark:text-white">{formatINR(yourShare)}</span>
          </p>
        </div>

        {/* Status Toggle */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#171E2A] rounded-2xl border border-slate-200/80 dark:border-[#202836]">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Settlement Status
          </span>
          <button
            type="button"
            onClick={() => setIsSettled(!isSettled)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              isSettled
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
          >
            {isSettled ? 'Settled' : 'Pending'}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#202836]">
          <button
            type="button"
            onClick={handleRemoveSplit}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
          >
            Remove Split
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#171E2A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
