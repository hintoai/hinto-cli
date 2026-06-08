import nock from 'nock';
import { createClient } from '../../src/api/client';
import { generateApi } from '../../src/api/generate';

const BASE_URL = 'https://app.hinto.ai';
const client = createClient('test_key', BASE_URL);
const api = generateApi(client);

afterEach(() => nock.cleanAll());

const mockJob = (jobId: string) => ({
  jobId,
  type: 'generate_article',
  status: 'pending',
  output: null,
  error: null,
  createdAt: '2026-01-01T00:00:00Z',
  completedAt: null,
});

describe('generateApi.start', () => {
  it('starts a generation job with templateId', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/generate', { videoId: 'v1', templateId: 42 })
      .reply(202, mockJob('j1'));
    const result = await api.start('v1', 42);
    expect(result.jobId).toBe('j1');
  });

  it('omits templateId when not provided', async () => {
    nock(BASE_URL).post('/api/external/v2/generate', { videoId: 'v1' }).reply(202, mockJob('j2'));
    const result = await api.start('v1');
    expect(result.jobId).toBe('j2');
  });

  it('includes callbackUrl and callbackSecret when provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/generate', {
        videoId: 'v1',
        callbackUrl: 'https://example.com/cb',
        callbackSecret: 'my-secret',
      })
      .reply(202, mockJob('j3'));
    const result = await api.start('v1', undefined, 'https://example.com/cb', 'my-secret');
    expect(result.jobId).toBe('j3');
  });

  it('omits callback fields when not provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/generate', { videoId: 'v1', templateId: 5 })
      .reply(202, mockJob('j4'));
    const result = await api.start('v1', 5);
    expect(result.jobId).toBe('j4');
  });
});

describe('generateApi.status', () => {
  it('returns job status', async () => {
    nock(BASE_URL).get('/api/external/v2/generate/j1').reply(200, {
      jobId: 'j1',
      type: 'generate',
      status: 'completed',
      output: {},
      createdAt: '2026-01-01',
    });
    const result = await api.status('j1');
    expect(result.status).toBe('completed');
  });
});

describe('generateApi.structure', () => {
  it('posts videoId in body', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/generate/structure', { videoId: 'v1' })
      .reply(202, { ...mockJob('j-struct'), type: 'generate_structure' });
    const result = await api.structure('v1');
    expect(result.jobId).toBe('j-struct');
  });

  it('includes templateId when provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/generate/structure', { videoId: 'v1', templateId: 7 })
      .reply(202, { ...mockJob('j-struct-tmpl'), type: 'generate_structure' });
    const result = await api.structure('v1', 7);
    expect(result.jobId).toBe('j-struct-tmpl');
  });

  it('omits templateId when not provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/generate/structure', { videoId: 'v1' })
      .reply(202, { ...mockJob('j-struct-no-tmpl'), type: 'generate_structure' });
    const result = await api.structure('v1', undefined);
    expect(result.jobId).toBe('j-struct-no-tmpl');
  });

  it('includes callbackUrl and callbackSecret when provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/generate/structure', {
        videoId: 'v1',
        callbackUrl: 'https://example.com/cb',
        callbackSecret: 'struct-secret',
      })
      .reply(202, { ...mockJob('j-struct-2'), type: 'generate_structure' });
    const result = await api.structure('v1', undefined, 'https://example.com/cb', 'struct-secret');
    expect(result.jobId).toBe('j-struct-2');
  });

  it('omits callback fields when not provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/generate/structure', { videoId: 'v1' })
      .reply(202, { ...mockJob('j-struct-3'), type: 'generate_structure' });
    const result = await api.structure('v1');
    expect(result.jobId).toBe('j-struct-3');
  });

  it('includes all optional fields together', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/generate/structure', {
        videoId: 'v1',
        templateId: 3,
        callbackUrl: 'https://example.com/cb',
        callbackSecret: 'all-opts-secret',
      })
      .reply(202, { ...mockJob('j-struct-all'), type: 'generate_structure' });
    const result = await api.structure('v1', 3, 'https://example.com/cb', 'all-opts-secret');
    expect(result.jobId).toBe('j-struct-all');
  });
});
