# @hinto/cli

Command-line interface for the [Hinto AI](https://hinto.ai) API. Manage videos, articles, folders, templates, and publishing from your terminal or from AI agents and scripts.

## Installation

```bash
npm install -g @hinto/cli
```

Requires Node.js 18+.

## Authentication

Run `init` once with your API key to store credentials locally:

```bash
hinto init --key <your-api-key>
```

Credentials are stored in `~/.hinto/config.json` with `0600` permissions (owner-read only). You can override the stored key at any time with the `HINTO_API_KEY` environment variable — the env var always takes precedence.

## Global flags

| Flag | Description |
|------|-------------|
| `--api-url <url>` | Override the Hinto base URL (useful for local dev or self-hosted) |
| `--json` | Output raw JSON instead of human-readable tables / key-value pairs |
| `--version` | Print CLI version |
| `--help` | Print help for any command |

## Commands

### `hinto project`

```bash
hinto project get
hinto project get --json
hinto project structure --json
hinto project update --name "New Name"
hinto project languages
hinto project retranslate --lang fr             # fire-and-forget
hinto project retranslate --lang fr --wait      # block until done
```

`project get --json` — the response is wrapped in a `project` key:

```json
{
  "project": {
    "id": "cc63bccf-4b76-4672-b46f-92a9c0a01567",
    "name": "My Docs",
    "url_slug": "my-docs",
    "description": null,
    "language": "en",
    "is_published": true,
    "logo_url": null,
    "project_type": "docs",
    "is_archived": false,
    "created_at": "2026-01-10T09:00:00Z",
    "custom_domain": null,
    "custom_domain_verified": false
  }
}
```

### `hinto templates`

```bash
hinto templates article              # article templates for this project type
hinto templates article --json
hinto templates structure            # structure templates for this project type
hinto templates structure --json
```

Templates are automatically scoped to your project type.

`templates article --json` — `requires_video` tells you whether a template needs a video to generate from:

```json
{
  "templates": [
    {
      "id": 1,
      "name": "Tutorial",
      "description": "Step-by-step guide format",
      "requires_video": true,
      "image_url": "https://cdn.hinto.ai/templates/tutorial.png",
      "sort_order": 1
    }
  ]
}
```

### `hinto folders`

```bash
hinto folders list
hinto folders list --json
hinto folders get <id>
hinto folders get <id> --json
hinto folders create --name "Release Notes"
hinto folders create --name "Q2" --parent <parentId>
hinto folders update <id> --name "Q3"
hinto folders move <id> --parent <newParentId>  # move into another folder
hinto folders move <id>                         # move to root
hinto folders delete <id>
```

`folders create --json`:

```json
{ "id": 7, "name": "Release Notes", "parent_id": null }
```

> **Note:** `folders move` does **not** return the updated folder — it returns a confirmation object:
>
> ```json
> { "message": "Folder moved", "parentId": null }
> ```

### `hinto articles`

```bash
hinto articles list
hinto articles list --folder <folderId>
hinto articles list --json

hinto articles get <id>
hinto articles get <id> --json

# --content is required; pass a Markdown string or a @filepath
hinto articles create --title "Getting Started" --content "# Hello\n\nWorld."
hinto articles create --title "From file" --content @path/to/article.md
hinto articles create --title "In a folder" --content "..." --folder <folderId>

hinto articles update <id> --title "New Title"
hinto articles update <id> --slug "new-slug"

hinto articles duplicate <id>
hinto articles move <id> --folder <folderId>
hinto articles regenerate <id>

hinto articles versions <id>
hinto articles restore <id> --vid <vId>

hinto articles translations <id>
hinto articles translate <id> --lang fr

hinto articles delete <id>
```

`articles list --json` — includes a `pagination` object:

```json
{
  "articles": [
    {
      "id": 42,
      "title": "Getting Started",
      "slug": "getting-started",
      "folder_id": null,
      "inserted_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-05-01T14:32:00Z"
    }
  ],
  "pagination": { "limit": 50, "offset": 0, "count": 1 }
}
```

`articles get <id> --json` — note the `metadata` wrapper for SEO fields, and that `content` is the full rendered output in the requested format:

```json
{
  "id": 42,
  "title": "Getting Started",
  "slug": "getting-started",
  "format": "markdown",
  "content": "# Getting Started\n\nWelcome to Hinto.",
  "metadata": {
    "metaDescription": null,
    "metaKeywords": null,
    "jsonLd": null,
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-05-01T14:32:00Z"
  }
}
```

`articles create --json` — returns only the essentials (`slug` may be `null` immediately after creation); fetch with `articles get` if you need the full article:

```json
{ "id": 42, "title": "Getting Started", "slug": null }
```

> **Note:** `articles move` does **not** return the updated article — it returns a confirmation object:
>
> ```json
> { "message": "Article moved", "folderId": 7 }
> ```

### `hinto videos`

```bash
hinto videos list
hinto videos list --json
hinto videos get <videoId>
hinto videos status <videoId>
hinto videos import --url https://example.com/video.mp4
hinto videos delete <videoId>
```

### `hinto generate`

```bash
# fire-and-forget with explicit template
hinto generate start --video <videoId> --template <templateId>

# fire-and-forget with auto-selected template (optional --template)
hinto generate start --video <videoId>

# block until the job completes
hinto generate start --video <videoId> --template <templateId> --wait --json

# without --template, server picks the default
hinto generate start --video <videoId> --wait --json

# check an existing job
hinto generate status <jobId> --json

# generate / refresh project structure
hinto generate structure --video <videoId>
hinto generate structure --video <videoId> --wait
```

`generate start --json` (fire-and-forget) — use `jobId` to poll status:

```json
{
  "jobId": "job_a1b2c3d4",
  "articleId": 42,
  "status": "pending",
  "message": "Article generation started. Poll the job status endpoint for updates."
}
```

`generate status <jobId> --json` once complete:

```json
{
  "jobId": "job_a1b2c3d4",
  "type": "generate_article",
  "status": "completed",
  "output": { "articleId": 42 },
  "error": null,
  "createdAt": "2026-05-16T10:00:00Z",
  "completedAt": "2026-05-16T10:02:34Z"
}
```

Possible `status` values: `pending` · `running` · `completed` · `failed`.

### `hinto export`

```bash
hinto export article <id> --format md           # print Markdown to stdout
hinto export article <id> --format html         # print HTML to stdout
hinto export article <id> --format md --out article.md   # write to file

hinto export folder <id> --out folder.zip
hinto export project --out project.zip
```

### `hinto publish`

```bash
hinto publish status
hinto publish status --json
hinto publish now                               # fire-and-forget
hinto publish now --wait                        # block until live
hinto publish now --wait --json
hinto publish republish
hinto publish republish --wait
```

`publish status --json` — the `status` field is a convenience alias derived from `isPublished`:

```json
{
  "isPublished": true,
  "slug": "my-docs",
  "url": "https://my-docs.hintoai.com",
  "publicationId": "pub_xyz789",
  "publishedAt": "2026-04-20T09:00:00Z",
  "articlesCount": 12,
  "foldersCount": 3,
  "status": "published"
}
```

When not yet published, `status` is `"unpublished"` and `url`, `publicationId`, `publishedAt`, `articlesCount`, `foldersCount` are all `null`.

## Machine-readable output (`--json`)

Every command that returns data supports `--json`. Output is newline-terminated JSON suitable for piping into `jq` or consuming from scripts and AI agents:

```bash
hinto articles list --json | jq '.articles[] | .title'
hinto project get --json | jq '.project.id'
hinto publish status --json | jq '.status'
hinto templates list --json | jq '[.templates[] | select(.requires_video) | .id]'
```

When an error occurs with `--json`, stdout is always empty and the error message goes to stderr — so it is safe to parse stdout without guarding for error objects.

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (invalid API key, not found, network error, etc.) |

## Async jobs (`--wait`)

Commands that start background jobs — `generate start`, `publish now`, `publish republish`, `project retranslate` — default to fire-and-forget: they print the job metadata and return exit 0 immediately. Pass `--wait` to poll until the job completes (or fails) and print its output.

## Environment variables

| Variable | Description |
|----------|-------------|
| `HINTO_API_KEY` | Override the API key stored in `~/.hinto/config.json` |

## Development

### Setup

```bash
git clone <repo-url>
cd hinto-cli
npm install
npm run build      # compile TypeScript → dist/
npm test           # run unit tests (nock-based, no network required)
```

### Running locally without installing globally

Use `node dist/index.js` directly — no `npm link` or global install needed:

```bash
npm run build
node dist/index.js --api-url http://localhost:3000 project get
```

Or set a shell alias for the session:

```bash
alias hinto="node $(pwd)/dist/index.js"
hinto --api-url http://localhost:3000 videos list
```

Set `HINTO_API_KEY` in your environment to avoid passing the key on every command:

```bash
export HINTO_API_KEY=hinto_...
```

### Testing against a local server

Point the CLI at the Next.js dev server running on port 3000 (or the e2e port 3099):

```bash
node dist/index.js --api-url http://localhost:3000 videos list --json
```

Grab an API key from the local Supabase DB or from the e2e test setup.

### Skill development

The Claude Code skill lives in `skills/hinto-cli/`. After editing any file there, copy it to Claude's global skills directory so it takes effect immediately:

```bash
cp -r skills/hinto-cli/. ~/.claude/skills/hinto-cli/
```

**Rule:** whenever you change a CLI flag or command behaviour, update **both**:
1. The relevant `skills/hinto-cli/references/*.md` file
2. The usage examples in this `README.md`

Then copy and commit together so the repo and the local skill stay in sync.
