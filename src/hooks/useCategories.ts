import { useCallback, useEffect, useState } from 'react';
import type { ExpenseClass } from '../types';
import { loadCategories, saveCategories, type CategoriesMap } from '../lib/storage';

export function useCategories() {
  const [categories, setCategories] = useState<CategoriesMap>(() => loadCategories());

  useEffect(() => {
    setCategories(loadCategories());
  }, []);

  const persist = useCallback((next: CategoriesMap) => {
    setCategories(next);
    saveCategories(next);
  }, []);

  const addCategory = useCallback(
    (cls: ExpenseClass, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const current = categories[cls] ?? [];
      if (current.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return;
      persist({ ...categories, [cls]: [...current, trimmed] });
    },
    [categories, persist],
  );

  const deleteCategory = useCallback(
    (cls: ExpenseClass, name: string) => {
      const current = categories[cls] ?? [];
      persist({ ...categories, [cls]: current.filter((c) => c !== name) });
    },
    [categories, persist],
  );

  return { categories, addCategory, deleteCategory };
}
