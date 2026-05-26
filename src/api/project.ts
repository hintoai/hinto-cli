import { AxiosInstance } from 'axios';

export interface Project {
  id: string;
  name: string;
  url_slug: string;
  description: string | null;
  language: string;
  is_published: boolean;
  logo_url: string | null;
  project_type: string;
  is_archived: boolean;
  created_at: string;
  custom_domain: string | null;
  custom_domain_verified: boolean;
}

export interface Language {
  languageCode: string;
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
    client.patch<Project>('/project', body).then(r => r.data),

  structure: () =>
    client.get<unknown>('/project/structure').then(r => r.data),

  listLanguages: () =>
    client.get<{ languages: Language[] }>('/project/languages').then(r => r.data),

  retranslate: (code: string) =>
    client.post<{ languageCode: string; queued: number }>(`/project/languages/${code}/retranslate`).then(r => r.data),
});
