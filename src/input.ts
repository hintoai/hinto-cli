import fs from 'fs';
import path from 'path';

/**
 * A CLI value that may be given inline or as `@path/to/file`. Briefs and article
 * bodies are both long enough that a file is the normal case.
 */
export function resolveInput(raw: string): string {
  if (!raw.startsWith('@')) return raw;
  const filePath = path.resolve(raw.slice(1));
  return fs.readFileSync(filePath, 'utf-8');
}
