import React from 'react';
import {
  CheckSquare,
  Square,
  AlertTriangle,
  Sparkles,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { StagedTransaction, Category, PaymentMethod } from '../../types/finance';
import { formatINR } from '../../utils/currency';
import { IconRenderer } from '../common/IconRenderer';

interface ReviewStagingTableProps {
  stagedList: StagedTransaction[];
  categories: Category[];
  onToggleSelect: (tempId: string) => void;
  onToggleSelectAll: () => void;
  onUpdateRow: (tempId: string, updated: Partial<StagedTransaction>) => void;
  onRemoveRow: (tempId: string) => void;
  onExcludeDuplicates: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'UPI',
  'Credit Card',
  'Debit Card',
  'Net Banking',
  'Bank Transfer',
  'Cash',
  'Cheque',
  'Other',
];

export const ReviewStagingTable: React.FC<ReviewStagingTableProps> = ({
  stagedList,
  categories,
  onToggleSelect,
  onToggleSelectAll,
  onUpdateRow,
  onRemoveRow,
  onExcludeDuplicates,
}) => {
  const selectedCount = stagedList.filter(t => t.selected).length;
  const duplicateCount = stagedList.filter(t => t.isDuplicate).length;

  const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c]));

  return (
    <div className="space-y-4">
      {/* Top Banner with Stats & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-[#171E2A] rounded-2xl border border-slate-200/80 dark:border-[#202836]">
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="text-slate-700 dark:text-slate-300">
            Total Parsed: <span className="font-bold font-numeric text-slate-900 dark:text-white">{stagedList.length}</span>
          </div>
          <div className="w-px h-3 bg-slate-300 dark:bg-[#202836]" />
          <div className="text-emerald-600 dark:text-emerald-400 font-bold font-numeric">
            {selectedCount} selected for import
          </div>
          {duplicateCount > 0 && (
            <>
              <div className="w-px h-3 bg-slate-300 dark:bg-[#202836]" />
              <div className="text-rose-500 font-bold flex items-center gap-1 font-numeric">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{duplicateCount} duplicates detected</span>
              </div>
            </>
          )}
        </div>

        {duplicateCount > 0 && (
          <button
            type="button"
            onClick={onExcludeDuplicates}
            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold transition-colors border border-rose-200/80 dark:border-rose-900/50"
          >
            Deselect All {duplicateCount} Duplicates
          </button>
        )}
      </div>

      {/* Staging Table */}
      <div className="overflow-x-auto border border-slate-200/90 dark:border-[#202836] rounded-2xl bg-white dark:bg-[#131822] shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-3 w-10 text-center">
                <button
                  type="button"
                  onClick={onToggleSelectAll}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {selectedCount === stagedList.length && stagedList.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Description / Narration</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Category (Auto-Suggested)</th>
              <th className="py-3 px-3">Method</th>
              <th className="py-3 px-3 text-right">Amount (₹)</th>
              <th className="py-3 px-3 text-center w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#202836] text-xs">
            {stagedList.map(row => {
              const catInfo = categoryMap.get(row.category.toLowerCase());

              return (
                <tr
                  key={row.tempId}
                  className={`hover:bg-slate-50/80 dark:hover:bg-[#171E2A]/50 transition-colors ${
                    row.isDuplicate ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleSelect(row.tempId)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {row.selected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  {/* Date Input */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <input
                      type="date"
                      value={row.date}
                      onChange={e => onUpdateRow(row.tempId, { date: e.target.value })}
                      className="py-1 px-2 bg-slate-50 dark:bg-[#171E2A] border border-slate-200/90 dark:border-[#202836] rounded-lg text-xs text-slate-900 dark:text-slate-100 font-numeric focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </td>

                  {/* Description Input */}
                  <td className="py-3 px-3 min-w-[200px]">
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={row.description}
                        onChange={e => onUpdateRow(row.tempId, { description: e.target.value })}
                        className="w-full py-1 px-2 bg-slate-50 dark:bg-[#171E2A] border border-slate-200/90 dark:border-[#202836] rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      {row.isDuplicate && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          <span>{row.duplicateReason}</span>
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Type Select */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <select
                      value={row.type}
                      onChange={e => onUpdateRow(row.tempId, { type: e.target.value as any })}
                      className={`py-1 px-2 rounded-lg text-xs font-bold border transition-colors ${
                        row.type === 'credit'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60'
                      }`}
                    >
                      <option value="debit">Debit (Expense)</option>
                      <option value="credit">Credit (Income)</option>
                    </select>
                  </td>

                  {/* Category Dropdown */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <select
                      value={row.category}
                      onChange={e => onUpdateRow(row.tempId, { category: e.target.value })}
                      className="py-1 px-2 bg-slate-50 dark:bg-[#171E2A] border border-slate-200/90 dark:border-[#202836] rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Payment Method */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <select
                      value={row.paymentMethod}
                      onChange={e => onUpdateRow(row.tempId, { paymentMethod: e.target.value as PaymentMethod })}
                      className="py-1 px-2 bg-slate-50 dark:bg-[#171E2A] border border-slate-200/90 dark:border-[#202836] rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      {PAYMENT_METHODS.map(m => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Amount Input */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <input
                      type="number"
                      step="0.01"
                      value={row.amount}
                      onChange={e => onUpdateRow(row.tempId, { amount: parseFloat(e.target.value) || 0 })}
                      className="font-numeric tabular-nums w-24 py-1 px-2 text-right font-bold bg-slate-50 dark:bg-[#171E2A] border border-slate-200/90 dark:border-[#202836] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </td>

                  {/* Remove row */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onRemoveRow(row.tempId)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Exclude Row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
