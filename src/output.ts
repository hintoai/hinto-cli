import chalk from 'chalk';
import Table from 'cli-table3';

export function printJson(data: unknown): void {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}

export function printTable(headers: string[], rows: string[][]): void {
  const table = new Table({ head: headers.map((h) => chalk.bold(h)) });
  rows.forEach((row) => {
    table.push(row);
  });
  process.stdout.write(`${table.toString()}\n`);
}

export function printKeyValue(obj: Record<string, unknown> | unknown): void {
  if (obj == null || typeof obj !== 'object') {
    process.stdout.write(`${String(obj)}\n`);
    return;
  }
  const lines = Object.entries(obj as Record<string, unknown>)
    .map(([k, v]) => `${chalk.bold(k)}: ${formatValue(k, v)}`)
    .join('\n');
  process.stdout.write(`${lines}\n`);
}

function formatValue(key: string, value: unknown): string {
  if ((key === 'status' || key === 'ingest_status') && typeof value === 'string') {
    if (['ready', 'completed'].includes(value)) return chalk.green(value);
    if (['pending', 'processing'].includes(value)) return chalk.yellow(value);
    if (value === 'failed') return chalk.red(value);
  }
  if (value === null || value === undefined) return chalk.dim('—');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}
