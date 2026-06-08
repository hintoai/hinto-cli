import { execFileSync } from 'child_process';
import path from 'path';
import pkg from '../package.json';

const cli = path.join(__dirname, '..', 'dist', 'index.js');

test('hinto --version matches package.json version', () => {
  const out = execFileSync('node', [cli, '--version'], { encoding: 'utf-8' }).trim();
  expect(out).toBe(pkg.version);
});
