import { Command } from 'commander';
import { AxiosInstance } from 'axios';
import { foldersApi } from '../api/folders';
import { printJson, printTable, printKeyValue } from '../output';
import { exitWithError } from '../errors';

export function registerFolders(program: Command, client: AxiosInstance): void {
  const folders = program.command('folders').description('Manage folders');
  const api = foldersApi(client);

  folders
    .command('list')
    .description('List all folders')
    .option('--json', 'Output as JSON')
    .action(async (opts: { json?: boolean }) => {
      try {
        const data = await api.list();
        if (opts.json) return printJson(data);
        printTable(['ID', 'Name', 'Parent'], data.folders.map(f => [f.id, f.name, f.parent_id ?? '—']));
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  folders
    .command('get <id>')
    .description('Get a folder by ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { json?: boolean }) => {
      try {
        const data = await api.get(id);
        if (opts.json) return printJson(data);
        printKeyValue(data as unknown as Record<string, unknown>);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  folders
    .command('create')
    .description('Create a folder')
    .requiredOption('--name <name>', 'Folder name')
    .option('--parent <id>', 'Parent folder ID (omit for root)')
    .option('--json', 'Output as JSON')
    .action(async (opts: { name: string; parent?: string; json?: boolean }) => {
      try {
        const data = await api.create(opts.name, opts.parent);
        if (opts.json) return printJson(data);
        printKeyValue(data as unknown as Record<string, unknown>);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  folders
    .command('update <id>')
    .description('Rename a folder')
    .requiredOption('--name <name>', 'New folder name')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { name: string; json?: boolean }) => {
      try {
        const data = await api.update(id, opts.name);
        if (opts.json) return printJson(data);
        printKeyValue(data as unknown as Record<string, unknown>);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  folders
    .command('delete <id>')
    .description('Delete a folder')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { json?: boolean }) => {
      try {
        await api.delete(id);
        if (opts.json) return printJson({ deleted: true });
        process.stdout.write(`Folder ${id} deleted.\n`);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  folders
    .command('move <id>')
    .description('Move a folder (omit --parent to move to root)')
    .option('--parent <id>', 'Target parent folder ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { parent?: string; json?: boolean }) => {
      try {
        const data = await api.move(id, opts.parent ?? null);
        if (opts.json) return printJson(data);
        printKeyValue(data as unknown as Record<string, unknown>);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });
}
