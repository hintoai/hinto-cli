# Contributing to @hintoai/cli

> For the full architecture, conventions, release pipeline, and gotchas, see **[CLAUDE.md](./CLAUDE.md)** — it's the canonical working guide (for humans and AI agents alike).

## Setup

```bash
npm ci
npm run build
npm test
```

## Workflow

1. Branch off `main`.
2. Make your change. A new command means: add `src/commands/<group>.ts`,
   register it in `src/index.ts`, AND add `skills/hinto-cli/references/<group>.md`
   plus a row in the SKILL.md "Category Routing" table. CI enforces this via
   `npm run validate:skill`.
3. Run `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run validate:skill`.
4. Add a changeset: `npm run changeset`.
5. Open a PR. CI must pass.

## Releases

Merging changesets to `main` opens a "Version Packages" PR. Merging that PR
publishes `@hintoai/cli` to npm with provenance.
