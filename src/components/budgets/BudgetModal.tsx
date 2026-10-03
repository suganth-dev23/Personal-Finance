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
 <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-1.5">
 Category *
 </label>
 <select
 value={selectedCategory}
 onChange={e => setSelectedCategory(e.target.value)}
 disabled={!!initialBudget}
 className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink-1 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
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
 <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-1.5">
 Monthly Limit (INR ₹) *
 </label>
 <div className="relative rounded-xl shadow-sm">
 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-3 font-bold text-lg">
 ₹
 </div>
 <input
 type="number"
 step="100"
 inputMode="decimal"
 required
 value={limitAmount}
 onChange={e => setLimitAmount(e.target.value)}
 placeholder="e.g. 12000"
 className="w-full rounded-xl border border-line bg-surface pl-8 pr-4 py-2.5 text-ink-1 font-bold text-lg font-numeric focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
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
 <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-1.5">
 Quick INR Presets
 </label>
 <div className="flex flex-wrap gap-1.5">
 {PRESET_LIMITS.map(preset => (
 <button
 key={preset}
 type="button"
 onClick={() => setLimitAmount(preset.toString())}
 className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-sunken hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-ink-2 hover:text-emerald-700 transition-colors font-numeric border border-line"
 >
 {formatINR(preset)}
 </button>
 ))}
 </div>
 </div>

 {/* Actions */}
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-2 hover:bg-sunken transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="px-6 py-2.5 rounded-xl text-sm font-bold text-on-primary bg-primary hover:opacity-95 shadow-xs transition-colors duration-150 active:scale-95"
 >
 Save Budget
 </button>
 </div>
 </form>
 </Modal>
 );
};
