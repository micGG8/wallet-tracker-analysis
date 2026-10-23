import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { BarChart3, Trash2 } from 'lucide-react';
import type { Expense } from '../types';
import { CLASS_COLORS, iconForCategory } from '../types';
import { formatCurrency, formatDayMonth, isCurrentMonth } from '../lib/format';
import { Icon } from './Icon';

interface OutlookExpensesProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

interface DailyChartDatum {
  date: string;
  dayNumber: number;
  label: string;
  fullDateLabel: string;
  amount: number;
  count: number;
  items: Expense[];
}

export function OutlookExpenses({ expenses, onDelete }: OutlookExpensesProps) {
  // Filter current month expenses
  const monthExpenses = useMemo(() => {
    return expenses
      .filter((e) => isCurrentMonth(e.date))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [expenses]);

  // Aggregate expenses by day to avoid overlapping labels on mobile
  const chartData = useMemo<DailyChartDatum[]>(() => {
    const map = new Map<string, Expense[]>();
    monthExpenses.forEach((e) => {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    });

    const dates = [...map.keys()].sort((a, b) => a.localeCompare(b));

    return dates.map((dateStr) => {
      const items = map.get(dateStr) || [];
      const total = items.reduce((s, it) => s + it.amount, 0);
      const d = new Date(`${dateStr}T00:00:00`);
      const dayNum = d.getDate();
      const shortMonth = d.toLocaleDateString('it-IT', { month: 'short' });

      return {
        date: dateStr,
        dayNumber: dayNum,
        label: `${dayNum} ${shortMonth}`,
        fullDateLabel: formatDayMonth(dateStr),
        amount: Number(total.toFixed(2)),
        count: items.length,
        items,
      };
    });
  }, [monthExpenses]);

  const last5 = useMemo(
    () =>
      [...expenses]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [expenses],
  );

  const monthTotal = monthExpenses.reduce((s, d) => s + d.amount, 0);
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
          {monthExpenses.length}{' '}
          {monthExpenses.length === 1 ? 'movimento' : 'movimenti'} su{' '}
          {chartData.length} {chartData.length === 1 ? 'giorno' : 'giorni'}
        </p>
      </section>

      {/* Recharts curved Area chart */}
      <section className="rounded-3xl bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Andamento spese giornaliere
            </h2>
            <p className="text-xs text-slate-400">
              Curva per giorno di spesa nel mese in corso
            </p>
          </div>
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
            Mese corrente
          </span>
        </div>

        {chartData.length === 0 ? (
          <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-center text-slate-400">
            <p className="text-sm">Nessuna spesa questo mese.</p>
            <p className="text-xs">Le spese del mese corrente appariranno qui.</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 12, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="expenseAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  interval="preserveStartEnd"
                  minTickGap={16}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `€${v}`}
                  width={52}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fill="url(#expenseAreaGrad)"
                  dot={{
                    r: 3.5,
                    fill: '#2563eb',
                    stroke: '#ffffff',
                    strokeWidth: 1.5,
                  }}
                  activeDot={{
                    r: 5.5,
                    fill: '#1d4ed8',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend by class present this month */}
        {monthExpenses.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-4">
            {uniqueClasses(monthExpenses).map((cls) => (
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
  payload: DailyChartDatum;
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
    <div className="rounded-2xl bg-slate-900/95 p-3 text-xs text-white shadow-xl backdrop-blur-sm max-w-[240px]">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5 mb-1.5">
        <span className="font-semibold text-slate-200">{d.fullDateLabel}</span>
        <span className="font-bold text-brand-300">{formatCurrency(d.amount)}</span>
      </div>
      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
        {d.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="truncate text-slate-300 flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: CLASS_COLORS[item.class] }}
              />
              <span className="truncate">{item.category}</span>
            </span>
            <span className="font-medium text-slate-100 shrink-0">
              {formatCurrency(item.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function uniqueClasses(expenses: Expense[]): Expense['class'][] {
  const seen = new Set<Expense['class']>();
  expenses.forEach((e) => seen.add(e.class));
  return [...seen];
}
