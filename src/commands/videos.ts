import type { AxiosInstance } from 'axios';
import axios from 'axios';
import type { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { videosApi } from '../api/videos';
import { exitWithError } from '../errors';
import { printJson, printKeyValue, printTable } from '../output';
import { pollVideoReady } from '../poll';
import { uploadFileMultipart } from '../upload';

/** Mirrors MAX_UPLOAD_BYTES in web-client/src/lib/video-upload.ts — the Gemini Files API ceiling. */
const MAX_UPLOAD_BYTES = 2_000_000_000;
/**
 * Above this, chunk. Below it, one PUT completes well inside the ~100s proxy
 * window, and the single-shot path is the one already proven in the field.
 */
const MULTIPART_THRESHOLD_BYTES = 50 * 1024 * 1024;

export function registerVideos(program: Command, client: AxiosInstance): void {
  const videos = program.command('videos').description('Manage videos');
  const api = videosApi(client);

  videos
    .command('list')
    .description('List all videos')
    .option('--offset <n>', 'Number of videos to skip', '0')
    .option('--limit <n>', 'Results per page', '20')
    .option('--json', 'Output as JSON')
    .action(async (opts: { offset: string; limit: string; json?: boolean }) => {
      try {
        const data = await api.list({ offset: Number(opts.offset), limit: Number(opts.limit) });
        if (opts.json) return printJson(data);
        printTable(
          ['Video ID', 'Filename', 'Status', 'Created'],
          data.videos.map((v) => [v.videoId, v.filename ?? '—', v.status, v.createdAt]),
        );
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  videos
    .command('import')
    .description('Import a video from a URL')
    .requiredOption('--url <url>', 'Video URL to import')
    .option('--name <name>', 'Display name for the imported video')
    .option('--callback-url <url>', 'URL to receive a webhook when the import job completes')
    .option('--callback-secret <secret>', 'HMAC-SHA256 signing secret for the callback webhook')
    .option('--json', 'Output as JSON')
    .action(
      async (opts: {
        url: string;
        name?: string;
        callbackUrl?: string;
        callbackSecret?: string;
        json?: boolean;
      }) => {
        try {
          const data = await api.import(opts.url, opts.name, opts.callbackUrl, opts.callbackSecret);
          if (opts.json) return printJson(data);
          printKeyValue(data as unknown as Record<string, unknown>);
        } catch (e: unknown) {
          exitWithError(e instanceof Error ? e.message : String(e));
        }
      },
    );

  videos
    .command('get <videoId>')
    .description('Get a video by ID')
    .option('--json', 'Output as JSON')
    .action(async (videoId: string, opts: { json?: boolean }) => {
      try {
        const data = await api.get(videoId);
        if (opts.json) return printJson(data);
        printKeyValue(data as unknown as Record<string, unknown>);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  videos
    .command('status <videoId>')
    .description('Get video processing status')
    .option('--json', 'Output as JSON')
    .action(async (videoId: string, opts: { json?: boolean }) => {
      try {
        const data = await api.status(videoId);
        if (opts.json) return printJson(data);
        printKeyValue(data as unknown as Record<string, unknown>);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  videos
    .command('delete <videoId>')
    .description('Delete a video')
    .option('--json', 'Output as JSON')
    .action(async (videoId: string, opts: { json?: boolean }) => {
      try {
        await api.delete(videoId);
        if (opts.json) return printJson({ deleted: true });
        process.stdout.write(`Video ${videoId} deleted.\n`);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  videos
    .command('upload')
    .description('Upload a video file from disk (chunked for large files)')
    .requiredOption('--file <path>', 'Path to the video file')
    .option('--wait', 'Wait until the video is ready for generation')
    .option('--part-size <bytes>', 'Override the chunk size (advanced)')
    .option('--json', 'Output as JSON')
    .action(async (opts: { file: string; wait?: boolean; partSize?: string; json?: boolean }) => {
      try {
        const filePath = path.resolve(opts.file);
        if (!fs.existsSync(filePath)) {
          exitWithError(`File not found: ${filePath}`);
          return;
        }
        const filename = path.basename(filePath);
        const ext = path.extname(filename).toLowerCase();
        const contentTypeMap: Record<string, string> = {
          '.mp4': 'video/mp4',
          '.mov': 'video/quicktime',
          '.webm': 'video/webm',
          '.avi': 'video/avi',
          '.mkv': 'video/x-matroska',
        };
        const contentType = contentTypeMap[ext] ?? 'video/mp4';
        const { size } = fs.statSync(filePath);

        // Checked locally so an oversize file costs nothing. The ceiling comes
        // from the Gemini Files API, which caps individual files at 2 GB — the
        // server enforces the same number.
        if (size > MAX_UPLOAD_BYTES) {
          exitWithError(
            `File too large (${Math.round(size / 1_000_000)} MB). Maximum is ${Math.round(
              MAX_UPLOAD_BYTES / 1_000_000,
            )} MB.`,
          );
          return;
        }

        const threshold = opts.partSize ? Number(opts.partSize) : MULTIPART_THRESHOLD_BYTES;

        let videoId: string;

        if (size > threshold) {
          // Chunked path. A single PUT of the whole file times out at the
          // Cloudflare proxy (~100s) for anything that takes longer than that
          // to transfer, which is what produced the HTTP 524 reports.
          process.stderr.write(
            `Uploading ${filename} in chunks (${Math.round(size / 1_000_000)} MB)...\n`,
          );
          let lastPct = -1;
          const result = await uploadFileMultipart({
            filePath,
            filename,
            contentType,
            fileSize: size,
            api,
            onProgress: (uploadedBytes, totalBytes) => {
              const pct = Math.floor((uploadedBytes / totalBytes) * 100);
              if (pct !== lastPct) {
                lastPct = pct;
                process.stderr.write(`\rUploading... ${pct}%`);
              }
            },
          });
          process.stderr.write('\n');
          videoId = result.videoId;
        } else {
          process.stderr.write('Requesting presigned upload URL...\n');
          const {
            videoId: newVideoId,
            uploadUrl,
            key: s3Key,
          } = await api.uploadPresigned(filename, contentType, size);

          process.stderr.write(`Uploading ${filename}...\n`);
          let putFailure: unknown;
          try {
            await axios.put(uploadUrl, fs.createReadStream(filePath), {
              headers: { 'Content-Type': contentType, 'Content-Length': size },
              maxBodyLength: Number.POSITIVE_INFINITY,
              maxContentLength: Number.POSITIVE_INFINITY,
            });
          } catch (e: unknown) {
            putFailure = e;
          }

          // A failed PUT does not mean the object is absent: the proxy in
          // front of storage can abandon the response while the body keeps
          // flowing to the origin. Completing is the check — it HEADs the
          // object and 404s if it genuinely is not there. Without this the
          // CLI reports errors for uploads that actually succeeded.
          if (putFailure) {
            process.stderr.write('Upload reported an error; verifying whether it landed...\n');
          }
          try {
            const completed = await api.uploadComplete(newVideoId, s3Key, filename);
            videoId = completed.videoId;
          } catch (completeErr: unknown) {
            if (putFailure) {
              throw putFailure;
            }
            throw completeErr;
          }
        }

        if (opts.wait) {
          await pollVideoReady(client, videoId);
        }

        if (opts.json) return printJson({ videoId });
        process.stdout.write(
          `Uploaded: videoId=${videoId}  status=${opts.wait ? 'ready' : 'pending'}\n`,
        );
        if (!opts.wait) process.stdout.write(`Track: hinto videos status ${videoId}\n`);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });
}
