import type { Expense, ExpenseClass, Income, RecurringExpense, RuleWeights } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_RULE_WEIGHTS } from '../types';

const EXPENSES_KEY = 'spesapp.expenses.v1';
const INCOMES_KEY = 'spesapp.incomes.v1';
const SALARY_KEY = 'spesapp.salary.v1';
const RULE_WEIGHTS_KEY = 'spesapp.ruleweights.v1';
const CATEGORIES_KEY = 'spesapp.categories.v1';
const MONTH_NOTES_KEY = 'spesapp.monthnotes.v1';
const RECURRING_KEY = 'spesapp.recurring.v1';

export type CategoriesMap = Record<ExpenseClass, string[]>;
export type MonthNotesMap = Record<string, string>; // monthKey (YYYY-MM) -> noteText

export function loadRecurringExpenses(): RecurringExpense[] {
  try {
    const raw = localStorage.getItem(RECURRING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidRecurringExpense);
  } catch {
    return [];
  }
}

export function saveRecurringExpenses(items: RecurringExpense[]): void {
  try {
    localStorage.setItem(RECURRING_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

export function loadMonthNotes(): MonthNotesMap {
  try {
    const raw = localStorage.getItem(MONTH_NOTES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as MonthNotesMap;
    }
    return {};
  } catch {
    return {};
  }
}

export function saveMonthNotes(notes: MonthNotesMap): void {
  try {
    localStorage.setItem(MONTH_NOTES_KEY, JSON.stringify(notes));
  } catch {
    /* ignore */
  }
}

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

function isValidRecurringExpense(v: unknown): v is RecurringExpense {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.name === 'string' &&
    typeof e.amount === 'number' &&
    typeof e.class === 'string' &&
    typeof e.category === 'string'
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
  monthNotes?: MonthNotesMap;
  recurringExpenses?: RecurringExpense[];
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
    monthNotes: loadMonthNotes(),
    recurringExpenses: loadRecurringExpenses(),
  };
}

export function importAllData(backup: unknown): { success: boolean; message: string } {
  try {
    if (!backup || typeof backup !== 'object') {
      return { success: false, message: 'File di backup non valido o danneggiato.' };
    }

    // Support direct array of expenses
    if (Array.isArray(backup)) {
      const valid = backup.filter(isValidExpense);
      if (valid.length > 0) {
        saveExpenses(valid);
        return {
          success: true,
          message: `Ripristinato elenco con ${valid.length} spese.`,
        };
      }
      return { success: false, message: 'Nessuna spesa valida trovata nei dati forniti.' };
    }

    const b = backup as Record<string, unknown>;

    // Handle both direct keys and raw 'spesapp.*' localStorage dump keys
    let rawExpenses = b.expenses ?? b['spesapp.expenses.v1'];
    if (typeof rawExpenses === 'string') {
      try {
        rawExpenses = JSON.parse(rawExpenses);
      } catch {
        /* ignore */
      }
    }

    let rawIncomes = b.incomes ?? b['spesapp.incomes.v1'];
    if (typeof rawIncomes === 'string') {
      try {
        rawIncomes = JSON.parse(rawIncomes);
      } catch {
        /* ignore */
      }
    }

    let rawSalary = b.salary ?? b['spesapp.salary.v1'];
    if (typeof rawSalary === 'string') {
      rawSalary = Number(rawSalary);
    }

    let rawWeights = b.ruleWeights ?? b['spesapp.ruleweights.v1'];
    if (typeof rawWeights === 'string') {
      try {
        rawWeights = JSON.parse(rawWeights);
      } catch {
        /* ignore */
      }
    }

    let rawCategories = b.categories ?? b['spesapp.categories.v1'];
    if (typeof rawCategories === 'string') {
      try {
        rawCategories = JSON.parse(rawCategories);
      } catch {
        /* ignore */
      }
    }

    let count = 0;
    if (Array.isArray(rawExpenses)) {
      const valid = rawExpenses.filter(isValidExpense);
      saveExpenses(valid);
      count = valid.length;
    }

    if (Array.isArray(rawIncomes)) {
      const validIncomes = rawIncomes.filter(isValidIncome);
      saveIncomes(validIncomes);
    }

    if (typeof rawSalary === 'number' && !isNaN(rawSalary) && rawSalary >= 0) {
      saveSalary(rawSalary);
    }

    if (
      rawWeights &&
      typeof rawWeights === 'object' &&
      typeof (rawWeights as Record<string, unknown>).needs === 'number'
    ) {
      saveRuleWeights(rawWeights as RuleWeights);
    }

    if (rawCategories && typeof rawCategories === 'object') {
      saveCategories(rawCategories as CategoriesMap);
    }

    let rawMonthNotes = b.monthNotes ?? b['spesapp.monthnotes.v1'];
    if (typeof rawMonthNotes === 'string') {
      try {
        rawMonthNotes = JSON.parse(rawMonthNotes);
      } catch {
        /* ignore */
      }
    }
    if (rawMonthNotes && typeof rawMonthNotes === 'object') {
      saveMonthNotes(rawMonthNotes as MonthNotesMap);
    }

    let rawRecurring = b.recurringExpenses ?? b['spesapp.recurring.v1'];
    if (typeof rawRecurring === 'string') {
      try {
        rawRecurring = JSON.parse(rawRecurring);
      } catch {
        /* ignore */
      }
    }
    if (Array.isArray(rawRecurring)) {
      saveRecurringExpenses(rawRecurring.filter(isValidRecurringExpense));
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

export function cleanAndParseJson(raw: string): { data: unknown; error?: string } {
  let cleaned = raw.trim();

  // Strip markdown code fences if wrapped in ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // Remove Byte Order Mark (BOM)
  cleaned = cleaned.replace(/^\uFEFF/, '');

  // Normalize smart / curly quotes
  cleaned = cleaned
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");

  try {
    const data = JSON.parse(cleaned);
    return { data };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    let hint = '';
    if (!cleaned.endsWith('}') && !cleaned.endsWith(']')) {
      hint = ' (Attenzione: il testo sembra essere incompleto o troncato alla fine. Controlla di aver copiato tutto fino all\'ultima parentesi).';
    }
    return { data: null, error: `${errorMsg}${hint}` };
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
