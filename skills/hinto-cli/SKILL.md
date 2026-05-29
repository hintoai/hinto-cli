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

```bash
# 1. Install the CLI globally
npm install -g @hinto/cli

# 2. Copy this skill to your Claude skills directory
cp -r <hinto-cli-repo>/skills/hinto-cli ~/.claude/skills/hinto-cli
```

## Authentication

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
hinto init --key hinto_... --api-url https://staging.hinto.ai
# or per-command:
hinto articles list --api-url https://staging.hinto.ai
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
3. **Use `--wait` for async jobs** — when the user needs the result before moving on (generate, publish, retranslate). Without `--wait`, the command returns immediately with a `jobId`.
4. **Check auth first** — if a command returns `UNAUTHORIZED`, verify `HINTO_API_KEY` is set or `hinto init` has been run.
5. **Spinner goes to stderr** — stdout stays clean for piping even with `--wait`.

## Core Workflow: Upload → Generate → Publish

```bash
# 1. Upload a local video file
hinto videos upload --file ./video.mp4 --json
# → { "videoId": "...", "status": "pending" }

# OR import from a URL (returns a Job object — poll until completed to get videoId)
hinto videos import --url https://example.com/video.mp4 --json
# → { "jobId": "...", "type": "import_video_url", "status": "pending", "output": null, ... }
# Then poll: hinto generate status <jobId> — completed output contains the videoId

# 2. Wait until the video is ready
hinto videos status <videoId> --json
# → { "videoId": "...", "status": "ready", ... }

# 3. List available templates
hinto templates list --json

# 4. Generate an article and wait for completion
hinto generate start --video <videoId> --template <templateId> --wait --json

# 5. Publish the project (synchronous — returns immediately)
hinto publish now --json
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

## Output Checklist

Leave the user with:
- The command that was run and its output
- The `jobId` if the operation is async and `--wait` was not used
- The next verification step (e.g. `hinto videos status <id>`, `hinto generate status <jobId>`)
- Any scope or auth caveats that affected the result
