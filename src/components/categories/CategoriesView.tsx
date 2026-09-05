import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Tag, PieChart, Sparkles, Layers } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Category } from '../../types/finance';
import { formatINR } from '../../utils/currency';
import { IconRenderer } from '../common/IconRenderer';
import { CategoryModal } from './CategoryModal';

export const CategoriesView: React.FC = () => {
  const {
    categories,
    deleteCategory,
    categorySpendingThisMonth,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const spendingMap = new Map(categorySpendingThisMonth.map(c => [c.category.toLowerCase(), c.spent]));

  const customCount = categories.filter(c => c.isCustom).length;
  const topSpentCat = categorySpendingThisMonth[0];

  const handleEdit = (cat: Category) => {
    setSelectedCategory(cat);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner: Mineral Card with Gold Taxonomy Highlight */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#131822] text-slate-900 dark:text-white p-6 sm:p-8 border border-slate-200/90 dark:border-[#202836] shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F5B742] to-transparent opacity-80" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400">
                <Layers className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                TAXONOMY &amp; EXPENSE RULES
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Expense Classification Directory
            </p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-black font-numeric tracking-tight text-slate-900 dark:text-white">
                {categories.length}
              </h2>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                categories defined
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {customCount} custom user classifications • {categorySpendingThisMonth.length} active spending channels this month
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-sm font-bold text-slate-950 shadow-sm hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>New Category</span>
            </button>
          </div>
        </div>

        {/* 4-column summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200/80 dark:border-[#202836]">
          <div className="bg-slate-50 dark:bg-[#171E2A] border border-slate-200/60 dark:border-[#202836]/60 rounded-2xl p-3.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Total System</span>
            <p className="text-lg font-bold font-numeric text-slate-900 dark:text-white mt-0.5">{categories.length} types</p>
          </div>
          <div className="bg-slate-50 dark:bg-[#171E2A] border border-slate-200/60 dark:border-[#202836]/60 rounded-2xl p-3.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Custom User</span>
            <p className="text-lg font-bold font-numeric text-emerald-600 dark:text-emerald-400 mt-0.5">{customCount} custom</p>
          </div>
          <div className="bg-slate-50 dark:bg-[#171E2A] border border-slate-200/60 dark:border-[#202836]/60 rounded-2xl p-3.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Active Spends</span>
            <p className="text-lg font-bold font-numeric text-teal-600 dark:text-teal-400 mt-0.5">{categorySpendingThisMonth.length} channels</p>
          </div>
          <div className="bg-slate-50 dark:bg-[#171E2A] border border-slate-200/60 dark:border-[#202836]/60 rounded-2xl p-3.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Top Spend</span>
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5 truncate">
              {topSpentCat ? `${topSpentCat.category}` : 'None'}
            </p>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            All Categories
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage icon graphics, palette color tags, and transaction assignments
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {categories.length} categories
        </span>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map(cat => {
          const spentThisMonth = spendingMap.get(cat.name.toLowerCase()) || 0;

          return (
            <div
              key={cat.id}
              className="group bg-white dark:bg-[#131822] rounded-3xl p-5 border border-slate-200/90 dark:border-[#202836] hover:border-amber-400/50 dark:hover:border-amber-500/30 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${cat.color}20`,
                      color: cat.color,
                    }}
                  >
                    <IconRenderer name={cat.icon} className="w-6 h-6" />
                  </div>

                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/90 dark:border-[#202836] text-slate-400 hover:bg-slate-50 dark:hover:bg-[#171E2A] hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      title="Edit Category"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {cat.isCustom && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete custom category "${cat.name}"?`)) {
                            deleteCategory(cat.id);
                          }
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/90 dark:border-[#202836] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {cat.name}
                    </h3>
                    {cat.isCustom && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 capitalize mt-0.5 font-medium">
                    {cat.type} Category
                  </p>
                </div>
              </div>

              {/* Monthly Spend Snapshot */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-[#202836] flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">This Month:</span>
                <span className="font-extrabold text-slate-900 dark:text-white font-numeric">
                  {spentThisMonth > 0 ? formatINR(spentThisMonth) : '₹0'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialCategory={selectedCategory}
      />
    </div>
  );
};
