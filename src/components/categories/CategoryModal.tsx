import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { Category } from '../../types/finance';
import { IconRenderer, AVAILABLE_CATEGORY_ICONS, CATEGORY_COLORS } from '../common/IconRenderer';

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
  const { addCategory, updateCategory } = useFinance();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#3b82f6');
  const [type, setType] = useState<'expense' | 'income' | 'both'>('expense');

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
  }, [initialCategory, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a category name');
      return;
    }

    if (initialCategory) {
      updateCategory(initialCategory.id, {
        name: name.trim(),
        icon,
        color,
        type,
      });
    } else {
      addCategory({
        name: name.trim(),
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
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Category Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Pet Care, Subscriptions, Fitness"
            className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Category Type
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-[#171E2A] rounded-xl text-xs font-bold border border-slate-200/60 dark:border-[#202836]">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('both')}
              className={`py-2 rounded-lg transition-all ${
                type === 'both'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Both
            </button>
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
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
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Select Icon
          </label>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 dark:bg-[#171E2A] rounded-xl border border-slate-200/90 dark:border-[#202836]">
            {AVAILABLE_CATEGORY_ICONS.map(iconName => (
              <button
                key={iconName}
                type="button"
                onClick={() => setIcon(iconName)}
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                  icon === iconName
                    ? 'bg-white dark:bg-[#202836] text-emerald-600 dark:text-emerald-400 shadow-sm ring-2 ring-emerald-500'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/50'
                }`}
              >
                <IconRenderer name={iconName} className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Preview badge */}
        <div className="pt-2 flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Preview:</span>
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
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#202836]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#171E2A] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-sm transition-all duration-150 active:scale-95"
          >
            {initialCategory ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
