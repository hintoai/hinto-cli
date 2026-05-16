import { Command } from 'commander';
import { AxiosInstance } from 'axios';
import { templatesApi } from '../api/templates';
import { printJson, printTable } from '../output';
import { exitWithError } from '../errors';

export function registerTemplates(program: Command, client: AxiosInstance): void {
  const templates = program.command('templates').description('Browse templates');
  const api = templatesApi(client);

  templates
    .command('list')
    .description('List available templates')
    .option('--json', 'Output as JSON')
    .action(async (opts: { json?: boolean }) => {
      try {
        const data = await api.list();
        if (opts.json) return printJson(data);
        printTable(['ID', 'Name', 'Description'], data.templates.map(t => [t.id, t.name, t.description ?? '—']));
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });
}
