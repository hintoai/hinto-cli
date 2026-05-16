import Table from 'cli-table3';
import chalk from 'chalk';

export function printJson(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

export function printTable(headers: string[], rows: string[][]): void {
  const table = new Table({ head: headers.map(h => chalk.bold(h)) });
  rows.forEach(row => table.push(row));
  process.stdout.write(table.toString() + '\n');
}

export function printKeyValue(obj: Record<string, unknown>): void {
  const lines = Object.entries(obj)
    .map(([k, v]) => `${chalk.bold(k)}: ${formatValue(k, v)}`)
    .join('\n');
  process.stdout.write(lines + '\n');
}

function formatValue(key: string, value: unknown): string {
  if (key === 'status' && typeof value === 'string') {
    if (['ready', 'completed'].includes(value)) return chalk.green(value);
    if (['pending', 'running'].includes(value)) return chalk.yellow(value);
    if (value === 'failed') return chalk.red(value);
  }
  if (value === null || value === undefined) return chalk.dim('—');
  return String(value);
}
