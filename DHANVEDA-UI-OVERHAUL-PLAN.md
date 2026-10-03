# DhanVeda UI Overhaul: Handoff Plan (mobile + laptop)

**Repo:** `github.com/suganth-dev23/dhanveda-preview` @ `5e78d55` (2026-09-30)
**Audience:** an AI coding agent that has not seen this project. Everything below was measured on the repo, not assumed. Re-verify numbers before relying on them (commands in Appendix B).
**Goal:** a calmer, more trustworthy, more rewarding UI on both phone and laptop, grounded in behavioural psychology and accessibility, **without changing any existing behaviour or data.**

---

## 0. Rules of engagement (read first)

1. **Verify before you implement.** For every task: open the named file, confirm the claim, then edit. If a claim here is wrong, say so and adapt; do not force it.
2. **One phase = one PR.** Stop at each phase gate (section 12). Do not start the next phase until the gate passes.
3. **Re-skin first, restructure second.** Phases 1-2 change only colours, type and primitives. Layout and IA change later, behind unchanged data flow.
4. **Presentation only.** Do not change `FinanceContext` function signatures, the `AppView` union, IndexedDB schema (`src/utils/db.ts`), stored data shapes, or localStorage keys (full list in section 11).
5. **No new runtime dependencies** without asking. Dev-only tools (Playwright, axe-core) are fine if the user approves.
6. **There are no automated tests in the repo** (0 test files, 0 `data-testid`). Your safety net is: `tsc -b`, `oxlint`, `vite build`, the smoke script (Appendix B) and the manual matrix (section 13). Run all of them at every gate.
7. **Report format per phase:** what changed (files), what you verified (commands + results), what you deliberately did not touch, open questions.

---

## 1. Scope

**In scope:** visual language (colour, type, spacing, radius, elevation, motion), shared UI primitives, navigation/IA presentation, layout of all 13 views and 15 modals, mobile and desktop interaction patterns, additive enhancements (section 10).
**Out of scope:** new routes/views, data model changes, sync logic, import parsers, gamification event logic, scoring formulas, new backend.

---

## 2. Verified baseline

| Area | Fact (measured) |
|---|---|
| Stack | React 19.2, Vite, Tailwind CSS 4.3 (`@tailwindcss/vite`), Recharts 3.10, lucide-react, idb, canvas-confetti, vite-plugin-pwa, pdfjs-dist, papaparse |
| Health | `tsc -b` clean; `oxlint` 0 errors / 41 warnings; build ~1.7 s |
| Views | 13 ids in `AppView` (`src/context/FinanceContext.tsx:46`): dashboard, transactions, budgets, recurring, categories, emergency, investments, dreams, people, ai, import, settings, badges |
| Shell | `layout/Sidebar.tsx` (190 lines, `hidden lg:flex w-64`), `Navbar.tsx` (131), `MobileNav.tsx` (101), `MobileMoreDrawer.tsx` (146), `App.tsx` (147, `pb-20 lg:pb-8`) |
| Big files | `FinanceContext.tsx` 2,280 lines; `PeopleView` 1,098; `TransactionListView` 1,028; `TransactionModal` 1,027 |
| Colour classes | slate 2,414; amber 630; emerald 506; rose 271; teal 22; cyan 17; indigo 13; sky 2 (counted over bg/text/border/ring/from/to/via/fill/stroke/shadow). 74 `bg-gradient-to-*`, 91 `from-amber|orange-*` |
| Tokens | `@theme` in `src/index.css:3-30` defines canvas/card/inset/border/hover/active (+ `-dark`) and gold/emerald/crimson. `gold`, `gold-muted`, `emerald-deep`, `crimson*`, `canvas`, `hover` have **0** utility-class uses. `body` hardcodes `bg-[#F8F9FA]` / `dark:bg-[#0B0E14]` (`index.css:~177`) |
| Radius | `rounded-xl` 283, `2xl` 144, `full` 81, `lg` 80, `3xl` 75, `md` 40 |
| Type | `text-xs` 543, `text-sm` 167, `text-[11px]` 91, `text-[10px]` 50, `text-[9px]` 6 (**147 uses under 12 px**). Fonts: Plus Jakarta Sans + JetBrains Mono (`.font-numeric`, 243 uses, `index.css:~183`, enables `"zero" 1` slashed zero) |
| Dark mode | `dark` class on `<html>`; boot script in `index.html:~28-42`; `@custom-variant dark` in `index.css:193` |
| PWA colours | `theme_color` / `background_color` `#0B0E14` in `vite.config.ts:35-36`; `<meta name="theme-color">` in `index.html:12` |
| Bundle baseline | main `index` 307.0 kB (93.1 gz); `vendor-charts` 429.3 kB (121.2 gz); `vendor-pdf` 427.2 kB (127.5 gz); `DashboardView` 66.4 kB (13.7 gz); `PeopleView` 75.0 kB (14.0 gz); CSS 124.2 kB (18.0 gz) |
| Tailwind v4 facts (tested) | Redefining a scale value inside `@theme` (e.g. `--color-slate-900`) changes compiled output and `.text-slate-900` reads the variable. **Unused custom tokens are not emitted** unless they appear in markup; use `@theme static` for tokens referenced only from CSS/Recharts/inline styles |
| Demo data | `src/utils/sampleData.ts` has hardcoded dates (2026-06 to 2026-09). In October the "this month" cards show ₹0 and budgets 0% used, which makes demo screenshots misleading |

---

## 3. Diagnosis: what is wrong today

| # | Problem | Evidence | Why it matters |
|---|---|---|---|
| D1 | **One colour carries four meanings.** Amber/orange is brand, primary CTA, warning, and reward (streak, XP, level) | 630 amber uses; CTAs use `from-amber-500 to-orange-600`; "AI Health", streak, XP, level chips all amber | Users cannot tell "press this" from "be careful" from "you earned this" |
| D2 | **Status colours fail contrast as text on white** | 2.56:1 `slate-400`; 3.19 `amber-600`; 2.54 `emerald-500`; 3.77 `emerald-600`; 3.67 `rose-500`; 1.79 gold (AA needs 4.5:1). `text-slate-400` appears 217 times as a light-mode class (plus 305 `dark:text-slate-400`, which pass on dark); `text-slate-500` appears 289 times in light mode (4.4:1 on the proposed warm canvas, 4.11:1 on inset) and `dark:text-slate-500` 19 times (3.74:1 on dark surface) | Unreadable in sunlight on phones; fails WCAG AA |
| D3 | **Red is used for ordinary spending** | Spend totals render in rose: Dashboard "Monthly spend", Transactions "Total Outflow", Budgets "Actual Spent", even when the value is ₹0 (individual expense rows in the recent list are neutral ink) | Constant red on routine totals = low-grade anxiety and alarm fatigue; real overspend no longer stands out. Zero is shown in red too |
| D4 | **Money is set in a code font.** Hero figures use JetBrains Mono with slashed zeros | `.font-numeric`; and JetBrains Mono has **no ₹ glyph** (checked with fontTools), so ₹ falls back to another font and mismatches the digits | Reads as a developer tool, not a wealth app; inconsistent glyphs on the most important number |
| D5 | **Primary action is repeated 3-5 times per screen** | Desktop dashboard shows sidebar "Add Transaction", navbar "Add" and hero "Add transaction" at once; empty state adds a fourth | Dilutes the one action that matters (isolation effect) |
| D6 | **Same hero template on every screen** | Eyebrow label + big number + 4 mini stat cards appears in all 13 `*View.tsx` files | Every page feels identical; hierarchy flat; stats-in-card-in-card nesting |
| D7 | **Mobile first screen is chrome, not content** | At 390x844, Transactions shows header, hero, 4 stats, then filters; ledger rows start below the fold | Slow to the task; thumbs scroll before they act |
| D8 | **12 flat navigation items** | `Sidebar.tsx:31-42` | Choice overload; no grouping by user intent |
| D9 | **Tiny text** | 147 uses of 9-11 px | Hard to read on phones; accessibility |
| D10 | **Radius and elevation are inconsistent** | six radii in heavy use; 100 `shadow-sm` + 70 `shadow-xs` | No visual rhythm; cards look interchangeable |
| D11 | **Chart axis mixes units** | Dashboard cash flow Y axis reads `2 L, 1.5 L, 1 L, 50 K, 0` | Inconsistent scale labelling confuses magnitude |
| D12 | **Surface separation is faint** | card vs canvas 1.08:1 light, 1.09:1 dark; hairline borders only | Cards float without structure; relies on borders |
| D13 | **Misleading demo** | hardcoded sample dates | First impression shows empty month |
| D14 | **Dark-mode borders and input edges** | `#202836` on `#131822` = 1.20:1 | Form fields not identifiable (WCAG 1.4.11 needs 3:1 for input boundaries) |

---

## 4. Psychology to design decisions

> **Honesty note.** Colour-meaning claims ("blue builds trust") are context-dependent and weaker than popular articles imply. Treat the colour choices below as *conventions plus accessibility*, to be validated with the user, not as laws. The behavioural principles (loss aversion, goal gradient, etc.) are better supported; apply them with restraint.

| Principle | In one line | Decision for DhanVeda |
|---|---|---|
| **Hick's law / chunking** | More choices, slower decisions | Group 12 nav items into 5 labelled sections; More sheet uses same groups; max 4-6 items per card group |
| **Fitts's law / thumb zone** | Big, near targets are quicker | Mobile primary actions in the bottom 40% of the screen; 44 px minimum targets (48 px for primary); forms and pickers as bottom sheets |
| **Von Restorff (isolation)** | The odd one out is remembered | Exactly one filled primary button per viewport; everything else secondary/ghost |
| **Gestalt (proximity, common region, similarity)** | People group by closeness and shared surface | Replace card-in-card stat grids with dividers and tonal inset; consistent spacing scale |
| **Loss aversion** | Losses feel about twice as strong as equal gains | Frame budgets as **"₹X left"** (already partly done); reserve red for genuine breach; no red for ordinary spend or zero; streaks get a grace mechanic (section 10) instead of a punishing reset |
| **Mental accounting** | People think in buckets | Make buckets visible: Budgets, Goals, Emergency Fund shown as named envelopes with their own colour chip and progress |
| **Goal-gradient & endowed progress** | Effort rises near the finish; a head start motivates | Progress rings/bars get a subtle emphasis in the last 20%; onboarding checklist starts with "Account created" already ticked |
| **Peak-end rule** | People remember the peak and the end | After saving a transaction or settling a split show a short, calm success moment; keep confetti for rare milestones only |
| **Zeigarnik effect** | Unfinished tasks stay in mind | One dismissible "Finish setup 2/5" card (set budget, add goal, add recurring bill, import statement, enable backup) |
| **Aesthetic-usability / processing fluency** | Consistent, clean UI feels easier and more trustworthy | One type scale, one radius scale, tabular proportional numerals, consistent component states |
| **Default effect / friction** | Smart defaults get used | Quick-add: last-used account/category, today's date, numeric keypad (`inputmode="decimal"`), amount field focused first |
| **Calm technology** | Inform without demanding attention | Motion and celebration are proportional; honour reduced motion (already implemented); optional "calm mode" (section 10) |
| **Colour-vision deficiency** | Roughly 1 in 12 men cannot separate red/green reliably | Never rely on red vs green alone: always add sign (+/-), icon or label |
| **Cultural fit (India)** | Gold/saffron read as prosperity; "Dhan" means wealth | Keep gold as a **reward/prosperity accent** (badges, level, net-worth highlight line) and stop using it as the generic button colour |

---

## 5. Design system specification

### 5.1 Colour: semantic roles

Principle: **meaning is carried by role tokens, not by hue names in components.** Components use `primary`, `positive`, `negative`, `warning`, `reward`, `info`, never `amber-500` directly (except via a role).

| Role | Used for | Light | Dark |
|---|---|---|---|
| **canvas** | page background | `#F7F6F3` (warm paper) | `#0B0E14` (keep) |
| **surface** | cards | `#FFFFFF` | `#131822` (keep) |
| **inset** | tonal wells, chips | `#F0EEEA` | `#171E2A` (keep) |
| **border-subtle** | decorative dividers | `#E4E1DA` | `#202836` (keep) |
| **border-input** | form control edges | `#7D838D` | `#66728D` |
| **text-1** | primary text | `#14181F` | `#E8ECF4` |
| **text-2** | secondary text | `#4B5563` | `#A3AEC2` |
| **text-3** | captions (min 12 px) | `#5F6B7A` | `#8591A8` |
| **primary** | CTAs, links, focus, selected nav, chart accent | `#2B4FD8` (text on it `#FFFFFF`) | `#8FA8FF` (text on it `#0B0E14`) |
| **positive** | income, on-track, gains | `#0B7A55` / tint `#E6F5EE` | `#3DD6A0` |
| **negative** | **breach only**: overspent budget, overdue, liabilities | `#C2253F` / tint `#FCEBEE` | `#FF7A8E` |
| **warning** | nearing limit, due soon | `#8A5300` on tint `#FFF3D6` | `#FFB84D` |
| **reward** | XP, level, badges, streak, net-worth accent line | `#8F6410` text on tint `#FFF6DD`; gold `#F5B742` for fills/glow | `#F5B742` |

**Verified contrast (WCAG 2.x, computed, not estimated):**

| Pair | Ratio | Target |
|---|---|---|
| text-1 on surface (light) | 17.79 | 4.5 |
| text-2 on surface (light) | 7.56 | 4.5 |
| text-3 `#5F6B7A` on canvas `#F7F6F3` | 5.02 | 4.5 |
| primary `#2B4FD8` on white / white on primary | 6.54 | 4.5 |
| positive `#0B7A55` on white / on tint | 5.34 / 4.75 | 4.5 |
| negative `#C2253F` on white / on tint | 5.78 / 5.03 | 4.5 |
| warning `#8A5300` on `#FFF3D6` | 5.74 | 4.5 |
| reward text `#8F6410` on `#FFF6DD` | 4.87 | 4.5 |
| light input edge `#7D838D` on white / on canvas | 3.82 / 3.53 | 3.0 |
| dark text-1 / text-2 / text-3 on surface | 15.01 / 7.95 / 5.60 | 4.5 |
| dark primary `#8FA8FF` on surface; `#0B0E14` on primary | 7.80 / 8.47 | 4.5 |
| dark positive / negative / warning / reward on surface | 9.59 / 7.13 / 10.34 / 9.93 | 4.5 |
| dark input edge `#66728D` on surface `#131822` / on inset `#171E2A` | 3.69 / 3.47 | 3.0 |
| light text-3 on inset `#F0EEEA` / dark text-3 on inset `#171E2A` | 4.68 / 5.27 | 4.5 |
| (current) `slate-500` `#64748B` on warm canvas / on inset | 4.40 / 4.11 | 4.5 (fails) |

The implementer must re-verify any value they change using the script in Appendix B.

**Colour rules**
- **One accent per viewport.** `primary` is the only filled button colour. Gold appears only inside gamification components (list in 9.13) plus one thin accent line on the net-worth hero.
- **Expenses are neutral ink with a leading minus**, income is `positive` with a plus. `negative` is used only for: budget over 100%, overdue bills, liabilities/debt balances, destructive buttons.
- **Zero is neutral.** `₹0` is always `text-2`, never red or green.
- **Always pair colour with a second cue** (sign, icon, label).
- **Surface separation:** cards differ from canvas by tonal step *and* a soft shadow in light mode (`0 1px 2px rgb(20 24 31 / .06), 0 4px 16px rgb(20 24 31 / .04)`); in dark mode by tonal step (surface lighter than canvas), not shadow.
- **PWA/browser chrome:** update `theme_color`, `background_color` and `<meta name="theme-color">` to the final dark canvas (and add a light-scheme meta with `media="(prefers-color-scheme: light)"`).
- **User data colours are untouchable.** Category colours (e.g. `#f97316` in `sampleData.ts`) are stored hex values chosen by users. Do not remap stored values; adapt only how they are rendered (tinted background + readable icon).

**Implementation approach (low risk, high reach):**
1. Add semantic tokens in `@theme static` (`--color-primary`, `--color-positive`, ... plus `-tint` and dark counterparts via `.dark` overrides or `-dark` suffix tokens consistent with the existing naming).
2. Remap the *existing* `--color-canvas/card/inset/border/hover/active` values first; switch `body` to use them (it hardcodes hex today).
3. **Do NOT override `--color-slate-400/500` globally.** One variable serves both `text-slate-400` (light) and `dark:text-slate-400` (305 uses, currently 6.93:1 on dark and correct); darkening it for light mode would break dark mode. Instead define **mode-aware text tokens** (`--color-ink-1/2/3` set under `:root` and overridden under `.dark`, exposed as `text-ink-1/2/3` utilities; tested in this repo: `@theme inline { --color-ink-3: var(--ink-3); }` with `:root { --ink-3: ... } .dark { --ink-3: ... }` compiles to `.text-ink-3{color:var(--ink-3)}` and switches with the `dark` class) and codemod: light `text-slate-900/800` to `ink-1`; `text-slate-700/600` to `ink-2`; `text-slate-500/400` to `ink-3`; delete the paired `dark:text-slate-*` classes on those lines once the token handles both modes. Review the diff per folder; check placeholders and disabled states still look intentionally muted.
4. Run a **semantic codemod** (reviewed diff, not blind regex) that classifies each amber/orange usage as `primary`, `warning` or `reward` by component context (CTA buttons to primary; badges/XP/streak to reward; overdue/near-limit to warning). Same for emerald (positive) and rose (negative vs. neutral expense). Do it per folder, one commit per folder.

### 5.2 Typography

- **Drop JetBrains Mono for money.** Plus Jakarta Sans has tabular numerals (`tnum` verified in the font) and its ₹ glyph ships in the `latin-ext` subset that Google Fonts serves automatically via `unicode-range`. Redefine `.font-numeric` as `font-variant-numeric: tabular-nums lining-nums` using `--font-sans`, **remove `"zero" 1`**, and remove the JetBrains Mono request from `index.html:24` (saves a font download). Keep the class name so no component edits are needed.
- Fallback check: confirm ₹ renders in the primary face on Chrome, Safari iOS and Firefox before removing the mono font. If any platform falls back, add `Inter` (also has `tnum` and ₹ in latin-ext) as second family.
- **Scale (rem, 1.2 ratio, mobile / desktop):** caption 12/12, body-s 14/14, body 15/16, title-s 16/18, title 18/22, headline 22/28, display (hero money) 32/44 with ₹ glyph at 60% size and paise at 60% opacity.
- **Floor of 12 px** for any text; replace all 147 uses of `text-[9px|10px|11px]`. Uppercase eyebrow labels: 12 px, letter-spacing 0.06em, weight 600, not amber.
- Weights: 400 body, 500 labels, 600 titles, 700 for hero money. `font-light` is unused (0), so drop weight 300 from the font request; `font-extrabold` (28 uses) and `font-black` (34 uses) exist, so map them to 700 in the codemod before dropping 800.
- Indian grouping (lakh/crore) must stay: keep using `formatINR` / `formatCompactINR` in `src/utils/currency.ts`. Fix the chart axis (D11) by always using compact notation with one unit family (`50 K`, `1 L`, `1.5 L`) and `0` without unit.

### 5.3 Spacing, radius, elevation

- 4 px base; spacing tokens 4, 8, 12, 16, 24, 32, 48. Page gutters: 16 (mobile), 24 (tablet), 32 (laptop). Card padding 16 (mobile) / 20-24 (laptop).
- **Three radii only:** `--radius-sm` 8 (inputs, chips), `--radius-md` 14 (cards, buttons), `--radius-lg` 24 (hero, sheets). Map existing `rounded-xl/2xl/3xl/lg/md` onto these in the primitives; migrate views gradually.
- Elevation: e0 flat, e1 card, e2 popover/sheet, e3 modal. Light = shadows; dark = surface tint steps.

### 5.4 Motion

Existing tokens (`--duration-*`, `animate-*`, `useReducedMotion`, `rafTicker`, `ViewTransition`) stay. Add only: sheet slide (mobile, 280 ms, ease-out), press feedback (scale 0.97, 100 ms), success check draw (350 ms). Celebrations: confetti only on level-up, badge unlock, goal completed; not on every transaction. All new motion must respect `data-motion="reduced"` / `prefers-reduced-motion`.

### 5.5 Data visualisation

- Categorical palette for charts must be colour-blind-safe and independent of semantic roles: use user category colours where present, otherwise a 8-colour validated palette (implementer chooses, must pass deuteranopia/protanopia simulation).
- Income = positive, spending = neutral ink or primary line (not red), net = primary. Keep dashed forecast lines but add direct labels (end-of-line labels) instead of relying on legend colour.
- Every chart gets an accessible text summary (`aria-label` / visually hidden table) and tooltips with sign + label.

### 5.6 Iconography, illustration, copy

- Keep lucide-react; stroke 1.75 everywhere; 20 px default, 24 px in nav.
- Empty states: one calm line + one action (the unified `EmptyState` exists).
- **Copy tone:** reassuring and specific. "You have ₹12,000 left for Food" not "0% utilised"; "Nothing overdue" not "All clear!!"; avoid guilt copy ("You failed...").

---

## 6. Information architecture and navigation

No new routes. `AppView` ids and `setCurrentView` stay identical; only grouping and labels change.

**Desktop sidebar (≥1024 px)**

| Section | Items |
|---|---|
| (top) | Dashboard |
| **Money** | Transactions, Budgets, Recurring Payments, Categories |
| **People** | People / Splits |
| **Grow** | Investments, Goals & Dreams, Emergency Fund |
| **Insights** | Achievements, AI Health Summary |
| (bottom) | Settings, theme toggle, "100% local" badge |

- Sidebar "Add Transaction" stays as the single primary button on desktop; remove the duplicate navbar "Add" on ≥1024 px; remove the duplicate hero "Add transaction" on Dashboard (keep "Split bill" as secondary).
- Collapsible to icon rail at 1024-1279 px; expanded ≥1280 px.
- Add `Ctrl/Cmd+K` command palette (jump to view, add transaction, search) as an enhancement (section 10).

**Mobile (<1024 px)**

- Bottom tab bar keeps 5 slots: Home, Ledger, **+**, Splits, More. (Decision D-3: swap Splits for Budgets? Default: keep Splits, it is a core India use case.)
- **More** becomes a grouped bottom sheet using the same 4 sections, with a search field and Settings at the bottom.
- The centre **+** opens a quick-add bottom sheet (amount first, numeric keypad, recent categories as chips, "More details" expands to the existing `TransactionModal` form). Must call the same `addTransaction` path.
- Header: title left; streak chip and theme toggle right; month picker where relevant.

---

## 7. Layout systems

| Breakpoint | Behaviour |
|---|---|
| < 360 | single column, 16 px gutters, no horizontal scroll (verified clean at 320 today; keep it) |
| 360-639 | single column; stat groups become a horizontal scroll-snap strip (not 2x2 grids); safe-area insets respected |
| 640-1023 | two-column cards; bottom nav stays |
| 1024-1439 | sidebar + content max-width 1200; 12-column grid |
| ≥1440 | content max-width 1360; optional right "insight rail" on Dashboard |

**Mobile patterns:** sticky compact summary on scroll (net figure collapses into the header), filters in a bottom sheet with active-filter chips above the list, swipe actions on transaction rows (edit/delete) with an **Undo** toast, sheets with drag handle and `visualViewport` awareness so the keyboard never covers the primary button, `inputmode="decimal"` on amount fields, 48 px primary buttons, 44 px minimum for everything tappable.

**Laptop patterns:** master-detail on Transactions (list left, detail/edit panel right at ≥1280), sticky table headers, density toggle (comfortable/compact), hover affordances and visible focus rings, keyboard shortcuts (`N` new, `/` search, `G` then `D/T/B` go to Dashboard/Transactions/Budgets, `?` help), multi-column dashboard grid.

---

## 8. Component library (`src/components/ui/`, new)

Build primitives once, then migrate views onto them. Keep existing `src/components/common/*` working until every consumer is migrated; then delete.

| Primitive | Spec |
|---|---|
| `Button` | variants primary / secondary / ghost / danger; sizes sm 36, md 44, lg 48; loading state; `press` feedback; icon slot |
| `Card` | variants `surface`, `inset`, `hero`, `interactive`; padding by size; uses radius + elevation tokens |
| `Money` | one component for every amount: props `value`, `sign` (auto), `tone` (auto: income positive, expense neutral, zero neutral, debt negative), `size`, `compact`; renders `formatINR`; tabular numerals; ₹ and paise styling; supports privacy blur (section 10) |
| `Delta` | up/down chip with arrow icon + sign + text (never colour alone) |
| `Stat` | label + `Money` + optional delta/sub; replaces ad-hoc stat tiles; supports horizontal-strip layout |
| `Progress` | linear and ring; thresholds (healthy / near / over) mapped to positive / warning / negative with icon; goal-gradient emphasis; animation via existing hooks |
| `Chip` / `Segmented` / `Tabs` | selected state with `primary`; 44 px touch height on mobile |
| `Field` (Input, Select, Textarea, AmountInput) | label above, helper/error text, 3:1 edge, 44 px height, focus ring 2 px primary + 2 px offset |
| `Sheet` | bottom sheet on mobile, centred modal on desktop; wraps existing `Modal` focus trap, scroll lock, Escape, `role="dialog"`; drag-to-dismiss on mobile |
| `Toast` | restyle existing; add Undo action slot |
| `EmptyState`, `Skeleton` | restyle existing |
| `PageHeader` | title, subtitle, actions; replaces the repeated hero header |
| `SectionHeader` | title + optional action link |

Every primitive: light + dark, reduced-motion safe, visible focus, documented props in a short `docs/ui-primitives.md`.

---

## 9. Screen-by-screen

For each: **now → target** and the *reason*. Files are under `src/components/<dir>/`.

**9.1 Shell** (`layout/*`, `App.tsx`): grouped sidebar, rail mode, sticky translucent header (blur) with title/actions, bottom tab bar with safe-area padding, More sheet. *Reason: Hick's law, thumb zone.*

**9.2 Dashboard** (`dashboard/DashboardView.tsx`, `CashFlowChart`, `CategoryExpenseChart`, gauge components): 
- Order: greeting + month → **net worth** hero (single dominant number, thin gold line, delta chip) → "Today" strip (next bill due, budget status, streak) → cash-flow chart and spending by category → Pulse/health → recent transactions.
- Replace the 4-tile stat grid with a single inset row of 4 stats separated by dividers (horizontal scroll-snap on mobile).
- Remove duplicate "Add transaction" in the hero. Empty state: calm banner with 3 setup steps (Zeigarnik) instead of a dark marketing block. 
- *Reason: one primary action, chunking, peak-end.*

**9.3 Transactions** (`transactions/TransactionListView.tsx`, `TransactionModal.tsx`): compact summary strip (net, in, out) instead of hero + 4 tiles; filters collapse into a "Filters" sheet on mobile with chips shown inline; list first. Group by day with date headers and daily net. Amounts via `Money` (expense neutral). Swipe actions + Undo. Desktop master-detail. **Do not regress** the form-wipe fix (commit `1016235`) or recurring/split fields in `TransactionModal`.

**9.4 Budgets** (`budgets/BudgetsView.tsx`, `BudgetModal`): lead with **"₹X left this month"** and days remaining ("₹Y/day safe to spend"); envelope cards with ring progress, threshold colours (positive to warning at 80% to negative over 100%, each with icon + text); remove the speckled 4-segment bar ticks. *Reason: loss aversion framing, mental accounting.*

**9.5 People / Splits** (`people/*`, 1,098 lines): contact list with net balance chips ("owes you ₹X" positive / "you owe ₹X" neutral until overdue), clear settle action, activity timeline. Keep all settlement logic untouched (`SettleSplitModal`, `SettleUpModal`, `EditSplitModal`, `AddContactModal`).

**9.6 Recurring** (`recurring/*`): calendar-ish "due in N days" grouping (Overdue / This week / Later); overdue is the only red; row actions in an overflow menu on mobile (today they wrap; the 320 px wrapping fix is already in `RecurringPaymentsView.tsx`; keep it).

**9.7 Categories** (`categories/*`): grid of colour chips; user colours rendered as tinted tile + readable icon; reorder/edit in sheet.

**9.8 Emergency Fund** (`emergency/*`): single ring with months-of-runway as the headline, goal-gradient emphasis, contribution sheet (`EmergencyContributionModal`). Calm, reassuring tone; reward colour only on milestone.

**9.9 Investments** (`investments/*`): allocation donut + holdings table; gains positive, losses neutral-to-negative with sign; table becomes stacked cards on mobile (currently scrolls inside its container, 864 px wide at 390).

**9.10 Goals & Dreams** (`dreams/*`): goal cards with ring + "₹X to go / ~N months at current pace"; contribution sheet; confetti cleanup stays (`confetti.reset()` on unmount).

**9.11 AI Health Summary** (`ai/*`): readable report layout; clear "bring your own key" state; no gold except Pulse score.

**9.12 Import** (`import/*`): stepper (Upload, Map, Review, Done) with progress; error states explicit; preserve CSV/PDF parsing and worker behaviour.

**9.13 Gamification** (`gamification/*`, `common/StreakBanner.tsx`, `Toast`): **the only place gold is used**. Level/XP chip, streak flame, badge cards, `HealthGauge` (Pulse). Streak gets a grace day mechanic in copy and UI ("Rest day available") (UI only unless the user approves logic changes). Badge popup: keep, shorten, no stacked toasts during bulk loads (suppression already shipped).

**9.14 Settings** (`settings/SettingsView.tsx`): sections (Appearance, Data & Backup, Sync, Privacy, About); Appearance gets theme (system/light/dark), motion (exists), density, text size, privacy mode, colour-blind-safe mode.

**9.15 Modals (15)** (`BudgetModal`, `CategoryModal`, `DreamContributionModal`, `DreamModal`, `EmergencyContributionModal`, `InvestmentModal`, `AddContactModal`, `EditSplitModal`, `SettleSplitModal`, `SettleUpModal`, `MarkPaidModal`, `RecurringPaymentModal`, `GoogleSyncSetupModal`, `TransactionModal`, common `Modal`): migrate onto `Sheet` one by one. Keep their props, submit handlers and validation. Mobile: bottom sheet with sticky primary action; desktop: centred dialog.

---

## 10. Additional enhancements (all additive, toggleable, off by default if they change behaviour)

1. **Privacy mode:** blur all `Money` values with one tap (header eye icon, persisted under a new key `dhanveda_privacy`). High value for shared screens.
2. **Undo** for delete/edit (toast action) using existing data operations.
3. **Setup checklist** card (Zeigarnik) on Dashboard, dismissible.
4. **Command palette** (`Ctrl/Cmd+K`) and keyboard shortcuts on desktop.
5. **Density** (comfortable/compact) for tables/lists.
6. **Colour-blind-safe mode:** adds pattern/icon redundancy to charts and statuses.
7. **Calm mode:** disables confetti/celebrations and shows milestones as a quiet toast.
8. **Smart empty-month states** (also fix demo dates, D13: generate sample dates relative to today).
9. **Insight line** on Dashboard: one plain-language sentence ("Food is 18% below last month"), computed from existing data.
10. **Haptic feedback** (`navigator.vibrate(10)`) on mobile success actions, optional.

New persisted keys must use the `dhanveda_` prefix and be added to the contract list below.

---

## 11. Do-not-break contract

- **Data/logic:** `FinanceContextType` (`FinanceContext.tsx:79`) signatures; `AppView` union; IndexedDB schema and migrations in `src/utils/db.ts`; sample data shape; import parsers (`csvParser.ts`, `pdfParser.ts`, worker); `scoreCalculator.ts`; recurring date logic; settlement math; Drive sync.
- **localStorage keys:** `dhanveda_dark_mode`, `dhanveda_motion`, `dhanveda_drive_sync_enabled`, `dhanveda_google_client_id`, `dhanveda_last_synced_at`.
- **Theme mechanism:** `dark` class on `<html>`; boot script in `index.html`; `@custom-variant dark`; `.theme-anim`; `data-motion` attribute.
- **Behaviour already fixed:** `ViewTransition` (outgoing view visible during exit, enter animation, scroll restore, heading focus); focus trap and `role="dialog"` on modals/drawer; scroll lock; Toast countdown; confetti cleanup; `TransactionModal` form-wipe fix; bulk-load toast suppression; `prefers-reduced-motion`.
- **Formatting:** `formatINR`, `formatCompactINR`, `numberToWordsINR` outputs unchanged (Indian grouping).
- **PWA:** manifest/registration still work; only colour values change.
- **Accessibility floor:** nothing may reduce keyboard access, focus visibility, or reduced-motion support.
- **Bundle:** do not grow main chunk beyond +8% or CSS beyond +10% vs baseline (section 2) without a written reason.

---

## 12. Phased delivery

| Phase | PR title | Tasks | Gate (must pass) |
|---|---|---|---|
| **0** | Baseline & safety net | Add smoke script (App. B) outside `src/`; capture "before" screenshots (13 views x light/dark x 1280/390/320); fix demo dates to be relative to today; record bundle sizes | Script runs green on current `main`; screenshots stored in `docs/ui-baseline/` |
| **1** | Tokens & typography | Semantic tokens (`@theme static`); remap canvas/card/inset/border; body uses tokens; slate-400/500 AA fix; type scale; font swap for money; remove JetBrains Mono request; 12 px floor; PWA colours | `tsc`/`oxlint`/`build` clean; contrast script all pass; no layout shifts vs baseline screenshots beyond colour/type; ₹ renders in primary face on Chrome + Safari + Firefox |
| **2** | Primitives | Build `ui/*` (section 8); migrate shell chrome (Button, Card, Chip) only; `docs/ui-primitives.md` | Primitives verified in all states (default, hover, focus, disabled, loading) in light and dark on a temporary local page that is deleted before merge (no kit route ships) |
| **3** | Navigation & shell | Grouped sidebar, rail mode, header, tab bar, More sheet, remove duplicate CTAs, command palette, shortcuts | Every one of the 13 views reachable on desktop and mobile; keyboard-only navigation works; `ViewTransition` unchanged |
| **4** | Dashboard, Transactions, Budgets | Section 9.2-9.4; `Money`, `Stat`, `Progress` adoption; mobile filter sheet; chart axis fix | Manual flows A-D (section 13) pass; first mobile viewport of Transactions shows list rows; zero horizontal scroll at 320 |
| **5** | Remaining views | 9.5-9.14 | Flows E-L pass; Investments table readable on mobile |
| **6** | Modals to Sheets | 9.15, one modal per commit | Each modal: open, submit, cancel, Escape, focus return, scroll lock stacking (`SettleSplitModal` over `AddContactModal`) |
| **7** | Enhancements | Section 10 items, each behind a Settings toggle | Toggles off = identical to Phase 6 behaviour |
| **8** | Hardening | a11y audit, perf budget check, delete unused `common/*` components and dead tokens, update docs, final screenshot diff | All gates in section 13 green |

Each phase ends with a short report (section 0, rule 7).

---

## 13. QA

**Automated gates (every phase):** `npx tsc -b`; `npx oxlint` (no new warnings); `npx vite build`; smoke script (loads app, accepts the demo-data `confirm`, dismisses badge popups, visits all 12 sidebar views at 1280, 390, 320 in light and dark, asserts no console errors except known recharts 0-size warning, asserts `scrollWidth <= innerWidth`).

**Manual regression flows:**
- **A** add, edit, delete transaction (income, expense, split, recurring link)
- **B** create/edit/delete budget; push a category over 100% and confirm the only red appears
- **C** record a split with a contact, then settle it
- **D** mark a recurring payment paid (no double toast)
- **E** contribute to a dream; confirm confetti is cleaned on navigation
- **F** emergency fund deposit and withdrawal
- **G** import a CSV and a PDF statement
- **H** backup/restore and Drive sync setup modal
- **I** toggle theme, motion setting, reload (no flash)
- **J** PWA install and offline load
- **K** keyboard-only pass through shell, one modal, one form
- **L** screen-reader pass: landmarks, dialog labels, chart summaries

**Matrix:** 320, 390, 768, 1280, 1920 x light/dark x reduced motion on/off. Real devices if possible (iOS Safari, Android Chrome).

**Accessibility:** WCAG 2.2 AA: text 4.5:1 (large 3:1), UI components and input boundaries 3:1, target size at least 24 px (we target 44 px), visible focus, no colour-only meaning, reduced motion respected.

**Performance budget:** vs section 2; Lighthouse mobile performance not below current; no layout shift on view change (CLS < 0.05); animations on `transform`/`opacity` only.

---

## 14. Risks and open decisions (defaults in bold)

| ID | Decision for the user | Default |
|---|---|---|
| D-1 | Primary hue: **trust blue `#2B4FD8`** vs keep gold/amber as primary | **Blue primary, gold = reward only** |
| D-2 | Expenses neutral ink (not red) | **Yes** (red only for breach/overdue/debt) |
| D-3 | Mobile tabs: keep Splits vs swap for Budgets | **Keep Splits** |
| D-4 | Light canvas warm paper `#F7F6F3` vs current cool `#F8F9FA` | **Warm** |
| D-5 | Drop JetBrains Mono for money | **Yes** (after ₹ cross-browser check) |
| D-6 | Streak grace-day mechanic requires logic change | **Copy/UI only now; logic later with approval** |
| D-7 | Command palette and shortcuts in scope | **Yes** |
| D-8 | Allow dev-only Playwright/axe in repo | **Ask; fall back to external scripts** |

**Risks:** a global slate override can mute placeholders/disabled states (check visually); semantic codemod may mis-classify amber uses (review every diff); `TransactionModal` is 1,027 lines with fragile form state (migrate last, visually only); gold-to-blue primary shift changes brand feel (confirm with user on a Phase 1 preview before Phase 3).

---

## Appendix A: paste-ready kickoff prompt

> You are implementing a UI overhaul of **DhanVeda**, a React 19 + Vite + Tailwind 4 personal-finance PWA (INR). Repo: `github.com/suganth-dev23/dhanveda-preview`. Read `DHANVEDA-UI-OVERHAUL-PLAN.md` fully before touching code. Follow section 0 exactly: verify each claim in the repo before editing; one phase per PR; stop at each gate and report. You may not change data logic, `FinanceContext` signatures, IndexedDB schema, localStorage keys or behaviour listed in section 11. Start with **Phase 0** only. At the end of each phase give: files changed, commands run with results, anything you did not touch, and questions for the user.

## Appendix B: verification snippets

```bash
# baseline
git clone https://github.com/suganth-dev23/dhanveda-preview.git && cd dhanveda-preview
npm ci && npx tsc -b && npx oxlint | tail -2 && npx vite build | tail -15

# re-measure claims
grep -rhoE "\b(bg|text|border|ring|from|to|via|fill|stroke|shadow)-(amber|orange|emerald|rose|slate|teal|cyan|indigo|sky)-[0-9]{2,3}" src --include=*.tsx | sed -E 's/^[a-z]+-//; s/-[0-9]+$//' | sort | uniq -c | sort -rn
grep -rhoE "text-\[(9|10|11)px\]" src --include=*.tsx | wc -l
grep -rho "font-numeric" src --include=*.tsx | wc -l
grep -rhoE "rounded-(xl|2xl|3xl|lg|md|full)" src --include=*.tsx | sort | uniq -c
```

```python
# WCAG contrast (use for every colour you add or change)
def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=sorted((lum(a),lum(b)),reverse=True); return (la+0.05)/(lb+0.05)
```

**Smoke script outline (Playwright, Python):** serve `vite preview` on 4173; for each viewport (1280x800, 390x844, 320x640) open `/`, auto-accept dialogs, click "Load Demo Dataset", click "Collect & Continue" until gone, then click each sidebar/More entry by visible label, wait 800 ms, assert `document.documentElement.scrollWidth <= innerWidth`, collect `console` errors, and save a screenshot. Add `dark` class to `<html>` for the dark pass.

**Font check (already done, repeat if fonts change):** with `fonttools`, confirm `tnum` in GSUB features and U+20B9 in the `latin-ext` subset of the chosen UI font.

## Appendix C: principle references

Hick (1952), Fitts (1954), Von Restorff (1933), Zeigarnik (1927), Hull goal-gradient (1932) and Kivetz et al. (2006), Nunes & Drèze endowed progress (2006), Kahneman & Tversky prospect theory (1979), Kahneman et al. peak-end (1993), Thaler mental accounting (1999), Kurosu & Kashimura aesthetic-usability (1995), WCAG 2.2 (1.4.3, 1.4.11, 2.5.8), Apple HIG and Material touch-target guidance (44 pt / 48 dp).
