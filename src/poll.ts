import { AxiosInstance } from 'axios';

interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  output: unknown | null;
  error?: string | null;
}

export async function pollJob(
  client: AxiosInstance,
  jobId: string,
  intervalMs = 2000,
  timeoutMs = 300_000
): Promise<unknown> {
  process.stderr.write(`Waiting for job ${jobId}…\n`);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const { data } = await client.get<JobStatus>(`/generate/${jobId}`);

    if (data.status === 'completed') {
      process.stderr.write(`Job ${jobId} completed\n`);
      return data.output;
    }
    if (data.status === 'failed') {
      process.stderr.write(`Job ${jobId} failed\n`);
      throw new Error(data.error ?? 'Job failed with no error message');
    }

    await sleep(intervalMs);
  }

  throw new Error(`Job ${jobId} timed out after ${timeoutMs / 1000}s`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
