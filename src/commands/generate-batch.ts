import { Command } from 'commander';
import { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { pollJob } from '../poll';
import { printJson } from '../output';
import { exitWithError } from '../errors';

interface PresignedResponse {
  videoId: string;
  uploadUrl: string;
  key: string;
  alreadyExists?: boolean;
}

interface BatchJob {
  type: string;
  input: Record<string, unknown>;
}

interface BatchStatus {
  status: string;
  jobs: Array<{ jobId: string; status: string; type: string; error?: string }>;
}

function makeClientKey(filePath: string): string {
  const stat = fs.statSync(filePath);
  return crypto
    .createHash('sha256')
    .update(`${path.resolve(filePath)}:${stat.size}:${stat.mtimeMs}`)
    .digest('hex');
}

async function uploadFile(
  client: AxiosInstance,
  filePath: string,
  clientKey: string
): Promise<string> {
  const filename = path.basename(filePath);
  const contentType = 'video/mp4';

  const { data: presigned } = await client.post<PresignedResponse>(
    '/videos/upload/presigned',
    { filename, contentType, clientKey }
  );

  if (presigned.alreadyExists) {
    process.stderr.write(`  (reused existing video for ${filename})\n`);
    return presigned.videoId;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const axios = (await import('axios')).default;
  await axios.put(presigned.uploadUrl, fileBuffer, {
    headers: { 'Content-Type': contentType },
    maxBodyLength: Infinity,
    timeout: 300_000,
  });

  const { data: completed } = await client.post<{ videoId: string }>(
    '/videos/upload/complete',
    { key: presigned.key, fileId: presigned.videoId, filename, clientKey }
  );

  return completed.videoId;
}

export function registerGenerateBatch(generate: Command, client: AxiosInstance): void {
  generate
    .command('batch')
    .description('Upload video files and generate structure for each in batch')
    .option(
      '-f, --file <path>',
      'video file to include (repeatable)',
      (v: string, acc: string[]) => { acc.push(v); return acc; },
      [] as string[]
    )
    .option(
      '-v, --video <id>',
      'already-uploaded video ID (repeatable)',
      (v: string, acc: string[]) => { acc.push(v); return acc; },
      [] as string[]
    )
    .option('-t, --template <id>', 'article template ID')
    .option('-s, --structure-template <id>', 'structure template ID')
    .option('--wait', 'poll until batch completes')
    .option('--json', 'output JSON')
    .option('--callback-url <url>', 'webhook URL')
    .option('--callback-secret <secret>', 'webhook HMAC secret')
    .action(async (opts: {
      file?: string[];
      video?: string[];
      template?: string;
      structureTemplate?: string;
      wait?: boolean;
      json?: boolean;
      callbackUrl?: string;
      callbackSecret?: string;
    }) => {
      try {
        const files: string[] = opts.file ?? [];
        const videoIds: string[] = opts.video ?? [];

        if (!files.length && !videoIds.length) {
          exitWithError('Provide at least one --file or --video');
          return;
        }

        const templateId = opts.template ? Number(opts.template) : undefined;
        const structureTemplateId = opts.structureTemplate ? Number(opts.structureTemplate) : undefined;

        const jobs: BatchJob[] = [];

        for (const filePath of files) {
          if (!fs.existsSync(filePath)) {
            exitWithError(`File not found: ${filePath}`);
            return;
          }
          const clientKey = makeClientKey(filePath);
          process.stderr.write(`Uploading ${path.basename(filePath)}...\n`);
          const videoId = await uploadFile(client, filePath, clientKey);
          jobs.push({
            type: 'generate/structure',
            input: {
              videoId,
              ...(templateId !== undefined ? { templateId } : {}),
              ...(structureTemplateId !== undefined ? { structureTemplateId } : {}),
            },
          });
        }

        for (const videoId of videoIds) {
          jobs.push({
            type: 'generate/structure',
            input: {
              videoId,
              ...(templateId !== undefined ? { templateId } : {}),
              ...(structureTemplateId !== undefined ? { structureTemplateId } : {}),
            },
          });
        }

        const { data: batchRes } = await client.post<{ jobId: string }>('/batches', {
          jobs,
          ...(opts.callbackUrl ? { callbackUrl: opts.callbackUrl } : {}),
          ...(opts.callbackSecret ? { callbackSecret: opts.callbackSecret } : {}),
        });

        const { jobId } = batchRes;

        if (!opts.wait) {
          if (opts.json) {
            printJson({ jobId });
          } else {
            process.stdout.write(`Batch started: ${jobId}\n`);
            process.stdout.write(`${jobs.length} job(s) queued.\n`);
            process.stdout.write(`Poll status: hinto generate status ${jobId}\n`);
          }
          return;
        }

        process.stderr.write(`Waiting for batch ${jobId}...\n`);
        const result = await pollBatch(client, jobId);

        if (opts.json) {
          printJson(result);
        } else {
          process.stdout.write(`Batch ${(result as BatchStatus).status}.\n`);
        }
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });
}

async function pollBatch(
  client: AxiosInstance,
  jobId: string,
  intervalMs = 3000,
  timeoutMs = 600_000
): Promise<unknown> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const { data } = await client.get<BatchStatus>(`/jobs/${jobId}`);

    if (data.status === 'completed' || data.status === 'failed') {
      return data;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Batch ${jobId} timed out after ${timeoutMs / 1000}s`);
}
