import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { MobileMoreDrawer } from './MobileMoreDrawer';

const CommandPalette = lazy(() =>
  import('./CommandPalette').then(m => ({ default: m.CommandPalette }))
);

export interface AppLayoutProps {
  children: React.ReactNode;
  onOpenAddTx: () => void;
}

/**
 * AppLayout Component
 * Manages responsive layout shells (Sidebar, Navbar, Bottom/MobileNav, MoreDrawer, CommandPalette)
 * and global keyboard navigation triggers (Cmd+K / Ctrl+K).
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children, onOpenAddTx }) => {
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const handleOpenCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true);
  }, []);

  const handleCloseCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(false);
  }, []);

  return (
    <div className="flex min-h-screen bg-app dark:bg-app text-ink-1 transition-colors">
      {/* Desktop Sidebar */}
      <Sidebar onOpenAddTx={onOpenAddTx} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full pb-20 lg:pb-8 overflow-x-clip">
        {/* Top Navbar */}
        <Navbar
          onOpenAddTx={onOpenAddTx}
          onOpenCommandPalette={handleOpenCommandPalette}
        />

        {/* View Content Slot */}
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        onOpenMore={() => setIsMoreDrawerOpen(true)}
        onOpenAddTx={onOpenAddTx}
        isMoreOpen={isMoreDrawerOpen}
      />

      {/* Mobile More Drawer */}
      <MobileMoreDrawer
        isOpen={isMoreDrawerOpen}
        onClose={() => setIsMoreDrawerOpen(false)}
      />

      {/* Quick Command Palette (Ctrl+K) */}
      {isCommandPaletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={handleCloseCommandPalette}
            onOpenAddTx={onOpenAddTx}
          />
        </Suspense>
      )}
    </div>
  );
};

export default AppLayout;
