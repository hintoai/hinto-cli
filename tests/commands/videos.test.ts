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
  it('returns jobId on import', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/videos/import', { url: 'https://example.com/video.mp4' })
      .reply(202, { jobId: 'j-abc', status: 'pending', message: 'Video import started' });

    const result = await api.import('https://example.com/video.mp4');
    expect(result.jobId).toBe('j-abc');
    expect(result.status).toBe('pending');
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

describe('videosApi.uploadPresigned', () => {
  it('requests a presigned URL', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/videos/upload/presigned', { filename: 'video.mp4', content_type: 'video/mp4' })
      .reply(200, {
        video_id: 'v-new',
        upload_url: 'https://s3.example.com/upload',
        s3_url: 'https://s3.example.com/video.mp4',
        expires_in: 3600,
      });

    const result = await api.uploadPresigned('video.mp4', 'video/mp4');
    expect(result.video_id).toBe('v-new');
    expect(result.upload_url).toBe('https://s3.example.com/upload');
  });
});

describe('videosApi.uploadComplete', () => {
  it('completes the upload', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/videos/upload/complete', { videoId: 'v-new' })
      .reply(200, { videoId: 'v-new', status: 'pending', createdAt: '2026-01-01' });

    const result = await api.uploadComplete('v-new');
    expect(result.videoId).toBe('v-new');
  });
});
