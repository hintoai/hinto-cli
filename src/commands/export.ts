import { Command } from 'commander';
import { AxiosInstance } from 'axios';
import fs from 'fs';
import { exportApi } from '../api/export';
import { exitWithError } from '../errors';

export function registerExport(program: Command, client: AxiosInstance): void {
  const exportCmd = program.command('export').description('Export content');
  const api = exportApi(client);

  exportCmd
    .command('article <id>')
    .description('Export an article')
    .option('--format <fmt>', 'md or html', 'md')
    .option('--out <path>', 'Save to file instead of stdout')
    .action(async (id: string, opts: { format: string; out?: string }) => {
      try {
        // API accepts 'markdown' not 'md'
        const apiFormat = (opts.format === 'md' ? 'markdown' : opts.format) as 'markdown' | 'html';
        const content = await api.article(id, apiFormat);
        if (opts.out) {
          fs.writeFileSync(opts.out, content, 'utf-8');
          process.stdout.write(`Saved to ${opts.out}\n`);
        } else {
          process.stdout.write(content + '\n');
        }
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  exportCmd
    .command('folder <id>')
    .description('Export a folder as zip')
    .requiredOption('--out <path>', 'Output zip file path')
    .action(async (id: string, opts: { out: string }) => {
      try {
        const data = await api.folder(id);
        fs.writeFileSync(opts.out, data);
        process.stdout.write(`Folder exported to ${opts.out}\n`);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  exportCmd
    .command('project')
    .description('Export the full project as zip')
    .requiredOption('--out <path>', 'Output zip file path')
    .action(async (opts: { out: string }) => {
      try {
        const data = await api.project();
        fs.writeFileSync(opts.out, data);
        process.stdout.write(`Project exported to ${opts.out}\n`);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });
}
