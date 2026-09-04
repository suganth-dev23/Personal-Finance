# DhanVeda (धनवेद) — Personal Finance & Wealth Tracker

> **Dhan** (*wealth, prosperity*) + **Veda** (*knowledge, clarity, disciplined ledger*)

DhanVeda is an Indian Rupee (INR ₹) personal finance tracker and wealth management application built for Indian users. It runs entirely client-side with offline-first PWA support, local-first IndexedDB persistence, optional Google Drive private backup sync, and zero backend telemetry.

---

## Key Features

- **Master Wealth Ledger**: Track your real-time total net worth, monthly cash flow velocity, and savings rate.
- **Indian Asset Allocation**: Track mutual funds, Indian equities, Fixed Deposits (FD), Recurring Deposits (RD), Gold / Sovereign Gold Bonds (SGB), EPF / PPF, and NPS.
- **Statement & Bill Import Engine**: Client-side Web Worker parsing for Indian bank & UPI statements (.CSV and .PDF) with automatic duplicate detection and Indian merchant auto-categorization (Swiggy, Zomato, Zepto, Zerodha, Blinkit, CRED, etc.).
- **Peer Splits & IOUs**: Track shared expenses with friends, roommates, and family with multi-person split math and settlement records.
- **Emergency Safety Reserve**: Real-time runway analysis calculating how many months of baseline expenses are secured in liquid funds.
- **Milestone Goals & Dreams**: Calculate automatic monthly savings plans for aspirational targets (vehicle, vacation, gadget, home down-payment).
- **Private BYOK AI Financial Intelligence**: Bring Your Own Key (Google Gemini, OpenAI, or Anthropic Claude) for client-side financial health summaries with zero server-side telemetry.
- **Installable PWA**: Works offline with service worker caching and installable on Android, iOS, and desktop.

---

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (Class-based dark/light mode)
- **Visuals & Charts**: Lucide React + Recharts
- **Storage & Sync**: IndexedDB (`idb`) + Google Drive AppData Folder Sync
- **Parsers**: PapaParse (CSV) + PDF.js (Web Worker)
- **PWA**: `vite-plugin-pwa` + Workbox

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/suganth-dev23/Personal-Finance.git

# Navigate into the project directory
cd Personal-Finance

# Install dependencies
npm install

# Start the local development server
npm run dev
```

### Production Build

```bash
# Run TypeScript checks and Vite production build
npm run build

# Preview production build locally
npm run preview
```

---

## Privacy & Security

- **Zero Server Telemetry**: All transactions, bank statements, and credentials are stored strictly in your browser's IndexedDB and local storage.
- **Private Cloud Backup**: Google Drive sync uses the secure `drive.appdata` sandboxed scope, invisible to other apps and entirely owned by you.
- **Client-Side AI**: Prompts are sent directly from your browser to your chosen AI provider without intermediate proxy servers.

---

## License

MIT License. Crafted for personal wealth stewardship.
