export type PayloadParamValueType = 'string' | 'number' | 'boolean' | 'json';
export type DisableImageGenerationMode = 'false' | 'true' | 'chat' | 'passthrough';
export type RoutingStrategy = 'round-robin' | 'weighted-round-robin' | 'fill-first';
export type PluginStoreAuthType = 'none' | 'bearer' | 'basic' | 'header' | 'github-token';
export type PluginStoreAuthApplyTo = 'registry' | 'metadata' | 'artifact';
export type PayloadParamValidationErrorCode =
  'payload_invalid_number' | 'payload_invalid_boolean' | 'payload_invalid_json';

export type VisualConfigFieldPath =
  | 'port'
  | 'errorLogsMaxFiles'
  | 'logsMaxTotalSizeMb'
  | 'redisUsageQueueRetentionSeconds'
  | 'requestRetry'
  | 'maxRetryCredentials'
  | 'maxRetryInterval'
  | 'authAutoRefreshWorkers'
  | 'streaming.keepaliveSeconds'
  | 'streaming.bootstrapRetries'
  | 'streaming.nonstreamKeepaliveInterval';

export type VisualConfigValidationErrorCode =
  'port_range' | 'integer' | 'non_negative_integer' | 'integer_range_1_3600';

export type VisualConfigValidationErrors = Partial<
  Record<VisualConfigFieldPath, VisualConfigValidationErrorCode>
>;

export type PayloadParamEntry = {
  id: string;
  path: string;
  valueType: PayloadParamValueType;
  value: string;
};

export type PayloadHeaderEntry = {
  id: string;
  name: string;
  value: string;
};

export type PayloadModelEntry = {
  id: string;
  name: string;
  protocol?: string;
  fromProtocol?: string;
  headers?: PayloadHeaderEntry[];
  match?: PayloadParamEntry[];
  notMatch?: PayloadParamEntry[];
  exist?: string[];
  notExist?: string[];
};

export type PayloadRule = {
  id: string;
  models: PayloadModelEntry[];
  params: PayloadParamEntry[];
};

export type PayloadFilterRule = {
  id: string;
  models: PayloadModelEntry[];
  params: string[];
};

export interface StreamingConfig {
  keepaliveSeconds: string;
  bootstrapRetries: string;
  nonstreamKeepaliveInterval: string;
}

export type PluginStoreAuthRule = {
  id: string;
  match: string;
  applyTo: PluginStoreAuthApplyTo[];
  type: PluginStoreAuthType;
  tokenEnv: string;
  usernameEnv: string;
  passwordEnv: string;
  headerName: string;
  headerValueEnv: string;
  allowInsecure: boolean;
};

/** 内置搜索后端；顺序即 chain 中的尝试顺序（无凭据者自动跳过）。 */
export const WEB_SEARCH_PROVIDERS = [
  { id: 'perplexity', requiresKey: false },
  { id: 'gemini', requiresKey: true },
  { id: 'anthropic', requiresKey: true },
  { id: 'codex', requiresKey: true },
  { id: 'xai', requiresKey: true },
  { id: 'zai', requiresKey: true },
  { id: 'exa', requiresKey: false },
  { id: 'tinyfish', requiresKey: true },
  { id: 'jina', requiresKey: true },
  { id: 'kagi', requiresKey: true },
  { id: 'tavily', requiresKey: true },
  { id: 'firecrawl', requiresKey: false },
  { id: 'brave', requiresKey: true },
  { id: 'kimi', requiresKey: true },
  { id: 'parallel', requiresKey: false },
  { id: 'synthetic', requiresKey: true },
  { id: 'ollama', requiresKey: true },
  { id: 'searxng', requiresKey: true },
  { id: 'startpage', requiresKey: false },
  { id: 'duckduckgo', requiresKey: false },
  { id: 'ecosia', requiresKey: false },
  { id: 'google', requiresKey: false },
  { id: 'mojeek', requiresKey: false },
  { id: 'public', requiresKey: false },
] as const;

export type WebSearchProviderId = (typeof WEB_SEARCH_PROVIDERS)[number]['id'];

/** 代理侧 web search。密钥一律 password 输入；后端 json tag 为 "-" 故不回显。 */
export interface WebSearchConfig {
  enabled: boolean;
  order: string[];
  exclude: string[];
  timeoutSeconds: string;
  limit: string;
  maxSearches: string;
  publicFanoutSoftSeconds: string;
  publicFanoutHardSeconds: string;
  perplexityApiKey: string;
  perplexityOauthToken: string;
  geminiApiKey: string;
  anthropicApiKey: string;
  xaiApiKey: string;
  openRouterApiKey: string;
  codexApiKey: string;
  zaiApiKey: string;
  exaApiKey: string;
  tinyfishApiKey: string;
  jinaApiKey: string;
  kagiApiKey: string;
  tavilyApiKey: string;
  firecrawlApiKey: string;
  braveApiKey: string;
  kimiApiKey: string;
  parallelApiKey: string;
  syntheticApiKey: string;
  ollamaApiKey: string;
  searxngEndpoint: string;
  searxngToken: string;
  searxngUsername: string;
  searxngPassword: string;
  geminiSearchModel: string;
  anthropicSearchModel: string;
  xaiSearchModel: string;
  codexSearchModel: string;
  geminiBaseUrl: string;
  anthropicBaseUrl: string;
  xaiBaseUrl: string;
  codexBaseUrl: string;
  firecrawlBaseUrl: string;
}

export type VisualConfigValues = {
  host: string;
  port: string;
  tlsEnable: boolean;
  tlsCert: string;
  tlsKey: string;
  rmAllowRemote: boolean;
  rmSecretKey: string;
  rmDisableControlPanel: boolean;
  rmDisableAutoUpdatePanel: boolean;
  rmPanelRepo: string;
  authDir: string;
  apiKeysText: string;
  pluginsEnabled: boolean;
  pluginStoreSources: string[];
  pluginStoreAuth: PluginStoreAuthRule[];
  debug: boolean;
  commercialMode: boolean;
  loggingToFile: boolean;
  logsMaxTotalSizeMb: string;
  errorLogsMaxFiles: string;
  usageStatisticsEnabled: boolean;
  redisUsageQueueRetentionSeconds: string;
  proxyUrl: string;
  forceModelPrefix: boolean;
  passthroughHeaders: boolean;
  requestRetry: string;
  maxRetryCredentials: string;
  maxRetryInterval: string;
  disableCooling: boolean;
  disableImageGeneration: DisableImageGenerationMode;
  gptImage2BaseModel: string;
  authAutoRefreshWorkers: string;
  quotaSwitchProject: boolean;
  quotaSwitchPreviewModel: boolean;
  quotaAntigravityCredits: boolean;
  routingStrategy: RoutingStrategy;
  routingSessionAffinity: boolean;
  routingSessionAffinityTTL: string;
  wsAuth: boolean;
  antigravitySensitiveWords: string[];
  devinSensitiveWords: string[];
  antigravitySignatureCacheEnabled: boolean;
  antigravitySignatureBypassStrict: boolean;
  claudeHeaderUserAgent: string;
  claudeHeaderPackageVersion: string;
  claudeHeaderRuntimeVersion: string;
  claudeHeaderOs: string;
  claudeHeaderArch: string;
  claudeHeaderTimeout: string;
  claudeHeaderStabilizeDeviceProfile: boolean;
  codexHeaderUserAgent: string;
  codexHeaderBetaFeatures: string;
  payloadDefaultRules: PayloadRule[];
  payloadDefaultRawRules: PayloadRule[];
  payloadOverrideRules: PayloadRule[];
  payloadOverrideRawRules: PayloadRule[];
  payloadFilterRules: PayloadFilterRule[];
  streaming: StreamingConfig;
  webSearch: WebSearchConfig;
};

export const makeClientId = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

export const DEFAULT_VISUAL_VALUES: VisualConfigValues = {
  host: '',
  port: '',
  tlsEnable: false,
  tlsCert: '',
  tlsKey: '',
  rmAllowRemote: false,
  rmSecretKey: '',
  rmDisableControlPanel: false,
  rmDisableAutoUpdatePanel: false,
  rmPanelRepo: '',
  authDir: '',
  apiKeysText: '',
  pluginsEnabled: false,
  pluginStoreSources: [],
  pluginStoreAuth: [],
  debug: false,
  commercialMode: false,
  loggingToFile: false,
  logsMaxTotalSizeMb: '',
  errorLogsMaxFiles: '',
  usageStatisticsEnabled: false,
  redisUsageQueueRetentionSeconds: '',
  proxyUrl: '',
  forceModelPrefix: false,
  passthroughHeaders: false,
  requestRetry: '',
  maxRetryCredentials: '',
  maxRetryInterval: '',
  disableCooling: false,
  disableImageGeneration: 'false',
  gptImage2BaseModel: '',
  authAutoRefreshWorkers: '',
  quotaSwitchProject: false,
  quotaSwitchPreviewModel: false,
  quotaAntigravityCredits: false,
  routingStrategy: 'round-robin',
  routingSessionAffinity: false,
  routingSessionAffinityTTL: '',
  wsAuth: true,
  antigravitySensitiveWords: [],
  devinSensitiveWords: [],
  antigravitySignatureCacheEnabled: true,
  antigravitySignatureBypassStrict: false,
  claudeHeaderUserAgent: '',
  claudeHeaderPackageVersion: '',
  claudeHeaderRuntimeVersion: '',
  claudeHeaderOs: '',
  claudeHeaderArch: '',
  claudeHeaderTimeout: '',
  claudeHeaderStabilizeDeviceProfile: false,
  codexHeaderUserAgent: '',
  codexHeaderBetaFeatures: '',
  payloadDefaultRules: [],
  payloadDefaultRawRules: [],
  payloadOverrideRules: [],
  payloadOverrideRawRules: [],
  payloadFilterRules: [],
  streaming: {
    keepaliveSeconds: '',
    bootstrapRetries: '',
    nonstreamKeepaliveInterval: '',
  },
  webSearch: {
    enabled: false,
    order: [],
    exclude: [],
    timeoutSeconds: '',
    limit: '',
    maxSearches: '',
    publicFanoutSoftSeconds: '',
    publicFanoutHardSeconds: '',
    perplexityApiKey: '',
    perplexityOauthToken: '',
    geminiApiKey: '',
    anthropicApiKey: '',
    xaiApiKey: '',
    openRouterApiKey: '',
    codexApiKey: '',
    zaiApiKey: '',
    exaApiKey: '',
    tinyfishApiKey: '',
    jinaApiKey: '',
    kagiApiKey: '',
    tavilyApiKey: '',
    firecrawlApiKey: '',
    braveApiKey: '',
    kimiApiKey: '',
    parallelApiKey: '',
    syntheticApiKey: '',
    ollamaApiKey: '',
    searxngEndpoint: '',
    searxngToken: '',
    searxngUsername: '',
    searxngPassword: '',
    geminiSearchModel: '',
    anthropicSearchModel: '',
    xaiSearchModel: '',
    codexSearchModel: '',
    geminiBaseUrl: '',
    anthropicBaseUrl: '',
    xaiBaseUrl: '',
    codexBaseUrl: '',
    firecrawlBaseUrl: '',
  },
};
