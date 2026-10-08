import { StagedTransaction, TransactionType, PaymentMethod } from '../types/finance';
import { suggestCategory, detectPaymentMethod } from '../utils/categoryMatcher';
import { parseINR } from '../utils/currency';
import { normalizeDate } from '../utils/csvParser';
import { isValidAmount, isValidDate, roundMoney } from '../utils/validation';

export interface SMSParseResult {
  transactions: StagedTransaction[];
  totalParsed: number;
  skippedCount: number;
  errors: string[];
}

/**
 * Sanitizes raw text string before parsing:
 * - Truncates excessively large inputs to prevent memory DOS
 * - Strips unprintable control characters while preserving standard whitespace
 * - Normalizes unicode whitespace characters
 */
export function sanitizeSMSInput(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  // Cap entire payload to 500KB to prevent memory exhaustion
  const maxPayload = 500 * 1024;
  const bounded = raw.length > maxPayload ? raw.slice(0, maxPayload) : raw;

  // Filter out control characters safely without regex control character warnings
  let cleaned = '';
  for (let i = 0; i < bounded.length; i++) {
    const code = bounded.charCodeAt(i);
    // Allow tab (9), newline (10), carriage return (13), and non-control characters
    if (code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127 && (code < 128 || code > 159))) {
      cleaned += bounded[i];
    }
  }

  return cleaned
    .replace(/[\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g, ' ')
    .trim();
}

/**
 * Parses a single Indian bank or UPI transaction SMS into a StagedTransaction.
 * All regular expressions are carefully constructed with strict linear bounds
 * to prevent Catastrophic Backtracking (ReDoS).
 */
export function parseSingleSMS(smsText: string, index = 0): StagedTransaction | null {
  if (!smsText) return null;
  // Bounded message length: single SMS messages rarely exceed 400 chars
  const clean = smsText.trim().slice(0, 800);
  if (clean.length < 15) return null;

  // 1. ReDoS-safe Amount matchers
  // Matches: "INR 1,234.50", "Rs. 450", "Rs 500.00", "₹1200", "debited by 300.00"
  const amountPattern = /(?:(?:rs\.?|inr|₹)\s*|debited\s+(?:by\s+)?|credited\s+(?:by\s+)?|spent\s+)(?:INR|Rs\.?|₹)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i;
  const amountMatch = clean.match(amountPattern);
  if (!amountMatch || !amountMatch[1]) return null;

  const rawNum = amountMatch[1];
  const parsedAmount = parseINR(rawNum);
  if (!isValidAmount(parsedAmount) || parsedAmount <= 0) return null;

  // 2. Transaction Type Determination
  // Safe keyword boundaries without nested quantifiers
  const isCredit = /\b(?:credited|received|deposited|refunded|cashback|salary|cr)\b/i.test(clean);
  const isDebit = /\b(?:debited|spent|paid|withdrawn|deducted|sent|dr|purchase|transferred)\b/i.test(clean);

  // Default to debit if spent/debited or if unclear
  let type: TransactionType = 'debit';
  if (isCredit && !isDebit) {
    type = 'credit';
  } else if (isDebit) {
    type = 'debit';
  }

  // 3. Date extraction (linear matching)
  // DD/MM/YYYY, DD-MM-YYYY, or DD-Mon-YYYY (e.g. 24-Aug-26, 05-Oct-2026)
  const datePattern = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}[-\s](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-\s]\d{2,4})\b/i;
  const dateMatch = clean.match(datePattern);
  const rawDate = dateMatch ? dateMatch[1] : '';
  const normalizedDate = normalizeDate(rawDate);
  const finalDate = (normalizedDate && normalizedDate !== 'NaN-NaN-NaN' && isValidDate(normalizedDate))
    ? normalizedDate
    : new Date().toISOString().split('T')[0];

  // 4. Reference Number / UPI Ref / UTR / RRN
  const refPattern = /\b(?:upi\s*ref(?:\s*no)?|utr|rrn|txn\s*id|chq|ref)\s*[:.\s-]*([a-zA-Z0-9]{6,22})/i;
  const refMatch = clean.match(refPattern);
  const referenceId = refMatch ? refMatch[1].trim() : undefined;

  // 5. Account / Card Hint
  const acctPattern = /\b(?:a\/c|acct|account|card|vpa)\s*(?:no\.?|ending)?\s*[:.\s-]*[xX*]*(\d{3,6})\b/i;
  const acctMatch = clean.match(acctPattern);
  const acctSuffix = acctMatch ? `A/c ${acctMatch[1]}` : '';

  // 6. Payee / Merchant / Description extraction
  // Linear bounded search for merchant tokens
  const merchantPattern = /\b(?:at|to|for|towards|info)\s+([A-Za-z0-9&.\-_ ]{2,40})/i;
  const merchantMatch = clean.match(merchantPattern);
  let merchant = merchantMatch ? merchantMatch[1].trim() : '';

  // Clean trailing punctuation or stop words
  merchant = merchant.replace(/\s+(on|via|ref|using|avl|bal|from|thru|through).*$/i, '').trim();

  // If merchant is empty, infer bank or generic tag
  let description = merchant;
  if (!description || description.length < 2) {
    const bankMatch = clean.match(/\b(hdfc|sbi|icici|axis|kotak|pnb|bob|paytm|phonepe|gpay|cred|amazon\s*pay)\b/i);
    if (bankMatch) {
      description = `${bankMatch[1].toUpperCase()} Transaction ${acctSuffix}`.trim();
    } else {
      description = `Bank Transaction ${acctSuffix}`.trim();
    }
  } else if (acctSuffix) {
    description = `${description} (${acctSuffix})`;
  }

  // 7. Auto-categorization & Payment Method detection
  const categoryMatch = suggestCategory(description + ' ' + clean);
  const paymentMethod: PaymentMethod = detectPaymentMethod(clean);

  return {
    tempId: `staged-sms-${Date.now()}-${index}`,
    date: finalDate,
    amount: roundMoney(parsedAmount),
    type: (categoryMatch.suggestedType === 'credit' && !isDebit) ? 'credit' : type,
    category: categoryMatch.category,
    paymentMethod,
    description: description.slice(0, 100),
    source: 'imported',
    referenceId,
    selected: true,
    originalRawRow: clean,
  };
}

/**
 * Parses batch SMS messages (separated by double newlines or standard delimiters).
 */
export function parseSMSBatch(rawBatchText: string): SMSParseResult {
  const sanitized = sanitizeSMSInput(rawBatchText);
  if (!sanitized) {
    return {
      transactions: [],
      totalParsed: 0,
      skippedCount: 0,
      errors: ['No text provided for SMS statement parsing.'],
    };
  }

  // Split messages by double newline, or lines that begin with known SMS headers/timestamps
  const chunks = sanitized
    .split(/(?:\r?\n\s*\r?\n)|(?:^|\r?\n)(?=[A-Z0-9-]{3,10}:)/m)
    .map(c => c.trim())
    .filter(c => c.length > 0);

  const transactions: StagedTransaction[] = [];
  const errors: string[] = [];
  let skipped = 0;

  chunks.forEach((chunk, idx) => {
    try {
      const parsed = parseSingleSMS(chunk, idx);
      if (parsed) {
        transactions.push(parsed);
      } else {
        skipped++;
      }
    } catch (err: any) {
      errors.push(`SMS chunk ${idx + 1}: ${err?.message || 'Failed to parse'}`);
      skipped++;
    }
  });

  return {
    transactions,
    totalParsed: transactions.length,
    skippedCount: skipped,
    errors,
  };
}
