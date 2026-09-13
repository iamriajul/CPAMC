/**
 * Muse 额度数据层。React-free / SCSS-free。
 *
 * The subscription key endpoint doubles as the usage endpoint; the backend
 * proxies the call with the stored account token (never the browser), and the
 * minted api_key in the response is discarded before anything is stored.
 */

import type { TFunction } from 'i18next';
import type { AuthFileItem, MuseQuotaRow, MuseQuotaState } from '@/types';
import { apiCallApi, getApiCallErrorMessage } from '@/services/api';
import {
  MUSE_KEY_URL,
  MUSE_REQUEST_HEADERS,
  createStatusError,
  isDisabledAuthFile,
  isMuseFile,
  parseMuseKeyPayload,
  type MuseQuotaData,
} from '@/utils/quota';
import { normalizeAuthIndex } from '@/utils/authIndex';
import type { QuotaProviderData } from '../types';

const toRows = (data: MuseQuotaData): MuseQuotaRow[] =>
  data.windows.map((window) => ({
    id: window.id,
    labelKey: window.labelKey,
    labelParams: window.labelParams,
    used: window.usedPercent,
    limit: 100,
    resetAtMs: window.resetAtMs,
    periodHours: window.periodHours,
  }));

const fetchMuseQuota = async (
  file: AuthFileItem,
  t: TFunction
): Promise<{ rows: MuseQuotaRow[]; tier?: string; email?: string }> => {
  const rawAuthIndex = file['auth_index'] ?? file.authIndex;
  const authIndex = normalizeAuthIndex(rawAuthIndex);
  if (!authIndex) {
    throw new Error(t('muse_quota.missing_auth_index'));
  }

  // No { onboard: true } here: refresh/usage probes send an empty object so an
  // already-minted key is returned without re-onboarding side effects.
  const result = await apiCallApi.request({
    authIndex,
    method: 'POST',
    url: MUSE_KEY_URL,
    header: { ...MUSE_REQUEST_HEADERS },
    data: '{}',
  });

  if (result.statusCode < 200 || result.statusCode >= 300) {
    if (result.statusCode === 429) {
      throw createStatusError(t('muse_quota.rate_limited'), result.statusCode);
    }
    throw createStatusError(getApiCallErrorMessage(result), result.statusCode);
  }

  const parsed = parseMuseKeyPayload(result.body ?? result.bodyText);
  if (!parsed) {
    throw new Error(t('muse_quota.empty_data'));
  }
  if (!parsed.active) {
    throw new Error(t('muse_quota.inactive_subscription'));
  }

  return { rows: toRows(parsed), tier: parsed.tier, email: parsed.email };
};

export const MUSE_CONFIG: QuotaProviderData<MuseQuotaState, Awaited<ReturnType<typeof fetchMuseQuota>>> = {
  type: 'muse',
  i18nPrefix: 'muse_quota',
  filterFn: (file) => isMuseFile(file) && !isDisabledAuthFile(file),
  fetchQuota: fetchMuseQuota,
  storeSelector: (state) => state.museQuota,
  storeSetter: 'setMuseQuota',
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
