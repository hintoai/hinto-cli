# Generating Content from a Video

Use this when the user wants to turn a video into article(s). Lead with the available **templates** as the menu — don't ask an abstract "one vs. many" question.

## Decision flow

1. **Ensure the video is ready.**
   - Not uploaded yet → `hinto videos upload --file ./video.mp4 --json` (local) or `hinto videos import --url <url> --json` (URL → poll the import job with `hinto generate status <jobId>` to get the `videoId`).
   - Poll `hinto videos status <videoId> --json` until `status` is `ready`.

2. **Fetch both template lists up front:**
   ```bash
   hinto templates structure --json
   hinto templates article --json
   ```

3. **Menu 1 — "What kind of content should I create from this video?"**
   Options = one entry per **structure template** (show `name` + `description`) **plus** one entry: **"A single article."**
   - Structure list is `[]` (project type doesn't support structure) → only "A single article" remains → skip to step 5.
   - Exactly one option total → auto-pick it and state what you used.
   - The user already stated intent (see below) → honor it, skip this menu.
   - 2+ options → **ask the user**.

4. **If a structure template is chosen:**
   ```bash
   hinto generate structure --video <videoId> --template <templateId> --wait --json
   ```
   This creates **folders + empty article stubs** (AI-named). Tell the user these are stubs — content fills automatically only if the project has auto-generate enabled; otherwise fill each stub with `hinto articles regenerate <id>`. See `product-behavior.md`.

5. **If "A single article" is chosen:**
   **Menu 2 — "Which article template?"** (options = `templates article`, show `name` + `description`).
   - 0–1 article template → auto-pick (omit `--template`, or use the single one).
   - 2+ → ask the user.
   ```bash
   hinto generate start --video <videoId> [--template <templateId>] --wait --json   # → articleId
   ```

6. **Surface the link** so the user can open the result:
   ```bash
   hinto articles get <articleId> --json   # → editUrl (always) + previewUrl (if published)
   ```

## Respecting pre-stated intent

- "just one article" / "a single post" / "summarize into one" → single-article path (still apply Menu 2's auto-pick/ask rule).
- "break it into sections" / "make a structure" / "split into multiple" → structure path (apply auto-pick/ask to structure templates).
- User names a template explicitly → skip the matching menu.

## Notes

- **Names are AI-generated** in both paths; this flow does not manage titles.
- **Single video** per request — if the user has several, handle them one at a time.
- Templates are auto-scoped to the project type; you only see applicable ones.
