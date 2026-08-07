import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveInput } from '../src/input';

describe('resolveInput', () => {
  it('returns a plain string unchanged', () => {
    expect(resolveInput('Covers setup only.')).toBe('Covers setup only.');
  });

  it('reads the file when the value starts with @', () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'hinto-')), 'brief.md');
    fs.writeFileSync(file, 'Covers setup only.', 'utf-8');
    expect(resolveInput(`@${file}`)).toBe('Covers setup only.');
  });
});
