import { describe, expect, mock, test } from 'bun:test';

// Dynamic imports are intentional here: mock.module only affects modules
// loaded after it runs (module loading boundary), so each test imports the
// service fresh after registering its client stub.
describe('catalog service behavior', () => {
  test('getStatus requests the status route and normalizes the envelope', async () => {
    const seen: string[] = [];
    mock.module('../src/services/api/client', () => ({
      apiClient: {
        get: async (url: string) => {
          seen.push(url);
          return {
            providers: [
              { id: 'opencode-go', source: 'live', models: 39, fetched_at: '2026-09-23T12:00:00Z' },
              { models: 7 },
            ],
          };
        },
      },
    }));
    const { modelsCatalogApi } = await import('../src/services/api/modelsCatalog');
    const status = await modelsCatalogApi.getStatus();
    expect(seen).toEqual(['/modelsdev/status']);
    expect(status.providers).toHaveLength(1);
    expect(status.providers[0].id).toBe('opencode-go');
    mock.restore();
  });

  test('refresh posts to the refresh route and returns changed lanes', async () => {
    const seen: Array<{ url: string; body: unknown }> = [];
    mock.module('../src/services/api/client', () => ({
      apiClient: {
        post: async (url: string, body: unknown) => {
          seen.push({ url, body });
          return { changed: ['zai-coding-plan', 42] };
        },
      },
    }));
    const { modelsCatalogApi } = await import('../src/services/api/modelsCatalog');
    const result = await modelsCatalogApi.refresh();
    expect(seen).toEqual([{ url: '/modelsdev/refresh', body: {} }]);
    expect(result).toEqual({ changed: ['zai-coding-plan'] });
    mock.restore();
  });
});
