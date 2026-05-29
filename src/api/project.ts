import { AxiosInstance } from 'axios';

export interface Project {
  id: string;
  name: string;
  urlSlug: string;
  description: string | null;
  language: string;
  isPublished: boolean;
  logoUrl: string | null;
  projectType: string;
  isArchived: boolean;
  createdAt: string;
  customDomain: string | null;
  customDomainVerified: boolean;
}

export interface Language {
  code: string;
  label: string;
  createdAt: string;
  translationRules: unknown | null;
  totalArticles: number;
  translatedArticles: number;
  isTranslating: boolean;
}

export const projectApi = (client: AxiosInstance) => ({
  get: () =>
    client.get<{ project: Project }>('/project').then(r => r.data),

  update: (body: { name?: string }) =>
    client.patch<{ project: Project }>('/project', body).then(r => r.data),

  structure: () =>
    client.get<unknown>('/project/structure').then(r => r.data),

  listLanguages: () =>
    client.get<{ languages: Language[] }>('/project/languages').then(r => r.data),

  retranslate: (code: string) =>
    client.post<import('./generate').Job>(`/project/languages/${code}/retranslate`).then(r => r.data),

  addLanguage: (languageCode: string) =>
    client.post<{ languageCode: string; message: string }>('/project/languages', { languageCode }).then(r => r.data),
});
