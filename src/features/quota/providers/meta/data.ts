/**
 * Meta 额度数据层。React-free / SCSS-free。
 *
 * The subscription key endpoint doubles as the usage endpoint; the backend
 * proxies the call with the stored account token (never the browser), and the
 * minted api_key in the response is discarded before anything is stored.
 */

import type { TFunction } from 'i18next';
import type { AuthFileItem, MetaQuotaRow, MetaQuotaState } from '@/types';
import { apiCallApi, getApiCallErrorMessage } from '@/services/api';
import {
  META_KEY_URL,
  META_REQUEST_HEADERS,
  createStatusError,
  isDisabledAuthFile,
  isMetaFile,
  parseMetaKeyPayload,
  type MetaQuotaData,
} from '@/utils/quota';
import { normalizeAuthIndex } from '@/utils/authIndex';
import type { QuotaProviderData } from '../types';

const toRows = (data: MetaQuotaData, t: TFunction): MetaQuotaRow[] =>
  data.windows.map((window) => ({
    id: window.id,
    // The timeline lane renders row.label with key={label}: resolve it here so
    // every limit has a translated, unique label (labelKey alone renders blank).
    label: t(window.labelKey, (window.labelParams ?? {}) as Record<string, string | number>),
    labelKey: window.labelKey,
    labelParams: window.labelParams,
    used: window.usedPercent,
    limit: 100,
    resetAtMs: window.resetAtMs,
    periodHours: window.periodHours,
  }));

const fetchMetaQuota = async (
  file: AuthFileItem,
  t: TFunction
): Promise<{ rows: MetaQuotaRow[]; tier?: string; email?: string }> => {
  const rawAuthIndex = file['auth_index'] ?? file.authIndex;
  const authIndex = normalizeAuthIndex(rawAuthIndex);
  if (!authIndex) {
    throw new Error(t('meta_quota.missing_auth_index'));
  }

  // No { onboard: true } here: refresh/usage probes send an empty object so an
  // already-minted key is returned without re-onboarding side effects.
  const result = await apiCallApi.request({
    authIndex,
    method: 'POST',
    url: META_KEY_URL,
    header: { ...META_REQUEST_HEADERS },
    data: '{}',
  });

  if (result.statusCode < 200 || result.statusCode >= 300) {
    if (result.statusCode === 429) {
      throw createStatusError(t('meta_quota.rate_limited'), result.statusCode);
    }
    throw createStatusError(getApiCallErrorMessage(result), result.statusCode);
  }

  const parsed = parseMetaKeyPayload(result.body ?? result.bodyText);
  if (!parsed) {
    throw new Error(t('meta_quota.empty_data'));
  }
  if (!parsed.active) {
    throw new Error(t('meta_quota.inactive_subscription'));
  }

  return { rows: toRows(parsed, t), tier: parsed.tier, email: parsed.email };
};

export const META_CONFIG: QuotaProviderData<MetaQuotaState, Awaited<ReturnType<typeof fetchMetaQuota>>> = {
  type: 'meta',
  i18nPrefix: 'meta_quota',
  filterFn: (file) => isMetaFile(file) && !isDisabledAuthFile(file),
  fetchQuota: fetchMetaQuota,
  storeSelector: (state) => state.metaQuota,
  storeSetter: 'setMetaQuota',
  buildLoadingState: () => ({ status: 'loading', rows: [] }),
  buildSuccessState: (data) => ({
    status: 'success',
    rows: data.rows,
    tier: data.tier,
    email: data.email,
  }),
  buildErrorState: (message, status) => ({
    status: 'error',
    rows: [],
    error: message,
    errorStatus: status,
  }),
};
