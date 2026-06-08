import nock from 'nock';
import { createClient } from '../src/api/client';
import { pollJob } from '../src/poll';

const BASE_URL = 'https://app.hinto.ai';
const client = createClient('test_key', BASE_URL);

afterEach(() => nock.cleanAll());

describe('pollJob', () => {
  it('resolves with output when job completes', async () => {
    nock(BASE_URL)
      .get('/api/external/v2/generate/job-123')
      .reply(200, { jobId: 'job-123', status: 'processing', output: null })
      .get('/api/external/v2/generate/job-123')
      .reply(200, { jobId: 'job-123', status: 'completed', output: { articles: 5 } });

    const result = await pollJob(client, 'job-123', 10, 5000);
    expect(result).toEqual({ articles: 5 });
  });

  it('rejects when job fails', async () => {
    nock(BASE_URL)
      .get('/api/external/v2/generate/job-123')
      .reply(200, { jobId: 'job-123', status: 'failed', error: 'Out of credits', output: null });

    await expect(pollJob(client, 'job-123', 10, 5000)).rejects.toThrow('Out of credits');
  });

  it('rejects on timeout', async () => {
    nock(BASE_URL)
      .get('/api/external/v2/generate/job-123')
      .reply(200, { jobId: 'job-123', status: 'processing', output: null })
      .persist();

    await expect(pollJob(client, 'job-123', 10, 50)).rejects.toThrow('timed out');
  });

  it('resolves when status transitions from processing to completed', async () => {
    nock(BASE_URL)
      .get('/api/external/v2/generate/job-456')
      .reply(200, { jobId: 'job-456', status: 'processing', output: null })
      .get('/api/external/v2/generate/job-456')
      .reply(200, { jobId: 'job-456', status: 'completed', output: { done: true } });

    const result = await pollJob(client, 'job-456', 10, 5000);
    expect(result).toEqual({ done: true });
  });
});
