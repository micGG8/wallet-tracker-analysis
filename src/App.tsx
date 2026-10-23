import { useState } from 'react';
import { Cloud, CloudOff, LogIn, LogOut } from 'lucide-react';
import { BottomNav, type View } from './components/BottomNav';
import { AddExpense } from './components/AddExpense';
import { AddIncome } from './components/AddIncome';
import { OutlookExpenses } from './components/OutlookExpenses';
import { Analysis } from './components/Analysis';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './contexts/AuthContext';
import { useExpenses } from './hooks/useExpenses';
import { useIncomes } from './hooks/useIncomes';
import { useSalary } from './hooks/useSalary';
import { useRuleWeights } from './hooks/useRuleWeights';
import { useCategories } from './hooks/useCategories';

function App() {
  const [view, setView] = useState<View>('add');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user, isConfigured, logout } = useAuth();

  const { expenses, addExpense, deleteExpense } = useExpenses(user?.uid);
  const { incomes, addIncome } = useIncomes(user?.uid);
  const { salary, update: updateSalary } = useSalary(user?.uid);
  const { weights, update: updateWeights } = useRuleWeights(user?.uid);
  const { categories, addCategory, deleteCategory } = useCategories(user?.uid);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-50">
        {/* Top Header / Auth Status Bar */}
        <header className="flex items-center justify-between border-b border-slate-200/60 bg-white/80 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-slate-800">
              SpesApp
            </span>
            {isConfigured ? (
              user ? (
                <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <Cloud size={12} /> Cloud Sincronizzato
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  <CloudOff size={12} /> Solo Locale
                </span>
              )
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                Memoria Locale
              </span>
            )}
          </div>

          <div>
            {user ? (
              <div className="flex items-center gap-1.5">
                <span className="max-w-[120px] truncate text-xs font-medium text-slate-600">
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  title="Disconnetti"
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : isConfigured ? (
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1 rounded-xl bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-600 transition hover:bg-brand-100 active:scale-95"
              >
                <LogIn size={14} /> Accedi
              </button>
            ) : null}
          </div>
        </header>

        {/* Sync Prompt Banner if Firebase configured but user not logged in */}
        {isConfigured && !user && (
          <div className="mx-4 mt-3 flex items-center justify-between gap-2 rounded-2xl border border-brand-200 bg-brand-50/80 p-3 text-xs text-brand-900 shadow-sm">
            <div className="space-y-0.5">
              <p className="font-semibold">Abilita sincronizzazione Cloud</p>
              <p className="text-[11px] text-brand-700">
                Accedi per salvare le tue spese in tempo reale su Firestore.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="shrink-0 rounded-xl bg-brand-600 px-3 py-1.5 font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-95"
            >
              Accedi
            </button>
          </div>
        )}

        <main className="flex-1 pb-24">
          {view === 'add' && (
            <div className="space-y-5">
              <AddExpense
                onAdd={addExpense}
                categories={categories}
                onAddCategory={addCategory}
                onDeleteCategory={deleteCategory}
              />
              <AddIncome onAdd={addIncome} />
            </div>
          )}
          {view === 'outlook' && (
            <OutlookExpenses expenses={expenses} onDelete={deleteExpense} />
          )}
          {view === 'analysis' && (
            <Analysis
              expenses={expenses}
              incomes={incomes}
              salary={salary}
              weights={weights}
              onUpdateSalary={updateSalary}
              onUpdateWeights={updateWeights}
            />
          )}
        </main>

        <BottomNav view={view} onChange={setView} />

        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </div>
    </div>
  );
}

export default App;
