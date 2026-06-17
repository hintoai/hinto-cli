# Product Behavior

Logic the commands don't make obvious. Read this before promising outcomes to the user.

## Versioning & restore

- A **version snapshot** is created whenever an article's **content or title** (or SEO metadata) changes via the API. These are **manual** versions.
- Updating content or title also **re-translates** existing translations (async) — see Translations below.
- `hinto articles versions <id>` lists versions; `hinto articles restore <id> --vid <versionId>` restores one.
- **Restore** overwrites the article with that version's title + content (creating a new version) and restores that version's **translation snapshots** — which may be **stale**. Restore does **not** re-translate. Re-run translation afterward if you need fresh translations.
- Retention: auto-save versions keep only the last 5; manual/content versions are kept indefinitely.

## Structure stubs & auto-generate

- `hinto generate structure` **always** creates **empty article stubs** (titles only, AI-named) — never full content directly.
- The project setting `autoGenerateArticles` (default **on**) controls what happens next:
  - **On** → content generation is auto-queued for every new stub.
  - **Off** → stubs stay empty until you generate them.
- To fill a stub manually: `hinto articles regenerate <id>` — it generates content from the stub's linked source video (each stub retains its `video_id`).
- After a structure run, check `hinto project structure --json` and, if needed, `hinto articles get <id>` to see whether stubs have content yet.

## Images

- Add images by referencing **already-hosted, publicly reachable URLs** as Markdown `![alt](url)` in the content — there is **no image-upload command**.
- On **publish**, external image URLs are downloaded and re-hosted to the Hinto CDN automatically.
- **Write-only today:** `articles get` (markdown and html) does **not** return image blocks. Don't round-trip image-bearing articles through `get → edit → update`; keep your own source markdown.

## Translations

- Translations are **one-way**: source → translation. Editing a translation does not change the source.
- Editing the **source** article's content/title re-translates existing translations (async).
- `hinto articles translations <id>` lists them; `hinto articles translate <id> --lang <code>` fetches one; `hinto articles trigger-translate <id> --lang <code>` (or `hinto project retranslate --lang <code>`) queues translation. There is no command to edit a translation's body directly.
