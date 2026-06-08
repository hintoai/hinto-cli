import fs from 'fs';
import os from 'os';
import path from 'path';

// Redirect the CLI's config location to a unique per-worker temp dir so tests
// never read/write/delete the developer's real ~/.hinto/config.json, and so
// parallel test files (config.test.ts, init.test.ts) don't race on a shared
// path. config.ts reads HINTO_CONFIG_DIR lazily, so this takes effect regardless
// of import timing.
const dir = path.join(os.tmpdir(), `hinto-cli-test-cfg-${process.env.JEST_WORKER_ID ?? '1'}`);
fs.mkdirSync(dir, { recursive: true });
process.env.HINTO_CONFIG_DIR = dir;
