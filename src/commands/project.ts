import { Command } from 'commander';
import { AxiosInstance } from 'axios';
import { projectApi } from '../api/project';
import { printJson, printTable, printKeyValue } from '../output';
import { exitWithError } from '../errors';

export function registerProject(program: Command, client: AxiosInstance): void {
  const project = program.command('project').description('Manage project settings');
  const api = projectApi(client);

  project
    .command('get')
    .description('Get project details')
    .option('--json', 'Output as JSON')
    .action(async (opts: { json?: boolean }) => {
      try {
        const data = await api.get();
        if (opts.json) return printJson(data);
        printKeyValue(data.project as unknown as Record<string, unknown>);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  project
    .command('update')
    .description('Update project settings')
    .option('--name <name>', 'New project name')
    .option('--json', 'Output as JSON')
    .action(async (opts: { name?: string; json?: boolean }) => {
      try {
        const data = await api.update({ name: opts.name });
        if (opts.json) return printJson(data);
        printKeyValue(data.project as unknown as Record<string, unknown>);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  project
    .command('structure')
    .description('Get project folder/article hierarchy')
    .option('--json', 'Output as JSON')
    .action(async (opts: { json?: boolean }) => {
      try {
        const data = await api.structure();
        if (opts.json) return printJson(data);
        printKeyValue(data as Record<string, unknown>);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  project
    .command('languages')
    .description('List languages enabled for this project')
    .option('--json', 'Output as JSON')
    .action(async (opts: { json?: boolean }) => {
      try {
        const data = await api.listLanguages();
        if (opts.json) return printJson(data);
        printTable(
          ['Code', 'Label', 'Translated', 'Total', 'Translating'],
          data.languages.map(l => [
            l.code,
            l.label,
            String(l.translatedArticles),
            String(l.totalArticles),
            String(l.isTranslating),
          ])
        );
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  project
    .command('retranslate')
    .description('Retranslate all articles to a language')
    .requiredOption('--lang <code>', 'Language code (e.g. fr, de, es)')
    .option('--json', 'Output as JSON')
    .option('--callback-url <url>', 'Webhook URL to call when the job completes')
    .option('--callback-secret <secret>', 'Secret to include in the webhook callback')
    .action(async (opts: { lang: string; json?: boolean; callbackUrl?: string; callbackSecret?: string }) => {
      try {
        const data = await api.retranslate(opts.lang, opts.callbackUrl, opts.callbackSecret);
        if (opts.json) return printJson(data);
        const queued = (data.output as { queued?: number } | null)?.queued ?? 0
        process.stdout.write(`Retranslation queued. ${queued} articles enqueued.\n`);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  project
    .command('add-language')
    .description('Add a language to this project')
    .requiredOption('--code <code>', 'Language code to add (e.g. fr, de, es)')
    .option('--json', 'Output as JSON')
    .action(async (opts: { code: string; json?: boolean }) => {
      try {
        const data = await api.addLanguage(opts.code);
        if (opts.json) return printJson(data);
        process.stdout.write(`Language ${data.languageCode} added. ${data.message}\n`);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });
}
