import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Tag, PieChart, Sparkles } from 'lucide-react';
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
    setCurrentView,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const spendingMap = new Map(categorySpendingThisMonth.map(c => [c.category.toLowerCase(), c.spent]));

  const handleEdit = (cat: Category) => {
    setSelectedCategory(cat);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Category Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize and classify your transactions with icons and custom colors
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-emerald-600/30 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Custom Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map(cat => {
          const spentThisMonth = spendingMap.get(cat.name.toLowerCase()) || 0;

          return (
            <div
              key={cat.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                    style={{
                      backgroundColor: `${cat.color}20`,
                      color: cat.color,
                    }}
                  >
                    <IconRenderer name={cat.icon} className="w-6 h-6" />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
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
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 capitalize mt-0.5">
                    {cat.type} Category
                  </p>
                </div>
              </div>

              {/* Monthly Spend Snapshot */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">This Month:</span>
                <span className="font-bold text-slate-900 dark:text-white">
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
