import * as fs from 'fs';
import nock from 'nock';
import * as os from 'os';
import * as path from 'path';
import { type MultipartUploadApi, uploadFileMultipart } from '../src/upload';

const S3 = 'https://s3.example.com';
const KEY = 'videos/original/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed.mp4';
const VIDEO_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';

let tmpDir: string;
let filePath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hinto-upload-'));
  filePath = path.join(tmpDir, 'clip.mp4');
  // 250 bytes with a 100-byte part size => 3 parts, last one short.
  fs.writeFileSync(filePath, Buffer.alloc(250, 7));
});

afterEach(() => {
  nock.cleanAll();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function fakeApi(overrides: Partial<MultipartUploadApi> = {}): MultipartUploadApi {
  return {
    multipartCreate: jest.fn().mockResolvedValue({
      videoId: VIDEO_ID,
      key: KEY,
      uploadId: 'upload-123',
      partSize: 100,
      partCount: 3,
    }),
    multipartSign: jest.fn().mockImplementation((_k, _u, partNumbers: number[]) =>
      Promise.resolve({
        urls: partNumbers.map((partNumber) => ({ partNumber, url: `${S3}/part-${partNumber}` })),
        expiresIn: 3600,
      }),
    ),
    multipartComplete: jest.fn().mockResolvedValue({ videoId: VIDEO_ID }),
    multipartAbort: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('uploadFileMultipart', () => {
  it('uploads every part and completes with the collected etags in order', async () => {
    nock(S3).put('/part-1').reply(200, '', { etag: 'aaa' });
    nock(S3).put('/part-2').reply(200, '', { etag: 'bbb' });
    nock(S3).put('/part-3').reply(200, '', { etag: 'ccc' });
    const api = fakeApi();

    const result = await uploadFileMultipart({
      filePath,
      filename: 'clip.mp4',
      contentType: 'video/mp4',
      fileSize: 250,
      api,
    });

    expect(result.videoId).toBe(VIDEO_ID);
    expect(api.multipartComplete).toHaveBeenCalledWith({
      videoId: VIDEO_ID,
      key: KEY,
      uploadId: 'upload-123',
      filename: 'clip.mp4',
      parts: [
        { partNumber: 1, etag: 'aaa' },
        { partNumber: 2, etag: 'bbb' },
        { partNumber: 3, etag: 'ccc' },
      ],
    });
  });

  it('slices the file so the final short part carries the remaining bytes', async () => {
    const bodies: number[] = [];
    // Asserted via Content-Length, which the uploader sets from the slice it
    // read. nock normalises binary request bodies, so the raw body is not a
    // reliable place to measure part size.
    function capture(this: { req: { headers: Record<string, string> } }, etag: string) {
      bodies.push(Number(this.req.headers['content-length']));
      return [200, '', { etag }] as [number, string, Record<string, string>];
    }
    nock(S3)
      .put('/part-1')
      .reply(function () {
        return capture.call(this as never, 'aaa');
      });
    nock(S3)
      .put('/part-2')
      .reply(function () {
        return capture.call(this as never, 'bbb');
      });
    nock(S3)
      .put('/part-3')
      .reply(function () {
        return capture.call(this as never, 'ccc');
      });

    await uploadFileMultipart({
      filePath,
      filename: 'clip.mp4',
      contentType: 'video/mp4',
      fileSize: 250,
      api: fakeApi(),
    });

    expect(bodies.sort((a, b) => b - a)).toEqual([100, 100, 50]);
  });

  it('retries a part that returns 524 — the exact failure this fix exists for', async () => {
    nock(S3).put('/part-1').reply(524, 'a timeout occurred');
    nock(S3).put('/part-1').reply(200, '', { etag: 'aaa' });
    nock(S3).put('/part-2').reply(200, '', { etag: 'bbb' });
    nock(S3).put('/part-3').reply(200, '', { etag: 'ccc' });

    const result = await uploadFileMultipart({
      filePath,
      filename: 'clip.mp4',
      contentType: 'video/mp4',
      fileSize: 250,
      api: fakeApi(),
      retryDelayMs: 0,
    });

    expect(result.videoId).toBe(VIDEO_ID);
  });

  it('gives up after the attempt budget and aborts so no parts are orphaned', async () => {
    nock(S3).put('/part-1').times(4).reply(524, 'a timeout occurred');
    nock(S3).put('/part-2').optionally().times(4).reply(200, '', { etag: 'bbb' });
    nock(S3).put('/part-3').optionally().times(4).reply(200, '', { etag: 'ccc' });
    const api = fakeApi();

    await expect(
      uploadFileMultipart({
        filePath,
        filename: 'clip.mp4',
        contentType: 'video/mp4',
        fileSize: 250,
        api,
        retryDelayMs: 0,
      }),
    ).rejects.toThrow(/part 1/i);

    expect(api.multipartAbort).toHaveBeenCalledWith(KEY, 'upload-123');
    expect(api.multipartComplete).not.toHaveBeenCalled();
  });

  it('fails fast on a 4xx instead of burning the retry budget', async () => {
    // Two interceptors are registered but only one may be consumed. If the code
    // wrongly retried a 403, the second would be consumed too and the
    // pending-mock assertion below would fail.
    nock(S3).put('/part-1').reply(403, 'signature does not match');
    nock(S3).put('/part-1').reply(200, '', { etag: 'should-never-be-reached' });
    nock(S3).put('/part-2').optionally().reply(200, '', { etag: 'bbb' });
    nock(S3).put('/part-3').optionally().reply(200, '', { etag: 'ccc' });

    await expect(
      uploadFileMultipart({
        filePath,
        filename: 'clip.mp4',
        contentType: 'video/mp4',
        fileSize: 250,
        api: fakeApi(),
        retryDelayMs: 0,
      }),
    ).rejects.toThrow(/403/);

    // One attempt only: a rejected signature will never succeed on retry.
    expect(nock.pendingMocks().filter((m) => m.includes('/part-1'))).toHaveLength(1);
  });

  it('errors when a part response carries no ETag, rather than completing with a hole', async () => {
    nock(S3).put('/part-1').reply(200, '');
    nock(S3).put('/part-2').optionally().reply(200, '', { etag: 'bbb' });
    nock(S3).put('/part-3').optionally().reply(200, '', { etag: 'ccc' });

    await expect(
      uploadFileMultipart({
        filePath,
        filename: 'clip.mp4',
        contentType: 'video/mp4',
        fileSize: 250,
        api: fakeApi(),
        retryDelayMs: 0,
      }),
    ).rejects.toThrow(/ETag/i);
  });

  it('reports monotonic progress up to the total size', async () => {
    nock(S3).put('/part-1').reply(200, '', { etag: 'aaa' });
    nock(S3).put('/part-2').reply(200, '', { etag: 'bbb' });
    nock(S3).put('/part-3').reply(200, '', { etag: 'ccc' });
    const seen: number[] = [];

    await uploadFileMultipart({
      filePath,
      filename: 'clip.mp4',
      contentType: 'video/mp4',
      fileSize: 250,
      api: fakeApi(),
      onProgress: (uploaded) => seen.push(uploaded),
    });

    expect(seen[seen.length - 1]).toBe(250);
    expect([...seen].sort((a, b) => a - b)).toEqual(seen);
  });
});
