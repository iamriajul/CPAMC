import { describe, expect, test } from 'bun:test';
import { createModelsCatalogApi } from '../src/services/api/modelsCatalog';

describe('catalog service behavior', () => {
  test('getStatus requests the status route and normalizes the envelope', async () => {
    const seen: string[] = [];
    const api = createModelsCatalogApi({
      get: async (url: string) => {
        seen.push(url);
        return {
          providers: [
            { id: 'opencode-go', source: 'live', models: 39, fetched_at: '2026-09-23T12:00:00Z' },
            { models: 7 },
          ],
        };
      },
      post: async () => ({}),
    });
    const status = await api.getStatus();
    expect(seen).toEqual(['/modelsdev/status']);
    expect(status.providers).toHaveLength(1);
    expect(status.providers[0].id).toBe('opencode-go');
  });

  test('refresh posts to the refresh route and returns changed lanes', async () => {
    const seen: Array<{ url: string; body: unknown }> = [];
    const api = createModelsCatalogApi({
      get: async () => ({}),
      post: async (url: string, body: unknown) => {
        seen.push({ url, body });
        return { changed: ['zai-coding-plan', 42] };
      },
    });
    const result = await api.refresh();
    expect(seen).toEqual([{ url: '/modelsdev/refresh', body: {} }]);
    expect(result).toEqual({ changed: ['zai-coding-plan'] });
  });
});
