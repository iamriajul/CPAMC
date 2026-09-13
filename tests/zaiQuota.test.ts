import { describe, expect, test } from 'bun:test';
import {
  ZAI_QUOTA_URL,
  ZAI_REQUEST_HEADERS,
  parseZaiQuotaPayload,
} from '../src/utils/quota/zai';
import { isZaiFile, resolveAuthProvider } from '../src/utils/quota/validators';
import { QUOTA_ADAPTERS } from '../src/features/quota/providers';
import { buildTimelineLane } from '../src/features/quota/quotaTimelineModel';
import en from '../src/i18n/locales/en.json';

const quotaResponse = () => ({
  success: true,
  code: 200,
  data: {
    level: 'pro',
    limits: [
      {
        type: 'CREDIT_LIMIT',
        usage: 12000,
        currentValue: 1438,
        percentage: 11,
        remaining: 10562,
        nextResetTime: 1789500000000,
        unit: 3,
        number: 5,
      },
      {
        type: 'CREDIT_LIMIT',
        usage: 60000,
        currentValue: 9000,
        percentage: 15,
        remaining: 51000,
        nextResetTime: '2026-09-21T00:00:00.000Z',
        unit: 6,
        number: 1,
      },
      {
        type: 'TIME_LIMIT',
        usage: 100,
        currentValue: 25,
        percentage: 25,
        remaining: 75,
        nextResetTime: 1789500000,
        unit: 3,
        number: 5,
      },
    ],
  },
});

describe('Z.AI quota parsing', () => {
  test('maps 5h + weekly credit/request windows with tier', () => {
    const parsed = parseZaiQuotaPayload(quotaResponse());
    expect(parsed).not.toBeNull();
    expect(parsed?.tier).toBe('pro');
    const ids = (parsed?.windows ?? []).map((window) => window.id).sort();
    expect(ids).toEqual(['1w-credits', '5h-credits', '5h-requests']);
    const credit5h = parsed?.windows.find((window) => window.id === '5h-credits');
    // Exact ratio preferred over the server-rounded percent (rounded to 2dp).
    expect(credit5h?.usedPercent).toBeCloseTo((1438 / 12000) * 100, 1);
    expect(credit5h?.resetAtMs).toBe(1789500000000);
    expect(credit5h?.periodHours).toBe(5);
    const weekly = parsed?.windows.find((window) => window.id === '1w-credits');
    expect(weekly?.periodHours).toBe(24 * 7);
    const req5h = parsed?.windows.find((window) => window.id === '5h-requests');
    // Epoch seconds normalized to milliseconds.
    expect(req5h?.resetAtMs).toBe(1789500000 * 1000);
  });

  test('ignores non-subscription windows and rejects empty payloads', () => {
    const monthly = parseZaiQuotaPayload({
      success: true,
      code: 200,
      data: {
        limits: [{ type: 'CREDIT_LIMIT', usage: 100, currentValue: 10, unit: 5, number: 1 }],
      },
    });
    expect(monthly).toBeNull();
    expect(parseZaiQuotaPayload({ success: false, code: 1001 })).toBeNull();
    expect(parseZaiQuotaPayload('not-json')).toBeNull();
  });
});

describe('Z.AI quota wiring', () => {
  test('resolves zai files and registers the adapter', () => {
    expect(resolveAuthProvider({ name: 'z.json', type: 'zai' })).toBe('zai');
    expect(resolveAuthProvider({ name: 'z.json', type: 'zai-coding-plan' })).toBe('zai');
    expect(isZaiFile({ name: 'z.json', type: 'zai' } as never)).toBeTrue();
    expect(isZaiFile({ name: 'k.json', type: 'kimi' } as never)).toBeFalse();
    expect(QUOTA_ADAPTERS.zai.type).toBe('zai');
    expect(QUOTA_ADAPTERS.zai.i18nPrefix).toBe('zai_quota');
  });

  test('uses the quota endpoint with a verbatim key (no Bearer)', () => {
    expect(ZAI_QUOTA_URL).toBe('https://api.z.ai/api/monitor/usage/quota/limit');
    expect(ZAI_REQUEST_HEADERS.Authorization).toBe('$TOKEN$');
  });

  test('renders translated, unique timeline limit labels', () => {
    const lane = buildTimelineLane({
      name: 'z.json',
      displayName: 'z@example.com',
      provider: 'zai',
      quota: {
        status: 'success',
        rows: [
          {
            id: '5h-credits',
            label: '5 Hour Credit Quota',
            labelKey: 'zai_quota.credits_5h',
            used: 12,
            limit: 100,
            resetAtMs: Date.now() + 3600_000,
            periodHours: 5,
          },
          {
            id: '1w-credits',
            label: 'Weekly Credit Quota',
            labelKey: 'zai_quota.credits_weekly',
            used: 15,
            limit: 100,
            resetAtMs: Date.now() + 86400_000,
            periodHours: 168,
          },
        ],
      },
    });
    expect(lane.limits.length).toBe(2);
    const labels = lane.limits.map((limit) => limit.label);
    expect(labels.every((label) => label.trim().length > 0)).toBeTrue();
    expect(new Set(labels).size).toBe(labels.length);
  });

  test('provides zai_quota translations', () => {
    const quota = (en as unknown as Record<string, Record<string, string>>).zai_quota;
    for (const key of [
      'title',
      'refresh_button',
      'empty_data',
      'credits_5h',
      'requests_weekly',
      'subscription_tier',
    ]) {
      expect(quota[key]?.length).toBeGreaterThan(0);
    }
  });
});
