import nock from 'nock';
import { createClient } from '../../src/api/client';
import { exportApi } from '../../src/api/export';

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
});
