import { useCallback, useEffect, useState } from 'react';
import { loadSalary, saveSalary } from '../lib/storage';
import { subscribeUserSettings, updateSalaryFirestore } from '../lib/firestore';

export function useSalary(uid?: string) {
  const [salary, setSalary] = useState<number>(() => loadSalary());

  useEffect(() => {
    if (uid) {
      const unsubscribe = subscribeUserSettings(uid, (settings) => {
        if (typeof settings.salary === 'number') {
          setSalary(settings.salary);
          saveSalary(settings.salary);
        }
      });
      return unsubscribe;
    } else {
      setSalary(loadSalary());
    }
  }, [uid]);

  const update = useCallback(
    async (amount: number) => {
      const value = isNaN(amount) || amount < 0 ? 0 : amount;
      setSalary(value);
      saveSalary(value);

      if (uid) {
        await updateSalaryFirestore(uid, value);
      }
    },
    [uid],
  );

  return { salary, update };
}
