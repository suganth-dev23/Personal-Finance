import React, { useState, useMemo } from 'react';
import {
  Plus,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  Edit3,
  Trash2,
  Search,
  CalendarCheck,
  CreditCard,
  History,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { RecurringPayment } from '../../types/finance';
import { formatINR } from '../../utils/currency';
import { formatDate, getCurrentMonthYear } from '../../utils/date';
import { calculateMonthlyEquivalent, getPaymentSchedule } from '../../utils/recurringDates';
import { IconRenderer } from '../common/IconRenderer';
import { RecurringPaymentModal } from './RecurringPaymentModal';
import { MarkPaidModal } from './MarkPaidModal';

type FilterTab = 'all' | 'active' | 'paused';

export const RecurringPaymentsView: React.FC = () => {
  const {
    recurringPayments,
    recurringPaymentLogs,
    upcomingRecurringPayments,
    overdueRecurringPayments,
    totalMonthlyRecurringCommitment,
    categories,
    addRecurringPayment,
    updateRecurringPayment,
    deleteRecurringPayment,
    pauseRecurringPayment,
    markRecurringPaymentPaid,
  } = useFinance();

  // State for modals
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [selectedPaymentForEdit, setSelectedPaymentForEdit] = useState<RecurringPayment | null>(null);

  const [isMarkPaidModalOpen, setIsMarkPaidModalOpen] = useState<boolean>(false);
  const [paymentForMarkPaid, setPaymentForMarkPaid] = useState<RecurringPayment | null>(null);
  const [targetDueDateForMarkPaid, setTargetDueDateForMarkPaid] = useState<string>('');

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Expanded history for specific recurring payments
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);

  const { monthName, key: currentMonthKey } = getCurrentMonthYear();

  // Category map for quick icon & color lookups
  const categoryMap = useMemo(() => {
    return new Map(categories.map(c => [c.name.toLowerCase(), c]));
  }, [categories]);

  // Calculate total paid this month from recurring logs
  const paidThisMonthTotal = useMemo(() => {
    return recurringPaymentLogs
      .filter(log => log.paidDate && log.paidDate.startsWith(currentMonthKey))
      .reduce((sum, log) => sum + log.amount, 0);
  }, [recurringPaymentLogs, currentMonthKey]);

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    return recurringPayments.filter(p => {
      // Tab filter
      if (activeTab === 'active' && !p.isActive) return false;
      if (activeTab === 'paused' && p.isActive) return false;

      // Category filter
      if (selectedCategory !== 'all' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesCategory = p.category.toLowerCase().includes(query);
        const matchesNotes = p.notes ? p.notes.toLowerCase().includes(query) : false;
        if (!matchesName && !matchesCategory && !matchesNotes) return false;
      }

      return true;
    });
  }, [recurringPayments, activeTab, selectedCategory, searchQuery]);

  // Handlers
  const handleOpenAdd = () => {
    setSelectedPaymentForEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (payment: RecurringPayment) => {
    setSelectedPaymentForEdit(payment);
    setIsFormModalOpen(true);
  };

  const handleSavePayment = (
    data: Omit<RecurringPayment, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (selectedPaymentForEdit) {
      updateRecurringPayment(selectedPaymentForEdit.id, data);
    } else {
      addRecurringPayment(data);
    }
  };

  const handleOpenMarkPaid = (payment: RecurringPayment, dueDate: string) => {
    setPaymentForMarkPaid(payment);
    setTargetDueDateForMarkPaid(dueDate);
    setIsMarkPaidModalOpen(true);
  };

  const handleDelete = (payment: RecurringPayment) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${payment.name}"? All associated payment history for this commitment will also be removed.`
      )
    ) {
      deleteRecurringPayment(payment.id);
    }
  };

  const toggleHistory = (id: string) => {
    setExpandedPaymentId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Hero Overview: Mineral Card with Gold Commitment Highlight */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#131822] text-slate-900 dark:text-white p-6 sm:p-8 border border-slate-200/90 dark:border-[#202836] shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400">
                <CalendarClock className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Fixed Commitments & Bills
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Normalized Monthly Obligation
            </p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-black font-numeric tracking-tight text-slate-900 dark:text-white">
                {formatINR(totalMonthlyRecurringCommitment)}
              </h2>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                / month
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {recurringPayments.filter(p => p.isActive).length} active commitments • {formatINR(paidThisMonthTotal)} paid so far in {monthName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-sm font-bold text-slate-950 shadow-sm hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>New Recurring Bill</span>
            </button>
          </div>
        </div>

        {/* Quick summary strip */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200/80 dark:border-[#202836]">
          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Active Commitments</span>
            <p className="text-lg font-bold font-numeric text-slate-900 dark:text-white mt-0.5">
              {recurringPayments.filter(p => p.isActive).length}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Upcoming (Next 30d)</span>
            <p className="text-lg font-bold font-numeric text-slate-900 dark:text-white mt-0.5">
              {upcomingRecurringPayments.length}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Overdue Alerts</span>
            <p className={`text-lg font-bold font-numeric mt-0.5 ${
              overdueRecurringPayments.length > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-900 dark:text-white'
            }`}>
              {overdueRecurringPayments.length}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-[#171E2A] p-3.5 border border-slate-200/60 dark:border-[#202836]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Paused</span>
            <p className="text-lg font-bold font-numeric text-slate-900 dark:text-white mt-0.5">
              {recurringPayments.filter(p => !p.isActive).length}
            </p>
          </div>
        </div>
      </div>

      {/* Overdue Alerts Section (if any overdue commitments) */}
      {overdueRecurringPayments.length > 0 && (
        <div className="rounded-3xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/20 p-5 sm:p-6 transition-all">
          <div className="flex items-center gap-2.5 mb-4 text-rose-700 dark:text-rose-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <h3 className="font-bold text-base">Overdue Payments Requiring Attention</h3>
            <span className="ml-auto rounded-full bg-rose-200/70 dark:bg-rose-900/60 px-2.5 py-0.5 text-xs font-black text-rose-800 dark:text-rose-200">
              {overdueRecurringPayments.length} Overdue
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overdueRecurringPayments.map(item => {
              const cat = categoryMap.get(item.category.toLowerCase());
              return (
                <div
                  key={`overdue-${item.id}-${item.dueDate}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white dark:bg-[#131822] p-4 border border-rose-200 dark:border-rose-900/40 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-bold"
                      style={{ backgroundColor: cat?.color || '#e11d48' }}
                    >
                      <IconRenderer name={cat?.icon || 'Tag'} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center rounded-md bg-rose-100 dark:bg-rose-900/40 px-1.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300 font-numeric">
                          {item.daysOverdue === 0 ? 'Due Today' : `${item.daysOverdue}d overdue`}
                        </span>
                        <span className="text-xs text-slate-400">
                          Due {formatDate(item.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-base font-numeric text-slate-900 dark:text-white">
                        {formatINR(item.amount)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenMarkPaid(item, item.dueDate)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Pay</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Due Shelf (Next 30 Days) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Upcoming Due Schedule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bills, subscriptions, and investments scheduled in the next 30 days
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {upcomingRecurringPayments.length} upcoming
          </span>
        </div>

        {upcomingRecurringPayments.length === 0 ? (
          <div className="rounded-3xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#131822] p-8 text-center">
            <CalendarCheck className="mx-auto h-10 w-10 text-emerald-500 dark:text-emerald-400 mb-2" />
            <h4 className="font-bold text-slate-900 dark:text-white">All Caught Up!</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              No pending recurring payments scheduled for the rest of this cycle.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingRecurringPayments.map(item => {
              const cat = categoryMap.get(item.category.toLowerCase());
              const isDueToday = item.daysUntilDue === 0;
              const isDueSoon = item.daysUntilDue <= 3;

              return (
                <div
                  key={`upcoming-${item.id}-${item.nextDueDate}`}
                  className={`group relative rounded-3xl border transition-all p-5 bg-white dark:bg-[#131822] hover:border-amber-400/50 dark:hover:border-amber-500/30 shadow-sm ${
                    isDueToday
                      ? 'border-amber-500/60 dark:border-amber-500/50 ring-1 ring-amber-500/20'
                      : 'border-slate-200/90 dark:border-[#202836]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white font-bold shadow-sm"
                        style={{ backgroundColor: cat?.color || '#3b82f6' }}
                      >
                        <IconRenderer name={cat?.icon || 'Tag'} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {item.category} • {item.frequency}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold font-numeric ${
                        isDueToday
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 animate-pulse'
                          : isDueSoon
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          : 'bg-slate-100 dark:bg-[#171E2A] text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isDueToday
                        ? 'Due Today'
                        : item.daysUntilDue === 1
                        ? 'Due Tomorrow'
                        : `In ${item.daysUntilDue} days`}
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#171E2A] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Due Date</span>
                      <span className="text-xs font-semibold font-numeric text-slate-700 dark:text-slate-300">
                        {formatDate(item.nextDueDate)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Amount</span>
                      <span className="text-base font-bold font-numeric text-slate-900 dark:text-white">
                        {formatINR(item.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenMarkPaid(item, item.nextDueDate)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-[#171E2A] dark:hover:bg-[#202836] border border-transparent dark:border-[#202836] py-2 px-3 text-xs font-bold text-white transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Mark Paid</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/90 dark:border-[#202836] text-slate-500 hover:bg-slate-50 dark:hover:bg-[#171E2A] transition-colors"
                      title="Edit Commitment"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Declared Recurring Commitments */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#131822] p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              All Recurring Commitments
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your templates, pause subscriptions, or inspect payment histories
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-[#171E2A] p-1 border border-slate-200/60 dark:border-[#202836]/60">
              <button
                onClick={() => setActiveTab('all')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-[#131822] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({recurringPayments.length})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  activeTab === 'active'
                    ? 'bg-white dark:bg-[#131822] text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Active ({recurringPayments.filter(p => p.isActive).length})
              </button>
              <button
                onClick={() => setActiveTab('paused')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  activeTab === 'paused'
                    ? 'bg-white dark:bg-[#131822] text-slate-700 dark:text-slate-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Paused ({recurringPayments.filter(p => !p.isActive).length})
              </button>
            </div>

            {/* Category dropdown */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-100 dark:bg-[#171E2A] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search input */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by commitment name, category, or notes..."
            className="w-full rounded-2xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Payments List */}
        {filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No recurring commitments match the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#171E2A]">
            {filteredPayments.map(payment => {
              const cat = categoryMap.get(payment.category.toLowerCase());
              const schedule = getPaymentSchedule(payment, recurringPaymentLogs);
              const monthlyEquivalent = calculateMonthlyEquivalent(payment.amount, payment.frequency);
              const isExpanded = expandedPaymentId === payment.id;

              // Filter logs for this payment
              const logs = recurringPaymentLogs
                .filter(l => l.recurringPaymentId === payment.id)
                .sort((a, b) => b.dueDate.localeCompare(a.dueDate));

              return (
                <div key={payment.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Icon & Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white font-bold shadow-sm"
                        style={{ backgroundColor: cat?.color || '#3b82f6' }}
                      >
                        <IconRenderer name={cat?.icon || 'Tag'} className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {payment.name}
                          </h4>
                          {!payment.isActive && (
                            <span className="rounded-md bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                              Paused
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-medium">{payment.category}</span>
                          <span>•</span>
                          <span className="capitalize">{payment.frequency}</span>
                          {payment.dayOfMonth && (
                            <>
                              <span>•</span>
                              <span>Day {payment.dayOfMonth}</span>
                            </>
                          )}
                          {payment.paymentMethod && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                {payment.paymentMethod}
                              </span>
                            </>
                          )}
                        </div>

                        {payment.notes && (
                          <p className="mt-1 text-[11px] text-slate-400 italic truncate max-w-md">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Amount, Schedule, and Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-14 sm:pl-0">
                      <div className="text-left sm:text-right">
                        <p className="text-base font-bold font-numeric text-slate-900 dark:text-white">
                          {formatINR(payment.amount)}
                        </p>
                        {payment.frequency !== 'monthly' && (
                          <span className="text-[11px] font-numeric text-slate-400">
                            ≈ {formatINR(monthlyEquivalent)}/mo
                          </span>
                        )}
                        {schedule.activeDueDate && payment.isActive && (
                          <p className="text-[11px] text-slate-400">
                            {schedule.isOverdue ? (
                              <span className="text-rose-500 font-medium">
                                Overdue: {formatDate(schedule.activeDueDate)}
                              </span>
                            ) : (
                              <span>Next: {formatDate(schedule.activeDueDate)}</span>
                            )}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        {payment.isActive && schedule.activeDueDate && (
                          <button
                            onClick={() => handleOpenMarkPaid(payment, schedule.activeDueDate!)}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-2.5 py-1.5 text-xs font-bold transition-colors"
                            title="Mark as Paid"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Pay</span>
                          </button>
                        )}

                        <button
                          onClick={() => toggleHistory(payment.id)}
                          className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-colors ${
                            isExpanded
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-500'
                              : 'border-slate-200/90 dark:border-[#202836] text-slate-400 hover:bg-slate-50 dark:hover:bg-[#171E2A]'
                          }`}
                          title="View Payment Logs"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => pauseRecurringPayment(payment.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/90 dark:border-[#202836] text-slate-400 hover:bg-slate-50 dark:hover:bg-[#171E2A] transition-colors"
                          title={payment.isActive ? 'Pause Commitment' : 'Resume Commitment'}
                        >
                          {payment.isActive ? (
                            <Pause className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5 text-emerald-500" />
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenEdit(payment)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/90 dark:border-[#202836] text-slate-400 hover:bg-slate-50 dark:hover:bg-[#171E2A] transition-colors"
                          title="Edit Commitment"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(payment)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/90 dark:border-[#202836] text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                          title="Delete Commitment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable History Drawer */}
                  {isExpanded && (
                    <div className="mt-3.5 rounded-2xl bg-slate-50 dark:bg-[#171E2A]/70 p-4 border border-slate-200/60 dark:border-[#202836]/60">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <History className="h-4 w-4 text-amber-500" />
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Payment Logs History ({logs.length})
                          </h5>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {logs.length > 0 ? 'Recorded payments for this commitment' : 'No records yet'}
                        </span>
                      </div>

                      {logs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">
                          No payments have been logged yet for this commitment.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {logs.map(log => (
                            <div
                              key={log.id}
                              className="flex items-center justify-between rounded-xl bg-white dark:bg-[#131822] p-2.5 border border-slate-200/60 dark:border-[#202836] text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <div>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    Cycle Due: {formatDate(log.dueDate)}
                                  </span>
                                  {log.paidDate && (
                                    <p className="text-[11px] text-slate-400">
                                      Paid on {formatDate(log.paidDate)}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="font-bold font-numeric text-slate-900 dark:text-white">
                                  {formatINR(log.amount)}
                                </span>
                                {log.linkedTransactionId && (
                                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                    Ledger Linked
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <RecurringPaymentModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        initialPayment={selectedPaymentForEdit}
        onSave={handleSavePayment}
      />

      <MarkPaidModal
        isOpen={isMarkPaidModalOpen}
        onClose={() => setIsMarkPaidModalOpen(false)}
        payment={paymentForMarkPaid}
        targetDueDate={targetDueDateForMarkPaid}
        onConfirm={(paymentId, dueDate, actualAmount, createTransaction) => {
          markRecurringPaymentPaid(
            paymentId,
            dueDate,
            actualAmount,
            undefined,
            createTransaction
          );
        }}
      />
    </div>
  );
};
