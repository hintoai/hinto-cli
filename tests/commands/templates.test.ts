import nock from 'nock';
import { createClient } from '../../src/api/client';
import { templatesApi } from '../../src/api/templates';

const BASE_URL = 'https://app.hinto.ai';
const client = createClient('test_key', BASE_URL);
const api = templatesApi(client);

afterEach(() => nock.cleanAll());

describe('templatesApi.articleTemplates', () => {
  it('returns article templates', async () => {
    nock(BASE_URL).get('/api/external/v2/templates/article').reply(200, { templates: [{ id: 1, name: 'Blog Post', requires_video: true }] });
    const result = await api.articleTemplates();
    expect(result.templates[0].id).toBe(1);
  });
});

describe('templatesApi.structureTemplates', () => {
  it('returns structure templates', async () => {
    nock(BASE_URL).get('/api/external/v2/templates/structure').reply(200, { templates: [{ id: 2, name: 'Course', requires_video: false }] });
    const result = await api.structureTemplates();
    expect(result.templates[0].name).toBe('Course');
  });
});
