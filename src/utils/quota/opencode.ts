/**
 * OpenCode Zen Go quota helpers. React-free.
 *
 * Usage comes from the first-party `GET /zen/go/v1/usage` endpoint, which
 * reports floored integer percents plus an ISO reset per window. All three
 * windows are required: a partial report would overwrite the last-good cached
 * report and silently drop windows, so malformed input yields null.
 */

export const OPENCODE_GO_USAGE_URL = 'https://opencode.ai/zen/go/v1/usage';

export const OPENCODE_GO_REQUEST_HEADERS = {
  Accept: 'application/json',
  Authorization: 'Bearer $TOKEN$',
};

export interface OpenCodeGoUsageWindow {
  percent?: number | null;
  status?: string | null;
  resetsAt?: string | null;
}

export interface OpenCodeGoUsagePayload {
  usage?: {
    rolling?: OpenCodeGoUsageWindow | null;
    weekly?: OpenCodeGoUsageWindow | null;
    monthly?: OpenCodeGoUsageWindow | null;
  } | null;
}

export interface OpenCodeGoQuotaWindow {
  id: string;
  labelKey: string;
  usedPercent: number;
  rateLimited: boolean;
  resetAtMs: number | null;
  periodHours: number | null;
}

export interface OpenCodeGoQuotaData {
  windows: OpenCodeGoQuotaWindow[];
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const toWindow = (
  id: string,
  labelKey: string,
  periodHours: number | null,
  raw: unknown
): OpenCodeGoQuotaWindow | null => {
  const record = asRecord(raw);
  if (!record) return null;
  const percent = record.percent;
  const status = record.status;
  if (
    typeof percent !== 'number' ||
    !Number.isFinite(percent) ||
    percent < 0 ||
    percent > 100 ||
    (status !== 'ok' && status !== 'rate-limited')
  ) {
    return null;
  }
  const resetsAt = record.resetsAt;
  const resetAtMs =
    typeof resetsAt === 'string' && resetsAt ? Date.parse(resetsAt) : Number.NaN;
  if (!Number.isFinite(resetAtMs)) return null;
  return {
    id,
    labelKey,
    usedPercent: Math.floor(percent),
    rateLimited: status === 'rate-limited',
    resetAtMs,
    periodHours,
  };
};

/** Parse the usage endpoint JSON. Null unless all three windows decode. */
export function parseOpenCodeGoUsagePayload(payload: unknown): OpenCodeGoQuotaData | null {
  const root = asRecord(payload);
  const usage = root ? asRecord(root.usage) : null;
  if (!usage) return null;
  const windows = [
    toWindow('rolling-5h', 'opencode_quota.limit_5h', 5, usage.rolling),
    toWindow('weekly', 'opencode_quota.limit_weekly', 24 * 7, usage.weekly),
    toWindow('monthly', 'opencode_quota.limit_monthly', null, usage.monthly),
  ];
  if (windows.some((window) => window === null)) return null;
  return { windows: windows as OpenCodeGoQuotaWindow[] };
}
