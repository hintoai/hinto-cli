import { AxiosInstance } from 'axios';

export interface Article {
  id: string;
  title: string;
  slug: string;
  format: 'markdown' | 'html';
  content: string;
  metadata?: Record<string, unknown>;
  folderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleVersion {
  vId: string;
  createdAt: string;
}

export const articlesApi = (client: AxiosInstance) => ({
  list: (params?: { folderId?: string; page?: number; limit?: number }) =>
    client.get<{ articles: Article[]; total: number }>('/articles', { params }).then(r => r.data),

  get: (id: string) =>
    client.get<Article>(`/articles/${id}`).then(r => r.data),

  create: (body: { title: string; content?: string; folderId?: string }) =>
    client.post<Article>('/articles', body).then(r => r.data),

  update: (id: string, body: { title?: string; content?: string }) =>
    client.patch<Article>(`/articles/${id}`, body).then(r => r.data),

  delete: (id: string) =>
    client.delete(`/articles/${id}`).then(r => r.data),

  duplicate: (id: string) =>
    client.post<Article>(`/articles/${id}/duplicate`).then(r => r.data),

  move: (id: string, folderId: string) =>
    client.post<Article>(`/articles/${id}/move`, { folderId }).then(r => r.data),

  regenerate: (id: string) =>
    client.post<{ jobId: string }>(`/articles/${id}/regenerate`).then(r => r.data),

  listVersions: (id: string) =>
    client.get<{ versions: ArticleVersion[] }>(`/articles/${id}/versions`).then(r => r.data),

  restoreVersion: (id: string, vId: string) =>
    client.post<Article>(`/articles/${id}/versions/${vId}/restore`).then(r => r.data),

  listTranslations: (id: string) =>
    client.get<{ translations: Array<{ lang: string }> }>(`/articles/${id}/translations`).then(r => r.data),

  getTranslation: (id: string, lang: string) =>
    client.get<{ lang: string; content: string }>(`/articles/${id}/translations/${lang}`).then(r => r.data),
});
