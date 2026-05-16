import { AxiosInstance } from 'axios';

export interface PublishStatus {
  status: 'published' | 'unpublished' | 'publishing';
  publishedAt?: string | null;
  url?: string | null;
}

export const publishApi = (client: AxiosInstance) => ({
  now: () =>
    client.post<{ jobId: string }>('/publish').then(r => r.data),

  republish: () =>
    client.post<{ jobId: string }>('/publish/republish').then(r => r.data),

  status: () =>
    client.get<PublishStatus>('/publish/status').then(r => r.data),
});
