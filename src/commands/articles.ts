import { Command } from 'commander';
import { AxiosInstance } from 'axios';
import fs from 'fs';
import { articlesApi } from '../api/articles';
import { printJson, printTable, printKeyValue } from '../output';
import { exitWithError } from '../errors';

function resolveContent(raw: string): string {
  return raw.startsWith('@') ? fs.readFileSync(raw.slice(1), 'utf-8') : raw;
}

export function registerArticles(program: Command, client: AxiosInstance): void {
  const articles = program.command('articles').description('Manage articles');
  const api = articlesApi(client);

  articles
    .command('list')
    .description('List articles')
    .option('--folder <id>', 'Filter by folder ID')
    .option('--json', 'Output as JSON')
    .action(async (opts: { folder?: string; json?: boolean }) => {
      try {
        const data = await api.list({ folderId: opts.folder });
        if (opts.json) return printJson(data);
        printTable(
          ['ID', 'Title', 'Slug', 'Updated'],
          data.articles.map(a => [a.id, a.title, a.slug, a.updatedAt])
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
        printKeyValue(data as unknown as Record<string, unknown>);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  articles
    .command('create')
    .description('Create an article')
    .requiredOption('--title <title>', 'Article title')
    .option('--content <content>', 'Content string or @filepath')
    .option('--folder <id>', 'Folder ID')
    .option('--json', 'Output as JSON')
    .action(async (opts: { title: string; content?: string; folder?: string; json?: boolean }) => {
      try {
        const data = await api.create({
          title: opts.title,
          content: opts.content ? resolveContent(opts.content) : undefined,
          folderId: opts.folder,
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
    .option('--content <content>', 'New content or @filepath')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { title?: string; content?: string; json?: boolean }) => {
      try {
        const data = await api.update(id, {
          title: opts.title,
          content: opts.content ? resolveContent(opts.content) : undefined,
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
    .action(async (id: string) => {
      try {
        await api.delete(id);
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
    .description('Move an article to a folder')
    .requiredOption('--folder <folderId>', 'Target folder ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { folder: string; json?: boolean }) => {
      try {
        const data = await api.move(id, opts.folder);
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
        printTable(['Version ID', 'Created'], data.versions.map(v => [v.vId, v.createdAt]));
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  articles
    .command('restore <id>')
    .description('Restore an article version')
    .requiredOption('--version <vId>', 'Version ID to restore')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { version: string; json?: boolean }) => {
      try {
        const data = await api.restoreVersion(id, opts.version);
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
        printTable(['Language'], data.translations.map(t => [t.lang]));
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
}
