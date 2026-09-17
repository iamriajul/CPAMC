const OAUTH_PROVIDER_ALIASES: Record<string, string> = {
  'anti-gravity': 'antigravity',
  grok: 'xai',
  'x-ai': 'xai',
  'x.ai': 'xai',
  // Retired fork lane: backend NormalizeOAuthProvider maps these to meta too.
  muse: 'meta',
  'muse-code': 'meta',
  muse_code: 'meta',
  musecode: 'meta',
  'opencode-go': 'opencode',
  opencode_go: 'opencode',
  'zai-coding-plan': 'zai',
  zhipu: 'zai',
  glm: 'zai',
};

const MANAGEMENT_OAUTH_PROVIDER_PATTERN = /^[a-z0-9-]+$/;

export const normalizeOAuthProviderKey = (value: string): string => {
  const key = value.trim().toLowerCase().replace(/_/g, '-');
  return OAUTH_PROVIDER_ALIASES[key] ?? key;
};

export const normalizeManagementOAuthProviderKey = (value: string): string =>
  value.trim().toLowerCase();

export const isManagementOAuthProviderKey = (value: string): boolean =>
  MANAGEMENT_OAUTH_PROVIDER_PATTERN.test(value);
