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
  now: (callbackUrl?: string, callbackSecret?: string) =>
    client.post<import('./generate').Job>('/publish', {
      ...(callbackUrl ? { callbackUrl } : {}),
      ...(callbackSecret ? { callbackSecret } : {}),
    }).then(r => r.data),

  republish: (callbackUrl?: string, callbackSecret?: string) =>
    client.post<import('./generate').Job>('/publish/republish', {
      ...(callbackUrl ? { callbackUrl } : {}),
      ...(callbackSecret ? { callbackSecret } : {}),
    }).then(r => r.data),

  status: () =>
    client.get<PublishStatusResponse>('/publish/status').then(r => ({
      ...r.data,
      status: (r.data.isPublished ? 'published' : 'unpublished') as 'published' | 'unpublished',
    })),

  unpublish: () =>
    client.delete<{ message: string }>('/publish').then(r => r.data),
});
