import nock from 'nock';
import { createClient } from '../../src/api/client';
import { publishApi } from '../../src/api/publish';

const BASE_URL = 'https://app.hinto.ai';
const client = createClient('test_key', BASE_URL);
const api = publishApi(client);

afterEach(() => nock.cleanAll());

const mockJob = (jobId: string, type: string) => ({
  jobId,
  type,
  status: 'pending' as const,
  output: null,
  error: null,
  createdAt: '2026-01-01T00:00:00Z',
  completedAt: null,
});

describe('publishApi.status', () => {
  it('returns publish status', async () => {
    nock(BASE_URL).get('/api/external/v2/publish/status').reply(200, {
      isPublished: true,
      publishedAt: '2026-01-01',
      slug: 'my-docs',
      url: 'https://my-docs.hintoai.com',
      publicationId: 'pub-1',
      articlesCount: 5,
      foldersCount: 2,
    });
    const result = await api.status();
    expect(result.status).toBe('published');
    expect(result.slug).toBe('my-docs');
  });
});

describe('publishApi.now', () => {
  it('returns a Job object with jobId', async () => {
    nock(BASE_URL).post('/api/external/v2/publish').reply(202, mockJob('job-publish-1', 'publish'));
    const result = await api.now();
    expect(result.jobId).toBe('job-publish-1');
    expect(result.type).toBe('publish');
    expect(result.status).toBe('pending');
  });

  it('sends callbackUrl and callbackSecret in request body when provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/publish', {
        callbackUrl: 'https://example.com/hook',
        callbackSecret: 'secret123',
      })
      .reply(202, mockJob('job-publish-2', 'publish'));
    const result = await api.now('https://example.com/hook', 'secret123');
    expect(result.jobId).toBe('job-publish-2');
  });

  it('omits callbackUrl and callbackSecret from body when not provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/publish', {})
      .reply(202, mockJob('job-publish-3', 'publish'));
    const result = await api.now();
    expect(result.jobId).toBe('job-publish-3');
  });
});

describe('publishApi.republish', () => {
  it('returns a Job object with jobId', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/publish/republish')
      .reply(202, mockJob('job-republish-1', 'republish'));
    const result = await api.republish();
    expect(result.jobId).toBe('job-republish-1');
    expect(result.type).toBe('republish');
    expect(result.status).toBe('pending');
  });

  it('sends callbackUrl and callbackSecret in request body when provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/publish/republish', {
        callbackUrl: 'https://example.com/hook',
        callbackSecret: 'mysecret',
      })
      .reply(202, mockJob('job-republish-2', 'republish'));
    const result = await api.republish('https://example.com/hook', 'mysecret');
    expect(result.jobId).toBe('job-republish-2');
  });

  it('omits callbackUrl and callbackSecret from body when not provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/publish/republish', {})
      .reply(202, mockJob('job-republish-3', 'republish'));
    const result = await api.republish();
    expect(result.jobId).toBe('job-republish-3');
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
