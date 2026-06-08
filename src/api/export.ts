import type { AxiosInstance } from 'axios';

export const exportApi = (client: AxiosInstance) => ({
  article: (
    id: string,
    format?: 'markdown' | 'html' | 'pdf',
    lang?: string,
  ): Promise<string | Buffer> => {
    const isPdf = format === 'pdf';
    return client
      .get(`/export/articles/${id}`, {
        params: { ...(format ? { format } : {}), ...(lang ? { lang } : {}) },
        responseType: isPdf ? 'arraybuffer' : 'text',
      })
      .then((r) => (isPdf ? Buffer.from(r.data) : (r.data as string)));
  },

  folder: (id: string) =>
    client
      .get<Buffer>(`/export/folders/${id}`, { responseType: 'arraybuffer' })
      .then((r) => r.data),

  project: (format?: 'markdown' | 'html' | 'pdf' | 'llm-text') =>
    client
      .get<Buffer>('/export/project', {
        params: format ? { format } : undefined,
        responseType: 'arraybuffer',
      })
      .then((r) => r.data),
});
