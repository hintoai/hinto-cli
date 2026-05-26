# Templates Reference

## Commands

### `hinto templates list`

List all templates available to the project.

```bash
hinto templates list [--json]
```

**`--json` response:**
```json
{
  "templates": [
    {
      "id": 1,
      "name": "Tutorial",
      "description": "Step-by-step instructional article"
    },
    {
      "id": 2,
      "name": "Reference",
      "description": null
    }
  ]
}
```

`id` is an integer. Pass it as-is to `--template` in `hinto generate start`. `description` may be `null`.

---

## Usage

Templates define the structure and style for AI-generated articles. Pick the template that matches the type of content in the video:

```bash
# List templates to find the right ID
hinto templates list --json

# Use the ID when starting generation
hinto generate start --video <videoId> --template 1 --wait
```

---

## Notes

- Templates are project-scoped — available templates depend on your plan and project settings
- `id` is an integer in JSON (not a string)
- `description` may be `null`
