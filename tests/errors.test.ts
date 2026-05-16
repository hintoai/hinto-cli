import { CliError, exitWithError } from '../src/errors';

describe('CliError', () => {
  it('stores code and message', () => {
    const e = new CliError('NOT_FOUND', 'Article not found');
    expect(e.code).toBe('NOT_FOUND');
    expect(e.message).toBe('Article not found');
    expect(e).toBeInstanceOf(Error);
  });
});

describe('exitWithError', () => {
  it('writes to stderr and calls process.exit(1)', () => {
    const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    expect(() => exitWithError('Something went wrong')).toThrow('exit');
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('Something went wrong'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
