/**
 * Z.AI GLM Coding Plan quota helpers. React-free.
 *
 * Usage comes from `GET /api/monitor/usage/quota/limit`, which reports one
 * entry per meter/window. Only the subscription windows the plan actually
 * enforces are surfaced: the 5-hour window and the weekly window, across the
 * credit and request meters (token meters included when present on those
 * windows). The minted key authorizes verbatim — no Bearer prefix.
 */

export const ZAI_QUOTA_URL = 'https://api.z.ai/api/monitor/usage/quota/limit';

export const ZAI_REQUEST_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Authorization: '$TOKEN$',
};

export interface ZaiQuotaLimitItem {
  type?: string | null;
  usage?: number | string | null;
  currentValue?: number | string | null;
  percentage?: number | string | null;
  remaining?: number | string | null;
  nextResetTime?: number | string | null;
  unit?: number | string | null;
  number?: number | string | null;
}

export interface ZaiQuotaPayload {
  success?: boolean | null;
  code?: number | string | null;
  msg?: string | null;
  data?: {
    limits?: ZaiQuotaLimitItem[] | null;
    level?: string | null;
  } | null;
}

export interface ZaiQuotaWindow {
  id: string;
  labelKey: string;
  usedPercent: number;
  resetAtMs: number | null;
  periodHours: number | null;
}

export interface ZaiQuotaData {
  windows: ZaiQuotaWindow[];
  tier?: string;
}

const toFiniteNumber = (value: unknown): number | null => {
  const num = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof num === 'number' && Number.isFinite(num) ? num : null;
};

const parseResetMs = (value: unknown): number | null => {
  const num = toFiniteNumber(value);
  if (num === null || num <= 0) return null;
  // Seconds vs milliseconds, disambiguated by magnitude.
  return num < 1e12 ? Math.round(num * 1000) : Math.round(num);
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

/** Resolve the window identity. Null unless it is the 5-hour or weekly window. */
const resolveWindow = (
  unit: number | null,
  count: number | null
): { id: string; periodHours: number | null } | null => {
  if (unit === 3 && (count ?? 1) === 5) return { id: '5h', periodHours: 5 };
  if (unit === 6) return { id: '1w', periodHours: 24 * 7 };
  return null;
};

const METER_LABEL_KEYS: Record<string, string> = {
  CREDIT_LIMIT: 'credits',
  TIME_LIMIT: 'requests',
  TOKENS_LIMIT: 'tokens',
};

const toWindow = (raw: unknown): ZaiQuotaWindow | null => {
  const record = asRecord(raw);
  if (!record || typeof record.type !== 'string') return null;
  const meter = METER_LABEL_KEYS[record.type];
  if (!meter) return null;
  const window = resolveWindow(toFiniteNumber(record.unit), toFiniteNumber(record.number));
  if (!window) return null;

  // Prefer the exact used/limit ratio; fall back to the server-rounded percent.
  const used = toFiniteNumber(record.currentValue);
  const limit = toFiniteNumber(record.usage);
  const fallbackPercent = toFiniteNumber(record.percentage);
  let usedPercent: number | null = null;
  if (used !== null && limit !== null && limit > 0) {
    usedPercent = Math.min(Math.max((used / limit) * 100, 0), 100);
  } else if (fallbackPercent !== null && fallbackPercent >= 0) {
    usedPercent = Math.min(fallbackPercent, 100);
  }
  if (usedPercent === null) return null;

  return {
    id: `${window.id}-${meter}`,
    labelKey: `zai_quota.${meter}_${window.id === '5h' ? '5h' : 'weekly'}`,
    usedPercent: Math.round(usedPercent * 100) / 100,
    resetAtMs: parseResetMs(record.nextResetTime),
    periodHours: window.periodHours,
  };
};

/** Parse the quota endpoint JSON into 5h + weekly windows. Null when empty. */
export function parseZaiQuotaPayload(payload: unknown): ZaiQuotaData | null {
  const root = asRecord(payload);
  if (!root || root.success !== true) return null;
  const data = asRecord(root.data);
  const limits = data && Array.isArray(data.limits) ? data.limits : [];
  const windows: ZaiQuotaWindow[] = [];
  for (const item of limits) {
    const window = toWindow(item);
    if (window) windows.push(window);
  }
  if (windows.length === 0) return null;
  const level = data && typeof data.level === 'string' && data.level.trim() ? data.level.trim() : undefined;
  return { windows, tier: level };
}
