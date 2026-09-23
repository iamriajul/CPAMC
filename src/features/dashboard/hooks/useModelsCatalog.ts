import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { modelsCatalogApi, type ModelsCatalogProvider } from '@/services/api';

export interface ModelsCatalogView {
  providers: ModelsCatalogProvider[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => void;
  refreshNow: () => Promise<void>;
}

interface StatusPatch {
  providers?: ModelsCatalogProvider[];
  loading?: boolean;
  error?: string | null;
}

const loadStatus = async (
  generation: MutableRefObject<number>,
  current: number,
  apply: (update: StatusPatch) => void,
  showLoading: boolean,
) => {
  if (showLoading) apply({ loading: true, error: null });
  try {
    const status = await modelsCatalogApi.getStatus();
    if (generation.current !== current) return;
    apply({ providers: status.providers, loading: false, error: null });
  } catch (error) {
    if (generation.current !== current) return;
    apply({
      loading: false,
      error: error instanceof Error ? error.message : 'Request failed',
    });
  }
};

/** models.dev catalog freshness for the dashboard panel. */
export const useModelsCatalog = (): ModelsCatalogView => {
  const [providers, setProviders] = useState<ModelsCatalogProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guards late responses after unmount or connection switch.
  const generation = useRef(0);

  const apply = useCallback((update: StatusPatch) => {
    if (update.providers !== undefined) setProviders(update.providers);
    if (update.loading !== undefined) setLoading(update.loading);
    if (update.error !== undefined) setError(update.error);
  }, []);

  const reload = useCallback(() => {
    void loadStatus(generation, generation.current, apply, false);
  }, [apply]);

  const refreshNow = useCallback(async () => {
    const current = generation.current;
    setRefreshing(true);
    setError(null);
    try {
      await modelsCatalogApi.refresh();
      if (generation.current !== current) return;
    } catch (refreshError) {
      if (generation.current !== current) return;
      setError(refreshError instanceof Error ? refreshError.message : 'Request failed');
      setRefreshing(false);
      return;
    }
    await loadStatus(generation, current, apply, false);
    if (generation.current !== current) return;
    setRefreshing(false);
  }, [apply]);

  useEffect(() => {
    const current = generation.current;
    void loadStatus(generation, current, apply, true);
    return () => {
      generation.current += 1;
    };
  }, [apply]);

  return { providers, loading, refreshing, error, reload, refreshNow };
};
