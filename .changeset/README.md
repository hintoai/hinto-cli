# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets).
Add a changeset for every user-facing change:

```bash
npm run changeset
```

Merging changesets to `main` opens a "Version Packages" PR; merging that PR
publishes `@hintoai/cli` to npm with provenance.
