/**
 * models.dev provider selection API for custom (OpenAI-compatible) providers.
 *
 * Distinct from modelsCatalog.ts, which reports catalog freshness for the fixed
 * opencode-go / zai-coding-plan lanes. This module answers a different
 * question: which catalog entry supplies a given model's capabilities.
 */

import { apiClient } from './client';
import { isRecord } from '@/utils/helpers';

/** A models.dev provider that publishes a given model. */
export interface ModelsDevProviderOption {
  id: string;
  name: string;
  api: string;
  context_length?: number;
}

export interface ModelsDevProvidersResult {
  model: string;
  providers: ModelsDevProviderOption[];
  /** True when exactly one provider serves the model, so no choice is needed. */
  unambiguous: boolean;
}

/** Transport seam: production passes the shared client, tests pass a stub. */
export interface ModelsDevProvidersTransport {
  get: (url: string) => Promise<unknown>;
}

const normalizeProvider = (value: unknown): ModelsDevProviderOption | null => {
  if (!isRecord(value)) return null;
  const id = typeof value.id === 'string' ? value.id.trim() : '';
  if (!id) return null;
  return {
    id,
    name: typeof value.name === 'string' ? value.name : '',
    api: typeof value.api === 'string' ? value.api : '',
    ...(typeof value.context_length === 'number' && Number.isFinite(value.context_length)
      ? { context_length: value.context_length }
      : {}),
  };
};

export const normalizeModelsDevProviders = (
  value: unknown,
  fallbackModel: string
): ModelsDevProvidersResult => {
  const record = isRecord(value) ? value : {};
  const providers = Array.isArray(record.providers)
    ? record.providers
        .map(normalizeProvider)
        .filter((entry): entry is ModelsDevProviderOption => entry !== null)
    : [];
  return {
    model: typeof record.model === 'string' ? record.model : fallbackModel,
    providers,
    // Derived from the filtered list rather than trusted from the response, so
    // a dropped malformed entry can never leave the caller claiming a choice
    // is unnecessary while several valid providers remain.
    unambiguous: providers.length === 1,
  };
};

export const createModelsDevProvidersApi = (
  transport: ModelsDevProvidersTransport = apiClient
) => ({
  /** Lists the providers publishing `model`, ranked by `baseUrl` when given. */
  list: async (model: string, baseUrl?: string): Promise<ModelsDevProvidersResult> => {
    const params = new URLSearchParams({ model });
    if (baseUrl) params.set('base_url', baseUrl);
    const payload = await transport.get(`/modelsdev/providers?${params.toString()}`);
    return normalizeModelsDevProviders(payload, model);
  },
});

export const modelsDevProvidersApi = createModelsDevProvidersApi();
