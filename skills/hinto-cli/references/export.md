# Export Reference

Export commands write content directly to disk (or stdout for article text). There is no `--json` flag on any export command.

## Commands

### `hinto export article <id>`

Export a single article as markdown, HTML, or PDF.

```bash
hinto export article <id> [--format md|html|pdf] [--lang <code>] [--out <path>]
```

| Flag | Required | Default | Description |
|---|---|---|---|
| `--format <fmt>` | No | `md` | Output format: `md` (markdown), `html`, or `pdf`. For `pdf`, `--out` is required. |
| `--lang <code>` | No | — | Export a specific translation by language code (e.g. `fr`, `de`) |
| `--out <path>` | No | stdout | Write to file instead of printing to stdout |

`md` is mapped to `markdown` automatically before the API call. Valid API formats: `markdown`, `html`, `pdf`.

> **Note:** `--format pdf` requires `--out <path>` — binary PDF output cannot be printed to stdout.

```bash
# Print markdown to stdout
hinto export article 123

# Save as HTML file
hinto export article 123 --format html --out article.html

# Pipe to another tool
hinto export article 123 | pandoc -o article.pdf
```

---

### `hinto export folder <id>`

Export all articles in a folder as a **PDF file**. (Only `pdf` format is supported for folder export.)

```bash
hinto export folder <id> --out <path>
```

| Flag | Required | Description |
|---|---|---|
| `--out <path>` | Yes | Output `.pdf` file path |

```bash
hinto export folder uuid --out getting-started.pdf
```

Prints: `Folder exported to getting-started.pdf`

> **Note:** The API only supports `pdf` for folder export. The output is a single PDF containing all articles in the folder, not a ZIP of separate files.

---

### `hinto export project`

Export the full project as a ZIP archive in markdown format.

```bash
hinto export project --out <path> [--format markdown|html|pdf|llm-text]
```

| Flag | Required | Default | Description |
|---|---|---|---|
| `--out <path>` | Yes | — | Output `.zip` file path |
| `--format <fmt>` | No | `markdown` | Export format: `markdown`, `html`, `pdf`, or `llm-text` |

```bash
hinto export project --out full-export.zip
hinto export project --out export.zip --format html
hinto export project --out export.zip --format llm-text
```

Prints: `Project exported to <path>`

---

## Errors

| Error code | HTTP | Meaning |
|---|---|---|
| `NOT_FOUND` | 404 | Article or folder ID does not exist in this project |
| `INSUFFICIENT_SCOPE` | 403 | `read` scope required for all export operations |
| `INVALID_FORMAT` | 400 | Unsupported format for the export type (folder only accepts `pdf`) |
