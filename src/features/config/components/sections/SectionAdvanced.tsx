import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Collapsible } from '@/components/ui/Collapsible';
import { SelectionCheckbox } from '@/components/ui/SelectionCheckbox';
import { WEB_SEARCH_PROVIDERS } from '@/types/visualConfig';
import type {
  PluginStoreAuthRule,
  VisualConfigValidationErrors,
  WebSearchConfig,
} from '@/types/visualConfig';
import { CONFIG_TAB_ICONS, SECTION_INDEX_LABELS } from '../../constants';
import type { ConfigSectionProps } from '../../types';
import { SectionCard } from '../SectionCard';
import {
  BlockSetting,
  FieldHint,
  FieldStack,
  SettingCell,
  SettingList,
  TextSetting,
  ToggleSetting,
} from '../fields/FieldPrimitives';
import { PluginStoreAuthEditor } from '../blocks/PluginStoreAuthEditor';
import { StringListEditor } from '../blocks/StringListEditor';
import { getValidationMessage } from '../blocks/shared';
import { SectionOAuthBehavior } from './SectionOAuthBehavior';
import blocks from '../blocks/Blocks.module.scss';

const Icon = CONFIG_TAB_ICONS.advanced;

/** 06 高级与实验：插件源、供应商敏感词、签名缓存与请求头默认值。 */
export function SectionAdvanced({
  values,
  validationErrors,
  disabled,
  animateIn,
  onChange,
}: ConfigSectionProps) {
  const { t } = useTranslation();

  const handlePluginStoreSourcesChange = useCallback(
    (pluginStoreSources: string[]) => onChange({ pluginStoreSources }),
    [onChange]
  );
  const handlePluginStoreAuthChange = useCallback(
    (pluginStoreAuth: PluginStoreAuthRule[]) => onChange({ pluginStoreAuth }),
    [onChange]
  );
  const handleAntigravitySensitiveWordsChange = useCallback(
    (antigravitySensitiveWords: string[]) => onChange({ antigravitySensitiveWords }),
    [onChange]
  );
  const handleDevinSensitiveWordsChange = useCallback(
    (devinSensitiveWords: string[]) => onChange({ devinSensitiveWords }),
    [onChange]
  );

  return (
    <SectionCard
      indexLabel={SECTION_INDEX_LABELS.advanced}
      icon={<Icon size={16} />}
      title={t('config_management.visual.sections.advanced.title')}
      description={t('config_management.visual.sections.advanced.description')}
      animateIn={animateIn}
    >
      <SectionOAuthBehavior
        values={values}
        validationErrors={validationErrors}
        disabled={disabled}
        onChange={onChange}
      />

      <Collapsible
        label={t('config_management.visual.sections.advanced.plugins_title')}
        defaultOpen={false}
      >
        <FieldStack>
          <SettingList>
            <ToggleSetting
              fieldId="pluginsEnabled"
              label={t('config_management.visual.sections.system.plugins_enabled')}
              description={t('config_management.visual.sections.system.plugins_enabled_desc')}
              checked={values.pluginsEnabled}
              disabled={disabled}
              onChange={(pluginsEnabled) => onChange({ pluginsEnabled })}
            />
          </SettingList>

          <SettingList
            title={t('config_management.visual.sections.system.plugin_store_sources')}
            description={t('config_management.visual.sections.system.plugin_store_sources_desc')}
          >
            <BlockSetting
              fieldId="pluginStoreSources"
              label={t('config_management.visual.sections.system.plugin_store_sources_label')}
              description={t('config_management.visual.sections.system.plugin_store_sources_hint')}
            >
              <StringListEditor
                value={values.pluginStoreSources}
                disabled={disabled}
                placeholder={t(
                  'config_management.visual.sections.system.plugin_store_sources_placeholder'
                )}
                inputAriaLabel={t(
                  'config_management.visual.sections.system.plugin_store_sources_label'
                )}
                onChange={handlePluginStoreSourcesChange}
              />
            </BlockSetting>
          </SettingList>

          <SettingList
            title={t('config_management.visual.sections.system.plugin_store_auth')}
            description={t('config_management.visual.sections.system.plugin_store_auth_desc')}
          >
            <SettingCell fieldId="pluginStoreAuth">
              <FieldStack>
                <FieldHint>
                  {t('config_management.visual.sections.system.plugin_store_auth_hint')}
                </FieldHint>
                <PluginStoreAuthEditor
                  value={values.pluginStoreAuth}
                  disabled={disabled}
                  onChange={handlePluginStoreAuthChange}
                />
              </FieldStack>
            </SettingCell>
          </SettingList>
        </FieldStack>
      </Collapsible>

      <Collapsible
        label={t('config_management.visual.sections.advanced.antigravity_title')}
        defaultOpen={false}
      >
        <FieldStack>
          <SettingList
            title={t('config_management.visual.sections.system.antigravity_sensitive_words')}
            description={t(
              'config_management.visual.sections.system.antigravity_sensitive_words_desc'
            )}
          >
            <BlockSetting
              fieldId="antigravitySensitiveWords"
              label={t(
                'config_management.visual.sections.system.antigravity_sensitive_words_label'
              )}
              description={t(
                'config_management.visual.sections.system.antigravity_sensitive_words_hint'
              )}
            >
              <StringListEditor
                value={values.antigravitySensitiveWords}
                disabled={disabled}
                placeholder={t(
                  'config_management.visual.sections.system.antigravity_sensitive_words_placeholder'
                )}
                inputAriaLabel={t(
                  'config_management.visual.sections.system.antigravity_sensitive_words_label'
                )}
                onChange={handleAntigravitySensitiveWordsChange}
              />
            </BlockSetting>
          </SettingList>

          <SettingList title={t('config_management.visual.sections.advanced.signature_title')}>
            <ToggleSetting
              fieldId="antigravitySignatureCacheEnabled"
              label={t('config_management.visual.sections.system.antigravity_signature_cache')}
              description={t(
                'config_management.visual.sections.system.antigravity_signature_cache_desc'
              )}
              checked={values.antigravitySignatureCacheEnabled}
              disabled={disabled}
              onChange={(antigravitySignatureCacheEnabled) =>
                onChange({ antigravitySignatureCacheEnabled })
              }
            />
            <ToggleSetting
              fieldId="antigravitySignatureBypassStrict"
              label={t('config_management.visual.sections.system.antigravity_signature_strict')}
              description={t(
                'config_management.visual.sections.system.antigravity_signature_strict_desc'
              )}
              checked={values.antigravitySignatureBypassStrict}
              disabled={disabled}
              onChange={(antigravitySignatureBypassStrict) =>
                onChange({ antigravitySignatureBypassStrict })
              }
            />
          </SettingList>
        </FieldStack>
      </Collapsible>

      <Collapsible
        label={t('config_management.visual.sections.advanced.devin_title')}
        defaultOpen={false}
      >
        <SettingList
          title={t('config_management.visual.sections.system.devin_sensitive_words')}
          description={t('config_management.visual.sections.system.devin_sensitive_words_desc')}
        >
          <BlockSetting
            fieldId="devinSensitiveWords"
            label={t('config_management.visual.sections.system.devin_sensitive_words_label')}
            description={t('config_management.visual.sections.system.devin_sensitive_words_hint')}
          >
            <StringListEditor
              value={values.devinSensitiveWords}
              disabled={disabled}
              placeholder={t(
                'config_management.visual.sections.system.devin_sensitive_words_placeholder'
              )}
              inputAriaLabel={t(
                'config_management.visual.sections.system.devin_sensitive_words_label'
              )}
              onChange={handleDevinSensitiveWordsChange}
            />
          </BlockSetting>
        </SettingList>
      </Collapsible>

      <WebSearchCollapsible
        validationErrors={validationErrors}
        value={values.webSearch}
        disabled={disabled}
        onChange={(webSearch) => onChange({ webSearch: { ...values.webSearch, ...webSearch } })}
      />

      <Collapsible
        label={t('config_management.visual.sections.headers.title')}
        hint={t('config_management.visual.sections.headers.description')}
        defaultOpen={false}
      >
        <FieldStack>
          <SettingList title={t('config_management.visual.sections.headers.claude_title')}>
            <TextSetting
              fieldId="claudeHeaderUserAgent"
              size="lg"
              label={t('config_management.visual.sections.headers.user_agent')}
              placeholder="claude-cli/2.1.44 (external, sdk-cli)"
              value={values.claudeHeaderUserAgent}
              onChange={(claudeHeaderUserAgent) => onChange({ claudeHeaderUserAgent })}
              disabled={disabled}
            />
            <TextSetting
              fieldId="claudeHeaderPackageVersion"
              size="sm"
              label={t('config_management.visual.sections.headers.package_version')}
              placeholder="0.74.0"
              value={values.claudeHeaderPackageVersion}
              onChange={(claudeHeaderPackageVersion) => onChange({ claudeHeaderPackageVersion })}
              disabled={disabled}
            />
            <TextSetting
              fieldId="claudeHeaderRuntimeVersion"
              size="sm"
              label={t('config_management.visual.sections.headers.runtime_version')}
              placeholder="v24.3.0"
              value={values.claudeHeaderRuntimeVersion}
              onChange={(claudeHeaderRuntimeVersion) => onChange({ claudeHeaderRuntimeVersion })}
              disabled={disabled}
            />
            <TextSetting
              fieldId="claudeHeaderOs"
              size="sm"
              label={t('config_management.visual.sections.headers.os')}
              placeholder="MacOS"
              value={values.claudeHeaderOs}
              onChange={(claudeHeaderOs) => onChange({ claudeHeaderOs })}
              disabled={disabled}
            />
            <TextSetting
              fieldId="claudeHeaderArch"
              size="sm"
              label={t('config_management.visual.sections.headers.arch')}
              placeholder="arm64"
              value={values.claudeHeaderArch}
              onChange={(claudeHeaderArch) => onChange({ claudeHeaderArch })}
              disabled={disabled}
            />
            <TextSetting
              fieldId="claudeHeaderTimezone"
              label={t('config_management.visual.additions.claudeHeaderTimezone.label')}
              description={t('config_management.visual.additions.claudeHeaderTimezone.hint')}
              value={values.claudeHeaderTimezone}
              onChange={(claudeHeaderTimezone) => onChange({ claudeHeaderTimezone })}
              disabled={disabled}
              error={getValidationMessage(t, validationErrors?.claudeHeaderTimezone)}
            />
            <TextSetting
              fieldId="claudeHeaderTimeout"
              size="sm"
              label={t('config_management.visual.sections.headers.timeout')}
              placeholder="600"
              value={values.claudeHeaderTimeout}
              onChange={(claudeHeaderTimeout) => onChange({ claudeHeaderTimeout })}
              disabled={disabled}
            />
            <ToggleSetting
              fieldId="claudeHeaderStabilizeDeviceProfile"
              label={t('config_management.visual.sections.headers.stabilize_device')}
              description={t('config_management.visual.sections.headers.stabilize_device_desc')}
              checked={values.claudeHeaderStabilizeDeviceProfile}
              disabled={disabled}
              onChange={(claudeHeaderStabilizeDeviceProfile) =>
                onChange({ claudeHeaderStabilizeDeviceProfile })
              }
            />
          </SettingList>

          <SettingList title={t('config_management.visual.sections.headers.codex_title')}>
            <TextSetting
              fieldId="codexHeaderUserAgent"
              size="lg"
              label={t('config_management.visual.sections.headers.user_agent')}
              placeholder="codex_cli_rs/0.114.0 (Mac OS 14.2.0; x86_64) vscode/1.111.0"
              value={values.codexHeaderUserAgent}
              onChange={(codexHeaderUserAgent) => onChange({ codexHeaderUserAgent })}
              disabled={disabled}
            />
            <TextSetting
              fieldId="codexHeaderBetaFeatures"
              label={t('config_management.visual.sections.headers.beta_features')}
              placeholder="multi_agent"
              value={values.codexHeaderBetaFeatures}
              onChange={(codexHeaderBetaFeatures) => onChange({ codexHeaderBetaFeatures })}
              disabled={disabled}
            />
          </SettingList>
        </FieldStack>
      </Collapsible>
    </SectionCard>
  );
}

/** 单个 web-search 字符串字段：fieldId 由调用点以字面量传入（parity 守卫扫描源码）。 */
function WebSearchKeyField({
  fieldId,
  labelKey,
  placeholder,
  // 凭据默认遮蔽：漏写 secret 的调用点不再渲染明文密钥。非敏感字段
  // （端点、用户名、模型名）显式传 secret={false}。
  secret = true,
  value,
  onChange,
  disabled,
  wide,
}: {
  fieldId: string;
  labelKey: string;
  placeholder: string;
  secret?: boolean;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  /** 透传 SettingList 的末行补整行：包装组件不得吞掉 wide（见 configSettingLayout 测试）。 */
  wide?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <TextSetting
      fieldId={fieldId}
      label={t(`config_management.visual.sections.websearch.${labelKey}`)}
      type={secret ? 'password' : 'text'}
      autoComplete="off"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      wide={wide}
    />
  );
}

function WebSearchCollapsible({
  value,
  validationErrors,
  disabled,
  onChange,
}: {
  value: WebSearchConfig;
  validationErrors?: VisualConfigValidationErrors;
  disabled?: boolean;
  onChange: (patch: Partial<WebSearchConfig>) => void;
}) {
  const { t } = useTranslation();
  // int 字段：setIntFromStringInDoc 会静默丢弃非数字输入，不提示的话
  // 保存报成功但值没有落盘。
  const webSearchErrors = {
    timeoutSeconds: getValidationMessage(t, validationErrors?.['webSearch.timeoutSeconds']),
    limit: getValidationMessage(t, validationErrors?.['webSearch.limit']),
    maxSearches: getValidationMessage(t, validationErrors?.['webSearch.maxSearches']),
    publicFanoutSoftSeconds: getValidationMessage(
      t,
      validationErrors?.['webSearch.publicFanoutSoftSeconds']
    ),
    publicFanoutHardSeconds: getValidationMessage(
      t,
      validationErrors?.['webSearch.publicFanoutHardSeconds']
    ),
  };
  return (
    <Collapsible
      label={t('config_management.visual.sections.websearch.title')}
      defaultOpen={false}
    >
      <FieldStack>
        <ToggleSetting
          fieldId="webSearch.enabled"
          label={t('config_management.visual.sections.websearch.enabled')}
          description={t('config_management.visual.sections.websearch.enabled_desc')}
          wide
          checked={value.enabled}
          disabled={disabled}
          onChange={(enabled) => onChange({ enabled })}
        />
        <SettingList
          title={t('config_management.visual.sections.websearch.chain_title')}
          description={t('config_management.visual.sections.websearch.chain_desc')}
        >
          <BlockSetting
            fieldId="webSearch.order"
            label={t('config_management.visual.sections.websearch.order')}
            description={t('config_management.visual.sections.websearch.order_hint')}
          >
            <div className={blocks.providerGrid}>
              {WEB_SEARCH_PROVIDERS.map((provider) => (
                <SelectionCheckbox
                  key={provider.id}
                  checked={value.order.includes(provider.id)}
                  disabled={disabled}
                  onChange={(checked) => {
                    const next = checked
                      ? [...value.order, provider.id]
                      : value.order.filter((id) => id !== provider.id);
                    onChange({
                      order: WEB_SEARCH_PROVIDERS.map((p) => p.id).filter((pid) =>
                        next.includes(pid)
                      ),
                    });
                  }}
                  label={provider.id}
                  title={
                    provider.requiresKey
                      ? t('config_management.visual.sections.websearch.provider_needs_key')
                      : t('config_management.visual.sections.websearch.provider_keyless')
                  }
                />
              ))}
            </div>
          </BlockSetting>
          <BlockSetting
            fieldId="webSearch.exclude"
            label={t('config_management.visual.sections.websearch.exclude')}
            description={t('config_management.visual.sections.websearch.exclude_hint')}
          >
            <div className={blocks.providerGrid}>
              {WEB_SEARCH_PROVIDERS.filter((provider) => provider.id !== 'public').map(
                (provider) => (
                  <SelectionCheckbox
                    key={provider.id}
                    checked={value.exclude.includes(provider.id)}
                    disabled={disabled}
                    onChange={(checked) =>
                      onChange({
                        exclude: checked
                          ? [...value.exclude, provider.id]
                          : value.exclude.filter((id) => id !== provider.id),
                      })
                    }
                    label={provider.id}
                  />
                )
              )}
            </div>
          </BlockSetting>
          <TextSetting
            fieldId="webSearch.timeoutSeconds"
            label={t('config_management.visual.sections.websearch.timeout_seconds')}
            description={t('config_management.visual.sections.websearch.timeout_seconds_hint')}
            error={webSearchErrors.timeoutSeconds}
            type="number"
            min={1}
            max={120}
            value={value.timeoutSeconds}
            placeholder="30"
            onChange={(next) => onChange({ timeoutSeconds: next })}
            disabled={disabled}
          />
          <TextSetting
            fieldId="webSearch.limit"
            label={t('config_management.visual.sections.websearch.limit')}
            description={t('config_management.visual.sections.websearch.limit_hint')}
            error={webSearchErrors.limit}
            type="number"
            min={1}
            value={value.limit}
            placeholder="10"
            onChange={(next) => onChange({ limit: next })}
            disabled={disabled}
          />
          <TextSetting
            fieldId="webSearch.maxSearches"
            label={t('config_management.visual.sections.websearch.max_searches')}
            description={t('config_management.visual.sections.websearch.max_searches_hint')}
            error={webSearchErrors.maxSearches}
            type="number"
            min={1}
            value={value.maxSearches}
            placeholder="3"
            onChange={(next) => onChange({ maxSearches: next })}
            disabled={disabled}
          />
          <TextSetting
            fieldId="webSearch.publicFanoutSoftSeconds"
            label={t('config_management.visual.sections.websearch.public_soft')}
            description={t('config_management.visual.sections.websearch.public_soft_hint')}
            error={webSearchErrors.publicFanoutSoftSeconds}
            type="number"
            min={1}
            value={value.publicFanoutSoftSeconds}
            placeholder="5"
            onChange={(next) => onChange({ publicFanoutSoftSeconds: next })}
            disabled={disabled}
          />
          <TextSetting
            fieldId="webSearch.publicFanoutHardSeconds"
            label={t('config_management.visual.sections.websearch.public_hard')}
            description={t('config_management.visual.sections.websearch.public_hard_hint')}
            error={webSearchErrors.publicFanoutHardSeconds}
            type="number"
            min={1}
            value={value.publicFanoutHardSeconds}
            placeholder="30"
            onChange={(next) => onChange({ publicFanoutHardSeconds: next })}
            disabled={disabled}
          />
        </SettingList>
        <FieldHint>
          {t('config_management.visual.sections.websearch.credentials_never_returned')}
        </FieldHint>
        <SettingList
          title={t('config_management.visual.sections.websearch.credentials_title')}
          description={t('config_management.visual.sections.websearch.credentials_desc')}
        >
          <WebSearchKeyField
            fieldId="webSearch.perplexityApiKey"
            labelKey="perplexity_api_key"
            placeholder="PERPLEXITY_API_KEY"
            value={value.perplexityApiKey}
            onChange={(next) => onChange({ perplexityApiKey: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.perplexityOauthToken"
            labelKey="perplexity_oauth_token"
            placeholder="PERPLEXITY_OAUTH_TOKEN"
            value={value.perplexityOauthToken}
            onChange={(next) => onChange({ perplexityOauthToken: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.geminiApiKey"
            labelKey="gemini_api_key"
            placeholder="GEMINI_API_KEY"
            value={value.geminiApiKey}
            onChange={(next) => onChange({ geminiApiKey: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.anthropicApiKey"
            labelKey="anthropic_api_key"
            placeholder="ANTHROPIC_SEARCH_API_KEY"
            value={value.anthropicApiKey}
            onChange={(next) => onChange({ anthropicApiKey: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.xaiApiKey"
            labelKey="xai_api_key"
            placeholder="XAI_API_KEY"
            value={value.xaiApiKey}
            onChange={(next) => onChange({ xaiApiKey: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.codexApiKey"
            labelKey="codex_api_key"
            placeholder="OPENAI_API_KEY"
            value={value.codexApiKey}
            onChange={(next) => onChange({ codexApiKey: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.openRouterApiKey"
            labelKey="openrouter_api_key"
            placeholder="OPENROUTER_API_KEY"
            value={value.openRouterApiKey}
            onChange={(next) => onChange({ openRouterApiKey: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.zaiApiKey"
            labelKey="zai_api_key"
            placeholder="ZAI_API_KEY"
            value={value.zaiApiKey}
            onChange={(next) => onChange({ zaiApiKey: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.exaApiKey"
            labelKey="exa_api_key"
            placeholder="EXA_API_KEY"
            value={value.exaApiKey}
            onChange={(next) => onChange({ exaApiKey: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.tinyfishApiKey"
            labelKey="tinyfish_api_key"
            placeholder="TINYFISH_API_KEY"
            value={value.tinyfishApiKey}
            onChange={(next) => onChange({ tinyfishApiKey: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.jinaApiKey"
            labelKey="jina_api_key"
            placeholder="JINA_API_KEY"
            value={value.jinaApiKey}
            onChange={(next) => onChange({ jinaApiKey: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.kagiApiKey"
            labelKey="kagi_api_key"
            placeholder="KAGI_API_KEY"
            value={value.kagiApiKey}
            onChange={(next) => onChange({ kagiApiKey: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.tavilyApiKey"
            labelKey="tavily_api_key"
            placeholder="TAVILY_API_KEY"
            value={value.tavilyApiKey}
            onChange={(next) => onChange({ tavilyApiKey: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.firecrawlApiKey"
            labelKey="firecrawl_api_key"
            placeholder="FIRECRAWL_API_KEY"
            value={value.firecrawlApiKey}
            onChange={(next) => onChange({ firecrawlApiKey: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.braveApiKey"
            labelKey="brave_api_key"
            placeholder="BRAVE_API_KEY"
            value={value.braveApiKey}
            onChange={(next) => onChange({ braveApiKey: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.kimiApiKey"
            labelKey="kimi_api_key"
            placeholder="MOONSHOT_SEARCH_API_KEY"
            value={value.kimiApiKey}
            onChange={(next) => onChange({ kimiApiKey: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.parallelApiKey"
            labelKey="parallel_api_key"
            placeholder="PARALLEL_API_KEY"
            value={value.parallelApiKey}
            onChange={(next) => onChange({ parallelApiKey: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.syntheticApiKey"
            labelKey="synthetic_api_key"
            placeholder="SYNTHETIC_API_KEY"
            value={value.syntheticApiKey}
            onChange={(next) => onChange({ syntheticApiKey: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.ollamaApiKey"
            labelKey="ollama_api_key"
            placeholder="OLLAMA_CLOUD_API_KEY"
            value={value.ollamaApiKey}
            onChange={(next) => onChange({ ollamaApiKey: next })}
            disabled={disabled}
          />
        </SettingList>
        <SettingList
          title={t('config_management.visual.sections.websearch.endpoints_title')}
          description={t('config_management.visual.sections.websearch.endpoints_desc')}
        >
          <WebSearchKeyField
            fieldId="webSearch.searxngEndpoint"
            labelKey="searxng_endpoint"
            placeholder="http://127.0.0.1:8888"
            secret={false}
            value={value.searxngEndpoint}
            onChange={(next) => onChange({ searxngEndpoint: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.searxngUsername"
            labelKey="searxng_username"
            placeholder="searxng"
            secret={false}
            value={value.searxngUsername}
            onChange={(next) => onChange({ searxngUsername: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.searxngToken"
            labelKey="searxng_token"
            placeholder="SEARXNG_TOKEN"
            secret
            value={value.searxngToken}
            onChange={(next) => onChange({ searxngToken: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.searxngPassword"
            labelKey="searxng_password"
            placeholder="SEARXNG_PASSWORD"
            secret
            value={value.searxngPassword}
            onChange={(next) => onChange({ searxngPassword: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.geminiSearchModel"
            labelKey="gemini_model"
            placeholder="gemini-2.5-flash"
            secret={false}
            value={value.geminiSearchModel}
            onChange={(next) => onChange({ geminiSearchModel: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.anthropicSearchModel"
            labelKey="anthropic_model"
            placeholder="claude-haiku-4-5"
            secret={false}
            value={value.anthropicSearchModel}
            onChange={(next) => onChange({ anthropicSearchModel: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.xaiSearchModel"
            labelKey="xai_model"
            placeholder="grok-4.5"
            secret={false}
            value={value.xaiSearchModel}
            onChange={(next) => onChange({ xaiSearchModel: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.codexSearchModel"
            labelKey="codex_model"
            placeholder="gpt-5-mini"
            secret={false}
            value={value.codexSearchModel}
            onChange={(next) => onChange({ codexSearchModel: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.geminiBaseUrl"
            labelKey="gemini_base_url"
            placeholder="https://…"
            secret={false}
            value={value.geminiBaseUrl}
            onChange={(next) => onChange({ geminiBaseUrl: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.anthropicBaseUrl"
            labelKey="anthropic_base_url"
            placeholder="https://…"
            secret={false}
            value={value.anthropicBaseUrl}
            onChange={(next) => onChange({ anthropicBaseUrl: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.xaiBaseUrl"
            labelKey="xai_base_url"
            placeholder="https://…"
            secret={false}
            value={value.xaiBaseUrl}
            onChange={(next) => onChange({ xaiBaseUrl: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.codexBaseUrl"
            labelKey="codex_base_url"
            placeholder="https://…"
            secret={false}
            value={value.codexBaseUrl}
            onChange={(next) => onChange({ codexBaseUrl: next })}
            disabled={disabled}
          />
          <WebSearchKeyField
            fieldId="webSearch.firecrawlBaseUrl"
            labelKey="firecrawl_base_url"
            placeholder="https://…"
            secret={false}
            value={value.firecrawlBaseUrl}
            onChange={(next) => onChange({ firecrawlBaseUrl: next })}
            disabled={disabled}
          />
        </SettingList>
      </FieldStack>
    </Collapsible>
  );
}
