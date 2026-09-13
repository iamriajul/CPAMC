import { describe, expect, test } from 'bun:test';
import { normalizeOAuthProviderKey } from '../src/utils/providerKeys';
import { resolveAuthProvider } from '../src/utils/quota/validators';
import {
  AUTH_FILE_ICONS,
  AUTH_FILE_MANUAL_REFRESH_PROVIDERS,
  OAUTH_PROVIDER_PRESETS,
} from '../src/features/authFiles/constants';
import { TYPE_COLORS } from '../src/utils/quota/constants';
import en from '../src/i18n/locales/en.json';
import zhCN from '../src/i18n/locales/zh-CN.json';
import zhTW from '../src/i18n/locales/zh-TW.json';
import ru from '../src/i18n/locales/ru.json';

describe('Muse OAuth UI wiring', () => {
  test('normalizes muse-code aliases to muse', () => {
    expect(normalizeOAuthProviderKey('muse-code')).toBe('muse');
    expect(normalizeOAuthProviderKey('muse_code')).toBe('muse');
    expect(normalizeOAuthProviderKey('muse')).toBe('muse');
  });

  test('resolves muse auth files', () => {
    expect(resolveAuthProvider({ name: 'muse-x.json', type: 'muse' })).toBe('muse');
    expect(resolveAuthProvider({ name: 'muse-x.json', type: 'muse-code' })).toBe('muse');
  });

  test('exposes muse in OAuth presets, manual refresh, icons, and colors', () => {
    expect(OAUTH_PROVIDER_PRESETS).toContain('muse');
    expect(AUTH_FILE_MANUAL_REFRESH_PROVIDERS.has('muse')).toBeTrue();
    expect(AUTH_FILE_ICONS.muse).toBeDefined();
    expect(TYPE_COLORS.muse).toBeDefined();
  });

  test('provides muse OAuth translations in all locales', () => {
    // Every key the OAuth card consumes for a builtin provider (see
    // OAuthPage renderOAuthProviderCard + startAuth/startPolling).
    const requiredKeys = [
      'muse_oauth_title',
      'muse_oauth_button',
      'muse_oauth_hint',
      'muse_oauth_url_label',
      'muse_open_link',
      'muse_copy_link',
      'muse_oauth_status_waiting',
      'muse_oauth_status_success',
      'muse_oauth_status_error',
      'muse_oauth_start_error',
      'muse_oauth_polling_error',
    ] as const;
    for (const locale of [en, zhCN, zhTW, ru] as const) {
      const authLogin = (locale as Record<string, Record<string, string>>).auth_login;
      for (const key of requiredKeys) {
        expect(authLogin[key]?.length).toBeGreaterThan(0);
      }
      const authFiles = (locale as Record<string, Record<string, string>>).auth_files;
      expect(authFiles.filter_muse).toBe('Muse');
    }
  });
});
