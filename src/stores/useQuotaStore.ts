/**
 * Quota cache that survives route switches.
 */

import { create } from 'zustand';
import { getQuotaCacheFileName } from '@/utils/quota/identity';
import type {
  AntigravityQuotaState,
  ClaudeQuotaState,
  CodexQuotaState,
  DevinQuotaState,
  KimiQuotaState,
  MetaQuotaState,
  museQuota: Record<string, MuseQuotaState>;
  xaiQuota: Record<string, XaiQuotaState>;
  setAntigravityQuota: (updater: QuotaUpdater<Record<string, AntigravityQuotaState>>) => void;
  setClaudeQuota: (updater: QuotaUpdater<Record<string, ClaudeQuotaState>>) => void;
  setCodexQuota: (updater: QuotaUpdater<Record<string, CodexQuotaState>>) => void;
  setDevinQuota: (updater: QuotaUpdater<Record<string, DevinQuotaState>>) => void;
  setKimiQuota: (updater: QuotaUpdater<Record<string, KimiQuotaState>>) => void;
  setMetaQuota: (updater: QuotaUpdater<Record<string, MetaQuotaState>>) => void;
  museQuota: {},
  xaiQuota: {},
  setAntigravityQuota: (updater) =>
    set((state) => ({
      antigravityQuota: resolveUpdater(updater, state.antigravityQuota),
    })),
  setClaudeQuota: (updater) =>
    set((state) => ({
      claudeQuota: resolveUpdater(updater, state.claudeQuota),
    })),
  setCodexQuota: (updater) =>
    set((state) => ({
      codexQuota: resolveUpdater(updater, state.codexQuota),
    })),
  setDevinQuota: (updater) =>
    set((state) => ({
      devinQuota: resolveUpdater(updater, state.devinQuota),
    })),
  setKimiQuota: (updater) =>
    set((state) => ({
      kimiQuota: resolveUpdater(updater, state.kimiQuota),
    })),
  setMetaQuota: (updater) =>
    set((state) => ({ metaQuota: resolveUpdater(updater, state.metaQuota) })),
          museQuota: omitNames(state.museQuota),
          xaiQuota: omitNames(state.xaiQuota),
        };
      }
      return {
        cacheGeneration: state.cacheGeneration + 1,
        fileGenerations: {},
        antigravityQuota: {},
        claudeQuota: {},
        codexQuota: {},
        devinQuota: {},
        kimiQuota: {},
        metaQuota: {},
        museQuota: {},
        xaiQuota: {},
      };
}));

export const captureQuotaCacheGeneration = (name?: string) => {
  const { cacheGeneration, fileGenerations } = useQuotaStore.getState();
  return { cacheGeneration, fileGenerations, name };
};

export const commitIfQuotaCacheCurrent = (
  generation: ReturnType<typeof captureQuotaCacheGeneration>,
  commit: () => void,
  name: string | undefined = generation.name
): boolean => {
  const current = useQuotaStore.getState();
  if (current.cacheGeneration !== generation.cacheGeneration) return false;
  // File-scoped requests survive mutations to unrelated credentials.
  if (name !== undefined) {
    if ((current.fileGenerations[name] ?? 0) !== (generation.fileGenerations[name] ?? 0)) {
      return false;
    }
  } else if (current.fileGenerations !== generation.fileGenerations) {
    return false;
  }
  commit();
  return true;
};
