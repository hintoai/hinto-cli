---
"@hintoai/cli": patch
---

Isolate config-file tests from the real `~/.hinto/config.json` and from each other,
fixing intermittent CI flakiness (parallel test files racing on the shared config
path). `config.ts` now resolves its path lazily via `configPath()` and honors a
`HINTO_CONFIG_DIR` override; tests point it at a per-worker temp dir.
