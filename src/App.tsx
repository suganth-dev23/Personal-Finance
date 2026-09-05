import React, { useState, Suspense, lazy } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { MobileMoreDrawer } from './components/layout/MobileMoreDrawer';
import { TransactionModal } from './components/transactions/TransactionModal';
import { ViewSkeleton } from './components/common/ViewSkeleton';
import { ViewTransition } from './components/common/ViewTransition';
import type { Transaction } from './types/finance';

// Lazy-loaded route views
const DashboardView = lazy(() =>
  import('./components/dashboard/DashboardView').then(m => ({ default: m.DashboardView }))
);
const TransactionListView = lazy(() =>
  import('./components/transactions/TransactionListView').then(m => ({ default: m.TransactionListView }))
);
const PeopleView = lazy(() =>
  import('./components/people/PeopleView').then(m => ({ default: m.PeopleView }))
);
const BudgetsView = lazy(() =>
  import('./components/budgets/BudgetsView').then(m => ({ default: m.BudgetsView }))
);
const RecurringPaymentsView = lazy(() =>
  import('./components/recurring/RecurringPaymentsView').then(m => ({ default: m.RecurringPaymentsView }))
);
const CategoriesView = lazy(() =>
  import('./components/categories/CategoriesView').then(m => ({ default: m.CategoriesView }))
);
const EmergencyFundView = lazy(() =>
  import('./components/emergency/EmergencyFundView').then(m => ({ default: m.EmergencyFundView }))
);
const InvestmentsView = lazy(() =>
  import('./components/investments/InvestmentsView').then(m => ({ default: m.InvestmentsView }))
);
const DreamsView = lazy(() =>
  import('./components/dreams/DreamsView').then(m => ({ default: m.DreamsView }))
);
const AIHealthSummaryView = lazy(() =>
  import('./components/ai/AIHealthSummaryView').then(m => ({ default: m.AIHealthSummaryView }))
);
const StatementImportView = lazy(() =>
  import('./components/import/StatementImportView').then(m => ({ default: m.StatementImportView }))
);
const SettingsView = lazy(() =>
  import('./components/settings/SettingsView').then(m => ({ default: m.SettingsView }))
);

const MainContent: React.FC = () => {
  const { currentView } = useFinance();
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

  const handleOpenAddTx = () => {
    setEditingTx(null);
    setIsAddTxOpen(true);
  };

  const handleEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setIsAddTxOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] dark:bg-[#0B0E14] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Desktop Sidebar */}
      <Sidebar onOpenAddTx={handleOpenAddTx} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Top Navbar */}
        <Navbar onOpenAddTx={handleOpenAddTx} />

        {/* Dynamic Lazy-Loaded View Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Suspense fallback={<ViewSkeleton />}>
            <ViewTransition viewKey={currentView}>
              {currentView === 'dashboard' && <DashboardView onOpenAddTx={handleOpenAddTx} />}
              {currentView === 'transactions' && (
                <TransactionListView
                  onOpenAddModal={handleOpenAddTx}
                  onEditTransaction={handleEditTx}
                />
              )}
              {currentView === 'people' && <PeopleView />}
              {currentView === 'budgets' && <BudgetsView />}
              {currentView === 'recurring' && <RecurringPaymentsView />}
              {currentView === 'categories' && <CategoriesView />}
              {currentView === 'emergency' && <EmergencyFundView />}
              {currentView === 'investments' && <InvestmentsView />}
              {currentView === 'dreams' && <DreamsView />}
              {currentView === 'ai' && <AIHealthSummaryView />}
              {currentView === 'import' && <StatementImportView />}
              {currentView === 'settings' && <SettingsView />}
            </ViewTransition>
          </Suspense>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav onOpenMore={() => setIsMoreDrawerOpen(true)} />

      {/* Mobile More Drawer */}
      <MobileMoreDrawer
        isOpen={isMoreDrawerOpen}
        onClose={() => setIsMoreDrawerOpen(false)}
      />

      {/* Global Add/Edit Transaction Modal */}
      <TransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        initialTransaction={editingTx}
      />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainContent />
    </FinanceProvider>
  );
}
