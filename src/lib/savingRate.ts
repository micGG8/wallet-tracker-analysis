import type { Expense, Income } from '../types';

export interface SavingRatePoint {
  date: string; // ISO yyyy-mm-dd
  label: string; // short display label
  rate: number; // percentage, can be negative
  monthEnd: boolean; // large marker for end of month
  weekEnd: boolean; // small marker for end of week (Sunday)
}

// Compute the saving-rate time series across all history.
// For each day from the first to the last activity date we accumulate
// income and expenses, then emit a point at the end of every week (Sunday)
// and at the end of every month (last day with activity in that month).
export function computeSavingRateSeries(
  expenses: Expense[],
  incomes: Income[],
  salary: number,
): SavingRatePoint[] {
  if (expenses.length === 0 && incomes.length === 0 && salary <= 0) return [];

  const dateSet = new Set<string>();
  expenses.forEach((e) => dateSet.add(e.date));
  incomes.forEach((e) => dateSet.add(e.date));
  const dates = [...dateSet].sort((a, b) => a.localeCompare(b));
  if (dates.length === 0) return [];

  const first = dates[0];
  const last = dates[dates.length - 1];

  const expenseByDate = new Map<string, number>();
  expenses.forEach((e) => {
    expenseByDate.set(e.date, (expenseByDate.get(e.date) ?? 0) + e.amount);
  });
  const incomeByDate = new Map<string, number>();
  incomes.forEach((e) => {
    incomeByDate.set(e.date, (incomeByDate.get(e.date) ?? 0) + e.amount);
  });

  // Group months by yyyy-mm -> last activity date in that month.
  const monthLastDate = new Map<string, string>();
  dates.forEach((d) => {
    const key = d.slice(0, 7);
    if (!monthLastDate.has(key) || d > (monthLastDate.get(key) as string)) {
      monthLastDate.set(key, d);
    }
  });

  const points: SavingRatePoint[] = [];
  let cumIncome = 0;
  let cumExpense = 0;

  const start = new Date(`${first}T00:00:00`);
  const end = new Date(`${last}T00:00:00`);
  const cursor = new Date(start);

  while (cursor <= end) {
    const iso = toISO(cursor);
    cumIncome += incomeByDate.get(iso) ?? 0;
    cumExpense += expenseByDate.get(iso) ?? 0;

    const effectiveIncome = cumIncome + salary;
    const rate = effectiveIncome > 0 ? ((effectiveIncome - cumExpense) / effectiveIncome) * 100 : 0;

    const dow = cursor.getDay(); // 0 = Sunday
    const monthKey = iso.slice(0, 7);
    const isMonthEnd = monthLastDate.get(monthKey) === iso;
    const isWeekEnd = dow === 0;

    if (isMonthEnd || isWeekEnd) {
      points.push({
        date: iso,
        label: formatLabel(cursor, isMonthEnd),
        rate: Number(rate.toFixed(2)),
        monthEnd: isMonthEnd,
        weekEnd: isWeekEnd && !isMonthEnd,
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  // Ensure the final point is present (in case last day isn't Sun/month-end).
  if (points.length === 0 || points[points.length - 1].date !== last) {
    const finalIncome = cumIncome + salary;
    const finalRate =
      finalIncome > 0 ? ((finalIncome - cumExpense) / finalIncome) * 100 : 0;
    points.push({
      date: last,
      label: formatLabel(new Date(`${last}T00:00:00`), true),
      rate: Number(finalRate.toFixed(2)),
      monthEnd: true,
      weekEnd: false,
    });
  }

  return points;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatLabel(d: Date, monthEnd: boolean): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: monthEnd ? 'short' : '2-digit',
  }).format(d);
}
