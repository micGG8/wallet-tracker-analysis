import { useState } from 'react';
import { Plus, Trash2, X, Check, Repeat, AlertCircle } from 'lucide-react';
import type { ExpenseClass, RecurringExpense } from '../types';
import { CLASS_COLORS, CLASS_META } from '../types';
import { formatCurrency } from '../lib/format';

interface ManageRecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurring: RecurringExpense[];
  categories: Record<ExpenseClass, string[]>;
  onAddRecurring: (item: Omit<RecurringExpense, 'id' | 'appliedInMonths' | 'createdAt'>) => Promise<void>;
  onDeleteRecurring: (id: string) => Promise<void>;
}

export function ManageRecurringModal({
  isOpen,
  onClose,
  recurring,
  categories,
  onAddRecurring,
  onDeleteRecurring,
}: ManageRecurringModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseClass, setExpenseClass] = useState<ExpenseClass>('Non discrezionali');
  const [category, setCategory] = useState<string>(() => {
    return categories['Non discrezionali']?.[0] || 'affitto';
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const currentClassCategories = categories[expenseClass] || [];

  function handleClassChange(newClass: ExpenseClass) {
    setExpenseClass(newClass);
    const nextCats = categories[newClass] || [];
    setCategory(nextCats[0] || '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const val = parseFloat(amount.replace(',', '.'));
    if (!name.trim()) {
      setError('Inserisci un nome per la spesa fissa.');
      return;
    }
    if (isNaN(val) || val <= 0) {
      setError('Inserisci un importo valido.');
      return;
    }

    try {
      setSaving(true);
      await onAddRecurring({
        name: name.trim(),
        amount: Number(val.toFixed(2)),
        class: expenseClass,
        category: category || 'varie',
      });
      setName('');
      setAmount('');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Repeat size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Gestione Spese Fisse
              </h2>
              <p className="text-xs text-slate-500">
                Crea o modifica i modelli ricorrenti mensili
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          {/* New template form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Plus size={14} className="text-brand-600" /> Nuovo modello di spesa
            </h3>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">
                Nome (es. Fondo di accumulo, Affitto, Palestra)
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Fondo PAC, Mutuo, Bolletta luce"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Importo (€)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Classe
                </label>
                <select
                  value={expenseClass}
                  onChange={(e) => handleClassChange(e.target.value as ExpenseClass)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-200"
                >
                  {CLASS_META.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">
                Sottocategoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-200"
              >
                {currentClassCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2 rounded-xl">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50 transition"
            >
              <Plus size={15} /> Aggiungi Modello
            </button>
          </form>

          {/* List of existing templates */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Modelli salvati ({recurring.length})
            </h3>

            {recurring.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">
                Nessun modello di spesa fissa configurato.
              </p>
            ) : (
              <ul className="space-y-2">
                {recurring.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-2xl border border-slate-100 bg-white shadow-sm hover:border-slate-200 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: CLASS_COLORS[item.class] }}
                        />
                        <p className="font-semibold text-xs text-slate-900 truncate">
                          {item.name}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 capitalize">
                        {item.category} · {item.class}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {formatCurrency(item.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteRecurring(item.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Elimina modello"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-slate-900 py-3 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 active:scale-[0.98] transition"
          >
            <Check size={16} /> Fatto
          </button>
        </div>
      </div>
    </div>
  );
}
