import { useCallback, useEffect, useState } from 'react';
import type { ExpenseClass } from '../types';
import {
  loadCategories,
  saveCategories,
  type CategoriesMap,
} from '../lib/storage';
import {
  subscribeUserSettings,
  updateCategoriesFirestore,
} from '../lib/firestore';

export function useCategories(uid?: string) {
  const [categories, setCategories] = useState<CategoriesMap>(() =>
    loadCategories(),
  );

  useEffect(() => {
    if (uid) {
      const unsubscribe = subscribeUserSettings(uid, (settings) => {
        if (settings.categories) {
          setCategories(settings.categories);
          saveCategories(settings.categories);
        }
      });
      return unsubscribe;
    } else {
      setCategories(loadCategories());
    }
  }, [uid]);

  const addCategory = useCallback(
    async (cls: ExpenseClass, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const current = categories[cls] ?? [];
      if (current.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return;

      const next = { ...categories, [cls]: [...current, trimmed] };
      setCategories(next);
      saveCategories(next);

      if (uid) {
        await updateCategoriesFirestore(uid, next);
      }
    },
    [categories, uid],
  );

  const deleteCategory = useCallback(
    async (cls: ExpenseClass, name: string) => {
      const current = categories[cls] ?? [];
      const next = { ...categories, [cls]: current.filter((c) => c !== name) };
      setCategories(next);
      saveCategories(next);

      if (uid) {
        await updateCategoriesFirestore(uid, next);
      }
    },
    [categories, uid],
  );

  return { categories, addCategory, deleteCategory };
}
