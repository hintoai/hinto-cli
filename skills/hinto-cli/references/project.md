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
    "url_slug": "my-docs",
    "description": null,
    "language": "en",
    "is_published": true,
    "logo_url": null,
    "project_type": "standard",
    "is_archived": false,
    "created_at": "2026-05-01T00:00:00Z",
    "custom_domain": null,
    "custom_domain_verified": false
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
| `--name <name>` | Yes | New project name |

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
      "id": "uuid",
      "name": "Getting Started",
      "parent_id": null,
      "inserted_at": "2026-05-27T10:48:43Z",
      "updated_at": "2026-05-27T10:48:43Z",
      "articles": [
        { "id": 123, "title": "Introduction", "slug": "introduction" }
      ],
      "children": [
        {
          "id": "uuid",
          "name": "Subfolder",
          "parent_id": "uuid",
          "inserted_at": "2026-05-27T10:48:43Z",
          "updated_at": "2026-05-27T10:48:43Z",
          "articles": [],
          "children": []
        }
      ]
    }
  ],
  "articles": [
    { "id": 456, "title": "Overview", "slug": "overview" }
  ]
}
```

Use this to explore the full content tree without paginating through folders and articles separately. Root-level articles are in the top-level `articles` array; folders have nested `children` and `articles` arrays.

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
      "languageCode": "fr",
      "createdAt": "2026-05-10T00:00:00Z",
      "translationRules": null,
      "totalArticles": 12,
      "translatedArticles": 10,
      "isTranslating": false
    }
  ]
}
```

An empty `languages` array means no translation languages have been configured. To add a language, use `POST /v2/project/languages` directly.

---

### `hinto project retranslate`

Re-queue translation of all articles into a specific language. Useful after bulk content updates. Returns immediately with a count of queued jobs.

```bash
hinto project retranslate --lang <code> [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--lang <code>` | Yes | Language code to retranslate (e.g. `fr`, `de`, `es`) |

**`--json` response (202):**
```json
{ "languageCode": "fr", "queued": 12 }
```

`queued` is the number of articles enqueued for translation.

> **CLI note:** The CLI also accepts `--wait` and attempts to poll a jobId, but the retranslate API returns `{ languageCode, queued }` — not a jobId. The `--wait` path will not work correctly. Track translation progress via `hinto project languages --json` and watch `translatedArticles` count.

---

## Errors

| Error code | HTTP | Meaning |
|---|---|---|
| `INSUFFICIENT_SCOPE` | 403 | `read` for get/structure/languages; `generate` for retranslate |
| `LANGUAGE_NOT_FOUND` | 404 | Language code is not configured on this project |
