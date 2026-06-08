---
"@hintoai/cli": minor
---

`hinto articles update` now supports `--content <md|@file>` to replace an
article's body, so you no longer need to delete + recreate to change body text.
Requires the API release that added content updates to `PUT /articles/:id`.
