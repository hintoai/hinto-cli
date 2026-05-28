import nock from 'nock';
import { createClient } from '../../src/api/client';
import { generateApi } from '../../src/api/generate';

const BASE_URL = 'https://app.hinto.ai';
const client = createClient('test_key', BASE_URL);
const api = generateApi(client);

afterEach(() => nock.cleanAll());

describe('generateApi.start', () => {
  it('starts a generation job with templateId', async () => {
    nock(BASE_URL).post('/api/external/v2/generate', { video_id: 'v1', template_id: 42 }).reply(202, { jobId: 'j1' });
    const result = await api.start('v1', 42);
    expect(result.jobId).toBe('j1');
  });

  it('omits template_id when not provided', async () => {
    nock(BASE_URL).post('/api/external/v2/generate', { video_id: 'v1' }).reply(202, { jobId: 'j2' });
    const result = await api.start('v1');
    expect(result.jobId).toBe('j2');
  });

  it('includes callback_url and callback_secret when provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/generate', {
        video_id: 'v1',
        callback_url: 'https://example.com/cb',
        callback_secret: 'my-secret',
      })
      .reply(202, { jobId: 'j3' });
    const result = await api.start('v1', undefined, 'https://example.com/cb', 'my-secret');
    expect(result.jobId).toBe('j3');
  });

  it('omits callback fields when not provided', async () => {
    nock(BASE_URL).post('/api/external/v2/generate', { video_id: 'v1', template_id: 5 }).reply(202, { jobId: 'j4' });
    const result = await api.start('v1', 5);
    expect(result.jobId).toBe('j4');
  });
});

describe('generateApi.status', () => {
  it('returns job status', async () => {
    nock(BASE_URL).get('/api/external/v2/generate/j1').reply(200, {
      jobId: 'j1', type: 'generate', status: 'completed', output: {}, createdAt: '2026-01-01',
    });
    const result = await api.status('j1');
    expect(result.status).toBe('completed');
  });
});

describe('generateApi.structure', () => {
  it('posts video_id in body', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/generate/structure', { video_id: 'v1' })
      .reply(202, { jobId: 'j-struct' });
    const result = await api.structure('v1');
    expect(result.jobId).toBe('j-struct');
  });

  it('includes callback_url and callback_secret when provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/generate/structure', {
        video_id: 'v1',
        callback_url: 'https://example.com/cb',
        callback_secret: 'struct-secret',
      })
      .reply(202, { jobId: 'j-struct-2' });
    const result = await api.structure('v1', 'https://example.com/cb', 'struct-secret');
    expect(result.jobId).toBe('j-struct-2');
  });

  it('omits callback fields when not provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/generate/structure', { video_id: 'v1' })
      .reply(202, { jobId: 'j-struct-3' });
    const result = await api.structure('v1');
    expect(result.jobId).toBe('j-struct-3');
  });
});
