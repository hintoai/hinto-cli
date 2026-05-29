import nock from 'nock';
import { createClient } from '../../src/api/client';
import { projectApi } from '../../src/api/project';

const BASE_URL = 'https://app.hinto.ai';
const client = createClient('test_key', BASE_URL);
const api = projectApi(client);

afterEach(() => nock.cleanAll());

describe('projectApi.listLanguages', () => {
  it('returns languages with code and label fields', async () => {
    nock(BASE_URL)
      .get('/api/external/v2/project/languages')
      .reply(200, {
        languages: [
          {
            code: 'en',
            label: 'English',
            createdAt: '2026-01-01T00:00:00Z',
            translationRules: null,
            totalArticles: 10,
            translatedArticles: 8,
            isTranslating: false,
          },
          {
            code: 'fr',
            label: 'French',
            createdAt: '2026-02-01T00:00:00Z',
            translationRules: null,
            totalArticles: 10,
            translatedArticles: 5,
            isTranslating: true,
          },
        ],
      });

    const result = await api.listLanguages();
    expect(result.languages).toHaveLength(2);
    // Item 16: verify the API returns `code`, not `languageCode`
    expect(result.languages[0].code).toBe('en');
    expect(result.languages[0].label).toBe('English');
    expect(result.languages[1].code).toBe('fr');
    expect(result.languages[1].label).toBe('French');
    // Verify that languageCode is not present (it was the old broken field name)
    expect((result.languages[0] as unknown as Record<string, unknown>).languageCode).toBeUndefined();
  });

  it('returns translatedArticles, totalArticles and isTranslating', async () => {
    nock(BASE_URL)
      .get('/api/external/v2/project/languages')
      .reply(200, {
        languages: [
          {
            code: 'de',
            label: 'German',
            createdAt: '2026-01-01T00:00:00Z',
            translationRules: null,
            totalArticles: 4,
            translatedArticles: 2,
            isTranslating: true,
          },
        ],
      });

    const result = await api.listLanguages();
    expect(result.languages[0].totalArticles).toBe(4);
    expect(result.languages[0].translatedArticles).toBe(2);
    expect(result.languages[0].isTranslating).toBe(true);
  });
});

describe('projectApi.addLanguage', () => {
  it('posts languageCode in body and returns confirmation', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/project/languages', { languageCode: 'fr' })
      .reply(201, {
        languageCode: 'fr',
        message: 'Language added and translation jobs queued',
      });

    const result = await api.addLanguage('fr');
    expect(result.languageCode).toBe('fr');
    expect(result.message).toBe('Language added and translation jobs queued');
  });

  it('posts the correct language code', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/project/languages', { languageCode: 'de' })
      .reply(201, {
        languageCode: 'de',
        message: 'Language added and translation jobs queued',
      });

    const result = await api.addLanguage('de');
    expect(result.languageCode).toBe('de');
  });
});

describe('projectApi.get', () => {
  it('returns project details', async () => {
    nock(BASE_URL)
      .get('/api/external/v2/project')
      .reply(200, {
        project: {
          id: 'p1',
          name: 'My Project',
          urlSlug: 'my-project',
          description: null,
          language: 'en',
          isPublished: false,
          logoUrl: null,
          projectType: 'docs',
          isArchived: false,
          createdAt: '2026-01-01T00:00:00Z',
          customDomain: null,
          customDomainVerified: false,
        },
      });

    const result = await api.get();
    expect(result.project.id).toBe('p1');
    expect(result.project.name).toBe('My Project');
  });
});

describe('projectApi.retranslate', () => {
  it('posts to retranslate endpoint and returns a Job object', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/project/languages/fr/retranslate')
      .reply(202, {
        jobId: 'job-abc-123',
        type: 'retranslate',
        status: 'pending',
        output: null,
        error: null,
        createdAt: '2026-01-01T00:00:00Z',
        completedAt: null,
      });

    const result = await api.retranslate('fr');
    expect(result.jobId).toBe('job-abc-123');
    expect(result.type).toBe('retranslate');
    expect(result.status).toBe('pending');
    expect(result.createdAt).toBe('2026-01-01T00:00:00Z');
  });

  it('posts to retranslate endpoint with the correct language code', async () => {
    nock(BASE_URL)
      .post('/api/external/v2/project/languages/de/retranslate')
      .reply(202, {
        jobId: 'job-def-456',
        type: 'retranslate',
        status: 'pending',
        output: null,
        error: null,
        createdAt: '2026-01-01T00:00:00Z',
        completedAt: null,
      });

    const result = await api.retranslate('de');
    expect(result.jobId).toBe('job-def-456');
  });
});
