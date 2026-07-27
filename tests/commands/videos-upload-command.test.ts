import { Command } from 'commander';
import * as fs from 'fs';
import nock from 'nock';
import * as os from 'os';
import * as path from 'path';
import { createClient } from '../../src/api/client';
import { registerVideos } from '../../src/commands/videos';

const BASE_URL = 'https://app.hinto.ai';
const S3 = 'https://s3.example.com';
const VIDEO_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
const KEY = `videos/original/${VIDEO_ID}.mp4`;

let tmpDir: string;
let stdout: string;
let stderr: string;

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerVideos(program, createClient('test_key', BASE_URL));
  return program;
}

function writeFileOfSize(name: string, bytes: number) {
  const p = path.join(tmpDir, name);
  fs.writeFileSync(p, Buffer.alloc(bytes, 3));
  return p;
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hinto-cmd-'));
  stdout = '';
  stderr = '';
  jest.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    stdout += String(chunk);
    return true;
  });
  jest.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
    stderr += String(chunk);
    return true;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  nock.cleanAll();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('hinto videos upload', () => {
  it('rejects a file over the ceiling locally, without contacting the API', async () => {
    const file = path.join(tmpDir, 'huge.mp4');
    // Sparse file: 2 GB + 1 byte of apparent size, no real disk cost.
    const fd = fs.openSync(file, 'w');
    fs.ftruncateSync(fd, 2_000_000_001);
    fs.closeSync(fd);

    // Registered but must stay unconsumed: the guard has to fire before any
    // network call, otherwise an oversize file still costs a round-trip.
    const createMock = nock(BASE_URL)
      .post('/api/external/v2/videos/upload/multipart/create')
      .reply(200, {});

    const exit = jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit');
    }) as never);

    await expect(
      buildProgram().parseAsync(['node', 'hinto', 'videos', 'upload', '--file', file]),
    ).rejects.toThrow();

    expect(stderr).toMatch(/too large/i);
    expect(createMock.isDone()).toBe(false);
    exit.mockRestore();
  });

  it('uses the multipart path for a large file', async () => {
    const file = writeFileOfSize('big.mp4', 250);

    nock(BASE_URL).post('/api/external/v2/videos/upload/multipart/create').reply(200, {
      videoId: VIDEO_ID,
      key: KEY,
      uploadId: 'upload-123',
      partSize: 100,
      partCount: 3,
    });
    nock(BASE_URL)
      .post('/api/external/v2/videos/upload/multipart/sign')
      .reply(200, {
        urls: [
          { partNumber: 1, url: `${S3}/p1` },
          { partNumber: 2, url: `${S3}/p2` },
          { partNumber: 3, url: `${S3}/p3` },
        ],
        expiresIn: 3600,
      });
    nock(S3).put('/p1').reply(200, '', { etag: 'aaa' });
    nock(S3).put('/p2').reply(200, '', { etag: 'bbb' });
    nock(S3).put('/p3').reply(200, '', { etag: 'ccc' });
    nock(BASE_URL)
      .post('/api/external/v2/videos/upload/multipart/complete')
      .reply(200, { videoId: VIDEO_ID, url: 'https://x', url_expires_at: 'z' });

    // Threshold is MULTIPART_THRESHOLD_BYTES; the test overrides it via the flag
    // so it does not have to write a 50 MB fixture.
    await buildProgram().parseAsync([
      'node',
      'hinto',
      'videos',
      'upload',
      '--file',
      file,
      '--part-size',
      '100',
    ]);

    expect(stdout).toContain(`videoId=${VIDEO_ID}`);
  });

  it('verifies before reporting failure when a small-file PUT errors but the object landed', async () => {
    const file = writeFileOfSize('small.mp4', 32);

    nock(BASE_URL)
      .post('/api/external/v2/videos/upload/presigned')
      .reply(200, { videoId: VIDEO_ID, uploadUrl: `${S3}/single`, key: KEY, expiresIn: 300 });
    // Cloudflare abandons the response at ~100s while the body keeps flowing to
    // the origin, so a 524 does not mean the object is absent.
    nock(S3).put('/single').reply(524, 'a timeout occurred');
    nock(BASE_URL)
      .post('/api/external/v2/videos/upload/complete')
      .reply(200, { videoId: VIDEO_ID, url: 'https://x', url_expires_at: 'z' });

    await buildProgram().parseAsync(['node', 'hinto', 'videos', 'upload', '--file', file]);

    expect(stdout).toContain(`videoId=${VIDEO_ID}`);
    expect(stderr).toMatch(/verifying/i);
  });

  it('reports failure when the verify shows the object really is absent', async () => {
    const file = writeFileOfSize('small.mp4', 32);

    nock(BASE_URL)
      .post('/api/external/v2/videos/upload/presigned')
      .reply(200, { videoId: VIDEO_ID, uploadUrl: `${S3}/single`, key: KEY, expiresIn: 300 });
    nock(S3).put('/single').reply(524, 'a timeout occurred');
    nock(BASE_URL)
      .post('/api/external/v2/videos/upload/complete')
      .reply(404, { error: { code: 'FILE_NOT_FOUND', message: 'File not found in storage' } });

    const exit = jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit');
    }) as never);

    await expect(
      buildProgram().parseAsync(['node', 'hinto', 'videos', 'upload', '--file', file]),
    ).rejects.toThrow();

    expect(stderr).toMatch(/524/);
    exit.mockRestore();
  });
});
