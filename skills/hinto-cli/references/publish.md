# Publish Reference

## Commands

### `hinto publish now`

Publish the project. Creates a snapshot of all current content and makes it live. This is an **async** operation — the CLI returns a Job ID immediately and the publish runs in the background.

```bash
hinto publish now [--callback-url <url>] [--callback-secret <secret>] [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--callback-url <url>` | No | URL to POST a webhook to when the publish job completes or fails |
| `--callback-secret <secret>` | No | HMAC-SHA256 signing secret for the callback webhook. Requires `--callback-url`. |

**Plain output:**
```
Publish job started. Job ID: <uuid>
Poll status: hinto generate status <uuid>
```

**`--json` response (202):**
```json
{
  "jobId": "uuid",
  "type": "publish",
  "status": "pending",
  "output": null,
  "error": null,
  "createdAt": "2026-05-29T10:00:00Z",
  "completedAt": null
}
```

Poll `hinto generate status <jobId>` to track completion. When the job finishes, `output` will contain the publish result (slug, articlesCount, etc.).

---

### `hinto publish republish`

Push updated content to an already-published project. This is an **async** operation — the CLI returns a Job ID immediately and the republish runs in the background.

```bash
hinto publish republish [--callback-url <url>] [--callback-secret <secret>] [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--callback-url <url>` | No | URL to POST a webhook to when the republish job completes or fails |
| `--callback-secret <secret>` | No | HMAC-SHA256 signing secret for the callback webhook. Requires `--callback-url`. |

**Plain output:**
```
Republish job started. Job ID: <uuid>
Poll status: hinto generate status <uuid>
```

**`--json` response (202):**
```json
{
  "jobId": "uuid",
  "type": "publish",
  "status": "pending",
  "output": null,
  "error": null,
  "createdAt": "2026-05-29T10:00:00Z",
  "completedAt": null
}
```

Poll `hinto generate status <jobId>` to track completion. When the job finishes, `output` will contain the republish result (slug, articlesCount, etc.).

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

### `hinto publish unpublish`

Remove the project from public access.

```bash
hinto publish unpublish [--json]
```

Plain: `Project unpublished.`  
JSON: `{ "message": "Project unpublished successfully" }`  
**Scope:** `publish`

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
