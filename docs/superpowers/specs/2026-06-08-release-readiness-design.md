# Release Readiness Design — @hintoai/cli

**Date:** 2026-06-08
**Status:** Approved (brainstorming) → ready for implementation plan
**Repo:** `hintoai/hinto-cli` (npm package `@hintoai/cli`)

## Goal

Take `@hintoai/cli` from "works locally" to a professional, publicly publishable CLI
that supports both install flows:

- **Skill-first:** `npx skills add hintoai/hinto-cli` → skill bootstraps the CLI.
- **CLI-first:** `npm install -g @hintoai/cli` → README points to the skill.

This covers packaging, release automation, CI quality gates, security posture,
contributor governance, skill quality, CLI UX polish, and documentation.

## Scope

### In scope (implemented in this repo)

1. **Packaging/legal** — `LICENSE` (MIT), `package.json` polish.
2. **Release automation** — Changesets: config, seed changeset, `CHANGELOG.md`,
   rewritten `release.yml` that publishes with npm provenance on version-PR merge.
3. **CI gates** — `ci.yml`: Biome lint + `tsc --noEmit` typecheck + Jest, matrix
   (Node 18/20/22 × ubuntu/macos); a `package` job that builds, smoke-tests the
   built binary, and asserts `npm pack` contents; a `skill-validate` job.
4. **Tooling** — Biome config + `lint`/`format` scripts; stricter TS flags.
5. **CLI UX** — output-contract lock-in; `hinto completion bash|zsh|fish`.
6. **Security** — `SECURITY.md`; token-hygiene audit (no key logging, `0600`
   verified by test); `npm audit`/osv in CI; Dependabot (npm + actions).
7. **Governance** — `CONTRIBUTING.md`, issue/PR templates, `CODEOWNERS`.
8. **Skill quality** — `scripts/validate-skill.mjs`: validates SKILL.md frontmatter
   and SKILL.md ↔ `references/` ↔ `src/commands/` consistency, with a WIP exemption
   allowlist.
9. **README** — badges, quickstart, completions docs, dual-install docs.

### Out of scope

- External actions (the user performs these): reserve npm `hintoai` scope, add
  `NPM_TOKEN` secret, `git remote set-url`, enable branch protection on `main`,
  the actual publish.
- Phase 6 growth: Homebrew tap (deferred to post-first-publish; needs a separate
  `hintoai/homebrew-tap` repo and a published version to point at).

## Architecture

### Workflows (separation of concerns)

**`.github/workflows/ci.yml`** — on PR + push to `main`:
- `lint` — Biome check.
- `typecheck` — `tsc --noEmit`.
- `test` — Jest, matrix Node 18/20/22 × {ubuntu, macos}.
- `package` — `npm run build` → smoke test (`node dist/index.js --version`
  asserts it equals `package.json` version; `node dist/index.js --help` exits 0)
  → `npm pack --dry-run` asserting `dist/` present and no `src/`/secrets leak.
- `skill-validate` — runs `scripts/validate-skill.mjs`.

**`.github/workflows/release.yml`** — on push to `main`, replaces the current
tag-triggered workflow:
- Uses the Changesets GitHub Action. If unreleased changesets exist, it
  opens/updates a "Version Packages" PR. When that PR merges (version files
  change), it builds and runs `npm publish` with `permissions: { id-token: write }`
  for provenance, and creates the GitHub release + tag.
- Requires `NPM_TOKEN` secret. Publishes only via the Changesets flow — never on
  an arbitrary push — preventing accidental publishes.

### File layout (new/changed)

```
LICENSE                              (MIT)
biome.json
.changeset/config.json
.changeset/README.md
.changeset/<seed>.md                 (seed changeset for first release)
CHANGELOG.md                         (seeded)
SECURITY.md
CONTRIBUTING.md
.github/CODEOWNERS
.github/ISSUE_TEMPLATE/bug_report.md
.github/ISSUE_TEMPLATE/feature_request.md
.github/PULL_REQUEST_TEMPLATE.md
.github/dependabot.yml               (npm + github-actions)
.github/workflows/ci.yml             (new)
.github/workflows/release.yml        (rewritten)
scripts/validate-skill.mjs
src/commands/completion.ts           (registered in src/index.ts)
src/index.ts                         (version read from package.json; register completion)
tsconfig.json                        (stricter flags)
package.json                         (scripts: lint, format, validate-skill; deps for changeset/biome)
README.md                            (badges, quickstart, completions, dual-install)
docs/superpowers/specs/2026-06-08-release-readiness-design.md  (this file)
```

## Behavioral details (grounded in current `src/`)

### Correctness fixes

- **Version drift (real bug):** `src/index.ts` currently hardcodes
  `.version('0.1.0')`. Changesets bumps `package.json`, so this drifts. Fix: read
  `version` from `package.json` at runtime so `hinto --version` always matches the
  published version. The smoke test enforces this equality.
- **`generate-batch.ts` should not be on `main` (mistake):** the batch command was
  committed to `main` (commit `188f0cd`, the single unpushed commit; touches
  `src/commands/generate-batch.ts` + 2 lines in `src/commands/generate.ts`) and is
  registered/live in the CLI, but its backend `/batches` endpoint is **not** live.
  It should never have landed on `main`. Preparation step (done first, before the
  release-readiness work): preserve the commit on a `feat/generate-batch` branch,
  then remove it from `main` so `main` reflects only shipped code. Because batch is
  removed from `main`, the skill validator needs **no** WIP exemption allowlist.

  Move procedure (lossless — batch is the tip commit):
  1. `git branch feat/generate-batch 188f0cd` — preserve the batch commit.
  2. Reset `main` to `origin/main` (`933b204`); restore `src/commands/generate.ts`
     to the no-batch version and delete `src/commands/generate-batch.ts` from the
     working tree. Keep all release-readiness working changes intact.
  3. When the backend ships, continue on `feat/generate-batch`, add its reference
     doc + SKILL.md row, and merge.

### Token hygiene (already strong — lock in, don't rewrite)

- `config.ts` writes config at `0600`, dir at `0700`; key only in the `X-API-Key`
  header; no key logging. Actions: a test asserting the `0600` file mode, and a
  validator guard that fails if `apiKey`/`X-API-Key` appears in a `console.log`/
  `process.stdout.write`.

### Output contract (strong — minimal change)

- Data → stdout, errors → stderr (exit 1), `--json` via `printJson`. `chalk@4`
  already honors `NO_COLOR`/non-TTY. No change needed beyond the version fix above.

### Shell completions

- `src/commands/completion.ts` registers `hinto completion <bash|zsh|fish>`,
  printing a static hand-written completion script covering top-level command
  groups (videos, articles, folders, generate, project, publish, templates, init,
  export, completion) and global flags (`--json`, `--api-url`, `--help`,
  `--version`). Static (not runtime introspection) for zero startup cost. README
  documents the per-shell source/eval line.

### Skill-sync validator (`scripts/validate-skill.mjs`)

- Parses SKILL.md YAML frontmatter; requires `name` + `description`.
- Cross-checks the "Category Routing" table rows ↔ files in
  `skills/hinto-cli/references/`.
- Asserts each `src/commands/*.ts` group has a corresponding reference doc. (No WIP
  exemption needed — `generate-batch` is moved off `main` in the preparation step.)
- Exits non-zero on any mismatch. Wired into the `skill-validate` CI job and an
  npm script (`npm run validate:skill`).

## Tooling decisions

- **Lint/format:** Biome (matches the main monorepo). `biome.json` with `lint` and
  `format` scripts.
- **TS strictness:** add `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `noFallthroughCasesInSwitch` on top of existing `strict: true`. Fix any new
  errors surfaced.
- **Release:** Changesets (chosen over semantic-release for control + clean
  changelog without mandated commit-message format).

## Testing & verification strategy

Run during implementation (per logical chunk) and again at the end:

- `npm run build` — compiles clean.
- `npm run lint` — Biome passes.
- `npm run test` — Jest passes (including new config-mode test).
- `node dist/index.js --version` equals `package.json` version; `--help` exits 0.
- `npm run validate:skill` — passes.
- `npm pack --dry-run` — `dist/` present, no `src/`/secrets.

## Working method

- **Step 0 (preparation):** move the `generate-batch` commit to a
  `feat/generate-batch` branch and remove it from `main` (see Behavioral details).
  Done before any release-readiness edits.
- Release-readiness work proceeds on a feature branch off the cleaned `main`;
  commit in logical chunks with meaningful messages.
- Do **not** push, publish, run `npm publish`, or alter the git remote.
- Surface any blocked/external step explicitly in the final summary.

## Out-of-band follow-ups (user)

1. Reserve npm `hintoai` scope; add `NPM_TOKEN` repo secret.
2. `git remote set-url origin https://github.com/hintoai/hinto-cli.git`.
3. Enable branch protection on `main` (require CI + review).
4. After first publish: Homebrew tap; list skill in the registry.
