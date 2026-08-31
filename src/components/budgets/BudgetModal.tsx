import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { Budget } from '../../types/finance';
import { formatINR, numberToWordsINR } from '../../utils/currency';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBudget?: Budget | null;
}

const PRESET_LIMITS = [3000, 5000, 8000, 10000, 15000, 20000, 25000, 50000];

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  initialBudget,
}) => {
  const { categories, setBudgetForCategory } = useFinance();
  const [selectedCategory, setSelectedCategory] = useState<string>('Food & Dining');
  const [limitAmount, setLimitAmount] = useState<string>('10000');

  useEffect(() => {
    if (initialBudget) {
      setSelectedCategory(initialBudget.category);
      setLimitAmount(initialBudget.monthlyLimit.toString());
    } else {
      setSelectedCategory(categories[0]?.name || 'Food & Dining');
      setLimitAmount('10000');
    }
  }, [initialBudget, isOpen, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(limitAmount);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid monthly budget limit in INR');
      return;
    }

    setBudgetForCategory(selectedCategory, num);
    onClose();
  };

  const parsedLimit = parseFloat(limitAmount) || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialBudget ? 'Update Monthly Budget' : 'Set Category Budget'}
      subtitle="Establish a spending limit to keep your monthly cash flow disciplined"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category select */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Category *
          </label>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            disabled={!!initialBudget}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          >
            {categories.map(c => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Limit Amount */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Monthly Limit (INR ₹) *
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-bold text-lg">
              ₹
            </div>
            <input
              type="number"
              step="100"
              required
              value={limitAmount}
              onChange={e => setLimitAmount(e.target.value)}
              placeholder="e.g. 12000"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-4 py-2.5 text-slate-900 dark:text-white font-bold text-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          {parsedLimit > 0 && (
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium italic">
              {numberToWordsINR(parsedLimit)} / month
            </p>
          )}
        </div>

        {/* Quick presets */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Quick INR Presets
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_LIMITS.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setLimitAmount(preset.toString())}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 transition-colors"
              >
                {formatINR(preset)}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/30 transition-all duration-150"
          >
            Save Budget
          </button>
        </div>
      </form>
    </Modal>
  );
};
