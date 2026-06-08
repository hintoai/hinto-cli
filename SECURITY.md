# Security Policy

## Reporting a Vulnerability

Email **contact@hintoai.com** with details. Do not open a public issue for
security reports. We aim to acknowledge within 3 business days.

## Handling of credentials

The CLI stores your API key at `~/.hinto/config.json` with `0600` permissions.
The key is sent only in the `X-API-Key` request header and is never logged.
Prefer the `HINTO_API_KEY` environment variable in CI.
