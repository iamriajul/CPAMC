import { describe, expect, test } from 'bun:test';
import {
  OPENCODE_GO_REQUEST_HEADERS,
  OPENCODE_GO_USAGE_URL,
  parseOpenCodeGoUsagePayload,
} from '../src/utils/quota/opencode';
import { isOpencodeFile, resolveAuthProvider } from '../src/utils/quota/validators';
import { QUOTA_ADAPTERS } from '../src/features/quota/providers';
import en from '../src/i18n/locales/en.json';

const usageResponse = () => ({
  usage: {
    rolling: { percent: 42, status: 'ok', resetsAt: '2026-09-14T00:00:00.000Z' },
    weekly: { percent: 70, status: 'rate-limited', resetsAt: '2026-09-21T00:00:00.000Z' },
    monthly: { percent: 5, status: 'ok', resetsAt: '2026-10-13T00:00:00.000Z' },
  },
});

describe('OpenCode quota parsing', () => {
  test('maps all three windows with resets', () => {
    const parsed = parseOpenCodeGoUsagePayload(usageResponse());
    expect(parsed).not.toBeNull();
    expect(parsed?.windows.map((window) => window.id)).toEqual([
      'rolling-5h',
      'weekly',
      'monthly',
    ]);
    const rolling = parsed?.windows[0];
    expect(rolling?.usedPercent).toBe(42);
    expect(rolling?.rateLimited).toBeFalse();
    expect(rolling?.resetAtMs).toBe(Date.parse('2026-09-14T00:00:00.000Z'));
    expect(rolling?.periodHours).toBe(5);
    expect(parsed?.windows[1].rateLimited).toBeTrue();
    expect(parsed?.windows[1].periodHours).toBe(24 * 7);
    expect(parsed?.windows[2].periodHours).toBeNull();
  });

  test('rejects partial or malformed reports (all-or-nothing)', () => {
    expect(parseOpenCodeGoUsagePayload({ usage: { rolling: { percent: 1, status: 'ok', resetsAt: '2026-09-14T00:00:00.000Z' } } })).toBeNull();
    expect(
      parseOpenCodeGoUsagePayload({
        usage: {
          rolling: { percent: 101, status: 'ok', resetsAt: '2026-09-14T00:00:00.000Z' },
          weekly: { percent: 1, status: 'ok', resetsAt: '2026-09-14T00:00:00.000Z' },
          monthly: { percent: 1, status: 'ok', resetsAt: '2026-09-14T00:00:00.000Z' },
        },
      })
    ).toBeNull();
    expect(
      parseOpenCodeGoUsagePayload({
        usage: {
          rolling: { percent: 1, status: 'weird', resetsAt: '2026-09-14T00:00:00.000Z' },
          weekly: { percent: 1, status: 'ok', resetsAt: '2026-09-14T00:00:00.000Z' },
          monthly: { percent: 1, status: 'ok', resetsAt: '2026-09-14T00:00:00.000Z' },
        },
      })
    ).toBeNull();
    expect(parseOpenCodeGoUsagePayload('not-json')).toBeNull();
  });
});

describe('OpenCode quota wiring', () => {
  test('resolves opencode files and registers the adapter', () => {
    expect(resolveAuthProvider({ name: 'o.json', type: 'opencode' })).toBe('opencode');
    expect(resolveAuthProvider({ name: 'o.json', type: 'opencode-go' })).toBe('opencode');
    expect(isOpencodeFile({ name: 'o.json', type: 'opencode' } as never)).toBeTrue();
    expect(isOpencodeFile({ name: 'k.json', type: 'kimi' } as never)).toBeFalse();
    expect(QUOTA_ADAPTERS.opencode.type).toBe('opencode');
    expect(QUOTA_ADAPTERS.opencode.i18nPrefix).toBe('opencode_quota');
  });

  test('uses the usage endpoint with bearer auth', () => {
    expect(OPENCODE_GO_USAGE_URL).toBe('https://opencode.ai/zen/go/v1/usage');
    expect(OPENCODE_GO_REQUEST_HEADERS.Authorization).toBe('Bearer $TOKEN$');
  });

  test('provides opencode_quota translations', () => {
    const quota = (en as unknown as Record<string, Record<string, string>>).opencode_quota;
    for (const key of [
      'title',
      'refresh_button',
      'empty_data',
      'limit_5h',
      'limit_weekly',
      'limit_monthly',
      'no_subscription',
    ]) {
      expect(quota[key]?.length).toBeGreaterThan(0);
    }
  });
});
