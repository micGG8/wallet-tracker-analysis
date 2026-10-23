import { useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  History,
  Pencil,
  PiggyBank,
  Receipt,
  Scale,
  ShoppingBag,
  StickyNote,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import type { Expense, Income } from '../types';
import { CLASS_COLORS } from '../types';
import { formatCurrency, todayISO } from '../lib/format';

interface HistorySectionProps {
  expenses: Expense[];
  incomes: Income[];
  salary: number;
  notes: Record<string, string>;
  onSaveNote: (monthKey: string, noteText: string) => void;
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
  notes,
  onSaveNote,
}: HistorySectionProps) {
  // Store expanded state per month (default first month expanded)
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  // Editing note state: monthKey currently being edited
  const [editingMonthKey, setEditingMonthKey] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>('');

  const toggleMonth = (key: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const startEditNote = (monthKey: string) => {
    setEditingMonthKey(monthKey);
    setNoteDraft(notes[monthKey] || '');
  };

  const cancelEditNote = () => {
    setEditingMonthKey(null);
    setNoteDraft('');
  };

  const saveNote = (monthKey: string) => {
    onSaveNote(monthKey, noteDraft);
    setEditingMonthKey(null);
    setNoteDraft('');
  };

  const removeNote = (monthKey: string) => {
    onSaveNote(monthKey, '');
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

  // Dynamic calculation of active period: from the FIRST active month found up to today
  const dynamicSummary = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const jan1 = `${currentYear}-01-01`;
    const today = todayISO();

    const ytdExpenses = expenses.filter(
      (e) => e.date >= jan1 && e.date <= today,
    );
    const ytdIncomes = incomes.filter((i) => i.date >= jan1 && i.date <= today);

    // Collect all active months in current year
    const activeMonthsInYear = new Set<string>();
    ytdExpenses.forEach((e) => activeMonthsInYear.add(e.date.slice(0, 7)));
    ytdIncomes.forEach((i) => activeMonthsInYear.add(i.date.slice(0, 7)));

    // Fallback to current month if no data
    const currentMonthKey = today.slice(0, 7);
    activeMonthsInYear.add(currentMonthKey);

    const sortedActiveMonths = [...activeMonthsInYear].sort((a, b) =>
      a.localeCompare(b),
    );

    // First month with data in this year
    const firstActiveMonthKey = sortedActiveMonths[0];
    const [firstY, firstM] = firstActiveMonthKey.split('-');
    const firstMonthDate = new Date(Number(firstY), Number(firstM) - 1, 1);
    const firstMonthName = firstMonthDate.toLocaleDateString('it-IT', {
      month: 'long',
    });

    const firstMonthNum = parseInt(firstM, 10);
    const currentMonthNum = parseInt(currentMonthKey.split('-')[1], 10);

    // Number of months from the first active month to current month
    const elapsedMonths = Math.max(1, currentMonthNum - firstMonthNum + 1);

    const totalIncomePeriod =
      salary * elapsedMonths + ytdIncomes.reduce((s, i) => s + i.amount, 0);

    const totalExpensesPeriod = ytdExpenses.reduce((s, e) => s + e.amount, 0);
    const netCashflowPeriod = totalIncomePeriod - totalExpensesPeriod;

    // Spesa media mensile dal primo mese con dati a oggi
    const avgMonthlyExpense = totalExpensesPeriod / elapsedMonths;

    // Saving rate medio generale dal primo mese con dati a oggi
    const avgSavingRate =
      totalIncomePeriod > 0 ? (netCashflowPeriod / totalIncomePeriod) * 100 : 0;

    return {
      currentYear,
      firstMonthName,
      elapsedMonths,
      avgMonthlyExpense,
      avgSavingRate,
      totalExpensesPeriod,
      totalIncomePeriod,
      netCashflowPeriod,
    };
  }, [expenses, incomes, salary]);

  return (
    <div className="animate-fade-in space-y-5 px-4 pb-6 pt-3">
      {/* Page Header */}
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
          <History size={22} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">History</h1>
          <p className="text-sm text-slate-500">
            Statistiche e storico dei mesi trascorsi
          </p>
        </div>
      </header>

      {/* Monthly Breakdown List */}
      <div className="space-y-3">
        {monthlyStats.map((st, index) => {
          const isExpanded =
            expandedMonths[st.monthKey] ?? (index === 0 ? true : false);
          const hasNote = Boolean(notes[st.monthKey]);
          const isEditing = editingMonthKey === st.monthKey;

          return (
            <div
              key={st.monthKey}
              className="overflow-hidden rounded-3xl bg-white shadow-card border border-slate-100 transition"
            >
              {/* Header card button */}
              <button
                type="button"
                onClick={() => toggleMonth(st.monthKey)}
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50/80"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold capitalize text-slate-900">
                      {st.monthLabel}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {st.expensesCount} spese
                    </span>
                    {hasNote && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                        <StickyNote size={11} /> Nota
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Entrate: {formatCurrency(st.totalIncomes)} · Uscite:{' '}
                    {formatCurrency(st.totalExpenses)}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <span
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold ${
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
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-4 text-xs">
                  {/* High level metrics */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl bg-white p-3 border border-slate-100 shadow-sm">
                      <span className="text-[10px] text-slate-500 font-medium">
                        Cashflow Netto
                      </span>
                      <p
                        className={`text-base font-bold tracking-tight ${
                          st.netCashflow >= 0
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {formatCurrency(st.netCashflow)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 border border-slate-100 shadow-sm">
                      <span className="text-[10px] text-slate-500 font-medium">
                        Saving Rate
                      </span>
                      <p
                        className={`text-base font-bold tracking-tight ${
                          st.savingRate >= 0
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {st.savingRate > 0 ? '+' : ''}
                        {st.savingRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Class distribution breakdown (divided by total income) */}
                  <div className="space-y-2.5 rounded-2xl bg-white p-3.5 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Scale size={14} className="text-brand-600" /> Distribuzione
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
                            size={14}
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
                          className="h-full rounded-full transition-all duration-300"
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
                            size={14}
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
                          className="h-full rounded-full transition-all duration-300"
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
                            size={14}
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
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, st.classPercentages.investimento)}%`,
                            backgroundColor: CLASS_COLORS['Investimento'],
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Month Notes Section */}
                  <div className="rounded-2xl bg-white p-3.5 border border-slate-100 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                        <StickyNote size={14} className="text-amber-500" /> Note del
                        mese
                      </span>
                      {!isEditing && hasNote && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditNote(st.monthKey)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            title="Modifica nota"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeNote(st.monthKey)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Elimina nota"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={2}
                          value={noteDraft}
                          autoFocus
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Es. Vacanza in Spagna, spese straordinarie..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-brand-500 focus:bg-white focus:ring-1 focus:ring-brand-200 transition resize-none"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={cancelEditNote}
                            className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100"
                          >
                            <X size={13} /> Annulla
                          </button>
                          <button
                            type="button"
                            onClick={() => saveNote(st.monthKey)}
                            className="flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-brand-700 shadow-sm"
                          >
                            <Check size={13} /> Salva Nota
                          </button>
                        </div>
                      </div>
                    ) : hasNote ? (
                      <p className="rounded-xl bg-amber-50/60 border border-amber-200/60 p-2.5 text-xs text-slate-800 leading-relaxed italic">
                        &laquo;{notes[st.monthKey]}&raquo;
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditNote(st.monthKey)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 py-2 text-[11px] font-medium text-slate-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/50 transition"
                      >
                        <Pencil size={12} /> Aggiungi una nota (es. vacanza, evento)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pannello Riepilogo Dinamico dal PRIMO mese con dati */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5 mb-3.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Calendar size={15} className="text-brand-300" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Riepilogo {dynamicSummary.currentYear}
              </h3>
            </div>
            <p className="text-[11px] capitalize text-brand-200">
              Da {dynamicSummary.firstMonthName} a Oggi ·{' '}
              {dynamicSummary.elapsedMonths}{' '}
              {dynamicSummary.elapsedMonths === 1 ? 'mese' : 'mesi'}
            </p>
          </div>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700">
            Dati effettivi
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Spesa Media Mensile */}
          <div className="rounded-2xl bg-slate-800/80 p-3.5 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
              <PiggyBank size={13} className="text-brand-400" /> Spesa media mensile
            </span>
            <p className="mt-1 text-xl font-bold text-white tracking-tight">
              {formatCurrency(dynamicSummary.avgMonthlyExpense)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Totale uscite: {formatCurrency(dynamicSummary.totalExpensesPeriod)}
            </p>
          </div>

          {/* Saving Rate Medio Generale */}
          <div className="rounded-2xl bg-slate-800/80 p-3.5 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
              <TrendingUp size={13} className="text-emerald-400" /> Saving rate medio
            </span>
            <p
              className={`mt-1 text-xl font-bold tracking-tight ${
                dynamicSummary.avgSavingRate >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {dynamicSummary.avgSavingRate > 0 ? '+' : ''}
              {dynamicSummary.avgSavingRate.toFixed(1)}%
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Risparmio netto: {formatCurrency(dynamicSummary.netCashflowPeriod)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
