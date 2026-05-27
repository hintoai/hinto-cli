import axios, { AxiosInstance, AxiosError } from 'axios';
import { CliError } from '../errors';

export function createClient(apiKey: string, baseUrl: string): AxiosInstance {
  const instance = axios.create({
    baseURL: `${baseUrl}/api/external/v2`,
    headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    timeout: 30_000,
  });

  instance.interceptors.response.use(
    res => res,
    (err: AxiosError<{ error: { code: string; message: string } }>) => {
      const apiError = err.response?.data?.error;
      if (apiError) {
        if (apiError.code === 'UNAUTHORIZED') {
          throw new CliError('UNAUTHORIZED', 'Invalid API key. Run `hinto init --key <your-api-key>` to authenticate.');
        }
        throw new CliError(apiError.code, apiError.message);
      }
      if (!apiError && err.response?.data) {
        try {
          const raw = typeof err.response.data === 'string'
            ? err.response.data
            : Buffer.from(err.response.data as unknown as ArrayBuffer).toString('utf-8')
          const parsed = JSON.parse(raw)
          if (parsed?.error) {
            if (parsed.error.code === 'UNAUTHORIZED') {
              throw new CliError('UNAUTHORIZED', 'Invalid API key. Run `hinto init --key <your-api-key>` to authenticate.');
            }
            throw new CliError(parsed.error.code, parsed.error.message ?? 'Unknown error')
          }
        } catch (parseErr) {
          if (parseErr instanceof CliError) throw parseErr
          // ignore parse failures — fall through to generic message
        }
      }
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        throw new CliError('NETWORK_ERROR', 'Could not reach Hinto API — check your connection');
      }
      throw new CliError('UNKNOWN_ERROR', err.message ?? 'An unexpected error occurred');
    }
  );

  return instance;
}
