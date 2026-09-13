/**
 * Z.AI GLM Coding Plan 额度数据层。React-free / SCSS-free。
 *
 * The quota endpoint authorizes with the provisioned key verbatim (no Bearer
 * prefix); only window percents, tier, and reset instants are kept.
 */

import type { TFunction } from 'i18next';
import type { AuthFileItem, ZaiQuotaRow, ZaiQuotaState } from '@/types';
import { apiCallApi, getApiCallErrorMessage } from '@/services/api';
import {
  ZAI_QUOTA_URL,
  ZAI_REQUEST_HEADERS,
  createStatusError,
  isDisabledAuthFile,
  isZaiFile,
  parseZaiQuotaPayload,
} from '@/utils/quota';
import { normalizeAuthIndex } from '@/utils/authIndex';
import type { QuotaProviderData } from '../types';

const fetchZaiQuota = async (
  file: AuthFileItem,
  t: TFunction
): Promise<{ rows: ZaiQuotaRow[]; tier?: string }> => {
  const rawAuthIndex = file['auth_index'] ?? file.authIndex;
  const authIndex = normalizeAuthIndex(rawAuthIndex);
  if (!authIndex) {
    throw new Error(t('zai_quota.missing_auth_index'));
  }

  const result = await apiCallApi.request({
    authIndex,
    method: 'GET',
    url: ZAI_QUOTA_URL,
    header: { ...ZAI_REQUEST_HEADERS },
  });

  if (result.statusCode < 200 || result.statusCode >= 300) {
    throw createStatusError(getApiCallErrorMessage(result), result.statusCode);
  }

  const parsed = parseZaiQuotaPayload(result.body ?? result.bodyText);
  if (!parsed) {
    throw new Error(t('zai_quota.empty_data'));
  }

  return {
    rows: parsed.windows.map((window) => ({
      id: window.id,
      label: t(window.labelKey),
      labelKey: window.labelKey,
      used: window.usedPercent,
      limit: 100,
      resetAtMs: window.resetAtMs,
      periodHours: window.periodHours,
    })),
    tier: parsed.tier,
  };
};

export const ZAI_CONFIG: QuotaProviderData<ZaiQuotaState, Awaited<ReturnType<typeof fetchZaiQuota>>> = {
  type: 'zai',
  i18nPrefix: 'zai_quota',
  filterFn: (file) => isZaiFile(file) && !isDisabledAuthFile(file),
  fetchQuota: fetchZaiQuota,
  storeSelector: (state) => state.zaiQuota,
  storeSetter: 'setZaiQuota',
  buildLoadingState: () => ({ status: 'loading', rows: [] }),
  buildSuccessState: (data) => ({
    status: 'success',
    rows: data.rows,
    tier: data.tier,
  }),
  buildErrorState: (message, status) => ({
    status: 'error',
    rows: [],
    error: message,
    errorStatus: status,
  }),
};
