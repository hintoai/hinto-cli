---
"@hintoai/cli": patch
---

Fix the default API base URL: it pointed to the non-existent `https://app.hinto.ai`
(DNS failure on every command). The correct host is `https://app.hintoai.com`.
Updated the runtime defaults (`init` and the client fallback) and all docs.

Existing users who already ran `hinto init` must re-run it once to overwrite the
old base URL stored in `~/.hinto/config.json`.
