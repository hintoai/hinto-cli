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
      .reply(200, {
        videos: [
          {
            videoId: 'v1',
            filename: 'video.mp4',
            durationSeconds: 120,
            status: 'ready',
            createdAt: '2026-01-01',
          },
        ],
        pagination: { limit: 20, offset: 0, count: 1 },
      });

    const result = await api.list();
    expect(result.videos).toHaveLength(1);
    expect(result.videos[0].videoId).toBe('v1');
    expect(result.videos[0].status).toBe('ready');
    expect(result.videos[0].createdAt).toBe('2026-01-01');
  });
});

const mockImportJob = (jobId: string) => ({
  jobId,
  type: 'import_video_url',
  status: 'pending',
  output: null,
  error: null,
  createdAt: '2026-01-01T00:00:00Z',
  completedAt: null,
});

describe('videosApi.import', () => {
  it('returns jobId on import with url only', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/videos/import', { url: 'https://example.com/video.mp4' })
      .reply(202, mockImportJob('j-abc'));

    const result = await api.import('https://example.com/video.mp4');
    expect(result.jobId).toBe('j-abc');
    expect(result.status).toBe('pending');
    expect(result.type).toBe('import_video_url');
  });

  it('includes name when provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/videos/import', {
        url: 'https://example.com/video.mp4',
        name: 'My Video',
      })
      .reply(202, mockImportJob('j-name'));

    const result = await api.import('https://example.com/video.mp4', 'My Video');
    expect(result.jobId).toBe('j-name');
  });

  it('includes callbackUrl when provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/videos/import', {
        url: 'https://example.com/video.mp4',
        callbackUrl: 'https://cb.example.com',
      })
      .reply(202, mockImportJob('j-cb'));

    const result = await api.import(
      'https://example.com/video.mp4',
      undefined,
      'https://cb.example.com',
    );
    expect(result.jobId).toBe('j-cb');
  });

  it('includes callbackSecret when both callback fields provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/videos/import', {
        url: 'https://example.com/video.mp4',
        callbackUrl: 'https://cb.example.com',
        callbackSecret: 'my-secret',
      })
      .reply(202, mockImportJob('j-cb-secret'));

    const result = await api.import(
      'https://example.com/video.mp4',
      undefined,
      'https://cb.example.com',
      'my-secret',
    );
    expect(result.jobId).toBe('j-cb-secret');
  });

  it('omits optional fields when not provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/videos/import', { url: 'https://example.com/video.mp4' })
      .reply(202, mockImportJob('j-no-opts'));

    const result = await api.import(
      'https://example.com/video.mp4',
      undefined,
      undefined,
      undefined,
    );
    expect(result.jobId).toBe('j-no-opts');
  });

  it('includes all optional fields together', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/videos/import', {
        url: 'https://example.com/video.mp4',
        name: 'All Options',
        callbackUrl: 'https://cb.example.com',
        callbackSecret: 'all-secret',
      })
      .reply(202, mockImportJob('j-all'));

    const result = await api.import(
      'https://example.com/video.mp4',
      'All Options',
      'https://cb.example.com',
      'all-secret',
    );
    expect(result.jobId).toBe('j-all');
  });
});

describe('videosApi.delete', () => {
  it('calls DELETE endpoint', async () => {
    nock(BASE_URL).delete('/api/external/v2/videos/v1').reply(200, { deleted: true });

    await expect(api.delete('v1')).resolves.not.toThrow();
  });
});

describe('videosApi.uploadPresigned', () => {
  it('requests a presigned URL and returns key from server', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/videos/upload/presigned', {
        filename: 'video.mp4',
        contentType: 'video/mp4',
      })
      .reply(200, {
        videoId: 'v-new',
        uploadUrl: 'https://s3.example.com/upload',
        s3Url: 'https://s3.example.com/video.mp4',
        key: 'videos/original/v-new.mp4',
        expiresIn: 3600,
      });

    const result = await api.uploadPresigned('video.mp4', 'video/mp4');
    expect(result.videoId).toBe('v-new');
    expect(result.uploadUrl).toBe('https://s3.example.com/upload');
    expect(result.key).toBe('videos/original/v-new.mp4');
  });
});

describe('videosApi.uploadComplete', () => {
  it('completes the upload', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/videos/upload/complete', {
        key: 'videos/original/v-new.mp4',
        fileId: 'v-new',
        filename: 'video.mp4',
      })
      .reply(200, { videoId: 'v-new' });

    const result = await api.uploadComplete('v-new', 'videos/original/v-new.mp4', 'video.mp4');
    expect(result.videoId).toBe('v-new');
  });
});

describe('videosApi.get', () => {
  it('returns a video with camelCase fields', async () => {
    nock(BASE_URL).get('/api/external/v2/videos/v1').reply(200, {
      videoId: 'v1',
      filename: 'video.mp4',
      status: 'ready',
      durationSeconds: 120,
      createdAt: '2026-01-01',
    });

    const result = await api.get('v1');
    expect(result.videoId).toBe('v1');
    expect(result.filename).toBe('video.mp4');
    expect(result.status).toBe('ready');
    expect(result.durationSeconds).toBe(120);
    expect(result.createdAt).toBe('2026-01-01');
  });

  it('handles optional fields', async () => {
    nock(BASE_URL).get('/api/external/v2/videos/v2').reply(200, {
      videoId: 'v2',
      filename: null,
      status: 'processing',
      durationSeconds: null,
      createdAt: '2026-01-02',
    });

    const result = await api.get('v2');
    expect(result.videoId).toBe('v2');
    expect(result.filename).toBeNull();
    expect(result.durationSeconds).toBeNull();
  });
});

describe('videosApi.status', () => {
  it('returns video status with camelCase fields', async () => {
    nock(BASE_URL)
      .get('/api/external/v2/videos/v1/status')
      .reply(200, { videoId: 'v1', status: 'ready', createdAt: '2026-01-01' });

    const result = await api.status('v1');
    expect(result.videoId).toBe('v1');
    expect(result.status).toBe('ready');
  });
});
