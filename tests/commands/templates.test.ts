import nock from 'nock';
import { createClient } from '../../src/api/client';
import { templatesApi } from '../../src/api/templates';

const BASE_URL = 'https://app.hinto.ai';
const client = createClient('test_key', BASE_URL);
const api = templatesApi(client);

afterEach(() => nock.cleanAll());

describe('templatesApi.list', () => {
  it('returns templates', async () => {
    nock(BASE_URL).get('/api/external/v2/templates').reply(200, { templates: [{ id: 't1', name: 'Blog Post' }] });
    const result = await api.list();
    expect(result.templates[0].id).toBe('t1');
  });
});
