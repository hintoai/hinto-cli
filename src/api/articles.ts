import { AxiosInstance } from 'axios';

export interface Article {
  id: number;
  title: string;
  slug: string | null;
  folderId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleDetail {
  id: number;
  title: string;
  slug: string | null;
  format: string;
  content: string;
  metadata: {
    metaDescription: string | null;
    metaKeywords: string | null;
    jsonLd: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
}

export interface ArticleVersion {
  id: string;
  createdAt: string;
}

export interface ArticleTranslation {
  languageCode: string;
  status: string;
  title: string | null;
  slug: string | null;
  metaDescription: string | null;
  metaKeywords: string[] | null;
  hasContent: boolean;
  updatedAt: string;
}

export const articlesApi = (client: AxiosInstance) => ({
  list: (params?: { folder_id?: string; offset?: number; limit?: number }) =>
    client.get<{ articles: Article[]; pagination: { limit: number; offset: number; count: number } }>('/articles', { params }).then(r => r.data),

  get: (id: string) =>
    client.get<ArticleDetail>(`/articles/${id}`).then(r => r.data),

  create: (body: { title: string; markdown?: string; folder_id?: string }) =>
    client.post<{ id: number; title: string; slug: string | null }>('/articles', body).then(r => r.data),

  update: (id: string, body: { title?: string; slug?: string; meta_description?: string }) =>
    client.put<{ id: number; title: string; slug: string | null; updatedAt: string }>(`/articles/${id}`, body).then(r => r.data),

  delete: (id: string) =>
    client.delete(`/articles/${id}`).then(r => r.data),

  duplicate: (id: string) =>
    client.post<{ id: number; title: string; slug: string | null }>(`/articles/${id}/duplicate`).then(r => r.data),

  move: (id: string, folder_id: string | null) =>
    client.patch<{ message: string; folderId: number | null }>(`/articles/${id}/move`, { folder_id }).then(r => r.data),

  regenerate: (id: string) =>
    client.post<{ jobId: string; articleId: number; status: string; message: string }>(`/articles/${id}/regenerate`).then(r => r.data),

  listVersions: (id: string) =>
    client.get<{ versions: ArticleVersion[] }>(`/articles/${id}/versions`).then(r => r.data),

  restoreVersion: (id: string, versionId: string) =>
    client.post<{ id: number; title: string }>(`/articles/${id}/versions/${versionId}/restore`).then(r => r.data),

  listTranslations: (id: string) =>
    client.get<{ translations: ArticleTranslation[] }>(`/articles/${id}/translations`).then(r => r.data),

  getTranslation: (id: string, lang: string) =>
    client.get<{ languageCode: string; title: string | null; content: string | null }>(`/articles/${id}/translations/${lang}`).then(r => r.data),

  triggerTranslate: (id: string, lang: string) =>
    client.post<{ message: string; articleId: number; languageCode: string }>(`/articles/${id}/translations/${lang}`).then(r => r.data),
});
