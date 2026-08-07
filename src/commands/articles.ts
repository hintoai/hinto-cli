import type { AxiosInstance } from 'axios';
import type { Command } from 'commander';
import { articlesApi } from '../api/articles';
import { exitWithError } from '../errors';
import { resolveInput } from '../input';
import { printJson, printKeyValue, printTable } from '../output';

// Change requests can be up to 4000 chars and may contain newlines, which shreds a
// fixed-column table. Collapse newlines and truncate for display only — `--json`
// output goes through printJson() directly and always carries the full value.
function truncateForTable(value: string | null | undefined, maxLength = 60): string {
  if (!value) return '—';
  const collapsed = value.replace(/\s*\n+\s*/g, ' ').trim();
  return collapsed.length > maxLength ? `${collapsed.slice(0, maxLength)}…` : collapsed;
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
          folderId: opts.folder,
          offset: Number(opts.offset),
          limit: Number(opts.limit),
        });
        if (opts.json) return printJson(data);
        printTable(
          ['ID', 'Title', 'Slug', 'Folder', 'Updated'],
          data.articles.map((a) => [
            String(a.id),
            a.title,
            a.slug ?? '(none)',
            a.folderId != null ? String(a.folderId) : '—',
            a.updatedAt,
          ]),
        );
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  articles
    .command('get <id>')
    .description('Get an article by ID')
    .option('--format <fmt>', 'Content format: markdown (default) or html', 'markdown')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { format: string; json?: boolean }) => {
      try {
        const fmt = opts.format === 'html' ? 'html' : 'markdown';
        const data = await api.get(id, fmt);
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
    .option(
      '--brief <brief>',
      "The article's durable scope (string or @filepath) — stored but inert here, since create supplies content immediately",
    )
    .option('--json', 'Output as JSON')
    .action(
      async (opts: {
        title: string;
        content: string;
        folder?: string;
        brief?: string;
        json?: boolean;
      }) => {
        try {
          const data = await api.create({
            title: opts.title,
            content: resolveInput(opts.content),
            folderId: opts.folder,
            ...(opts.brief !== undefined && { brief: resolveInput(opts.brief).trim() }),
          });
          if (opts.json) return printJson(data);
          printKeyValue(data as unknown as Record<string, unknown>);
        } catch (e: unknown) {
          exitWithError(e instanceof Error ? e.message : String(e));
        }
      },
    );

  articles
    .command('create-empty')
    .description('Create an empty article (no content required)')
    .option('--title <title>', 'Article title')
    .option('--folder <id>', 'Folder ID')
    .option(
      '--brief <brief>',
      "The article's durable scope (string or @filepath) — steers its first generation",
    )
    .option('--json', 'Output as JSON')
    .action(async (opts: { title?: string; folder?: string; brief?: string; json?: boolean }) => {
      try {
        const data = await api.createEmpty({
          ...(opts.title !== undefined && { title: opts.title }),
          ...(opts.folder !== undefined && { folderId: Number(opts.folder) }),
          ...(opts.brief !== undefined && { brief: resolveInput(opts.brief).trim() }),
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
    .option('--content <content>', 'New Markdown content (string or @filepath) — replaces the body')
    .option('--meta-description <text>', 'SEO meta description')
    .option('--meta-keywords <keywords>', 'Comma-separated SEO keywords')
    .option('--brief <brief>', "Replace the article's durable scope (string or @filepath)")
    .option('--clear-brief', "Clear the article's durable scope")
    .option('--json', 'Output as JSON')
    .action(
      async (
        id: string,
        opts: {
          title?: string;
          slug?: string;
          content?: string;
          metaDescription?: string;
          metaKeywords?: string;
          brief?: string;
          clearBrief?: boolean;
          json?: boolean;
        },
      ) => {
        try {
          if (opts.brief !== undefined && opts.clearBrief) {
            exitWithError('--brief and --clear-brief cannot be used together');
            return;
          }
          if (
            !opts.title &&
            !opts.slug &&
            !opts.content &&
            !opts.metaDescription &&
            !opts.metaKeywords &&
            opts.brief === undefined &&
            !opts.clearBrief
          ) {
            exitWithError(
              'Provide at least one field to update: --title, --slug, --content, --meta-description, --meta-keywords, --brief, or --clear-brief',
            );
            return;
          }
          const data = await api.update(id, {
            ...(opts.title !== undefined && { title: opts.title }),
            ...(opts.slug !== undefined && { slug: opts.slug }),
            ...(opts.content !== undefined && { content: resolveInput(opts.content) }),
            ...(opts.metaDescription !== undefined && { metaDescription: opts.metaDescription }),
            ...(opts.metaKeywords !== undefined && {
              metaKeywords: opts.metaKeywords
                .split(',')
                .map((k) => k.trim())
                .filter(Boolean),
            }),
            ...(opts.clearBrief
              ? { brief: null }
              : opts.brief !== undefined && { brief: resolveInput(opts.brief).trim() }),
          });
          if (opts.json) return printJson(data);
          printKeyValue(data as unknown as Record<string, unknown>);
        } catch (e: unknown) {
          exitWithError(e instanceof Error ? e.message : String(e));
        }
      },
    );

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
    .option(
      '--brief-addition <text>',
      'A one-shot change request for this run (string or @filepath). Not added to the durable brief.',
    )
    .option('--callback-url <url>', 'URL to receive a webhook when the job completes')
    .option('--callback-secret <secret>', 'HMAC-SHA256 signing secret for the callback webhook')
    .option('--json', 'Output as JSON')
    .action(
      async (
        id: string,
        opts: {
          briefAddition?: string;
          callbackUrl?: string;
          callbackSecret?: string;
          json?: boolean;
        },
      ) => {
        try {
          const data = await api.regenerate(id, {
            ...(opts.briefAddition !== undefined && {
              briefAddition: resolveInput(opts.briefAddition).trim(),
            }),
            callbackUrl: opts.callbackUrl,
            callbackSecret: opts.callbackSecret,
          });
          if (opts.json) return printJson(data);
          printKeyValue(data as unknown as Record<string, unknown>);
        } catch (e: unknown) {
          exitWithError(e instanceof Error ? e.message : String(e));
        }
      },
    );

  articles
    .command('versions <id>')
    .description('List article versions')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { json?: boolean }) => {
      try {
        const data = await api.listVersions(id);
        if (opts.json) return printJson(data);
        printTable(
          ['Version ID', 'Version #', 'Created', 'Auto-save', 'Change request'],
          data.versions.map((v) => [
            v.id,
            String(v.versionNumber),
            v.createdAt,
            v.isAutoSave ? 'yes' : 'no',
            truncateForTable(v.briefAddition),
          ]),
        );
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
          data.translations.map((t) => [
            t.languageCode,
            t.status,
            t.title ?? '—',
            t.hasContent ? 'yes' : 'no',
            t.updatedAt,
          ]),
        );
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  articles
    .command('translate <id>')
    .description('Get a specific translation')
    .requiredOption('--lang <code>', 'Language code (e.g. en, fr)')
    .option(
      '--format <format>',
      'Content format: markdown or html',
      /^(markdown|html)$/,
      'markdown',
    )
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { lang: string; format?: string; json?: boolean }) => {
      try {
        const fmt = opts.format === 'html' ? 'html' : 'markdown';
        const data = await api.getTranslation(id, opts.lang, fmt);
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
    .option('--callback-url <url>', 'URL to receive a webhook when the job completes')
    .option('--callback-secret <secret>', 'HMAC-SHA256 signing secret for the callback webhook')
    .option('--json', 'Output as JSON')
    .action(
      async (
        id: string,
        opts: { lang: string; callbackUrl?: string; callbackSecret?: string; json?: boolean },
      ) => {
        try {
          const data = await api.triggerTranslate(
            id,
            opts.lang,
            opts.callbackUrl,
            opts.callbackSecret,
          );
          if (opts.json) return printJson(data);
          process.stdout.write(`Translation triggered. Job ID: ${data.jobId}\n`);
        } catch (e: unknown) {
          exitWithError(e instanceof Error ? e.message : String(e));
        }
      },
    );

  articles
    .command('set-translation <id>')
    .description('Upload a locally-produced translation for an article (status: manual)')
    .requiredOption('--lang <code>', 'Target language code (e.g. es, fr, de)')
    .requiredOption('--title <title>', 'Translated title')
    .requiredOption('--content <content>', 'Translated markdown string or @filepath')
    .option('--meta-description <text>', 'Translated meta description')
    .option('--meta-keywords <list>', 'Comma-separated translated keywords')
    .option('--faq-jsonld <content>', 'Translated JSON-LD as a JSON string or @filepath')
    .option('--slug <slug>', 'Localized slug (omit to keep the existing slug)')
    .option('--json', 'Output as JSON')
    .action(
      async (
        id: string,
        opts: {
          lang: string;
          title: string;
          content: string;
          metaDescription?: string;
          metaKeywords?: string;
          faqJsonld?: string;
          slug?: string;
          json?: boolean;
        },
      ) => {
        try {
          const body: {
            title: string;
            content: string;
            metaDescription?: string;
            metaKeywords?: string[];
            slug?: string;
            jsonLd?: object;
          } = {
            title: opts.title,
            content: resolveInput(opts.content),
          };
          if (opts.metaDescription) body.metaDescription = opts.metaDescription;
          if (opts.metaKeywords) {
            body.metaKeywords = opts.metaKeywords
              .split(',')
              .map((k) => k.trim())
              .filter(Boolean);
          }
          if (opts.slug) body.slug = opts.slug;
          if (opts.faqJsonld) body.jsonLd = JSON.parse(resolveInput(opts.faqJsonld));

          const data = await api.setTranslation(id, opts.lang, body);
          if (opts.json) return printJson(data);
          printKeyValue(data as unknown as Record<string, unknown>);
        } catch (e: unknown) {
          exitWithError(e instanceof Error ? e.message : String(e));
        }
      },
    );
}
