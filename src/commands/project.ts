import { Command } from 'commander';
import { AxiosInstance } from 'axios';
import { projectApi } from '../api/project';
import { pollJob } from '../poll';
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
        const inner = (data as unknown as { project?: Record<string, unknown> }).project ?? data;
        printKeyValue(inner as unknown as Record<string, unknown>);
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
        printKeyValue(data as unknown as Record<string, unknown>);
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
        printTable(['Code', 'Name'], data.languages.map(l => [l.code, l.name]));
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  project
    .command('retranslate')
    .description('Retranslate all articles to a language')
    .requiredOption('--lang <code>', 'Language code (e.g. fr, de, es)')
    .option('--wait', 'Block until translation completes')
    .option('--json', 'Output as JSON')
    .action(async (opts: { lang: string; wait?: boolean; json?: boolean }) => {
      try {
        const data = await api.retranslate(opts.lang);
        if (opts.wait) {
          const output = await pollJob(client, data.jobId);
          if (opts.json) return printJson(output);
          printKeyValue(output as Record<string, unknown>);
        } else {
          if (opts.json) return printJson(data);
          process.stdout.write(`Retranslation job started: ${data.jobId}\n`);
        }
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });
}
