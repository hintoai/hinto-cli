# Export Reference

Export commands write content directly to disk (or stdout for article text). There is no `--json` flag on any export command.

## Commands

### `hinto export article <id>`

Export a single article as markdown, HTML, PDF, Word (`docx`), or Visio (`vsdx`).

```bash
hinto export article <id> [--format md|html|pdf|docx|vsdx] [--lang <code>] [--out <path>]
```

| Flag | Required | Default | Description |
|---|---|---|---|
| `--format <fmt>` | No | `md` | Output format: `md` (markdown), `html`, `pdf`, `docx`, or `vsdx`. For `pdf`, `docx` and `vsdx`, `--out` is required. |
| `--lang <code>` | No | — | Export a specific translation by language code (e.g. `fr`, `de`) |
| `--out <path>` | No | stdout | Write to file instead of printing to stdout |

`md` is mapped to `markdown` automatically before the API call. Valid API formats: `markdown`, `html`, `pdf`, `docx`, `vsdx`.

> **Note:** `--format pdf`, `docx` and `vsdx` require `--out <path>` — binary output cannot be printed to stdout. Give the file the matching extension (`.pdf`, `.docx`, `.vsdx`).

`vsdx`: Visio file for Miro (Create new → Import → Import diagram); folder and project return a ZIP of one .vsdx per article.

```bash
# Print markdown to stdout
hinto export article 123

# Save as HTML file
hinto export article 123 --format html --out article.html

# Word document, and a Visio diagram of the French translation
hinto export article 123 --format docx --out article.docx
hinto export article 123 --format vsdx --lang fr --out article-fr.vsdx

# Pipe to another tool
hinto export article 123 | pandoc -o article.pdf
```

---

### `hinto export folder <id>`

Export all articles in a folder as one PDF, one Word document, or a ZIP of Visio files.

```bash
hinto export folder <id> --out <path> [--format pdf|docx|vsdx]
```

| Flag | Required | Default | Description |
|---|---|---|---|
| `--out <path>` | Yes | — | Output file path: `.pdf` for `pdf`, `.docx` for `docx`, `.zip` for `vsdx` |
| `--format <fmt>` | No | `pdf` | Export format: `pdf`, `docx`, or `vsdx` |

```bash
hinto export folder 42 --out getting-started.pdf
hinto export folder 42 --format docx --out getting-started.docx
hinto export folder 42 --format vsdx --out getting-started.zip
```

Prints: `Folder exported to getting-started.pdf`

> **Note:** `pdf` and `docx` produce a single file containing all articles in the folder. `vsdx` always produces a ZIP of one `.vsdx` per article.

---

### `hinto export project`

Export the full project. `markdown`, `html` and `vsdx` always produce a ZIP; `pdf` and `docx` produce one file, or a ZIP when the project has translations.

```bash
hinto export project --out <path> [--format markdown|html|pdf|docx|vsdx|llm-text]
```

| Flag | Required | Default | Description |
|---|---|---|---|
| `--out <path>` | Yes | — | Output file path (`.zip` for `markdown`, `html` and `vsdx`) |
| `--format <fmt>` | No | `markdown` | Export format: `markdown`, `html`, `pdf`, `docx`, `vsdx`, or `llm-text` |

```bash
hinto export project --out full-export.zip
hinto export project --out export.zip --format html
hinto export project --out export.zip --format llm-text
hinto export project --out diagrams.zip --format vsdx
```

Prints: `Project exported to <path>`

---

## Errors

| Error code | HTTP | Meaning |
|---|---|---|
| `NOT_FOUND` | 404 | Article or folder ID does not exist in this project |
| `INSUFFICIENT_SCOPE` | 403 | `read` scope required for all export operations |
| `INVALID_FORMAT` | 400 | Unsupported format for the export type (folder accepts `pdf`, `docx`, `vsdx`) |
