import { Command } from 'commander';
import { AxiosInstance } from 'axios';
import fs from 'fs';
import path from 'path';
import { articlesApi } from '../api/articles';
import { printJson, printTable, printKeyValue } from '../output';
import { exitWithError } from '../errors';

function resolveContent(raw: string): string {
  if (!raw.startsWith('@')) return raw;
  const filePath = path.resolve(raw.slice(1));
  return fs.readFileSync(filePath, 'utf-8');
}

export function registerArticles(program: Command, client: AxiosInstance): void {
  const articles = program.command('articles').description('Manage articles');
  const api = articlesApi(client);

  articles
    .command('list')
    .description('List articles')
    .option('--folder <id>', 'Filter by folder ID')
    .option('--offset <n>', 'Number of articles to skip', '0')
    .option('--limit <n>', 'Results per page', '20')
    .option('--json', 'Output as JSON')
    .action(async (opts: { folder?: string; offset: string; limit: string; json?: boolean }) => {
      try {
        const data = await api.list({
          folder_id: opts.folder,
          offset: Number(opts.offset),
          limit: Number(opts.limit),
        });
        if (opts.json) return printJson(data);
        printTable(
          ['ID', 'Title', 'Slug', 'Folder', 'Updated'],
          data.articles.map(a => [String(a.id), a.title, a.slug ?? '(none)', a.folder_id ? String(a.folder_id) : '—', a.updated_at])
        );
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  articles
    .command('get <id>')
    .description('Get an article by ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { json?: boolean }) => {
      try {
        const data = await api.get(id);
        if (opts.json) return printJson(data);
        printKeyValue(data);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  articles
    .command('create')
    .description('Create an article')
    .requiredOption('--title <title>', 'Article title')
    .requiredOption('--content <content>', 'Markdown content string or @filepath')
    .option('--folder <id>', 'Folder ID')
    .option('--json', 'Output as JSON')
    .action(async (opts: { title: string; content: string; folder?: string; json?: boolean }) => {
      try {
        const data = await api.create({
          title: opts.title,
          markdown: resolveContent(opts.content),
          folder_id: opts.folder,
        });
        if (opts.json) return printJson(data);
        printKeyValue(data as unknown as Record<string, unknown>);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  articles
    .command('update <id>')
    .description('Update an article')
    .option('--title <title>', 'New title')
    .option('--slug <slug>', 'New slug')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { title?: string; slug?: string; json?: boolean }) => {
      try {
        if (!opts.title && !opts.slug) {
          exitWithError('Provide at least one field to update: --title or --slug');
          return;
        }
        const data = await api.update(id, {
          title: opts.title,
          slug: opts.slug,
        });
        if (opts.json) return printJson(data);
        printKeyValue(data as unknown as Record<string, unknown>);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  articles
    .command('delete <id>')
    .description('Delete an article')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { json?: boolean }) => {
      try {
        await api.delete(id);
        if (opts.json) return printJson({ deleted: true });
        process.stdout.write(`Article ${id} deleted.\n`);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  articles
    .command('duplicate <id>')
    .description('Duplicate an article')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { json?: boolean }) => {
      try {
        const data = await api.duplicate(id);
        if (opts.json) return printJson(data);
        printKeyValue(data as unknown as Record<string, unknown>);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  articles
    .command('move <id>')
    .description('Move an article to a folder, or to root if --folder is omitted')
    .option('--folder <folderId>', 'Destination folder ID — omit to move to root')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { folder?: string; json?: boolean }) => {
      try {
        const data = await api.move(id, opts.folder ?? null);
        if (opts.json) return printJson(data);
        printKeyValue(data as unknown as Record<string, unknown>);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  articles
    .command('regenerate <id>')
    .description('Regenerate an article')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { json?: boolean }) => {
      try {
        const data = await api.regenerate(id);
        if (opts.json) return printJson(data);
        printKeyValue(data as unknown as Record<string, unknown>);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  articles
    .command('versions <id>')
    .description('List article versions')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { json?: boolean }) => {
      try {
        const data = await api.listVersions(id);
        if (opts.json) return printJson(data);
        printTable(['Version ID', 'Created'], data.versions.map(v => [v.id, v.createdAt]));
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  articles
    .command('restore <id>')
    .description('Restore an article version')
    .requiredOption('--vid <vId>', 'Version ID to restore')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { vid: string; json?: boolean }) => {
      try {
        const data = await api.restoreVersion(id, opts.vid);
        if (opts.json) return printJson(data);
        printKeyValue(data as unknown as Record<string, unknown>);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  articles
    .command('translations <id>')
    .description('List article translations')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { json?: boolean }) => {
      try {
        const data = await api.listTranslations(id);
        if (opts.json) return printJson(data);
        printTable(
          ['Language', 'Status', 'Title', 'Has Content', 'Updated'],
          data.translations.map(t => [t.languageCode, t.status, t.title ?? '—', t.hasContent ? 'yes' : 'no', t.updatedAt])
        );
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  articles
    .command('translate <id>')
    .description('Get a specific translation')
    .requiredOption('--lang <code>', 'Language code (e.g. en, fr)')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { lang: string; json?: boolean }) => {
      try {
        const data = await api.getTranslation(id, opts.lang);
        if (opts.json) return printJson(data);
        printKeyValue(data as unknown as Record<string, unknown>);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  articles
    .command('trigger-translate <id>')
    .description('Trigger translation of an article to a language')
    .requiredOption('--lang <code>', 'Target language code (e.g. fr, de, es)')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { lang: string; json?: boolean }) => {
      try {
        const data = await api.triggerTranslate(id, opts.lang);
        if (opts.json) return printJson(data);
        process.stdout.write(`Translation queued for article ${id} → ${opts.lang}\n`);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });
}
