# Generate Reference

All generation operations are async — they return a `jobId` immediately (HTTP 202). Use `--wait` to block until completion, or poll manually with `hinto generate status <jobId>`.

## Job Status Values

| Status | Meaning |
|---|---|
| `pending` | Job queued, not started yet |
| `processing` | Job is in progress |
| `completed` | Job finished — `output` field is populated |
| `failed` | Job failed — `error` field contains the reason |

Polling interval: 2 seconds. Timeout: 5 minutes (300s). On timeout the CLI exits with code 1.

---

## Commands

### `hinto generate start`

Start an article generation job from a video. The video must be in `ready` status.

```bash
hinto generate start --video <videoId> [--template <templateId>] [--callback-url <url>] [--callback-secret <secret>] [--wait] [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--video <videoId>` | Yes | ID of a `ready` video |
| `--template <templateId>` | No | Template ID from `hinto templates article` — auto-selected if omitted |
| `--callback-url <url>` | No | URL to POST a webhook to when the job completes or fails |
| `--callback-secret <secret>` | No | HMAC-SHA256 signing secret; if set, the webhook includes `X-Hinto-Signature` so you can verify authenticity. Requires `--callback-url`. |
| `--wait` | No | Block until the job completes |
| `--json` | No | Output JSON |

**Without `--wait`** (202 Accepted): the full Job object.
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

**With `--wait` `--json`** (job `output` on completion):
```json
{ "articleId": 123 }
```

---

### `hinto generate status <jobId>`

Check the status of any async job (generate article, generate structure, import video).

```bash
hinto generate status <jobId> [--json]
```

**`--json` response:**
```json
{
  "jobId": "uuid",
  "type": "generate_article",
  "status": "completed",
  "output": { "articleId": 123 },
  "error": null,
  "createdAt": "2026-05-26T10:00:00Z",
  "completedAt": "2026-05-26T10:02:00Z"
}
```

`output` is `null` until the job completes. `error` is `null` unless the job failed.

---

### `hinto generate structure`

Generate a folder and article structure for the project from a video. Creates folders and article stubs.

```bash
hinto generate structure --video <videoId> [--template <id>] [--callback-url <url>] [--callback-secret <secret>] [--wait] [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--video <videoId>` | **Yes** | The video to derive structure from |
| `--template <id>` | No | Template ID — server auto-selects the default if omitted |
| `--callback-url <url>` | No | URL to POST a webhook to when the job completes or fails |
| `--callback-secret <secret>` | No | HMAC-SHA256 signing secret for the callback webhook. Requires `--callback-url`. |
| `--wait` | No | Block until structure generation settles |
| `--json` | No | Output JSON |

**Without `--wait`** (202 Accepted): the full Job object.
```json
{
  "jobId": "uuid",
  "type": "generate_structure",
  "status": "pending",
  "output": null,
  "error": null,
  "createdAt": "2026-05-26T10:00:00Z",
  "completedAt": null
}
```

**With `--wait`:** polls until the job's status is `completed` or `failed`, then prints the job `output`.

---

## Optional Template

The `--template` flag is optional. When omitted, the server auto-selects the default template for your project type:

```bash
# Without --template: server auto-selects the default template
hinto generate start --video <videoId> --wait --json

# With explicit template
hinto generate start --video <videoId> --template 5 --wait --json
```

---

## Polling Manually

If you didn't use `--wait`, track the job yourself:

```bash
# Fire and capture jobId
JOB=$(hinto generate start --video abc123 --json | jq -r .jobId)

# Poll until done
while true; do
  STATUS=$(hinto generate status "$JOB" --json | jq -r .status)
  [ "$STATUS" = "completed" ] && break
  [ "$STATUS" = "failed" ] && { echo "Job failed"; exit 1; }
  sleep 3
done

# Get the result
hinto generate status "$JOB" --json | jq .output
```

---

## Errors

| Error code | HTTP | Meaning |
|---|---|---|
| `JOB_NOT_FOUND` | 404 | `jobId` does not exist or belongs to another project |
| `MISSING_VIDEO_ID` | 400 | `videoId` required for generation |
| `INSUFFICIENT_SCOPE` | 403 | `generate` scope for start/structure; `read` for status |
| `QUOTA_EXCEEDED` | 400 | Monthly generation limit reached |
