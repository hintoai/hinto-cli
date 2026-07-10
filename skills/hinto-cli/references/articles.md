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

Update an article's title, slug, body content, or SEO fields. Use `--content` to replace the body with Markdown (string or `@filepath`). To re-generate content from the source video via AI instead, use `hinto articles regenerate <id>`.

```bash
hinto articles update <id> [--title "..."] [--slug "..."] [--content "# New body" | --content @body.md] [--meta-description "..."] [--meta-keywords "kw1,kw2"] [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--title <title>` | No | New title |
| `--slug <slug>` | No | New URL slug |
| `--content <md>` | No | New Markdown body (string or `@filepath`) — replaces the body |
| `--meta-description <text>` | No | SEO meta description |
| `--meta-keywords <keywords>` | No | Comma-separated SEO keywords |

> Updating `--content` replaces the article body, snapshots a version, and re-translates any existing translations. Requires API ≥ the release that added content updates. At least one field is required.

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

### `hinto articles set-translation <id>`

Upload a locally-produced translation for an article. Unlike `trigger-translate`
(which queues Hinto's own translator), this writes **your** translated content
directly and marks it `status: manual` so the auto-translator won't overwrite it.
Use it when you translate an article yourself and want to push the result back.

```bash
hinto articles set-translation <id> --lang <code> \
  --title <title> --content <markdown|@file> \
  [--meta-description <text>] [--meta-keywords <a,b,c>] \
  [--faq-jsonld <json|@file>] [--slug <slug>] [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--lang <code>` | Yes | Target language code (e.g. `es`, `fr`, `de`). Must be configured on the project. |
| `--title <title>` | Yes | Translated title |
| `--content <content>` | Yes | Translated **Markdown** body, as a string or `@filepath`. Converted to the article block format server-side. |
| `--meta-description <text>` | No | Translated meta description |
| `--meta-keywords <list>` | No | Comma-separated translated keywords → stored as an array |
| `--faq-jsonld <content>` | No | Translated FAQ/structured-data **JSON**, as a string or `@filepath` |
| `--slug <slug>` | No | Localized slug. **Omit to keep the existing slug** — when a language is added, Hinto auto-creates the translation row with a slug; omitting preserves it (no URL churn). |

Requires the `write` scope. Confirm the response shows `"status": "manual"`. Read
it back with `hinto articles translate <id> --lang <code>`.

**Example — push a translated article + FAQ from files:**
```bash
hinto articles set-translation 51 --lang es \
  --title "8 mejores alternativas a Loom (2026)" \
  --content @translations/es/FINAL_ARTICLE.md \
  --meta-description "Compara las mejores alternativas a Loom…" \
  --meta-keywords "alternativas a loom,competidores de loom" \
  --faq-jsonld @translations/es/faq-jsonld.json --json
```

---

## Errors

| Error code | HTTP | Meaning |
|---|---|---|
| `ARTICLE_NOT_FOUND` | 404 | Article ID does not exist in this project |
| `INSUFFICIENT_SCOPE` | 403 | `read` for get/list; `write` for create/update/delete/move/restore/set-translation; `generate` for regenerate/trigger-translate |
| `INVALID_LANGUAGE` | 400 | Language code is not recognized |
| `LANGUAGE_NOT_CONFIGURED` | 400 | Language is valid but not added to the project (set-translation / trigger-translate) |
| `RATE_LIMITED` | 429 | 60 req/min per API key — retry after `Retry-After` seconds |
