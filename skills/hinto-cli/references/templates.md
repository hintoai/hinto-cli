# Templates Reference

## Commands

### `hinto templates article`

List article generation templates available for this project's type. Templates are automatically scoped — you only see templates that apply to your project.

```bash
hinto templates article [--json]
```

**`--json` response:**
```json
{
  "templates": [
    {
      "id": 5,
      "name": "Email Announcement",
      "description": "Announce a product update via email",
      "requires_video": true,
      "image_url": null,
      "sort_order": 1
    }
  ]
}
```

`id` is an integer. Pass it as `--template` in `hinto generate start` (optional — server auto-selects if omitted). `description` and `image_url` may be `null`.

---

### `hinto templates structure`

List structure generation templates for this project's type. Used with `hinto generate structure`.

```bash
hinto templates structure [--json]
```

**`--json` response:** Same shape as `templates article`.

Returns `{ "templates": [] }` if the project type does not support structure generation (e.g. `internal_documentation`).

---

## Usage

```bash
# See which article templates are available
hinto templates article --json

# Use a specific template when generating (optional)
hinto generate start --video <videoId> --template 5 --wait

# Let the server pick the default template
hinto generate start --video <videoId> --wait

# See structure templates
hinto templates structure --json

# Generate structure (server picks template automatically)
hinto generate structure --video <videoId> --wait
```

---

## Notes

- Templates are automatically filtered to your project's type — no manual filtering needed
- `id` is an integer in JSON (not a string)
- `requires_video: true` means the template needs a video input to generate from
- `--template` is optional in `hinto generate start`; when omitted, the server uses the first available template for the project type ordered by `sort_order`
