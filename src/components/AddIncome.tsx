import { useState } from 'react';
import { Check, ArrowDownCircle, Plus } from 'lucide-react';
import { todayISO } from '../lib/format';
import type { NewIncomeInput } from '../hooks/useIncomes';

interface AddIncomeProps {
  onAdd: (input: NewIncomeInput) => void;
}

export function AddIncome({ onAdd }: AddIncomeProps) {
  const [date, setDate] = useState<string>(() => todayISO());
  const [name, setName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [justAdded, setJustAdded] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount.replace(',', '.'));
    if (!name.trim() || !amount || isNaN(value) || value <= 0) return;

    onAdd({ date, name: name.trim(), amount: value });
    setName('');
    setAmount('');
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <section className="animate-fade-in rounded-3xl bg-white p-5 shadow-card">
      <header className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
          <ArrowDownCircle size={20} />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900">Inserisci Entrata</h2>
          <p className="text-xs text-slate-500">Registra una nuova entrata</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="block text-sm font-semibold text-slate-700">Data</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="form-input"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="block text-sm font-semibold text-slate-700">Nome</span>
          <input
            type="text"
            placeholder="es. Stipendio, Bonus, Rimborso"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="form-input"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="block text-sm font-semibold text-slate-700">Importo (€)</span>
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
        </label>

        <button
          type="submit"
          className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-semibold text-white shadow-sm transition-all duration-200 active:scale-[0.98] ${
            justAdded
              ? 'bg-emerald-600'
              : 'bg-brand-600 hover:bg-brand-700'
          }`}
        >
          {justAdded ? (
            <>
              <Check size={22} /> Entrata aggiunta
            </>
          ) : (
            <>
              <Plus size={22} /> Inserisci Entrata
            </>
          )}
        </button>
      </form>
    </section>
  );
}
