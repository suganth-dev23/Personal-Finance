/**
 * Formats a number to Indian Rupee (INR) currency format
 * e.g., 125000 -> ₹1,25,000
 * e.g., 1550000.75 -> ₹15,50,000.75
 */
export function formatINR(
  amount: number | string | undefined | null,
  options?: {
    showSymbol?: boolean;
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
    compact?: boolean;
  }
): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return (options?.showSymbol !== false ? '₹' : '') + '0';
  }

  const num = Number(amount);
  const showSymbol = options?.showSymbol !== false;
  const symbol = showSymbol ? '₹' : '';

  if (options?.compact) {
    return symbol + formatCompactINR(num);
  }

  const maxFraction = options?.maximumFractionDigits !== undefined ? options.maximumFractionDigits : (Number.isInteger(num) ? 0 : 2);
  const minFraction = options?.minimumFractionDigits !== undefined ? options.minimumFractionDigits : 0;

  try {
    const formatted = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: maxFraction,
      minimumFractionDigits: minFraction,
    }).format(num);

    return `${symbol}${formatted}`;
  } catch {
    return `${symbol}${num.toLocaleString('en-IN')}`;
  }
}

/**
 * Compact Indian Number format
 * ₹1K, ₹1.25 L (Lakhs), ₹2.50 Cr (Crores)
 */
export function formatCompactINR(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    const cr = abs / 10000000;
    return `${sign}${cr.toFixed(cr < 10 ? 2 : 1)} Cr`;
  }
  if (abs >= 100000) {
    const lk = abs / 100000;
    return `${sign}${lk.toFixed(lk < 10 ? 2 : 1)} L`;
  }
  if (abs >= 1000) {
    const k = abs / 1000;
    return `${sign}${k.toFixed(k < 10 ? 1 : 0)} K`;
  }
  return `${sign}${abs.toFixed(0)}`;
}

/**
 * Parses user typed rupee string into clean float number
 * Handles "₹1,25,000.50", " 15000 ", etc.
 */
export function parseINR(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  const str = String(value).trim();
  if (!str) return 0;

  const isParenNegative = /^\(.*\)$/.test(str);
  const isExplicitMinus = str.startsWith('-') || str.endsWith('-');

  const cleaned = str.replace(/,/g, '').replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;

  if (isParenNegative || isExplicitMinus) {
    return -Math.abs(parsed);
  }
  return parsed;
}

/**
 * Converts amount into Indian words
 * e.g., 150000 -> "One Lakh Fifty Thousand"
 */
export function numberToWordsINR(amount: number): string {
  if (amount === 0) return 'Zero Rupees';
  if (isNaN(amount)) return '';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 10) return units[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    return `${tens[Math.floor(n / 10)]} ${units[n % 10]}`.trim();
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) res += `${units[hundred]} Hundred `;
    if (rest > 0) {
      if (hundred > 0) res += 'and ';
      res += convertTwoDigits(rest);
    }
    return res.trim();
  }

  const num = Math.floor(Math.abs(amount));
  let result = '';

  const crores = Math.floor(num / 10000000);
  const lakhs = Math.floor((num % 10000000) / 100000);
  const thousands = Math.floor((num % 100000) / 1000);
  const remaining = num % 1000;

  if (crores > 0) {
    result += `${convertTwoDigits(crores)} Crore `;
  }
  if (lakhs > 0) {
    result += `${convertTwoDigits(lakhs)} Lakh `;
  }
  if (thousands > 0) {
    result += `${convertTwoDigits(thousands)} Thousand `;
  }
  if (remaining > 0) {
    result += `${convertThreeDigits(remaining)} `;
  }

  return (result.trim() + ' Rupees');
}
