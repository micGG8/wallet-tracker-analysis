import { useCallback, useEffect, useState } from 'react';
import type { Income } from '../types';
import { createId, loadIncomes, saveIncomes } from '../lib/storage';

export interface NewIncomeInput {
  date: string;
  name: string;
  amount: number;
}

export function useIncomes() {
  const [incomes, setIncomes] = useState<Income[]>([]);

  useEffect(() => {
    setIncomes(loadIncomes());
  }, []);

  const persist = useCallback((next: Income[]) => {
    setIncomes(next);
    saveIncomes(next);
  }, []);

  const addIncome = useCallback(
    (input: NewIncomeInput): Income => {
      const income: Income = { id: createId(), ...input };
      persist([income, ...incomes]);
      return income;
    },
    [incomes, persist],
  );

  return { incomes, addIncome };
}
