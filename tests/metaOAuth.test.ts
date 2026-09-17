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

describe('Meta OAuth UI wiring', () => {
  test('normalizes legacy muse aliases to meta', () => {
    expect(normalizeOAuthProviderKey('muse')).toBe('meta');
    expect(normalizeOAuthProviderKey('muse-code')).toBe('meta');
    expect(normalizeOAuthProviderKey('muse_code')).toBe('meta');
    expect(normalizeOAuthProviderKey('meta')).toBe('meta');
  });

  test('resolves meta auth files', () => {
    expect(resolveAuthProvider({ name: 'meta-x.json', type: 'meta' })).toBe('meta');
    expect(resolveAuthProvider({ name: 'meta-x.json', type: 'muse-code' })).toBe('meta');
  });

  test('exposes meta in OAuth presets, manual refresh, icons, and colors', () => {
    expect(OAUTH_PROVIDER_PRESETS).toContain('meta');
    expect(AUTH_FILE_MANUAL_REFRESH_PROVIDERS.has('meta')).toBeTrue();
    expect(AUTH_FILE_ICONS.meta).toBeDefined();
    expect(TYPE_COLORS.meta).toBeDefined();
  });

  test('provides meta OAuth translations in all locales', () => {
    // Every key the OAuth card consumes for a builtin provider (see
    // OAuthPage renderOAuthProviderCard + startAuth/startPolling).
    const requiredKeys = [
      'meta_oauth_title',
      'meta_oauth_button',
      'meta_oauth_hint',
      'meta_oauth_url_label',
      'meta_open_link',
      'meta_copy_link',
      'meta_oauth_status_waiting',
      'meta_oauth_status_success',
      'meta_oauth_status_error',
      'meta_oauth_start_error',
      'meta_oauth_polling_error',
    ] as const;
    for (const locale of [en, zhCN, zhTW, ru] as const) {
      const authLogin = (locale as Record<string, Record<string, string>>).auth_login;
      for (const key of requiredKeys) {
        expect(authLogin[key]?.length).toBeGreaterThan(0);
      }
      const authFiles = (locale as Record<string, Record<string, string>>).auth_files;
      expect(authFiles.filter_meta?.length).toBeGreaterThan(0);
    }
  });
});
