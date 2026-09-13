import { describe, expect, test } from 'bun:test';
import {
  MUSE_KEY_URL,
  MUSE_REQUEST_HEADERS,
  parseMuseKeyPayload,
} from '../src/utils/quota/muse';
import { isMuseFile, resolveAuthProvider } from '../src/utils/quota/validators';
import { QUOTA_ADAPTERS } from '../src/features/quota/providers';
import en from '../src/i18n/locales/en.json';

const keyResponse = (overrides: Record<string, unknown> = {}) => ({
  api_key: 'LLM|subscription-key-that-must-never-surface',
  user_email: 'Muse@Example.com',
  user_id: 'meta-account-1',
  is_subs_active: true,
  subs_tier_id: 'high',
  subs_tier_name: 'High',
  subs_usage: {
    window: {
      used_percent: 12.5,
      resets_at: '2026-09-14T00:00:00.000Z',
      window_duration_mins: 300,
    },
    weekly: {
      used_percent: 34,
      resets_at: 1789500000,
    },
  },
  ...overrides,
});

describe('Muse quota parsing', () => {
  test('maps rolling + weekly windows with tier and email', () => {
    const parsed = parseMuseKeyPayload(keyResponse());
    expect(parsed).not.toBeNull();
    expect(parsed?.active).toBeTrue();
    expect(parsed?.tier).toBe('High');
    expect(parsed?.email).toBe('muse@example.com');
    expect(parsed?.windows.length).toBe(2);
    const rolling = parsed?.windows.find((window) => window.id === '300m');
    expect(rolling?.usedPercent).toBe(12.5);
    expect(rolling?.resetAtMs).toBe(Date.parse('2026-09-14T00:00:00.000Z'));
    expect(rolling?.periodHours).toBe(5);
    const weekly = parsed?.windows.find((window) => window.id === '1w');
    expect(weekly?.usedPercent).toBe(34);
    // Epoch seconds are normalized to milliseconds.
    expect(weekly?.resetAtMs).toBe(1789500000 * 1000);
    expect(weekly?.periodHours).toBe(24 * 7);
  });

  test('never exposes the minted api_key', () => {
    const parsed = parseMuseKeyPayload(keyResponse());
    expect(JSON.stringify(parsed)).not.toContain('LLM|');
  });

  test('rejects inactive subscriptions and empty usage', () => {
    const inactive = parseMuseKeyPayload(keyResponse({ is_subs_active: false }));
    expect(inactive?.active).toBeFalse();
    expect(parseMuseKeyPayload(keyResponse({ subs_usage: null }))).toBeNull();
    expect(parseMuseKeyPayload(keyResponse({ subs_usage: {} }))).toBeNull();
    expect(parseMuseKeyPayload('not-json')).toBeNull();
  });

  test('tolerates string numbers and missing timestamps', () => {
    const parsed = parseMuseKeyPayload(
      keyResponse({
        subs_usage: {
          window: { used_percent: '50', window_duration_mins: '60' },
          weekly: null,
        },
      })
    );
    expect(parsed?.windows.length).toBe(1);
    expect(parsed?.windows[0].usedPercent).toBe(50);
    expect(parsed?.windows[0].resetAtMs).toBeNull();
    expect(parsed?.windows[0].periodHours).toBe(1);
  });
});

describe('Muse quota wiring', () => {
  test('resolves muse files and registers the adapter', () => {
    expect(resolveAuthProvider({ name: 'm.json', type: 'muse' })).toBe('muse');
    expect(isMuseFile({ name: 'm.json', type: 'muse' } as never)).toBeTrue();
    expect(isMuseFile({ name: 'k.json', type: 'kimi' } as never)).toBeFalse();
    expect(QUOTA_ADAPTERS.muse.type).toBe('muse');
    expect(QUOTA_ADAPTERS.muse.i18nPrefix).toBe('muse_quota');
  });

  test('uses the key endpoint with version header and empty probe body', () => {
    expect(MUSE_KEY_URL).toBe('https://api.meta.ai/muse-code/key');
    expect(MUSE_REQUEST_HEADERS['x-api-version']).toBe('1.0.0');
    expect(MUSE_REQUEST_HEADERS.Authorization).toContain('$TOKEN$');
  });

  test('provides muse_quota translations', () => {
    const authLogin = (
      en as unknown as Record<string, Record<string, string>>
    ).muse_quota;
    for (const key of [
      'title',
      'refresh_button',
      'empty_data',
      'weekly',
      'rolling_window_hours',
      'subscription_tier',
      'rate_limited',
      'inactive_subscription',
    ]) {
      expect(authLogin[key]?.length).toBeGreaterThan(0);
    }
  });
});
