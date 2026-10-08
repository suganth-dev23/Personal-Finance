import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  AlertTriangle,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { StagedTransaction, Category, PaymentMethod } from '../../types/finance';
import { roundCurrency } from '../../utils/currency';
import { normalizeDate } from '../../utils/csvParser';
import { isValidDate } from '../../utils/validation';

export interface ReviewStagingTableProps {
  stagedList: StagedTransaction[];
  categories: Category[];
  onToggleSelect: (tempId: string) => void;
  onToggleSelectAll: () => void;
  onUpdateRow: (tempId: string, updated: Partial<StagedTransaction>) => void;
  onRemoveRow: (tempId: string) => void;
  onExcludeDuplicates: () => void;
  onInvertAllTypes?: () => void;
  onRemoveSelected?: () => void;
  onBulkSetCategory?: (categoryName: string) => void;
  onSelectAllAcrossPages?: (select: boolean) => void;
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

/**
 * Ensures any date value is properly formatted as YYYY-MM-DD for native HTML date inputs
 */
function ensureISODate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const normalized = normalizeDate(dateStr);
  if (normalized && normalized !== 'NaN-NaN-NaN' && isValidDate(normalized)) {
    return normalized;
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Swaps day and month for ambiguous dates in format YYYY-MM-DD (e.g., 2026-04-05 -> 2026-05-04)
 */
function swapDayAndMonth(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    // Can only swap if day is <= 12 (otherwise it cannot be a valid month)
    if (day <= 12 && month <= 12) {
      const newMonth = String(day).padStart(2, '0');
      const newDay = String(month).padStart(2, '0');
      return `${year}-${newMonth}-${newDay}`;
    }
  }
  return isoDate;
}

export const ReviewStagingTable: React.FC<ReviewStagingTableProps> = ({
  stagedList,
  categories,
  onToggleSelect,
  onToggleSelectAll,
  onUpdateRow,
  onRemoveRow,
  onExcludeDuplicates,
  onInvertAllTypes,
  onRemoveSelected,
  onBulkSetCategory,
  onSelectAllAcrossPages,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const selectedCount = stagedList.filter(t => t.selected).length;
  const duplicateCount = stagedList.filter(t => t.isDuplicate).length;

  const totalPages = Math.max(1, Math.ceil(stagedList.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, stagedList.length);
  const paginatedList = useMemo(
    () => stagedList.slice(startIndex, endIndex),
    [stagedList, startIndex, endIndex]
  );

  const allOnPageSelected =
    paginatedList.length > 0 && paginatedList.every(t => t.selected);
  const allAcrossPagesSelected =
    stagedList.length > 0 && selectedCount === stagedList.length;

  const handlePageSelectToggle = () => {
    if (paginatedList.length === 0) return;
    const shouldSelect = !allOnPageSelected;
    paginatedList.forEach(item => {
      if (item.selected !== shouldSelect) {
        onToggleSelect(item.tempId);
      }
    });
  };

  const handleSelectAllGlobal = (select: boolean) => {
    if (onSelectAllAcrossPages) {
      onSelectAllAcrossPages(select);
    } else if (onToggleSelectAll) {
      onToggleSelectAll();
    } else {
      // Fallback: toggle each row that doesn't match target state
      stagedList.forEach(t => {
        if (t.selected !== select) {
          onToggleSelect(t.tempId);
        }
      });
    }
  };

  const handleBulkRemove = () => {
    if (selectedCount === 0) return;
    onRemoveSelected?.();
  };

  const handleBulkCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val || selectedCount === 0) return;
    onBulkSetCategory?.(val);
    e.target.value = '';
  };

  const handleDeselectDuplicates = () => {
    if (duplicateCount === 0) return;
    onExcludeDuplicates();
  };

  const handleSwapAllDates = () => {
    stagedList.forEach(t => {
      const swapped = swapDayAndMonth(ensureISODate(t.date));
      if (swapped !== t.date) {
        onUpdateRow(t.tempId, { date: swapped });
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Stats & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 bg-sunken rounded-2xl border border-line">
        <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold flex-wrap">
          <div className="text-ink-2">
            Total Parsed: <span className="font-bold font-numeric text-ink-1">{stagedList.length}</span>
          </div>
          <div className="w-px h-3 bg-line hidden sm:block" />
          <div className="text-emerald-600 dark:text-emerald-400 font-bold font-numeric">
            {selectedCount} selected for import
          </div>
          {duplicateCount > 0 && (
            <>
              <div className="w-px h-3 bg-line hidden sm:block" />
              <div className="text-negative font-bold flex items-center gap-1 font-numeric">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{duplicateCount} duplicates detected</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Bulk Category Change */}
          {onBulkSetCategory && (
            <div className="relative">
              <select
                disabled={selectedCount === 0}
                onChange={handleBulkCategoryChange}
                defaultValue=""
                className={`min-h-[44px] py-2 pl-3 pr-8 rounded-xl text-xs font-bold border transition-colors ${
                  selectedCount > 0
                    ? 'bg-surface text-ink-1 border-line cursor-pointer'
                    : 'bg-sunken text-ink-3 border-line opacity-50 cursor-not-allowed'
                }`}
                title={selectedCount === 0 ? 'Select rows to assign category in bulk' : `Assign category to ${selectedCount} selected rows across all pages`}
              >
                <option value="" disabled>
                  Set Category ({selectedCount})
                </option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date format swap: DD/MM vs MM/DD */}
          <button
            type="button"
            onClick={handleSwapAllDates}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-sunken hover:bg-line text-ink-2 hover:text-ink-1 text-xs font-bold transition-colors border border-line flex items-center gap-1.5 cursor-pointer"
            title="Swap day and month (e.g. DD/MM/YYYY ↔ MM/DD/YYYY) across all transactions where both are <= 12"
          >
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Swap DD/MM ↔ MM/DD</span>
          </button>

          {/* Bulk Delete Selected */}
          {onRemoveSelected && (
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleBulkRemove}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors border ${
                selectedCount > 0
                  ? 'bg-negative-tint hover:opacity-90 text-negative border-negative/20 cursor-pointer'
                  : 'bg-sunken text-ink-3 border-line opacity-50 cursor-not-allowed'
              }`}
              title={selectedCount === 0 ? 'Select rows to exclude in bulk' : `Exclude ${selectedCount} selected rows`}
            >
              Exclude Selected ({selectedCount})
            </button>
          )}

          {onInvertAllTypes && (
            <button
              type="button"
              onClick={onInvertAllTypes}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-sunken hover:bg-line text-ink-2 hover:text-ink-1 text-xs font-bold transition-colors border border-line flex items-center gap-1.5 cursor-pointer"
              title="Invert income (credit) and expense (debit) for all transactions if the bank statement columns were reversed"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Flip Income / Expense</span>
            </button>
          )}

          {duplicateCount > 0 && (
            <button
              type="button"
              onClick={handleDeselectDuplicates}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-negative-tint hover:opacity-90 text-negative text-xs font-bold transition-colors border border-negative/20 cursor-pointer"
            >
              Deselect {duplicateCount} Duplicates
            </button>
          )}
        </div>
      </div>

      {/* Select-All Across Pages Alert Banner */}
      {allOnPageSelected && stagedList.length > paginatedList.length && (
        <div className="p-3 bg-primary-tint border border-primary/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-primary font-semibold">
          <div>
            {allAcrossPagesSelected ? (
              <span>All {stagedList.length} transactions across all pages are selected.</span>
            ) : (
              <span>All {paginatedList.length} transactions on this page are selected.</span>
            )}
          </div>
          <div>
            {allAcrossPagesSelected ? (
              <button
                type="button"
                onClick={() => handleSelectAllGlobal(false)}
                className="underline hover:opacity-80 font-bold cursor-pointer"
              >
                Clear selection
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectAllGlobal(true)}
                className="underline hover:opacity-80 font-bold cursor-pointer"
              >
                Select all {stagedList.length} transactions across all pages
              </button>
            )}
          </div>
        </div>
      )}

      {/* Staging Table */}
      <div className="overflow-x-auto border border-line rounded-2xl bg-surface shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-line bg-sunken text-xs font-bold text-ink-3 uppercase tracking-wider">
              <th className="py-3 px-3 w-12 text-center">
                <button
                  type="button"
                  onClick={handlePageSelectToggle}
                  aria-label={allOnPageSelected ? 'Deselect all on this page' : 'Select all on this page'}
                  title={allOnPageSelected ? 'Deselect all on this page' : 'Select all on this page'}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ink-3 hover:text-ink-1 transition-colors cursor-pointer"
                >
                  {allOnPageSelected ? (
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
          <tbody className="divide-y divide-line text-xs">
            {paginatedList.map(row => {
              const safeIsoDate = ensureISODate(row.date);
              return (
                <tr
                  key={row.tempId}
                  className={`hover:bg-sunken/80 transition-colors ${
                    row.isDuplicate ? 'bg-sunken/40 dark:bg-sunken/20' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleSelect(row.tempId)}
                      aria-label={row.selected ? `Deselect ${row.description}` : `Select ${row.description}`}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ink-3 hover:text-ink-1 transition-colors cursor-pointer mx-auto"
                    >
                      {row.selected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  {/* Date Input */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <input
                      type="date"
                      value={safeIsoDate}
                      onChange={e => onUpdateRow(row.tempId, { date: e.target.value })}
                      aria-label="Transaction date"
                      className="py-1.5 px-2 bg-sunken border border-line rounded-xl text-xs text-ink-1 font-numeric focus:outline-none focus:ring-1 focus:ring-primary min-h-[36px]"
                    />
                  </td>

                  {/* Description Input */}
                  <td className="py-2.5 px-3 min-w-[200px]">
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={row.description}
                        onChange={e => onUpdateRow(row.tempId, { description: e.target.value })}
                        aria-label="Transaction description"
                        className="w-full py-1.5 px-2 bg-sunken border border-line rounded-xl text-xs font-semibold text-ink-1 focus:outline-none focus:ring-1 focus:ring-primary min-h-[36px]"
                      />
                      {row.isDuplicate && (
                        <p className="text-xs text-negative font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{row.duplicateReason}</span>
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Type Select */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <select
                      value={row.type}
                      onChange={e => onUpdateRow(row.tempId, { type: e.target.value as any })}
                      aria-label="Transaction type"
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors min-h-[36px] ${
                        row.type === 'credit'
                          ? 'bg-positive-tint text-positive border-positive/30'
                          : 'bg-negative-tint text-negative border-negative/30'
                      }`}
                    >
                      <option value="debit">Debit (Expense)</option>
                      <option value="credit">Credit (Income)</option>
                    </select>
                  </td>

                  {/* Category Dropdown */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <select
                      value={row.category}
                      onChange={e => onUpdateRow(row.tempId, { category: e.target.value })}
                      aria-label="Transaction category"
                      className="py-1.5 px-2 bg-sunken border border-line rounded-xl text-xs font-medium text-ink-1 focus:outline-none focus:ring-1 focus:ring-primary min-h-[36px]"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Payment Method */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <select
                      value={row.paymentMethod}
                      onChange={e => onUpdateRow(row.tempId, { paymentMethod: e.target.value as PaymentMethod })}
                      aria-label="Payment method"
                      className="py-1.5 px-2 bg-sunken border border-line rounded-xl text-xs text-ink-1 focus:outline-none focus:ring-1 focus:ring-primary min-h-[36px]"
                    >
                      {PAYMENT_METHODS.map(m => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Amount Input */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={row.amount}
                      aria-label="Transaction amount"
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          onUpdateRow(row.tempId, { amount: roundCurrency(val) });
                        }
                      }}
                      onBlur={e => {
                        const val = parseFloat(e.target.value);
                        if (isNaN(val) || val <= 0) {
                          onUpdateRow(row.tempId, { amount: row.amount > 0 ? roundCurrency(row.amount) : 1 });
                        }
                      }}
                      className="font-numeric tabular-nums w-24 py-1.5 px-2 text-right font-bold bg-sunken border border-line rounded-xl text-xs text-ink-1 focus:outline-none focus:ring-1 focus:ring-primary min-h-[36px]"
                    />
                  </td>

                  {/* Exclude row */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onRemoveRow(row.tempId)}
                      aria-label={`Exclude row: ${row.description}`}
                      title="Exclude Row"
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-ink-3 hover:text-negative transition-colors cursor-pointer mx-auto"
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

      {/* Pagination Footer Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-surface rounded-2xl border border-line text-xs font-semibold">
        <div className="flex items-center gap-3 text-ink-3">
          <span>
            Showing <span className="font-bold font-numeric text-ink-1">{startIndex + 1}</span>-
            <span className="font-bold font-numeric text-ink-1">{endIndex}</span> of{' '}
            <span className="font-bold font-numeric text-ink-1">{stagedList.length}</span>
          </span>

          <div className="flex items-center gap-1.5 ml-2">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Rows per page"
              className="py-1 px-2 bg-sunken border border-line rounded-lg text-xs font-bold text-ink-1"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Page Navigators */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            aria-label="Previous page"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl border border-line bg-sunken text-ink-2 hover:text-ink-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 font-numeric text-xs font-bold text-ink-1">
            Page {safeCurrentPage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            aria-label="Next page"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl border border-line bg-sunken text-ink-2 hover:text-ink-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
