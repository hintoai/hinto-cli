import nock from 'nock';
import { createClient } from '../../src/api/client';
import { publishApi } from '../../src/api/publish';

const BASE_URL = 'https://app.hinto.ai';
const client = createClient('test_key', BASE_URL);
const api = publishApi(client);

afterEach(() => nock.cleanAll());

describe('publishApi.status', () => {
  it('returns publish status', async () => {
    nock(BASE_URL).get('/api/external/v2/publish/status').reply(200, {
      isPublished: true, publishedAt: '2026-01-01', slug: 'my-docs',
      url: 'https://my-docs.hintoai.com', publicationId: 'pub-1',
      articlesCount: 5, foldersCount: 2,
    });
    const result = await api.status();
    expect(result.status).toBe('published');
    expect(result.slug).toBe('my-docs');
  });
});

describe('publishApi.now', () => {
  it('returns synchronous publish result', async () => {
    nock(BASE_URL).post('/api/external/v2/publish').reply(200, {
      message: 'Project published successfully',
      slug: 'my-docs',
      publicationId: 'pub-1',
      articlesCount: 5,
      foldersCount: 2,
    });
    const result = await api.now();
    expect(result.slug).toBe('my-docs');
    expect(result.articlesCount).toBe(5);
  });
});

describe('publishApi.republish', () => {
  it('returns hasChanges: true when content changed', async () => {
    nock(BASE_URL).post('/api/external/v2/publish/republish').reply(200, {
      message: 'Project republished successfully',
      hasChanges: true,
      slug: 'my-docs',
      publicationId: 'pub-2',
      articlesCount: 5,
      foldersCount: 2,
    });
    const result = await api.republish();
    expect(result.hasChanges).toBe(true);
  });

  it('returns hasChanges: false when nothing changed', async () => {
    nock(BASE_URL).post('/api/external/v2/publish/republish').reply(200, {
      message: 'No changes detected since last publication',
      hasChanges: false,
    });
    const result = await api.republish();
    expect(result.hasChanges).toBe(false);
  });
});

describe('publishApi.unpublish', () => {
  it('calls DELETE and returns message', async () => {
    nock(BASE_URL).delete('/api/external/v2/publish').reply(200, {
      message: 'Project unpublished successfully',
    });
    const result = await api.unpublish();
    expect(result.message).toBe('Project unpublished successfully');
  });
});
