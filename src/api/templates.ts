import type { AxiosInstance } from 'axios';

export interface Template {
  id: number;
  name: string;
  description?: string | null;
  requires_video: boolean;
  image_url?: string | null;
  sort_order?: number | null;
}

export const templatesApi = (client: AxiosInstance) => ({
  articleTemplates: () =>
    client.get<{ templates: Template[] }>('/templates/article').then((r) => r.data),

  structureTemplates: () =>
    client.get<{ templates: Template[] }>('/templates/structure').then((r) => r.data),
});
