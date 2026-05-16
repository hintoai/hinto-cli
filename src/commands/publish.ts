import { Command } from 'commander';
import { AxiosInstance } from 'axios';
import { publishApi } from '../api/publish';
import { pollJob } from '../poll';
import { printJson, printKeyValue } from '../output';
import { exitWithError } from '../errors';

export function registerPublish(program: Command, client: AxiosInstance): void {
  const publish = program.command('publish').description('Publish your project');
  const api = publishApi(client);

  publish
    .command('now')
    .description('Publish the project')
    .option('--wait')
    .option('--json')
    .action(async (opts: { wait?: boolean; json?: boolean }) => {
      try {
        const data = await api.now();
        if (opts.wait) {
          const output = await pollJob(client, data.jobId);
          if (opts.json) return printJson(output);
          printKeyValue(output as Record<string, unknown>);
        } else {
          if (opts.json) return printJson(data);
          process.stdout.write(`Publish job started: ${data.jobId}\n`);
        }
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  publish
    .command('republish')
    .description('Republish the project')
    .option('--wait')
    .option('--json')
    .action(async (opts: { wait?: boolean; json?: boolean }) => {
      try {
        const data = await api.republish();
        if (opts.wait) {
          const output = await pollJob(client, data.jobId);
          if (opts.json) return printJson(output);
          printKeyValue(output as Record<string, unknown>);
        } else {
          if (opts.json) return printJson(data);
          process.stdout.write(`Republish job started: ${data.jobId}\n`);
        }
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  publish
    .command('status')
    .description('Get publish status')
    .option('--json')
    .action(async (opts: { json?: boolean }) => {
      try {
        const data = await api.status();
        if (opts.json) return printJson(data);
        printKeyValue(data as unknown as Record<string, unknown>);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });
}
