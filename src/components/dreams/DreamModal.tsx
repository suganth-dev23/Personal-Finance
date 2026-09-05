import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { DreamGoal } from '../../types/finance';
import { numberToWordsINR } from '../../utils/currency';
import { IconRenderer, AVAILABLE_CATEGORY_ICONS, CATEGORY_COLORS } from '../common/IconRenderer';

interface DreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDream?: DreamGoal | null;
}

export const DreamModal: React.FC<DreamModalProps> = ({
  isOpen,
  onClose,
  initialDream,
}) => {
  const { addDream, updateDream } = useFinance();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialSaved, setInitialSaved] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Travel');
  const [icon, setIcon] = useState('Compass');
  const [color, setColor] = useState('#3b82f6');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    if (initialDream) {
      setName(initialDream.name);
      setTargetAmount(initialDream.targetAmount.toString());
      setInitialSaved(initialDream.currentSaved.toString());
      setTargetDate(initialDream.targetDate || '');
      setCategory(initialDream.category);
      setIcon(initialDream.icon);
      setColor(initialDream.color);
      setPriority(initialDream.priority);
    } else {
      setName('');
      setTargetAmount('');
      setInitialSaved('');
      setTargetDate('');
      setCategory('Travel');
      setIcon('Compass');
      setColor('#3b82f6');
      setPriority('medium');
    }
  }, [initialDream, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const saved = initialSaved ? parseFloat(initialSaved) : 0;

    if (!name.trim()) {
      alert('Please enter a goal name');
      return;
    }
    if (isNaN(target) || target <= 0) {
      alert('Please enter a valid target amount');
      return;
    }

    if (initialDream) {
      updateDream(initialDream.id, {
        name: name.trim(),
        targetAmount: target,
        targetDate: targetDate || undefined,
        category,
        icon,
        color,
        priority,
      });
    } else {
      addDream({
        name: name.trim(),
        targetAmount: target,
        initialSaved: saved,
        targetDate: targetDate || undefined,
        category,
        icon,
        color,
        priority,
      });
    }
    onClose();
  };

  const parsedTarget = parseFloat(targetAmount) || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialDream ? 'Edit Dream / Goal' : 'Create New Dream Goal'}
      subtitle="Set a vision with a target date and auto-calculated monthly savings"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Target Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Goal / Dream Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Leh Ladakh Trip, MacBook Pro, House Registry"
              className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Target Amount (INR ₹) *
            </label>
            <input
              type="number"
              step="100"
              required
              value={targetAmount}
              onChange={e => setTargetAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white font-numeric focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>
        {parsedTarget > 0 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium italic">
            Target: {numberToWordsINR(parsedTarget)}
          </p>
        )}

        {/* Target Date & Initial Saved */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Target Deadline Date (Optional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {!initialDream && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Initial Saved Amount (INR ₹)
              </label>
              <input
                type="number"
                value={initialSaved}
                onChange={e => setInitialSaved(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white font-numeric focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-white dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority ⚡</option>
            </select>
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Card Accent Color
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
            Select Goal Icon
          </label>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-[#171E2A] rounded-xl border border-slate-200/90 dark:border-[#202836]">
            {AVAILABLE_CATEGORY_ICONS.map(iconName => (
              <button
                key={iconName}
                type="button"
                onClick={() => setIcon(iconName)}
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                  icon === iconName
                    ? 'bg-white dark:bg-[#202836] text-emerald-600 shadow-sm ring-2 ring-emerald-500'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <IconRenderer name={iconName} className="w-4 h-4" />
              </button>
            ))}
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
            {initialDream ? 'Update Goal' : 'Create Goal'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
