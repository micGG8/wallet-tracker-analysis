import { useCallback, useEffect, useState } from 'react';
import type { Income } from '../types';
import { createId, loadIncomes, saveIncomes } from '../lib/storage';
import {
  subscribeIncomes,
  addIncomeFirestore,
  deleteIncomeFirestore,
} from '../lib/firestore';

export interface NewIncomeInput {
  date: string;
  name: string;
  amount: number;
}

export function useIncomes(uid?: string) {
  const [incomes, setIncomes] = useState<Income[]>(() => loadIncomes());

  useEffect(() => {
    if (uid) {
      const unsubscribe = subscribeIncomes(uid, (firestoreIncomes) => {
        setIncomes(firestoreIncomes);
        saveIncomes(firestoreIncomes);
      });
      return unsubscribe;
    } else {
      setIncomes(loadIncomes());
    }
  }, [uid]);

  const addIncome = useCallback(
    async (input: NewIncomeInput): Promise<Income> => {
      const income: Income = { id: createId(), ...input };

      if (uid) {
        setIncomes((prev) => [income, ...prev]);
        saveIncomes([income, ...incomes]);
        await addIncomeFirestore(uid, income);
      } else {
        const next = [income, ...incomes];
        setIncomes(next);
        saveIncomes(next);
      }

      return income;
    },
    [incomes, uid],
  );

  const deleteIncome = useCallback(
    async (id: string) => {
      const next = incomes.filter((inc) => inc.id !== id);
      setIncomes(next);
      saveIncomes(next);

      if (uid) {
        await deleteIncomeFirestore(uid, id);
      }
    },
    [incomes, uid],
  );

  return { incomes, addIncome, deleteIncome };
}
