import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { Contact, Transaction, SplitEntry } from '../../types/finance';
import { formatINR } from '../../utils/currency';
import { formatDate, getTodayString } from '../../utils/date';
import {
  Link as LinkIcon,
  Unlink,
  Search,
  Check,
  Receipt,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Layers,
} from 'lucide-react';

interface SettleSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  transaction: Transaction;
  splitEntry: SplitEntry;
}

export const SettleSplitModal: React.FC<SettleSplitModalProps> = ({
  isOpen,
  onClose,
  contact,
  transaction,
  splitEntry,
}) => {
  const {
    transactions,
    settlements,
    settleSplitEntry,
  } = useFinance();

  const [settledAmount, setSettledAmount] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayString());
  const [note, setNote] = useState<string>('');
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'exact' | 'credits'>('all');

  // Existing settlement for this split entry if any
  const existingSettlement = useMemo(() => {
    return settlements.find(
      s => s.sourceTransactionId === transaction.id && s.sourceSplitEntryId === splitEntry.id
    );
  }, [settlements, transaction.id, splitEntry.id]);

  useEffect(() => {
    if (isOpen) {
      const initialAmt = splitEntry.settledAmount !== undefined && splitEntry.settledAmount > 0
        ? splitEntry.settledAmount
        : splitEntry.amount;

      const linkedId = splitEntry.linkedTransactionId || existingSettlement?.linkedTransactionId || null;
      const linkedTx = linkedId ? transactions.find(t => t.id === linkedId) : null;

      setSettledAmount(initialAmt.toString());
      setDate(linkedTx?.date || existingSettlement?.date || transaction.date || getTodayString());
      setNote(existingSettlement?.note || `Repayment for "${transaction.description}"`);
      setSelectedTxId(linkedId);
      setSearchQuery('');
      setFilterMode('all');
    }
  }, [isOpen, splitEntry, existingSettlement, transaction, transactions]);

  // Expected type: if they owe me, bank repayment is a credit
  const expectedTxType = splitEntry.direction === 'they_owe_me' ? 'credit' : 'debit';
  const parsedSettledAmount = parseFloat(settledAmount) || 0;
  const remainingAfterSettlement = Math.max(0, splitEntry.amount - parsedSettledAmount);

  // Count how many times each transaction is linked across all settlements
  const txUsageCountMap = useMemo(() => {
    const map = new Map<string, number>();
    settlements.forEach(s => {
      if (s.linkedTransactionId) {
        map.set(s.linkedTransactionId, (map.get(s.linkedTransactionId) || 0) + 1);
      }
    });
    return map;
  }, [settlements]);

  // Candidate transactions for repayment (NEVER arbitrarily block or hide)
  const candidateTransactions = useMemo(() => {
    const targetDate = new Date(date).getTime();

    const candidates = transactions.filter(t => {
      // Avoid linking the split expense transaction to itself
      if (t.id === transaction.id) return false;

      // Filter tabs
      if (filterMode === 'credits' && t.type !== expectedTxType) return false;
      if (filterMode === 'exact' && Math.abs(t.amount - parsedSettledAmount) > 0.01) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = t.description.toLowerCase().includes(q);
        const matchesRef = t.referenceId && t.referenceId.toLowerCase().includes(q);
        const matchesAmount = t.amount.toString().includes(q);
        const matchesDate = t.date.includes(q);
        if (!matchesDesc && !matchesRef && !matchesAmount && !matchesDate) return false;
      }

      return true;
    });

    // Score & Sort: Same direction first, Exact amount first, Date proximity
    return candidates.sort((a, b) => {
      const aTypeMatch = a.type === expectedTxType ? 1 : 0;
      const bTypeMatch = b.type === expectedTxType ? 1 : 0;
      if (aTypeMatch !== bTypeMatch) return bTypeMatch - aTypeMatch;

      const aExact = Math.abs(a.amount - parsedSettledAmount) < 0.01 ? 1 : 0;
      const bExact = Math.abs(b.amount - parsedSettledAmount) < 0.01 ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;

      const aDateDiff = Math.abs(new Date(a.date).getTime() - targetDate);
      const bDateDiff = Math.abs(new Date(b.date).getTime() - targetDate);
      return aDateDiff - bDateDiff;
    });
  }, [transactions, transaction.id, expectedTxType, filterMode, parsedSettledAmount, date, searchQuery]);

  const handleSelectTransaction = (tx: Transaction) => {
    setSelectedTxId(tx.id);
    setDate(tx.date); // Auto-sync settlement date with transaction date!
  };

  const selectedTransaction = useMemo(() => {
    if (!selectedTxId) return null;
    return transactions.find(t => t.id === selectedTxId) || null;
  }, [selectedTxId, transactions]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedSettledAmount <= 0) {
      alert('Please enter a valid settlement amount greater than ₹0');
      return;
    }

    if (parsedSettledAmount > splitEntry.amount + 0.01) {
      alert(`Settled amount (₹${parsedSettledAmount}) cannot exceed the owed share (₹${splitEntry.amount})`);
      return;
    }

    settleSplitEntry(transaction.id, splitEntry.id, {
      settled: true,
      settledAmount: parsedSettledAmount,
      linkedTransactionId: selectedTxId || undefined,
      note: note.trim(),
      date,
    });

    onClose();
  };

  const handleUnsettle = () => {
    if (window.confirm(`Mark this split expense for "${transaction.description}" as unsettled?`)) {
      settleSplitEntry(transaction.id, splitEntry.id, { settled: false });
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Connect Repayment: ${transaction.description}`}
      subtitle={`Manage settlement and connect bank transaction for ${contact.name}`}
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Original Split Expense Summary Card */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#171E2A] border border-slate-200/80 dark:border-[#202836] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-[#F5B742] flex-shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-white truncate">
                {transaction.description}
              </p>
              <p className="text-[11px] text-slate-400 font-numeric">
                {formatDate(transaction.date)} • Total Bill: {formatINR(transaction.amount)}
              </p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="font-black font-numeric text-sm text-emerald-600 dark:text-emerald-400">
              {formatINR(splitEntry.amount)}
            </span>
            <p className="text-[10px] font-bold text-slate-400">
              {splitEntry.direction === 'they_owe_me' ? 'They Owe' : 'You Owe'}
            </p>
          </div>
        </div>

        {/* Settled Amount Input + Partial Remaining Helper */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Settlement Amount (₹) *
            </label>
            <button
              type="button"
              onClick={() => setSettledAmount(splitEntry.amount.toString())}
              className="text-[11px] font-bold font-numeric text-amber-600 dark:text-[#F5B742] hover:underline"
            >
              Full ({formatINR(splitEntry.amount)})
            </button>
          </div>

          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-bold text-lg">
              ₹
            </div>
            <input
              type="number"
              step="0.01"
              required
              value={settledAmount}
              onChange={e => setSettledAmount(e.target.value)}
              placeholder="0.00"
              className="font-numeric tabular-nums w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] pl-8 pr-4 py-2.5 text-slate-900 dark:text-slate-100 font-bold text-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {remainingAfterSettlement > 0.01 && (
            <div className="mt-2 p-2.5 rounded-xl bg-amber-50/50 dark:bg-[#171E2A] border border-amber-200/80 dark:border-[#202836] flex items-center gap-2 text-xs text-amber-900 dark:text-amber-300 font-numeric">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 dark:text-[#F5B742]" />
              <span>
                Partial settlement: <strong className="font-extrabold">{formatINR(remainingAfterSettlement)}</strong> will stay open as pending balance for {contact.name}.
              </span>
            </div>
          )}
        </div>

        {/* Date & Note Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Settlement Date *
              </label>
              {selectedTransaction && selectedTransaction.date !== date && (
                <button
                  type="button"
                  onClick={() => setDate(selectedTransaction.date)}
                  className="text-[10px] font-bold font-numeric text-amber-600 dark:text-[#F5B742] hover:underline"
                  title="Use transaction date"
                >
                  Use tx date ({formatDate(selectedTransaction.date)})
                </button>
              )}
            </div>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="font-numeric tabular-nums w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Paid via GPay UPI"
              className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Bank Repayment Transaction Connection */}
        <div className="pt-2 border-t border-slate-100 dark:border-[#202836] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-amber-500 dark:text-[#F5B742]" />
              <span>Connect Bank Transaction (Repayment)</span>
            </span>

            {selectedTxId && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Connected</span>
              </span>
            )}
          </div>

          {selectedTransaction ? (
            /* Selected Transaction Banner */
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#171E2A] border border-slate-200/80 dark:border-[#202836] shadow-xs flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {selectedTransaction.description}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-numeric">
                    {formatDate(selectedTransaction.date)} • {selectedTransaction.paymentMethod} •{' '}
                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      {formatINR(selectedTransaction.amount)}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTxId(null)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-[#131822] text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-bold transition-colors border border-slate-200/60 dark:border-[#202836] shadow-xs"
              >
                <Unlink className="w-3 h-3" />
                <span>Change / Unlink</span>
              </button>
            </div>
          ) : (
            /* Transaction Search and Candidate List */
            <div className="p-3 bg-slate-50 dark:bg-[#171E2A] rounded-2xl border border-slate-200/80 dark:border-[#202836] space-y-2.5">
              {/* Search & Filter Tabs */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search bank transactions by merchant or amount..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#131822] border border-slate-200/90 dark:border-[#202836] rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-[#202836] p-0.5 rounded-xl text-[11px] font-bold self-start sm:self-auto flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      filterMode === 'all'
                        ? 'bg-white dark:bg-[#131822] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('exact')}
                    className={`font-numeric px-2 py-1 rounded-lg transition-all ${
                      filterMode === 'exact'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Exact ({formatINR(parsedSettledAmount)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('credits')}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      filterMode === 'credits'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Incoming Credits
                  </button>
                </div>
              </div>

              {/* Transactions List */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {candidateTransactions.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center italic">
                    No matching bank transactions found. You can still confirm settlement without linking.
                  </p>
                ) : (
                  candidateTransactions.slice(0, 20).map(tx => {
                    const isExact = Math.abs(tx.amount - parsedSettledAmount) < 0.01;
                    const usageCount = txUsageCountMap.get(tx.id) || 0;

                    return (
                      <div
                        key={tx.id}
                        onClick={() => handleSelectTransaction(tx)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${
                          isExact
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/80'
                            : 'bg-white dark:bg-[#131822] border-slate-200/90 dark:border-[#202836] hover:border-amber-400'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white truncate">
                              {tx.description}
                            </span>
                            {isExact && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-600 text-white">
                                Exact Match
                              </span>
                            )}
                            {usageCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 dark:bg-[#202836] text-slate-700 dark:text-slate-300 flex items-center gap-0.5">
                                <Layers className="w-2.5 h-2.5" />
                                <span>Linked to {usageCount} split{usageCount > 1 ? 's' : ''}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-numeric">
                            {formatDate(tx.date)} • {tx.paymentMethod} • {tx.type === 'credit' ? 'Income Credit' : 'Expense Debit'}
                            {tx.referenceId ? ` • Ref: ${tx.referenceId}` : ''}
                          </p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className={`font-numeric font-black ${tx.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {formatINR(tx.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#202836] gap-2">
          <div>
            {splitEntry.settled && (
              <button
                type="button"
                onClick={handleUnsettle}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Mark this split as unsettled"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Mark Unsettled</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#171E2A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{selectedTxId ? 'Confirm Settlement & Link' : 'Confirm Settlement'}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
