import type { AxiosInstance } from 'axios';

export interface Folder {
  id: number;
  name: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

export const foldersApi = (client: AxiosInstance) => ({
  list: () => client.get<{ folders: Folder[] }>('/folders').then((r) => r.data),

  get: (id: string) => client.get<Folder>(`/folders/${id}`).then((r) => r.data),

  create: (name: string, parentId?: string) =>
    client
      .post<Folder>('/folders', { name, ...(parentId !== undefined ? { parentId } : {}) })
      .then((r) => r.data),

  update: (id: string, name: string) =>
    client.put<Folder>(`/folders/${id}`, { name }).then((r) => r.data),

  delete: (id: string) => client.delete(`/folders/${id}`).then((r) => r.data),

  move: (id: string, parentId: string | null) =>
    client.patch<Folder>(`/folders/${id}/move`, { parentId }).then((r) => r.data),
});
