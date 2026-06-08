# Release Readiness Implementation Plan — @hintoai/cli

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `@hintoai/cli` a professional, publicly-publishable CLI that installs cleanly both CLI-first (`npm i -g @hintoai/cli`) and skill-first (`npx skills add hintoai/hinto-cli`), with automated releases, CI quality gates, security posture, governance, and polished docs.

**Architecture:** Move the unreleased `generate-batch` work off `main` first. Then add Changesets-based release automation (publish with provenance only on version-PR merge), a CI workflow (lint/typecheck/test/package-smoke/skill-validate), Biome tooling, stricter TS, a `hinto completion` command, a skill↔references validator, security/governance files, and README polish. The CLI version is read from `package.json` so it never drifts from the published version.

**Tech Stack:** TypeScript, Commander v12, Jest + nock, Biome, Changesets, GitHub Actions, npm.

**Reference spec:** `docs/superpowers/specs/2026-06-08-release-readiness-design.md`

---

## File Structure

New/changed files (grouped by responsibility):

- **Prep (git):** branch `feat/generate-batch`; `main` reset to `origin/main`; remove `src/commands/generate-batch.ts` + 2 lines in `src/commands/generate.ts`.
- **Packaging/legal:** `LICENSE`, `package.json`.
- **Tooling:** `biome.json`, `tsconfig.json`.
- **CLI:** `src/index.ts` (version from package.json + register completion), `src/commands/completion.ts`.
- **Validation:** `scripts/validate-skill.mjs`.
- **Tests:** `tests/config.test.ts` (0600 mode), `tests/completion.test.ts`.
- **Release:** `.changeset/config.json`, `.changeset/README.md`, `.changeset/<seed>.md`, `CHANGELOG.md`, `.github/workflows/release.yml`.
- **CI:** `.github/workflows/ci.yml`.
- **Security/governance:** `SECURITY.md`, `CONTRIBUTING.md`, `.github/CODEOWNERS`, `.github/dependabot.yml`, `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md`, `.github/PULL_REQUEST_TEMPLATE.md`.
- **Docs:** `README.md`.

---

## Task 0: Preparation — move `generate-batch` off `main`

**Files:**
- Branch: create `feat/generate-batch`
- Modify (working tree): `src/commands/generate.ts`
- Delete (working tree): `src/commands/generate-batch.ts`

Context: commit `188f0cd` ("feat: add hinto generate batch CLI command") is the single unpushed commit on `main`; `origin/main` is `933b204`. We preserve it on a branch and remove it from `main`. The earlier release-readiness edits in the working tree (`README.md`, `package.json`, `skills/hinto-cli/SKILL.md`, `.claude-plugin/`, `docs/`) must be preserved.

- [ ] **Step 1: Stash the uncommitted release-readiness working changes**

```bash
cd /Users/dip/Projects/hinto-cli
git stash push -u -m "release-readiness-wip" -- README.md package.json skills/hinto-cli/SKILL.md .claude-plugin docs
```

Expected: working tree clean except tracked batch commit; stash created.

- [ ] **Step 2: Preserve the batch commit on its own branch**

```bash
git branch feat/generate-batch 188f0cd
git log --oneline feat/generate-batch -1
```

Expected: `188f0cd feat: add hinto generate batch CLI command`.

- [ ] **Step 3: Reset `main` to origin and drop batch from the working tree**

```bash
git reset --hard origin/main
git log --oneline -1
```

Expected: HEAD = `933b204`; `src/commands/generate-batch.ts` gone; `src/commands/generate.ts` no longer imports/registers batch.

- [ ] **Step 4: Verify batch is fully gone from main**

```bash
grep -rni "batch" src || echo "no batch refs — good"
```

Expected: `no batch refs — good`.

- [ ] **Step 5: Restore the release-readiness working changes**

```bash
git stash pop
git status -sb
```

Expected: `README.md`, `package.json`, `skills/hinto-cli/SKILL.md` modified; `.claude-plugin/`, `docs/` untracked. No batch files.

- [ ] **Step 6: Create the working branch and push the preserved batch branch**

```bash
git switch -c chore/release-readiness
git push -u origin feat/generate-batch
```

Expected: on `chore/release-readiness`; `feat/generate-batch` pushed to origin (backup).

- [ ] **Step 7: Sanity build**

```bash
npm run build && node dist/index.js --help >/dev/null && echo OK
```

Expected: `OK` (CLI builds and runs without batch).

---

## Task 1: LICENSE + package.json polish

**Files:**
- Create: `LICENSE`
- Modify: `package.json`

- [ ] **Step 1: Add the MIT LICENSE file**

Create `LICENSE` (replace `Hinto AI` if a different legal entity is preferred):

```text
MIT License

Copyright (c) 2026 Hinto AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: Confirm package.json metadata is complete**

The earlier edits already set `name: @hintoai/cli`, `repository`, `homepage`, `bugs`, `keywords`, `license: MIT`, `publishConfig: { access: public, provenance: true }`. Verify by reading `package.json` and confirming all are present. No change if already correct.

- [ ] **Step 3: Add new npm scripts**

Modify the `scripts` block in `package.json` to add:

```json
    "lint": "biome check .",
    "format": "biome format --write .",
    "validate:skill": "node scripts/validate-skill.mjs",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "npm run build && changeset publish"
```

- [ ] **Step 4: Commit**

```bash
git add LICENSE package.json
git commit -m "chore: add MIT LICENSE and release/lint npm scripts"
```

---

## Task 2: Biome tooling

**Files:**
- Create: `biome.json`
- Modify: `package.json` (devDependency)

- [ ] **Step 1: Install Biome**

```bash
npm install --save-dev --save-exact @biomejs/biome@^1.9.0
```

Expected: `@biomejs/biome` in devDependencies.

- [ ] **Step 2: Create `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "files": {
    "ignore": ["dist", "node_modules", "coverage", "*.md"]
  },
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": { "noExplicitAny": "off" },
      "style": { "useNodejsImportProtocol": "off" }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": { "quoteStyle": "single", "trailingCommas": "all", "semicolons": "always" }
  }
}
```

- [ ] **Step 3: Run lint and review findings**

```bash
npm run lint
```

Expected: Biome reports issues (likely import order / formatting). Note count.

- [ ] **Step 4: Auto-fix safe issues, then re-check**

```bash
npx biome check --write . && npm run lint
```

Expected: remaining issues are zero, or only intentional ones. If a rule is too noisy for this codebase, disable it in `biome.json` (document why in the rule comment) rather than mass-editing. Do NOT change runtime behavior to satisfy a style rule.

- [ ] **Step 5: Verify build still passes**

```bash
npm run build
```

Expected: clean compile.

- [ ] **Step 6: Commit**

```bash
git add biome.json package.json package-lock.json src
git commit -m "chore: add Biome lint/format config and apply autofixes"
```

---

## Task 3: Stricter TypeScript

**Files:**
- Modify: `tsconfig.json`
- Possibly: `src/**` (fix new strict errors)

- [ ] **Step 1: Add stricter compiler flags**

In `tsconfig.json` `compilerOptions`, add after `"strict": true`:

```json
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
```

- [ ] **Step 2: Typecheck and list new errors**

```bash
npx tsc --noEmit
```

Expected: possibly a few `noUncheckedIndexedAccess` errors (array/object index access now `T | undefined`).

- [ ] **Step 3: Fix each error minimally**

For each error, add a guard or non-null assertion only where the value is provably present (e.g. after a `.length` check). Show the fix in the diff. Do not weaken the flag to avoid fixing. If zero errors, skip.

- [ ] **Step 4: Verify typecheck + tests**

```bash
npx tsc --noEmit && npm test
```

Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add tsconfig.json src
git commit -m "chore: enable stricter TypeScript compiler flags"
```

---

## Task 4: CLI version reads from package.json (fix drift)

**Files:**
- Modify: `src/index.ts`
- Test: `tests/version.test.ts`

Context: `src/index.ts` hardcodes `.version('0.1.0')`. Changesets bumps `package.json`, so this drifts. Read it from `package.json` at runtime.

- [ ] **Step 1: Write the failing test**

Create `tests/version.test.ts`:

```ts
import { execFileSync } from 'child_process';
import path from 'path';
import pkg from '../package.json';

const cli = path.join(__dirname, '..', 'dist', 'index.js');

test('hinto --version matches package.json version', () => {
  const out = execFileSync('node', [cli, '--version'], { encoding: 'utf-8' }).trim();
  expect(out).toBe(pkg.version);
});
```

- [ ] **Step 2: Build and run the test to verify it fails**

```bash
npm run build && npx jest tests/version.test.ts
```

Expected: FAIL — output `0.1.0` may or may not match; the point is the version must come from package.json. (If package.json is still `0.1.0` it could accidentally pass; bump package.json to `0.2.0` temporarily to confirm the test catches drift, then restore. Optional.)

- [ ] **Step 3: Read version from package.json in `src/index.ts`**

Replace the hardcoded version. Add near the top imports:

```ts
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../package.json') as { version: string };
```

And change:

```ts
  .version(version)
```

Note: `resolveJsonModule` is already enabled, but `require('../package.json')` keeps the compiled `dist/index.js` resolving correctly relative to the package root (since `package.json` sits one level above `dist/`). Verify the relative path resolves from `dist/`.

- [ ] **Step 4: Rebuild and run the test**

```bash
npm run build && npx jest tests/version.test.ts
```

Expected: PASS — `--version` prints the package.json version.

- [ ] **Step 5: Commit**

```bash
git add src/index.ts tests/version.test.ts
git commit -m "fix(cli): read version from package.json to prevent drift"
```

---

## Task 5: `hinto completion` command

**Files:**
- Create: `src/commands/completion.ts`
- Modify: `src/index.ts` (register)
- Test: `tests/completion.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/completion.test.ts`:

```ts
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
```

- [ ] **Step 2: Build and run to verify failure**

```bash
npm run build && npx jest tests/completion.test.ts
```

Expected: FAIL — unknown command `completion`.

- [ ] **Step 3: Implement `src/commands/completion.ts`**

```ts
import { Command } from 'commander';

const GROUPS = [
  'videos', 'articles', 'folders', 'generate',
  'project', 'publish', 'templates', 'export', 'init', 'completion',
];
const GLOBAL_FLAGS = ['--json', '--api-url', '--help', '--version'];

function bashScript(): string {
  return `# hinto bash completion
_hinto() {
  local cur groups flags
  cur="\${COMP_WORDS[COMP_CWORD]}"
  groups="${GROUPS.join(' ')}"
  flags="${GLOBAL_FLAGS.join(' ')}"
  if [ "\$COMP_CWORD" -eq 1 ]; then
    COMPREPLY=( \$(compgen -W "\$groups" -- "\$cur") )
  else
    COMPREPLY=( \$(compgen -W "\$flags" -- "\$cur") )
  fi
}
complete -F _hinto hinto
`;
}

function zshScript(): string {
  return `#compdef hinto
# hinto zsh completion
_hinto() {
  local -a groups
  groups=(${GROUPS.join(' ')})
  if (( CURRENT == 2 )); then
    compadd -- \${groups[@]}
  else
    compadd -- ${GLOBAL_FLAGS.join(' ')}
  fi
}
compdef _hinto hinto
`;
}

function fishScript(): string {
  const groupLines = GROUPS
    .map(g => `complete -c hinto -n "__fish_use_subcommand" -a "${g}"`)
    .join('\n');
  const flagLines = GLOBAL_FLAGS
    .map(f => `complete -c hinto -l "${f.replace(/^--/, '')}"`)
    .join('\n');
  return `# hinto fish completion\n${groupLines}\n${flagLines}\n`;
}

export function registerCompletion(program: Command): void {
  program
    .command('completion <shell>')
    .description('Output a shell completion script (bash | zsh | fish)')
    .action((shell: string) => {
      switch (shell) {
        case 'bash': process.stdout.write(bashScript()); break;
        case 'zsh': process.stdout.write(zshScript()); break;
        case 'fish': process.stdout.write(fishScript()); break;
        default:
          process.stderr.write(`Unsupported shell: ${shell}. Use bash, zsh, or fish.\n`);
          process.exit(1);
      }
    });
}
```

- [ ] **Step 4: Register in `src/index.ts`**

Add import with the other command imports:

```ts
import { registerCompletion } from './commands/completion';
```

And register it (it needs no client) near `registerInit(program)`:

```ts
registerCompletion(program);
```

- [ ] **Step 5: Rebuild and run the tests**

```bash
npm run build && npx jest tests/completion.test.ts
```

Expected: all three PASS.

- [ ] **Step 6: Commit**

```bash
git add src/commands/completion.ts src/index.ts tests/completion.test.ts
git commit -m "feat(cli): add 'hinto completion' for bash/zsh/fish"
```

---

## Task 6: Skill ↔ references validator

**Files:**
- Create: `scripts/validate-skill.mjs`

Context: must validate SKILL.md frontmatter and that the "Category Routing" table, `references/*.md`, and `src/commands/*.ts` groups are consistent. No WIP exemption (batch is off `main`).

- [ ] **Step 1: Create `scripts/validate-skill.mjs`**

```js
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
if (!fm) errors.push('SKILL.md: missing YAML frontmatter');
else {
  if (!/\nname:\s*\S/.test('\n' + fm[1])) errors.push('SKILL.md: frontmatter missing "name"');
  if (!/\bdescription:\s*\S/.test(fm[1]) && !/description:\s*>/.test(fm[1]))
    errors.push('SKILL.md: frontmatter missing "description"');
}

// 2. Category Routing rows -> reference files exist
const refFiles = new Set(fs.readdirSync(refsDir).filter(f => f.endsWith('.md')));
const referenced = new Set();
for (const m of skill.matchAll(/references\/([a-z-]+\.md)/g)) {
  referenced.add(m[1]);
  if (!refFiles.has(m[1])) errors.push(`SKILL.md references missing file: references/${m[1]}`);
}

// 3. Every command group has a reference doc (group name === file stem)
//    Command files export register<Group>; map by filename stem.
const cmdFiles = fs.readdirSync(cmdDir)
  .filter(f => f.endsWith('.ts'))
  .map(f => f.replace(/\.ts$/, ''));
// init and completion are CLI-only utilities, not API command groups
const NON_GROUP = new Set(['init', 'completion']);
for (const stem of cmdFiles) {
  if (NON_GROUP.has(stem)) continue;
  const ref = `${stem}.md`;
  if (!refFiles.has(ref)) errors.push(`Command src/commands/${stem}.ts has no references/${ref}`);
}

if (errors.length) {
  console.error('Skill validation FAILED:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('Skill validation passed.');
```

- [ ] **Step 2: Run it against the current repo**

```bash
node scripts/validate-skill.mjs
```

Expected: `Skill validation passed.` If it fails, the failure is a real drift — fix the reference/SKILL.md (do NOT loosen the validator to hide it). Common case: a command file whose group name differs from its reference filename — adjust `NON_GROUP` only for genuine non-API utilities.

- [ ] **Step 3: Commit**

```bash
git add scripts/validate-skill.mjs
git commit -m "chore: add skill <-> references consistency validator"
```

---

## Task 7: Changesets release automation

**Files:**
- Create: `.changeset/config.json`, `.changeset/README.md`, `.changeset/initial-release.md`, `CHANGELOG.md`
- Modify: `package.json` (devDependency)

- [ ] **Step 1: Install Changesets**

```bash
npm install --save-dev @changesets/cli@^2.27.0
```

- [ ] **Step 2: Create `.changeset/config.json`**

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

- [ ] **Step 3: Create `.changeset/README.md`**

```md
# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets).
Add a changeset for every user-facing change:

```bash
npm run changeset
```

Merging changesets to `main` opens a "Version Packages" PR; merging that PR
publishes `@hintoai/cli` to npm with provenance.
```

- [ ] **Step 4: Seed the first changeset**

Create `.changeset/initial-release.md`:

```md
---
"@hintoai/cli": minor
---

First public release: rename to `@hintoai/cli`, skill-first install via
`npx skills add hintoai/hinto-cli`, shell completions, version read from
package.json, and full CI/release automation.
```

- [ ] **Step 5: Seed `CHANGELOG.md`**

```md
# @hintoai/cli

Changelog is maintained automatically by Changesets. See release entries below.
```

- [ ] **Step 6: Verify changeset status**

```bash
npx changeset status
```

Expected: reports a pending `minor` bump for `@hintoai/cli`.

- [ ] **Step 7: Commit**

```bash
git add .changeset CHANGELOG.md package.json package-lock.json
git commit -m "chore: set up Changesets release automation"
```

---

## Task 8: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run validate:skill

  test:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest]
        node: [18, 20, 22]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: ${{ matrix.node }}, cache: npm }
      - run: npm ci
      - run: npm run build
      - run: npm test

  package:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
      - name: Smoke test built binary
        run: |
          VER=$(node dist/index.js --version)
          PKG=$(node -p "require('./package.json').version")
          test "$VER" = "$PKG" || { echo "version mismatch: cli=$VER pkg=$PKG"; exit 1; }
          node dist/index.js --help >/dev/null
      - name: Assert npm pack contents
        run: |
          npm pack --dry-run --json > pack.json
          node -e "const f=require('./pack.json')[0].files.map(x=>x.path); if(!f.some(p=>p.startsWith('dist/'))){console.error('dist/ missing from tarball');process.exit(1)}; if(f.some(p=>p.startsWith('src/'))){console.error('src/ leaked into tarball');process.exit(1)}; console.log('pack OK:',f.length,'files')"

  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm audit --audit-level=high --omit=dev || true
```

Note: `audit` uses `|| true` so a transitive advisory doesn't block PRs while still surfacing in logs; tighten later if desired.

- [ ] **Step 2: Validate YAML locally**

```bash
node -e "const y=require('fs').readFileSync('.github/workflows/ci.yml','utf8'); console.log(y.includes('jobs:')?'yaml present':'missing')"
```

Expected: `yaml present`. (Full lint happens on push.)

- [ ] **Step 3: Locally reproduce the package job assertions**

```bash
npm run build
VER=$(node dist/index.js --version); PKG=$(node -p "require('./package.json').version"); test "$VER" = "$PKG" && echo "smoke OK"
npm pack --dry-run --json > /tmp/pack.json && node -e "const f=require('/tmp/pack.json')[0].files.map(x=>x.path); console.log(f.some(p=>p.startsWith('dist/'))&&!f.some(p=>p.startsWith('src/'))?'pack OK':'pack BAD')"
```

Expected: `smoke OK` and `pack OK`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add lint/typecheck/test-matrix/package/audit workflow"
```

---

## Task 9: Release workflow (Changesets + provenance)

**Files:**
- Modify/replace: `.github/workflows/release.yml`

- [ ] **Step 1: Replace `release.yml`**

```yaml
name: Release

on:
  push:
    branches: [main]

concurrency: release-${{ github.ref }}

permissions:
  contents: write
  pull-requests: write
  id-token: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          registry-url: https://registry.npmjs.org
      - run: npm ci
      - run: npm run build
      - name: Create release PR or publish
        uses: changesets/action@v1
        with:
          version: npm run version-packages
          publish: npm run release
          commit: "chore: version packages"
          title: "chore: version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          NPM_CONFIG_PROVENANCE: "true"
```

Behavior: on push to `main` with pending changesets, the action opens/updates a "Version Packages" PR. When that PR merges (changesets consumed), the same job runs `npm run release` (`changeset publish`) and publishes with provenance. No `NPM_TOKEN` ⇒ publish step no-ops/fails loudly but nothing is published accidentally.

- [ ] **Step 2: Confirm no leftover tag-trigger logic**

```bash
grep -n "tags:" .github/workflows/release.yml || echo "no tag triggers — good"
```

Expected: `no tag triggers — good`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: replace tag publish with Changesets release + provenance"
```

---

## Task 10: Security & governance files

**Files:**
- Create: `SECURITY.md`, `CONTRIBUTING.md`, `.github/CODEOWNERS`, `.github/dependabot.yml`, `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md`, `.github/PULL_REQUEST_TEMPLATE.md`

- [ ] **Step 1: `SECURITY.md`**

```md
# Security Policy

## Reporting a Vulnerability

Email **security@hinto.ai** with details. Do not open a public issue for
security reports. We aim to acknowledge within 3 business days.

## Handling of credentials

The CLI stores your API key at `~/.hinto/config.json` with `0600` permissions.
The key is sent only in the `X-API-Key` request header and is never logged.
Prefer the `HINTO_API_KEY` environment variable in CI.
```

- [ ] **Step 2: `CONTRIBUTING.md`**

```md
# Contributing to @hintoai/cli

## Setup

```bash
npm ci
npm run build
npm test
```

## Workflow

1. Branch off `main`.
2. Make your change. A new command means: add `src/commands/<group>.ts`,
   register it in `src/index.ts`, AND add `skills/hinto-cli/references/<group>.md`
   plus a row in the SKILL.md "Category Routing" table. CI enforces this via
   `npm run validate:skill`.
3. Run `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run validate:skill`.
4. Add a changeset: `npm run changeset`.
5. Open a PR. CI must pass.

## Releases

Merging changesets to `main` opens a "Version Packages" PR. Merging that PR
publishes `@hintoai/cli` to npm with provenance.
```

- [ ] **Step 3: `.github/CODEOWNERS`**

```text
* @hintoai/maintainers
```

(Adjust the team/handle to a real owner before relying on it.)

- [ ] **Step 4: `.github/dependabot.yml`**

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule: { interval: weekly }
    open-pull-requests-limit: 5
  - package-ecosystem: github-actions
    directory: "/"
    schedule: { interval: weekly }
```

- [ ] **Step 5: Issue templates**

`.github/ISSUE_TEMPLATE/bug_report.md`:

```md
---
name: Bug report
about: Something isn't working
labels: bug
---

**Command run**

```bash
hinto ...
```

**Expected vs actual**

**Environment**
- CLI version (`hinto --version`):
- Node version (`node -v`):
- OS:
```

`.github/ISSUE_TEMPLATE/feature_request.md`:

```md
---
name: Feature request
about: Suggest an idea
labels: enhancement
---

**Problem**

**Proposed solution**

**Alternatives considered**
```

- [ ] **Step 6: PR template**

`.github/PULL_REQUEST_TEMPLATE.md`:

```md
## Summary

## Checklist
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes
- [ ] `npm run validate:skill` passes
- [ ] Added a changeset (`npm run changeset`) if user-facing
- [ ] Updated `references/` + SKILL.md if a command changed
```

- [ ] **Step 7: Commit**

```bash
git add SECURITY.md CONTRIBUTING.md .github/CODEOWNERS .github/dependabot.yml .github/ISSUE_TEMPLATE .github/PULL_REQUEST_TEMPLATE.md
git commit -m "docs: add security policy, contributing guide, and GitHub templates"
```

---

## Task 11: Token-hygiene test + guard

**Files:**
- Test: `tests/config.test.ts`
- Modify: `scripts/validate-skill.mjs` (add a logging guard) — OR keep separate; here we add the guard to the validator.

- [ ] **Step 1: Write the config mode test**

Create `tests/config.test.ts`:

```ts
import fs from 'fs';
import os from 'os';
import path from 'path';

// Re-implement the expected behavior check against saveConfig by pointing HOME
// at a temp dir is not trivial since CONFIG_PATH is computed at import time.
// Instead, assert the documented mode constant behavior directly.
import { saveConfig, CONFIG_PATH } from '../src/config';

test('saveConfig writes the config file with 0600 permissions', () => {
  // Only run if we can write to the real config path's parent safely:
  // use a guard so CI on a fresh runner still exercises it.
  saveConfig({ apiKey: 'test_key_DO_NOT_LOG', baseUrl: 'https://app.hinto.ai' });
  const mode = fs.statSync(CONFIG_PATH).mode & 0o777;
  expect(mode).toBe(0o600);
});
```

Note: this writes to the real `~/.hinto/config.json`. To avoid clobbering a developer's real key, the test must back up and restore. Revise the test to:

```ts
import fs from 'fs';
import { saveConfig, loadConfig, CONFIG_PATH } from '../src/config';

test('saveConfig writes the config file with 0600 permissions', () => {
  const existed = fs.existsSync(CONFIG_PATH);
  const backup = existed ? fs.readFileSync(CONFIG_PATH) : null;
  try {
    saveConfig({ apiKey: 'test_key_DO_NOT_LOG', baseUrl: 'https://app.hinto.ai' });
    const mode = fs.statSync(CONFIG_PATH).mode & 0o777;
    expect(mode).toBe(0o600);
  } finally {
    if (backup) fs.writeFileSync(CONFIG_PATH, backup, { mode: 0o600 });
    else if (fs.existsSync(CONFIG_PATH)) fs.rmSync(CONFIG_PATH);
  }
});
```

- [ ] **Step 2: Run the test**

```bash
npm run build && npx jest tests/config.test.ts
```

Expected: PASS (the existing `saveConfig` already uses mode `0o600`).

- [ ] **Step 3: Add a no-key-logging guard to the validator**

Append to `scripts/validate-skill.mjs` before the final `if (errors.length)` block:

```js
// 4. Guard: API key must never be written to stdout/console
const srcRoot = path.join(root, 'src');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : [p];
  });
}
for (const file of walk(srcRoot).filter(f => f.endsWith('.ts'))) {
  const text = fs.readFileSync(file, 'utf-8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const logsKey = /(console\.(log|info|error|warn)|process\.stdout\.write)\s*\(/.test(line)
      && /(apiKey|X-API-Key|HINTO_API_KEY)/.test(line);
    if (logsKey) errors.push(`${path.relative(root, file)}:${i + 1} may log the API key`);
  });
}
```

- [ ] **Step 4: Run the validator**

```bash
node scripts/validate-skill.mjs
```

Expected: `Skill validation passed.` (No source line logs the key.)

- [ ] **Step 5: Commit**

```bash
git add tests/config.test.ts scripts/validate-skill.mjs
git commit -m "test(security): assert 0600 config mode and guard against key logging"
```

---

## Task 12: README polish

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add badges under the title**

Insert directly beneath the `# @hintoai/cli` line:

```md
[![npm version](https://img.shields.io/npm/v/@hintoai/cli.svg)](https://www.npmjs.com/package/@hintoai/cli)
[![CI](https://github.com/hintoai/hinto-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/hintoai/hinto-cli/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
```

- [ ] **Step 2: Add a Quickstart section after Authentication**

```md
## Quickstart

```bash
npm install -g @hintoai/cli
hinto init --key <your-api-key>
hinto videos upload --file ./demo.mp4 --json
hinto templates article --json
hinto generate start --video <videoId> --template <templateId> --wait --json
hinto publish now --json
```
```

- [ ] **Step 3: Add a Shell completions section**

```md
## Shell completions

```bash
# bash (add to ~/.bashrc)
eval "$(hinto completion bash)"

# zsh (add to ~/.zshrc)
eval "$(hinto completion zsh)"

# fish
hinto completion fish | source
```
```

- [ ] **Step 4: Verify the agent-install section (added earlier) is intact**

Confirm the "Use it from an AI agent" block with `npx skills add hintoai/hinto-cli` is present.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add badges, quickstart, and shell completion docs to README"
```

---

## Task 13: Stage earlier edits + final verification

**Files:**
- Commit: `.claude-plugin/marketplace.json`, `docs/superpowers/**`, plus any still-uncommitted earlier edits (`package.json`, `README.md`, `skills/hinto-cli/SKILL.md`).

- [ ] **Step 1: Commit the marketplace manifest and specs/plans**

```bash
git add .claude-plugin/marketplace.json docs/superpowers
git commit -m "docs: add claude-plugin marketplace manifest, release-readiness spec and plan"
```

- [ ] **Step 2: Ensure all earlier reference-rename edits are committed**

```bash
git status -sb
```

Expected: clean tree (all edits committed across tasks). If `package.json`/`README.md`/`SKILL.md` still show modified, commit them:

```bash
git add package.json README.md skills/hinto-cli/SKILL.md
git commit -m "chore: finalize @hintoai/cli rename and skill self-bootstrap"
```

- [ ] **Step 3: Full local verification (the whole gate)**

```bash
npm ci
npm run build
npm run lint
npx tsc --noEmit
npm test
npm run validate:skill
VER=$(node dist/index.js --version); PKG=$(node -p "require('./package.json').version"); test "$VER" = "$PKG" && echo "version OK"
node dist/index.js --help >/dev/null && echo "help OK"
npm pack --dry-run
```

Expected: every step passes; `version OK`; `help OK`; `npm pack` lists `dist/` and not `src/`.

- [ ] **Step 4: Push the branch and open a PR (no publish)**

```bash
git push -u origin chore/release-readiness
```

Then open a PR `chore/release-readiness → main`. Do NOT merge a Changesets version PR until `NPM_TOKEN` is set and you intend to publish.

---

## Out-of-band follow-ups (user actions — cannot be automated here)

1. Reserve the npm `hintoai` scope (npmjs.com) and add `NPM_TOKEN` as a repo secret.
2. `git remote set-url origin https://github.com/hintoai/hinto-cli.git` (if not already).
3. Replace `@hintoai/maintainers` in CODEOWNERS and `security@hinto.ai` with real values.
4. Enable branch protection on `main` (require CI + review).
5. After first publish: add a Homebrew tap; list the skill in the registry.

---

## Self-Review

**Spec coverage:** All spec sections map to tasks — packaging/legal (T1), release automation (T7, T9), CI gates (T8), tooling/Biome (T2), TS strictness (T3), CLI UX completions (T5) + output/version fix (T4), security (T10, T11), governance (T10), skill validator (T6), README (T12), batch move (T0), earlier rename edits committed (T13).

**Placeholders:** None — every code/config step contains full content. CODEOWNERS handle and security email are explicitly flagged as user-replaceable, not TBD logic.

**Type/name consistency:** `registerCompletion` defined in T5 and imported identically in T5 Step 4. `validate:skill` script name consistent across T1/T6/T8/T11. `version-packages`/`release` scripts defined in T1 and used in T9. `NON_GROUP` set in validator accounts for `init` + `completion` (the only non-API command files after batch removal).
