import { AxiosInstance } from 'axios';

export interface Job {
  jobId: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  output: unknown | null;
  error?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export const generateApi = (client: AxiosInstance) => ({
  start: (videoId: string, templateId?: number) =>
    client.post<{ jobId: string; articleId: number; status: string; message: string }>(
      '/generate',
      { video_id: videoId, ...(templateId !== undefined ? { template_id: templateId } : {}) }
    ).then(r => r.data),

  status: (jobId: string) =>
    client.get<Job>(`/generate/${jobId}`).then(r => r.data),

  structure: (videoId: string) =>
    client.post<{ jobId: string }>('/generate/structure', { video_id: videoId }).then(r => r.data),
});
