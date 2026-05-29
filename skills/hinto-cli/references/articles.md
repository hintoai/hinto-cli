# Articles Reference

## Commands

### `hinto articles list`

List all articles in the project.

```bash
hinto articles list [--folder <id>] [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--folder <id>` | No | Filter by folder ID |

**`--json` response:**
```json
{
  "articles": [
    {
      "id": 123,
      "title": "How to deploy Next.js",
      "slug": "how-to-deploy-nextjs",
      "folderId": 456,
      "createdAt": "2026-05-26T10:00:00Z",
      "updatedAt": "2026-05-26T10:00:00Z"
    }
  ],
  "pagination": { "limit": 20, "offset": 0, "count": 1 }
}
```

The list response does **not** include `content` or `format` — use `hinto articles get <id>` for full content.

> **Note:** `slug` may be `null` for auto-generated articles (assigned when first published). `hinto articles list` accepts `--offset <n>` and `--limit <n>` (defaults: offset=0, limit=20).

---

### `hinto articles get <id>`

Get a single article with full content.

```bash
hinto articles get <id> [--format markdown|html] [--json]
```

| Flag | Default | Description |
|---|---|---|
| `--format <fmt>` | `markdown` | Return content as `markdown` or `html` |

**`--json` response:**
```json
{
  "id": 123,
  "title": "How to deploy Next.js",
  "slug": "how-to-deploy-nextjs",
  "folderId": null,
  "format": "markdown",
  "content": "# How to deploy Next.js\n\n...",
  "createdAt": "2026-05-26T10:00:00Z",
  "updatedAt": "2026-05-26T10:00:00Z",
  "metadata": {
    "metaDescription": "Step-by-step guide.",
    "metaKeywords": ["nextjs", "deploy"],
    "jsonLd": null
  }
}
```

---

### `hinto articles create`

Create an article from markdown content.

```bash
hinto articles create --title "..." --content "..." [--folder <id>] [--json]
hinto articles create --title "..." --content @article.md [--folder <id>] [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--title <title>` | Yes | Article title |
| `--content <content>` | Yes | Markdown string, or `@filepath` to read from file |
| `--folder <id>` | No | Place article in this folder |

**`@filepath` syntax:** prefix with `@` to read from a file, e.g. `--content @./article.md`

**`--json` response (201):** the full article object (same shape as `hinto articles get`).

```json
{
  "id": 123,
  "title": "How to deploy Next.js",
  "slug": null,
  "folderId": null,
  "format": "markdown",
  "content": "# How to deploy Next.js\n\n...",
  "createdAt": "2026-05-26T10:00:00Z",
  "updatedAt": "2026-05-26T10:00:00Z",
  "metadata": { "metaDescription": null, "metaKeywords": null, "jsonLd": null }
}
```

---

### `hinto articles create-empty`

Create an empty article with no content. Useful when you want to create a stub and fill in content later.

```bash
hinto articles create-empty [--title "..."] [--folder <id>] [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--title <title>` | No | Article title (defaults to untitled if omitted) |
| `--folder <id>` | No | Place article in this folder |

**`--json` response (201):** the full article object (same shape as `hinto articles get`).

```json
{
  "id": 124,
  "title": "Untitled",
  "slug": null,
  "folderId": null,
  "format": "markdown",
  "content": "",
  "createdAt": "2026-05-26T11:00:00Z",
  "updatedAt": "2026-05-26T11:00:00Z",
  "metadata": { "metaDescription": null, "metaKeywords": null, "jsonLd": null }
}
```

---

### `hinto articles update <id>`

Update an article's title, slug, or SEO fields.

```bash
hinto articles update <id> [--title "..."] [--slug "..."] [--meta-description "..."] [--meta-keywords "kw1,kw2"] [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--title <title>` | No | New title |
| `--slug <slug>` | No | New URL slug |
| `--meta-description <text>` | No | SEO meta description |
| `--meta-keywords <keywords>` | No | Comma-separated SEO keywords |

**`--json` response:** the full article object (same shape as `hinto articles get`).

```json
{
  "id": 123,
  "title": "New Title",
  "slug": "new-slug",
  "folderId": null,
  "format": "markdown",
  "content": "# New Title\n\n...",
  "createdAt": "2026-05-26T10:00:00Z",
  "updatedAt": "2026-05-26T10:00:00Z",
  "metadata": { "metaDescription": null, "metaKeywords": null, "jsonLd": null }
}
```

---

### `hinto articles delete <id>`

Delete an article permanently.

```bash
hinto articles delete <id> [--json]
```

Plain: `Article <id> deleted.`  
JSON: `{ "deleted": true }`

---

### `hinto articles duplicate <id>`

Create a copy of an article.

```bash
hinto articles duplicate <id> [--json]
```

**`--json` response:** the new article object (`id`, `title`, `slug`, new `id` assigned).

---

### `hinto articles move <id>`

Move an article to a different folder.

```bash
hinto articles move <id> [--folder <folderId>] [--json]
```

| `--folder <id>` | No | Destination folder — omit to move to root |

**`--json` response:** the full article object (same shape as `hinto articles get`), reflecting the new `folderId`.

```json
{
  "id": 123,
  "title": "How to deploy Next.js",
  "slug": "how-to-deploy-nextjs",
  "folderId": 456,
  "format": "markdown",
  "content": "# How to deploy Next.js\n\n...",
  "createdAt": "2026-05-26T10:00:00Z",
  "updatedAt": "2026-05-26T10:00:00Z",
  "metadata": { "metaDescription": null, "metaKeywords": null, "jsonLd": null }
}
```

`folderId` is `null` if moved to the root.

> To move an article to root (top level), omit `--folder`: `hinto articles move <id>`

---

### `hinto articles regenerate <id>`

Re-run AI generation on an existing article. Returns immediately with a `jobId`.

```bash
hinto articles regenerate <id> [--callback-url <url>] [--callback-secret <secret>] [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--callback-url <url>` | No | URL to POST a webhook to when the job completes or fails |
| `--callback-secret <secret>` | No | HMAC-SHA256 signing secret for the callback webhook. Requires `--callback-url`. |

**`--json` response (202):** the full Job object.

```json
{
  "jobId": "uuid",
  "type": "generate_article",
  "status": "pending",
  "output": null,
  "error": null,
  "createdAt": "2026-05-26T10:00:00Z",
  "completedAt": null
}
```

Poll `hinto generate status <jobId>` to track progress.

---

### `hinto articles versions <id>`

List the version history of an article.

```bash
hinto articles versions <id> [--json]
```

**`--json` response:**
```json
{
  "versions": [
    {
      "id": "uuid",
      "versionNumber": 3,
      "createdAt": "2026-05-26T10:00:00Z",
      "createdBy": "user-uuid",
      "changeDescription": null,
      "isAutoSave": false
    }
  ]
}
```

Use the version `id` as the `--vid` value in `hinto articles restore`.

---

### `hinto articles restore <id>`

Restore an article to a previous version.

```bash
hinto articles restore <id> --vid <id> [--json]
```

**Required:** `--vid <id>` — a version `id` from `hinto articles versions`

**`--json` response:**
```json
{ "message": "Version restored", "articleId": 123, "versionId": "uuid" }
```

> Use `hinto articles get <id>` if you need the restored content.

---

### `hinto articles translations <id>`

List all translations for an article.

```bash
hinto articles translations <id> [--json]
```

**`--json` response:**
```json
{
  "translations": [
    {
      "languageCode": "fr",
      "status": "completed",
      "title": "Comment déployer Next.js",
      "slug": "comment-deployer-nextjs",
      "metaDescription": null,
      "metaKeywords": null,
      "hasContent": true,
      "updatedAt": "2026-05-26T10:00:00Z"
    }
  ]
}
```

Translation `status` values: `pending` | `processing` | `completed` | `manual`

---

### `hinto articles translate <id>`

Fetch the content of a specific translation. This **retrieves** an existing translation — it does not trigger a new one. To trigger translation, use `hinto project retranslate` or `POST /v2/articles/{id}/translations/{lang}` directly.

```bash
hinto articles translate <id> --lang <code> [--format markdown|html] [--json]
```

| Flag | Required | Default | Description |
|---|---|---|---|
| `--lang <code>` | Yes | — | Language code (e.g. `en`, `fr`, `de`, `es`) |
| `--format <format>` | No | `markdown` | Content format: `markdown` or `html` |

**`--json` response:**
```json
{
  "languageCode": "fr",
  "status": "completed",
  "title": "Comment déployer Next.js",
  "slug": "comment-deployer-nextjs",
  "format": "markdown",
  "content": "# Comment déployer Next.js\n\n...",
  "metadata": {
    "metaDescription": null,
    "metaKeywords": null,
    "updatedAt": "2026-05-26T10:00:00Z"
  }
}
```

Returns `404` if the translation does not exist. Returns `400 INVALID_LANGUAGE` if the language code is not valid.

---

### `hinto articles trigger-translate <id>`

Queue translation of a single article into a target language.

```bash
hinto articles trigger-translate <id> --lang <code> [--callback-url <url>] [--callback-secret <secret>] [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--lang <code>` | Yes | Target language code (e.g. `fr`, `de`, `es`) |
| `--callback-url <url>` | No | URL to POST a webhook to when the translation job completes or fails |
| `--callback-secret <secret>` | No | HMAC-SHA256 signing secret for the callback webhook. Requires `--callback-url`. |

Plain: `Translation triggered. Job ID: <uuid>`

**`--json` response (202):**
```json
{
  "jobId": "uuid",
  "type": "translate",
  "status": "pending",
  "output": null,
  "error": null,
  "createdAt": "2026-05-29T10:00:00Z",
  "completedAt": null
}
```

---

## Errors

| Error code | HTTP | Meaning |
|---|---|---|
| `ARTICLE_NOT_FOUND` | 404 | Article ID does not exist in this project |
| `INSUFFICIENT_SCOPE` | 403 | `read` for get/list; `write` for create/update/delete/move/restore; `generate` for regenerate |
| `INVALID_LANGUAGE` | 400 | Language code is not recognized |
| `RATE_LIMITED` | 429 | 60 req/min per API key — retry after `Retry-After` seconds |
