import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { Contact, SettlementRecord, Transaction, TransactionType } from '../../types/finance';
import { Money } from '../ui';
import { formatDate, getTodayString } from '../../utils/date';
import { HandCoins, Link as LinkIcon, Unlink, Search, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface SettleUpModalProps {
 isOpen: boolean;
 onClose: () => void;
 contact: Contact | null;
 suggestedAmount?: number;
 initialSettlement?: SettlementRecord | null;
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
 isOpen,
 onClose,
 contact,
 suggestedAmount = 0,
 initialSettlement,
}) => {
 const {
 transactions,
 settlements,
 contactBalances,
 recordSettlement,
 updateSettlement,
 } = useFinance();

 const [amount, setAmount] = useState<string>('');
 const [date, setDate] = useState<string>(getTodayString());
 const [note, setNote] = useState<string>('');
 const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
 const [isLinkingExpanded, setIsLinkingExpanded] = useState<boolean>(false);
 const [txSearchQuery, setTxSearchQuery] = useState<string>('');

 const balanceMap = useMemo(() => {
 return new Map(contactBalances.map(b => [b.contactId, b.netAmount]));
 }, [contactBalances]);

 const contactNet = contact ? balanceMap.get(contact.id) || 0 : 0;
 // If contact owes me (net > 0), they repay me -> Bank Transaction is a CREDIT
 // If I owe contact (net < 0), I repay them -> Bank Transaction is a DEBIT
 // CRITICAL: If editing an existing settlement, preserve initialSettlement.direction so 0 balance doesn't flip it!
 const isTheyOweMe = initialSettlement
 ? (initialSettlement.direction ? initialSettlement.direction === 'they_owe_me' : contactNet >= 0)
 : (contactNet !== 0 ? contactNet > 0 : true);
 const expectedTxType: TransactionType = isTheyOweMe ? 'credit' : 'debit';

 useEffect(() => {
 if (initialSettlement && isOpen) {
 setAmount(initialSettlement.amount.toString());
 setDate(initialSettlement.date);
 setNote(initialSettlement.note || '');
 setSelectedTxId(initialSettlement.linkedTransactionId || null);
 setIsLinkingExpanded(Boolean(initialSettlement.linkedTransactionId));
 setTxSearchQuery('');
 } else if (contact && isOpen) {
 setAmount(suggestedAmount > 0 ? suggestedAmount.toString() : '');
 setDate(getTodayString());
 setNote(`Settlement with ${contact.name}`);
 setSelectedTxId(null);
 setIsLinkingExpanded(false);
 setTxSearchQuery('');
 }
 }, [contact, suggestedAmount, initialSettlement, isOpen]);

 // Track usage count per transaction across settlements
 const txUsageCountMap = useMemo(() => {
 const map = new Map<string, number>();
 settlements.forEach(s => {
 if (s.linkedTransactionId) {
 map.set(s.linkedTransactionId, (map.get(s.linkedTransactionId) || 0) + 1);
 }
 });
 return map;
 }, [settlements]);

 // Filter & score candidate transactions
 const candidateTransactions = useMemo(() => {
 const parsedAmount = parseFloat(amount) || suggestedAmount || 0;
 const targetDate = new Date(date).getTime();

 const candidates = transactions.filter(t => {
 // Must match expected direction (credit vs debit)
 if (t.type !== expectedTxType) return false;

 // Filter by search query if present
 if (txSearchQuery.trim()) {
 const q = txSearchQuery.toLowerCase();
 const matchesDesc = t.description.toLowerCase().includes(q);
 const matchesRef = t.referenceId && t.referenceId.toLowerCase().includes(q);
 const matchesDate = t.date.includes(q);
 if (!matchesDesc && !matchesRef && !matchesDate) return false;
 }

 return true;
 });

 // Sort candidates: exact amount match first, then date proximity
 return candidates.sort((a, b) => {
 const aExact = Math.abs(a.amount - parsedAmount) < 0.01 ? 1 : 0;
 const bExact = Math.abs(b.amount - parsedAmount) < 0.01 ? 1 : 0;
 if (aExact !== bExact) return bExact - aExact;

 const aCloseAmount = Math.abs(a.amount - parsedAmount) / (parsedAmount || 1) < 0.1 ? 1 : 0;
 const bCloseAmount = Math.abs(b.amount - parsedAmount) / (parsedAmount || 1) < 0.1 ? 1 : 0;
 if (aCloseAmount !== bCloseAmount) return bCloseAmount - aCloseAmount;

 const aDateDiff = Math.abs(new Date(a.date).getTime() - targetDate);
 const bDateDiff = Math.abs(new Date(b.date).getTime() - targetDate);
 return aDateDiff - bDateDiff;
 });
 }, [transactions, expectedTxType, amount, suggestedAmount, date, txSearchQuery]);

 const handleSelectTransaction = (tx: Transaction) => {
 setSelectedTxId(tx.id);
 setDate(tx.date); // Auto-sync settlement date with transaction date!
 };

 const selectedTransaction = useMemo(() => {
 if (!selectedTxId) return null;
 return transactions.find(t => t.id === selectedTxId) || null;
 }, [selectedTxId, transactions]);

 if (!contact) return null;

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 const parsed = parseFloat(amount);
 if (isNaN(parsed) || parsed <= 0) {
 alert('Please enter a valid settlement amount');
 return;
 }

 const settlementDirection = initialSettlement?.direction || (isTheyOweMe ? 'they_owe_me' : 'i_owe_them');

 if (initialSettlement) {
 updateSettlement(initialSettlement.id, {
 amount: parsed,
 date,
 note: note.trim(),
 linkedTransactionId: selectedTxId || undefined,
 direction: settlementDirection,
 });
 } else {
 recordSettlement(
 contact.id,
 parsed,
 note.trim(),
 date,
 undefined,
 undefined,
 selectedTxId || undefined,
 settlementDirection
 );
 }

 onClose();
 };

 return (
 <Modal
 isOpen={isOpen}
 onClose={onClose}
 title={initialSettlement ? `Edit Settlement with ${contact.name}` : `Settle Up with ${contact.name}`}
 subtitle={
 initialSettlement
 ? 'Modify amount, date, notes, or linked bank transaction'
 : 'Record a payment to clear or reduce the open balance'
 }
 >
 <form onSubmit={handleSubmit} className="space-y-4">
 {suggestedAmount > 0 && !initialSettlement && (
 <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs flex items-center justify-between">
 <span className="text-emerald-800 dark:text-emerald-300 font-medium">
 Current Open Balance:
 </span>
 <span className="font-extrabold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
 <Money value={suggestedAmount} size="sm" tone={isTheyOweMe ? 'positive' : 'neutral'} />
 <span>({isTheyOweMe ? 'They owe you' : 'You owe them'})</span>
 </span>
 </div>
 )}

 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-1.5">
 Settlement Amount (₹) *
 </label>
 <div className="relative rounded-xl shadow-sm">
 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-3 font-bold text-lg">
 ₹
 </div>
 <input
 type="number"
 step="0.01"
 inputMode="decimal"
 required
 value={amount}
 onChange={e => setAmount(e.target.value)}
 placeholder="0.00"
 className="font-numeric tabular-nums w-full rounded-xl border border-line bg-sunken pl-8 pr-4 py-2.5 text-ink-1 font-bold text-lg focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
 />
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-1.5">
 <label className="block text-xs font-bold uppercase tracking-wider text-ink-3">
 Settlement Date *
 </label>
 {selectedTransaction && selectedTransaction.date !== date && (
 <button
 type="button"
 onClick={() => setDate(selectedTransaction.date)}
 className="text-xs font-bold font-numeric text-primary hover:underline"
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
 className="font-numeric tabular-nums w-full rounded-xl border border-line bg-sunken px-3.5 py-2.5 text-sm text-ink-1 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
 />
 </div>

 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-1.5">
 Note / Payment Reference (Optional)
 </label>
 <input
 type="text"
 value={note}
 onChange={e => setNote(e.target.value)}
 placeholder="e.g. Paid via GPay, Cash returned"
 className="w-full rounded-xl border border-line bg-sunken px-3.5 py-2.5 text-sm text-ink-1 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
 />
 </div>

 {/* Link to Real Bank Transaction Section */}
 <div className="pt-2 border-t border-line">
 <div className="flex items-center justify-between">
 <button
 type="button"
 onClick={() => setIsLinkingExpanded(!isLinkingExpanded)}
 className="flex items-center gap-2 text-xs font-bold text-ink-2 hover:text-warning dark:hover:text-reward transition-colors"
 >
 <LinkIcon className="w-3.5 h-3.5 text-primary" />
 <span>Link to Bank Transaction (Optional)</span>
 {isLinkingExpanded ? (
 <ChevronUp className="w-3.5 h-3.5 text-ink-3" />
 ) : (
 <ChevronDown className="w-3.5 h-3.5 text-ink-3" />
 )}
 </button>

 {selectedTxId && (
 <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold">
 1 Linked
 </span>
 )}
 </div>

 {isLinkingExpanded && (
 <div className="mt-3 p-3.5 bg-sunken rounded-2xl border border-line space-y-3">
 {selectedTransaction ? (
 /* Selected Linked Transaction Card */
 <div className="p-3 rounded-xl bg-surface border border-emerald-500/40 shadow-xs flex items-center justify-between gap-3">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center flex-shrink-0">
 <Check className="w-4 h-4" />
 </div>
 <div className="min-w-0">
 <p className="text-xs font-bold text-ink-1 truncate">
 {selectedTransaction.description}
 </p>
 <p className="text-xs text-ink-3">
 {formatDate(selectedTransaction.date)} • {selectedTransaction.paymentMethod} •{' '}
 <Money value={selectedTransaction.amount} size="sm" tone="positive" />
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={() => setSelectedTxId(null)}
 className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sunken text-ink-2 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors"
 >
 <Unlink className="w-3 h-3" />
 <span>Unlink</span>
 </button>
 </div>
 ) : (
 /* Search & Candidate List */
 <div className="space-y-2">
 <div className="relative">
 <Search className="w-3.5 h-3.5 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={txSearchQuery}
 onChange={e => setTxSearchQuery(e.target.value)}
 placeholder={`Search ${expectedTxType} transactions...`}
 className="w-full pl-8 pr-3 py-1.5 bg-surface border border-line rounded-xl text-xs font-medium text-ink-1 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
 />
 </div>

 <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
 {candidateTransactions.length === 0 ? (
 <p className="text-xs text-ink-3 py-3 text-center italic">
 No matching {expectedTxType} transactions found. You can link later from Settlement History.
 </p>
 ) : (
 candidateTransactions.slice(0, 15).map(tx => {
 const parsedAmt = parseFloat(amount) || suggestedAmount || 0;
 const isExactAmount = Math.abs(tx.amount - parsedAmt) < 0.01;

 return (
 <div
 key={tx.id}
 onClick={() => handleSelectTransaction(tx)}
 className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-2 text-xs ${
 isExactAmount
 ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
 : 'bg-surface border-line hover:border-line'
 }`}
 >
 <div className="min-w-0">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="font-bold text-ink-1 truncate">
 {tx.description}
 </span>
 {isExactAmount && (
 <span className="px-1.5 py-0.2 rounded text-xs font-extrabold bg-emerald-600 text-white">
 Exact match
 </span>
 )}
 {(txUsageCountMap.get(tx.id) || 0) > 0 && (
 <span className="px-1.5 py-0.2 rounded text-xs font-bold bg-sunken text-ink-2">
 Linked to {txUsageCountMap.get(tx.id)} other
 </span>
 )}
 </div>
 <p className="text-xs text-ink-3 mt-0.5 font-numeric">
 {formatDate(tx.date)} • {tx.paymentMethod}
 {tx.referenceId ? ` • Ref: ${tx.referenceId}` : ''}
 </p>
 </div>

 <div className="text-right flex-shrink-0">
 <Money value={tx.amount} size="sm" />
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>
 )}
 </div>
 )}
 </div>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2 rounded-xl text-sm font-semibold text-ink-2 hover:bg-sunken transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-primary hover:opacity-95 text-on-primary shadow-md shadow-xs transition-colors active:scale-95"
 >
 {initialSettlement ? <Check className="w-4 h-4" /> : <HandCoins className="w-4 h-4" />}
 <span>{initialSettlement ? 'Save Changes' : 'Record Settlement'}</span>
 </button>
 </div>
 </form>
 </Modal>
 );
};
