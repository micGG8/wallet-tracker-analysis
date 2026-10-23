import { useCallback, useEffect, useState } from 'react';
import type { Expense, ExpenseClass, ExpenseCategory } from '../types';
import { createId, loadExpenses, saveExpenses } from '../lib/storage';

export interface NewExpenseInput {
  date: string;
  amount: number;
  class: ExpenseClass;
  category: ExpenseCategory;
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    setExpenses(loadExpenses());
  }, []);

  const persist = useCallback((next: Expense[]) => {
    setExpenses(next);
    saveExpenses(next);
  }, []);

  const addExpense = useCallback(
    (input: NewExpenseInput): Expense => {
      const expense: Expense = { id: createId(), ...input };
      persist([expense, ...expenses]);
      return expense;
    },
    [expenses, persist],
  );

  const deleteExpense = useCallback(
    (id: string) => {
      persist(expenses.filter((e) => e.id !== id));
    },
    [expenses, persist],
  );

  return { expenses, addExpense, deleteExpense };
}
