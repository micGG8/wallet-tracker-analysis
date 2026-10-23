import type { Expense, Income } from '../types';

// Build a CSV string merging incomes and expenses.
// Columns: Tipo, Data, Importo, Classe, Sottocategoria, Descrizione
// Importo uses a decimal point (for Mathematica compatibility).
export function buildCsv(expenses: Expense[], incomes: Income[]): string {
  const header = 'Tipo,Data,Importo,Classe,Sottocategoria,Descrizione';
  const rows: string[] = [header];

  incomes.forEach((inc) => {
    rows.push(
      ['Entrata', inc.date, inc.amount.toFixed(2), '', '', inc.name]
        .map(csvEscape)
        .join(','),
    );
  });

  expenses.forEach((exp) => {
    rows.push(
      ['Spesa', exp.date, exp.amount.toFixed(2), exp.class, exp.category, '']
        .map(csvEscape)
        .join(','),
    );
  });

  return rows.join('\n');
}

function csvEscape(value: string): string {
  if (value === '') return '';
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
