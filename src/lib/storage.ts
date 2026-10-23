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
