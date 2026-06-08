export class CliError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'CliError';
  }
}

export function exitWithError(message: string): never {
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
}
