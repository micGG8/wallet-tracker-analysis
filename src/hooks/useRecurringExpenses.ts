import { useCallback, useEffect, useState } from 'react';
import type { RecurringExpense } from '../types';
import {
  createId,
  loadRecurringExpenses,
  saveRecurringExpenses,
} from '../lib/storage';
import {
  subscribeUserSettings,
  updateRecurringExpensesFirestore,
} from '../lib/firestore';

export function useRecurringExpenses(uid?: string) {
  const [recurring, setRecurring] = useState<RecurringExpense[]>(() =>
    loadRecurringExpenses(),
  );

  useEffect(() => {
    if (uid) {
      const unsubscribe = subscribeUserSettings(uid, (settings) => {
        if (settings.recurringExpenses) {
          setRecurring(settings.recurringExpenses);
          saveRecurringExpenses(settings.recurringExpenses);
        }
      });
      return unsubscribe;
    } else {
      setRecurring(loadRecurringExpenses());
    }
  }, [uid]);

  const persist = useCallback(
    async (next: RecurringExpense[]) => {
      setRecurring(next);
      saveRecurringExpenses(next);
      if (uid) {
        await updateRecurringExpensesFirestore(uid, next);
      }
    },
    [uid],
  );

  const addRecurring = useCallback(
    async (
      input: Omit<RecurringExpense, 'id' | 'appliedInMonths' | 'createdAt'>,
    ) => {
      const newItem: RecurringExpense = {
        ...input,
        id: createId(),
        createdAt: new Date().toISOString(),
        appliedInMonths: {},
      };
      await persist([...recurring, newItem]);
    },
    [persist, recurring],
  );

  const updateRecurring = useCallback(
    async (id: string, updates: Partial<RecurringExpense>) => {
      const next = recurring.map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      );
      await persist(next);
    },
    [persist, recurring],
  );

  const deleteRecurring = useCallback(
    async (id: string) => {
      const next = recurring.filter((item) => item.id !== id);
      await persist(next);
    },
    [persist, recurring],
  );

  const markApplied = useCallback(
    async (templateId: string, monthKey: string, expenseId: string) => {
      const next = recurring.map((item) => {
        if (item.id !== templateId) return item;
        const currentMonths = item.appliedInMonths || {};
        return {
          ...item,
          appliedInMonths: { ...currentMonths, [monthKey]: expenseId },
        };
      });
      await persist(next);
    },
    [persist, recurring],
  );

  return {
    recurring,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    markApplied,
  };
}
