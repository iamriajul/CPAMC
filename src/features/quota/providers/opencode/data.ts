/**
 * OpenCode Zen Go 额度数据层。React-free / SCSS-free。
 */

import type { TFunction } from 'i18next';
import type { AuthFileItem, OpenCodeGoQuotaRow, OpenCodeGoQuotaState } from '@/types';
import { apiCallApi, getApiCallErrorMessage } from '@/services/api';
import {
  OPENCODE_GO_REQUEST_HEADERS,
  OPENCODE_GO_USAGE_URL,
  createStatusError,
  isDisabledAuthFile,
  isOpencodeFile,
  parseOpenCodeGoUsagePayload,
} from '@/utils/quota';
import { normalizeAuthIndex } from '@/utils/authIndex';
import type { QuotaProviderData } from '../types';

const fetchOpencodeQuota = async (
  file: AuthFileItem,
  t: TFunction
): Promise<OpenCodeGoQuotaRow[]> => {
  const rawAuthIndex = file['auth_index'] ?? file.authIndex;
  const authIndex = normalizeAuthIndex(rawAuthIndex);
  if (!authIndex) {
    throw new Error(t('opencode_quota.missing_auth_index'));
  }

  const result = await apiCallApi.request({
    authIndex,
    method: 'GET',
    url: OPENCODE_GO_USAGE_URL,
    header: { ...OPENCODE_GO_REQUEST_HEADERS },
  });

  if (result.statusCode < 200 || result.statusCode >= 300) {
    if (result.statusCode === 401 || result.statusCode === 403) {
      throw createStatusError(t('opencode_quota.no_subscription'), result.statusCode);
    }
    throw createStatusError(getApiCallErrorMessage(result), result.statusCode);
  }

  const parsed = parseOpenCodeGoUsagePayload(result.body ?? result.bodyText);
  if (!parsed) {
    throw new Error(t('opencode_quota.empty_data'));
  }

  return parsed.windows.map((window) => ({
    id: window.id,
    label: t(window.labelKey),
    labelKey: window.labelKey,
    used: window.usedPercent,
    limit: 100,
    resetAtMs: window.resetAtMs,
    periodHours: window.periodHours,
  }));
};

export const OPENCODE_CONFIG: QuotaProviderData<OpenCodeGoQuotaState, OpenCodeGoQuotaRow[]> = {
  type: 'opencode',
  i18nPrefix: 'opencode_quota',
  filterFn: (file) => isOpencodeFile(file) && !isDisabledAuthFile(file),
  fetchQuota: fetchOpencodeQuota,
  storeSelector: (state) => state.opencodeQuota,
  storeSetter: 'setOpencodeQuota',
  buildLoadingState: () => ({ status: 'loading', rows: [] }),
  buildSuccessState: (rows) => ({ status: 'success', rows }),
  buildErrorState: (message, status) => ({
    status: 'error',
    rows: [],
    error: message,
    errorStatus: status,
  }),
};
