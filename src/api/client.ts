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
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        throw new CliError('NETWORK_ERROR', 'Could not reach Hinto API — check your connection');
      }
      throw new CliError('UNKNOWN_ERROR', err.message ?? 'An unexpected error occurred');
    }
  );

  return instance;
}
