# Folders Reference

## Commands

### `hinto folders list`

List all folders in the project (flat list with parent references).

```bash
hinto folders list [--json]
```

**`--json` response:**
```json
{
  "folders": [
    {
      "id": "uuid",
      "name": "Getting Started",
      "parent_id": null
    },
    {
      "id": "uuid2",
      "name": "Advanced Topics",
      "parent_id": "uuid"
    }
  ]
}
```

`parent_id` is `null` for root-level folders. Use `hinto project structure` for the full hierarchical tree.

---

### `hinto folders get <id>`

Get a single folder by ID.

```bash
hinto folders get <id> [--json]
```

**`--json` response:**
```json
{ "id": "uuid", "name": "Getting Started", "parent_id": null }
```

---

### `hinto folders create`

Create a new folder.

```bash
hinto folders create --name "..." [--parent <id>] [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--name <name>` | Yes | Folder name |
| `--parent <id>` | No | Parent folder ID — omit to create at root level |

**`--json` response:** the created folder object (`id`, `name`, `parent_id`).

---

### `hinto folders update <id>`

Rename a folder.

```bash
hinto folders update <id> --name "..." [--json]
```

**Required:** `--name <name>`

**`--json` response:** the updated folder object.

---

### `hinto folders delete <id>`

Delete a folder. Also deletes all articles and sub-folders inside it.

```bash
hinto folders delete <id>
```

Prints: `Folder <id> deleted.`

---

### `hinto folders move <id>`

Move a folder to a new parent, or to the root level.

```bash
hinto folders move <id> [--parent <parentId>] [--json]
```

| Flag | Required | Description |
|---|---|---|
| `--parent <id>` | No | Target parent folder ID — omit to move to root |

**`--json` response:**
```json
{ "message": "Folder moved", "parentId": 123 }
```

`parentId` is `null` when moved to root.

Moving a folder into one of its own descendants returns `400 INVALID_MOVE`.

---

## Errors

| Error code | HTTP | Meaning |
|---|---|---|
| `NOT_FOUND` | 404 | Folder ID does not exist or belongs to another project |
| `INSUFFICIENT_SCOPE` | 403 | `read` for list/get; `write` for create/update/delete/move |
| `INVALID_MOVE` | 400 | Cannot move a folder into one of its own descendants |
| `MISSING_FIELD` | 400 | `parent_id` missing from move body (pass `null` explicitly to move to root) |
