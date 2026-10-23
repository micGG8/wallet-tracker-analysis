import { useCallback, useEffect, useState } from 'react';
import type { Expense, ExpenseClass, ExpenseCategory } from '../types';
import { createId, loadExpenses, saveExpenses } from '../lib/storage';
import {
  subscribeExpenses,
  addExpenseFirestore,
  deleteExpenseFirestore,
} from '../lib/firestore';

export interface NewExpenseInput {
  date: string;
  amount: number;
  class: ExpenseClass;
  category: ExpenseCategory;
}

export function useExpenses(uid?: string) {
  const [expenses, setExpenses] = useState<Expense[]>(() => loadExpenses());

  useEffect(() => {
    if (uid) {
      const unsubscribe = subscribeExpenses(uid, (firestoreExpenses) => {
        setExpenses(firestoreExpenses);
        saveExpenses(firestoreExpenses);
      });
      return unsubscribe;
    } else {
      setExpenses(loadExpenses());
    }
  }, [uid]);

  const addExpense = useCallback(
    async (input: NewExpenseInput): Promise<Expense> => {
      const expense: Expense = { id: createId(), ...input };

      if (uid) {
        // Optimistic update
        setExpenses((prev) => [expense, ...prev]);
        saveExpenses([expense, ...expenses]);
        await addExpenseFirestore(uid, expense);
      } else {
        const next = [expense, ...expenses];
        setExpenses(next);
        saveExpenses(next);
      }

      return expense;
    },
    [expenses, uid],
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      const next = expenses.filter((e) => e.id !== id);
      setExpenses(next);
      saveExpenses(next);

      if (uid) {
        await deleteExpenseFirestore(uid, id);
      }
    },
    [expenses, uid],
  );

  return { expenses, addExpense, deleteExpense };
}
