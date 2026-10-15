import type { AxiosInstance } from 'axios';

export type ArticleFormat = 'markdown' | 'html' | 'pdf' | 'docx' | 'vsdx';
export type FolderFormat = 'pdf' | 'docx' | 'vsdx';
export type ProjectFormat = 'markdown' | 'html' | 'pdf' | 'docx' | 'vsdx' | 'llm-text';

/** Formats the API returns as binary files; they must be saved with --out, never printed. */
export const BINARY_FORMATS: readonly string[] = ['pdf', 'docx', 'vsdx'];
export const isBinaryFormat = (format?: string): boolean =>
  !!format && BINARY_FORMATS.includes(format);

export const exportApi = (client: AxiosInstance) => ({
  article: (id: string, format?: ArticleFormat, lang?: string): Promise<string | Buffer> => {
    const binary = isBinaryFormat(format);
    return client
      .get(`/export/articles/${id}`, {
        params: { ...(format ? { format } : {}), ...(lang ? { lang } : {}) },
        responseType: binary ? 'arraybuffer' : 'text',
      })
      .then((r) => (binary ? Buffer.from(r.data) : (r.data as string)));
  },

  folder: (id: string, format?: FolderFormat) =>
    client
      .get<Buffer>(`/export/folders/${id}`, {
        params: format ? { format } : undefined,
        responseType: 'arraybuffer',
      })
      .then((r) => r.data),

  project: (format?: ProjectFormat) =>
    client
      .get<Buffer>('/export/project', {
        params: format ? { format } : undefined,
        responseType: 'arraybuffer',
      })
      .then((r) => r.data),
});
