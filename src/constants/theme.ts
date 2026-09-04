/**
 * DhanVeda Design System Tokens
 * Single source of truth for color palette, surfaces, and Indian wealth chart colors.
 */

export const THEME_TOKENS = {
  canvas: {
    dark: '#0B0E14',  // Deep Basalt
    light: '#F8F9FA', // Crisp Porcelain
  },
  card: {
    dark: '#131822',  // Inkstone Surface
    light: '#FFFFFF', // Pure White
  },
  inset: {
    dark: '#171E2A',  // Secondary Shelf / Inset Well
    light: '#F1F5F9', // Light Slate Well
  },
  border: {
    dark: '#202836',  // Quiet Mineral 1px Border
    light: '#E2E8F0', // Quiet Slate Border
  },
  gold: {
    primary: '#F5B742', // Suvarna Gold (Dark mode brand anchor)
    muted: '#C28834',   // Suvarna Gold (Light mode contrast)
  },
  emerald: {
    inflow: '#10B981',  // Inflows, Positive Returns, Surplus
    dark: '#059669',
  },
  crimson: {
    outflow: '#F43F5E', // Outflows, Expenses, Debts Owed, Burns
    dark: '#E11D48',
  },
} as const;

/**
 * Pinned Indian Wealth Allocation Palette (Fixed Hex Values)
 * Used consistently across Portfolio Allocation Chart, Holdings, and Valuation Bars.
 */
export const INDIAN_WEALTH_PALETTE: Record<string, string> = {
  'Gold / SGB': '#F5B742',             // 1. Suvarna Gold (Gold, SGB, Sovereign Bullion)
  'Mutual Funds': '#10B981',           // 2. Emerald (Equity / Hybrid SIPs & Mutual Funds)
  'Stocks': '#3B82F6',                 // 3. Sapphire (Direct Indian Equities NSE/BSE)
  'Fixed Deposit (FD)': '#0D9488',     // 4. Deep Teal (Bank & Corporate FDs)
  'Recurring Deposit (RD)': '#06B6D4', // 5. Cyan (Postal & Bank RDs)
  'PPF / EPF': '#6366F1',              // 6. Indigo (Retirement & Provident Funds)
  'NPS': '#EC4899',                    // 7. Coral Rose (National Pension Scheme)
  'Crypto': '#A855F7',                 // 8. Amethyst
  'Real Estate': '#C28834',            // 9. Bronze Earth
  'Bonds / Debt': '#14B8A6',           // 10. Mint
  'Other': '#64748B',                  // 11. Slate Neutral
};

/**
 * Standard Category Chart Palette (for Expense Breakdowns)
 */
export const CATEGORY_EXPENSE_PALETTE: Record<string, string> = {
  'food & dining': '#F59E0B',      // Amber
  'groceries': '#10B981',          // Emerald
  'shopping': '#EC4899',           // Coral
  'entertainment': '#8B5CF6',      // Violet
  'travel & fuel': '#06B6D4',      // Cyan
  'bills & utilities': '#3B82F6',  // Sapphire
  'health & fitness': '#EF4444',   // Ruby
  'investments': '#F5B742',        // Suvarna Gold
  'education': '#14B8A6',          // Mint
  'personal care': '#F43F5E',      // Crimson
  'gifts & donations': '#A855F7',  // Purple
  'other': '#64748B',              // Slate
};
