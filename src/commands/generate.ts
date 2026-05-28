import { Command } from 'commander';
import { AxiosInstance } from 'axios';
import { generateApi } from '../api/generate';
import { pollJob } from '../poll';
import { printJson, printKeyValue } from '../output';
import { exitWithError } from '../errors';

export function registerGenerate(program: Command, client: AxiosInstance): void {
  const generate = program.command('generate').description('Generate content from videos');
  const api = generateApi(client);

  generate
    .command('start')
    .description('Start a generation job')
    .requiredOption('--video <videoId>', 'Video ID to generate from')
    .option('--template <templateId>', 'Template ID (optional — server auto-selects if omitted)')
    .option('--callback-url <url>', 'URL to receive a webhook when the job completes')
    .option('--callback-secret <secret>', 'HMAC-SHA256 signing secret for the callback webhook')
    .option('--wait', 'Wait for completion')
    .option('--json', 'Output as JSON')
    .action(async (opts: { video: string; template?: string; callbackUrl?: string; callbackSecret?: string; wait?: boolean; json?: boolean }) => {
      try {
        const data = await api.start(opts.video, opts.template ? Number(opts.template) : undefined, opts.callbackUrl, opts.callbackSecret);
        if (opts.wait) {
          const output = await pollJob(client, data.jobId);
          if (opts.json) return printJson(output);
          printKeyValue(output as Record<string, unknown>);
        } else {
          if (opts.json) return printJson(data);
          process.stdout.write(`Job started: ${data.jobId}\n`);
        }
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  generate
    .command('status <jobId>')
    .description('Check generation job status')
    .option('--json', 'Output as JSON')
    .action(async (jobId: string, opts: { json?: boolean }) => {
      try {
        const data = await api.status(jobId);
        if (opts.json) return printJson(data);
        const display = Object.fromEntries(
          Object.entries(data as unknown as Record<string, unknown>).filter(([k, v]) => !(k === 'error' && (v === null || v === undefined)))
        );
        printKeyValue(display);
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });

  generate
    .command('structure')
    .description('Generate project structure from a video')
    .requiredOption('--video <videoId>', 'Video ID to generate structure from')
    .option('--callback-url <url>', 'URL to receive a webhook when the job completes')
    .option('--callback-secret <secret>', 'HMAC-SHA256 signing secret for the callback webhook')
    .option('--wait', 'Wait for completion')
    .option('--json', 'Output as JSON')
    .action(async (opts: { video: string; callbackUrl?: string; callbackSecret?: string; wait?: boolean; json?: boolean }) => {
      try {
        const data = await api.structure(opts.video, opts.callbackUrl, opts.callbackSecret);
        if (opts.wait) {
          const output = await pollJob(client, data.jobId);
          if (opts.json) return printJson(output);
          printKeyValue(output as Record<string, unknown>);
        } else {
          if (opts.json) return printJson(data);
          process.stdout.write(`Structure job started: ${data.jobId}\n`);
        }
      } catch (e: unknown) { exitWithError(e instanceof Error ? e.message : String(e)); }
    });
}
