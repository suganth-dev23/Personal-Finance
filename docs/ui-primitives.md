# DhanVeda UI Primitives

All primitives are located in `src/components/ui/` and exported via `src/components/ui/index.ts`. They adhere to WCAG 2.2 AA contrast standards, mobile 44px touch-target standards, and dark/light mode token integration.

---

## 1. Button (`Button.tsx`)
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
  Add Transaction
</Button>
```
- **Variants:** `primary` (#2B4FD8 / #8FA8FF), `secondary`, `ghost`, `danger`, `reward` (gold fill).
- **Sizes:** `sm` (36px, min-h 36px), `md` (44px, min-h 44px), `lg` (48px, min-h 48px).
- **Props:** `isLoading`, `leftIcon`, `rightIcon`, all standard button HTML attributes.

---

## 2. Card (`Card.tsx`)
```tsx
import { Card } from '@/components/ui';

<Card variant="surface" padding="md">
  {content}
</Card>
```
- **Variants:** `surface` (card background), `sunken` (inset well), `hero` (primary focus), `interactive` (hoverable).
- **Padding:** `none`, `sm`, `md`, `lg`.

---

## 3. Money (`Money.tsx`)
```tsx
import { Money } from '@/components/ui';

<Money value={24500} tone="auto" size="lg" />
```
- **Props:**
  - `value`: number
  - `sign`: `'auto' | 'always' | 'never'`
  - `tone`: `'auto' | 'income' | 'expense' | 'neutral' | 'negative' | 'positive'`
  - `size`: `'xs' | 'sm' | 'md' | 'lg' | 'display'`
  - `compact`: boolean (Lakhs / Crores notation)
  - `blurPrivacy`: boolean (blurs for shared screens)
- Includes `data-money="true"` attribute for privacy mode blurring.

---

## 4. Delta (`Delta.tsx`)
```tsx
import { Delta } from '@/components/ui';

<Delta value={12.4} isPercent inverse={false} />
```
- Renders an up/down chip with arrow icon, sign, and text (never relies on color alone).

---

## 5. Stat (`Stat.tsx`)
```tsx
import { Stat } from '@/components/ui';

<Stat label="Total Income" value={85000} delta={4.2} />
```
- Unified stat widget replacing repetitive stat tiles.

---

## 6. Progress (`Progress.tsx`)
```tsx
import { Progress } from '@/components/ui';

<Progress value={75} max={100} tone="auto" type="linear" />
<Progress value={85} max={100} type="ring" size="md" showIcon />
```
- **Types:** `linear` and `ring`.
- Accessible `role="progressbar"`, with auto-tone mappings for safe (<80%), warning (80-100%), and breach (>100%).

---

## 7. Chip & Segmented (`Chip.tsx`)
```tsx
import { Chip, Segmented } from '@/components/ui';

<Chip selected={filter === 'all'} onClick={() => setFilter('all')}>
  All
</Chip>
```
- 44px touch targets on mobile, active indicator using `bg-primary`.

---

## 8. Form Fields (`Field.tsx`)
```tsx
import { Input, Select, Textarea, AmountInput } from '@/components/ui';

<AmountInput label="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
```
- 3:1 contrast input border (`border-line-input`), 44px min height, 2px primary focus ring.

---

## 9. Sheet (`Sheet.tsx`)
```tsx
import { Sheet } from '@/components/ui';

<Sheet isOpen={open} onClose={() => setOpen(false)} title="Quick Add">
  {content}
</Sheet>
```
- Responsive modal: bottom sheet on mobile (<768px), centered modal on desktop.
- Touch drag-handle, focus trap, scroll lock, Escape key support.

---

## 10. Headers (`PageHeader.tsx`, `SectionHeader.tsx`)
- Standardized page and section headers with action buttons and badges.

---

## 11. Skeleton (`Skeleton.tsx`)
```tsx
import { Skeleton } from '@/components/ui';

<Skeleton width={120} height={24} />
<Skeleton circle width={40} height={40} />
```
- Shimmer pulse placeholder with configurable dimensions and rounded-xl / circular radius.

---

## 12. EmptyState (`EmptyState.tsx`)
```tsx
import { EmptyState } from '@/components/ui';

<EmptyState
  icon={Receipt}
  title="No transactions yet"
  description="Add your first transaction to start tracking."
  actionLabel="Add Transaction"
  onAction={handleAdd}
/>
```
- Standardized empty view placeholder with icon badge, title, description, and primary CTA.

---

## 13. Toast (`Toast.tsx`)
```tsx
import { Toast } from '@/components/ui';
```
- Accessible feedback alert toasts for actions, sync updates, and warnings.
