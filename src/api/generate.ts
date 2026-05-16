import { AxiosInstance } from 'axios';

export interface Job {
  jobId: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output: unknown | null;
  error?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export const generateApi = (client: AxiosInstance) => ({
  start: (videoId: string) =>
    client.post<{ jobId: string }>('/generate', { videoId }).then(r => r.data),

  status: (jobId: string) =>
    client.get<Job>(`/generate/${jobId}`).then(r => r.data),

  structure: (params?: { autoGenerate?: boolean }) =>
    client.post<{ jobId: string }>('/generate/structure', params).then(r => r.data),
});
