import type { AxiosInstance } from 'axios';

export interface Job {
  jobId: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  output: unknown | null;
  error?: string | null;
  createdAt: string;
  completedAt: string | null;
}

export const generateApi = (client: AxiosInstance) => ({
  start: (opts: {
    videoId: string;
    templateId?: number;
    brief?: string;
    callbackUrl?: string;
    callbackSecret?: string;
  }) =>
    client
      .post<Job>('/generate', {
        videoId: opts.videoId,
        ...(opts.templateId !== undefined ? { templateId: opts.templateId } : {}),
        ...(opts.brief ? { brief: opts.brief } : {}),
        ...(opts.callbackUrl ? { callbackUrl: opts.callbackUrl } : {}),
        ...(opts.callbackSecret ? { callbackSecret: opts.callbackSecret } : {}),
      })
      .then((r) => r.data),

  status: (jobId: string) => client.get<Job>(`/generate/${jobId}`).then((r) => r.data),

  structure: (
    videoId: string,
    templateId?: number,
    callbackUrl?: string,
    callbackSecret?: string,
  ) =>
    client
      .post<Job>('/generate/structure', {
        videoId,
        ...(templateId !== undefined ? { templateId } : {}),
        ...(callbackUrl ? { callbackUrl } : {}),
        ...(callbackSecret ? { callbackSecret } : {}),
      })
      .then((r) => r.data),
});
