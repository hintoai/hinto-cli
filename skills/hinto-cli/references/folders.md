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
      "id": 1,
      "name": "Getting Started",
      "parentId": null,
      "createdAt": "2026-05-26T10:00:00Z",
      "updatedAt": "2026-05-26T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Advanced Topics",
      "parentId": 1,
      "createdAt": "2026-05-26T10:00:00Z",
      "updatedAt": "2026-05-26T10:00:00Z"
    }
  ]
}
```

`parentId` is `null` for root-level folders. `id` is an integer, not a UUID. Use `hinto project structure` for the full hierarchical tree.

---

### `hinto folders get <id>`

Get a single folder by ID.

```bash
hinto folders get <id> [--json]
```

**`--json` response:**
```json
{ "id": 1, "name": "Getting Started", "parentId": null, "createdAt": "2026-05-26T10:00:00Z", "updatedAt": "2026-05-26T10:00:00Z" }
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

**`--json` response (201):** `{ "id": 1, "name": "Getting Started", "parentId": null }`

Returns `404 PARENT_NOT_FOUND` if `--parent` points to a folder that doesn't exist in this project.

---

### `hinto folders update <id>`

Rename a folder.

```bash
hinto folders update <id> --name "..." [--json]
```

**Required:** `--name <name>`

**`--json` response:** `{ "id": 1, "name": "New Name", "parentId": null, "createdAt": "...", "updatedAt": "..." }`

---

### `hinto folders delete <id>`

Delete a folder. Also deletes all articles and sub-folders inside it.

```bash
hinto folders delete <id> [--json]
```

Plain: `Folder <id> deleted.`  
JSON: `{ "deleted": true }`

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
| `FOLDER_NOT_FOUND` | 404 | Folder ID does not exist or belongs to another project |
| `PARENT_NOT_FOUND` | 404 | Parent folder ID does not exist in this project |
| `INSUFFICIENT_SCOPE` | 403 | `read` for list/get; `write` for create/update/delete/move |
| `INVALID_MOVE` | 400 | Cannot move a folder into one of its own descendants |
| `MISSING_FIELD` | 400 | Required field missing (e.g. `name` for create/update) |
