import type { Expense, ExpenseClass, Income, RuleWeights } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_RULE_WEIGHTS } from '../types';

const EXPENSES_KEY = 'spesapp.expenses.v1';
const INCOMES_KEY = 'spesapp.incomes.v1';
const SALARY_KEY = 'spesapp.salary.v1';
const RULE_WEIGHTS_KEY = 'spesapp.ruleweights.v1';
const CATEGORIES_KEY = 'spesapp.categories.v1';

export type CategoriesMap = Record<ExpenseClass, string[]>;

export function loadExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(EXPENSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidExpense);
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  } catch {
    /* storage full or unavailable — silently ignore */
  }
}

export function loadIncomes(): Income[] {
  try {
    const raw = localStorage.getItem(INCOMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidIncome);
  } catch {
    return [];
  }
}

export function saveIncomes(incomes: Income[]): void {
  try {
    localStorage.setItem(INCOMES_KEY, JSON.stringify(incomes));
  } catch {
    /* ignore */
  }
}

export function loadSalary(): number {
  try {
    const raw = localStorage.getItem(SALARY_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return isNaN(n) ? 0 : n;
  } catch {
    return 0;
  }
}

export function saveSalary(amount: number): void {
  try {
    localStorage.setItem(SALARY_KEY, String(amount));
  } catch {
    /* ignore */
  }
}

export function loadRuleWeights(): RuleWeights {
  try {
    const raw = localStorage.getItem(RULE_WEIGHTS_KEY);
    if (!raw) return { ...DEFAULT_RULE_WEIGHTS };
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.needs === 'number' &&
      typeof parsed.wants === 'number' &&
      typeof parsed.savings === 'number'
    ) {
      return { needs: parsed.needs, wants: parsed.wants, savings: parsed.savings };
    }
    return { ...DEFAULT_RULE_WEIGHTS };
  } catch {
    return { ...DEFAULT_RULE_WEIGHTS };
  }
}

export function saveRuleWeights(weights: RuleWeights): void {
  try {
    localStorage.setItem(RULE_WEIGHTS_KEY, JSON.stringify(weights));
  } catch {
    /* ignore */
  }
}

export function loadCategories(): CategoriesMap {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return structuredClone(DEFAULT_CATEGORIES);
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const result = structuredClone(DEFAULT_CATEGORIES);
      (Object.keys(DEFAULT_CATEGORIES) as ExpenseClass[]).forEach((cls) => {
        if (Array.isArray(parsed[cls]) && parsed[cls].every((s: unknown) => typeof s === 'string')) {
          result[cls] = parsed[cls] as string[];
        }
      });
      return result;
    }
    return structuredClone(DEFAULT_CATEGORIES);
  } catch {
    return structuredClone(DEFAULT_CATEGORIES);
  }
}

export function saveCategories(cats: CategoriesMap): void {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
  } catch {
    /* ignore */
  }
}

function isValidExpense(v: unknown): v is Expense {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.date === 'string' &&
    typeof e.amount === 'number' &&
    typeof e.class === 'string' &&
    typeof e.category === 'string'
  );
}

function isValidIncome(v: unknown): v is Income {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.date === 'string' &&
    typeof e.name === 'string' &&
    typeof e.amount === 'number'
  );
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// --- Backup & Restore --------------------------------------------------------
export interface AppBackup {
  version: number;
  exportDate: string;
  expenses: Expense[];
  incomes: Income[];
  salary: number;
  ruleWeights: RuleWeights;
  categories: CategoriesMap;
}

export function exportAllData(): AppBackup {
  return {
    version: 1,
    exportDate: new Date().toISOString(),
    expenses: loadExpenses(),
    incomes: loadIncomes(),
    salary: loadSalary(),
    ruleWeights: loadRuleWeights(),
    categories: loadCategories(),
  };
}

export function importAllData(backup: unknown): { success: boolean; message: string } {
  try {
    if (!backup || typeof backup !== 'object') {
      return { success: false, message: 'File di backup non valido o danneggiato.' };
    }
    const b = backup as Record<string, unknown>;

    let count = 0;
    if (Array.isArray(b.expenses)) {
      const valid = b.expenses.filter(isValidExpense);
      saveExpenses(valid);
      count = valid.length;
    }

    if (Array.isArray(b.incomes)) {
      const validIncomes = b.incomes.filter(isValidIncome);
      saveIncomes(validIncomes);
    }

    if (typeof b.salary === 'number' && !isNaN(b.salary) && b.salary >= 0) {
      saveSalary(b.salary);
    }

    if (
      b.ruleWeights &&
      typeof b.ruleWeights === 'object' &&
      typeof (b.ruleWeights as Record<string, unknown>).needs === 'number'
    ) {
      saveRuleWeights(b.ruleWeights as RuleWeights);
    }

    if (b.categories && typeof b.categories === 'object') {
      saveCategories(b.categories as CategoriesMap);
    }

    return {
      success: true,
      message: `Backup ripristinato con successo (${count} spese caricate).`,
    };
  } catch {
    return {
      success: false,
      message: 'Errore durante la lettura o il salvataggio dei dati.',
    };
  }
}

export function downloadJsonBackup(): void {
  const data = exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const today = new Date().toISOString().slice(0, 10);
  link.download = `spesapp-backup-${today}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
