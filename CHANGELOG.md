# @hintoai/cli

## 0.3.3

### Patch Changes

- 9708b2c: Document where to get the API key: keys are per-project, created at Project
  Settings → API Keys & Webhooks → New Api Key in the Hinto app. Fixes agents/users
  looking for a non-existent account-level key page.

## 0.3.2

### Patch Changes

- fa0185d: Skill: make the npm package name (`@hintoai/cli`) unmissable and add explicit
  upgrade instructions, so agents stop guessing the non-existent `@hinto/cli` when
  asked to install or upgrade.

## 0.3.1

### Patch Changes

- b3bbbdb: Point the package `homepage` to hintoai.com and add an "About Hinto AI" section
  with site links to the README.

## 0.3.0

### Minor Changes

- 575a732: Upgrade to commander v15 and raise the minimum Node.js version to 20 (commander
  v15 requires Node 20+). The CI matrix now covers Node 20, 22, and 24.

### Patch Changes

- e3543de: Upgrade Biome to v2 (config migrated to the v2 schema). Removed unused imports and
  fixed a `forEach` callback flagged by the stricter v2 recommended rules. No runtime
  behavior change.

## 0.2.0

### Minor Changes

- 959f81d: First public release: rename to `@hintoai/cli`, skill-first install via
  `npx skills add hintoai/hinto-cli`, shell completions, version read from
  package.json, and full CI/release automation.

Changelog is maintained automatically by Changesets. See release entries below.
