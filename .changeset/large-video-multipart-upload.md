---
'@hintoai/cli': minor
---

Upload large videos in chunks. Files over 50 MB now use S3 multipart upload with
per-part retry, fixing the HTTP 524 failures on files above roughly 200 MB — a
single PUT of the whole file outlived the ~100s gateway timeout in front of
storage. The CLI also verifies with the server before reporting an upload
failure, so an upload that actually completed is no longer reported as an error,
and files above the 2 GB maximum are rejected locally before any bytes move.
