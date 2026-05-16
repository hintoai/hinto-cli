import { AxiosInstance } from 'axios';

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Language {
  code: string;
  name: string;
}

export const projectApi = (client: AxiosInstance) => ({
  get: () =>
    client.get<Project>('/project').then(r => r.data),

  update: (body: { name?: string }) =>
    client.patch<Project>('/project', body).then(r => r.data),

  structure: () =>
    client.get<unknown>('/project/structure').then(r => r.data),

  listLanguages: () =>
    client.get<{ languages: Language[] }>('/project/languages').then(r => r.data),

  retranslate: (code: string) =>
    client.post<{ jobId: string }>(`/project/languages/${code}/retranslate`).then(r => r.data),
});
