import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { IconRenderer } from '../common/IconRenderer';

export const RecentTransactions: React.FC = () => {
  const { transactions, categories, contacts, setCurrentView } = useFinance();

  // Sort descending (newest transaction first)
  const recentList = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      })
      .slice(0, 6);
  }, [transactions]);

  const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c]));
  const contactMap = new Map(contacts.map(c => [c.id, c]));

  return (
    <div className="bg-white dark:bg-[#131822] rounded-3xl p-6 shadow-xs border border-slate-200/90 dark:border-[#202836] flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Transactions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Latest entries across all accounts</p>
          </div>
          <button
            onClick={() => setCurrentView('transactions')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentList.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">No transactions found.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#202836]">
            {recentList.map(tx => {
              const isCredit = tx.type === 'credit';
              const catInfo = categoryMap.get(tx.category.toLowerCase());
              const hasSplits = Array.isArray(tx.splitWith) && tx.splitWith.length > 0;
              let splitBadgeText = '';
              let isSplitSettled = false;
              let isTheyOweMe = true;
              let splitTooltip = '';

              if (hasSplits) {
                const splits = tx.splitWith!;
                if (splits.length === 1) {
                  const split = splits[0];
                  const personName = split.contactId
                    ? contactMap.get(split.contactId)?.name || 'Contact'
                    : split.label || 'Unnamed Person';
                  isSplitSettled = split.settled;
                  isTheyOweMe = split.direction === 'they_owe_me';
                  splitBadgeText = `Split with ${personName} · ${formatINR(split.amount)} ${
                    split.settled ? '(Settled)' : isTheyOweMe ? 'owed' : 'you owe'
                  }`;
                } else {
                  const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
                  isSplitSettled = splits.every(s => s.settled);
                  splitBadgeText = `Split with ${splits.length} people · ${formatINR(totalSplit)} owed ${
                    isSplitSettled ? '(Settled)' : ''
                  }`;
                  splitTooltip = splits
                    .map(
                      s =>
                        `${
                          s.contactId
                            ? contactMap.get(s.contactId)?.name || 'Contact'
                            : s.label || 'Unnamed'
                        }: ${formatINR(s.amount)}`
                    )
                    .join(' • ');
                }
              }

              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${catInfo?.color || '#64748b'}18`,
                        color: catInfo?.color || '#64748b',
                      }}
                    >
                      <IconRenderer name={catInfo?.icon || 'Tag'} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>
                          {formatDate(tx.date)} • {tx.paymentMethod}
                          {tx.person ? ` • with ${tx.person}` : ''}
                        </span>
                        {hasSplits && (
                          <span
                            title={splitTooltip || undefined}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium font-numeric ${
                              isSplitSettled
                                ? 'bg-slate-100 text-slate-500 dark:bg-[#171E2A] dark:text-slate-400 line-through'
                                : isTheyOweMe
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                            }`}
                          >
                            {splitBadgeText}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 font-semibold font-numeric text-sm">
                    <span
                      className={
                        isCredit
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                      }
                    >
                      {isCredit ? '+' : '-'}{formatINR(tx.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
