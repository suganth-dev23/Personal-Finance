import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  CheckCircle2,
  Circle,
  HandCoins,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Receipt,
  History,
  Check,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Contact, Transaction, SplitEntry, SettlementRecord } from '../../types/finance';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { SettleUpModal } from './SettleUpModal';
import { EditSplitModal } from './EditSplitModal';
import { AddContactModal } from './AddContactModal';
import { SettlementHistoryView } from './SettlementHistoryView';
import { SettleSplitModal } from './SettleSplitModal';

export const PeopleView: React.FC = () => {
  const {
    contacts,
    transactions,
    settlements,
    contactBalances,
    totalOwedToMe,
    totalIOwe,
    deleteContact,
    deleteSettlement,
    quickToggleSettleTransaction,
    linkSettlementToTransaction,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'contacts' | 'history'>('contacts');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'they_owe_me' | 'i_owe_them' | 'settled'>('all');
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);

  // Modals state
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [settleContact, setSettleContact] = useState<{
    contact: Contact;
    amount: number;
    settlement?: SettlementRecord;
  } | null>(null);
  const [editingSplitItem, setEditingSplitItem] = useState<{ tx: Transaction; split: SplitEntry } | null>(null);
  const [settleSplitTarget, setSettleSplitTarget] = useState<{
    contact: Contact;
    tx: Transaction;
    split: SplitEntry;
  } | null>(null);
  const [isSettledSectionOpen, setIsSettledSectionOpen] = useState(false);

  // Quick-tick auto-settle link suggestion prompt state
  const [linkSuggestionPrompt, setLinkSuggestionPrompt] = useState<{
    settlementId: string;
    transaction: Transaction;
    contactName: string;
  } | null>(null);

  // Map balances for quick lookup
  const balanceMap = useMemo(() => {
    return new Map(contactBalances.map(b => [b.contactId, b.netAmount]));
  }, [contactBalances]);

  const transactionMap = useMemo(() => {
    return new Map(transactions.map(t => [t.id, t]));
  }, [transactions]);

  // Split contacts into active (non-zero balance) and settled (zero balance)
  const { activeContacts, settledContacts } = useMemo(() => {
    const active: Contact[] = [];
    const settled: Contact[] = [];

    contacts.forEach(c => {
      const bal = balanceMap.get(c.id) || 0;
      if (Math.abs(bal) > 0.01) {
        active.push(c);
      } else {
        settled.push(c);
      }
    });

    // Sort active by absolute balance descending
    active.sort((a, b) => {
      const balA = Math.abs(balanceMap.get(a.id) || 0);
      const balB = Math.abs(balanceMap.get(b.id) || 0);
      return balB - balA;
    });

    return { activeContacts: active, settledContacts: settled };
  }, [contacts, balanceMap]);

  // Filter contacts by search and filterType
  const filteredActiveContacts = useMemo(() => {
    return activeContacts.filter(c => {
      const bal = balanceMap.get(c.id) || 0;
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterType === 'they_owe_me') return bal > 0;
      if (filterType === 'i_owe_them') return bal < 0;
      if (filterType === 'settled') return false;
      return true;
    });
  }, [activeContacts, balanceMap, searchQuery, filterType]);

  const filteredSettledContacts = useMemo(() => {
    return settledContacts.filter(c => {
      return (
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [settledContacts, searchQuery]);

  const netOverall = totalOwedToMe - totalIOwe;

  // Handle quick tick auto-settle with link suggestion prompt
  const handleQuickTickSettle = (tx: Transaction, split: SplitEntry, contact: Contact) => {
    const createdSettlement = quickToggleSettleTransaction(tx.id, split.id);

    if (createdSettlement) {
      // Find candidate matching transactions
      const targetType = split.direction === 'they_owe_me' ? 'credit' : 'debit';
      const targetAmount = split.amount;
      const splitDateMs = new Date(tx.date).getTime();
      const alreadyLinkedTxIds = new Set(settlements.map(s => s.linkedTransactionId).filter(Boolean));

      const matches = transactions.filter(t => {
        if (t.id === tx.id) return false;
        if (t.type !== targetType) return false;
        if (alreadyLinkedTxIds.has(t.id)) return false;
        if (Math.abs(t.amount - targetAmount) > 0.01) return false;

        // Date proximity within 7 days
        const txDateMs = new Date(t.date).getTime();
        const diffDays = Math.abs(txDateMs - splitDateMs) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      });

      if (matches.length === 1) {
        setLinkSuggestionPrompt({
          settlementId: createdSettlement.id,
          transaction: matches[0],
          contactName: contact.name,
        });
      } else {
        setLinkSuggestionPrompt(null);
      }
    } else {
      setLinkSuggestionPrompt(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            People & Splits
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage shared expense balances, IOUs, and repayment history
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'contacts'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Contacts & Balances</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4 text-emerald-600" />
            <span>Settlement History</span>
            {settlements.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px]">
                {settlements.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Floating Link Suggestion Prompt if triggered */}
      {linkSuggestionPrompt && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 dark:border-emerald-500/40 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-600 text-white flex-shrink-0 mt-0.5">
              <LinkIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Found a matching bank transaction for {linkSuggestionPrompt.contactName}!
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                <span className="font-extrabold text-slate-900 dark:text-white">{linkSuggestionPrompt.transaction.description}</span> ({formatINR(linkSuggestionPrompt.transaction.amount)} on {formatDate(linkSuggestionPrompt.transaction.date)})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
            <button
              onClick={() => {
                linkSettlementToTransaction(
                  linkSuggestionPrompt.settlementId,
                  linkSuggestionPrompt.transaction.id
                );
                setLinkSuggestionPrompt(null);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              Link to Settlement
            </button>
            <button
              onClick={() => setLinkSuggestionPrompt(null)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* View Switcher: Contacts Tab vs History Tab */}
      {activeTab === 'history' ? (
        <SettlementHistoryView onBackToContacts={() => setActiveTab('contacts')} />
      ) : (
        <>
          {/* 4 Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* You Are Owed */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  You Are Owed
                </span>
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {formatINR(totalOwedToMe)}
                </p>
                <p className="text-xs text-slate-400 mt-1">From friends & split bills</p>
              </div>
            </div>

            {/* You Owe */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  You Owe
                </span>
                <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                  {formatINR(totalIOwe)}
                </p>
                <p className="text-xs text-slate-400 mt-1">Pending payments to others</p>
              </div>
            </div>

            {/* Net Balance */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Net Position
                </span>
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p
                  className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    netOverall > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : netOverall < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {netOverall >= 0 ? '+' : ''}
                  {formatINR(netOverall)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {netOverall > 0 ? 'Overall positive balance' : netOverall < 0 ? 'Overall debt balance' : 'All square!'}
                </p>
              </div>
            </div>

            {/* Total People */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Splits
                </span>
                <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <HandCoins className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {activeContacts.length} <span className="text-sm font-semibold text-slate-400">people</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {settledContacts.length} settled / square
                </p>
              </div>
            </div>
          </div>

          {/* Action Bar & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name or notes..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Filter Pills + Add Contact Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    filterType === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('they_owe_me')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    filterType === 'they_owe_me'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Owes Me
                </button>
                <button
                  onClick={() => setFilterType('i_owe_them')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    filterType === 'i_owe_them'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  I Owe
                </button>
              </div>

              <button
                onClick={() => setIsAddContactOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Person</span>
              </button>
            </div>
          </div>

          {/* Active Contacts List */}
          <div className="space-y-4">
            {filteredActiveContacts.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-200">
                  {contacts.length === 0 ? 'No contacts added yet' : 'No active debts matching filter'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Split dinner, grocery, or rent bills with friends when adding any transaction, or add a person here.
                </p>
                <button
                  onClick={() => setIsAddContactOpen(true)}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Add First Person
                </button>
              </div>
            )}

            {filteredActiveContacts.map(contact => {
              const netAmount = balanceMap.get(contact.id) || 0;
              const isOwedToMe = netAmount > 0;
              const isExpanded = expandedContactId === contact.id;

              // Find all SplitEntry items across transactions associated with this contact
              const contactSplitEntries: { tx: Transaction; split: SplitEntry }[] = [];
              transactions.forEach(tx => {
                if (tx.splitWith && Array.isArray(tx.splitWith)) {
                  tx.splitWith.forEach(split => {
                    if (split.contactId === contact.id) {
                      contactSplitEntries.push({ tx, split });
                    }
                  });
                }
              });

              // Settlements associated with this contact
              const contactSettlements = settlements.filter(s => s.contactId === contact.id);

              return (
                <div
                  key={contact.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all"
                >
                  {/* Contact Card Header */}
                  <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 font-black text-lg flex items-center justify-center border border-emerald-500/30">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {contact.name}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {contact.notes || `${contactSplitEntries.length} linked splits`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      {/* Balance Badge */}
                      <div className="text-right">
                        <span
                          className={`text-base sm:text-lg font-black tracking-tight ${
                            isOwedToMe
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isOwedToMe ? `+${formatINR(netAmount)}` : `-${formatINR(Math.abs(netAmount))}`}
                        </span>
                        <p className="text-[11px] font-bold text-slate-400">
                          {isOwedToMe ? 'Owes You' : 'You Owe'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSettleContact({ contact, amount: Math.abs(netAmount) })}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors active:scale-95"
                        >
                          <HandCoins className="w-3.5 h-3.5" />
                          <span>Settle Up</span>
                        </button>

                        <button
                          onClick={() => setExpandedContactId(isExpanded ? null : contact.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title={isExpanded ? 'Collapse' : 'Expand splits'}
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-5 sm:p-6 space-y-5">
                      {/* Linked Transaction Splits */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Split Transactions ({contactSplitEntries.length})</span>
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Tap checkmark to quick-settle full amount
                          </span>
                        </div>

                        {contactSplitEntries.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">
                            No transactions currently tagged with this person.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {contactSplitEntries.map(({ tx, split }) => {
                              const isSettled = split.settled;
                              const matchingSettlement = settlements.find(
                                s => s.sourceTransactionId === tx.id && s.sourceSplitEntryId === split.id
                              );
                              const linkedTxId = split.linkedTransactionId || matchingSettlement?.linkedTransactionId;
                              const linkedTx = linkedTxId ? transactionMap.get(linkedTxId) : null;
                              const isPartial = split.settledAmount !== undefined && split.settledAmount > 0 && !split.settled;

                              return (
                                <div
                                  key={`${tx.id}-${split.id}`}
                                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                    isSettled
                                      ? 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    {/* Quick One-Tap Tick Button */}
                                    <button
                                      onClick={() => handleQuickTickSettle(tx, split, contact)}
                                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                                        isSettled
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'border border-slate-300 dark:border-slate-700 text-slate-400 hover:border-emerald-500 hover:text-emerald-600'
                                      }`}
                                      title={isSettled ? 'Mark as Unsettled' : 'One-tap Mark as Settled in Full'}
                                    >
                                      {isSettled ? (
                                        <Check className="w-4 h-4" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                      )}
                                    </button>

                                    <div className="min-w-0">
                                      <p
                                        className={`text-xs font-bold text-slate-900 dark:text-white truncate ${
                                          isSettled ? 'line-through text-slate-400' : ''
                                        }`}
                                      >
                                        {tx.description}
                                      </p>
                                      <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                                        <span>{formatDate(tx.date)}</span>
                                        <span>•</span>
                                        <span>Total: {formatINR(tx.amount)}</span>
                                        <span>•</span>
                                        <span
                                          className={`font-semibold ${
                                            split.direction === 'they_owe_me'
                                              ? 'text-emerald-600 dark:text-emerald-400'
                                              : 'text-rose-600 dark:text-rose-400'
                                          }`}
                                        >
                                          {split.direction === 'they_owe_me' ? 'They Owe' : 'You Owe'}
                                        </span>
                                      </div>

                                      {/* Linked Bank Transaction Indicator */}
                                      {linkedTx && (
                                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                                          <span className="truncate">
                                            Linked: {linkedTx.description} ({formatINR(linkedTx.amount)})
                                          </span>
                                        </div>
                                      )}

                                      {/* Partial Payment Indicator */}
                                      {isPartial && (
                                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                                          <span>
                                            Partial: {formatINR(split.settledAmount || 0)} paid • {formatINR(split.amount - (split.settledAmount || 0))} open
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span
                                      className={`text-xs font-extrabold ${
                                        isSettled
                                          ? 'text-slate-400 line-through'
                                          : split.direction === 'they_owe_me'
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : 'text-rose-600 dark:text-rose-400'
                                      }`}
                                    >
                                      {formatINR(split.amount)}
                                    </span>

                                    {/* Direct Connect / Settle Modal Button */}
                                    <button
                                      onClick={() => setSettleSplitTarget({ contact, tx, split })}
                                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                                        isSettled || linkedTx
                                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-500/20'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700'
                                      }`}
                                      title="Connect Repayment Bank Transaction"
                                    >
                                      <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />
                                      <span className="hidden sm:inline">{isSettled ? 'Linked' : 'Connect'}</span>
                                    </button>

                                    {/* Edit Split Pencil Icon */}
                                    <button
                                      onClick={() => setEditingSplitItem({ tx, split })}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                      title="Edit Split Details"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Recent Settlement Records History */}
                      {contactSettlements.length > 0 && (
                        <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Recent Settlements ({contactSettlements.length})</span>
                            </h4>

                            <button
                              onClick={() => setActiveTab('history')}
                              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              View all in History →
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            {contactSettlements.slice(0, 4).map(set => {
                              const linkedTx = set.linkedTransactionId
                                ? transactionMap.get(set.linkedTransactionId)
                                : null;

                              return (
                                <div
                                  key={set.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs gap-2"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                      {formatINR(set.amount)}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-300">
                                      {set.note || 'Settlement'}
                                    </span>
                                    <span className="text-[10px] text-slate-400">({formatDate(set.date)})</span>

                                    {linkedTx && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        <span>Linked: {linkedTx.description}</span>
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                    <button
                                      onClick={() => setSettleContact({ contact, amount: set.amount, settlement: set })}
                                      className="text-slate-400 hover:text-emerald-600 p-1 rounded-md transition-colors"
                                      title="Edit Settlement"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>

                                    <button
                                      onClick={() => {
                                        if (window.confirm('Delete this settlement record?')) {
                                          deleteSettlement(set.id);
                                        }
                                      }}
                                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                                      title="Delete Settlement"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Delete Contact Action */}
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => deleteContact(contact.id)}
                          className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete Person & Unlink Splits</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Settled / All Square Section (Collapsible) */}
          {filteredSettledContacts.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsSettledSectionOpen(!isSettledSectionOpen)}
                className="flex items-center justify-between w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Settled / All Square Contacts ({filteredSettledContacts.length})</span>
                </div>
                {isSettledSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isSettledSectionOpen && (
                <div className="mt-3 space-y-2">
                  {filteredSettledContacts.map(contact => (
                    <div
                      key={contact.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold flex items-center justify-center">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{contact.name}</p>
                          <p className="text-[11px] text-slate-400">{contact.notes || 'All square'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px]">
                          ₹0 (Square)
                        </span>
                        <button
                          onClick={() => deleteContact(contact.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                          title="Delete Contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AddContactModal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
      />

      <SettleUpModal
        isOpen={settleContact !== null}
        onClose={() => setSettleContact(null)}
        contact={settleContact?.contact || null}
        suggestedAmount={settleContact?.amount || 0}
        initialSettlement={settleContact?.settlement || null}
      />

      <EditSplitModal
        isOpen={editingSplitItem !== null}
        onClose={() => setEditingSplitItem(null)}
        transaction={editingSplitItem?.tx || null}
        splitEntry={editingSplitItem?.split || null}
      />

      {settleSplitTarget && (
        <SettleSplitModal
          isOpen={true}
          onClose={() => setSettleSplitTarget(null)}
          contact={settleSplitTarget.contact}
          transaction={settleSplitTarget.tx}
          splitEntry={settleSplitTarget.split}
        />
      )}
    </div>
  );
};
