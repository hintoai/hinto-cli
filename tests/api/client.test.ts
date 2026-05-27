import nock from 'nock';
import { createClient } from '../../src/api/client';
import { CliError } from '../../src/errors';

const BASE_URL = 'https://app.hinto.ai';

afterEach(() => nock.cleanAll());

describe('createClient interceptor — text/arraybuffer error parsing', () => {
  it('parses JSON error from a text response body (responseType: text)', async () => {
    const client = createClient('test_key', BASE_URL);

    nock(BASE_URL)
      .get('/api/external/v2/export/test')
      .reply(400, JSON.stringify({ error: { code: 'INVALID_FORMAT', message: 'Unsupported format' } }), {
        'Content-Type': 'application/json',
      });

    await expect(
      client.get('/export/test', { responseType: 'text' })
    ).rejects.toMatchObject({
      name: 'CliError',
      code: 'INVALID_FORMAT',
      message: 'Unsupported format',
    });
  });

  it('parses JSON error from an arraybuffer response body', async () => {
    const client = createClient('test_key', BASE_URL);
    const errorBody = JSON.stringify({ error: { code: 'INVALID_FORMAT', message: 'Unsupported format' } });

    nock(BASE_URL)
      .get('/api/external/v2/export/test')
      .reply(400, Buffer.from(errorBody), {
        'Content-Type': 'application/json',
      });

    await expect(
      client.get('/export/test', { responseType: 'arraybuffer' })
    ).rejects.toMatchObject({
      name: 'CliError',
      code: 'INVALID_FORMAT',
      message: 'Unsupported format',
    });
  });

  it('falls through to UNKNOWN_ERROR when body is not valid JSON', async () => {
    const client = createClient('test_key', BASE_URL);

    nock(BASE_URL)
      .get('/api/external/v2/export/test')
      .reply(400, 'Bad Request', { 'Content-Type': 'text/plain' });

    await expect(
      client.get('/export/test', { responseType: 'text' })
    ).rejects.toMatchObject({
      name: 'CliError',
      code: 'UNKNOWN_ERROR',
    });
  });

  it('still handles normal JSON 4xx errors (existing behaviour)', async () => {
    const client = createClient('test_key', BASE_URL);

    nock(BASE_URL)
      .get('/api/external/v2/videos')
      .reply(404, { error: { code: 'NOT_FOUND', message: 'Video not found' } });

    await expect(client.get('/videos')).rejects.toMatchObject({
      name: 'CliError',
      code: 'NOT_FOUND',
      message: 'Video not found',
    });
  });
});
