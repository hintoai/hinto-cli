import fs from 'fs';
import { configPath, type HintoConfig, loadConfig, saveConfig } from '../src/config';

const TEST_CONFIG: HintoConfig = {
  apiKey: 'test_key_123',
  baseUrl: 'https://app.hinto.ai',
};

beforeEach(() => {
  if (fs.existsSync(configPath())) fs.unlinkSync(configPath());
  delete process.env.HINTO_API_KEY;
});

afterEach(() => {
  if (fs.existsSync(configPath())) fs.unlinkSync(configPath());
  delete process.env.HINTO_API_KEY;
});

describe('saveConfig / loadConfig', () => {
  it('round-trips config to disk', () => {
    saveConfig(TEST_CONFIG);
    const loaded = loadConfig();
    expect(loaded.apiKey).toBe('test_key_123');
    expect(loaded.baseUrl).toBe('https://app.hinto.ai');
  });

  it('throws with helpful message when config file missing', () => {
    expect(() => loadConfig()).toThrow('Run `hinto init --key');
  });

  it('env var HINTO_API_KEY overrides stored apiKey', () => {
    saveConfig(TEST_CONFIG);
    process.env.HINTO_API_KEY = 'env_key_override';
    const loaded = loadConfig();
    expect(loaded.apiKey).toBe('env_key_override');
  });

  it('writes the config file with 0600 permissions', () => {
    saveConfig(TEST_CONFIG);
    const mode = fs.statSync(configPath()).mode & 0o777;
    expect(mode).toBe(0o600);
  });
});
