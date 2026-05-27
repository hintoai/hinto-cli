import nock from 'nock';
import { createClient } from '../../src/api/client';
import { articlesApi } from '../../src/api/articles';

const BASE_URL = 'https://app.hinto.ai';
const client = createClient('test_key', BASE_URL);
const api = articlesApi(client);

afterEach(() => nock.cleanAll());

const mockArticle = {
  id: 1,
  title: 'Test Article',
  slug: 'article-slug',
  folder_id: null,
  inserted_at: '2026-01-01',
  updated_at: '2026-01-01',
};

describe('articlesApi.list', () => {
  it('returns articles', async () => {
    nock(BASE_URL)
      .get('/api/external/v2/articles')
      .reply(200, {
        articles: [mockArticle],
        pagination: { limit: 20, offset: 0, count: 1 },
      });

    const result = await api.list();
    expect(result.articles[0].id).toBe(1);
    expect(result.pagination.count).toBe(1);
  });
});

describe('articlesApi.create', () => {
  it('creates article', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/articles', { title: 'New Article' })
      .reply(201, { id: 2, title: 'New Article', slug: null });

    const result = await api.create({ title: 'New Article' });
    expect(result.id).toBe(2);
  });
});

describe('articlesApi.delete', () => {
  it('calls DELETE', async () => {
    nock(BASE_URL)
      .delete('/api/external/v2/articles/1')
      .reply(200, {});

    await expect(api.delete('1')).resolves.not.toThrow();
  });
});

describe('articlesApi.duplicate', () => {
  it('duplicates article', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/articles/1/duplicate')
      .reply(201, { id: 3, title: 'Test Article (copy)', slug: null });

    const result = await api.duplicate('1');
    expect(result.id).toBe(3);
  });
});

describe('articlesApi.triggerTranslate', () => {
  it('posts to translations endpoint and returns message', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/articles/123/translations/fr')
      .reply(202, { message: 'Translation queued', articleId: 123, languageCode: 'fr' });

    const result = await api.triggerTranslate('123', 'fr');
    expect(result.message).toBe('Translation queued');
    expect(result.languageCode).toBe('fr');
  });
});

describe('articlesApi.update', () => {
  it('updates article with title', async () => {
    nock(BASE_URL)
      .put('/api/external/v2/articles/1', { title: 'Updated Title' })
      .reply(200, { id: 1, title: 'Updated Title', slug: 'article-slug', updatedAt: '2026-01-01' });

    const result = await api.update('1', { title: 'Updated Title' });
    expect(result.title).toBe('Updated Title');
  });

  it('updates article with slug', async () => {
    nock(BASE_URL)
      .put('/api/external/v2/articles/1', { slug: 'new-slug' })
      .reply(200, { id: 1, title: 'Test Article', slug: 'new-slug', updatedAt: '2026-01-01' });

    const result = await api.update('1', { slug: 'new-slug' });
    expect(result.slug).toBe('new-slug');
  });
});
