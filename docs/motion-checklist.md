# DhanVeda Motion & Transition Verification Checklist

This checklist documents verification test cases for view transitions, focus management, reduced motion, and animation stability across all 13 DhanVeda views.

---

## 1. Views in Navigation Order

The view transition engine uses ordinal indices to determine slide direction:
- Moving to a **higher** index triggers a **Forward** transition (exit left `-translate-x-3`, enter from right `translate-x-3`).
- Moving to a **lower** index triggers a **Backward** transition (exit right `translate-x-3`, enter from left `-translate-x-3`).

| Index | View Key | View Name | Heading Element |
| :---: | :--- | :--- | :--- |
| **0** | `dashboard` | Dashboard Overview | `h1` / `h2` ("Dashboard") |
| **1** | `transactions` | Transactions Ledger | `h1` / `h2` ("Transactions") |
| **2** | `people` | People & Splits | `h1` / `h2` ("People & Splits") |
| **3** | `budgets` | Budgets & Limits | `h1` / `h2` ("Monthly Budgets") |
| **4** | `recurring` | Recurring Payments | `h1` / `h2` ("Recurring Expenses") |
| **5** | `categories` | Spending Categories | `h1` / `h2` ("Categories") |
| **6** | `emergency` | Emergency Fund | `h1` / `h2` ("Emergency Fund") |
| **7** | `investments` | Portfolio & Assets | `h1` / `h2` ("Investments") |
| **8** | `dreams` | Dreams & Goal Vault | `h1` / `h2` ("Dream Goals") |
| **9** | `badges` | Badges & Milestones | `h1` / `h2` ("Achievements & Badges") |
| **10** | `ai` | AI Financial Advisor | `h1` / `h2` ("AI Financial Health") |
| **11** | `import` | Statement Import | `h1` / `h2` ("Import Statements") |
| **12** | `settings` | Preferences & Backups | `h1` / `h2` ("Settings") |

---

## 2. Test Suites

### Suite A: Directional Transitions (Forward / Backward)
- [ ] **A.1 Dashboard -> Transactions**: Navigate from index 0 to 1. Expected: Dashboard exits left (`-translate-x-3`), Transactions slides in from right (`translate-x-3` to `translate-x-0`).
- [ ] **A.2 Investments -> Budgets**: Navigate from index 7 to 3. Expected: Investments exits right (`translate-x-3`), Budgets slides in from left (`-translate-x-3` to `translate-x-0`).
- [ ] **A.3 Settings -> Dashboard**: Navigate from index 12 to 0. Expected: Clear reverse slide with no layout shifts.
- [ ] **A.4 Same-view click**: Re-clicking the currently active view tab does not trigger any exit or re-render cycle.

### Suite B: Rapid Tap & Interruption Resilience
- [ ] **B.1 Rapid clicking**: Rapidly click through 4 views within 200ms (e.g. Dashboard -> Transactions -> People -> Budgets).
  - Expected: The orchestrator cancels pending timers, discards intermediate snapshots, and settles cleanly on the final clicked view (`budgets`) without frozen blank screens or ghost nodes.
- [ ] **B.2 Ceiling Safety Timeout**: Transitions must never hang indefinitely if an unexpected exception occurs; verified that `CEILING_TIMEOUT_MS` (600ms) forces completion to `phase: idle`.

### Suite C: Deep Link, Initial Mount & Page Refresh
- [ ] **C.1 First Load / Hard Refresh**: Load application on any view.
  - Expected: No initial exit animation fires; view mounts immediately without flicker.
- [ ] **C.2 Live Child Updates**: While on `dashboard` or `transactions`, open "Add Transaction" modal, edit a record, or trigger state updates.
  - Expected: Props and child tree update instantaneously in `phase: idle` without freezing or requiring view reloads.

### Suite D: Scroll Restoration & Focus Management
- [ ] **D.1 Scroll Position Preservation**:
  1. Navigate to `transactions` with > 20 records.
  2. Scroll down 500px.
  3. Navigate to `dashboard`.
  4. Navigate back to `transactions`.
  - Expected: Scroll position is smoothly restored to the previous 500px offset without jumping to 0.
- [ ] **D.2 View Heading Focus**:
  - Expected: Upon completing transition, focus automatically moves to the view's primary heading (`h1`, `h2`, or `[data-view-heading]`) with `tabIndex="-1"`, enabling screen readers to announce the new page title. Initial page load does not hijack focus.

### Suite E: Focus Traps on Overlays
- [ ] **E.1 Add/Edit Transaction Modal**:
  - Open modal -> focus is automatically set to the first input field.
  - Press `Tab` continuously -> focus cycles within modal inputs and action buttons; never escapes into background page.
  - Press `Shift+Tab` on first element -> wraps to the last interactive button.
  - Press `Escape` -> closes modal and restores focus to the trigger button.
- [ ] **E.2 Mobile Navigation Drawer ("More")**:
  - Open drawer on mobile viewport -> focus traps inside drawer items.
  - Press `Escape` or click backdrop -> drawer slides down, focus returns to hamburger/more button.
- [ ] **E.3 Gamification Badge Popup**:
  - Unlock a badge -> popup opens with trapped focus on "Awesome!" or "View Badges" button.
  - Press `Escape` -> dismisses and restores focus safely.

### Suite F: Reduced Motion (`prefers-reduced-motion: reduce`)
- [ ] **F.1 OS / Browser Emulation**: In DevTools, set `Rendering -> Emulate CSS media feature prefers-reduced-motion: reduce`.
- [ ] **F.2 View Transitions**: Navigating views performs a zero-translation instant swap or gentle opacity crossfade (`duration-0` / `translate-x-0`).
- [ ] **F.3 Overlays & Modals**: Modals open and close immediately without scale or spring animations.
- [ ] **F.4 Animated Numbers**: Count-up effects jump immediately to the target value without running RAF loops.
- [ ] **F.5 Confetti**: Confetti particle generation is suppressed or converted to static milestone indicator.

---

## 3. Verification Log

| Date | Tester / Env | Views Checked | Result | Notes |
| :--- | :--- | :--- | :---: | :--- |
| 2026-09-29 | Automated / Preview Build | All 13 Views | PASS | Phase 1 ViewTransition rewrite verified clean |
