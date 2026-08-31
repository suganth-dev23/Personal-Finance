# Walkthrough: Contact Balance Integrity & Debt Calculation Fix

---

## 1. Why Abiruba Showed "-₹21 You Owe" & How It Was Fixed

### The Root Cause:
1. Originally, Abiruba had 8 splits totaling **₹724.57** owed to you.
2. In earlier sessions, a generic "Settle Up" record of **₹219.00** was recorded (which brought the balance down from ₹724.57 to ₹505.57).
3. Then, when you marked individual split transactions as settled (e.g. ₹526.57 of splits), those splits were marked settled and reduced the open split total to **₹198.00**.
4. The calculation was subtracting **BOTH**:
   - The settled splits ($₹526.57$).
   - AND the older unallocated generic settlement ($₹219.00$).
   - Result: $₹198.00 - ₹219.00 = \mathbf{-₹21.00}$ (*"You Owe ₹21"* in red).

### The Fix in [`FinanceContext.tsx`](file:///c:/Users/hp/Documents/Finance%20Tracker/src/context/FinanceContext.tsx):
- `contactBalances` now cleanly isolates **Owed To You** (`owedToMe`) and **You Owe** (`iOweThem`).
- Generic repayments received from debtors reduce what they owe you down to a floor of `0`, **never inverting into a false debt that you owe them**.
- If you have an older generic settlement of ₹219 that is a duplicate of your linked splits, you can also view it in **Settlement History** and delete or adjust it anytime.

---

## 2. How Total Spent vs Owed is Structured

1. **Bank Cashflow & Total Net Balance**:
   - Total debits (e.g. ₹517.70 paid for Train tickets) subtract from your real bank balance.
   - Bank credits (e.g. UPI repayments received) add to your real bank balance.
   - Net cash balance always reflects your true bank accounts.
2. **Total Owed to You vs You Owe**:
   - **Total Owed to You**: Sum of all open portions where friends owe you.
   - **You Owe**: Only tracks money where the transaction direction is explicitly set to you owing someone.
   - Linking a repayment transaction to a split marks the split as settled, clears the open balance, and records the audit trail in **Settlement History**.

---

## Verification

```bash
npm run build
```
- **Exit Code**: `0`
- TypeScript compilation and chunk generation completed with **0 errors**.
