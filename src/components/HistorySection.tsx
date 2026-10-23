import { useMemo, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  History,
  PiggyBank,
  Receipt,
  Scale,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import type { Expense, Income } from '../types';
import { CLASS_COLORS } from '../types';
import { formatCurrency, todayISO } from '../lib/format';

interface HistorySectionProps {
  expenses: Expense[];
  incomes: Income[];
  salary: number;
}

interface MonthStats {
  monthKey: string; // YYYY-MM
  monthLabel: string; // e.g. "Ottobre 2026"
  totalIncomes: number;
  totalExpenses: number;
  netCashflow: number;
  savingRate: number;
  classes: {
    nonDiscrezionali: number;
    discrezionali: number;
    investimento: number;
  };
  classPercentages: {
    nonDiscrezionali: number;
    discrezionali: number;
    investimento: number;
  };
  expensesCount: number;
}

export function HistorySection({
  expenses,
  incomes,
  salary,
}: HistorySectionProps) {
  // Store expanded state per month (default first month expanded)
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const toggleMonth = (key: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Compute monthly statistics
  const monthlyStats = useMemo<MonthStats[]>(() => {
    const monthKeysSet = new Set<string>();
    expenses.forEach((e) => monthKeysSet.add(e.date.slice(0, 7)));
    incomes.forEach((i) => monthKeysSet.add(i.date.slice(0, 7)));

    // Ensure current month is present
    const currentM = todayISO().slice(0, 7);
    monthKeysSet.add(currentM);

    const sortedMonthKeys = [...monthKeysSet].sort((a, b) =>
      b.localeCompare(a),
    );

    return sortedMonthKeys.map((mKey) => {
      const [yearStr, monthStr] = mKey.split('-');
      const d = new Date(Number(yearStr), Number(monthStr) - 1, 1);
      const monthLabel = d.toLocaleDateString('it-IT', {
        month: 'long',
        year: 'numeric',
      });

      const mExpenses = expenses.filter((e) => e.date.startsWith(mKey));
      const mIncomes = incomes.filter((i) => i.date.startsWith(mKey));

      const extraIncome = mIncomes.reduce((s, i) => s + i.amount, 0);
      const totalIncomes = salary + extraIncome;
      const totalExpenses = mExpenses.reduce((s, e) => s + e.amount, 0);

      const netCashflow = totalIncomes - totalExpenses;
      const savingRate =
        totalIncomes > 0 ? (netCashflow / totalIncomes) * 100 : 0;

      const nonDiscrezionali = mExpenses
        .filter((e) => e.class === 'Non discrezionali')
        .reduce((s, e) => s + e.amount, 0);

      const discrezionali = mExpenses
        .filter((e) => e.class === 'Discrezionali')
        .reduce((s, e) => s + e.amount, 0);

      const investimento = mExpenses
        .filter((e) => e.class === 'Investimento')
        .reduce((s, e) => s + e.amount, 0);

      return {
        monthKey: mKey,
        monthLabel,
        totalIncomes,
        totalExpenses,
        netCashflow,
        savingRate,
        classes: {
          nonDiscrezionali,
          discrezionali,
          investimento,
        },
        classPercentages: {
          nonDiscrezionali:
            totalIncomes > 0 ? (nonDiscrezionali / totalIncomes) * 100 : 0,
          discrezionali:
            totalIncomes > 0 ? (discrezionali / totalIncomes) * 100 : 0,
          investimento:
            totalIncomes > 0 ? (investimento / totalIncomes) * 100 : 0,
        },
        expensesCount: mExpenses.length,
      };
    });
  }, [expenses, incomes, salary]);

  // Compute Year-to-Date (YTD) cumulative stats from January 1st to today
  const ytdSummary = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const jan1 = `${currentYear}-01-01`;
    const today = todayISO();

    const ytdExpenses = expenses.filter(
      (e) => e.date >= jan1 && e.date <= today,
    );
    const ytdIncomes = incomes.filter((i) => i.date >= jan1 && i.date <= today);

    // Number of months from January to current month
    const currentMonthNum = Math.max(1, new Date().getMonth() + 1);

    const totalIncomeYTD =
      salary * currentMonthNum +
      ytdIncomes.reduce((s, i) => s + i.amount, 0);

    const totalExpensesYTD = ytdExpenses.reduce((s, e) => s + e.amount, 0);
    const netCashflowYTD = totalIncomeYTD - totalExpensesYTD;

    // Spesa media mensile
    const avgMonthlyExpense = totalExpensesYTD / currentMonthNum;

    // Saving rate medio generale accumulato
    const avgSavingRateYTD =
      totalIncomeYTD > 0 ? (netCashflowYTD / totalIncomeYTD) * 100 : 0;

    return {
      currentYear,
      currentMonthNum,
      avgMonthlyExpense,
      avgSavingRateYTD,
      totalExpensesYTD,
      totalIncomeYTD,
      netCashflowYTD,
      expensesCountYTD: ytdExpenses.length,
    };
  }, [expenses, incomes, salary]);

  return (
    <section className="space-y-4 rounded-3xl bg-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <History size={18} />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900">Hystory</h2>
          <p className="text-xs text-slate-500">
            Statistiche e distribuzione dei mesi trascorsi
          </p>
        </div>
      </div>

      {/* Monthly Breakdown List */}
      <div className="space-y-3">
        {monthlyStats.map((st, index) => {
          // Default expand first month if not set
          const isExpanded =
            expandedMonths[st.monthKey] ?? (index === 0 ? true : false);

          return (
            <div
              key={st.monthKey}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/50 transition"
            >
              {/* Header card button */}
              <button
                type="button"
                onClick={() => toggleMonth(st.monthKey)}
                className="flex w-full items-center justify-between p-3.5 text-left transition hover:bg-slate-100/70"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold capitalize text-slate-900">
                      {st.monthLabel}
                    </span>
                    <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {st.expensesCount} spese
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Entrate: {formatCurrency(st.totalIncomes)} · Uscite:{' '}
                    {formatCurrency(st.totalExpenses)}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <span
                    className={`rounded-xl px-2 py-1 text-xs font-bold ${
                      st.savingRate >= 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {st.savingRate > 0 ? '+' : ''}
                    {st.savingRate.toFixed(1)}%
                  </span>
                  <span className="text-slate-400">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-slate-200/70 bg-white p-3.5 space-y-3 text-xs">
                  {/* High level metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 p-2.5">
                      <span className="text-[10px] text-slate-500">
                        Cashflow Netto
                      </span>
                      <p
                        className={`text-sm font-bold ${
                          st.netCashflow >= 0
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {formatCurrency(st.netCashflow)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2.5">
                      <span className="text-[10px] text-slate-500">
                        Saving Rate
                      </span>
                      <p
                        className={`text-sm font-bold ${
                          st.savingRate >= 0
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {st.savingRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Class distribution breakdown (divided by total income) */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                      <span className="flex items-center gap-1">
                        <Scale size={13} className="text-brand-600" /> Distribuzione
                        su Entrate
                      </span>
                      <span className="text-slate-400 font-normal">
                        Spesa / Tot. Entrate
                      </span>
                    </div>

                    {/* Non discrezionali */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Receipt
                            size={13}
                            style={{ color: CLASS_COLORS['Non discrezionali'] }}
                          />
                          Non discrezionali
                        </span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(st.classes.nonDiscrezionali)}{' '}
                          <span className="text-slate-400 font-normal">
                            ({st.classPercentages.nonDiscrezionali.toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, st.classPercentages.nonDiscrezionali)}%`,
                            backgroundColor: CLASS_COLORS['Non discrezionali'],
                          }}
                        />
                      </div>
                    </div>

                    {/* Discrezionali */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <ShoppingBag
                            size={13}
                            style={{ color: CLASS_COLORS['Discrezionali'] }}
                          />
                          Discrezionali
                        </span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(st.classes.discrezionali)}{' '}
                          <span className="text-slate-400 font-normal">
                            ({st.classPercentages.discrezionali.toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, st.classPercentages.discrezionali)}%`,
                            backgroundColor: CLASS_COLORS['Discrezionali'],
                          }}
                        />
                      </div>
                    </div>

                    {/* Investimento */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <TrendingUp
                            size={13}
                            style={{ color: CLASS_COLORS['Investimento'] }}
                          />
                          Investimento
                        </span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(st.classes.investimento)}{' '}
                          <span className="text-slate-400 font-normal">
                            ({st.classPercentages.investimento.toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, st.classPercentages.investimento)}%`,
                            backgroundColor: CLASS_COLORS['Investimento'],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pannello Riepilogo Accumulato dal 1° Gennaio */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white shadow-sm mt-4">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar size={15} className="text-brand-300" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Riepilogo {ytdSummary.currentYear} (1 Gen — Oggi)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">
            {ytdSummary.currentMonthNum} mesi trascorsi
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Spesa Media Mensile */}
          <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
              <PiggyBank size={13} className="text-brand-400" /> Spesa media mensile
            </span>
            <p className="mt-1 text-xl font-bold text-white tracking-tight">
              {formatCurrency(ytdSummary.avgMonthlyExpense)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Totale uscite: {formatCurrency(ytdSummary.totalExpensesYTD)}
            </p>
          </div>

          {/* Saving Rate Medio Generale */}
          <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
              <TrendingUp size={13} className="text-emerald-400" /> Saving rate medio
            </span>
            <p
              className={`mt-1 text-xl font-bold tracking-tight ${
                ytdSummary.avgSavingRateYTD >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {ytdSummary.avgSavingRateYTD > 0 ? '+' : ''}
              {ytdSummary.avgSavingRateYTD.toFixed(1)}%
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Risparmio YTD: {formatCurrency(ytdSummary.netCashflowYTD)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
