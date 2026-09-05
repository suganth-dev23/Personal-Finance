import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Plus,
  Receipt,
  Trash2,
  CheckSquare,
  Square,
  Edit2,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types/finance';
import { formatINR } from '../../utils/currency';
import { formatDate, getMonthName } from '../../utils/date';
import { IconRenderer } from '../common/IconRenderer';

interface TransactionListViewProps {
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

type GroupByMode = 'none' | 'month' | 'year';

export const TransactionListView: React.FC<TransactionListViewProps> = ({
  onOpenAddModal,
  onEditTransaction,
}) => {
  const {
    transactions,
    categories,
    contacts,
    deleteTransaction,
    deleteMultipleTransactions,
  } = useFinance();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | TransactionType>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'this_month' | 'last_month' | 'last_3_months' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [groupBy, setGroupBy] = useState<GroupByMode>('none');
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());

  // Distinct person suggestions across all transactions
  const distinctPersons = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.person && t.person.trim()) {
        set.add(t.person.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [transactions]);

  // Category map for quick color & icon lookup
  const categoryMap = useMemo(() => {
    return new Map(categories.map(c => [c.name.toLowerCase(), c]));
  }, [categories]);

  // Contact map for quick split person lookup
  const contactMap = useMemo(() => {
    return new Map(contacts.map(c => [c.id, c]));
  }, [contacts]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return transactions.filter(tx => {
      // 1. Search filter (includes description, person, category, referenceId, amount)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(query);
        const matchesPerson = tx.person?.toLowerCase().includes(query);
        const matchesCat = tx.category.toLowerCase().includes(query);
        const matchesRef = tx.referenceId?.toLowerCase().includes(query);
        const matchesAmount = tx.amount.toString().includes(query);
        if (!matchesDesc && !matchesPerson && !matchesCat && !matchesRef && !matchesAmount) {
          return false;
        }
      }

      // 2. Person filter
      if (selectedPerson === 'none') {
        if (tx.person && tx.person.trim()) return false;
      } else if (selectedPerson !== 'all') {
        if (tx.person?.toLowerCase() !== selectedPerson.toLowerCase()) return false;
      }

      // 3. Category filter
      if (selectedCategory !== 'all' && tx.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // 4. Type filter
      if (selectedType !== 'all' && tx.type !== selectedType) {
        return false;
      }

      // 5. Payment Method filter
      if (selectedMethod !== 'all' && tx.paymentMethod !== selectedMethod) {
        return false;
      }

      // 6. Source filter
      if (selectedSource !== 'all' && tx.source !== selectedSource) {
        return false;
      }

      // 7. Date Range filter
      if (dateRange === 'this_month') {
        const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        if (!tx.date.startsWith(currentMonthKey)) return false;
      } else if (dateRange === 'last_month') {
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
        if (!tx.date.startsWith(lastMonthKey)) return false;
      } else if (dateRange === 'last_3_months') {
        const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1);
        const txDate = new Date(tx.date);
        if (txDate < threeMonthsAgo) return false;
      } else if (dateRange === 'custom') {
        if (customStartDate && tx.date < customStartDate) return false;
        if (customEndDate && tx.date > customEndDate) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    transactions,
    searchTerm,
    selectedPerson,
    selectedCategory,
    selectedType,
    selectedMethod,
    selectedSource,
    dateRange,
    customStartDate,
    customEndDate,
  ]);

  // Quick stats on filtered result
  const filteredIncome = useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'credit').reduce((a, b) => a + b.amount, 0);
  }, [filteredTransactions]);

  const filteredExpense = useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'debit').reduce((a, b) => a + b.amount, 0);
  }, [filteredTransactions]);

  const filteredNet = filteredIncome - filteredExpense;

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedTxIds.size === filteredTransactions.length) {
      setSelectedTxIds(new Set());
    } else {
      setSelectedTxIds(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedTxIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedTxIds(next);
  };

  const handleBulkDelete = () => {
    if (selectedTxIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedTxIds.size} transactions?`)) {
      deleteMultipleTransactions(Array.from(selectedTxIds));
      setSelectedTxIds(new Set());
    }
  };

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No transactions to export.');
      return;
    }
    const headers = ['Date', 'Type', 'Amount (INR)', 'Description', 'Person', 'Category', 'Payment Method', 'Reference ID', 'Source'];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.type,
      t.amount.toString(),
      `"${t.description.replace(/"/g, '""')}"`,
      `"${(t.person || '—').replace(/"/g, '""')}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      `"${t.paymentMethod}"`,
      `"${t.referenceId || '—'}"`,
      t.source,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dhanveda_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Grouping structure
  const groupedTransactions = useMemo(() => {
    if (groupBy === 'none') {
      return [{
        groupKey: 'All',
        title: 'All Transactions',
        items: filteredTransactions,
        groupIn: filteredIncome,
        groupOut: filteredExpense,
        groupNet: filteredNet,
      }];
    }

    const map: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(t => {
      const key = groupBy === 'month' ? t.date.substring(0, 7) : t.date.substring(0, 4);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });

    return Object.entries(map).map(([key, items]) => {
      const title = groupBy === 'month' ? getMonthName(key) : `Year ${key}`;
      const groupIn = items.filter(t => t.type === 'credit').reduce((a, b) => a + b.amount, 0);
      const groupOut = items.filter(t => t.type === 'debit').reduce((a, b) => a + b.amount, 0);

      return {
        groupKey: key,
        title,
        items,
        groupIn,
        groupOut,
        groupNet: groupIn - groupOut,
      };
    });
  }, [filteredTransactions, groupBy, filteredIncome, filteredExpense, filteredNet]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Hero Overview: Mineral Card with Gold Ledger Highlight */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#131822] text-slate-900 dark:text-white p-6 sm:p-8 border border-slate-200/90 dark:border-[#202836] shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F5B742] to-transparent opacity-80" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400">
                <Receipt className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                TRANSACTION JOURNAL & LEDGER
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Net Operational Cash Flow
            </p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-black font-numeric tracking-tight text-slate-900 dark:text-white">
                {filteredNet >= 0 ? '+' : ''}{formatINR(filteredNet)}
              </h2>
              <span
                className={`text-sm font-semibold ${
                  filteredNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {filteredNet >= 0 ? 'net positive' : 'net outflow'}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {filteredTransactions.length} of {transactions.length} entries matching filters • {formatINR(filteredIncome)} in / {formatINR(filteredExpense)} out
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-4 py-3 bg-slate-100 dark:bg-[#171E2A] hover:bg-slate-200 dark:hover:bg-[#202836] text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-bold transition-colors border border-slate-200/80 dark:border-[#202836]"
              title="Export filtered transactions to CSV"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-sm font-bold text-slate-950 shadow-sm hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>New Transaction</span>
            </button>
          </div>
        </div>

        {/* 4-column summary strip */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200/80 dark:border-[#202836]">
          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Total Inflow</span>
            <p className="text-lg font-bold font-numeric text-emerald-600 dark:text-emerald-400 mt-0.5">
              +{formatINR(filteredIncome)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Total Outflow</span>
            <p className="text-lg font-bold font-numeric text-rose-600 dark:text-rose-400 mt-0.5">
              -{formatINR(filteredExpense)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Entries Shown</span>
            <p className="text-lg font-bold font-numeric text-slate-900 dark:text-white mt-0.5">
              {filteredTransactions.length}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Ledger Velocity</span>
            <p className={`text-lg font-bold font-numeric mt-0.5 ${
              filteredNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {filteredNet >= 0 ? '+' : ''}{formatINR(filteredNet)}
            </p>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            All Transactions
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Search, filter, or group by month &amp; year
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {filteredTransactions.length} of {transactions.length} records
        </span>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#131822] rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/90 dark:border-[#202836] space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by note, person, merchant, category, or amount..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#171E2A] border border-slate-200/90 dark:border-[#202836] rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => {
              setSelectedType('all');
              setSelectedMethod('all');
            }}
            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
              selectedType === 'all' && selectedMethod === 'all'
                ? 'bg-slate-900 text-white dark:bg-[#171E2A] dark:text-[#F5B742] dark:border dark:border-[#F5B742]/40 shadow-xs'
                : 'bg-slate-100 text-slate-600 dark:bg-[#171E2A]/70 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#171E2A]'
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('debit')}
            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
              selectedType === 'debit'
                ? 'bg-[#F43F5E] text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100'
            }`}
          >
            Expenses
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('credit')}
            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
              selectedType === 'credit'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethod(selectedMethod === 'UPI' ? 'all' : 'UPI')}
            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
              selectedMethod === 'UPI'
                ? 'bg-slate-900 text-white dark:bg-[#171E2A] dark:text-[#F5B742] dark:border dark:border-[#F5B742]/40 shadow-xs'
                : 'bg-slate-100 text-slate-600 dark:bg-[#171E2A]/70 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#171E2A]'
            }`}
          >
            UPI
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethod(selectedMethod.includes('Card') ? 'all' : 'Credit Card')}
            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
              selectedMethod.includes('Card')
                ? 'bg-slate-900 text-white dark:bg-[#171E2A] dark:text-[#F5B742] dark:border dark:border-[#F5B742]/40 shadow-xs'
                : 'bg-slate-100 text-slate-600 dark:bg-[#171E2A]/70 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#171E2A]'
            }`}
          >
            Cards
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethod(selectedMethod === 'Cash' ? 'all' : 'Cash')}
            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
              selectedMethod === 'Cash'
                ? 'bg-slate-900 text-white dark:bg-[#171E2A] dark:text-[#F5B742] dark:border dark:border-[#F5B742]/40 shadow-xs'
                : 'bg-slate-100 text-slate-600 dark:bg-[#171E2A]/70 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#171E2A]'
            }`}
          >
            Cash
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 pt-2 border-t border-slate-100 dark:border-[#202836]">
          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Timeframe
            </label>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as any)}
              className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-[#171E2A] border border-slate-200/90 dark:border-[#202836] rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Time</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Person Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Person
            </label>
            <select
              value={selectedPerson}
              onChange={e => setSelectedPerson(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-[#171E2A] border border-slate-200/90 dark:border-[#202836] rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All People</option>
              {distinctPersons.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              <option value="none">Unspecified (—)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-[#171E2A] border border-slate-200/90 dark:border-[#202836] rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Type
            </label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as any)}
              className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-[#171E2A] border border-slate-200/90 dark:border-[#202836] rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="debit">Expenses Only</option>
              <option value="credit">Income Only</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Method
            </label>
            <select
              value={selectedMethod}
              onChange={e => setSelectedMethod(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-[#171E2A] border border-slate-200/90 dark:border-[#202836] rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Wallet">Wallet</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Source
            </label>
            <select
              value={selectedSource}
              onChange={e => setSelectedSource(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-[#171E2A] border border-slate-200/90 dark:border-[#202836] rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Sources</option>
              <option value="manual">Manual Entry</option>
              <option value="pdf">PDF Statement</option>
              <option value="csv">CSV Statement</option>
            </select>
          </div>

          {/* Grouping */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Group View
            </label>
            <select
              value={groupBy}
              onChange={e => setGroupBy(e.target.value as GroupByMode)}
              className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-[#171E2A] border border-slate-200/90 dark:border-[#202836] rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="none">Flat List</option>
              <option value="month">Group by Month</option>
              <option value="year">Group by Year</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Picker when active */}
        {dateRange === 'custom' && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-[#202836] text-xs">
            <span className="text-slate-400 font-medium">Custom Range:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 dark:bg-[#171E2A] border border-slate-200/90 dark:border-[#202836] rounded-lg text-slate-800 dark:text-slate-200 text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 dark:bg-[#171E2A] border border-slate-200/90 dark:border-[#202836] rounded-lg text-slate-800 dark:text-slate-200 text-xs"
            />
          </div>
        )}
      </div>

      {/* Bulk Action Bar when items selected */}
      {selectedTxIds.size > 0 && (
        <div className="bg-slate-900 dark:bg-[#131822] text-white rounded-2xl p-4 flex items-center justify-between border border-slate-800 dark:border-[#202836] shadow-xl shadow-black/20 transition-all">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-[#F5B742] border border-amber-500/20">
              {selectedTxIds.size} transaction{selectedTxIds.size > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTxIds(new Set())}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-[#171E2A] dark:hover:bg-[#202836] text-xs font-semibold text-slate-300 border border-slate-700/60 dark:border-[#202836] transition-colors"
            >
              Deselect All
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Grouped or Flat Transaction Tables */}
      <div className="space-y-6">
        {groupedTransactions.map(group => {
          if (group.items.length === 0) {
            return (
              <div
                key={group.groupKey}
                className="bg-white dark:bg-[#131822] rounded-3xl p-12 text-center border border-slate-200/90 dark:border-[#202836] shadow-xs"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#171E2A] flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                  No transactions match your filters
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Try clearing your search query, adjusting the timeframe, or changing the person/category filter.
                </p>
              </div>
            );
          }

          return (
            <div
              key={group.groupKey}
              className="bg-white dark:bg-[#131822] rounded-3xl shadow-sm border border-slate-200/90 dark:border-[#202836] overflow-hidden"
            >
              {/* Group Header (if grouped) */}
              {groupBy !== 'none' && (
                <div className="bg-slate-50 dark:bg-[#171E2A]/80 px-5 py-3 border-b border-slate-200/90 dark:border-[#202836] flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">{group.title} ({group.items.length})</span>
                  <div className="flex items-center gap-3 font-numeric font-semibold">
                    <span className="text-emerald-600 dark:text-emerald-400">+{formatINR(group.groupIn)}</span>
                    <span className="text-slate-300 dark:text-slate-600">/</span>
                    <span className="text-[#F43F5E] dark:text-rose-400">-{formatINR(group.groupOut)}</span>
                  </div>
                </div>
              )}

              {/* Mobile Cards Feed (matching minimalist mockup) */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
                {group.items.map(tx => {
                  const isCredit = tx.type === 'credit';
                  const isSelected = selectedTxIds.has(tx.id);
                  const catInfo = categoryMap.get(tx.category.toLowerCase());

                  return (
                    <div
                      key={tx.id}
                      className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                        isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => toggleSelectOne(tx.id)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${catInfo?.color || '#64748b'}20`,
                            color: catInfo?.color || '#64748b',
                          }}
                        >
                          <IconRenderer name={catInfo?.icon || 'Tag'} className="w-5 h-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {tx.description}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span
                              className="px-2 py-0.2 rounded-full text-[10px] font-bold"
                              style={{
                                backgroundColor: `${catInfo?.color || '#64748b'}15`,
                                color: catInfo?.color || '#64748b',
                              }}
                            >
                              {tx.category}
                            </span>
                            {tx.person && (
                              <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-[#171E2A] border border-transparent dark:border-[#202836] text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                                {tx.person}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-numeric">
                              {formatDate(tx.date)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-base font-extrabold ${
                            isCredit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {isCredit ? '+' : '-'}{formatINR(tx.amount)}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete transaction "${tx.description}"?`)) {
                                deleteTransaction(tx.id);
                              }
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Transactions Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-[#202836] bg-slate-50/70 dark:bg-[#171E2A]/50 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4 w-10 text-center">
                        <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          {selectedTxIds.size === filteredTransactions.length && filteredTransactions.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Description / Merchant</th>
                      <th className="py-3 px-4">Person</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#202836] text-sm">
                    {group.items.map(tx => {
                      const isCredit = tx.type === 'credit';
                      const isSelected = selectedTxIds.has(tx.id);
                      const catInfo = categoryMap.get(tx.category.toLowerCase());

                      return (
                        <tr
                          key={tx.id}
                          className={`hover:bg-slate-50/70 dark:hover:bg-[#171E2A]/40 transition-colors ${
                            isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => toggleSelectOne(tx.id)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-medium font-numeric">
                            {formatDate(tx.date)}
                          </td>

                          {/* Description */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  backgroundColor: `${catInfo?.color || '#64748b'}18`,
                                  color: catInfo?.color || '#64748b',
                                }}
                              >
                                <IconRenderer name={catInfo?.icon || 'Tag'} className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                                  {tx.description}
                                </p>
                                {tx.referenceId && (
                                  <p className="text-[11px] text-slate-400 font-numeric mt-0.5">
                                    Ref: {tx.referenceId}
                                  </p>
                                )}
                                {Array.isArray(tx.splitWith) && tx.splitWith.length > 0 && (() => {
                                  const splits = tx.splitWith!;
                                  if (splits.length === 1) {
                                    const split = splits[0];
                                    const personName = split.contactId
                                      ? contactMap.get(split.contactId)?.name || 'Contact'
                                      : split.label || 'Unnamed Person';
                                    const isSettled = split.settled;
                                    const isTheyOweMe = split.direction === 'they_owe_me';

                                    return (
                                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                        <span
                                          className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium font-numeric ${
                                            isSettled
                                              ? 'bg-slate-100 text-slate-500 dark:bg-[#171E2A] dark:text-slate-400 line-through'
                                              : isTheyOweMe
                                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                                          }`}
                                        >
                                          Split with {personName} · {formatINR(split.amount)} {split.settled ? '(Settled)' : isTheyOweMe ? 'owed' : 'you owe'}
                                        </span>
                                      </div>
                                    );
                                  } else {
                                    const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
                                    const isSettled = splits.every(s => s.settled);
                                    const tooltip = splits
                                      .map(
                                        s =>
                                          `${
                                            s.contactId
                                              ? contactMap.get(s.contactId)?.name || 'Contact'
                                              : s.label || 'Unnamed'
                                          }: ${formatINR(s.amount)}`
                                      )
                                      .join(' • ');

                                    return (
                                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                        <span
                                          title={tooltip}
                                          className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium font-numeric ${
                                            isSettled
                                              ? 'bg-slate-100 text-slate-500 dark:bg-[#171E2A] dark:text-slate-400 line-through'
                                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                          }`}
                                        >
                                          Split with {splits.length} people · {formatINR(totalSplit)} owed{' '}
                                          {isSettled ? '(Settled)' : ''}
                                        </span>
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            </div>
                          </td>

                          {/* Person (Plain label) */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 font-medium">
                            {tx.person ? (
                              <span className="font-medium text-slate-700 dark:text-slate-300">{tx.person}</span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>

                          {/* Category Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: `${catInfo?.color || '#64748b'}15`,
                                color: catInfo?.color || '#64748b',
                              }}
                            >
                              {tx.category}
                            </span>
                          </td>

                          {/* Payment Method */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 font-medium">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#171E2A] text-slate-700 dark:text-slate-300 font-medium">
                              {tx.paymentMethod}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold font-numeric text-base">
                            <span
                              className={
                                isCredit
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-900 dark:text-white'
                              }
                            >
                              {isCredit ? '+' : '-'}{formatINR(tx.amount)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onEditTransaction(tx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#171E2A] transition-colors"
                                title="Edit transaction"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete transaction "${tx.description}"?`)) {
                                    deleteTransaction(tx.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
