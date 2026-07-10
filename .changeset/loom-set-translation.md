---
"@hintoai/cli": minor
---

Add `hinto articles set-translation <id>` to upload a locally-produced translation for an article. It writes your translated title, Markdown content, meta description, keywords, and FAQ JSON-LD directly and marks the translation `status: manual` so Hinto's auto-translator won't overwrite it. `--content` and `--faq-jsonld` accept `@filepath`; omit `--slug` to preserve the existing localized slug.
