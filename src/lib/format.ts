const IT_LOCALE = 'it-IT';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(IT_LOCALE, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat(IT_LOCALE, {
    day: '2-digit',
    month: 'short',
  }).format(d);
}

export function formatDayMonth(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat(IT_LOCALE, {
    day: 'numeric',
    month: 'long',
  }).format(d);
}

export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function isCurrentMonth(iso: string): boolean {
  const now = new Date();
  const d = new Date(`${iso}T00:00:00`);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}
