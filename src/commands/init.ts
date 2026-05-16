import { Command } from 'commander';
import chalk from 'chalk';
import { saveConfig } from '../config';

export function runInit(apiKey: string, baseUrl: string): void {
  saveConfig({ apiKey, baseUrl });
  process.stdout.write(chalk.green(`✓ Authenticated. Config saved to ~/.hinto/config.json\n`));
}

export function registerInit(program: Command): void {
  program
    .command('init')
    .description('Authenticate with your Hinto API key')
    .requiredOption('--key <apiKey>', 'Your Hinto API key')
    .option('--api-url <url>', 'Override the Hinto base URL', 'https://app.hinto.ai')
    .action((opts: { key: string; apiUrl: string }) => {
      // Prefer the root program's --api-url (passed globally) over the local default
      const baseUrl = (program.opts() as { apiUrl?: string }).apiUrl ?? opts.apiUrl;
      runInit(opts.key, baseUrl);
    });
}
