import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ClipboardPaste,
  Database,
  Download,
  PieChart as PieIcon,
  PiggyBank,
  Scale,
  TrendingUp,
  Upload,
  Wallet,
} from 'lucide-react';
import type { Expense, Income, RuleBucket, RuleWeights } from '../types';
import { RULE_BUCKETS, classToBucket } from '../types';
import { formatCurrency, isCurrentMonth, todayISO } from '../lib/format';
import { computeSavingRateSeries } from '../lib/savingRate';
import { buildCsv, downloadCsv } from '../lib/csv';
import { cleanAndParseJson, downloadJsonBackup, importAllData } from '../lib/storage';
import { JsonImportModal } from './JsonImportModal';

interface AnalysisProps {
  expenses: Expense[];
  incomes: Income[];
  salary: number;
  weights: RuleWeights;
  onUpdateSalary: (amount: number) => void;
  onUpdateWeights: (weights: RuleWeights) => void;
}

export function Analysis({
  expenses,
  incomes,
  salary,
  weights,
  onUpdateSalary,
  onUpdateWeights,
}: AnalysisProps) {
  const [salaryDraft, setSalaryDraft] = useState<string>(
    salary > 0 ? String(salary) : '',
  );
  const [weightDrafts, setWeightDrafts] = useState<Record<RuleBucket, string>>({
    needs: String(weights.needs),
    wants: String(weights.wants),
    savings: String(weights.savings),
  });

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const monthExpenses = useMemo(
    () => expenses.filter((e) => isCurrentMonth(e.date)),
    [expenses],
  );
  const monthIncomes = useMemo(
    () => incomes.filter((e) => isCurrentMonth(e.date)),
    [incomes],
  );

  const totals = useMemo(() => {
    const totalExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const totalIncomes = monthIncomes.reduce((s, e) => s + e.amount, 0);
    const effectiveIncome = totalIncomes + salary;
    const saved = effectiveIncome - totalExpenses;
    const savingRate = effectiveIncome > 0 ? (saved / effectiveIncome) * 100 : 0;
    return { totalExpenses, totalIncomes, effectiveIncome, saved, savingRate };
  }, [monthExpenses, monthIncomes, salary]);

  // 50/30/20 breakdown — each expense maps to a bucket by its class.
  const buckets = useMemo(() => {
    const b: Record<RuleBucket, number> = { needs: 0, wants: 0, savings: 0 };
    monthExpenses.forEach((e) => {
      b[classToBucket(e.class)] += e.amount;
    });
    return b;
  }, [monthExpenses]);

  const pieData = useMemo(
    () =>
      RULE_BUCKETS.map((bk) => ({
        id: bk.id,
        name: `${bk.baseLabel} (${weights[bk.id]}%)`,
        value: Number(buckets[bk.id].toFixed(2)),
        color: bk.color,
      })),
    [buckets, weights],
  );

  const savingSeries = useMemo(
    () => computeSavingRateSeries(expenses, incomes, salary),
    [expenses, incomes, salary],
  );

  const hasData = totals.effectiveIncome > 0 || totals.totalExpenses > 0;
  const weightSum = weights.needs + weights.wants + weights.savings;
  const weightsValid = weightSum === 100;

  // Dynamic rule title: "Regola 50/30/20" reflects the current weights.
  const ruleTitle = `Regola ${weights.needs} / ${weights.wants} / ${weights.savings}`;

  function commitSalary() {
    const v = parseFloat(salaryDraft.replace(',', '.'));
    onUpdateSalary(isNaN(v) ? 0 : v);
  }

  function commitWeight(bucket: RuleBucket, raw: string) {
    const v = parseInt(raw, 10);
    const clamped = isNaN(v) ? 0 : Math.max(0, Math.min(100, v));
    const next: RuleWeights = { ...weights, [bucket]: clamped };
    onUpdateWeights(next);
    setWeightDrafts({
      needs: String(next.needs),
      wants: String(next.wants),
      savings: String(next.savings),
    });
  }

  function handleExportCsv() {
    const csv = buildCsv(expenses, incomes);
    downloadCsv(`dati-finanziari-${todayISO()}.csv`, csv);
  }

  function handleImportJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawText = (event.target?.result as string) || '';
      const { data, error } = cleanAndParseJson(rawText);
      if (error || !data) {
        alert(`Errore di lettura del file:\n${error || 'Formato non valido'}`);
        return;
      }
      const result = importAllData(data);
      if (result.success) {
        alert(
          `${result.message}\nL'applicazione verrà riavviata per aggiornare tutti i grafici e dati.`,
        );
        window.location.reload();
      } else {
        alert(`Errore: ${result.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handlePasteJson() {
    setIsImportModalOpen(true);
  }

  const now = new Date();
  const monthLabel = now.toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="animate-fade-in space-y-5 px-4 pb-6 pt-3">
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
          <PieIcon size={22} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Analysis</h1>
          <p className="text-sm capitalize text-slate-500">{monthLabel}</p>
        </div>
      </header>

      {/* Salary input (persistent) */}
      <section className="rounded-3xl bg-white p-5 shadow-card">
        <label className="block space-y-1.5">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Wallet size={16} className="text-brand-600" /> Stipendio Mensile
          </span>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={salaryDraft}
              onChange={(e) => setSalaryDraft(e.target.value)}
              onBlur={commitSalary}
              className="form-input pr-10 text-lg font-semibold"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              €
            </span>
          </div>
        </label>
        <p className="mt-2 text-xs text-slate-500">
          Salvato automaticamente. Usato come base per i calcoli del mese.
        </p>
      </section>

      {/* Saving rate + saved money */}
      <section className="grid grid-cols-2 gap-3">
        <div
          className={`rounded-2xl p-4 shadow-card ${
            totals.savingRate >= 0
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white'
              : 'bg-gradient-to-br from-rose-500 to-rose-700 text-white'
          }`}
        >
          <p className="text-xs font-medium opacity-90">Saving Rate</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">
            {totals.savingRate > 0 ? '+' : ''}
            {totals.savingRate.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <p className="flex items-center gap-1 text-xs font-medium text-slate-500">
            <PiggyBank size={14} /> Risparmiato
          </p>
          <p
            className={`mt-1 text-2xl font-bold tracking-tight ${
              totals.saved >= 0 ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {formatCurrency(totals.saved)}
          </p>
        </div>
      </section>

      {/* Monthly totals */}
      <section className="rounded-3xl bg-white p-5 shadow-card">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          Riepilogo del mese
        </h2>
        <dl className="space-y-3">
          <Row label="Totale Entrate (stipendio + entrate)" value={formatCurrency(totals.effectiveIncome)} />
          <Row label="Totale Uscite (spese)" value={formatCurrency(totals.totalExpenses)} />
          <div className="border-t border-slate-100 pt-3">
            <Row
              label="Saldo netto"
              value={formatCurrency(totals.saved)}
              valueClass={totals.saved >= 0 ? 'text-emerald-600' : 'text-rose-600'}
              bold
            />
          </div>
        </dl>
      </section>

      {/* 50/30/20 rule with editable weights */}
      <section className="rounded-3xl bg-white p-5 shadow-card">
        <div className="mb-1 flex items-center gap-2">
          <Scale size={18} className="text-brand-600" />
          <h2 className="text-base font-semibold text-slate-900">{ruleTitle}</h2>
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Distribuzione attuale rispetto allo stipendio ({formatCurrency(salary)}).
          Il bucket Investimento somma solo le spese di classe &laquo;Investimento&raquo;.
        </p>

        {/* Editable weight inputs */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          {RULE_BUCKETS.map((bk) => (
            <label key={bk.id} className="block">
              <span className="mb-1 flex items-center gap-1 text-[11px] font-medium text-slate-600">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: bk.color }}
                />
                {bk.baseLabel}
              </span>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weightDrafts[bk.id]}
                  onChange={(e) =>
                    setWeightDrafts((d) => ({ ...d, [bk.id]: e.target.value }))
                  }
                  onBlur={(e) => commitWeight(bk.id, e.target.value)}
                  className="form-input px-2 py-2 text-center text-sm font-semibold"
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  %
                </span>
              </div>
            </label>
          ))}
        </div>
        {!weightsValid && (
          <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            La somma dei pesi è {weightSum}%, deve essere 100%.
          </p>
        )}

        {!hasData ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Inserisci stipendio e spese per vedere l&apos;analisi.
          </p>
        ) : (
          <>
            {/* Pie chart */}
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {pieData.map((d) => (
                      <Cell key={d.id} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0];
                      return (
                        <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
                          <p className="font-semibold">{formatCurrency(Number(p.value))}</p>
                          <p className="text-slate-300">{p.name}</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Per-bucket breakdown vs target */}
            <div className="mt-4 space-y-3">
              {RULE_BUCKETS.map((bk) => {
                const actual = buckets[bk.id];
                const pct = weights[bk.id];
                const targetAmount = (salary * pct) / 100;
                const actualPct =
                  totals.effectiveIncome > 0
                    ? (actual / totals.effectiveIncome) * 100
                    : 0;
                const overTarget = actual > targetAmount && targetAmount > 0;
                return (
                  <div key={bk.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: bk.color }}
                        />
                        {bk.baseLabel} ({pct}%)
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(actual)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, actualPct)}%`,
                          backgroundColor: bk.color,
                        }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        Target: {formatCurrency(targetAmount)} ({pct}%)
                      </span>
                      <span
                        className={
                          targetAmount === 0
                            ? 'text-slate-400'
                            : overTarget
                              ? 'font-semibold text-rose-600'
                              : 'font-semibold text-emerald-600'
                        }
                      >
                        {targetAmount === 0
                          ? '—'
                          : overTarget
                            ? `+${formatCurrency(actual - targetAmount)}`
                            : `ok (-${formatCurrency(targetAmount - actual)})`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Saving-rate historical chart */}
      <section className="rounded-3xl bg-white p-5 shadow-card">
        <div className="mb-1 flex items-center gap-2">
          <TrendingUp size={18} className="text-brand-600" />
          <h2 className="text-base font-semibold text-slate-900">
            Andamento Saving Rate
          </h2>
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Punti grandi = fine mese, punti piccoli = fine settimana.
        </p>
        {savingSeries.length < 2 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Inserisci entrate e spese in date diverse per vedere l&apos;andamento.
          </p>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={savingSeries}
                margin={{ top: 10, right: 12, bottom: 0, left: -18 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  unit="%"
                  domain={['auto', 'auto']}
                />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="4 4" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as (typeof savingSeries)[number];
                    return (
                      <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
                        <p className="font-semibold">
                          {p.rate > 0 ? '+' : ''}
                          {p.rate.toFixed(1)}%
                        </p>
                        <p className="text-slate-300">
                          {p.date}
                          {p.monthEnd ? ' · Fine mese' : ' · Fine settimana'}
                        </p>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props as {
                      cx: number;
                      cy: number;
                      payload: (typeof savingSeries)[number];
                    };
                    if (payload.monthEnd) {
                      return (
                        <circle
                          key={`m-${payload.date}`}
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill="#059669"
                          stroke="#fff"
                          strokeWidth={1.5}
                        />
                      );
                    }
                    return (
                      <circle
                        key={`w-${payload.date}`}
                        cx={cx}
                        cy={cy}
                        r={3}
                        fill="#6ee7b7"
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Backup e Gestione Dati */}
      <section className="space-y-3 rounded-3xl bg-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-brand-600" />
          <h2 className="text-base font-semibold text-slate-900">
            Backup e Dati
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          I dati sono memorizzati in locale su questo dispositivo. Salva un file di backup per non perderli o trasferirli su un altro dispositivo o dominio.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={downloadJsonBackup}
            className="flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
          >
            <Download size={16} /> Salva Backup (JSON)
          </button>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.98]">
            <Upload size={16} /> Ripristina da File
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handlePasteJson}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-3 text-xs font-semibold text-slate-700 transition hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 active:scale-[0.98]"
        >
          <ClipboardPaste size={16} /> Incolla testo JSON dagli appunti
        </button>

        <button
          type="button"
          onClick={handleExportCsv}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 py-2.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <Download size={14} /> Esporta foglio di calcolo (CSV)
        </button>
      </section>

      <JsonImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => setIsImportModalOpen(false)}
      />
    </div>
  );
}

function Row({
  label,
  value,
  valueClass,
  bold,
}: {
  label: string;
  value: string;
  valueClass?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd
        className={`text-sm ${bold ? 'font-bold' : 'font-semibold'} ${
          valueClass ?? 'text-slate-900'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
