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
      "videoId": "uuid",
      "filename": "demo.mp4",
      "durationSeconds": 120,
      "status": "ready",
      "createdAt": "2026-05-26T10:00:00Z"
    }
  ],
  "pagination": { "limit": 20, "offset": 0, "count": 1 }
}
```

`status` values: `pending` | `processing` | `ready` | `failed`

> **Pagination:** `hinto videos list` accepts `--offset <n>` and `--limit <n>` (defaults: offset=0, limit=20).

---

### `hinto videos import --url <url>`

Import a video from a public URL (YouTube, Dropbox, Google Drive, direct MP4, etc.). Async — returns a `jobId` immediately; the import runs in the background.

```bash
hinto videos import --url <url> [--name <name>] [--callback-url <url>] [--callback-secret <secret>] [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--url <url>` | Yes | Public video URL to import |
| `--name <name>` | No | Display name for the imported video |
| `--callback-url <url>` | No | URL to POST a webhook to when the import job completes or fails |
| `--callback-secret <secret>` | No | HMAC-SHA256 signing secret; if set, the webhook includes `X-Hinto-Signature` for verification. Requires `--callback-url`. |

**Scope:** `generate`

**`--json` response (202 Accepted):** the full Job object.
```json
{
  "jobId": "uuid",
  "type": "import_video_url",
  "status": "pending",
  "output": null,
  "error": null,
  "createdAt": "2026-05-26T10:00:00Z",
  "completedAt": null
}
```

After import, poll `hinto generate status <jobId>` until the job is `completed`. The job output will contain the `videoId` to use for generation.

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
# → { "videoId": "..." }
```

The CLI automatically detects content type from the file extension. Progress messages go to stderr; result goes to stdout.

After upload, the video enters `pending` → `processing` → `ready` pipeline. Poll with:
```bash
hinto videos status <videoId>
```

---

### `hinto videos get <videoId>`

Get full details of a video by ID.

```bash
hinto videos get <videoId> [--json]
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

Returns `404 VIDEO_NOT_FOUND` if the ID doesn't exist or belongs to another project.

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
hinto videos delete <videoId> [--json]
```

Plain: `Video <videoId> deleted.`  
JSON: `{ "deleted": true }`  
**Scope:** `write`

---

## Presigned Upload Flow (API internals)

The `hinto videos upload` command uses a three-step presigned S3 flow internally:

1. `POST /v2/videos/upload/presigned` (`{ filename, contentType }`) → `{ videoId, uploadUrl, s3Url, expiresIn }`
2. PUT the file to `upload_url` directly
3. `POST /v2/videos/upload/complete` (`{ key, fileId, filename }`) → `{ videoId }`
   - `key` = S3 object key (e.g. `videos/original/<videoId>.mp4`)
   - `fileId` = the video UUID
   - `filename` = the original filename

---

## Errors

| Error code | HTTP | Meaning |
|---|---|---|
| `VIDEO_NOT_FOUND` | 404 | Video ID does not exist or belongs to another project |
| `MISSING_URL` | 400 | `url` not provided to import |
| `INVALID_URL` | 400 | `url` is not a valid URL |
| `INSUFFICIENT_SCOPE` | 403 | `generate` scope for import; `read` for list/get/status; `write` for delete |
