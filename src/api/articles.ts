import type { AxiosInstance } from 'axios';

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
  folderId: number | null;
  format: string;
  content: string;
  createdAt: string | null;
  updatedAt: string | null;
  metadata: {
    metaDescription: string | null;
    metaKeywords: string[] | null;
    jsonLd: string | null;
  };
}

export interface ArticleVersion {
  id: string;
  versionNumber: number;
  createdAt: string;
  createdBy: string;
  changeDescription: string | null;
  isAutoSave: boolean;
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
  list: (params?: { folderId?: string; offset?: number; limit?: number }) =>
    client
      .get<{ articles: Article[]; pagination: { limit: number; offset: number; count: number } }>(
        '/articles',
        { params },
      )
      .then((r) => r.data),

  get: (id: string, format?: 'markdown' | 'html') =>
    client
      .get<ArticleDetail>(`/articles/${id}`, { params: format ? { format } : undefined })
      .then((r) => r.data),

  create: (body: { title: string; content?: string; folderId?: string }) =>
    client.post<ArticleDetail>('/articles', body).then((r) => r.data),

  update: (
    id: string,
    body: {
      title?: string;
      slug?: string;
      content?: string;
      metaDescription?: string;
      metaKeywords?: string[];
    },
  ) => client.put<ArticleDetail>(`/articles/${id}`, body).then((r) => r.data),

  delete: (id: string) => client.delete(`/articles/${id}`).then((r) => r.data),

  duplicate: (id: string) =>
    client.post<ArticleDetail>(`/articles/${id}/duplicate`).then((r) => r.data),

  move: (id: string, folderId: string | null) =>
    client.patch<ArticleDetail>(`/articles/${id}/move`, { folderId }).then((r) => r.data),

  regenerate: (id: string, callbackUrl?: string, callbackSecret?: string) =>
    client
      .post<import('./generate').Job>(`/articles/${id}/regenerate`, {
        ...(callbackUrl ? { callbackUrl } : {}),
        ...(callbackSecret ? { callbackSecret } : {}),
      })
      .then((r) => r.data),

  createEmpty: (body: { title?: string; folderId?: number }) =>
    client.post<ArticleDetail>('/articles/empty', body).then((r) => r.data),

  listVersions: (id: string) =>
    client.get<{ versions: ArticleVersion[] }>(`/articles/${id}/versions`).then((r) => r.data),

  restoreVersion: (id: string, versionId: string) =>
    client
      .post<{ message: string; articleId: number; versionId: string }>(
        `/articles/${id}/versions/${versionId}/restore`,
      )
      .then((r) => r.data),

  listTranslations: (id: string) =>
    client
      .get<{ translations: ArticleTranslation[] }>(`/articles/${id}/translations`)
      .then((r) => r.data),

  getTranslation: (id: string, lang: string, format?: 'markdown' | 'html') =>
    client
      .get<{
        languageCode: string;
        status: string;
        title: string | null;
        slug: string | null;
        format: string;
        content: string | null;
        metadata: {
          metaDescription: string | null;
          metaKeywords: string[] | null;
          updatedAt: string | null;
        };
      }>(`/articles/${id}/translations/${lang}`, { params: format ? { format } : undefined })
      .then((r) => r.data),

  triggerTranslate: (id: string, lang: string, callbackUrl?: string, callbackSecret?: string) =>
    client
      .post<import('./generate').Job>(`/articles/${id}/translations/${lang}`, {
        ...(callbackUrl ? { callbackUrl } : {}),
        ...(callbackSecret ? { callbackSecret } : {}),
      })
      .then((r) => r.data),
});
