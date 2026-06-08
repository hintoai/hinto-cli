import fs from 'fs';
import { runInit } from '../../src/commands/init';
import { configPath } from '../../src/config';

beforeEach(() => {
  if (fs.existsSync(configPath())) fs.unlinkSync(configPath());
});
afterEach(() => {
  if (fs.existsSync(configPath())) fs.unlinkSync(configPath());
});

describe('runInit', () => {
  it('writes config file with provided key', () => {
    const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    runInit('hinto_test_key', 'https://app.hinto.ai');
    const saved = JSON.parse(fs.readFileSync(configPath(), 'utf-8'));
    expect(saved.apiKey).toBe('hinto_test_key');
    expect(saved.baseUrl).toBe('https://app.hinto.ai');
    stdoutSpy.mockRestore();
  });

  it('prints success message', () => {
    const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    runInit('hinto_test_key', 'https://app.hinto.ai');
    const output = (stdoutSpy.mock.calls.map((c) => c[0]) as string[]).join('');
    expect(output).toContain('Authenticated');
    stdoutSpy.mockRestore();
  });
});
