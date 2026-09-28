import { useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, type SelectOption } from '@/components/ui/Select';
import { modelsDevProvidersApi } from '@/services/api/modelsdevProviders';
import styles from './sharedForm.module.scss';

interface ModelsDevProviderPickerProps {
  /** Upstream model name, as models.dev publishes it. */
  model: string;
  /** Currently pinned provider, empty when unresolved. */
  value: string;
  /** Provider base URL; used only to rank the likely provider first. */
  baseUrl: string;
  disabled: boolean;
  onChange: (provider: string) => void;
}

/**
 * Lets the operator choose which models.dev provider supplies this model's
 * capability metadata.
 *
 * A model name is often published by many providers with different context
 * windows and reasoning ladders, so without a choice the proxy would apply
 * whichever entry happened to be indexed. A model served by exactly one
 * provider needs no input and is applied automatically.
 */
export function ModelsDevProviderPicker({
  model,
  value,
  baseUrl,
  disabled,
  onChange,
}: ModelsDevProviderPickerProps) {
  const { t } = useTranslation();
  const labelId = useId();
  const hintId = useId();
  const [providers, setProviders] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const name = model.trim();
    if (!name) {
      setProviders([]);
      setFailed(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    modelsDevProvidersApi
      .list(name, baseUrl.trim() || undefined)
      .then((result) => {
        if (cancelled) return;
        setProviders(result.providers.map((p) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {
        // A failed lookup is not an error the operator must resolve: the
        // backend falls back to the base-url catalog, so the field simply
        // offers no choice.
        if (cancelled) return;
        setProviders([]);
        setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [model, baseUrl]);

  const options = useMemo<SelectOption[]>(
    () => [
      { value: '', label: t('providersPage.form.modelsDevProviderAuto') },
      ...providers.map((provider) => ({
        value: provider.id,
        label: provider.name ? `${provider.name} (${provider.id})` : provider.id,
      })),
    ],
    [providers, t]
  );

  // A single provider is unambiguous, so the catalog resolves it without the
  // operator choosing. Report it rather than showing a pointless one-item list.
  if (providers.length <= 1) {
    return (
      <div className={styles.field}>
        <span className={styles.label}>{t('providersPage.form.modelsDevProvider')}</span>
        <small className={styles.labelHint}>
          {loading
            ? t('providersPage.form.modelsDevProviderLoading')
            : failed || providers.length === 0
              ? t('providersPage.form.modelsDevProviderUnavailable')
              : t('providersPage.form.modelsDevProviderAutoDetected', {
                  provider: providers[0].id,
                })}
        </small>
      </div>
    );
  }

  return (
    <div className={styles.field}>
      <label id={labelId} className={styles.label}>
        {t('providersPage.form.modelsDevProvider')}
      </label>
      <Select
        value={value}
        options={options}
        onChange={onChange}
        disabled={disabled || loading}
        ariaLabelledBy={labelId}
        ariaDescribedBy={hintId}
      />
      <small id={hintId} className={styles.labelHint}>
        {t('providersPage.form.modelsDevProviderHint', { count: providers.length })}
      </small>
    </div>
  );
}
