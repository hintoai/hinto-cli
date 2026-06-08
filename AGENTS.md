# AGENTS.md

This repository's full working guide for AI agents lives in [`CLAUDE.md`](./CLAUDE.md).

Read it before making changes. Key points it covers:

- Package is `@hintoai/cli`, command is `hinto`, API host is `https://app.hintoai.com` (not `hinto.ai`).
- API keys are per-project (Project → Settings → API Keys & Webhooks).
- Adding a command means updating the command, its `references/` doc, `SKILL.md`, and a changeset (CI enforces sync).
- Releases: Changesets → version PR → OIDC Trusted Publishing (token-free); see the org-policy notes in `CLAUDE.md`.
- The agent skill ships via the repo (`npx skills add hintoai/hinto-cli`), not the npm tarball.
