---
name: hinto-cli
description: >
  Use this skill whenever the user wants to work with Hinto AI from the terminal.
  This includes installing the CLI, authenticating, and running any command for
  videos, articles, folders, generation, project settings, publishing, templates,
  or export. Trigger on phrases like "hinto", "upload a video to Hinto",
  "generate an article", "publish the project", "hinto articles list",
  "hinto generate start", "hinto export", "hinto init", or any time the user
  wants to use Hinto from the shell instead of the web UI.
metadata:
  version: 1.0.0
---

# Hinto CLI Skill

This skill covers all Hinto terminal workflows: installation, authentication, every command group, async job handling, and chaining commands together.

## Installation

This skill drives the `hinto` CLI.

> **Package name:** the command is `hinto`, but the npm package is **`@hintoai/cli`**.
> Do **not** guess `@hinto/cli` or `hinto` — those do not exist and will 404.
> Always install, upgrade, and reference the package as `@hintoai/cli`.

Before running any command, make sure the CLI is installed — if `hinto` is not on PATH, install it first:

```bash
# Install the CLI globally
npm install -g @hintoai/cli

# Verify
hinto --version
```

**To upgrade** to the latest version, run:

```bash
npm install -g @hintoai/cli@latest
```

Then authenticate (see below). If a `hinto` command fails with "command not found", re-run the install step above.

> Installing this skill itself (for any agent) is done with the universal skills CLI:
> `npx skills add hintoai/hinto-cli`

## Authentication

### Where to get the API key

API keys are **per project** (not account-wide) — each key is scoped to a single project, and the CLI acts on whichever project the key belongs to. To create one:

1. Open the project in the Hinto app (`https://app.hintoai.com`).
2. Click **Settings** (top bar) to open **Project Settings**.
3. Go to **API Keys & Webhooks** → **API Keys** tab.
4. Click **New Api Key** and copy the generated key.

### Configuring the key

Prefer the environment variable — it works in CI and overrides the config file:

```bash
export HINTO_API_KEY=hinto_...
```

For interactive/local use, run init once:

```bash
hinto init --key hinto_...
# Writes ~/.hinto/config.json — permissions 600
```

To target staging or a self-hosted instance, use `--api-url`:

```bash
hinto init --key hinto_... --api-url https://staging.hintoai.com
# or per-command:
hinto articles list --api-url https://staging.hintoai.com
```

## Global Flags

These flags work on **every** command:

| Flag | Purpose |
|---|---|
| `--json` | Output raw JSON to stdout — use when chaining commands or parsing output |
| `--api-url <url>` | Override base URL (staging, self-hosted) |

## Working Style

When this skill is active:

1. **Run commands via Bash** — execute `hinto` commands directly, don't just describe them.
2. **Use `--json` when chaining** — pipe or parse JSON output to feed the next command.
3. **Use `--wait` for async jobs** — supported on `generate start` and `generate structure` only. Without `--wait`, these return immediately with a `jobId`. `publish now`, `publish republish`, and `project retranslate` are always async (no `--wait`) — poll manually with `hinto generate status <jobId>`.
4. **Check auth first** — if a command returns `UNAUTHORIZED`, verify `HINTO_API_KEY` is set or `hinto init` has been run.
5. **Spinner goes to stderr** — stdout stays clean for piping even with `--wait`.

**Interaction patterns:**

6. **Ask vs. auto** — only prompt the user when there's a real choice (2+ options). With 0–1 options, proceed and state what you used.
7. **Confirm destructive actions** — before `articles delete` and `publish unpublish`, confirm with the user, stating exactly what will be removed or taken offline. Never run them speculatively.
8. **Output discipline** — end every task with: the command(s) run + result, any `jobId` for async work not waited on, links (`editUrl` / `previewUrl` when available), and the next verification step.

## Orientation — start here

Run these first to ground yourself in the project the key targets (the key is **per project** — you act on exactly one):

```bash
hinto project get --json          # name, type, isPublished, custom domain
hinto project structure --json    # folders + articles tree
hinto publish status --json       # is it live, and at what URL
```

If results don't match the user's expectation, the key likely targets a different project — the user must supply the correct key; you cannot switch projects.

## Scopes

Each API key carries scopes. Operations fail with `INSUFFICIENT_SCOPE` (403) when a scope is missing:

| Scope | Allows |
|---|---|
| `read` | get / list / status / structure / languages / versions / translations |
| `write` | create / update / delete / move / duplicate / restore / add-language / set-translation |
| `generate` | generate start / structure, regenerate, retranslate, trigger-translate |
| `publish` | publish now / republish / unpublish |

> The per-article translation route (`translate <id>`, `trigger-translate`, `set-translation`) is `generate`-gated, so those need `generate` — and `set-translation` needs `write` **on top of** `generate`. Project API keys created in the app carry all scopes by default, so this only matters for minimally-scoped keys.

Recovery: tell the user which scope is missing — a new key with that scope must be created in the app UI.

## ID & state gotchas

- Article and folder ids are **integers**; job ids are **uuids**.
- `slug` and `previewUrl` are **null until published** (and for articles not in the current publication snapshot).
- A video must be **`ready`** before `generate start` / `generate structure`.
- `generate structure` produces **empty stubs**, not full articles — see `references/product-behavior.md`.
- Rate limit: **60 req/min** per key (`RATE_LIMITED` 429 → wait `Retry-After`). Generation can return `QUOTA_EXCEEDED`.

## What the CLI cannot do (app UI only)

Do **not** invent commands for these — they live in the Hinto web app:
- Creating a project or an API key
- Workspace / billing management
- Branding and publishing-settings editing not exposed by a documented command

## Core Workflow: Upload → Generate → Publish

```bash
# 1. Upload a local video file
hinto videos upload --file ./video.mp4 --json
# → { "videoId": "..." }
# Files over 50 MB upload in chunks automatically — no extra flags. The maximum
# is 2 GB, checked locally before the transfer starts, so an oversize file fails
# immediately rather than after a long upload.

# OR import from a URL (returns a Job object — poll until completed to get videoId)
hinto videos import --url https://example.com/video.mp4 --json
# → { "jobId": "...", "type": "import_video_url", "status": "pending", "output": null, ... }
# Then poll: hinto generate status <jobId> — completed output contains the videoId

# 2. Wait until the video is ready
hinto videos status <videoId> --json
# → { "videoId": "...", "status": "ready", ... }

# 3. List available templates
hinto templates article --json

# 4. Generate an article and wait for completion
hinto generate start --video <videoId> --template <templateId> --wait --json

# 4b. Hand the user a link to the new article (editUrl always present; previewUrl when published)
hinto articles get <articleId> --json   # → includes editUrl + previewUrl

# 5. Publish the project (async — returns a jobId immediately)
hinto publish now --json
# → { "jobId": "...", "type": "publish", "status": "pending", ... }
# Poll: hinto generate status <jobId>
```

## Category Routing

Read the reference file for the relevant command group:

| Task | Reference file |
|---|---|
| Upload, import, manage videos | `references/videos.md` |
| Create, edit, move, translate articles | `references/articles.md` |
| Create and organize folders | `references/folders.md` |
| Generate articles or structure from video | `references/generate.md` |
| Project info, structure tree, languages | `references/project.md` |
| Publish, republish, unpublish | `references/publish.md` |
| Browse available templates | `references/templates.md` |
| Export articles, folders, or full project | `references/export.md` |
| Turn a video into content (one article vs. structure) | `references/content-from-video.md` |
| Common task recipes (upload→generate→publish, edit→republish, add images) | `references/recipes.md` |
| Product behavior (versioning/restore, stubs/auto-generate, images, translations) | `references/product-behavior.md` |

## Output Checklist

Leave the user with:
- The command that was run and its output
- The `jobId` if the operation is async and `--wait` was not used
- The next verification step (e.g. `hinto videos status <id>`, `hinto generate status <jobId>`)
- Any scope or auth caveats that affected the result
