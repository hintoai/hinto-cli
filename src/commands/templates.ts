import { Command } from 'commander';
import { AxiosInstance } from 'axios';
import { templatesApi } from '../api/templates';
import { printJson, printTable } from '../output';
import { exitWithError } from '../errors';

export function registerTemplates(program: Command, client: AxiosInstance): void {
  const templates = program.command('templates').description('Browse templates');
  const api = templatesApi(client);

  templates
    .command('article')
    .description('List article generation templates for this project type')
    .option('--json', 'Output as JSON')
    .action(async (opts: { json?: boolean }) => {
      try {
        const data = await api.articleTemplates();
        if (opts.json) return printJson(data);
        printTable(
          ['ID', 'Name', 'Requires Video', 'Description'],
          data.templates.map(t => [String(t.id), t.name, t.requires_video ? 'yes' : 'no', t.description ?? '—'])
        );
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  templates
    .command('structure')
    .description('List structure generation templates for this project type')
    .option('--json', 'Output as JSON')
    .action(async (opts: { json?: boolean }) => {
      try {
        const data = await api.structureTemplates();
        if (opts.json) return printJson(data);
        printTable(
          ['ID', 'Name', 'Requires Video', 'Description'],
          data.templates.map(t => [String(t.id), t.name, t.requires_video ? 'yes' : 'no', t.description ?? '—'])
        );
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });
}
