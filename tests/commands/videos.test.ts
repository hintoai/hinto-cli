import nock from 'nock';
import { createClient } from '../../src/api/client';
import { videosApi } from '../../src/api/videos';

const BASE_URL = 'https://app.hinto.ai';
const client = createClient('test_key', BASE_URL);
const api = videosApi(client);

afterEach(() => nock.cleanAll());

describe('videosApi.list', () => {
  it('returns video list', async () => {
    nock(BASE_URL)
      .get('/api/external/v2/videos')
      .reply(200, { videos: [{ videoId: 'v1', status: 'ready', createdAt: '2026-01-01' }], total: 1 });

    const result = await api.list();
    expect(result.videos).toHaveLength(1);
    expect(result.videos[0].videoId).toBe('v1');
  });
});

describe('videosApi.import', () => {
  it('returns videoId on import', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/videos/import', { url: 'https://example.com/video.mp4' })
      .reply(200, { videoId: 'v2', status: 'pending' });

    const result = await api.import('https://example.com/video.mp4');
    expect(result.videoId).toBe('v2');
  });
});

describe('videosApi.delete', () => {
  it('calls DELETE endpoint', async () => {
    nock(BASE_URL)
      .delete('/api/external/v2/videos/v1')
      .reply(200, { deleted: true });

    await expect(api.delete('v1')).resolves.not.toThrow();
  });
});
