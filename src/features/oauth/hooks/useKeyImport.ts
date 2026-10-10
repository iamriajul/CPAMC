import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '@/stores';
import { getErrorMessage } from '@/utils/helpers';
import { notifyAuthFilesChanged } from '@/features/authFiles/authFilesEvents';

export interface KeyImportResult {
  authFile?: string;
}

export interface KeyImportState {
  apiKey: string;
  baseUrl: string;
  loading: boolean;
  error?: string;
  result?: KeyImportResult;
}

export interface KeyImportResponse {
  auth_file?: string;
  file?: string;
}

/** Dashboard / console key import (Z.AI, OpenCode): key (+ optional base URL) → validated save. */
export function useKeyImport(options: {
  /** `<prefix>.key_required` / `<prefix>.success`  supply the copy. */
  i18nPrefix: 'zai_import' | 'opencode_import';
  isFocused: () => boolean;
  onCredentialAdded: () => void;
  importKey: (apiKey: string, baseUrl?: string) => Promise<KeyImportResponse>;
}) {
  const { i18nPrefix, isFocused, onCredentialAdded, importKey } = options;
  const { t } = useTranslation();
  const { showNotification } = useNotificationStore();
  const [state, setState] = useState<KeyImportState>({ apiKey: '', baseUrl: '', loading: false });

  const setApiKey = (apiKey: string) =>
    setState((prev) => ({ ...prev, apiKey, error: undefined, result: undefined }));

  const setBaseUrl = (baseUrl: string) =>
    setState((prev) => ({ ...prev, baseUrl, error: undefined, result: undefined }));

  const importCredential = async () => {
    const apiKey = state.apiKey.trim();
    if (!apiKey) {
      const message = t(`${i18nPrefix}.key_required`);
      setState((prev) => ({ ...prev, error: message }));
      if (!isFocused()) showNotification(message, 'warning');
      return;
    }
    const baseUrl = state.baseUrl.trim();
    setState((prev) => ({ ...prev, loading: true, error: undefined, result: undefined }));
    try {
      const res = await importKey(apiKey, baseUrl || undefined);
      const result: KeyImportResult = { authFile: res.auth_file ?? res.file };
      // The key itself is never kept in memory longer than the request.
      setState((prev) => ({ ...prev, apiKey: '', loading: false, result }));
      notifyAuthFilesChanged();
      onCredentialAdded();
      if (!isFocused()) showNotification(t(`${i18nPrefix}.success`), 'success');
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message || t('notification.upload_failed'),
      }));
      if (!isFocused()) {
        showNotification(
          message ? `${t('notification.upload_failed')}: ${message}` : t('notification.upload_failed'),
          'error'
        );
      }
    }
  };

  /** 导入成功后再导入一个：清空结果，保留 base URL。 */
  const resetForAnother = () =>
    setState((prev) => ({ apiKey: '', baseUrl: prev.baseUrl, loading: false }));

  return { state, setApiKey, setBaseUrl, importCredential, resetForAnother };
}
