import fs from 'fs';
import { CONFIG_PATH } from '../../src/config';
import { runInit } from '../../src/commands/init';

beforeEach(() => {
  if (fs.existsSync(CONFIG_PATH)) fs.unlinkSync(CONFIG_PATH);
});
afterEach(() => {
  if (fs.existsSync(CONFIG_PATH)) fs.unlinkSync(CONFIG_PATH);
});

describe('runInit', () => {
  it('writes config file with provided key', () => {
    const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    runInit('hinto_test_key', 'https://app.hinto.ai');
    const saved = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    expect(saved.apiKey).toBe('hinto_test_key');
    expect(saved.baseUrl).toBe('https://app.hinto.ai');
    stdoutSpy.mockRestore();
  });

  it('prints success message', () => {
    const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    runInit('hinto_test_key', 'https://app.hinto.ai');
    const output = (stdoutSpy.mock.calls.map(c => c[0]) as string[]).join('');
    expect(output).toContain('Authenticated');
    stdoutSpy.mockRestore();
  });
});
