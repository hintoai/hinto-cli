import nock from 'nock';
import { createClient } from '../../src/api/client';
import { foldersApi } from '../../src/api/folders';

const BASE_URL = 'https://app.hinto.ai';
const client = createClient('test_key', BASE_URL);
const api = foldersApi(client);

afterEach(() => nock.cleanAll());

describe('foldersApi.list', () => {
  it('returns folders', async () => {
    nock(BASE_URL).get('/api/external/v2/folders').reply(200, { folders: [{ id: 'f1', name: 'Blog' }] });
    const result = await api.list();
    expect(result.folders[0].id).toBe('f1');
  });
});

describe('foldersApi.create', () => {
  it('creates a folder', async () => {
    nock(BASE_URL).post('/api/external/v2/folders', { name: 'News' }).reply(201, { id: 'f2', name: 'News' });
    const result = await api.create('News');
    expect(result.name).toBe('News');
  });
});
