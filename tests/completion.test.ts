import { execFileSync } from 'child_process';
import path from 'path';

const cli = path.join(__dirname, '..', 'dist', 'index.js');

function run(args: string[]): string {
  return execFileSync('node', [cli, ...args], { encoding: 'utf-8' });
}

test('completion bash emits a bash completion script', () => {
  const out = run(['completion', 'bash']);
  expect(out).toContain('complete -F _hinto hinto');
  expect(out).toContain('videos articles folders generate project publish templates export init completion');
});

test('completion zsh emits a zsh completion block', () => {
  const out = run(['completion', 'zsh']);
  expect(out).toContain('#compdef hinto');
});

test('completion fish emits fish complete commands', () => {
  const out = run(['completion', 'fish']);
  expect(out).toContain('complete -c hinto');
});
