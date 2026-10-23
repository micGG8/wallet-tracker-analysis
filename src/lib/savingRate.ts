import type { Expense, Income } from '../types';

export interface SavingRatePoint {
  date: string; // ISO yyyy-mm-dd
  label: string; // display label, e.g. "1 ott"
  monthKey: string; // yyyy-mm
  rate: number; // percentage, starts at 100% on day 1, can be negative if overspent
  monthStart: boolean; // true for day 1 (100% reset)
  monthEnd: boolean; // true for end of month
  spentInMonth: number; // cumulative expense in this month
  incomeInMonth: number; // total income of this month
}

/**
 * Computes saving rate series resetting to 100% on the 1st of every month.
 * Prevents dragging or cumulative carryover from previous months.
 */
export function computeSavingRateSeries(
  expenses: Expense[],
  incomes: Income[],
  salary: number,
  targetMonth?: string, // optional filter to view just one month
): SavingRatePoint[] {
  // Collect all months with activity or current month
  const monthSet = new Set<string>();
  expenses.forEach((e) => monthSet.add(e.date.slice(0, 7)));
  incomes.forEach((i) => monthSet.add(i.date.slice(0, 7)));

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  monthSet.add(currentMonthKey);

  let sortedMonths = [...monthSet].sort((a, b) => a.localeCompare(b));

  if (targetMonth) {
    sortedMonths = sortedMonths.filter((m) => m === targetMonth);
    if (sortedMonths.length === 0) sortedMonths = [targetMonth];
  }

  const points: SavingRatePoint[] = [];

  for (const mKey of sortedMonths) {
    const monthExpenses = expenses
      .filter((e) => e.date.startsWith(mKey))
      .sort((a, b) => a.date.localeCompare(b.date));

    const monthIncomes = incomes.filter((i) => i.date.startsWith(mKey));
    const totalExtraIncome = monthIncomes.reduce((s, i) => s + i.amount, 0);
    const effectiveMonthlyIncome = salary + totalExtraIncome;

    // Day 1: Always resets to 100% at the start of every month
    const day1Date = `${mKey}-01`;
    const [y, m] = mKey.split('-');
    const monthObj = new Date(Number(y), Number(m) - 1, 1);
    const shortMonth = monthObj.toLocaleDateString('it-IT', { month: 'short' });

    points.push({
      date: day1Date,
      label: `1 ${shortMonth}`,
      monthKey: mKey,
      rate: 100.0,
      monthStart: true,
      monthEnd: false,
      spentInMonth: 0,
      incomeInMonth: effectiveMonthlyIncome,
    });

    if (monthExpenses.length === 0) {
      continue;
    }

    // Group expenses by date within this month
    const expenseByDate = new Map<string, number>();
    monthExpenses.forEach((e) => {
      expenseByDate.set(e.date, (expenseByDate.get(e.date) ?? 0) + e.amount);
    });

    const activeDates = [...expenseByDate.keys()].sort((a, b) =>
      a.localeCompare(b),
    );

    let cumExpense = 0;
    activeDates.forEach((date, idx) => {
      cumExpense += expenseByDate.get(date) ?? 0;
      const isLast = idx === activeDates.length - 1;
      const dayNum = parseInt(date.slice(8, 10), 10);

      const rate =
        effectiveMonthlyIncome > 0
          ? ((effectiveMonthlyIncome - cumExpense) / effectiveMonthlyIncome) * 100
          : 0;

      // Don't duplicate day 1 if already added
      if (date === day1Date) {
        // Update day 1 point
        points[points.length - 1].rate = Number(rate.toFixed(1));
        points[points.length - 1].spentInMonth = Number(cumExpense.toFixed(2));
      } else {
        points.push({
          date,
          label: `${dayNum} ${shortMonth}`,
          monthKey: mKey,
          rate: Number(rate.toFixed(1)),
          monthStart: false,
          monthEnd: isLast,
          spentInMonth: Number(cumExpense.toFixed(2)),
          incomeInMonth: effectiveMonthlyIncome,
        });
      }
    });
  }

  return points;
}
