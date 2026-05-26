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
      "folder_id": 456,
      "inserted_at": "2026-05-26T10:00:00Z",
      "updated_at": "2026-05-26T10:00:00Z"
    }
  ],
  "pagination": { "limit": 50, "offset": 0, "count": 1 }
}
```

The list response does **not** include `content` or `format` — use `hinto articles get <id>` for full content.

> **Note:** `slug` may be `null` for auto-generated articles (assigned when first published). `hinto articles list` accepts `--page <n>` and `--limit <n>` (defaults: page=1, limit=20).

---

### `hinto articles get <id>`

Get a single article with full content.

```bash
hinto articles get <id> [--json]
```

**`--json` response:**
```json
{
  "id": 123,
  "title": "How to deploy Next.js",
  "slug": "how-to-deploy-nextjs",
  "format": "markdown",
  "content": "# How to deploy Next.js\n\n...",
  "metadata": {
    "metaDescription": "Step-by-step guide.",
    "metaKeywords": ["nextjs", "deploy"],
    "jsonLd": null,
    "createdAt": "2026-05-26T10:00:00Z",
    "updatedAt": "2026-05-26T10:00:00Z"
  }
}
```

Add `?format=html` to get HTML content instead of markdown (not exposed as a CLI flag — use the API directly).

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

**`--json` response (201):**
```json
{ "id": 123, "title": "How to deploy Next.js", "slug": "how-to-deploy-nextjs" }
```

---

### `hinto articles update <id>`

Update an article's title, slug, or SEO fields.

```bash
hinto articles update <id> [--title "..."] [--slug "..."] [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--title <title>` | No | New title |
| `--slug <slug>` | No | New URL slug |

> **Note:** The API also accepts `meta_description` and `meta_keywords` but the CLI does not expose them as flags.

**`--json` response:**
```json
{ "id": 123, "title": "New Title", "slug": "new-slug", "updatedAt": "2026-05-26T10:00:00Z" }
```

---

### `hinto articles delete <id>`

Delete an article permanently.

```bash
hinto articles delete <id>
```

Prints: `Article <id> deleted.`

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
hinto articles move <id> --folder <folderId> [--json]
```

**Required:** `--folder <folderId>`

**`--json` response:**
```json
{ "message": "Article moved", "folderId": 456 }
```

`folderId` may be `null` if moved to the root.

---

### `hinto articles regenerate <id>`

Re-run AI generation on an existing article. Returns immediately with a `jobId`.

```bash
hinto articles regenerate <id> [--json]
```

**`--json` response (202):**
```json
{
  "jobId": "uuid",
  "articleId": 123,
  "status": "pending",
  "message": "Article regeneration started. Poll the job status endpoint for updates."
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
      "version_number": 3,
      "created_at": "2026-05-26T10:00:00Z",
      "created_by": "user-uuid",
      "change_description": null,
      "is_auto_save": false
    }
  ]
}
```

Use the version `id` (not `vId`) as the `--version` value in `hinto articles restore`.

---

### `hinto articles restore <id>`

Restore an article to a previous version.

```bash
hinto articles restore <id> --version <id> [--json]
```

**Required:** `--version <id>` — a version `id` from `hinto articles versions`

**`--json` response:** the restored article object.

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
      "language_code": "fr",
      "status": "completed",
      "title": "Comment déployer Next.js",
      "slug": "comment-deployer-nextjs",
      "has_content": true,
      "updated_at": "2026-05-26T10:00:00Z"
    }
  ]
}
```

Translation `status` values: `pending` | `processing` | `completed` | `manual`

---

### `hinto articles translate <id>`

Fetch the content of a specific translation. This **retrieves** an existing translation — it does not trigger a new one. To trigger translation, use `hinto project retranslate` or `POST /v2/articles/{id}/translations/{lang}` directly.

```bash
hinto articles translate <id> --lang <code> [--json]
```

**Required:** `--lang <code>` (e.g. `en`, `fr`, `de`, `es`)

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
hinto articles trigger-translate <id> --lang <code> [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--lang <code>` | Yes | Target language code (e.g. `fr`, `de`, `es`) |

**`--json` response (202):**
```json
{
  "jobId": "uuid",
  "articleId": 123,
  "languageCode": "fr",
  "status": "pending",
  "message": "Translation queued"
}
```

Track completion: `hinto generate status <jobId>`

---

## Errors

| Error code | HTTP | Meaning |
|---|---|---|
| `ARTICLE_NOT_FOUND` | 404 | Article ID does not exist in this project |
| `INSUFFICIENT_SCOPE` | 403 | `read` for get/list; `write` for create/update/delete/move/restore; `generate` for regenerate |
| `INVALID_LANGUAGE` | 400 | Language code is not recognized |
| `RATE_LIMITED` | 429 | 60 req/min per API key — retry after `Retry-After` seconds |
