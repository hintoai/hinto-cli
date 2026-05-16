import nock from 'nock';
import { createClient } from '../../src/api/client';
import { publishApi } from '../../src/api/publish';

const BASE_URL = 'https://app.hinto.ai';
const client = createClient('test_key', BASE_URL);
const api = publishApi(client);

afterEach(() => nock.cleanAll());

describe('publishApi.status', () => {
  it('returns publish status', async () => {
    nock(BASE_URL).get('/api/external/v2/publish/status').reply(200, { status: 'published', publishedAt: '2026-01-01' });
    const result = await api.status();
    expect(result.status).toBe('published');
  });
});

describe('publishApi.now', () => {
  it('starts a publish job', async () => {
    nock(BASE_URL).post('/api/external/v2/publish').reply(202, { jobId: 'j2' });
    const result = await api.now();
    expect(result.jobId).toBe('j2');
  });
});
