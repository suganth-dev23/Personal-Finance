# Animation & UI Polish Plan

> Scope locked: **A-G as written, dependency-free** (no framer-motion / motion / react-spring).
> Updated 2026-09-27: Phase A2 (the ad-hoc duration-N sweep) is descoped by decision - see the Duration policy note in section 4.
> Basis: full read of motion primitives, layout chrome, dashboard + gamification widgets, PWA/build config.
> Every finding below was re-verified against source after an external review pass; corrections are logged in section 6.

---

## 1. Current motion architecture (for orientation)

| Layer | File(s) | Notes |
|---|---|---|
| Tokens + keyframes | `src/index.css` (L3-161: `@theme`, keyframes L29-147, `--animate-*` L149-160) | 22 keyframes, 22 `--animate-*` tokens (1:1), plus unused `--duration-*` / `--ease-*` |
| JS motion hooks | `src/hooks/useCountUp.ts`, `useAnimatedProgress.ts`, `useNumberPop.ts`, `useStaggerChildren.ts` | RAF + ease-out-expo; spring overshoot; IntersectionObserver |
| Shared motion components | `src/components/common/{AnimatedNumber,ProgressBar,ViewTransition,Modal,MobileMoreDrawer,Toast,ViewSkeleton}.tsx` | |
| Chrome | `src/components/layout/{Sidebar,Navbar,MobileNav}.tsx` | |
| Celebration | `src/utils/confetti.ts`, `src/components/gamification/BadgePopup.tsx`, `src/constants/feedbackManifest.ts` | only reduced-motion-aware code in the repo |
| Charts | `CashFlowChart.tsx`, `CategoryExpenseChart.tsx`, `PortfolioAllocationChart.tsx` | Recharts, flat `animationDuration` |

No animation dependency exists in `package.json` or `node_modules`. Keeping it that way protects the
offline PWA bundle (`vendor-charts` / `vendor-pdf` are already split out) and avoids duplicating the
four hand-rolled hooks.

---

## 2. Verified findings (all evidence re-read post-review)

| # | Severity | Finding | Evidence |
|---|---|---|---|
| 1 | **Blocker** | `useCountUp` has **no mount animation**: `useState(target)` + `prevRef.current = target` -> first effect sees `diff === 0` -> `return`. `useAnimatedProgress` is identical (`useState(clamped)`, `distance < 0.1 -> return`). So all 10 `<AnimatedNumber>` sites, the gauge score and every `ProgressBar` paint their **final** value on view entry; the count-up only plays on a later live change. This is the single biggest reason motion feels absent. | `useCountUp.ts:20-28`, `useAnimatedProgress.ts:17-25` |
| 2 | **Blocker** | Stagger reveal is structurally dead: `getChildStyle` returns `isVisible ? { animationDelay } : { opacity: 0 }`. Children carry `animate-slide-up` from mount, so the 250ms animation **runs to completion while the node is opacity:0**; by the time the observer flips `isVisible`, `animationDelay` is applied to a finished animation (delay changes never replay it). Result: instant opacity pop, zero visible stagger, guaranteed invisible first paint. Tall below-fold grids stay blank until 10% intersects (`threshold: 0.1`). | `useStaggerChildren.ts:13-32`, 9 consumer sites, 16 `animate-slide-up` usages |
| 3 | **High** | `ViewTransition` double-mounts. View components are distinct component types, so React unmounts old / mounts new the moment `children` changes - inside a wrapper still keyed by the **old** `displayKey` and painted `opacity-0 translate-y-2`. 120ms later `displayKey` flips, replacing the wrapper DOM node and **unmounting + remounting the new view**, discarding state set in that window (filters, expanded rows, chart animation restart). Adds 120ms dead time to every nav tap. | `ViewTransition.tsx:17-45`, `App.tsx:84-104` |
| 4 | High | No `prefers-reduced-motion` support anywhere except confetti (all 7 matches are in `confetti.ts`). No `data-motion` kill switch. | repo-wide grep |
| 5 | High | `animate-spin-slow` is used but never defined -> the badge ring never rotates. | `BadgePopup.tsx:135`; no such token in `index.css:149-160` |
| 6 | High | `animate-in fade-in slide-in-from-top-2 duration-200` is **tailwindcss-animate v3 plugin syntax**; this project is Tailwind `^4.3.3` core with no plugin -> the whole class set is inert. | `PeopleView.tsx:363`; `package.json` |
| 7 | Medium | Two `animate-*` utilities on one element: `animation` is a single CSS property, so the later declaration wins and the shake never fires. | `BudgetsView.tsx:189`, `BudgetHealthWidget.tsx:44` |
| 8 | Medium | Pulse tokens have **no iteration count** -> one iteration then dead. Correct for the transient `ProgressBar` glow (1000/1200ms timeout), wrong for the three persistent usages, which pulse once and stop. | `index.css:152-154`; `HealthGauge.tsx:212`, `HealthGaugeCompact.tsx:88`, `StreakBanner.tsx:50` |
| 9 | Medium | `ProgressBar` drives `width` from a 60fps RAF `setState` (up to 8 concurrent bars on Dashboard/Budgets/Investments) -> per-frame layout. The correct target property is `transform: scaleX()`. | `ProgressBar.tsx:92-98` + `useAnimatedProgress` |
| 10 | Medium | `HealthGauge` arc never animates on mount (initial `strokeDashoffset` == final). The endpoint bead has `transition-all duration-1000 ease-out` on the wrapping `<g>`, but `cx`/`cy` live on the child `<circle>`s and `transition-*` is **not inherited** -> nothing that mutates has a transition, so the bead teleports. `--animate-gauge-sweep` is unusable as-is (keyframes `stroke-dashoffset: 220 -> var(--gauge-offset, 0)`, nothing sets `--gauge-offset`, `220 != ARC_LENGTH 267.04`, fallback `0` == 100% filled). | `HealthGauge.tsx:24,143-179`; `index.css:144-147,160` |
| 11 | Medium | `Modal` and `MobileMoreDrawer` duplicate a near-identical open/close state machine with unconditional `body.style.overflow = 'unset'` cleanup (`Modal` 180ms, `MobileMoreDrawer` 200ms). Stacking two modals (e.g. `SettleSplitModal` over `AddContactModal`) releases scroll-lock when the inner one closes. | `Modal.tsx:26-59`, `MobileMoreDrawer.tsx:29-54` |
| 12 | Low-Med | No compositor hints anywhere: no `will-change`, `translate3d`, `backface-visibility`, `contain`; no `@media (hover: none)` guard, so touch devices keep sticky hover-lift states. | repo-wide grep |
| 13 | Low-Med | Toasts: no auto-dismiss countdown affordance, no hover/focus pause, siblings jump when one unmounts. | `Toast.tsx` |
| 14 | Low-Med | Recharts: all series animate simultaneously (no `animationBegin`), `isAnimationActive` not gated on reduced motion, donut centre label static, wave<->bar toggle re-animates from zero. | `CashFlowChart.tsx:142-211` |
| 15 | Low | **10 dead animation tokens** (0 hits across `*.ts` + `*.tsx`): `count-tick`, `fade-out`, `gauge-sweep`, `pop-in`, `pop-out`, `scale-in`, `scale-out`, `slide-down`, `slide-down-drawer`, `slide-up-drawer`. `--duration-*` / `--ease-*` tokens have **0** usages while components use 44 ad-hoc `duration-N` across 28 files. | crosscheck script |
| 16 | Low | `ViewSkeleton` is dashboard-shaped (4 stat cards + chart + donut + table) but is the fallback for all 13 views. | `ViewSkeleton.tsx:1-61` |


---

## 3. Approach decision

Stay dependency-free. `motion` would buy layout/exit animations and drag-to-dismiss, at roughly 35-50 KB gz on an
offline PWA, duplicating four hooks that already exist (`useCountUp` ~= `useSpring`, `useStaggerChildren` ~=
`staggerChildren`). Everything below is Tailwind v4 `@theme` + the existing RAF/IO pattern, so `npm run build`
output size is unchanged. Three places where a library would genuinely help are flagged as later opt-ins:
list reflow after filter changes (layout), bottom-sheet drag-to-dismiss, shared-element transitions
(`document.startViewTransition`, unavailable on the current Safari baseline).

---

## 4. Task plan

### Phase A1 - motion foundation (`src/index.css`, 3 hook edits, 1 new hook) - own commit

- [ ] A1.1 New keyframes + tokens in `index.css` (co-located `@keyframes` inside `@theme`, matching the file's convention):
      `spin-slow` (+ local `@keyframes spin-slow` - do NOT point a custom `--animate-*` at core `spin`; Tailwind v4
      only emits a keyframe set with its own built-in utility, so a custom token referencing `spin` can compile to nothing),
      `badge-icon-pop`, `xp-float`, `shine-sweep`, `flame-flicker`, `shake-then-flash` (resolves finding 7),
      `pulse-danger-infinite`, `pulse-gold-infinite`, `pulse-success-infinite` (finding 8 - base tokens stay one-shot
      because `ProgressBar.tsx:42-52` intentionally fires one iteration with a 1000/1200ms timeout).
- [ ] A1.2 New `src/hooks/useReducedMotion.ts`: `matchMedia('(prefers-reduced-motion: reduce)')` + `[data-motion="off"]`
      override, SSR-safe, subscribes to `change`.
- [ ] A1.3 Wire it into `useCountUp`, `useAnimatedProgress`, `useNumberPop`, stagger, and `confetti.ts`
      (snap to target, cancel RAF, skip celebration motion).
- [ ] A1.4 Global CSS guard: degrade non-essential keyframes, kill ambient loops, and neutralise `animation-play-state`
      reveals - but keep an allowlist so state-conveying one-shots (over-budget flash) survive as opacity-only.
- [ ] A1.5 Compositor hygiene: `will-change: transform, opacity` on modal / drawer / view / stagger targets,
      `contain: paint` on progress tracks, `content-visibility: auto` on long list sections.
- [ ] A1.6 `@media (hover: none)` neutraliser for `hover:-translate-*` / `hover:scale-*` sticky states.
- [ ] A1.7 Utilities `.press` (unified `active:scale-[0.98]` + `focus-visible` ring) and `.lift` (pointer-fine only).

**Accept:** no behaviour change yet; `npm run build` green; DevTools > Rendering > Emulate `prefers-reduced-motion: reduce`
shows a calm but still-informative UI.

### Duration policy - the A2 sweep is descoped by decision

The 44 ad-hoc `duration-N` utilities across 28 files stay exactly as they are. There is no token sweep commit, and no user-visible defect depends on one. A blanket find-and-replace of `duration-200` into a token is a cosmetic diff across 28 files that would sit in front of every real fix in this plan while being its own bisect hazard.

- **Existing code:** leave `duration-*` values alone. A duration edit is allowed only where a Phase B / C / D / E task already rewrites that element, and must be named in that task.
- **New or rewritten code:** use the token system. Anything that moves gets a keyframe + `--animate-*` token from Phase A1; new transitions introduced by Phase C (view crossfade) and Phase E (press / focus states) use `--duration-fast` / `--duration-base` / `--duration-slow` plus the `--ease-*` tokens, so those tokens stop being dead as a side effect of real work.
- **Consequence:** finding 15 is closed as "accepted" for its duration / easing half. Its dead-token half stays in B.7, and `shine-sweep` + `xp-float` (A1.1) get consumed by D.6 / D.7, so the orphan list shrinks on its own as the later phases land.

### Phase B - defect fixes (one commit per defect class)

- [ ] B.1 **Stagger rewrite** (finding 2). Drop the `opacity: 0` gate. Children keep `animate-slide-up` armed but
      `animation-play-state: paused`; container toggles `data-revealed` -> `running`, with
      `animation-delay: calc(var(--i) * var(--step))` + `animation-fill-mode: both` so paused nodes hold the from-frame
      without inline opacity (React re-renders of `style`/`className` can never clobber it). Keep `getChildStyle(index)`
      signature so all 9 call sites stay untouched. Add a ~450ms fallback timer that force-reveals, re-observe on
      breakpoint change, and delay cap `min(index * stagger, 400ms)`.
- [ ] B.2 **ViewTransition rewrite** - see Phase C (same defect, bigger blast radius, own PR).
- [ ] B.3 `BadgePopup`: apply `animate-spin-slow` (finding 5) and a *distinct* `animate-badge-icon-pop` on the icon
      with a ~120ms delay offset (`badge-unlock` already owns the card at `BadgePopup.tsx:105`, so reusing it would
      double-fire the same 0.6s bounce on nested nodes). Sequence: card -> ring -> icon -> title -> XP pill -> buttons.
      Add a real exit transition + `role="dialog"`, focus trap, Escape.
- [ ] B.4 `PeopleView.tsx:363` -> `animate-slide-down` (revives a dead token, kills an inert class set).
- [ ] B.5 `HealthGauge`: drive arc + bead from one animated value (`useAnimatedProgress(overallScore, { animateOnMount })`),
      mount-sweep the arc from `ARC_LENGTH`, and move the bead to `transform: translate()` on the `<g>` with `cx/cy = 0`
      (engine-agnostic; do not rely on `cx`/`cy` interpolation). Delete the now-redundant `transition-all duration-1000`.
- [ ] B.6 Extract `src/hooks/useOverlayTransition.ts` + ref-counted `useScrollLock`; adopt in `Modal`, `MobileMoreDrawer`,
      `BadgePopup` (finding 11). Note: `ViewTransition.tsx:26-30` cleanup looks correct statically (timer is cleared on
      every traced path), but confirm with a manual rapid-tap test under React StrictMode before closing.
- [ ] B.7 Dead-token triage (finding 15): adopt `pop-in`/`scale-in` (toast + popup entrances), `fade-out`/`scale-out`
      (modal exit - today the drawer has no exit animation at all), `slide-up-drawer`/`slide-down-drawer`; delete
      `count-tick`, `gauge-sweep` (or re-point at `--gauge-offset` if B.5 keeps it).

### Phase C - ViewTransition rewrite (own PR; wraps all 13 views)

Exported signature stays `{ viewKey, children }` so no view file changes.

- [ ] C.1 State machine: `phase: idle | exit | enter`, `painted: ReactNode`, `paintedKey`. **During exit we paint the
      snapshot, not `children`** - the incoming lazy chunk gets ~180ms to resolve while the old view is still on screen,
      so `ViewSkeleton` usually never flashes.
- [ ] C.2 Commit on `transitionend` OR timer, whichever lands first, with a hard ceiling (~2x duration) so a throttled
      or hidden tab can never wedge the machine. Single timer ref, cleared on unmount and on interruption.
- [ ] C.3 Chunk still pending at commit: `Suspense` stays at `App.tsx:84`; extend once, capped ~600ms, then commit and
      let the skeleton crossfade (minimum 150ms dwell so a chunk resolving mid-frame never flashes a skeleton).
      Enter animation keys to `viewKey`, never to skeleton->content, so enter never replays.
- [ ] C.4 Interruption: no queue - clear timer, commit in flight, restart exit toward the newest key. Enter direction is
      captured at exit start (index delta over `Sidebar.NAV_ITEMS` order: forward = from `+translate-x-3`, back =
      `-translate-x-3`) so a double tap cannot flip it.
- [ ] C.5 Delete `key={displayKey}` (finding 3). First mount and reduced motion commit synchronously: zero timers, zero classes.
- [ ] C.6 Per-view `scrollY` saved at exit start, restored post-commit (rAF, clamped to new subtree height); heading
      focused on enter, skipped on first mount.
- [ ] C.7 `docs/motion-checklist.md` covering all 13 views: forward, back, rapid tap, deep-link refresh, reduced motion,
      scroll restore. One-line feature flag inside the component for instant bisect/revert.

### Phase D - data + feedback motion (D.1 is a hard prerequisite for the rest)

- [ ] D.1 **Shared ticker first.** `utils/rafTicker.ts`: one RAF per view, subscribers write through `ref.textContent` / a CSS custom property instead of React state. Today the RAF cost is only theoretical because nothing animates on mount (finding 1); enabling count-up/fill-on-mount would make ~18 concurrent per-frame `setState` loops real on first dashboard paint. Land the ticker *before* turning mount animation on, or this phase regresses first paint.
- [ ] D.2 Add `animateOnMount` (and optional `from`) to `useCountUp` / `useAnimatedProgress`, default `false` so existing change-driven behaviour is preserved; opt in for hero figures only (not all 18 animated numbers).
- [ ] D.3 `ProgressBar`: drive `transform: scaleX(var(--progress))` instead of `width` (finding 9); keep the diagonal hatch on the clipped track wrapper for the `>100%` case so the 14px pattern is not distorted; keep `useAnimatedProgress` exporting `displayPercent` so milestone/glow logic (`ProgressBar.tsx:35-54`) is untouched; preserve the +2% spring settle feel.
- [ ] D.4 Charts: per-series `animationBegin` (0 / 120 / 240ms), `isAnimationActive={!reducedMotion}`, counting donut centre label, legend rows on the same stagger, wave<->bar toggle keeps its morph instead of re-zeroing.
- [ ] D.5 Toasts: countdown hairline bound to `duration`, hover/focus pause, sibling lift on removal, enter/exit via the `pop-in` / `fade-out` tokens; `aria-live` semantics preserved.
- [ ] D.6 Confetti origin from the triggering element (`getBoundingClientRect`) for settle / goal / FAB actions, plus a reduced-motion alternative (gold hairline flash) since confetti self-disables there.
- [ ] D.7 `+XP` float (`xp-float`) anchored to the sidebar level card, driven by `GamificationContext` XP deltas (`GamificationContext.tsx:229-268`); level bar uses `useAnimatedProgress`, tier glow on level-up.

### Phase E - interaction + a11y polish (motion-adjacent only)

- [ ] E.1 `focus-visible` ring on every interactive element reached in A-D; >=44px tap targets in mobile nav / drawer tiles / filter chips.
- [ ] E.2 `active:` press state on list rows and chips (`TransactionListView.tsx:311,406-464` are colour-only today).
- [ ] E.3 Tabular numerals (`font-numeric`) in the remaining money spots: `RecentTransactions` amounts, `Navbar` in/out pill, `BudgetsView`, `BadgeShowcase` counters.
- [ ] E.4 Scope theme colour transitions to a temporary `.theme-anim` class applied only during the toggle (`FinanceContext.tsx:638-653`), instead of permanent `transition-colors` everywhere.
- [ ] E.5 Optional `SettingsView` toggle: Reduced motion = system / off / on, wired to `[data-motion]` for touch devices.

### Phase G - surface + token consistency (separate PR, unrelated to motion)

- [ ] G.1 Hardcoded `#F8F9FA` / `#131822` / `#202836` / `#171E2A` literals -> `@theme` color tokens.
- [ ] G.2 View-aware `ViewSkeleton` variants (`table` / `cards` / `form`) selected by view key (finding 16).
- [ ] G.3 Consistent empty states (icon + one line + single CTA) across `Budgets`, `Dreams`, `Emergency`, `Investments`, fading in via the shared stagger.

---

## 5. Sequencing, verification, risks

**Commit order:** A1 -> B (per defect) -> C (own PR) -> D.1 ticker -> D.2-D.7 -> E -> G (separate PR). Phases are independently shippable; Phase B is the safe quick win.

**Gates per phase:** `npm run lint` (oxlint) -> `npm run build` (tsc -b + vite) -> `npm run preview`.

**Perf assertions (Phase C + D):** DevTools Performance trace over Dashboard and Transactions shows (a) no Layout records per progress-bar frame after D.3, (b) zero CLS on view swap, (c) the current 120ms nav dead time gone, (d) at most one RAF subscriber per animated view.

**Manual matrix:** all 13 views forward / back / rapid-tap, deep-link refresh per view, stacked modals (`SettleSplitModal` over `AddContactModal`) keep scroll-lock, the `hidden md:block` table and `md:hidden` list both reveal after a resize, emulated `prefers-reduced-motion: reduce`, light + dark, 320px width.

**Open risks**

1. `useOverlayTransition` unifies the 180ms (`Modal`) and 200ms (`MobileMoreDrawer`) exits. Decision needed: one token (recommend 200ms, i.e. the drawer's existing value) or per-surface duration props.
2. `animateOnMount` turns first-paint numbers from instant to animated - a visible behaviour change, so it ships default-off in D.2 and is enabled per component.
3. Deleting `key={displayKey}` relies on view components staying distinct types; if two views ever share one component with different props, the explicit key must return (leave this note at the C.5 site).
4. The stagger rewrite touches a hook used by 9 views; the `getChildStyle` signature is preserved, but all 9 sites are on the manual matrix.

---

## 6. Corrections log (external review -> verified)

| Claim in first draft | Verdict | Verified fact |
|---|---|---|
| `animate-badge-unlock` unused; apply it to the icon | Wrong | Already on the card at `BadgePopup.tsx:105`; needs a distinct token with a delay offset (B.3). |
| Bead teleports because `transition-all` cannot interpolate `cx`/`cy` | Wrong reason, right conclusion | `transition-*` is not inherited and sits on the `<g>` while `cx`/`cy` live on the child circles. |
| `StatCard` static while hero numbers count up | Wrong premise | Nothing animates on mount anywhere (finding 1); swapping `StatCard` to `AnimatedNumber` buys nothing until D.2 lands. |
| 5 dead tokens, including `number-bump` | Incomplete plus 1 false positive | `number-bump` is live (`useNumberPop.ts:29`); 10 tokens are dead (finding 15). |
| `.stagger-children` / `.stagger-container-revealed` rules in `index.css` | Fabricated | No stagger CSS exists in the repo at all; `ViewTransition.tsx` is 46 lines of timer only. The real mechanism is inline styles (finding 2). |
| Add `infinite` to the pulse tokens | Too blunt | `ProgressBar.tsx:42-52` deliberately wants one iteration; only the 3 persistent usages need `-infinite` variants (A1.1). |
| 43 ad-hoc duration sites | 44 across 28 files | Recount confirmed. Sweeping them was then descoped by decision - see the duration policy note in section 4. |
| **Second verification pass (2026-09-27)** | | |
| 21 keyframes (section 1) | Wrong by one | 22 `@keyframes` blocks in `index.css` L29-147, confirmed one-to-one with the 22 `--animate-*` tokens. Off by one since the original draft. |
| `cleanup (200ms / 180ms)` in finding 11 and `200ms (Modal) and 180ms (MobileMoreDrawer)` in Open Risk #1 | Swapped | Actual code: `Modal.tsx:51` closes at 180ms, `MobileMoreDrawer.tsx:47` at 200ms. Both values were consistently backwards. Fixed; "recommend 200ms" now correctly identified as the drawer's existing value. |
| `ViewTransition.tsx:26-30` leaks a timer (B.6) | Unconfirmed | Cleanup runs on `viewKey !== displayKey` branch; on every statically traced path the pending timer is cleared before a new one is set. Cannot rule out StrictMode-double-invoke or hidden interaction, so downgraded to "confirm with manual rapid-tap test." |
| `src/data/feedbackManifest.ts` (section 1) | Wrong path | Actual path is `src/constants/feedbackManifest.ts`. |

---

## 7. Repro recipes (confirm the fixes instead of assuming them)

- **Finding 1:** add a transaction with Dashboard open -> numbers tween; reload with identical data -> they do not.
- **Finding 2:** CPU throttle 6x, open Transactions -> rows arrive as one flat pop with no wave; scroll a tall grid slowly -> rows stay invisible until ~10% of the container is in view.
- **Finding 3:** React DevTools Profiler, Dashboard -> Budgets shows two commit bursts ~120ms apart, with a full unmount/remount of the new subtree in the second.
- **Finding 9:** Performance trace shows a Layout record per frame while a progress bar fills; after D.3 it is transform-only.
- **Finding 10:** watch the gauge bead while the score changes -> it jumps and is visibly detached from the arc mid-sweep.
