import fs from 'fs';
import os from 'os';
import path from 'path';

export interface HintoConfig {
  apiKey: string;
  baseUrl: string;
}

// Evaluated lazily (not at module import) so the location always reflects the
// current environment. Tests redirect it with HINTO_CONFIG_DIR to avoid touching
// the real ~/.hinto/config.json.
export function configPath(): string {
  const dir = process.env.HINTO_CONFIG_DIR ?? path.join(os.homedir(), '.hinto');
  return path.join(dir, 'config.json');
}

export function saveConfig(config: HintoConfig): void {
  const file = configPath();
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(file, JSON.stringify(config, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  });
}

export function loadConfig(): HintoConfig {
  const file = configPath();
  if (!fs.existsSync(file)) {
    throw new Error('Run `hinto init --key <your-api-key>` to get started.');
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf-8')) as HintoConfig;
  return {
    ...raw,
    apiKey: process.env.HINTO_API_KEY ?? raw.apiKey,
  };
}
