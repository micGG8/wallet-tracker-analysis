import { useState } from 'react';
import {
  CheckSquare,
  Square,
  Repeat,
  SlidersHorizontal,
  Plus,
  Loader2,
  Check,
} from 'lucide-react';
import type { RecurringExpense, ExpenseClass, Expense } from '../types';
import { CLASS_COLORS } from '../types';
import { formatCurrency, todayISO } from '../lib/format';
import type { NewExpenseInput } from '../hooks/useExpenses';
import { ManageRecurringModal } from './ManageRecurringModal';

interface RecurringExpensesCardProps {
  recurring: RecurringExpense[];
  categories: Record<ExpenseClass, string[]>;
  onAddRecurring: (
    item: Omit<RecurringExpense, 'id' | 'appliedInMonths' | 'createdAt'>,
  ) => Promise<void>;
  onDeleteRecurring: (id: string) => Promise<void>;
  onMarkApplied: (
    templateId: string,
    monthKey: string,
    expenseId: string,
  ) => Promise<void>;
  onAddExpense: (input: NewExpenseInput) => Promise<Expense>;
}

export function RecurringExpensesCard({
  recurring,
  categories,
  onAddRecurring,
  onDeleteRecurring,
  onMarkApplied,
  onAddExpense,
}: RecurringExpensesCardProps) {
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const currentMonthKey = todayISO().slice(0, 7); // e.g. "2026-10"

  const now = new Date();
  const currentMonthName = now.toLocaleDateString('it-IT', {
    month: 'long',
  });

  const appliedCount = recurring.filter(
    (r) => Boolean(r.appliedInMonths?.[currentMonthKey]),
  ).length;

  async function handleToggleCheck(item: RecurringExpense) {
    const isAlreadyApplied = Boolean(item.appliedInMonths?.[currentMonthKey]);
    if (isAlreadyApplied) {
      // Already registered for this month to prevent duplicate entries
      return;
    }

    try {
      setProcessingId(item.id);

      // 1. Create the actual expense transaction on Firestore
      const createdExpense = await onAddExpense({
        date: todayISO(),
        amount: item.amount,
        class: item.class,
        category: item.category,
      });

      // 2. Mark this recurring template as registered for this month
      await onMarkApplied(item.id, currentMonthKey, createdExpense.id);
    } catch (err: unknown) {
      alert(`Errore durante la registrazione: ${(err as Error).message}`);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <>
      <section className="animate-fade-in rounded-3xl bg-white p-5 shadow-card space-y-3.5 mx-4 mt-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm">
              <Repeat size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Spese Fisse Mensili
                </h2>
                {recurring.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {appliedCount}/{recurring.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 capitalize">
                Checklist di {currentMonthName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsManageOpen(true)}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-95"
            title="Gestisci modelli"
          >
            <SlidersHorizontal size={13} /> Modelli
          </button>
        </div>

        {/* Content list */}
        {recurring.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center space-y-2">
            <p className="text-xs text-slate-500">
              Nessuna spesa fissa configurata (es. Fondo di accumulo PAC,
              affitto, abbonamenti).
            </p>
            <button
              type="button"
              onClick={() => setIsManageOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 active:scale-95 transition"
            >
              <Plus size={14} /> Configura Spese Fisse
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recurring.map((item) => {
              const isApplied = Boolean(item.appliedInMonths?.[currentMonthKey]);
              const isProcessing = processingId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => !isApplied && !isProcessing && handleToggleCheck(item)}
                  className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition ${
                    isApplied
                      ? 'border-emerald-100 bg-emerald-50/40 text-slate-400 cursor-default'
                      : 'border-slate-100 bg-slate-50/70 hover:border-brand-200 hover:bg-brand-50/20 cursor-pointer active:scale-[0.99]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Checkbox button */}
                    <button
                      type="button"
                      disabled={isApplied || isProcessing}
                      aria-label={`Spunta spesa ${item.name}`}
                      className="shrink-0 text-slate-400 hover:text-brand-600 disabled:cursor-default"
                    >
                      {isProcessing ? (
                        <Loader2 size={19} className="animate-spin text-brand-600" />
                      ) : isApplied ? (
                        <CheckSquare size={19} className="text-emerald-600" />
                      ) : (
                        <Square size={19} />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isApplied ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: CLASS_COLORS[item.class] }}
                        />
                        <span className="capitalize">{item.category}</span>
                        <span>·</span>
                        <span>{item.class}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-bold ${
                        isApplied ? 'text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {formatCurrency(item.amount)}
                    </span>
                    {isApplied && (
                      <span className="flex items-center gap-0.5 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                        <Check size={10} /> Registrata
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal to create and delete templates */}
      <ManageRecurringModal
        isOpen={isManageOpen}
        onClose={() => setIsManageOpen(false)}
        recurring={recurring}
        categories={categories}
        onAddRecurring={onAddRecurring}
        onDeleteRecurring={onDeleteRecurring}
      />
    </>
  );
}
