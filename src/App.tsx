import { useState } from 'react';
import { BottomNav, type View } from './components/BottomNav';
import { AddExpense } from './components/AddExpense';
import { AddIncome } from './components/AddIncome';
import { OutlookExpenses } from './components/OutlookExpenses';
import { Analysis } from './components/Analysis';
import { useExpenses } from './hooks/useExpenses';
import { useIncomes } from './hooks/useIncomes';
import { useSalary } from './hooks/useSalary';
import { useRuleWeights } from './hooks/useRuleWeights';
import { useCategories } from './hooks/useCategories';


function App() {
  const [view, setView] = useState<View>('add');
  const { expenses, addExpense, deleteExpense } = useExpenses();
 const { incomes, addIncome } = useIncomes();
  const { salary, update: updateSalary } = useSalary();
  const { weights, update: updateWeights } = useRuleWeights();
  const { categories, addCategory, deleteCategory } = useCategories();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-50">
        <main className="flex-1 pb-40">
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
      </div>
    </div>
  );
}

export default App;
