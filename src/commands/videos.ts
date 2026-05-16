import { Command } from 'commander';
import { AxiosInstance } from 'axios';
import { videosApi } from '../api/videos';
import { printJson, printTable, printKeyValue } from '../output';
import { exitWithError } from '../errors';

export function registerVideos(program: Command, client: AxiosInstance): void {
  const videos = program.command('videos').description('Manage videos');
  const api = videosApi(client);

  videos
    .command('list')
    .description('List all videos')
    .option('--json', 'Output as JSON')
    .action(async (opts: { json?: boolean }) => {
      try {
        const data = await api.list();
        if (opts.json) return printJson(data);
        printTable(
          ['Video ID', 'Status', 'Created'],
          data.videos.map(v => [v.videoId, v.status, v.createdAt])
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
}
