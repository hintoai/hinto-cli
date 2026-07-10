# Common Recipes

Copy-paste happy paths. Each ends with a verification step. Async steps are marked.

## 1. Upload local video → generate one article → publish

```bash
hinto videos upload --file ./video.mp4 --json        # → videoId
hinto videos status <videoId> --json                 # wait until status = ready
hinto generate start --video <videoId> --wait --json # → { articleId }
hinto articles get <articleId> --json                # → content + editUrl/previewUrl
hinto publish now --json                             # async → returns jobId
hinto generate status <jobId> --json                 # poll until completed
```

## 2. Import video by URL → generate → publish

```bash
hinto videos import --url https://example.com/video.mp4 --json   # → jobId (async)
hinto generate status <jobId> --json                             # completed output has the videoId
hinto videos status <videoId> --json                            # wait until ready
hinto generate start --video <videoId> --wait --json            # → articleId
hinto publish now --json
```

## 3. Get an article's content

```bash
hinto articles get <id> --format markdown --json   # or --format html
```

## 4. Update an article's content → republish

```bash
hinto articles update <id> --content @body.md --json   # see side effects below
hinto publish republish --json                         # async
```
Side effects of `update --content`: it snapshots a **version** and **re-translates** any existing translations (async). See `product-behavior.md`.

## 4b. Push a locally-produced translation (manual)

Translate an article yourself and upload the result, instead of using Hinto's
auto-translator. The pushed translation is marked `status: manual` so the
auto-translator won't overwrite it.

```bash
# Language must be configured on the project first (once):
hinto project add-language --code es --json

hinto articles set-translation <id> --lang es \
  --title "…" --content @translations/es/FINAL_ARTICLE.md \
  --meta-description "…" --meta-keywords "kw1,kw2" \
  --faq-jsonld @translations/es/faq-jsonld.json --json   # → status: manual

hinto articles translate <id> --lang es --json           # verify it round-tripped
hinto publish republish --json                           # async → serve the localized page
```
`--content` is Markdown, `--faq-jsonld` is JSON; both accept `@filepath`. Omit
`--slug` to keep the existing localized slug.

## 5. Add images to article text

There is **no image-upload command**. Reference **already-hosted, publicly reachable** image URLs with Markdown image syntax in the content:

```bash
# body.md contains, e.g.:
#   ![Architecture diagram](https://cdn.example.com/diagram.png)
hinto articles update <id> --content @body.md --json
```
- `![alt](url)` is converted to an image block on save. Local paths or auth-gated URLs won't work.
- On **publish**, images are downloaded and re-hosted to the Hinto CDN automatically; published URLs are rewritten.
- **Caveat:** `articles get` does **not** return image blocks today — don't round-trip an image-bearing article through `get → edit → update` (images would be lost). Keep your own source markdown.

## 6. Edit → republish (decision)

```bash
hinto publish status --json   # isPublished?
# if published → hinto publish republish --json
# if not       → hinto publish now --json
```

## 7. Generate content from a video

See `references/content-from-video.md` for the template-first decision flow.
