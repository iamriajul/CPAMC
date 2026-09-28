import { useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, type SelectOption } from '@/components/ui/Select';
import { modelsDevProvidersApi } from '@/services/api/modelsdevProviders';
import styles from './sharedForm.module.scss';

/** Base URL is free text; debounce so a form with N models does not fire N lookups per keystroke. */
const LOOKUP_DEBOUNCE_MS = 300;

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
 *
 * A stored pin is never hidden. If the catalog no longer returns it — a
 * provider renamed, or a proxy whose base URL the catalog does not know — the
 * control still shows it and lets the operator change or clear it. Silently
 * rendering a hint about auto-detection while saving a different, invisible
 * value would make the form lie about what it is about to write.
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

  const modelName = model.trim();
  const pin = value.trim();

  useEffect(() => {
    if (!modelName) {
      setProviders([]);
      setFailed(false);
      // Reset explicitly: the cancelled fetch's finally() is a no-op, so
      // without this the hint would stay stuck on "Checking models.dev…".
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    const timer = setTimeout(() => {
      modelsDevProvidersApi
        .list(modelName, baseUrl.trim() || undefined)
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
    }, LOOKUP_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [modelName, baseUrl]);

  const options = useMemo<SelectOption[]>(() => {
    const listed = providers.map((provider) => ({
      value: provider.id,
      label: provider.name ? `${provider.name} (${provider.id})` : provider.id,
    }));
    // Keep a stored pin selectable even when the catalog stopped returning it,
    // so the control never renders blank against a non-empty value.
    if (pin && !listed.some((option) => option.value === pin)) {
      listed.push({
        value: pin,
        label: `${pin} (${t('providersPage.form.modelsDevProviderUnknown')})`,
      });
    }
    return [{ value: '', label: t('providersPage.form.modelsDevProviderAuto') }, ...listed];
  }, [providers, pin, t]);

  // A lone provider the catalog confirms, with no stored pin, needs no input:
  // the catalog resolves it and the operator has nothing to choose. Anything
  // else must show the dropdown, so what is shown is what gets saved.
  const canCollapse =
    !loading &&
    !failed &&
    !pickerFallsBackToDropdown(
      providers.map((p) => p.id),
      pin
    );

  if (canCollapse) {
    return (
      <div className={styles.field}>
        <span className={styles.label}>{t('providersPage.form.modelsDevProvider')}</span>
        <small className={styles.labelHint}>
          {loading
            ? t('providersPage.form.modelsDevProviderLoading')
            : providers.length === 1
              ? t('providersPage.form.modelsDevProviderAutoDetected', {
                  provider: providers[0].id,
                })
              : t('providersPage.form.modelsDevProviderUnavailable')}
        </small>
      </div>
    );
  }

  // A stored pin that the catalog cannot confirm falls through to the
  // dropdown rather than being hidden, so what is shown is what is saved.
  return (
    <div className={styles.field}>
      <label id={labelId} className={styles.label}>
        {t('providersPage.form.modelsDevProvider')}
      </label>
      <Select
        value={pin}
        options={options}
        onChange={onChange}
        disabled={disabled || loading}
        ariaLabelledBy={labelId}
        ariaDescribedBy={hintId}
      />
      <small id={hintId} className={styles.labelHint}>
        {failed || providers.length === 0
          ? t('providersPage.form.modelsDevProviderStaleHint')
          : t('providersPage.form.modelsDevProviderHint', { count: providers.length })}
      </small>
    </div>
  );
}

/**
 * Decides whether the picker must show the dropdown rather than collapsing to a
 * text hint.
 *
 * The dropdown is required whenever the operator could not otherwise see or
 * change what will be saved: several providers to choose from, or a stored pin
 * the catalog cannot confirm. A lone catalog provider matching the pin, or an
 * empty pin with nothing to choose, carries no decision worth showing.
 *
 * Exported for testing: this rule is what regressed, and it is pure.
 */
export function pickerFallsBackToDropdown(providerIds: readonly string[], pin: string): boolean {
  if (providerIds.length > 1) return true;
  if (providerIds.length === 1) {
    // One provider is the only choice, so there is nothing to decide — unless
    // a different one is already pinned, which the operator must be able to see
    // and change.
    return pin !== '' && providerIds[0] !== pin;
  }
  // Nothing in the catalog. A stored pin is still being saved and must stay
  // visible; with no pin there is nothing to show or change.
  return pin !== '';
}
