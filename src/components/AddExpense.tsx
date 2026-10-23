import { useMemo, useState } from 'react';
import { Check, Plus, Trash2, Wallet, X } from 'lucide-react';
import {
  CLASS_META,
  type ExpenseClass,
  iconForCategory,
  classColor,
} from '../types';
import { todayISO } from '../lib/format';
import type { NewExpenseInput } from '../hooks/useExpenses';
import { Icon } from './Icon';

interface AddExpenseProps {
  onAdd: (input: NewExpenseInput) => void;
  categories: Record<ExpenseClass, string[]>;
  onAddCategory: (cls: ExpenseClass, name: string) => void;
  onDeleteCategory: (cls: ExpenseClass, name: string) => void;
}

export function AddExpense({
  onAdd,
  categories,
  onAddCategory,
  onDeleteCategory,
}: AddExpenseProps) {
  const [date, setDate] = useState<string>(() => todayISO());
  const [amount, setAmount] = useState<string>('');
  const [expenseClass, setExpenseClass] = useState<ExpenseClass>('Non discrezionali');
  const [category, setCategory] = useState<string>('affitto');
  const [justAdded, setJustAdded] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const currentCategories = useMemo(
    () => categories[expenseClass] ?? [],
    [categories, expenseClass],
  );

  function handleClassChange(value: ExpenseClass) {
    setExpenseClass(value);
    const nextCats = categories[value] ?? [];
    if (!nextCats.includes(category)) {
      setCategory(nextCats[0] ?? '');
    }
  }

  function handleDeleteCategory() {
    if (!category || currentCategories.length <= 1) return;
    const toDelete = category;
    const remaining = currentCategories.filter((c) => c !== toDelete);
    onDeleteCategory(expenseClass, toDelete);
    setCategory(remaining[0] ?? '');
  }

  function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    onAddCategory(expenseClass, name);
    setCategory(name);
    setNewCategoryName('');
    setAddingCategory(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(value) || value <= 0) return;

    onAdd({ date, amount: value, class: expenseClass, category });
    setAmount('');
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <div className="animate-fade-in space-y-5 px-4 pb-6 pt-3">
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
          <Wallet size={22} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inserisci Spesa</h1>
          <p className="text-sm text-slate-500">Registra una nuova spesa</p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl bg-white p-5 shadow-card"
      >
        <Field label="Data">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="form-input"
          />
        </Field>

        <Field label="Importo (€)">
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="form-input pr-10 text-lg font-semibold"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              €
            </span>
          </div>
        </Field>

        <Field label="Classe di spesa">
          <div className="relative">
            <select
              value={expenseClass}
              onChange={(e) => handleClassChange(e.target.value as ExpenseClass)}
              className="form-input appearance-none pr-9"
            >
              {CLASS_META.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <Chevron />
          </div>
        </Field>

        <Field label="Sottocategoria">
          <div className="flex items-stretch gap-2">
            <div className="relative flex-1">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-input appearance-none pr-9"
              >
                {currentCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Chevron />
            </div>
            <button
              type="button"
              onClick={() => setAddingCategory((v) => !v)}
              aria-label="Aggiungi sottocategoria"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-brand-600 transition-colors hover:bg-brand-50 active:scale-95"
            >
              <Plus size={18} />
            </button>
            <button
              type="button"
              onClick={handleDeleteCategory}
              disabled={currentCategories.length <= 1}
              aria-label="Elimina sottocategoria"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {addingCategory && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Nome nuova sottocategoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                autoFocus
                className="form-input flex-1"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-700 active:scale-95"
                aria-label="Conferma aggiunta"
              >
                <Check size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingCategory(false);
                  setNewCategoryName('');
                }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 active:scale-95"
                aria-label="Annulla aggiunta"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {category && (
            <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <Icon
                name={iconForCategory(category, expenseClass)}
                size={16}
                style={{ color: classColor(expenseClass) }}
              />
              <span className="capitalize">{category}</span>
            </div>
          )}
        </Field>

        <button
          type="submit"
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-semibold text-white shadow-sm transition-all duration-200 active:scale-[0.98] ${
            justAdded
              ? 'bg-emerald-600'
              : 'bg-brand-600 hover:bg-brand-700'
          }`}
        >
          {justAdded ? (
            <>
              <Check size={22} /> Spesa aggiunta
            </>
          ) : (
            <>
              <Plus size={22} /> Aggiungi Spesa
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Chevron() {
  return (
    <svg
      className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}
