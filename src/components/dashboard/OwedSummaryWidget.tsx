import React, { useMemo } from 'react';
import { Users, ArrowDownLeft, ArrowUpRight, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';

export const OwedSummaryWidget: React.FC = () => {
  const {
    contacts,
    settlements,
    contactBalances,
    totalOwedToMe,
    totalIOwe,
    setCurrentView,
  } = useFinance();

  const balanceMap = useMemo(() => {
    return new Map(contactBalances.map(b => [b.contactId, b.netAmount]));
  }, [contactBalances]);

  const contactMap = useMemo(() => {
    return new Map(contacts.map(c => [c.id, c]));
  }, [contacts]);

  // Top 3 contacts with highest absolute balance
  const topDebts = useMemo(() => {
    const list = contacts
      .map(c => ({
        contact: c,
        balance: balanceMap.get(c.id) || 0,
      }))
      .filter(item => Math.abs(item.balance) > 0.01)
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
      .slice(0, 3);
    return list;
  }, [contacts, balanceMap]);

  // Most recent settlement record
  const latestSettlement = useMemo(() => {
    if (settlements.length === 0) return null;
    return [...settlements].sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    })[0];
  }, [settlements]);

  const netBalance = totalOwedToMe - totalIOwe;

  return (
    <div className="bg-white dark:bg-[#131822] rounded-3xl p-6 border border-slate-200/90 dark:border-[#202836] shadow-sm flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#171E2A] flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Splits & IOUs
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Friends & shared expenses</p>
          </div>
        </div>

        <button
          onClick={() => setCurrentView('people')}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
        >
          <span>View all</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-[#171E2A]/70 rounded-2xl border border-slate-100 dark:border-[#202836]">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
            <span>You are owed</span>
          </div>
          <p className="text-base sm:text-lg font-bold font-numeric text-emerald-600 dark:text-emerald-400 mt-0.5">
            {formatINR(totalOwedToMe)}
          </p>
        </div>

        <div className="border-l border-slate-200 dark:border-[#202836] pl-3.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <ArrowUpRight className="w-3.5 h-3.5 text-[#F43F5E]" />
            <span>You owe</span>
          </div>
          <p className="text-base sm:text-lg font-bold font-numeric text-[#F43F5E] dark:text-rose-400 mt-0.5">
            {formatINR(totalIOwe)}
          </p>
        </div>
      </div>

      {/* Net line */}
      <div className="flex items-center justify-between text-xs px-1">
        <span className="text-slate-500 dark:text-slate-400">Net position:</span>
        <span
          className={`font-bold font-numeric ${
            netBalance > 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : netBalance < 0
              ? 'text-[#F43F5E] dark:text-rose-400'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          {netBalance >= 0 ? '+' : ''}
          {formatINR(netBalance)}
        </span>
      </div>

      {/* Top People List */}
      {topDebts.length > 0 ? (
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-[#202836]">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Top open balances
          </span>
          <div className="space-y-1.5">
            {topDebts.map(({ contact, balance }) => {
              const owesMe = balance > 0;
              return (
                <div
                  key={contact.id}
                  onClick={() => setCurrentView('people')}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#171E2A]/70 hover:bg-slate-50 dark:hover:bg-[#1b2332] border border-slate-100 dark:border-[#202836] cursor-pointer transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-[#202836] text-slate-700 dark:text-slate-200 flex items-center justify-center font-semibold text-[11px]">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {contact.name}
                    </span>
                  </div>

                  <span
                    className={`font-bold font-numeric flex-shrink-0 ${
                      owesMe
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-[#F43F5E] dark:text-rose-400'
                    }`}
                  >
                    {owesMe ? `+${formatINR(balance)}` : `-${formatINR(Math.abs(balance))}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 bg-slate-50 dark:bg-[#171E2A]/40 rounded-2xl border border-dashed border-slate-200 dark:border-[#202836]">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">All debts and IOUs are square!</p>
        </div>
      )}

      {/* Recently Settled Footer */}
      {latestSettlement && (
        <div
          onClick={() => setCurrentView('people')}
          className="pt-2.5 border-t border-slate-100 dark:border-[#202836] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span className="truncate">
              Recent: <span className="font-semibold text-slate-700 dark:text-slate-200">{contactMap.get(latestSettlement.contactId)?.name || 'Contact'}</span> settled <span className="font-numeric font-semibold">{formatINR(latestSettlement.amount)}</span>
            </span>
          </div>
          <span className="flex-shrink-0 font-medium text-[10px] text-slate-400 ml-2">
            {formatDate(latestSettlement.date)}
          </span>
        </div>
      )}
    </div>
  );
};
