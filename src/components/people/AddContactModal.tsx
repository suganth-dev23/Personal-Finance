import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { UserPlus } from 'lucide-react';

interface AddContactModalProps {
 isOpen: boolean;
 onClose: () => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({ isOpen, onClose }) => {
 const { addContact } = useFinance();
 const [name, setName] = useState('');
 const [notes, setNotes] = useState('');

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!name.trim()) return;

 addContact({
 name: name.trim(),
 notes: notes.trim() || undefined,
 });

 setName('');
 setNotes('');
 onClose();
 };

 return (
 <Modal
 isOpen={isOpen}
 onClose={onClose}
 title="Add New Person"
 subtitle="Track split bills and debts with friends, family, or roommates"
 >
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-1.5">
 Full Name / Nickname *
 </label>
 <input
 type="text"
 required
 autoFocus
 value={name}
 onChange={e => setName(e.target.value)}
 placeholder="e.g. Rahul Sharma, Priya (Roommate)"
 className="w-full rounded-xl border border-line bg-sunken px-3.5 py-2.5 text-sm font-semibold text-ink-1 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
 />
 </div>

 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-1.5">
 Notes / UPI ID (Optional)
 </label>
 <input
 type="text"
 value={notes}
 onChange={e => setNotes(e.target.value)}
 placeholder="e.g. rahul@okhdfcbank or Flat 302 split"
 className="w-full rounded-xl border border-line bg-sunken px-3.5 py-2.5 text-sm text-ink-1 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
 />
 </div>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2 rounded-xl text-sm font-semibold text-ink-2 hover:bg-sunken transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-primary hover:opacity-95 text-on-primary shadow-md shadow-xs transition-colors active:scale-95"
 >
 <UserPlus className="w-4 h-4" />
 <span>Add Person</span>
 </button>
 </div>
 </form>
 </Modal>
 );
};
