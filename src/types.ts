// Three expense classes, used both in the form and in the 50/30/20 rule.
//   Non discrezionali -> needs  (default target 50%)
//   Discrezionali     -> wants  (default target 30%)
//   Investimento      -> savings (default target 20%, Investimento-class expenses only)
export type ExpenseClass = 'Non discrezionali' | 'Discrezionali' | 'Investimento';

// Subcategories are free-form strings so users can add/remove their own.
export type ExpenseCategory = string;

export interface Expense {
  id: string;
  date: string; // ISO yyyy-mm-dd
  amount: number; // stored in euros
  class: ExpenseClass;
  category: ExpenseCategory;
}

export interface Income {
  id: string;
  date: string; // ISO yyyy-mm-dd
  name: string;
  amount: number; // stored in euros
}

// --- Class configuration ----------------------------------------------------
export interface ClassMeta {
  value: ExpenseClass;
  label: string;
  shortLabel: string;
  color: string;
  icon: string;
}

export const CLASS_META: ClassMeta[] = [
  {
    value: 'Non discrezionali',
    label: 'Non discrezionali',
    shortLabel: 'Non discrez.',
    color: '#2563eb',
    icon: 'Receipt',
  },
  {
    value: 'Discrezionali',
    label: 'Discrezionali',
    shortLabel: 'Discrez.',
    color: '#0891b2',
    icon: 'ShoppingBag',
  },
  {
    value: 'Investimento',
    label: 'Investimento',
    shortLabel: 'Invest.',
    color: '#059669',
    icon: 'TrendingUp',
  },
];

export const CLASS_COLORS: Record<ExpenseClass, string> = {
  'Non discrezionali': '#2563eb',
  Discrezionali: '#0891b2',
  Investimento: '#059669',
};

export const DEFAULT_CATEGORIES: Record<ExpenseClass, string[]> = {
  'Non discrezionali': [
    'affitto',
    'cibo',
    'bollette',
    'spese condominiali',
    'abbonamento',
    'rate o finanziamenti',
    'assicurazione',
    'macchina',
    'tasse',
    'bollo',
    'farmacia',
    'medico',
    'manutenzioni',
    'trasporti',
    'carburante',
  ],
  Discrezionali: [
    'shopping',
    'cura personale',
    'spese mediche straordinarie',
    'cibo fuori',
    'viaggi',
    'vacanze',
    'regali',
    'divertimento',
    'sport',
  ],
  Investimento: ['PAC', 'ETF'],
};

// Heuristic icon per subcategory keyword. Falls back to the class icon.
const CATEGORY_ICON_HINTS: { match: RegExp; icon: string }[] = [
  { match: /affitto|condominial/i, icon: 'Home' },
  { match: /bollett|bollo|tass/i, icon: 'Receipt' },
  { match: /cibo|farmacia|medic/i, icon: 'Utensils' },
  { match: /fuori|ristor|cena/i, icon: 'UtensilsCrossed' },
  { match: /macchin|carburante|trasport/i, icon: 'Car' },
  { match: /abbonament|finanziament|rate/i, icon: 'CreditCard' },
  { match: /assicuraz/i, icon: 'Shield' },
  { match: /manutenzion/i, icon: 'Wrench' },
  { match: /shopping|regal/i, icon: 'ShoppingBag' },
  { match: /cura|personale/i, icon: 'Sparkles' },
  { match: /viagg|vacanz/i, icon: 'Plane' },
  { match: /divertiment|sport/i, icon: 'Gamepad2' },
  { match: /pac|etf|invest/i, icon: 'TrendingUp' },
];

export function iconForCategory(category: string, cls: ExpenseClass): string {
  const found = CATEGORY_ICON_HINTS.find((h) => h.match.test(category));
  if (found) return found.icon;
  return CLASS_META.find((c) => c.value === cls)?.icon ?? 'Package';
}

export function classColor(cls: ExpenseClass): string {
  return CLASS_COLORS[cls] ?? '#64748b';
}

// --- 50/30/20 rule ----------------------------------------------------------
export type RuleBucket = 'needs' | 'wants' | 'savings';
export type RuleWeights = Record<RuleBucket, number>;

export const DEFAULT_RULE_WEIGHTS: RuleWeights = {
  needs: 50,
  wants: 30,
  savings: 20,
};

export interface RuleBucketMeta {
  id: RuleBucket;
  baseLabel: string;
  color: string;
  icon: string;
}

export const RULE_BUCKETS: RuleBucketMeta[] = [
  { id: 'needs', baseLabel: 'Fisse', color: '#2563eb', icon: 'Receipt' },
  { id: 'wants', baseLabel: 'Discrezionali', color: '#0891b2', icon: 'ShoppingBag' },
  { id: 'savings', baseLabel: 'Investimento', color: '#059669', icon: 'TrendingUp' },
];

// Map an expense class to its rule bucket.
export function classToBucket(cls: ExpenseClass): RuleBucket {
  if (cls === 'Investimento') return 'savings';
  if (cls === 'Discrezionali') return 'wants';
  return 'needs';
}
