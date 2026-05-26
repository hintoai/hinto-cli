# Export Reference

Export commands write content directly to disk (or stdout for article text). There is no `--json` flag on any export command.

## Commands

### `hinto export article <id>`

Export a single article as markdown, HTML, or PDF.

```bash
hinto export article <id> [--format md|html|pdf] [--out <path>]
```

| Flag | Required | Default | Description |
|---|---|---|---|
| `--format <fmt>` | No | `md` | Output format: `md` (markdown), `html`, or `pdf` |
| `--out <path>` | No | stdout | Write to file instead of printing to stdout |

`md` is mapped to `markdown` automatically before the API call. Valid API formats: `pdf`, `markdown`, `html`.

```bash
# Print markdown to stdout
hinto export article 123

# Save as HTML file
hinto export article 123 --format html --out article.html

# Export as PDF
hinto export article 123 --format pdf --out article.pdf

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
hinto export project --out <path>
```

| Flag | Required | Description |
|---|---|---|
| `--out <path>` | Yes | Output `.zip` file path |

```bash
hinto export project --out full-export.zip
```

Prints: `Project exported to full-export.zip`

> **Note:** The CLI exports in markdown format (the API default). The API also supports `pdf`, `html`, and `llm-text` formats but these are not exposed as CLI flags — call the API directly to use them.

---

## Errors

| Error code | HTTP | Meaning |
|---|---|---|
| `NOT_FOUND` | 404 | Article or folder ID does not exist in this project |
| `INSUFFICIENT_SCOPE` | 403 | `read` scope required for all export operations |
| `INVALID_FORMAT` | 400 | Unsupported format for the export type (folder only accepts `pdf`) |
