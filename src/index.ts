#!/usr/bin/env node
import { Command } from 'commander';
import { createClient } from './api/client';
import { registerArticles } from './commands/articles';
import { registerCompletion } from './commands/completion';
import { registerExport } from './commands/export';
import { registerFolders } from './commands/folders';
import { registerGenerate } from './commands/generate';
import { registerInit } from './commands/init';
import { registerProject } from './commands/project';
import { registerPublish } from './commands/publish';
import { registerTemplates } from './commands/templates';
import { registerVideos } from './commands/videos';
import { loadConfig } from './config';
import { exitWithError } from './errors';

// Read version from package.json so `hinto --version` never drifts from the
// published package version (package.json sits one level above dist/index.js).
const { version } = require('../package.json') as { version: string };

const program = new Command();

program
  .name('hinto')
  .description('Hinto AI CLI — manage videos, articles, and publishing')
  .version(version)
  .option('--api-url <url>', 'Override the Hinto base URL');

// init and completion don't need auth — register first
registerInit(program);
registerCompletion(program);

// Load config eagerly. If missing, fall back to empty key so --help still
// works on all subcommands. The client's interceptor returns a helpful
// UNAUTHORIZED message when a command is actually invoked without a valid key.
const config = (() => {
  try {
    return loadConfig();
  } catch {
    return { apiKey: process.env.HINTO_API_KEY ?? '', baseUrl: 'https://app.hintoai.com' };
  }
})();

const apiUrl = (() => {
  const idx = process.argv.indexOf('--api-url');
  return idx !== -1 ? (process.argv[idx + 1] ?? config.baseUrl) : config.baseUrl;
})();

const client = createClient(config.apiKey, apiUrl);

registerVideos(program, client);
registerArticles(program, client);
registerFolders(program, client);
registerGenerate(program, client);
registerProject(program, client);
registerPublish(program, client);
registerTemplates(program, client);
registerExport(program, client);

program.parseAsync(process.argv).catch((e: unknown) => {
  exitWithError(e instanceof Error ? e.message : String(e));
});
