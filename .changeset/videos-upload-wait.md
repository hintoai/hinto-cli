---
"@hintoai/cli": minor
---

Add `--wait` flag to `hinto videos upload`

Blocks until the uploaded video finishes server-side processing and reaches `ready` status (polls every 3s, 10 min timeout). Without `--wait` the command returns immediately as before.
