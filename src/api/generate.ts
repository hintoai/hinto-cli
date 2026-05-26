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
  start: (videoId: string, templateId: number) =>
    client.post<{ jobId: string }>('/generate', { video_id: videoId, template_id: templateId }).then(r => r.data),

  status: (jobId: string) =>
    client.get<Job>(`/generate/${jobId}`).then(r => r.data),

  structure: (params?: { autoGenerate?: boolean }) =>
    client.post<{ jobId: string }>('/generate/structure', params).then(r => r.data),
});
