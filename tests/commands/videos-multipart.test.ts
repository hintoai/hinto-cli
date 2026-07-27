import nock from 'nock';
import { createClient } from '../../src/api/client';
import { videosApi } from '../../src/api/videos';

const BASE_URL = 'https://app.hinto.ai';
const client = createClient('test_key', BASE_URL);
const api = videosApi(client);
const KEY = 'videos/original/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed.mp4';

afterEach(() => nock.cleanAll());

describe('videosApi multipart', () => {
  it('creates a multipart upload', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/videos/upload/multipart/create', {
        filename: 'clip.mp4',
        contentType: 'video/mp4',
        fileSize: 300,
      })
      .reply(200, {
        videoId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        key: KEY,
        uploadId: 'upload-123',
        partSize: 100,
        partCount: 3,
      });

    const result = await api.multipartCreate('clip.mp4', 'video/mp4', 300);

    expect(result.uploadId).toBe('upload-123');
    expect(result.partCount).toBe(3);
  });

  it('signs a batch of part urls', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/videos/upload/multipart/sign', {
        key: KEY,
        uploadId: 'upload-123',
        partNumbers: [1, 2],
      })
      .reply(200, {
        urls: [
          { partNumber: 1, url: 'https://s3.example.com/p1' },
          { partNumber: 2, url: 'https://s3.example.com/p2' },
        ],
        expiresIn: 3600,
      });

    const result = await api.multipartSign(KEY, 'upload-123', [1, 2]);

    expect(result.urls).toHaveLength(2);
    expect(result.urls[0].url).toBe('https://s3.example.com/p1');
  });

  it('completes a multipart upload', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/videos/upload/multipart/complete', {
        videoId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        key: KEY,
        uploadId: 'upload-123',
        filename: 'clip.mp4',
        parts: [{ partNumber: 1, etag: 'aaa' }],
      })
      .reply(200, {
        videoId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        url: 'https://x',
        url_expires_at: 'z',
      });

    const result = await api.multipartComplete({
      videoId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      key: KEY,
      uploadId: 'upload-123',
      filename: 'clip.mp4',
      parts: [{ partNumber: 1, etag: 'aaa' }],
    });

    expect(result.videoId).toBe('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed');
  });

  it('aborts a multipart upload', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/videos/upload/multipart/abort', { key: KEY, uploadId: 'upload-123' })
      .reply(200, { aborted: true });

    await expect(api.multipartAbort(KEY, 'upload-123')).resolves.toBeUndefined();
  });

  it('surfaces a FILE_TOO_LARGE rejection as a CliError', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/videos/upload/multipart/create')
      .reply(413, {
        error: { code: 'FILE_TOO_LARGE', message: 'File too large (2500 MB). Maximum is 2000 MB.' },
      });

    await expect(api.multipartCreate('huge.mp4', 'video/mp4', 2_500_000_000)).rejects.toMatchObject(
      {
        name: 'CliError',
        code: 'FILE_TOO_LARGE',
      },
    );
  });
});
