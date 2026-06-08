#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillPath = path.join(root, 'skills', 'hinto-cli', 'SKILL.md');
const refsDir = path.join(root, 'skills', 'hinto-cli', 'references');
const cmdDir = path.join(root, 'src', 'commands');

const errors = [];

// 1. Frontmatter: name + description required
const skill = fs.readFileSync(skillPath, 'utf-8');
const fm = skill.match(/^---\n([\s\S]*?)\n---/);
if (!fm) {
  errors.push('SKILL.md: missing YAML frontmatter');
} else {
  if (!/\nname:\s*\S/.test(`\n${fm[1]}`)) errors.push('SKILL.md: frontmatter missing "name"');
  if (!/description:\s*\S/.test(fm[1]) && !/description:\s*>/.test(fm[1]))
    errors.push('SKILL.md: frontmatter missing "description"');
}

// 2. Category Routing rows -> reference files exist
const refFiles = new Set(fs.readdirSync(refsDir).filter((f) => f.endsWith('.md')));
for (const m of skill.matchAll(/references\/([a-z-]+\.md)/g)) {
  if (!refFiles.has(m[1])) errors.push(`SKILL.md references missing file: references/${m[1]}`);
}

// 3. Every command group has a reference doc (group name === file stem).
//    init and completion are CLI-only utilities, not API command groups.
const NON_GROUP = new Set(['init', 'completion']);
const cmdFiles = fs
  .readdirSync(cmdDir)
  .filter((f) => f.endsWith('.ts'))
  .map((f) => f.replace(/\.ts$/, ''));
for (const stem of cmdFiles) {
  if (NON_GROUP.has(stem)) continue;
  const ref = `${stem}.md`;
  if (!refFiles.has(ref)) errors.push(`Command src/commands/${stem}.ts has no references/${ref}`);
}

// 4. Guard: the API key must never be written to stdout/console
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : [p];
  });
}
for (const file of walk(path.join(root, 'src')).filter((f) => f.endsWith('.ts'))) {
  const lines = fs.readFileSync(file, 'utf-8').split('\n');
  lines.forEach((line, i) => {
    const logsKey =
      /(console\.(log|info|error|warn)|process\.stdout\.write)\s*\(/.test(line) &&
      /(apiKey|X-API-Key|HINTO_API_KEY)/.test(line);
    if (logsKey) errors.push(`${path.relative(root, file)}:${i + 1} may log the API key`);
  });
}

if (errors.length) {
  console.error(`Skill validation FAILED:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  process.exit(1);
}
console.log('Skill validation passed.');
