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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Obsidian Overview */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl shadow-slate-950/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Layers className="w-3 h-3 text-emerald-400" /> Taxonomy & Rules
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {categories.length} Categories Total
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Category Directory
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Organize and classify transactions with custom colors, SVG icons, and monthly spending allocations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Category</span>
            </button>
          </div>
        </div>

        {/* Quick Micro-stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total System</span>
            <p className="text-sm sm:text-base font-extrabold text-white mt-0.5">{categories.length} types</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Custom User</span>
            <p className="text-sm sm:text-base font-extrabold text-emerald-400 mt-0.5">{customCount} custom</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Spends</span>
            <p className="text-sm sm:text-base font-extrabold text-teal-300 mt-0.5">{categorySpendingThisMonth.length} categories</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Top Spend</span>
            <p className="text-sm sm:text-base font-extrabold text-rose-400 mt-0.5 truncate">
              {topSpentCat ? `${topSpentCat.category}` : 'None'}
            </p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map(cat => {
          const spentThisMonth = spendingMap.get(cat.name.toLowerCase()) || 0;

          return (
            <div
              key={cat.id}
              className="group bg-white dark:bg-slate-900/90 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between"
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

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">This Month:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
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
