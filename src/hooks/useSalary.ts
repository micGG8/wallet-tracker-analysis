import { useCallback, useEffect, useState } from 'react';
import { loadSalary, saveSalary } from '../lib/storage';

export function useSalary() {
  const [salary, setSalary] = useState<number>(0);

  useEffect(() => {
    setSalary(loadSalary());
  }, []);

  const update = useCallback((amount: number) => {
    const value = isNaN(amount) || amount < 0 ? 0 : amount;
    setSalary(value);
    saveSalary(value);
  }, []);

  return { salary, update };
}
