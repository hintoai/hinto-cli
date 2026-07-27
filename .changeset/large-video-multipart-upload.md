---
'@hintoai/cli': minor
---

Upload large videos in chunks, fixing the HTTP 524 failures reported on files
above roughly 200 MB.

Previously the whole file went up as a single PUT, which outlived the ~100s
gateway timeout in front of storage on any transfer slower than that. Files over
16 MB now use S3 multipart upload with per-part retry, so one slow or dropped
part no longer fails the entire transfer. Part size and upload concurrency are
tuned so a single request stays well inside the gateway window even on a slow
uplink.

Two related fixes: the CLI now checks with the server before reporting an upload
failure, so a transfer that actually completed is no longer reported as an error;
and files above the 2 GB maximum are rejected locally before any bytes move.
