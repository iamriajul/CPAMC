import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import {
  normalizeCatalogProvider,
  normalizeCatalogStatus,
} from '../src/services/api/modelsCatalog';
import { formatCatalogAge } from '../src/features/dashboard/utils';

const LOCALES = ['en', 'zh-CN', 'zh-TW', 'ru'] as const;

const CATALOG_KEYS = [
  'catalog_eyebrow',
  'catalog_title',
  'catalog_live',
  'catalog_fallback',
  'catalog_lanes',
  'catalog_updated_ago',
  'catalog_never_fetched',
  'catalog_fetch_failed',
  'catalog_loading',
  'catalog_empty',
  'catalog_refresh',
  'catalog_refreshing',
];

describe('normalizeCatalogProvider', () => {
  test('keeps live rows with counts and timestamps', () => {
    expect(
      normalizeCatalogProvider({
        id: 'opencode-go',
        source: 'live',
        models: 39,
        fetched_at: '2026-09-23T12:00:00Z',
        last_error: null,
      }),
    ).toEqual({
      id: 'opencode-go',
      source: 'live',
      models: 39,
      fetchedAt: '2026-09-23T12:00:00Z',
      lastError: null,
    });
  });

  test('defaults unknown sources to fallback and clamps counts', () => {
    expect(
      normalizeCatalogProvider({ id: 'zai-coding-plan', source: 'bogus', models: -3 }),
    ).toEqual({
      id: 'zai-coding-plan',
      source: 'fallback',
      models: 0,
      fetchedAt: null,
      lastError: null,
    });
  });

  test('rejects rows without an id', () => {
    expect(normalizeCatalogProvider({ source: 'live', models: 7 })).toBeNull();
    expect(normalizeCatalogProvider(null)).toBeNull();
    expect(normalizeCatalogProvider('opencode-go')).toBeNull();
  });
});

describe('normalizeCatalogStatus', () => {
  test('drops invalid rows but keeps valid ones', () => {
    expect(
      normalizeCatalogStatus({ providers: [{ id: 'a', models: 1 }, null, { models: 2 }] }),
    ).toEqual({
      providers: [{ id: 'a', source: 'fallback', models: 1, fetchedAt: null, lastError: null }],
    });
  });

  test('tolerates missing or malformed envelopes', () => {
    expect(normalizeCatalogStatus({})).toEqual({ providers: [] });
    expect(normalizeCatalogStatus(null)).toEqual({ providers: [] });
  });
});

describe('formatCatalogAge', () => {
  test('compacts durations and rejects bad input', () => {
    const now = Date.parse('2026-09-23T12:00:00Z');
    expect(formatCatalogAge('2026-09-23T11:59:15Z', now)).toBe('45s');
    expect(formatCatalogAge('2026-09-23T11:48:00Z', now)).toBe('12m');
    expect(formatCatalogAge('2026-09-23T09:00:00Z', now)).toBe('3h');
    expect(formatCatalogAge('2026-09-21T12:00:00Z', now)).toBe('2d');
    expect(formatCatalogAge(null, now)).toBeNull();
    expect(formatCatalogAge('not-a-date', now)).toBeNull();
  });
});

describe('catalog locales', () => {
  test('all four locales carry every catalog key with plain text', () => {
    for (const locale of LOCALES) {
      const { dashboard } = JSON.parse(
        readFileSync(new URL(`../src/i18n/locales/${locale}.json`, import.meta.url), 'utf8'),
      ) as { dashboard: Record<string, string> };
      for (const key of CATALOG_KEYS) {
        expect(dashboard[key], `${locale}.${key}`).toBeTruthy();
        expect(dashboard[key]).not.toMatch(/<[^>]+>/);
      }
    }
  });
});
