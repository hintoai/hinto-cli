import { AxiosInstance } from 'axios';

export const exportApi = (client: AxiosInstance) => ({
  article: (id: string, format?: 'markdown' | 'html') =>
    client.get<string>(`/export/articles/${id}`, { params: { format }, responseType: 'text' }).then(r => r.data),

  folder: (id: string) =>
    client.get<Buffer>(`/export/folders/${id}`, { responseType: 'arraybuffer' }).then(r => r.data),

  project: (format?: 'markdown' | 'html' | 'pdf' | 'llm-text') =>
    client.get<Buffer>('/export/project', { params: format ? { format } : undefined, responseType: 'arraybuffer' }).then(r => r.data),
});
