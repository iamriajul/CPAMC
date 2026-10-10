import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/Input';
import { IconExternalLink, IconLoader2 } from '@/components/ui/icons';
import type { KeyImportState } from '../hooks/useKeyImport';
import dialogStyles from './OAuthFlowDialog.module.scss';

export interface KeyImportFormProps {
  i18nPrefix: 'zai_import' | 'opencode_import';
  /** Z.AI cards link the API-key dashboard; OpenCode cards omit it. */
  dashboardUrl?: string;
  supportsBaseUrl: boolean;
  state: KeyImportState;
  onApiKeyChange: (value: string) => void;
  onBaseUrlChange: (value: string) => void;
  onImport: () => void;
  onViewAuthFiles: () => void;
}

/** Dashboard / console key import form: renders inline in a Collapsible, no dialog. */
export function KeyImportForm({
  i18nPrefix,
  dashboardUrl,
  supportsBaseUrl,
  state,
  onApiKeyChange,
  onBaseUrlChange,
  onImport,
  onViewAuthFiles,
}: KeyImportFormProps) {
  const { t } = useTranslation();
  const result = state.result;

  if (result) {
    return (
      <div className={dialogStyles.result} role="status">
        <svg className={dialogStyles.successMark} viewBox="0 0 52 52" aria-hidden="true">
          <circle className={dialogStyles.successRing} cx="26" cy="26" r="24" />
          <path className={dialogStyles.successCheck} d="M16 27l7 7 14-15" />
        </svg>
        <div className={dialogStyles.resultTitle}>{t(`${i18nPrefix}.result_title`)}</div>
        {result.authFile && <div className={dialogStyles.hint}>{result.authFile}</div>}
        <div className={dialogStyles.resultActions}>
          <button type="button" className={dialogStyles.secondary} onClick={onViewAuthFiles}>
            {t('auth_login.view_auth_files')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={dialogStyles.stack}>
      <p className={dialogStyles.hint}>{t(`${i18nPrefix}.description`)}</p>
      {dashboardUrl && (
        <div>
          <button
            type="button"
            className={dialogStyles.secondary}
            onClick={() => window.open(dashboardUrl, '_blank', 'noopener,noreferrer')}
          >
            {t(`${i18nPrefix}.dashboard_button`)}
            <IconExternalLink size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      <Input
        label={t(`${i18nPrefix}.key_label`)}
        hint={t(`${i18nPrefix}.key_hint`)}
        type="password"
        autoComplete="off"
        value={state.apiKey}
        onChange={(event) => onApiKeyChange(event.target.value)}
        placeholder={t(`${i18nPrefix}.key_placeholder`)}
        spellCheck={false}
      />
      {supportsBaseUrl && (
        <Input
          label={t(`${i18nPrefix}.base_url_label`)}
          hint={t(`${i18nPrefix}.base_url_hint`)}
          value={state.baseUrl}
          onChange={(event) => onBaseUrlChange(event.target.value)}
          placeholder={t(`${i18nPrefix}.base_url_placeholder`)}
          spellCheck={false}
        />
      )}

      {state.error && (
        <div className={dialogStyles.alert} role="alert">
          {state.error}
        </div>
      )}

      <div>
        <button
          type="button"
          className={dialogStyles.primary}
          onClick={onImport}
          disabled={!state.apiKey.trim() || state.loading}
        >
          {state.loading && (
            <IconLoader2 size={14} className={dialogStyles.spinning} aria-hidden="true" />
          )}
          {t(`${i18nPrefix}.import_button`)}
        </button>
      </div>
    </div>
  );
}
