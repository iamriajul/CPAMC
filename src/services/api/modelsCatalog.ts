/**
 * models.dev catalog freshness API (opencode-go + zai-coding-plan lanes)
 */

import { apiClient } from './client';
import { isRecord } from '@/utils/helpers';

export type ModelsCatalogSource = 'live' | 'fallback';

export interface ModelsCatalogProvider {
  id: string;
  source: ModelsCatalogSource;
  models: number;
  fetchedAt: string | null;
  lastError: string | null;
}

export interface ModelsCatalogStatus {
  providers: ModelsCatalogProvider[];
}

export interface ModelsCatalogRefresh {
  changed: string[];
}

/** Transport seam: production passes the shared client, tests pass a stub. */
export interface ModelsCatalogTransport {
  get: (url: string) => Promise<unknown>;
  post: (url: string, body: unknown) => Promise<unknown>;
}

export const normalizeCatalogProvider = (value: unknown): ModelsCatalogProvider | null => {
  if (!isRecord(value)) return null;
  const rawId = value.id;
  const id = typeof rawId === 'string' && rawId.trim() ? rawId.trim() : null;
  if (!id) return null;
  const rawModels = value.models;
  const models =
    typeof rawModels === 'number' && Number.isFinite(rawModels) && rawModels >= 0
      ? Math.floor(rawModels)
      : 0;
  const rawFetched = value.fetched_at;
  const rawError = value.last_error;
  return {
    id,
    source: value.source === 'live' ? 'live' : 'fallback',
    models,
    fetchedAt: typeof rawFetched === 'string' && rawFetched.trim() ? rawFetched.trim() : null,
    lastError: typeof rawError === 'string' && rawError.trim() ? rawError.trim() : null,
  };
};

export const normalizeCatalogStatus = (value: unknown): ModelsCatalogStatus => {
  if (!isRecord(value) || !Array.isArray(value.providers)) return { providers: [] };
  return {
    providers: value.providers.flatMap((entry) => {
      const provider = normalizeCatalogProvider(entry);
      return provider ? [provider] : [];
    }),
  };
};

export const createModelsCatalogApi = (transport: ModelsCatalogTransport = apiClient) => ({
  getStatus: async (): Promise<ModelsCatalogStatus> => {
    const payload = await transport.get('/modelsdev/status');
    return normalizeCatalogStatus(payload);
  },
  refresh: async (): Promise<ModelsCatalogRefresh> => {
    const payload = await transport.post('/modelsdev/refresh', {});
    const changed =
      isRecord(payload) && Array.isArray(payload.changed)
        ? payload.changed.filter((entry): entry is string => typeof entry === 'string')
        : [];
    return { changed };
  },
});

export const modelsCatalogApi = createModelsCatalogApi();
