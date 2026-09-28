import { afterEach, describe, expect, test } from 'bun:test';
import { apiClient } from '../src/services/api/client';
import { createModelsDevProvidersApi } from '../src/services/api/modelsdevProviders';
import { providersApi } from '../src/services/api/providers';
import { normalizeConfigResponse } from '../src/services/api/transformers';

const originalGet = apiClient.get;
const originalPut = apiClient.put;

afterEach(() => {
  apiClient.get = originalGet;
  apiClient.put = originalPut;
});

const baseProvider = {
  name: 'openrouter',
  baseUrl: 'https://openrouter.ai/api/v1',
  apiKeyEntries: [{ apiKey: 'sk-or-v1-test' }],
};

describe('models.dev provider pin', () => {
  test('normalizes the backend field onto the model entry', () => {
    const config = normalizeConfigResponse({
      'openai-compatibility': [
        {
          name: 'openrouter',
          'base-url': 'https://openrouter.ai/api/v1',
          'api-key-entries': [{ 'api-key': 'sk-or-v1-test' }],
          models: [
            {
              name: 'anthropic/claude-sonnet-4.5',
              alias: 'sonnet',
              'models-dev-provider': 'openrouter',
            },
            { name: 'openai/gpt-4o', alias: 'gpt4o' },
          ],
        },
      ],
    });

    const models = config.openaiCompatibility![0].models!;
    expect(models[0].modelsDevProvider).toBe('openrouter');
    // An omitted pin stays undefined so the form renders the automatic option.
    expect(models[1].modelsDevProvider).toBeUndefined();
  });

  test('serializes the pin when saving and omits it when cleared', async () => {
    const calls: Array<{ url: string; data?: unknown }> = [];
    apiClient.get = (async () => ({ 'openai-compatibility': [] })) as typeof apiClient.get;
    apiClient.put = (async (url: string, data?: unknown) => {
      calls.push({ url, data });
      return undefined;
    }) as typeof apiClient.put;

    await providersApi.createOpenAIProvider({
      ...baseProvider,
      models: [
        { name: 'anthropic/claude-sonnet-4.5', alias: 'sonnet', modelsDevProvider: 'openrouter' },
        { name: 'openai/gpt-4o', alias: 'gpt4o' },
      ],
    });

    expect(calls).toEqual([
      {
        url: '/openai-compatibility',
        data: [
          {
            name: 'openrouter',
            'base-url': 'https://openrouter.ai/api/v1',
            'api-key-entries': [{ 'api-key': 'sk-or-v1-test' }],
            models: [
              {
                name: 'anthropic/claude-sonnet-4.5',
                alias: 'sonnet',
                'models-dev-provider': 'openrouter',
              },
              { name: 'openai/gpt-4o', alias: 'gpt4o' },
            ],
          },
        ],
      },
    ]);
  });

  test('preserves unknown model fields across a save', async () => {
    const calls: Array<{ url: string; data?: unknown }> = [];
    apiClient.get = (async () => ({
      'openai-compatibility': [
        {
          ...baseProvider,
          models: [{ name: 'm', 'future-field': 'keep-me', 'models-dev-provider': 'alpha' }],
        },
      ],
    })) as typeof apiClient.get;
    apiClient.put = (async (url: string, data?: unknown) => {
      calls.push({ url, data });
      return undefined;
    }) as typeof apiClient.put;

    await providersApi.updateOpenAIProvider('openrouter', 0, {
      ...baseProvider,
      models: [{ name: 'm', modelsDevProvider: 'beta' }],
    });

    const sent = (calls[0].data as Array<Record<string, unknown>>)[0];
    const model = (sent.models as Array<Record<string, unknown>>)[0];
    expect(model['models-dev-provider']).toBe('beta');
    // A field this client does not know about must survive the write.
    expect(model['future-field']).toBe('keep-me');
  });
});

describe('models.dev provider lookup', () => {
  const transport = (payload: unknown) => {
    const urls: string[] = [];
    const api = createModelsDevProvidersApi({
      get: async (url: string) => {
        urls.push(url);
        return payload;
      },
    });
    return { api, urls };
  };

  test('reports a single provider as unambiguous', async () => {
    const { api, urls } = transport({
      model: 'solo',
      providers: [{ id: 'alpha', name: 'Alpha', api: 'https://api.alpha.test/v1' }],
      unambiguous: true,
    });

    const result = await api.list('solo', 'https://api.alpha.test/v1');
    expect(result.unambiguous).toBe(true);
    expect(result.providers.map((p) => p.id)).toEqual(['alpha']);
    expect(urls[0]).toContain('model=solo');
    expect(urls[0]).toContain('base_url=');
  });

  test('treats an empty catalog entry as no choice, not an error', async () => {
    const { api } = transport({ model: 'unknown', providers: [], unambiguous: false });

    const result = await api.list('unknown');
    expect(result.providers).toEqual([]);
    expect(result.unambiguous).toBe(false);
  });

  test('drops malformed entries and re-derives uniqueness', async () => {
    const { api } = transport({
      model: 'm',
      providers: [
        { id: 'alpha', name: 'Alpha', api: 'https://api.alpha.test/v1' },
        { id: 'beta', name: 'Beta', api: 'https://api.beta.test/v1' },
        { id: '  ', name: 'Blank' },
        null,
      ],
      // The server claims uniqueness, but two valid providers remain.
      unambiguous: true,
    });

    const result = await api.list('m');
    expect(result.providers.map((p) => p.id)).toEqual(['alpha', 'beta']);
    expect(result.unambiguous).toBe(false);
  });

  test('keeps a context window when the backend reports one', async () => {
    const { api } = transport({
      model: 'm',
      providers: [
        { id: 'alpha', name: 'Alpha', api: 'https://api.alpha.test/v1', context_length: 262144 },
      ],
    });

    const result = await api.list('m');
    expect(result.providers[0].context_length).toBe(262144);
  });
});
