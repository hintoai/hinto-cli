# CLAUDE.md — working in the hinto-cli repo

Context for AI agents and contributors working on `@hintoai/cli`. Read this before making changes.

## What this is

`@hintoai/cli` is the terminal interface to the **Hinto AI** API (videos → articles/docs → published content). It is a standalone TypeScript CLI built on **commander**, published to npm, and it ships an **agent skill** so AI agents can drive it.

- **npm package:** `@hintoai/cli`  ·  **command users type:** `hinto`  (these differ — do NOT guess `@hinto/cli`, it does not exist)
- **Repo:** `hintoai/hinto-cli` (public)  ·  **API host:** `https://app.hintoai.com` (NOT `hinto.ai` — that domain does not exist)
- **Marketing site:** `https://hintoai.com`

## Critical facts (these have caused real bugs — keep them right)

1. **Package name is `@hintoai/cli`, command is `hinto`.** Install/upgrade/reference always uses `@hintoai/cli`. Agents tend to guess `@hinto/cli` from the command name — that 404s.
2. **Default API base URL is `https://app.hintoai.com`.** Set in `src/index.ts` (config fallback) and `src/commands/init.ts` (`--api-url` default). The API lives at `<baseUrl>/api/external/v2` (`src/api/client.ts`). `app.hinto.ai` does not resolve.
3. **API keys are per-project**, created in the app at **Project → Settings → API Keys & Webhooks → New Api Key**. There is no account-level key page. The key determines which project the CLI acts on.
4. **`hinto --version` reads from `package.json` at runtime** (`src/index.ts`) — never hardcode it; Changesets bumps the version.

## Repo layout

```
src/
  index.ts              # entry: registers commands, reads version from package.json, resolves --api-url
  config.ts             # ~/.hinto/config.json (mode 0600); HINTO_API_KEY env overrides stored key
  api/client.ts         # axios instance: X-API-Key header, baseURL + /api/external/v2, error→CliError
  api/<resource>.ts     # thin API wrappers (articles, videos, folders, generate, project, publish, templates, export)
  commands/<group>.ts   # each exports register<Group>(program, client); registered in index.ts
  commands/completion.ts# `hinto completion bash|zsh|fish` (static scripts)
  output.ts             # printJson / printTable / printKeyValue (data→stdout)
  errors.ts             # CliError + exitWithError (errors→stderr, exit 1)
  poll.ts               # async job polling
skills/hinto-cli/
  SKILL.md              # the agent skill (install, auth, working style, category routing)
  references/<group>.md # per-command-group reference docs the skill points to
scripts/validate-skill.mjs  # CI check: SKILL.md frontmatter + SKILL↔references↔commands sync + no-key-logging guard
tests/                  # jest + nock; uses tsconfig.test.json
.changeset/             # Changesets (release automation)
.github/workflows/      # ci.yml, release.yml
```

## Conventions

- **Lint/format:** Biome (`npm run lint`, `npm run format`). `package.json`/`package-lock.json` are Biome-ignored (npm/changesets reformat them — do not fight it). `noForEach`/`noDelete` are intentionally disabled.
- **TypeScript:** strict + `noUncheckedIndexedAccess` etc. Tests use `tsconfig.test.json` (relaxes index access for fixtures).
- **Output contract:** data → stdout (`output.ts`), errors → stderr with exit 1 (`errors.ts`), `--json` everywhere, spinners → stderr. `chalk@4` auto-honors `NO_COLOR`.
- **Secrets:** never log the API key. The validator greps for it in `console.*`/`stdout.write`. Config is written `0600`.

## Adding or changing a command (DO ALL FOUR)

CI's `validate:skill` enforces the first three stay in sync:

1. `src/commands/<group>.ts` — implement, register in `src/index.ts`.
2. `skills/hinto-cli/references/<group>.md` — reference doc (filename stem must match the command group).
3. `skills/hinto-cli/SKILL.md` — add/adjust the "Category Routing" row and any examples.
4. `npm run changeset` — add a changeset describing the user-facing change.

`init` and `completion` are CLI-only utilities exempt from the references rule (see `NON_GROUP` in `scripts/validate-skill.mjs`).

## Local checks (run before every PR)

```bash
npm run build          # tsc
npm run lint           # Biome
npx tsc --noEmit       # typecheck
npm test               # jest (mock URLs in tests are nock fixtures, not the real host)
npm run validate:skill # skill ↔ references ↔ commands sync + key-logging guard
node dist/index.js --version   # must equal package.json version
```

## How releases work (Changesets + OIDC Trusted Publishing)

Steady state, token-free:

1. Make changes on a branch, include a changeset (`npm run changeset`), open a PR, get CI green, merge to `main`.
2. On merge, `release.yml` runs and **auto-opens/updates a "Version Packages" PR** (consumes changesets, bumps version, writes CHANGELOG).
3. Merge the version PR → `release.yml` runs `changeset publish` → publishes to npm via **OIDC Trusted Publishing** with provenance.

**Three org-policy constraints are already worked around in `release.yml` — do not "simplify" them away:**

- The `hintoai` org **blocks GitHub Actions from creating PRs** → the workflow uses a `RELEASE_PAT` repo secret (a user PAT) for checkout + the changesets step, not `GITHUB_TOKEN`.
- The org **enforces 2FA-on-publish** → no npm token works; publishing is via **OIDC** (`id-token: write`, no `NPM_TOKEN`). Requires Node ≥ 22.14 / npm ≥ 11.5.1 (workflow uses Node 24 + `npm i -g npm@latest`).
- **npm provenance requires a PUBLIC repo** → the repo must stay public (also required for the skill-first install below).

npm-side: the `@hintoai/cli` package has a **Trusted Publisher** configured (GitHub Actions, repo `hintoai/hinto-cli`, workflow `release.yml`). The only repo secret is `RELEASE_PAT`.

## Skill distribution — two channels, do not confuse them

- **The skill reaches users via the REPO, not npm.** The npm tarball ships only `dist/` (the CLI binary), NOT the skill. Users get/update the skill with `npx skills add hintoai/hinto-cli` / `npx skills update`, which clones the repo.
- **Per-agent install locations differ.** `npx skills add` installs to `~/.agents/skills/` for most agents, but **Claude Code reads `~/.claude/skills/`**. To update the Claude Code copy specifically: `npx skills add hintoai/hinto-cli -a claude-code`. A stale `~/.claude/skills/hinto-cli` is a common cause of "the skill seems out of date."
- So a SKILL.md change only needs a merge to `main` to reach users; the npm version bump is incidental.

## Parked work

- `feat/generate-batch` branch holds the `hinto generate batch` command — kept off `main` because its backend (`/batches`) isn't live. When it ships: register it, add `references/generate-batch.md` (or fold into `generate.md`), remove it from the validator exemption if needed.

## Specs & plans

Design/implementation history lives in `docs/superpowers/specs/` and `docs/superpowers/plans/`.
