import { Command } from 'commander';
import { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { videosApi } from '../api/videos';
import { printJson, printTable, printKeyValue } from '../output';
import { exitWithError } from '../errors';

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
          data.videos.map(v => [v.id, v.filename ?? '—', v.ingest_status, v.created_at])
        );
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  videos
    .command('import')
    .description('Import a video from a URL')
    .requiredOption('--url <url>', 'Video URL to import')
    .option('--json', 'Output as JSON')
    .action(async (opts: { url: string; json?: boolean }) => {
      try {
        const data = await api.import(opts.url);
        if (opts.json) return printJson(data);
        printKeyValue(data as unknown as Record<string, unknown>);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

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
    .action(async (videoId: string) => {
      try {
        await api.delete(videoId);
        process.stdout.write(`Video ${videoId} deleted.\n`);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });

  videos
    .command('upload')
    .description('Upload a video file from disk (3-step presigned flow)')
    .requiredOption('--file <path>', 'Path to the video file')
    .option('--json', 'Output as JSON')
    .action(async (opts: { file: string; json?: boolean }) => {
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

        // Step 1: get presigned URL
        process.stderr.write('Requesting presigned upload URL...\n');
        const { video_id, upload_url } = await api.uploadPresigned(filename, contentType);

        // Step 2: PUT file to S3
        process.stderr.write(`Uploading ${filename}...\n`);
        const fileStream = fs.createReadStream(filePath);
        const { size } = fs.statSync(filePath);
        await axios.put(upload_url, fileStream, {
          headers: { 'Content-Type': contentType, 'Content-Length': size },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });

        // Step 3: complete upload
        process.stderr.write('Completing upload...\n');
        const s3Key = `videos/original/${video_id}${ext}`
        const result = await api.uploadComplete(video_id, s3Key, filename);

        if (opts.json) return printJson(result);
        process.stdout.write(`Uploaded: videoId=${result.videoId}  status=pending\n`);
        process.stdout.write(`Track: hinto videos status ${result.videoId}\n`);
      } catch (e: unknown) {
        exitWithError(e instanceof Error ? e.message : String(e));
      }
    });
}
