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
    .option('--json')
    .action(async (opts: { json?: boolean }) => {
      try {
        const data = await api.list();
        if (opts.json) return printJson(data);
        printTable(['ID', 'Name', 'Parent'], data.folders.map(f => [f.id, f.name, f.parent_id ?? '—']));
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  folders
    .command('get <id>')
    .description('Get a folder')
    .option('--json')
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
    .requiredOption('--name <name>')
    .option('--parent <id>')
    .option('--json')
    .action(async (opts: { name: string; parent?: string; json?: boolean }) => {
      try {
        const data = await api.create(opts.name, opts.parent);
        if (opts.json) return printJson(data);
        printKeyValue(data as unknown as Record<string, unknown>);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  folders
    .command('update <id>')
    .description('Update a folder name')
    .requiredOption('--name <name>')
    .option('--json')
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
    .action(async (id: string) => {
      try {
        await api.delete(id);
        process.stdout.write(`Folder ${id} deleted.\n`);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  folders
    .command('move <id>')
    .description('Move a folder')
    .requiredOption('--parent <parentId>')
    .option('--json')
    .action(async (id: string, opts: { parent: string; json?: boolean }) => {
      try {
        const data = await api.move(id, opts.parent);
        if (opts.json) return printJson(data);
        printKeyValue(data as unknown as Record<string, unknown>);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });
}
