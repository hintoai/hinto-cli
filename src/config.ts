import fs from 'fs';
import os from 'os';
import path from 'path';

export interface HintoConfig {
  apiKey: string;
  baseUrl: string;
}

export const CONFIG_PATH = path.join(os.homedir(), '.hinto', 'config.json');

export function saveConfig(config: HintoConfig): void {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  });
}

export function loadConfig(): HintoConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error('Run `hinto init --key <your-api-key>` to get started.');
  }
  const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) as HintoConfig;
  return {
    ...raw,
    apiKey: process.env.HINTO_API_KEY ?? raw.apiKey,
  };
}
