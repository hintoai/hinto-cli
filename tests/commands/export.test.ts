import { Command } from 'commander';
import fs from 'fs';
import nock from 'nock';
import os from 'os';
import path from 'path';
import { createClient } from '../../src/api/client';
import { exportApi, isBinaryFormat } from '../../src/api/export';
import { registerExport } from '../../src/commands/export';
import * as errors from '../../src/errors';

const BASE_URL = 'https://app.hinto.ai';
const client = createClient('test_key', BASE_URL);
const api = exportApi(client);

afterEach(() => nock.cleanAll());

describe('exportApi.article', () => {
  it('fetches article content by id', async () => {
    nock(BASE_URL).get('/api/external/v2/export/articles/article-1').reply(200, '# Hello World');

    const result = await api.article('article-1');
    expect(result).toBe('# Hello World');
  });

  it('sends format query param when provided', async () => {
    nock(BASE_URL)
      .get('/api/external/v2/export/articles/article-1')
      .query({ format: 'html' })
      .reply(200, '<h1>Hello World</h1>');

    const result = await api.article('article-1', 'html');
    expect(result).toBe('<h1>Hello World</h1>');
  });

  it('sends lang query param when provided', async () => {
    nock(BASE_URL)
      .get('/api/external/v2/export/articles/article-1')
      .query({ lang: 'fr' })
      .reply(200, '# Bonjour le Monde');

    const result = await api.article('article-1', undefined, 'fr');
    expect(result).toBe('# Bonjour le Monde');
  });

  it('sends both format and lang query params when both provided', async () => {
    nock(BASE_URL)
      .get('/api/external/v2/export/articles/article-1')
      .query({ format: 'markdown', lang: 'de' })
      .reply(200, '# Hallo Welt');

    const result = await api.article('article-1', 'markdown', 'de');
    expect(result).toBe('# Hallo Welt');
  });

  it('omits lang param when not provided', async () => {
    nock(BASE_URL)
      .get('/api/external/v2/export/articles/article-2')
      .query({ format: 'markdown' })
      .reply(200, '# Article content');

    const result = await api.article('article-2', 'markdown');
    expect(result).toBe('# Article content');
  });

  it('returns a Buffer for pdf format', async () => {
    const pdfBytes = Buffer.from('%PDF-1.4 fake pdf content');
    nock(BASE_URL)
      .get('/api/external/v2/export/articles/article-1')
      .query({ format: 'pdf' })
      .reply(200, pdfBytes, { 'content-type': 'application/pdf' });

    const result = await api.article('article-1', 'pdf');
    expect(Buffer.isBuffer(result)).toBe(true);
    expect((result as Buffer).toString()).toContain('%PDF');
  });

  it('sends pdf format query param', async () => {
    const pdfBytes = Buffer.from('%PDF-1.4 fake pdf content');
    nock(BASE_URL)
      .get('/api/external/v2/export/articles/article-3')
      .query({ format: 'pdf' })
      .reply(200, pdfBytes, { 'content-type': 'application/pdf' });

    const result = await api.article('article-3', 'pdf');
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it.each([
    ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['vsdx', 'application/vnd.ms-visio.drawing'],
  ] as const)('returns a Buffer for %s format', async (format, contentType) => {
    const bytes = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0xff, 0x00]);
    nock(BASE_URL)
      .get('/api/external/v2/export/articles/article-1')
      .query({ format, lang: 'fr' })
      .reply(200, bytes, { 'content-type': contentType });

    const result = await api.article('article-1', format, 'fr');
    expect(Buffer.isBuffer(result)).toBe(true);
    expect((result as Buffer).equals(bytes)).toBe(true);
  });
});

describe('isBinaryFormat', () => {
  it('treats pdf, docx and vsdx as binary', () => {
    expect(isBinaryFormat('pdf')).toBe(true);
    expect(isBinaryFormat('docx')).toBe(true);
    expect(isBinaryFormat('vsdx')).toBe(true);
  });

  it('treats text formats and no format as text', () => {
    expect(isBinaryFormat('markdown')).toBe(false);
    expect(isBinaryFormat('html')).toBe(false);
    expect(isBinaryFormat(undefined)).toBe(false);
  });
});

describe('exportApi.folder', () => {
  it('sends the format query param', async () => {
    const scope = nock(BASE_URL)
      .get('/api/external/v2/export/folders/3')
      .query({ format: 'vsdx' })
      .reply(200, Buffer.from('PK'), { 'content-type': 'application/zip' });

    await api.folder('3', 'vsdx');
    expect(scope.isDone()).toBe(true);
  });
});

describe('exportApi.project', () => {
  it('sends the vsdx format query param', async () => {
    const scope = nock(BASE_URL)
      .get('/api/external/v2/export/project')
      .query({ format: 'vsdx' })
      .reply(200, Buffer.from('PK'), { 'content-type': 'application/zip' });

    await api.project('vsdx');
    expect(scope.isDone()).toBe(true);
  });
});

describe('hinto export commands', () => {
  let tmpDir: string;

  function buildProgram() {
    const program = new Command();
    program.exitOverride();
    registerExport(program, client);
    return program;
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hinto-export-'));
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('article --format vsdx without --out is refused before any request', async () => {
    const exitWithErrorSpy = jest
      .spyOn(errors, 'exitWithError')
      .mockImplementation(() => undefined as never);
    // Registered but must stay unconsumed: the guard fires before the network call.
    const scope = nock(BASE_URL)
      .get('/api/external/v2/export/articles/1')
      .query(true)
      .reply(200, Buffer.from('x'));

    await buildProgram().parseAsync(['export', 'article', '1', '--format', 'vsdx'], {
      from: 'user',
    });

    expect(exitWithErrorSpy).toHaveBeenCalledWith(expect.stringContaining('--out'));
    expect(exitWithErrorSpy).toHaveBeenCalledWith(expect.stringContaining('vsdx'));
    expect(scope.isDone()).toBe(false);
  });

  it('article --format docx writes the binary file byte for byte', async () => {
    const bytes = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x80, 0xff, 0x00, 0x01]);
    nock(BASE_URL)
      .get('/api/external/v2/export/articles/1')
      .query({ format: 'docx' })
      .reply(200, bytes, {
        'content-type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
    const out = path.join(tmpDir, 'a.docx');

    await buildProgram().parseAsync(['export', 'article', '1', '--format', 'docx', '--out', out], {
      from: 'user',
    });

    expect(fs.readFileSync(out).equals(bytes)).toBe(true);
  });

  it('folder --format vsdx passes the format and writes the zip', async () => {
    const bytes = Buffer.from([0x50, 0x4b, 0x05, 0x06, 0xfe]);
    const scope = nock(BASE_URL)
      .get('/api/external/v2/export/folders/3')
      .query({ format: 'vsdx' })
      .reply(200, bytes, { 'content-type': 'application/zip' });
    const out = path.join(tmpDir, 'f.zip');

    await buildProgram().parseAsync(['export', 'folder', '3', '--format', 'vsdx', '--out', out], {
      from: 'user',
    });

    expect(scope.isDone()).toBe(true);
    expect(fs.readFileSync(out).equals(bytes)).toBe(true);
  });

  it('folder defaults to pdf', async () => {
    const scope = nock(BASE_URL)
      .get('/api/external/v2/export/folders/3')
      .query({ format: 'pdf' })
      .reply(200, Buffer.from('%PDF'), { 'content-type': 'application/pdf' });
    const out = path.join(tmpDir, 'f.pdf');

    await buildProgram().parseAsync(['export', 'folder', '3', '--out', out], { from: 'user' });

    expect(scope.isDone()).toBe(true);
  });

  it('project --format docx passes the format', async () => {
    const scope = nock(BASE_URL)
      .get('/api/external/v2/export/project')
      .query({ format: 'docx' })
      .reply(200, Buffer.from('PK'), { 'content-type': 'application/zip' });
    const out = path.join(tmpDir, 'p.zip');

    await buildProgram().parseAsync(['export', 'project', '--format', 'docx', '--out', out], {
      from: 'user',
    });

    expect(scope.isDone()).toBe(true);
  });
});
