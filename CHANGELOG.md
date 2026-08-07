# @hintoai/cli

## 0.8.0

### Minor Changes

- 3bdcb14: Add article brief support: `--brief` on `articles create`, `articles create-empty`, `articles update`, and `generate start`; `--clear-brief` on `articles update`; `--brief-addition` on `articles regenerate`. `articles get` now shows the brief and `articles versions` shows each run's change request.

## 0.7.0

### Minor Changes

- d1ead4f: Upload large videos in chunks, fixing the HTTP 524 failures reported on files
  above roughly 200 MB.

  Previously the whole file went up as a single PUT, which outlived the ~100s
  gateway timeout in front of storage on any transfer slower than that. Files over
  16 MB now use S3 multipart upload with per-part retry, so one slow or dropped
  part no longer fails the entire transfer. Part size and upload concurrency are
  tuned so a single request stays well inside the gateway window even on a slow
  uplink.

  Two related fixes: the CLI now checks with the server before reporting an upload
  failure, so a transfer that actually completed is no longer reported as an error;
  and files above the 2 GB maximum are rejected locally before any bytes move.

## 0.6.0

### Minor Changes

- fd67044: Add `hinto articles set-translation <id>` to upload a locally-produced translation for an article. It writes your translated title, Markdown content, meta description, keywords, and FAQ JSON-LD directly and marks the translation `status: manual` so Hinto's auto-translator won't overwrite it. `--content` and `--faq-jsonld` accept `@filepath`; omit `--slug` to preserve the existing localized slug.

## 0.5.0

### Minor Changes

- 9822725: Add `--wait` flag to `hinto videos upload`

  Blocks until the uploaded video finishes server-side processing and reaches `ready` status (polls every 3s, 10 min timeout). Without `--wait` the command returns immediately as before.

## 0.4.0

### Minor Changes

- 143ddb9: `hinto articles update` now supports `--content <md|@file>` to replace an
  article's body, so you no longer need to delete + recreate to change body text.
  Requires the API release that added content updates to `PUT /articles/:id`.

## 0.3.5

### Patch Changes

- 59f8378: Add CLAUDE.md (canonical contributor/agent working guide) and AGENTS.md pointer,
  documenting repo layout, conventions, the add-a-command checklist, the
  Changesets + OIDC release pipeline and its org-policy workarounds, and the
  skill-distribution model.
- fa0aa88: Isolate config-file tests from the real `~/.hinto/config.json` and from each other,
  fixing intermittent CI flakiness (parallel test files racing on the shared config
  path). `config.ts` now resolves its path lazily via `configPath()` and honors a
  `HINTO_CONFIG_DIR` override; tests point it at a per-worker temp dir.

## 0.3.4

### Patch Changes

- 2d5dfc8: Fix the default API base URL: it pointed to the non-existent `https://app.hinto.ai`
  (DNS failure on every command). The correct host is `https://app.hintoai.com`.
  Updated the runtime defaults (`init` and the client fallback) and all docs.

  Existing users who already ran `hinto init` must re-run it once to overwrite the
  old base URL stored in `~/.hinto/config.json`.

## 0.3.3

### Patch Changes

- 9708b2c: Document where to get the API key: keys are per-project, created at Project
  Settings → API Keys & Webhooks → New Api Key in the Hinto app. Fixes agents/users
  looking for a non-existent account-level key page.

## 0.3.2

### Patch Changes

- fa0185d: Skill: make the npm package name (`@hintoai/cli`) unmissable and add explicit
  upgrade instructions, so agents stop guessing the non-existent `@hinto/cli` when
  asked to install or upgrade.

## 0.3.1

### Patch Changes

- b3bbbdb: Point the package `homepage` to hintoai.com and add an "About Hinto AI" section
  with site links to the README.

## 0.3.0

### Minor Changes

- 575a732: Upgrade to commander v15 and raise the minimum Node.js version to 20 (commander
  v15 requires Node 20+). The CI matrix now covers Node 20, 22, and 24.

### Patch Changes

- e3543de: Upgrade Biome to v2 (config migrated to the v2 schema). Removed unused imports and
  fixed a `forEach` callback flagged by the stricter v2 recommended rules. No runtime
  behavior change.

## 0.2.0

### Minor Changes

- 959f81d: First public release: rename to `@hintoai/cli`, skill-first install via
  `npx skills add hintoai/hinto-cli`, shell completions, version read from
  package.json, and full CI/release automation.

Changelog is maintained automatically by Changesets. See release entries below.
