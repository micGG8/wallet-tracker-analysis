import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Expense, Income, RuleWeights } from '../types';
import type { CategoriesMap, AppBackup } from './storage';

// --- Expenses ----------------------------------------------------------------
export function subscribeExpenses(
  uid: string,
  onData: (expenses: Expense[]) => void,
) {
  if (!db) return () => {};
  const collRef = collection(db, 'users', uid, 'expenses');
  const q = query(collRef, orderBy('date', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Expense[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Expense, 'id'>),
      }));
      onData(list);
    },
    (err) => {
      console.error('Errore listener spese Firestore:', err);
    },
  );
}

export async function addExpenseFirestore(uid: string, expense: Expense) {
  if (!db) return;
  const docRef = doc(db, 'users', uid, 'expenses', expense.id);
  await setDoc(docRef, {
    date: expense.date,
    amount: expense.amount,
    class: expense.class,
    category: expense.category,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteExpenseFirestore(uid: string, id: string) {
  if (!db) return;
  const docRef = doc(db, 'users', uid, 'expenses', id);
  await deleteDoc(docRef);
}

// --- Incomes -----------------------------------------------------------------
export function subscribeIncomes(
  uid: string,
  onData: (incomes: Income[]) => void,
) {
  if (!db) return () => {};
  const collRef = collection(db, 'users', uid, 'incomes');
  const q = query(collRef, orderBy('date', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Income[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Income, 'id'>),
      }));
      onData(list);
    },
    (err) => {
      console.error('Errore listener entrate Firestore:', err);
    },
  );
}

export async function addIncomeFirestore(uid: string, income: Income) {
  if (!db) return;
  const docRef = doc(db, 'users', uid, 'incomes', income.id);
  await setDoc(docRef, {
    date: income.date,
    name: income.name,
    amount: income.amount,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteIncomeFirestore(uid: string, id: string) {
  if (!db) return;
  const docRef = doc(db, 'users', uid, 'incomes', id);
  await deleteDoc(docRef);
}

// --- User Settings (Salary, RuleWeights, Categories) ------------------------
export interface UserSettingsDoc {
  salary?: number;
  ruleWeights?: RuleWeights;
  categories?: CategoriesMap;
}

export function subscribeUserSettings(
  uid: string,
  onData: (settings: UserSettingsDoc) => void,
) {
  if (!db) return () => {};
  const docRef = doc(db, 'users', uid, 'settings', 'profile');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as UserSettingsDoc);
      }
    },
    (err) => {
      console.error('Errore listener impostazioni Firestore:', err);
    },
  );
}

export async function updateSalaryFirestore(uid: string, salary: number) {
  if (!db) return;
  const docRef = doc(db, 'users', uid, 'settings', 'profile');
  await setDoc(docRef, { salary, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function updateRuleWeightsFirestore(
  uid: string,
  ruleWeights: RuleWeights,
) {
  if (!db) return;
  const docRef = doc(db, 'users', uid, 'settings', 'profile');
  await setDoc(
    docRef,
    { ruleWeights, updatedAt: new Date().toISOString() },
    { merge: true },
  );
}

export async function updateCategoriesFirestore(
  uid: string,
  categories: CategoriesMap,
) {
  if (!db) return;
  const docRef = doc(db, 'users', uid, 'settings', 'profile');
  await setDoc(
    docRef,
    { categories, updatedAt: new Date().toISOString() },
    { merge: true },
  );
}

// --- Batch Import from Backup to Firestore -----------------------------------
export async function batchImportToFirestore(
  uid: string,
  backup: AppBackup,
): Promise<{ count: number }> {
  if (!db) throw new Error('Database Firebase non inizializzato.');

  // 1. Save Settings
  const settingsRef = doc(db, 'users', uid, 'settings', 'profile');
  await setDoc(
    settingsRef,
    {
      salary: backup.salary ?? 0,
      ruleWeights: backup.ruleWeights,
      categories: backup.categories,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  // 2. Commit expenses in chunks (Firestore limit 500 per batch)
  let count = 0;
  const expenses = backup.expenses || [];
  const chunkSize = 400;

  for (let i = 0; i < expenses.length; i += chunkSize) {
    const chunk = expenses.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    for (const exp of chunk) {
      const expRef = doc(db, 'users', uid, 'expenses', exp.id);
      batch.set(expRef, {
        date: exp.date,
        amount: exp.amount,
        class: exp.class,
        category: exp.category,
        updatedAt: new Date().toISOString(),
      });
      count++;
    }

    await batch.commit();
  }

  // 3. Commit incomes
  const incomes = backup.incomes || [];
  for (let i = 0; i < incomes.length; i += chunkSize) {
    const chunk = incomes.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    for (const inc of chunk) {
      const incRef = doc(db, 'users', uid, 'incomes', inc.id);
      batch.set(incRef, {
        date: inc.date,
        name: inc.name,
        amount: inc.amount,
        updatedAt: new Date().toISOString(),
      });
    }

    await batch.commit();
  }

  return { count };
}
