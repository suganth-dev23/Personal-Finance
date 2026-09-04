import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { Investment, InvestmentType } from '../../types/finance';
import { numberToWordsINR } from '../../utils/currency';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInvestment?: Investment | null;
}

const INVESTMENT_TYPES: InvestmentType[] = [
  'Mutual Funds',
  'Stocks',
  'Fixed Deposit (FD)',
  'Recurring Deposit (RD)',
  'Gold / SGB',
  'PPF / EPF',
  'NPS',
  'Crypto',
  'Real Estate',
  'Bonds / Debt',
  'Other',
];

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  isOpen,
  onClose,
  initialInvestment,
}) => {
  const { addInvestment, updateInvestment } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<InvestmentType>('Mutual Funds');
  const [investedAmount, setInvestedAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [sipAmount, setSipAmount] = useState('');
  const [sipDay, setSipDay] = useState('');
  const [platform, setPlatform] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialInvestment) {
      setName(initialInvestment.name);
      setType(initialInvestment.type);
      setInvestedAmount(initialInvestment.investedAmount.toString());
      setCurrentValue(initialInvestment.currentValue.toString());
      setSipAmount(initialInvestment.sipAmount ? initialInvestment.sipAmount.toString() : '');
      setSipDay(initialInvestment.sipDay ? initialInvestment.sipDay.toString() : '');
      setPlatform(initialInvestment.platform || '');
      setNotes(initialInvestment.notes || '');
    } else {
      setName('');
      setType('Mutual Funds');
      setInvestedAmount('');
      setCurrentValue('');
      setSipAmount('');
      setSipDay('');
      setPlatform('Zerodha');
      setNotes('');
    }
  }, [initialInvestment, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = parseFloat(investedAmount);
    const curr = parseFloat(currentValue);

    if (!name.trim()) {
      alert('Please enter an investment name');
      return;
    }
    if (isNaN(inv) || inv < 0) {
      alert('Please enter a valid invested amount');
      return;
    }
    if (isNaN(curr) || curr < 0) {
      alert('Please enter a valid current valuation');
      return;
    }

    const sip = sipAmount ? parseFloat(sipAmount) : undefined;
    const day = sipDay ? parseInt(sipDay) : undefined;

    if (initialInvestment) {
      updateInvestment(initialInvestment.id, {
        name: name.trim(),
        type,
        investedAmount: inv,
        currentValue: curr,
        sipAmount: sip,
        sipDay: day,
        platform: platform.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addInvestment({
        name: name.trim(),
        type,
        investedAmount: inv,
        currentValue: curr,
        sipAmount: sip,
        sipDay: day,
        platform: platform.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }
    onClose();
  };

  const parsedVal = parseFloat(currentValue) || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialInvestment ? 'Update Investment Holding' : 'Add New Investment'}
      subtitle="Log asset valuations across Indian equities, mutual funds, gold, and fixed income"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Asset Class */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Investment / Scheme Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Parag Parikh Flexi Cap, HDFC Bank, SGB 2024"
              className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Asset Type *
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value as InvestmentType)}
              className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              {INVESTMENT_TYPES.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Invested Amount & Current Valuation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Total Invested (INR ₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={investedAmount}
              onChange={e => setInvestedAmount(e.target.value)}
              placeholder="0.00"
              className="font-numeric tabular-nums w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Current Market Value (INR ₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={currentValue}
              onChange={e => setCurrentValue(e.target.value)}
              placeholder="0.00"
              className="font-numeric tabular-nums w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>
        {parsedVal > 0 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium italic">
            Current Valuation: {numberToWordsINR(parsedVal)}
          </p>
        )}

        {/* Platform & Monthly SIP */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Broker / Platform
            </label>
            <input
              type="text"
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              placeholder="e.g. Zerodha, Groww, Kuvera, HDFC"
              className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Monthly SIP (Optional ₹)
            </label>
            <input
              type="number"
              value={sipAmount}
              onChange={e => setSipAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="font-numeric tabular-nums w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              SIP Debit Day
            </label>
            <input
              type="number"
              min="1"
              max="28"
              value={sipDay}
              onChange={e => setSipDay(e.target.value)}
              placeholder="e.g. 5"
              className="font-numeric tabular-nums w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Strategy Notes / Description
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Long term retirement core equity compounding"
            className="w-full rounded-xl border border-slate-200/90 dark:border-[#202836] bg-slate-50 dark:bg-[#171E2A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
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
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/20 transition-all duration-150 active:scale-95"
          >
            {initialInvestment ? 'Update Holding' : 'Save Investment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
