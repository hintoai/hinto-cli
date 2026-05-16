import { AxiosInstance } from 'axios';

export interface Template {
  id: string;
  name: string;
  description?: string;
}

export const templatesApi = (client: AxiosInstance) => ({
  list: () =>
    client.get<{ templates: Template[] }>('/templates').then(r => r.data),
});
