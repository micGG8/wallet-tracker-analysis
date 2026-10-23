import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { BarChart3, Trash2 } from 'lucide-react';
import type { Expense } from '../types';
import { CLASS_COLORS, iconForCategory } from '../types';
import { formatCurrency, formatDayMonth, formatShortDate, isCurrentMonth } from '../lib/format';
import { Icon } from './Icon';

interface OutlookExpensesProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

interface ChartDatum {
  id: string;
  date: string;
  label: string;
  amount: number;
  category: string;
  class: Expense['class'];
  color: string;
}

export function OutlookExpenses({ expenses, onDelete }: OutlookExpensesProps) {
  const data = useMemo<ChartDatum[]>(() => {
    return expenses
      .filter((e) => isCurrentMonth(e.date))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({
        id: e.id,
        date: e.date,
        label: formatShortDate(e.date),
        amount: Number(e.amount.toFixed(2)),
        category: e.category,
        class: e.class,
        color: CLASS_COLORS[e.class],
      }));
  }, [expenses]);

  const last5 = useMemo(
    () =>
      [...expenses]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [expenses],
  );

  const monthTotal = data.reduce((s, d) => s + d.amount, 0);
  const now = new Date();
  const monthLabel = now.toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="animate-fade-in space-y-5 px-4 pb-6 pt-3">
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
          <BarChart3 size={22} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Outlook Expenses</h1>
          <p className="text-sm capitalize text-slate-500">{monthLabel}</p>
        </div>
      </header>

      {/* Month total summary */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 to-brand-800 p-5 text-white shadow-card">
        <p className="text-sm font-medium text-brand-200">
          Totale spese di questo mese
        </p>
        <p className="mt-2 text-4xl font-bold tracking-tight">
          {formatCurrency(monthTotal)}
        </p>
        <p className="mt-2 text-sm text-brand-200">
          {data.length} {data.length === 1 ? 'movimento' : 'movimenti'}
        </p>
      </section>

      {/* Recharts bar chart */}
      <section className="rounded-3xl bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Andamento spese
          </h2>
          <span className="text-xs font-medium text-slate-400">
            si azzera al cambio mese
          </span>
        </div>

        {data.length === 0 ? (
          <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-center text-slate-400">
            <p className="text-sm">Nessuna spesa questo mese.</p>
            <p className="text-xs">Le spese del mese corrente appariranno qui.</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `€${v}`}
                  width={56}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }}
                  content={<CustomTooltip />}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {data.map((d) => (
                    <Cell key={d.id} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* legend by class present this month */}
        {data.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-4">
            {uniqueClasses(data).map((cls) => (
              <span
                key={cls}
                className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CLASS_COLORS[cls] }}
                />
                {cls}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Last 5 expenses with delete */}
      <section className="rounded-3xl bg-white p-5 shadow-card">
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          Ultime 5 spese
        </h2>
        {last5.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Nessuna spesa ancora registrata.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {last5.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: CLASS_COLORS[e.class] }}
                >
                  <Icon name={iconForCategory(e.category, e.class)} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {e.category}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDayMonth(e.date)} · {e.class}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-slate-900">
                  {formatCurrency(e.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(e.id)}
                  aria-label={`Elimina spesa ${e.category} del ${formatDayMonth(e.date)}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

interface TooltipPayload {
  payload: ChartDatum;
}
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
      <p className="font-semibold">{formatCurrency(d.amount)}</p>
      <p className="text-slate-300">
        {d.category} · {d.label}
      </p>
    </div>
  );
}

function uniqueClasses(data: ChartDatum[]): Expense['class'][] {
  const seen = new Set<Expense['class']>();
  data.forEach((d) => seen.add(d.class));
  return [...seen];
}
