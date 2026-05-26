import nock from 'nock';
import { createClient } from '../../src/api/client';
import { generateApi } from '../../src/api/generate';

const BASE_URL = 'https://app.hinto.ai';
const client = createClient('test_key', BASE_URL);
const api = generateApi(client);

afterEach(() => nock.cleanAll());

describe('generateApi.start', () => {
  it('starts a generation job', async () => {
    nock(BASE_URL).post('/api/external/v2/generate', { video_id: 'v1', template_id: 42 }).reply(202, { jobId: 'j1' });
    const result = await api.start('v1', 42);
    expect(result.jobId).toBe('j1');
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
});
