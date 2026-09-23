import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { modelsCatalogApi, type ModelsCatalogProvider } from '@/services/api';
import { getStatusFromError } from '@/utils/quota';

export interface ModelsCatalogView {
  providers: ModelsCatalogProvider[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  /** False when the backend has no modelsdev routes (upstream build): the panel hides. */
  supported: boolean;
  reload: () => void;
  refreshNow: () => Promise<void>;
}

interface StatusPatch {
  providers?: ModelsCatalogProvider[];
  loading?: boolean;
  error?: string | null;
  supported?: boolean;
}

/** 404 means the backend predates the modelsdev routes: unsupported, not an error. */
const isUnsupportedBackend = (error: unknown): boolean => getStatusFromError(error) === 404;

const loadStatus = async (
  generation: RefObject<number>,
  current: number,
  apply: (update: StatusPatch) => void,
  showLoading: boolean,
) => {
  if (showLoading) apply({ loading: true, error: null });
  try {
    const status = await modelsCatalogApi.getStatus();
    if (generation.current !== current) return;
    apply({ providers: status.providers, loading: false, error: null, supported: true });
  } catch (error) {
    if (generation.current !== current) return;
    if (isUnsupportedBackend(error)) {
      apply({ providers: [], loading: false, error: null, supported: false });
      return;
    }
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
  const [supported, setSupported] = useState(true);
  // Guards late responses after unmount or connection switch.
  const generation = useRef(0);

  const apply = useCallback((update: StatusPatch) => {
    if (update.providers !== undefined) setProviders(update.providers);
    if (update.loading !== undefined) setLoading(update.loading);
    if (update.error !== undefined) setError(update.error);
    if (update.supported !== undefined) setSupported(update.supported);
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
      if (isUnsupportedBackend(refreshError)) {
        setSupported(false);
        setRefreshing(false);
        return;
      }
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

  return { providers, loading, refreshing, error, supported, reload, refreshNow };
};
