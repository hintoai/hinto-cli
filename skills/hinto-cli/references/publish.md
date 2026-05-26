# Publish Reference

Publishing operations are **synchronous** — they complete inline and return the result directly. There is no `jobId` and `--wait` has no effect (the CLI's `--wait` path expects a jobId that isn't returned and will fail silently).

## Commands

### `hinto publish now`

Publish the project. Creates a snapshot of all current content and makes it live.

```bash
hinto publish now [--json]
```

**`--json` response (200):**
```json
{
  "message": "Project published successfully",
  "slug": "my-docs",
  "publicationId": "uuid",
  "articlesCount": 12,
  "foldersCount": 3
}
```

> **CLI note:** The `--wait` flag is accepted but has no effect — publish is synchronous. Do not use `--wait`.

---

### `hinto publish republish`

Push updated content to an already-published project. Returns immediately. If no content has changed since the last publication, returns `hasChanges: false` without doing anything.

```bash
hinto publish republish [--json]
```

**`--json` response — changes detected (200):**
```json
{
  "message": "Project republished successfully",
  "hasChanges": true,
  "slug": "my-docs",
  "publicationId": "uuid",
  "articlesCount": 12,
  "foldersCount": 3
}
```

**`--json` response — no changes (200):**
```json
{
  "message": "No changes detected since last publication",
  "hasChanges": false
}
```

> **CLI note:** Same as `now` — `--wait` has no effect.

---

### `hinto publish status`

Check whether the project is currently published.

```bash
hinto publish status [--json]
```

**`--json` response:**
```json
{
  "isPublished": true,
  "slug": "my-docs",
  "url": "https://my-docs.hintoai.com",
  "publicationId": "uuid",
  "publishedAt": "2026-05-20T10:00:00Z",
  "articlesCount": 12,
  "foldersCount": 3
}
```

When unpublished: `isPublished: false`, `url: null`, `publicationId: null`, all counts `null`.

The `status` field (`"published"` / `"unpublished"`) is synthesized by the CLI and is not in the raw API response.

Published URLs use the domain `hintoai.com` (e.g. `https://my-docs.hintoai.com`).

---

## Unpublish (API only)

`DELETE /v2/publish` unpublishes the project. There is no `hinto publish unpublish` CLI command — call the API directly:

```bash
curl -X DELETE https://app.hinto.ai/api/external/v2/publish \
  -H "X-API-Key: $HINTO_API_KEY"
```

Response: `{ "message": "Project unpublished successfully" }`

---

## Workflow: Edit → Republish

```bash
# Make content changes
hinto articles update <id> --title "New Title"

# Push changes to the live publication
hinto publish republish --json
```

---

## Errors

| Error code | HTTP | Meaning |
|---|---|---|
| `INSUFFICIENT_SCOPE` | 403 | `publish` scope required for now/republish; `read` for status |
| `METHOD_NOT_ALLOWED` | 405 | Used wrong HTTP method (e.g. GET instead of POST) |
