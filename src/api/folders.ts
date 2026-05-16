import { AxiosInstance } from 'axios';

export interface Folder {
  id: string;
  name: string;
  parent_id?: string | null;
}

export const foldersApi = (client: AxiosInstance) => ({
  list: () =>
    client.get<{ folders: Folder[] }>('/folders').then(r => r.data),

  get: (id: string) =>
    client.get<Folder>(`/folders/${id}`).then(r => r.data),

  create: (name: string, parent_id?: string) =>
    client.post<Folder>('/folders', { name, ...(parent_id !== undefined ? { parent_id } : {}) }).then(r => r.data),

  update: (id: string, name: string) =>
    client.put<Folder>(`/folders/${id}`, { name }).then(r => r.data),

  delete: (id: string) =>
    client.delete(`/folders/${id}`).then(r => r.data),

  move: (id: string, parent_id: string | null) =>
    client.patch<{ message: string; parentId: number | null }>(`/folders/${id}/move`, { parent_id }).then(r => r.data),
});
