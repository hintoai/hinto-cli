import { AxiosInstance } from 'axios';

interface PublishStatusResponse {
  isPublished: boolean;
  slug: string | null;
  url: string | null;
  publicationId: string | null;
  publishedAt: string | null;
  articlesCount: number | null;
  foldersCount: number | null;
}

export interface PublishStatus extends PublishStatusResponse {
  status: 'published' | 'unpublished';
}

export const publishApi = (client: AxiosInstance) => ({
  now: () =>
    client.post<import('./generate').Job>('/publish').then(r => r.data),

  republish: () =>
    client.post<import('./generate').Job>('/publish/republish').then(r => r.data),

  status: () =>
    client.get<PublishStatusResponse>('/publish/status').then(r => ({
      ...r.data,
      status: (r.data.isPublished ? 'published' : 'unpublished') as 'published' | 'unpublished',
    })),

  unpublish: () =>
    client.delete<{ message: string }>('/publish').then(r => r.data),
});
