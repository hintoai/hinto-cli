# Videos Reference

## Commands

### `hinto videos list`

List all videos in the project.

```bash
hinto videos list [--json]
```

**`--json` response:**
```json
{
  "videos": [
    {
      "id": "uuid",
      "filename": "demo.mp4",
      "title": null,
      "duration": 120,
      "ingest_status": "ready",
      "created_at": "2026-05-26T10:00:00Z"
    }
  ],
  "pagination": { "limit": 50, "offset": 0, "count": 1 }
}
```

`ingest_status` values: `pending` | `processing` | `ready` | `failed`

> **Pagination:** `hinto videos list` accepts `--limit <n>` (default: 20).

---

### `hinto videos import --url <url>`

Import a video from a public URL (YouTube, Dropbox, Google Drive, direct MP4, etc.). Async — returns a `jobId` immediately; the import runs in the background.

```bash
hinto videos import --url <url> [--json]
```

**Required:** `--url <url>` — must be a valid URL  
**Scope:** `generate`

**`--json` response (202 Accepted):**
```json
{
  "jobId": "uuid",
  "status": "pending",
  "message": "Video import job created. Check job status via GET /v2/jobs/{jobId}"
}
```

After import, poll `hinto generate status <jobId>` until the job is `completed`. The job output will contain the `videoId` to use for generation.

> **CLI note:** The CLI API module currently expects `{ videoId }` from the import response but the API returns `{ jobId, status, message }`. Use `hinto generate status <jobId> --json` to get the videoId from the completed job's output.

---

### `hinto videos upload`

Upload a local video file to Hinto using the presigned S3 flow.

```bash
hinto videos upload --file <path> [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--file <path>` | Yes | Path to the local video file (`.mp4`, `.mov`, `.webm`, `.avi`, `.mkv`) |

```bash
# Upload a local file
hinto videos upload --file ./recording.mp4

# With JSON output
hinto videos upload --file ./recording.mp4 --json
# → { "videoId": "...", "status": "pending", "createdAt": "..." }
```

The CLI automatically detects content type from the file extension. Progress messages go to stderr; result goes to stdout.

After upload, the video enters `pending` → `processing` → `ready` pipeline. Poll with:
```bash
hinto videos status <videoId>
```

---

### `hinto videos status <videoId>`

Check the processing status of a known video by its ID.

```bash
hinto videos status <videoId> [--json]
```

**`--json` response:**
```json
{
  "videoId": "uuid",
  "filename": "demo.mp4",
  "status": "ready",
  "durationSeconds": 120,
  "createdAt": "2026-05-26T10:00:00Z"
}
```

`status` values: `pending` | `processing` | `ready` | `failed`

---

### `hinto videos delete <videoId>`

Delete a video. Irreversible.

```bash
hinto videos delete <videoId>
```

Prints: `Video <videoId> deleted.`  
**Scope:** `write`

---

## Direct Upload (Two-Step, API only)

To upload a local file directly, use the presigned URL flow via the API — there is no `hinto videos upload` CLI command:

1. `POST /v2/videos/upload/presigned` (`{ filename, content_type }`) → `{ video_id, upload_url, s3_url, expires_in }`
2. PUT the file to `upload_url` directly
3. `POST /v2/videos/upload/complete` (`{ videoId }`) → video object

---

## Errors

| Error code | HTTP | Meaning |
|---|---|---|
| `NOT_FOUND` | 404 | Video ID does not exist or belongs to another project |
| `MISSING_URL` | 400 | `url` not provided to import |
| `INVALID_URL` | 400 | `url` is not a valid URL |
| `INSUFFICIENT_SCOPE` | 403 | `generate` scope for import; `read` for list/status; `write` for delete |
