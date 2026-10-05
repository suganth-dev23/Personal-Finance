import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { Category } from '../../types/finance';
import { IconRenderer } from '../common/IconRenderer';
import { AVAILABLE_CATEGORY_ICONS, CATEGORY_COLORS } from '../../constants/categoryTheme';

interface CategoryModalProps {
 isOpen: boolean;
 onClose: () => void;
 initialCategory?: Category | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
 isOpen,
 onClose,
 initialCategory,
}) => {
 const { categories, addCategory, updateCategory } = useFinance();

 const [name, setName] = useState('');
 const [icon, setIcon] = useState('Tag');
 const [color, setColor] = useState('#3b82f6');
 const [type, setType] = useState<'expense' | 'income' | 'both'>('expense');
 const [nameError, setNameError] = useState<string | null>(null);

 useEffect(() => {
 if (initialCategory) {
 setName(initialCategory.name);
 setIcon(initialCategory.icon);
 setColor(initialCategory.color);
 setType(initialCategory.type);
 } else {
 setName('');
 setIcon('Tag');
 setColor('#3b82f6');
 setType('expense');
 }
 setNameError(null);
 }, [initialCategory, isOpen]);

 const handleNameChange = (val: string) => {
 setName(val);
 if (nameError) {
 setNameError(null);
 }
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 const trimmed = name.trim();
 if (!trimmed) {
 setNameError('Please enter a category name');
 return;
 }

 const isDuplicate = categories.some(
 c => c.id !== initialCategory?.id && c.name.trim().toLowerCase() === trimmed.toLowerCase()
 );

 if (isDuplicate) {
 setNameError(`A category named "${trimmed}" already exists.`);
 return;
 }

 if (initialCategory) {
 updateCategory(initialCategory.id, {
 name: trimmed,
 icon,
 color,
 type,
 });
 } else {
 addCategory({
 name: trimmed,
 icon,
 color,
 type,
 });
 }
 onClose();
 };

 return (
 <Modal
 isOpen={isOpen}
 onClose={onClose}
 title={initialCategory ? 'Edit Category' : 'Create Custom Category'}
 subtitle="Customize category name, theme color, and Lucide icon"
 >
 <form onSubmit={handleSubmit} className="space-y-4">
 {/* Name */}
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-1.5">
 Category Name *
 </label>
 <input
 type="text"
 required
 value={name}
 onChange={e => handleNameChange(e.target.value)}
 placeholder="e.g. Pet Care, Subscriptions, Fitness"
 className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-ink-1 focus:outline-none transition-colors ${
 nameError
 ? 'border-negative bg-negative/5 focus:border-negative focus:ring-1 focus:ring-negative'
 : 'border-line bg-surface focus:border-primary focus:ring-1 focus:ring-primary'
 }`}
 />
 {nameError && (
 <p className="mt-1.5 text-xs font-semibold text-negative" role="alert">
 {nameError}
 </p>
 )}
 </div>

 {/* Type */}
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-1.5">
 Category Type
 </label>
 <div className="grid grid-cols-3 gap-2 p-1 bg-sunken rounded-xl text-xs font-bold border border-line">
 <button
 type="button"
 onClick={() => setType('expense')}
 className={`py-2 rounded-xl transition-colors ${
 type === 'expense'
 ? 'bg-rose-500 text-white shadow-sm'
 : 'text-ink-2'
 }`}
 >
 Expense
 </button>
 <button
 type="button"
 onClick={() => setType('income')}
 className={`py-2 rounded-xl transition-colors ${
 type === 'income'
 ? 'bg-emerald-600 text-white shadow-sm'
 : 'text-ink-2'
 }`}
 >
 Income
 </button>
 <button
 type="button"
 onClick={() => setType('both')}
 className={`py-2 rounded-xl transition-colors ${
 type === 'both'
 ? 'bg-indigo-600 text-white shadow-sm'
 : 'text-ink-2'
 }`}
 >
 Both
 </button>
 </div>
 </div>

 {/* Color Picker */}
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-1.5">
 Theme Color
 </label>
 <div className="flex flex-wrap gap-2">
 {CATEGORY_COLORS.map(c => (
 <button
 key={c}
 type="button"
 onClick={() => setColor(c)}
 className={`w-7 h-7 rounded-full transition-transform ${
 color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'
 }`}
 style={{ backgroundColor: c }}
 />
 ))}
 </div>
 </div>

 {/* Icon Picker */}
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-1.5">
 Select Icon
 </label>
 <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 max-h-40 overflow-y-auto p-2 bg-sunken rounded-xl border border-line">
 {AVAILABLE_CATEGORY_ICONS.map(iconName => (
 <button
 key={iconName}
 type="button"
 onClick={() => setIcon(iconName)}
 className={`p-2 rounded-xl flex items-center justify-center transition-colors ${
 icon === iconName
 ? 'bg-surface dark:bg-line text-emerald-600 dark:text-emerald-400 shadow-sm ring-2 ring-emerald-500'
 : 'text-ink-3 hover:text-slate-900 dark:hover:text-white hover:bg-white/50'
 }`}
 >
 <IconRenderer name={iconName} className="w-4 h-4" />
 </button>
 ))}
 </div>
 </div>

 {/* Preview badge */}
 <div className="pt-2 flex items-center gap-3">
 <span className="text-xs text-ink-3 font-medium">Preview:</span>
 <div
 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
 style={{
 backgroundColor: `${color}20`,
 color: color,
 }}
 >
 <IconRenderer name={icon} className="w-3.5 h-3.5" />
 <span>{name || 'Category Name'}</span>
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
 className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-primary hover:opacity-95 text-on-primary shadow-sm transition-colors duration-150 active:scale-95"
 >
 {initialCategory ? 'Update Category' : 'Create Category'}
 </button>
 </div>
 </form>
 </Modal>
 );
};
