import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType, PaymentMethod, OwedDirection, SplitEntry } from '../../types/finance';
import { numberToWordsINR, formatINR } from '../../utils/currency';
import { getTodayString } from '../../utils/date';
import { suggestCategory } from '../../utils/categoryMatcher';
import { Sparkles, Users, Check, X, Lock, Unlock, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTransaction?: Transaction | null;
}

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

interface SplitRowState {
  id: string;
  contactId?: string;
  label?: string;
  amount: number;
  direction: OwedDirection;
  settled: boolean;
  isPinned: boolean;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialTransaction,
}) => {
  const {
    transactions,
    categories,
    contacts,
    contactBalances,
    addContact,
    addTransaction,
    updateTransaction,
    recordSettlement,
  } = useFinance();

  const [date, setDate] = useState<string>(getTodayString());
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>('debit');
  const [category, setCategory] = useState<string>('Food & Dining');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [description, setDescription] = useState<string>('');
  const [person, setPerson] = useState<string>('');
  const [referenceId, setReferenceId] = useState<string>('');
  const [dismissedSettlementSuggestion, setDismissedSettlementSuggestion] = useState<boolean>(false);

  const balanceMap = useMemo(() => {
    return new Map(contactBalances.map(b => [b.contactId, b.netAmount]));
  }, [contactBalances]);

  // Distinct person suggestions from previous transactions history
  const personSuggestions = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.person && t.person.trim()) {
        set.add(t.person.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [transactions]);

  // Split / Multi-Person IOU State
  const [isSplitEnabled, setIsSplitEnabled] = useState<boolean>(false);
  const [autoSplitRemaining, setAutoSplitRemaining] = useState<boolean>(true);
  const [splitRows, setSplitRows] = useState<SplitRowState[]>([]);
  const [unnamedCountToAdd, setUnnamedCountToAdd] = useState<number>(3);
  const [isCreatingContact, setIsCreatingContact] = useState<boolean>(false);
  const [newPersonName, setNewPersonName] = useState<string>('');

  const numAmount = parseFloat(amount) || 0;

  // Check if this manual transaction matches an existing contact's balance (Repayment Detection)
  const matchingRepaymentContact = useMemo(() => {
    if (initialTransaction || isSplitEnabled || dismissedSettlementSuggestion || numAmount <= 0) {
      return null;
    }

    for (const contact of contacts) {
      const bal = balanceMap.get(contact.id) || 0;
      // If Credit (income): contact owes user money (bal > 0)
      if (type === 'credit' && bal > 0 && Math.abs(bal - numAmount) < 0.01) {
        return { contact, isOwedToMe: true };
      }
      // If Debit (expense): user owes contact money (bal < 0)
      if (type === 'debit' && bal < 0 && Math.abs(Math.abs(bal) - numAmount) < 0.01) {
        return { contact, isOwedToMe: false };
      }
    }
    return null;
  }, [initialTransaction, isSplitEnabled, dismissedSettlementSuggestion, numAmount, contacts, balanceMap, type]);

  const handleSaveAsSettlement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!matchingRepaymentContact) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount greater than ₹0');
      return;
    }

    const trimmedDesc = description.trim() || `Repayment with ${matchingRepaymentContact.contact.name}`;
    const trimmedPerson = person.trim() || matchingRepaymentContact.contact.name;

    // 1. Add ledger transaction
    const newTx = addTransaction({
      date,
      amount: parsedAmount,
      type,
      category,
      paymentMethod,
      description: trimmedDesc,
      person: trimmedPerson,
      source: 'manual',
      referenceId: referenceId.trim() || undefined,
    });

    // 2. Record linked settlement
    recordSettlement(
      matchingRepaymentContact.contact.id,
      parsedAmount,
      `Repayment: ${trimmedDesc}`,
      date,
      undefined,
      undefined,
      newTx.id
    );

    onClose();
  };

  // Re-calculate auto splits helper
  const computeAutoSplits = useCallback(
    (rows: SplitRowState[], totalAmount: number, isAuto: boolean): SplitRowState[] => {
      if (!isAuto || rows.length === 0) return rows;

      const pinnedSum = rows
        .filter(r => r.isPinned)
        .reduce((sum, r) => sum + (r.amount || 0), 0);

      const leftover = Math.max(0, totalAmount - pinnedSum);
      const unpinnedRows = rows.filter(r => !r.isPinned);

      if (unpinnedRows.length === 0) return rows;

      // Total shares = unpinned rows + your share (1)
      const shares = unpinnedRows.length + 1;
      const shareAmount = Number((leftover / shares).toFixed(2));

      return rows.map(r => {
        if (!r.isPinned) {
          return { ...r, amount: shareAmount };
        }
        return r;
      });
    },
    []
  );

  useEffect(() => {
    if (initialTransaction) {
      setDate(initialTransaction.date);
      setAmount(initialTransaction.amount.toString());
      setType(initialTransaction.type);
      setCategory(initialTransaction.category);
      setPaymentMethod(initialTransaction.paymentMethod);
      setDescription(initialTransaction.description);
      setPerson(initialTransaction.person || '');
      setReferenceId(initialTransaction.referenceId || '');

      if (initialTransaction.splitWith && initialTransaction.splitWith.length > 0) {
        setIsSplitEnabled(true);
        setAutoSplitRemaining(false); // Preserve existing custom amounts on edit
        setSplitRows(
          initialTransaction.splitWith.map(s => ({
            id: s.id || `split-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            contactId: s.contactId,
            label: s.label,
            amount: s.amount,
            direction: s.direction,
            settled: Boolean(s.settled),
            isPinned: true,
          }))
        );
      } else {
        setIsSplitEnabled(false);
        setAutoSplitRemaining(true);
        setSplitRows([]);
      }
    } else {
      setDate(getTodayString());
      setAmount('');
      setType('debit');
      setCategory('Food & Dining');
      setPaymentMethod('UPI');
      setDescription('');
      setPerson('');
      setReferenceId('');
      setIsSplitEnabled(false);
      setAutoSplitRemaining(true);
      setSplitRows([]);
    }
    setIsCreatingContact(false);
    setNewPersonName('');
  }, [initialTransaction, isOpen]);

  // Recalculate auto-split when total amount changes and auto-split is on
  const handleAmountChange = (newAmountStr: string) => {
    setAmount(newAmountStr);
    const parsed = parseFloat(newAmountStr) || 0;
    if (isSplitEnabled && autoSplitRemaining && splitRows.length > 0) {
      setSplitRows(prev => computeAutoSplits(prev, parsed, true));
    }
  };

  const handleDescriptionBlur = () => {
    if (description && !initialTransaction) {
      const match = suggestCategory(description);
      if (match.category && match.confidence !== 'low') {
        const found = categories.find(c => c.name.toLowerCase() === match.category.toLowerCase());
        if (found) {
          setCategory(found.name);
          if (match.suggestedType) {
            setType(match.suggestedType);
          }
        }
      }
    }
  };

  const handleAutoCategorize = () => {
    if (!description) return;
    const match = suggestCategory(description);
    const found = categories.find(c => c.name.toLowerCase() === match.category.toLowerCase());
    if (found) {
      setCategory(found.name);
      if (match.suggestedType) {
        setType(match.suggestedType);
      }
    }
  };

  const handleCreateNewPerson = () => {
    if (!newPersonName.trim()) return;
    const created = addContact({ name: newPersonName.trim() });
    setIsCreatingContact(false);
    setNewPersonName('');

    // Add this new contact as a split row
    handleAddNamedPerson(created.id);
  };

  // Add a named split row
  const handleAddNamedPerson = (preferredContactId?: string) => {
    const totalAmount = parseFloat(amount) || 0;
    // Find next available contact not yet chosen
    const usedContactIds = new Set(splitRows.map(r => r.contactId).filter(Boolean));
    const availableContact = contacts.find(c => !usedContactIds.has(c.id));
    const targetContactId = preferredContactId || availableContact?.id || contacts[0]?.id || '';

    const newRow: SplitRowState = {
      id: `split-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      contactId: targetContactId,
      amount: 0,
      direction: 'they_owe_me',
      settled: false,
      isPinned: false,
    };

    setSplitRows(prev => {
      const next = [...prev, newRow];
      return computeAutoSplits(next, totalAmount, autoSplitRemaining);
    });
  };

  // Add N unnamed rows
  const handleAddUnnamedRows = (count: number) => {
    if (count <= 0) return;
    const totalAmount = parseFloat(amount) || 0;
    const currentCount = splitRows.length;

    const newRows: SplitRowState[] = [];
    for (let i = 0; i < count; i++) {
      newRows.push({
        id: `split-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        label: `Person ${currentCount + i + 1} (unnamed)`,
        amount: 0,
        direction: 'they_owe_me',
        settled: false,
        isPinned: false,
      });
    }

    setSplitRows(prev => {
      const next = [...prev, ...newRows];
      return computeAutoSplits(next, totalAmount, autoSplitRemaining);
    });
  };

  // Remove a row
  const handleRemoveRow = (rowId: string) => {
    const totalAmount = parseFloat(amount) || 0;
    setSplitRows(prev => {
      const next = prev.filter(r => r.id !== rowId);
      return computeAutoSplits(next, totalAmount, autoSplitRemaining);
    });
  };

  // Update specific row property
  const handleRowChange = (rowId: string, updates: Partial<SplitRowState>) => {
    const totalAmount = parseFloat(amount) || 0;

    // Check for duplicate contact selection
    if (updates.contactId) {
      const isDuplicate = splitRows.some(r => r.id !== rowId && r.contactId === updates.contactId);
      if (isDuplicate) {
        alert('This person is already added to this split.');
        return;
      }
    }

    setSplitRows(prev => {
      const next = prev.map(r => {
        if (r.id === rowId) {
          const updated = { ...r, ...updates };
          // If amount was manually edited, mark pinned
          if (updates.amount !== undefined) {
            updated.isPinned = true;
          }
          // If converted to named row by picking a contactId
          if (updates.contactId) {
            updated.label = undefined;
          }
          return updated;
        }
        return r;
      });
      return computeAutoSplits(next, totalAmount, autoSplitRemaining);
    });
  };

  // Toggle pin on a row
  const handleTogglePin = (rowId: string) => {
    const totalAmount = parseFloat(amount) || 0;
    setSplitRows(prev => {
      const next = prev.map(r => (r.id === rowId ? { ...r, isPinned: !r.isPinned } : r));
      return computeAutoSplits(next, totalAmount, autoSplitRemaining);
    });
  };

  // Toggle auto-split remaining switch
  const handleToggleAutoSplit = (checked: boolean) => {
    setAutoSplitRemaining(checked);
    const totalAmount = parseFloat(amount) || 0;
    if (checked) {
      // Recompute all unpinned rows
      setSplitRows(prev => computeAutoSplits(prev, totalAmount, true));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount greater than ₹0');
      return;
    }

    if (!description.trim()) {
      alert('Please enter a description / merchant name');
      return;
    }

    let splitPayload: SplitEntry[] | undefined = undefined;
    if (isSplitEnabled && splitRows.length > 0) {
      // Validate sum of splits
      const totalSplitSum = splitRows.reduce((sum, r) => sum + (r.amount || 0), 0);
      if (totalSplitSum > parsedAmount + 0.01) {
        alert(`Total split amounts (₹${totalSplitSum.toFixed(2)}) cannot exceed the transaction amount (₹${parsedAmount.toFixed(2)}).`);
        return;
      }

      // Check for any named row with invalid amount
      for (const row of splitRows) {
        if (row.amount <= 0) {
          alert('Each split row must have an owed amount greater than ₹0.');
          return;
        }
      }

      splitPayload = splitRows.map(r => ({
        id: r.id,
        contactId: r.contactId || undefined,
        label: r.label || (!r.contactId ? 'Unnamed Person' : undefined),
        amount: Number(r.amount.toFixed(2)),
        direction: r.direction,
        settled: r.settled,
      }));
    }

    const trimmedPerson = person.trim() || undefined;

    if (initialTransaction) {
      updateTransaction(initialTransaction.id, {
        date,
        amount: parsedAmount,
        type,
        category,
        paymentMethod,
        description: description.trim(),
        person: trimmedPerson,
        referenceId: referenceId.trim() || undefined,
        splitWith: splitPayload,
      });
    } else {
      addTransaction({
        date,
        amount: parsedAmount,
        type,
        category,
        paymentMethod,
        description: description.trim(),
        person: trimmedPerson,
        source: 'manual',
        referenceId: referenceId.trim() || undefined,
        splitWith: splitPayload,
      });
    }

    onClose();
  };

  const sumOfSplits = splitRows.reduce((acc, r) => acc + (r.amount || 0), 0);
  const yourShare = Math.max(0, numAmount - sumOfSplits);
  const isOverAllocated = sumOfSplits > numAmount + 0.01;
  const words = numAmount > 0 ? numberToWordsINR(numAmount) : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTransaction ? 'Edit Transaction' : 'Add New Transaction'}
      subtitle={initialTransaction ? 'Update transaction details' : 'Log an expense or income entry'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle: Debit (Expense) vs Credit (Income) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Transaction Type
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-[#171E2A] rounded-xl border border-transparent dark:border-[#202836]">
            <button
              type="button"
              onClick={() => setType('debit')}
              className={`py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                type === 'debit'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Debit (Expense)
            </button>
            <button
              type="button"
              onClick={() => setType('credit')}
              className={`py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                type === 'credit'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Credit (Income)
            </button>
          </div>
        </div>

        {/* Amount Input */}
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
              step="0.01"
              required
              value={amount}
              onChange={e => handleAmountChange(e.target.value)}
              placeholder="0.00"
              className="font-numeric tabular-nums w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] pl-8 pr-4 py-2.5 text-slate-900 dark:text-slate-100 font-bold text-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>
          {words && (
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium italic">
              {words}
            </p>
          )}
        </div>

        {/* Description & Auto-categorize */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Description / Merchant *
            </label>
            {description && (
              <button
                type="button"
                onClick={handleAutoCategorize}
                className="text-[11px] font-semibold text-amber-600 dark:text-[#F5B742] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-categorize</span>
              </button>
            )}
          </div>
          <input
            type="text"
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="e.g. Swiggy, Zepto, HDFC Salary, Rent, Uber"
            className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        {/* Person (optional) - Autocomplete / Combobox */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Person (optional)
            </label>
            {personSuggestions.length > 0 && (
              <span className="text-[10px] font-medium text-slate-400">
                Type or pick from history
              </span>
            )}
          </div>
          <input
            type="text"
            list="person-suggestions-list"
            value={person}
            onChange={e => setPerson(e.target.value)}
            placeholder="e.g. Amit, Landlord, Zomato, Mom"
            className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
          <datalist id="person-suggestions-list">
            {personSuggestions.map(p => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>

        {/* Category & Date in 2 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
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
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="font-numeric tabular-nums w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Payment Method & Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              {PAYMENT_METHODS.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Reference / UPI ID (Optional)
            </label>
            <input
              type="text"
              value={referenceId}
              onChange={e => setReferenceId(e.target.value)}
              placeholder="e.g. UPI-19827361"
              className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Multi-Person Split Expense / IOU Section */}
        <div className="pt-2 border-t border-slate-100 dark:border-[#202836]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600 dark:text-[#F5B742]" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Split this expense / IOU across people
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSplitEnabled}
                onChange={e => {
                  const enabled = e.target.checked;
                  setIsSplitEnabled(enabled);
                  if (enabled && splitRows.length === 0) {
                    handleAddNamedPerson();
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-[#202836] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-[#202836] peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {isSplitEnabled && (
            <div className="mt-3 p-3.5 bg-slate-50 dark:bg-[#171E2A] rounded-2xl border border-slate-200/80 dark:border-[#202836] space-y-3">
              {/* Auto Split Toggle & Add Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-[#202836]">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={autoSplitRemaining}
                    onChange={e => handleToggleAutoSplit(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300 dark:border-[#202836]"
                  />
                  <span>Split remaining amount equally</span>
                </label>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleAddNamedPerson()}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Person</span>
                  </button>

                  <div className="flex items-center bg-white dark:bg-[#131822] rounded-xl border border-slate-200/90 dark:border-[#202836] overflow-hidden">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={unnamedCountToAdd}
                      onChange={e => setUnnamedCountToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-10 px-1.5 py-1 text-center text-xs font-bold text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddUnnamedRows(unnamedCountToAdd)}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-[#171E2A] hover:bg-slate-200 dark:hover:bg-[#202836] text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors border-l border-slate-200/90 dark:border-[#202836]"
                    >
                      + Add unnamed
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline New Person Modal/Bar if triggered */}
              {isCreatingContact && (
                <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#131822] rounded-xl border border-amber-400 dark:border-amber-500/60">
                  <input
                    type="text"
                    placeholder="Enter new person's name..."
                    autoFocus
                    value={newPersonName}
                    onChange={e => setNewPersonName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateNewPerson}
                    className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950"
                    title="Save person"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingContact(false);
                      setNewPersonName('');
                    }}
                    className="p-1.5 rounded-lg bg-slate-200 dark:bg-[#202836] text-slate-600 dark:text-slate-300 hover:bg-slate-300"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Rows List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {splitRows.map((row, index) => {
                  return (
                    <div
                      key={row.id}
                      className={`p-2.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                        row.isPinned
                          ? 'bg-white dark:bg-[#131822] border-amber-400 dark:border-amber-500/60 shadow-xs'
                          : 'bg-white/80 dark:bg-[#131822] border-slate-200/90 dark:border-[#202836]'
                      }`}
                    >
                      {/* Contact Picker / Unnamed Label */}
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <select
                          value={row.contactId || ''}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '__new__') {
                              setIsCreatingContact(true);
                            } else if (val === '') {
                              handleRowChange(row.id, {
                                contactId: undefined,
                                label: row.label || `Person ${index + 1} (unnamed)`,
                              });
                            } else {
                              handleRowChange(row.id, { contactId: val });
                            }
                          }}
                          className="flex-1 rounded-lg border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="">{row.label || `Person ${index + 1} (unnamed)`}</option>
                          {contacts.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                          <option value="__new__">+ Add new contact...</option>
                        </select>
                      </div>

                      {/* Direction Toggle */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleRowChange(row.id, {
                              direction: row.direction === 'they_owe_me' ? 'i_owe_them' : 'they_owe_me',
                            })
                          }
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            row.direction === 'they_owe_me'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {row.direction === 'they_owe_me' ? 'Owes You' : 'You Owe'}
                        </button>
                      </div>

                      {/* Amount Input with Pin Status */}
                      <div className="flex items-center gap-1.5">
                        <div className="relative w-24">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                            ₹
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={row.amount || ''}
                            onChange={e =>
                              handleRowChange(row.id, {
                                amount: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0.00"
                            className="font-numeric tabular-nums w-full pl-5 pr-2 py-1 rounded-lg border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-right"
                          />
                        </div>

                        {/* Lock / Pin indicator */}
                        {autoSplitRemaining && (
                          <button
                            type="button"
                            onClick={() => handleTogglePin(row.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              row.isPinned
                                ? 'text-amber-600 dark:text-[#F5B742] bg-amber-50 dark:bg-amber-950/60'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                            title={row.isPinned ? 'Custom amount locked (click to auto-split)' : 'Auto-split share (click to lock)'}
                          >
                            {row.isPinned ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {/* Settled Toggle Inline */}
                        <button
                          type="button"
                          onClick={() => handleRowChange(row.id, { settled: !row.settled })}
                          className={`p-1.5 rounded-lg transition-colors ${
                            row.settled
                              ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60'
                              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                          }`}
                          title={row.settled ? 'Mark as Pending' : 'Mark as Settled'}
                        >
                          {row.settled ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Circle className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Remove Row Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Remove split"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Running Breakdown Readout */}
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center justify-between font-bold border ${
                  isOverAllocated
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400'
                    : 'bg-white dark:bg-[#131822] border-slate-200/90 dark:border-[#202836] text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="font-numeric">
                  Split: {formatINR(sumOfSplits)} of {formatINR(numAmount)}
                </span>
                <span>
                  {isOverAllocated ? (
                    <span className="text-rose-600 font-extrabold font-numeric">Exceeds total by {formatINR(sumOfSplits - numAmount)}!</span>
                  ) : (
                    <span>Your Share: <span className="font-black font-numeric text-slate-900 dark:text-white">{formatINR(yourShare)}</span></span>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Inline Suggestion for Repayment Settlement */}
        {matchingRepaymentContact && (
          <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-[#171E2A] border border-amber-200/80 dark:border-[#202836] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base flex-shrink-0">💡</span>
              <p className="text-slate-900 dark:text-slate-100 font-medium">
                Looks like <strong className="font-extrabold text-amber-600 dark:text-[#F5B742]">{matchingRepaymentContact.contact.name}</strong>'s repayment of <span className="font-numeric font-bold">{formatINR(numAmount)}</span>.
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleSaveAsSettlement}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold transition-all shadow-xs active:scale-95"
              >
                Save & Settle
              </button>
              <button
                type="button"
                onClick={() => setDismissedSettlementSuggestion(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Dismiss suggestion"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

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
            disabled={isOverAllocated}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold text-slate-950 shadow-md transition-all duration-150 ${
              isOverAllocated
                ? 'bg-slate-400 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/20 active:scale-95'
            }`}
          >
            {initialTransaction ? 'Update Entry' : 'Save Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
