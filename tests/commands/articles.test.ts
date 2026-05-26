import nock from 'nock';
import { createClient } from '../../src/api/client';
import { articlesApi } from '../../src/api/articles';

const BASE_URL = 'https://app.hinto.ai';
const client = createClient('test_key', BASE_URL);
const api = articlesApi(client);

afterEach(() => nock.cleanAll());

const mockArticle = {
  id: 'a1',
  title: 'Hello',
  slug: 'hello',
  format: 'markdown' as const,
  content: '# Hi',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('articlesApi.list', () => {
  it('returns articles', async () => {
    nock(BASE_URL)
      .get('/api/external/v2/articles')
      .reply(200, { articles: [mockArticle], total: 1 });

    const result = await api.list();
    expect(result.articles[0].id).toBe('a1');
  });
});

describe('articlesApi.create', () => {
  it('creates article', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/articles', { title: 'New Article' })
      .reply(201, mockArticle);

    const result = await api.create({ title: 'New Article' });
    expect(result.id).toBe('a1');
  });
});

describe('articlesApi.delete', () => {
  it('calls DELETE', async () => {
    nock(BASE_URL)
      .delete('/api/external/v2/articles/a1')
      .reply(200, {});

    await expect(api.delete('a1')).resolves.not.toThrow();
  });
});

describe('articlesApi.duplicate', () => {
  it('duplicates article', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/articles/a1/duplicate')
      .reply(201, { ...mockArticle, id: 'a2' });

    const result = await api.duplicate('a1');
    expect(result.id).toBe('a2');
  });
});

describe('articlesApi.triggerTranslate', () => {
  it('posts to translations endpoint and returns jobId', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/articles/123/translations/fr')
      .reply(202, { jobId: 'j-tr', articleId: 123, languageCode: 'fr', status: 'pending', message: 'Translation queued' });

    const result = await api.triggerTranslate('123', 'fr');
    expect(result.jobId).toBe('j-tr');
    expect(result.languageCode).toBe('fr');
  });
});
