# Publish Reference

Publish and republish jobs perform a CDN cache revalidation before completing, so they take seconds rather than completing instantly (up to ~21s in the worst case; revalidation failure does not fail the job). A job you observe as `pending` immediately after the 202 response is normal, not a failure.

## Two Webhook Mechanisms

Publishing can fire webhooks two different ways, and a project can have both configured at once:

- **`--callback-url`** — a per-request callback for this specific `now`/`republish` job only. Set it on the command; it fires once, for this job.
- **Project webhook** — configured in the project's settings, independent of any CLI invocation. It fires `project.publish` on `now`, `project.republish` on `republish`, and `project.unpublish` on `unpublish`, for every publish action regardless of how it was triggered.

If both are configured, a single `publish now` fires both webhooks. Do not assume `--callback-url` is the only notification a listener will receive.

## Commands

### `hinto publish now`

Publish the project. Creates a snapshot of all current content and makes it live. This is an **async** operation — the CLI returns a Job ID immediately and the publish runs in the background.

```bash
hinto publish now [--callback-url <url>] [--callback-secret <secret>] [--wait] [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--callback-url <url>` | No | URL to POST a webhook to when the publish job completes or fails |
| `--callback-secret <secret>` | No | HMAC-SHA256 signing secret for the callback webhook. Requires `--callback-url`. |
| `--wait` | No | Block until the job completes |
| `--json` | No | Output JSON |

**Without `--wait`:**
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

**With `--wait`:** polls until the job's status is `completed` or `failed`, then prints the job `output` (slug, articlesCount, etc.).

Without `--wait`, poll `hinto generate status <jobId>` to track completion.

---

### `hinto publish republish`

Push updated content to an already-published project. This is an **async** operation — the CLI returns a Job ID immediately and the republish runs in the background.

```bash
hinto publish republish [--callback-url <url>] [--callback-secret <secret>] [--wait] [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--callback-url <url>` | No | URL to POST a webhook to when the republish job completes or fails |
| `--callback-secret <secret>` | No | HMAC-SHA256 signing secret for the callback webhook. Requires `--callback-url`. |
| `--wait` | No | Block until the job completes |
| `--json` | No | Output JSON |

**Without `--wait`:**
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

**With `--wait`:** polls until the job's status is `completed` or `failed`, then prints the job `output` (slug, articlesCount, etc.).

Without `--wait`, poll `hinto generate status <jobId>` to track completion.

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

`url` is always of the form `https://<slug>.hintoai.com`, regardless of which environment the API is running against. Against a non-production server this URL will not resolve — that does not mean the publish failed.

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
