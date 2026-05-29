# Project Reference

## Commands

### `hinto project get`

Get the current project's metadata.

```bash
hinto project get [--json]
```

**`--json` response:**
```json
{
  "project": {
    "id": "uuid",
    "name": "My Documentation",
    "urlSlug": "my-docs",
    "description": null,
    "language": "en",
    "isPublished": true,
    "logoUrl": null,
    "projectType": "standard",
    "isArchived": false,
    "createdAt": "2026-05-01T00:00:00Z",
    "customDomain": null,
    "customDomainVerified": false
  }
}
```

The CLI unwraps the `project` wrapper when printing in human mode, but `--json` returns the full `{ project: { ... } }` envelope.

---

### `hinto project update`

Update the project name.

```bash
hinto project update --name "New Name" [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--name <name>` | No | New project name |

**`--json` response:**
```json
{ "project": { "id": "uuid", "name": "New Name", ... } }
```

---

### `hinto project structure`

Get the full folder and article hierarchy as a nested tree.

```bash
hinto project structure [--json]
```

**`--json` response:**
```json
{
  "folders": [
    {
      "id": 1,
      "name": "Getting Started",
      "parentId": null,
      "createdAt": "2026-05-27T10:48:43Z",
      "updatedAt": "2026-05-27T10:48:43Z",
      "articles": [
        { "id": 123, "title": "Introduction", "slug": "introduction", "folderId": 1, "createdAt": "...", "updatedAt": "..." }
      ],
      "children": [
        {
          "id": 2,
          "name": "Advanced",
          "parentId": 1,
          "createdAt": "...",
          "updatedAt": "...",
          "articles": [],
          "children": []
        }
      ]
    }
  ],
  "articles": [
    { "id": 456, "title": "Overview", "slug": "overview", "folderId": null, "createdAt": "...", "updatedAt": "..." }
  ]
}
```

Root-level articles (not in any folder) appear in the top-level `articles` array. Folder-nested articles appear inside each folder's `articles` array. `id` values are integers.

Use this to explore the full content tree without paginating through folders and articles separately.

---

### `hinto project languages`

List the translation languages currently enabled for this project.

```bash
hinto project languages [--json]
```

**`--json` response:**
```json
{
  "languages": [
    {
      "code": "fr",
      "label": "French",
      "createdAt": "2026-05-10T00:00:00Z",
      "translationRules": null,
      "totalArticles": 12,
      "translatedArticles": 10,
      "isTranslating": false
    }
  ]
}
```

An empty `languages` array means no translation languages have been configured. Use `hinto project add-language` to add a language.

Plain output columns: `Code`, `Label`, `Translated`, `Total`, `Translating`.

---

### `hinto project retranslate`

Re-queue translation of all articles into a specific language. Useful after bulk content updates. Returns immediately with a count of queued jobs.

```bash
hinto project retranslate --lang <code> [--callback-url <url>] [--callback-secret <secret>] [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--lang <code>` | Yes | Language code to retranslate (e.g. `fr`, `de`, `es`) |
| `--callback-url <url>` | No | URL to POST a webhook to when queuing completes |
| `--callback-secret <secret>` | No | HMAC-SHA256 signing secret. Requires `--callback-url`. |

Plain: `Retranslation queued. Job ID: <uuid>`

**`--json` response (200):**
```json
{
  "jobId": "uuid",
  "type": "translate",
  "status": "completed",
  "output": { "queued": 12 },
  "error": null,
  "createdAt": "2026-05-29T10:00:00Z",
  "completedAt": "2026-05-29T10:00:01Z"
}
```

`output.queued` is the number of articles enqueued for translation.

---

### `hinto project add-language`

Add a new translation language to this project. Once added, use `hinto project retranslate` or `hinto articles trigger-translate` to queue translations.

```bash
hinto project add-language --code <code> [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--code <code>` | Yes | Language code to add (e.g. `fr`, `de`, `es`) |

**`--json` response:**
```json
{ "languageCode": "fr", "message": "Language added successfully" }
```

Plain: `Language fr added. Language added successfully`

---

## Errors

| Error code | HTTP | Meaning |
|---|---|---|
| `INSUFFICIENT_SCOPE` | 403 | `read` for get/structure/languages; `generate` for retranslate; `write` for add-language |
| `LANGUAGE_NOT_FOUND` | 404 | Language code is not configured on this project |
