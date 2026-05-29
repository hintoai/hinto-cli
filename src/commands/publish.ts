import { Command } from 'commander';
import { AxiosInstance } from 'axios';
import { publishApi } from '../api/publish';
import { printJson, printKeyValue } from '../output';
import { exitWithError } from '../errors';

export function registerPublish(program: Command, client: AxiosInstance): void {
  const publish = program.command('publish').description('Publish your project');
  const api = publishApi(client);

  publish
    .command('now')
    .description('Publish the project (synchronous)')
    .option('--json', 'Output as JSON')
    .option('--callback-url <url>', 'Webhook URL to call when the job completes')
    .option('--callback-secret <secret>', 'Secret to include in the webhook callback')
    .action(async (opts: { json?: boolean; callbackUrl?: string; callbackSecret?: string }) => {
      try {
        const data = await api.now(opts.callbackUrl, opts.callbackSecret);
        if (opts.json) return printJson(data);
        process.stdout.write(`Publish job started. Job ID: ${data.jobId}\nPoll status: hinto generate status ${data.jobId}\n`);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  publish
    .command('republish')
    .description('Republish the project after content changes')
    .option('--json', 'Output as JSON')
    .option('--callback-url <url>', 'Webhook URL to call when the job completes')
    .option('--callback-secret <secret>', 'Secret to include in the webhook callback')
    .action(async (opts: { json?: boolean; callbackUrl?: string; callbackSecret?: string }) => {
      try {
        const data = await api.republish(opts.callbackUrl, opts.callbackSecret);
        if (opts.json) return printJson(data);
        process.stdout.write(`Republish job started. Job ID: ${data.jobId}\nPoll status: hinto generate status ${data.jobId}\n`);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  publish
    .command('status')
    .description('Show whether the project is currently published')
    .option('--json', 'Output as JSON')
    .action(async (opts: { json?: boolean }) => {
      try {
        const data = await api.status();
        if (opts.json) return printJson(data);
        printKeyValue(data as unknown as Record<string, unknown>);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  publish
    .command('unpublish')
    .description('Unpublish the project')
    .option('--json', 'Output as JSON')
    .action(async (opts: { json?: boolean }) => {
      try {
        const data = await api.unpublish();
        if (opts.json) return printJson(data);
        process.stdout.write(`${data.message}\n`);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });
}
