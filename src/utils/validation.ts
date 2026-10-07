export const MAX_AMOUNT = 1_000_000_000; // 100 crore INR

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isValidAmount(amount: any): boolean {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount);
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    return false;
  }
  return roundMoney(amount) > 0;
}

export function isValidDate(dateStr: any): boolean {
  if (typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(d.getTime())) return false;

  const minDate = new Date('2000-01-01T00:00:00Z');
  const now = new Date();
  const maxYear = now.getUTCFullYear() + 5;
  const maxDate = new Date(`${maxYear}-12-31T23:59:59Z`);

  return d >= minDate && d <= maxDate;
}
