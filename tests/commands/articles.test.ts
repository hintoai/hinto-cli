import { Command } from 'commander';
import nock from 'nock';
import { articlesApi } from '../../src/api/articles';
import { createClient } from '../../src/api/client';
import { registerArticles } from '../../src/commands/articles';

const BASE_URL = 'https://app.hinto.ai';
const client = createClient('test_key', BASE_URL);
const api = articlesApi(client);

afterEach(() => nock.cleanAll());

const mockArticle = {
  id: 1,
  title: 'Test Article',
  slug: 'article-slug',
  folder_id: null,
  inserted_at: '2026-01-01',
  updated_at: '2026-01-01',
};

describe('articlesApi.list', () => {
  it('returns articles', async () => {
    nock(BASE_URL)
      .get('/api/external/v2/articles')
      .reply(200, {
        articles: [mockArticle],
        pagination: { limit: 20, offset: 0, count: 1 },
      });

    const result = await api.list();
    expect(result.articles[0].id).toBe(1);
    expect(result.pagination.count).toBe(1);
  });
});

describe('articlesApi.create', () => {
  it('creates article', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/articles', { title: 'New Article' })
      .reply(201, {
        id: 2,
        title: 'New Article',
        slug: null,
        folderId: null,
        format: 'markdown',
        content: '',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        metadata: { metaDescription: null, metaKeywords: null, jsonLd: null },
      });

    const result = await api.create({ title: 'New Article' });
    expect(result.id).toBe(2);
  });
});

describe('articlesApi.delete', () => {
  it('calls DELETE', async () => {
    nock(BASE_URL).delete('/api/external/v2/articles/1').reply(204);

    await expect(api.delete('1')).resolves.not.toThrow();
  });
});

describe('articlesApi.duplicate', () => {
  it('duplicates article', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/articles/1/duplicate')
      .reply(201, { id: 3, title: 'Test Article (copy)', slug: null });

    const result = await api.duplicate('1');
    expect(result.id).toBe(3);
  });
});

describe('articlesApi.triggerTranslate', () => {
  it('posts to translations endpoint and returns a Job object', async () => {
    nock(BASE_URL).post('/api/external/v2/articles/123/translations/fr').reply(202, {
      jobId: 'job-translate-123',
      type: 'translate_article',
      status: 'pending',
      output: null,
      error: null,
      createdAt: '2026-01-01T00:00:00Z',
      completedAt: null,
    });

    const result = await api.triggerTranslate('123', 'fr');
    expect(result.jobId).toBe('job-translate-123');
    expect(result.type).toBe('translate_article');
    expect(result.status).toBe('pending');
  });

  it('includes callbackUrl in request body when provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/articles/123/translations/de', {
        callbackUrl: 'https://cb.example.com',
      })
      .reply(202, {
        jobId: 'job-translate-cb',
        type: 'translate_article',
        status: 'pending',
        output: null,
        error: null,
        createdAt: '2026-01-01T00:00:00Z',
        completedAt: null,
      });

    const result = await api.triggerTranslate('123', 'de', 'https://cb.example.com');
    expect(result.jobId).toBe('job-translate-cb');
  });

  it('sends empty body when no callback fields provided', async () => {
    nock(BASE_URL).post('/api/external/v2/articles/123/translations/es', {}).reply(202, {
      jobId: 'job-translate-no-cb',
      type: 'translate_article',
      status: 'pending',
      output: null,
      error: null,
      createdAt: '2026-01-01T00:00:00Z',
      completedAt: null,
    });

    const result = await api.triggerTranslate('123', 'es');
    expect(result.jobId).toBe('job-translate-no-cb');
  });
});

const mockJob = (jobId: string) => ({
  jobId,
  type: 'regenerate_article',
  status: 'pending' as const,
  output: null,
  error: null,
  createdAt: '2026-01-01T00:00:00Z',
  completedAt: null,
});

describe('articlesApi.regenerate', () => {
  it('posts to regenerate endpoint without callback fields', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/articles/1/regenerate', {})
      .reply(202, mockJob('j-regen'));

    const result = await api.regenerate('1');
    expect(result.jobId).toBe('j-regen');
  });

  it('includes callbackUrl when provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/articles/1/regenerate', { callbackUrl: 'https://cb.example.com' })
      .reply(202, mockJob('j-regen-cb'));

    const result = await api.regenerate('1', 'https://cb.example.com');
    expect(result.jobId).toBe('j-regen-cb');
  });

  it('includes callbackUrl and callbackSecret when both provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/articles/1/regenerate', {
        callbackUrl: 'https://cb.example.com',
        callbackSecret: 'regen-secret',
      })
      .reply(202, mockJob('j-regen-secret'));

    const result = await api.regenerate('1', 'https://cb.example.com', 'regen-secret');
    expect(result.jobId).toBe('j-regen-secret');
  });

  it('omits callback fields when not provided', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/articles/1/regenerate', {})
      .reply(202, mockJob('j-regen-no-opts'));

    const result = await api.regenerate('1', undefined, undefined);
    expect(result.jobId).toBe('j-regen-no-opts');
  });
});

const mockTranslation = {
  languageCode: 'fr',
  status: 'completed',
  title: 'Article en français',
  slug: 'article-fr',
  format: 'markdown',
  content: '# Contenu',
  metadata: { metaDescription: null, metaKeywords: null, updatedAt: '2026-01-01' },
};

describe('articlesApi.getTranslation', () => {
  it('fetches translation without format param by default', async () => {
    nock(BASE_URL).get('/api/external/v2/articles/1/translations/fr').reply(200, mockTranslation);

    const result = await api.getTranslation('1', 'fr');
    expect(result.languageCode).toBe('fr');
  });

  it('passes format=markdown query param when specified', async () => {
    nock(BASE_URL)
      .get('/api/external/v2/articles/1/translations/fr')
      .query({ format: 'markdown' })
      .reply(200, { ...mockTranslation, format: 'markdown' });

    const result = await api.getTranslation('1', 'fr', 'markdown');
    expect(result.format).toBe('markdown');
  });

  it('passes format=html query param when specified', async () => {
    nock(BASE_URL)
      .get('/api/external/v2/articles/1/translations/fr')
      .query({ format: 'html' })
      .reply(200, { ...mockTranslation, format: 'html', content: '<h1>Contenu</h1>' });

    const result = await api.getTranslation('1', 'fr', 'html');
    expect(result.format).toBe('html');
  });
});

const mockArticleDetail = {
  id: 99,
  title: 'Empty Article',
  slug: null,
  folderId: null,
  format: 'markdown',
  content: '',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  metadata: { metaDescription: null, metaKeywords: null, jsonLd: null },
};

describe('articlesApi.createEmpty', () => {
  it('creates an empty article with no arguments', async () => {
    nock(BASE_URL).post('/api/external/v2/articles/empty', {}).reply(201, mockArticleDetail);

    const result = await api.createEmpty({});
    expect(result.id).toBe(99);
    expect(result.title).toBe('Empty Article');
  });

  it('creates an empty article with a title', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/articles/empty', { title: 'Draft Article' })
      .reply(201, { ...mockArticleDetail, title: 'Draft Article' });

    const result = await api.createEmpty({ title: 'Draft Article' });
    expect(result.title).toBe('Draft Article');
  });

  it('creates an empty article with title and folderId', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/articles/empty', { title: 'Foldered Article', folderId: 5 })
      .reply(201, { ...mockArticleDetail, title: 'Foldered Article', folderId: 5 });

    const result = await api.createEmpty({ title: 'Foldered Article', folderId: 5 });
    expect(result.folderId).toBe(5);
  });

  it('omits optional fields when not provided', async () => {
    nock(BASE_URL).post('/api/external/v2/articles/empty', {}).reply(201, mockArticleDetail);

    const result = await api.createEmpty({});
    expect(result.id).toBe(99);
  });
});

describe('articlesApi.update', () => {
  it('updates article with title', async () => {
    nock(BASE_URL)
      .put('/api/external/v2/articles/1', { title: 'Updated Title' })
      .reply(200, {
        id: 1,
        title: 'Updated Title',
        slug: 'article-slug',
        folderId: null,
        format: 'markdown',
        content: '# Updated Title',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        metadata: { metaDescription: null, metaKeywords: null, jsonLd: null },
      });

    const result = await api.update('1', { title: 'Updated Title' });
    expect(result.title).toBe('Updated Title');
  });

  it('updates article with slug', async () => {
    nock(BASE_URL)
      .put('/api/external/v2/articles/1', { slug: 'new-slug' })
      .reply(200, {
        id: 1,
        title: 'Test Article',
        slug: 'new-slug',
        folderId: null,
        format: 'markdown',
        content: '# Test Article',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        metadata: { metaDescription: null, metaKeywords: null, jsonLd: null },
      });

    const result = await api.update('1', { slug: 'new-slug' });
    expect(result.slug).toBe('new-slug');
  });
});

describe('articlesApi.setTranslation', () => {
  it('PUTs translation content and returns the saved translation', async () => {
    nock(BASE_URL)
      .put('/api/external/v2/articles/42/translations/es', {
        title: 'Título',
        content: '# Hola',
        metaKeywords: ['a', 'b'],
      })
      .reply(200, { languageCode: 'es', status: 'manual', title: 'Título' });

    const result = await api.setTranslation('42', 'es', {
      title: 'Título',
      content: '# Hola',
      metaKeywords: ['a', 'b'],
    });
    expect(result.status).toBe('manual');
    expect(result.title).toBe('Título');
  });
});

describe('set-translation command (CLI option parsing)', () => {
  function buildProgram(): Command {
    const program = new Command();
    registerArticles(program, client);
    return program;
  }

  async function runSetTranslation(args: string[]): Promise<void> {
    const program = buildProgram();
    await program.parseAsync(['node', 'hinto', 'articles', 'set-translation', ...args]);
  }

  let stdoutSpy: jest.SpiedFunction<typeof process.stdout.write>;

  beforeEach(() => {
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it('omits slug from the request body when --slug is not provided', async () => {
    let capturedBody: Record<string, unknown> | undefined;
    nock(BASE_URL)
      .put('/api/external/v2/articles/42/translations/es', (body) => {
        capturedBody = body;
        return true;
      })
      .reply(200, { languageCode: 'es', status: 'manual', title: 'Título' });

    await runSetTranslation([
      '42',
      '--lang',
      'es',
      '--title',
      'Título',
      '--content',
      '# Hola',
      '--json',
    ]);

    expect(capturedBody).toBeDefined();
    expect('slug' in (capturedBody as Record<string, unknown>)).toBe(false);
  });

  it('includes slug in the request body when --slug is provided', async () => {
    let capturedBody: Record<string, unknown> | undefined;
    nock(BASE_URL)
      .put('/api/external/v2/articles/42/translations/es', (body) => {
        capturedBody = body;
        return true;
      })
      .reply(200, { languageCode: 'es', status: 'manual', title: 'Título' });

    await runSetTranslation([
      '42',
      '--lang',
      'es',
      '--title',
      'Título',
      '--content',
      '# Hola',
      '--slug',
      'titulo-es',
      '--json',
    ]);

    expect(capturedBody).toBeDefined();
    expect((capturedBody as Record<string, unknown>).slug).toBe('titulo-es');
  });

  it('trims and filters empty entries when parsing --meta-keywords', async () => {
    let capturedBody: Record<string, unknown> | undefined;
    nock(BASE_URL)
      .put('/api/external/v2/articles/42/translations/es', (body) => {
        capturedBody = body;
        return true;
      })
      .reply(200, { languageCode: 'es', status: 'manual', title: 'Título' });

    await runSetTranslation([
      '42',
      '--lang',
      'es',
      '--title',
      'Título',
      '--content',
      '# Hola',
      '--meta-keywords',
      'a, ,b',
      '--json',
    ]);

    expect(capturedBody).toBeDefined();
    expect((capturedBody as Record<string, unknown>).metaKeywords).toEqual(['a', 'b']);
  });

  it('parses an inline --faq-jsonld JSON string into the jsonLd field', async () => {
    let capturedBody: Record<string, unknown> | undefined;
    nock(BASE_URL)
      .put('/api/external/v2/articles/42/translations/es', (body) => {
        capturedBody = body;
        return true;
      })
      .reply(200, { languageCode: 'es', status: 'manual', title: 'Título' });

    await runSetTranslation([
      '42',
      '--lang',
      'es',
      '--title',
      'Título',
      '--content',
      '# Hola',
      '--faq-jsonld',
      '{"@type":"FAQPage"}',
      '--json',
    ]);

    expect(capturedBody).toBeDefined();
    expect((capturedBody as Record<string, unknown>).jsonLd).toEqual({ '@type': 'FAQPage' });
  });
});
