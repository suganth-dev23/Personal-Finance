import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  LayoutDashboard,
  Receipt,
  PieChart,
  CalendarClock,
  Tags,
  Users,
  TrendingUp,
  Target,
  ShieldCheck,
  Trophy,
  Sparkles,
  FileSpreadsheet,
  Settings,
  Plus,
  Sun,
  Moon,
  EyeOff,
  Cloud,
  X,
} from 'lucide-react';
import { useFinance, AppView } from '../../context/FinanceContext';
import { useOverlayTransition } from '../../hooks/useOverlayTransition';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddTx: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Navigation' | 'Actions';
  icon: React.ElementType;
  keywords: string[];
  action: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenAddTx,
}) => {
  const {
    setCurrentView,
    darkMode,
    setDarkMode,
    isDriveConnected,
    triggerSync,
  } = useFinance();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const { shouldRender, isAnimatingIn } = useOverlayTransition({
    isOpen,
    onClose,
    duration: 200,
  });

  const focusTrapRef = useFocusTrap<HTMLDivElement>({
    isActive: Boolean(shouldRender && isAnimatingIn),
    onEscape: onClose,
  });

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const togglePrivacyMode = () => {
    try {
      const isCurrentlyPrivacy = localStorage.getItem('dhanveda_privacy') === 'on';
      const next = !isCurrentlyPrivacy;
      if (next) {
        localStorage.setItem('dhanveda_privacy', 'on');
        document.documentElement.setAttribute('data-privacy', 'on');
      } else {
        localStorage.setItem('dhanveda_privacy', 'off');
        document.documentElement.removeAttribute('data-privacy');
      }
      window.dispatchEvent(new CustomEvent('dhanveda-privacy-change'));
    } catch {
      // Storage unavailable fallback
    }
  };

  const commands = useMemo<CommandItem[]>(() => {
    const navItems: { view: AppView; title: string; subtitle: string; icon: React.ElementType; keywords: string[] }[] = [
      { view: 'dashboard', title: 'Dashboard', subtitle: 'Net worth & monthly overview', icon: LayoutDashboard, keywords: ['home', 'overview', 'summary'] },
      { view: 'transactions', title: 'Transactions', subtitle: 'History & expense log', icon: Receipt, keywords: ['ledger', 'history', 'expenses', 'income'] },
      { view: 'budgets', title: 'Budgets', subtitle: 'Category spending limits', icon: PieChart, keywords: ['limits', 'caps', 'allocations'] },
      { view: 'recurring', title: 'Recurring Payments', subtitle: 'Subscriptions & bills', icon: CalendarClock, keywords: ['emi', 'subscriptions', 'bills', 'rent'] },
      { view: 'categories', title: 'Categories', subtitle: 'Custom tags & spending groups', icon: Tags, keywords: ['tags', 'groups', 'labels'] },
      { view: 'people', title: 'People & Splits', subtitle: 'Shared bills & settle up', icon: Users, keywords: ['friends', 'iou', 'borrow', 'lent', 'splits'] },
      { view: 'investments', title: 'Investments', subtitle: 'Stocks, mutual funds & gold', icon: TrendingUp, keywords: ['portfolio', 'sip', 'assets', 'grow'] },
      { view: 'dreams', title: 'Goals & Dreams', subtitle: 'Savings targets & progress', icon: Target, keywords: ['goals', 'milestones', 'wishlist'] },
      { view: 'emergency', title: 'Emergency Fund', subtitle: 'Runway & financial safety net', icon: ShieldCheck, keywords: ['runway', 'safety', 'cushion'] },
      { view: 'badges', title: 'Achievements', subtitle: 'Financial badges & XP levels', icon: Trophy, keywords: ['gamification', 'xp', 'level', 'rewards'] },
      { view: 'ai', title: 'AI Health Summary', subtitle: 'Smart wealth advisor & insights', icon: Sparkles, keywords: ['ai', 'health', 'insights', 'analysis'] },
      { view: 'import', title: 'Import Statement', subtitle: 'Upload PDF & CSV bank statements', icon: FileSpreadsheet, keywords: ['statement', 'bank', 'pdf', 'csv', 'upload'] },
      { view: 'settings', title: 'Settings', subtitle: 'Drive sync, backup & preferences', icon: Settings, keywords: ['backup', 'preferences', 'export', 'cloud'] },
    ];

    const list: CommandItem[] = navItems.map(item => ({
      id: `nav-${item.view}`,
      title: item.title,
      subtitle: item.subtitle,
      category: 'Navigation',
      icon: item.icon,
      keywords: item.keywords,
      action: () => {
        setCurrentView(item.view);
        onClose();
      },
    }));

    list.push({
      id: 'action-add-tx',
      title: 'Add Transaction',
      subtitle: 'Create a new expense, income, or transfer',
      category: 'Actions',
      icon: Plus,
      keywords: ['new', 'create', 'add', 'record', 'payment'],
      action: () => {
        onClose();
        onOpenAddTx();
      },
      shortcut: 'N',
    });

    list.push({
      id: 'action-toggle-theme',
      title: darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      subtitle: 'Toggle theme display appearance',
      category: 'Actions',
      icon: darkMode ? Sun : Moon,
      keywords: ['theme', 'dark', 'light', 'mode'],
      action: () => {
        setDarkMode((prev: boolean) => !prev);
        onClose();
      },
    });

    list.push({
      id: 'action-toggle-privacy',
      title: 'Toggle Privacy Mode',
      subtitle: 'Blur or reveal monetary values on screen',
      category: 'Actions',
      icon: EyeOff,
      keywords: ['privacy', 'blur', 'hide', 'amounts', 'stealth'],
      action: () => {
        togglePrivacyMode();
        onClose();
      },
    });

    if (isDriveConnected) {
      list.push({
        id: 'action-sync-drive',
        title: 'Sync Google Drive Now',
        subtitle: 'Backup and push latest ledger records to cloud',
        category: 'Actions',
        icon: Cloud,
        keywords: ['drive', 'sync', 'google', 'backup', 'cloud'],
        action: () => {
          triggerSync(true);
          onClose();
        },
      });
    }

    return list;
  }, [setCurrentView, onClose, onOpenAddTx, darkMode, setDarkMode, isDriveConnected, triggerSync]);

  // Robust search filtering without regex to safely handle any special characters
  const filteredCommands = useMemo(() => {
    const raw = query.trim().toLowerCase();
    if (!raw) return commands;

    return commands.filter(item => {
      if (item.title.toLowerCase().includes(raw)) return true;
      if (item.subtitle && item.subtitle.toLowerCase().includes(raw)) return true;
      if (item.category.toLowerCase().includes(raw)) return true;
      return item.keywords.some(k => k.toLowerCase().includes(raw));
    });
  }, [commands, query]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSelectedIndex(0);
  };

  // Safe index clamped
  const safeIndex = filteredCommands.length > 0
    ? Math.min(Math.max(0, selectedIndex), filteredCommands.length - 1)
    : -1;

  // Scroll active item into view
  useEffect(() => {
    if (safeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${safeIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [safeIndex]);

  // Handle keyboard navigation: ArrowUp, ArrowDown, Enter, Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredCommands.length > 0) {
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredCommands.length > 0) {
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (safeIndex >= 0 && filteredCommands[safeIndex]) {
        filteredCommands[safeIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!shouldRender || typeof document === 'undefined') return null;

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 transition-opacity duration-200 ease-out ${
          isAnimatingIn ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Container */}
      <div
        ref={focusTrapRef}
        onKeyDown={handleKeyDown}
        className={`relative w-full max-w-xl bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden transition-opacity transition-transform duration-200 ease-out transform will-change-transform ${
          isAnimatingIn ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4'
        }`}
      >
        <h2 id="command-palette-title" className="sr-only">
          Quick Command Palette
        </h2>

        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-line">
          <Search className="w-5 h-5 text-ink-3 shrink-0 mr-3 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Type a command, view, or action..."
            aria-label="Search commands and views"
            className="w-full bg-transparent text-sm sm:text-base text-ink-1 placeholder:text-ink-3 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search query"
              className="p-1 rounded-lg text-ink-3 hover:text-ink-1 transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-semibold text-ink-3 bg-sunken rounded border border-line">
              ESC
            </kbd>
          )}
        </div>

        {/* Command List */}
        <div
          ref={listRef}
          role="listbox"
          aria-label="Commands"
          className="max-h-[360px] overflow-y-auto p-2 space-y-1"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-10 text-center text-ink-3 text-xs sm:text-sm">
              <p className="font-semibold text-ink-2">No matching commands</p>
              <p className="mt-1 text-xs text-ink-3">
                No view or action found for &ldquo;{query}&rdquo;
              </p>
            </div>
          ) : (
            filteredCommands.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === safeIndex;
              return (
                <button
                  key={item.id}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer min-h-[44px] ${
                    isSelected
                      ? 'bg-primary-tint text-primary'
                      : 'text-ink-2 hover:bg-sunken hover:text-ink-1'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-primary text-on-primary'
                          : 'bg-sunken text-ink-2 border border-line'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs sm:text-sm font-semibold truncate ${isSelected ? 'text-primary' : 'text-ink-1'}`}>
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-xs text-ink-3 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-sunken text-ink-3 border border-line">
                      {item.category}
                    </span>
                    {isSelected && (
                      <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs font-bold text-primary bg-primary/10 rounded">
                        ↵
                      </kbd>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 bg-sunken border-t border-line flex items-center justify-between text-xs text-ink-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line font-mono text-xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line font-mono text-xs">↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line font-mono text-xs">↵</kbd>
              <span>select</span>
            </span>
          </div>
          <span>DhanVeda Quick Navigation</span>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
