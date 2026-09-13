/**
 * OpenCode 额度渲染体：用量行水位条。
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { OpenCodeGoQuotaState } from '@/types';
import { buildResetDisplay } from '@/utils/quota';
import { useNow } from '@/hooks/useNow';
import { QuotaMeter } from '../../components/QuotaMeter';
import { QuotaResetLabel } from '../../components/QuotaResetLabel';
import { collectQuotaRowInstants, pickUrgentRowId } from '../../resetSchedule';
import type { QuotaBodyProps } from '../../types';

export function OpencodeQuotaBody({ quota, classes }: QuotaBodyProps<OpenCodeGoQuotaState>) {
  const { t, i18n } = useTranslation();
  // Ahead of the early return below — hooks cannot be conditional.
  const now = useNow();
  const soonestRowId = useMemo(
    () => pickUrgentRowId(collectQuotaRowInstants('opencode', quota), now),
    [quota, now]
  );
  const rows = quota.rows ?? [];

  if (rows.length === 0) {
    return <div className={classes.quotaMessage}>{t('opencode_quota.empty_data')}</div>;
  }

  return (
    <>
      {rows.map((row, index) => {
        const remaining = Math.max(0, Math.min(100, Math.round(row.limit - row.used)));
        const percentLabel = `${remaining}%`;
        const resetDisplay = buildResetDisplay(
          null,
          row.resetAtMs ?? null,
          now,
          i18n.resolvedLanguage
        );
        const soon = row.id === soonestRowId;

        return (
          <div
            key={row.id}
            className={classes.quotaRow}
            title={soon ? t('quota_management.soonest_row_hint') : undefined}
          >
            <div className={classes.quotaRowHeader}>
              <span className={classes.quotaModel}>
                {t(row.labelKey)}
              </span>
              <div className={classes.quotaMeta}>
                <span className={classes.quotaPercent}>{percentLabel}</span>
                {resetDisplay && (
                  <QuotaResetLabel display={resetDisplay} classes={classes} soon={soon} />
                )}
              </div>
            </div>
            <QuotaMeter percent={remaining} classes={classes} index={index} />
          </div>
        );
      })}
    </>
  );
}
