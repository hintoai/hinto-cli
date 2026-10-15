import type { AxiosInstance } from 'axios';
import type { Command } from 'commander';
import fs from 'fs';
import {
  type ArticleFormat,
  exportApi,
  type FolderFormat,
  isBinaryFormat,
  type ProjectFormat,
} from '../api/export';
import { exitWithError } from '../errors';

export function registerExport(program: Command, client: AxiosInstance): void {
  const exportCmd = program.command('export').description('Export content');
  const api = exportApi(client);

  exportCmd
    .command('article <id>')
    .description('Export an article')
    .option('--format <fmt>', 'Output format: md (default), html, pdf, docx, or vsdx', 'md')
    .option('--out <path>', 'Save to file instead of stdout')
    .option('--lang <code>', 'Export a translated version by language code (e.g. fr, de)')
    .action(async (id: string, opts: { format: string; out?: string; lang?: string }) => {
      try {
        // API accepts 'markdown' not 'md'
        const apiFormat = (opts.format === 'md' ? 'markdown' : opts.format) as ArticleFormat;
        const binary = isBinaryFormat(apiFormat);

        if (binary && !opts.out) {
          exitWithError(
            `--out <path> is required for ${apiFormat} export (binary output cannot be printed to stdout)`,
          );
          return;
        }

        const data = await api.article(id, apiFormat, opts.lang);

        if (opts.out) {
          if (binary) {
            fs.writeFileSync(opts.out, data as Buffer);
          } else {
            fs.writeFileSync(opts.out, data as string, 'utf-8');
          }
          process.stdout.write(`Saved to ${opts.out}\n`);
        } else {
          process.stdout.write(`${data as string}\n`);
        }
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  exportCmd
    .command('folder <id>')
    .description('Export a folder (PDF, Word, or Visio)')
    .requiredOption('--out <path>', 'Output file path')
    .option('--format <fmt>', 'Export format: pdf (default), docx, or vsdx', 'pdf')
    .action(async (id: string, opts: { out: string; format: string }) => {
      try {
        const data = await api.folder(id, opts.format as FolderFormat);
        fs.writeFileSync(opts.out, data);
        process.stdout.write(`Folder exported to ${opts.out}\n`);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  exportCmd
    .command('project')
    .description('Export the full project')
    .requiredOption('--out <path>', 'Output file path')
    .option(
      '--format <fmt>',
      'Export format: markdown (default), html, pdf, docx, vsdx, or llm-text',
      'markdown',
    )
    .action(async (opts: { out: string; format: string }) => {
      try {
        const data = await api.project(opts.format as ProjectFormat);
        fs.writeFileSync(opts.out, data);
        process.stdout.write(`Project exported to ${opts.out}\n`);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });
}
