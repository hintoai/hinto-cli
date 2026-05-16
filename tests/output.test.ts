import { printJson, printTable, printKeyValue } from '../src/output';

describe('printJson', () => {
  it('writes JSON to stdout', () => {
    const spy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    printJson({ id: '1', title: 'Test' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('"id": "1"'));
    spy.mockRestore();
  });
});

describe('printTable', () => {
  it('writes a table string to stdout', () => {
    const spy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    printTable(['ID', 'Title'], [['abc', 'Hello']]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('printKeyValue', () => {
  it('writes key: value lines to stdout', () => {
    const spy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    printKeyValue({ id: 'abc', status: 'ready' });
    const output = (spy.mock.calls.map(c => c[0]) as string[]).join('');
    expect(output).toContain('id');
    expect(output).toContain('abc');
    spy.mockRestore();
  });
});
