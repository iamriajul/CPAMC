import { useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useRevealGroup } from '@/hooks/motion';
import { useAuthStore, useThemeStore } from '@/stores';
import iconVertex from '@/assets/icons/vertex.svg';
import { Collapsible } from '@/components/ui/Collapsible';
import { OAuthHeader } from './components/OAuthHeader';
import { ProviderTile } from './components/ProviderTile';
import { OAuthFlowDialog, type DialogHeading } from './components/OAuthFlowDialog';
import { VertexImportDialog } from './components/VertexImportDialog';
import { KeyImportForm } from './components/KeyImportForm';
import {
  useOAuthFlows,
  usePluginOAuthProviders,
  type ProviderFlowState,
} from './hooks/useOAuthFlows';
import { useVertexImport } from './hooks/useVertexImport';
import { useKeyImport } from './hooks/useKeyImport';
import { opencodeApi, zaiApi } from '@/services/api';
import {
  isSponsor,
  OAUTH_PROVIDERS,
  resolveThemedIcon,
  supportsManualCallback,
  type OAuthProviderCard,
} from './providers';
import styles from './OAuthPage.module.scss';

/** 对话框焦点标识：Vertex 不是 OAuth 提供商，用保留 id 避免与提供商冲突。 */
const VERTEX_DIALOG_ID = '__vertex__';
const VERTEX_LABEL = 'Vertex AI';
const ZAI_DASHBOARD_URL = 'https://z.ai/manage-apikey/apikey-list';

type DialogTarget = { kind: 'oauth'; id: string } | { kind: 'vertex' };

/**
 * OAuth 登录：提供商画廊（一屏看全）+ 聚焦的授权对话框。
 *
 * 点磁贴即开始登录；对话框可随时关闭，授权在后台继续，磁贴副行实时反映进度。
 * 对话框关闭后保留最后一个目标，让退出动画期间内容不消失。
 */
export function OAuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const apiBase = useAuthStore((state) => state.apiBase);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const revealRef = useRevealGroup<HTMLDivElement>();
  const otherMethodsId = useId();

  const pluginProviders = usePluginOAuthProviders(apiBase);
  const providerCards = useMemo<OAuthProviderCard[]>(
    () => [...OAUTH_PROVIDERS, ...pluginProviders],
    [pluginProviders]
  );

  const focusedRef = useRef<string | null>(null);
  const [dialog, setDialog] = useState<DialogTarget | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const flows = useOAuthFlows({
    providerCards,
    isFocused: (provider) => focusedRef.current === provider,
  });
  const vertexImport = useVertexImport({
    isFocused: () => focusedRef.current === VERTEX_DIALOG_ID,
    onCredentialAdded: flows.recordCredentialAdded,
  });
  // 内联导入卡没有对话框：结果与 toast 都直接展示（沿用旧 OAuth 页行为）。
  const zaiImport = useKeyImport({
    i18nPrefix: 'zai_import',
    isFocused: () => false,
    onCredentialAdded: flows.recordCredentialAdded,
    importKey: (apiKey) => zaiApi.importKey(apiKey),
  });
  const opencodeImport = useKeyImport({
    i18nPrefix: 'opencode_import',
    isFocused: () => false,
    onCredentialAdded: flows.recordCredentialAdded,
    importKey: (apiKey, baseUrl) => opencodeApi.importKey(apiKey, baseUrl),
  });

  const labelOf = (card: OAuthProviderCard) =>
    card.kind === 'plugin'
      ? card.title
      : typeof card.label === 'string'
        ? card.label
        : t(card.label.key);

  const captionOf = (card: OAuthProviderCard) => {
    if (card.kind === 'plugin') return t('auth_login.method_plugin');
    const method = t(
      card.flow === 'device' ? 'auth_login.method_device' : 'auth_login.method_browser'
    );
    return card.domain ? `${card.domain} · ${method}` : method;
  };

  const iconOf = (card: OAuthProviderCard) =>
    card.kind === 'plugin' ? card.icon : resolveThemedIcon(card.icon, resolvedTheme);

  const headingOf = (card: OAuthProviderCard): DialogHeading => ({
    title:
      card.kind === 'plugin'
        ? t('auth_login.plugin_oauth_title', { name: card.title })
        : t(card.titleKey),
    caption: captionOf(card),
    icon: iconOf(card),
  });

  const sponsorOf = (card: OAuthProviderCard) =>
    isSponsor(card)
      ? { url: card.sponsor.signUpUrl, label: t('auth_login.kimi_sign_up_button') }
      : undefined;

  const tileStatusLabel = (status: ProviderFlowState['status']) =>
    status === 'waiting'
      ? t('auth_login.tile_waiting')
      : status === 'success'
        ? t('auth_login.tile_success')
        : status === 'error'
          ? t('auth_login.tile_error')
          : undefined;

  const openProvider = (card: OAuthProviderCard) => {
    focusedRef.current = card.id;
    setDialog({ kind: 'oauth', id: card.id });
    setDialogOpen(true);
    // 已有进行中/失败/刚成功的尝试 → 只是重新打开查看；否则立即开始登录
    if (!flows.states[card.id]?.status) void flows.startAuth(card.id);
  };

  const openVertex = () => {
    focusedRef.current = VERTEX_DIALOG_ID;
    setDialog({ kind: 'vertex' });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (dialog?.kind === 'oauth') flows.dismissSuccess(dialog.id);
    if (dialog?.kind === 'vertex' && vertexImport.vertex.result) vertexImport.resetForAnother();
    focusedRef.current = null;
    setDialogOpen(false);
  };

  const viewAuthFiles = () => navigate('/auth-files');

  const dialogCard =
    dialog?.kind === 'oauth' ? providerCards.find((card) => card.id === dialog.id) : undefined;
  const providerCount = providerCards.length;
  const sponsorCards = providerCards.filter(isSponsor);
  const regularCards = providerCards.filter((card) => !isSponsor(card));

  const renderTile = (card: OAuthProviderCard) => {
    const status = flows.states[card.id]?.status;
    return (
      <ProviderTile
        key={card.id}
        label={labelOf(card)}
        caption={captionOf(card)}
        icon={iconOf(card)}
        index={providerCards.indexOf(card)}
        status={status}
        statusLabel={tileStatusLabel(status)}
        sponsor={sponsorOf(card)}
        onOpen={() => openProvider(card)}
      />
    );
  };
  const waitingCount = Object.values(flows.states).filter(
    (state) => state.status === 'waiting'
  ).length;

  return (
    <div className={styles.page} ref={revealRef}>
      <OAuthHeader
        providerCount={providerCount}
        waitingCount={waitingCount}
        addedCount={flows.addedCount}
      />

      {/* 赞助商独占首行（大卡 + 品牌蓝），其余提供商在下方紧凑网格 */}
      {sponsorCards.length > 0 && (
        <div className={styles.sponsorGrid}>{sponsorCards.map(renderTile)}</div>
      )}
      <div className={styles.grid}>{regularCards.map(renderTile)}</div>

      <section className={styles.section} aria-labelledby={otherMethodsId}>
        <h2 className={styles.sectionLabel} id={otherMethodsId} data-reveal>
          {t('auth_login.other_login_methods')}
        </h2>
        <div className={styles.grid}>
          <ProviderTile
            label={VERTEX_LABEL}
            caption={t('vertex_import.file_label')}
            icon={iconVertex}
            index={providerCount}
            onOpen={openVertex}
          />
        </div>
        <div className={styles.importGrid}>
          <Collapsible label={t('zai_import.title')} defaultOpen={false}>
            <KeyImportForm
              i18nPrefix="zai_import"
              dashboardUrl={ZAI_DASHBOARD_URL}
              supportsBaseUrl={false}
              state={zaiImport.state}
              onApiKeyChange={zaiImport.setApiKey}
              onBaseUrlChange={zaiImport.setBaseUrl}
              onImport={() => void zaiImport.importCredential()}
              onViewAuthFiles={viewAuthFiles}
            />
          </Collapsible>
          <Collapsible label={t('opencode_import.title')} defaultOpen={false}>
            <KeyImportForm
              i18nPrefix="opencode_import"
              supportsBaseUrl
              state={opencodeImport.state}
              onApiKeyChange={opencodeImport.setApiKey}
              onBaseUrlChange={opencodeImport.setBaseUrl}
              onImport={() => void opencodeImport.importCredential()}
              onViewAuthFiles={viewAuthFiles}
            />
          </Collapsible>
        </div>
      </section>

      {dialogCard && (
        <OAuthFlowDialog
          open={dialogOpen && dialog?.kind === 'oauth'}
          providerId={dialogCard.id}
          heading={headingOf(dialogCard)}
          state={flows.states[dialogCard.id] ?? {}}
          text={(suffix) => flows.providerText(dialogCard.id, suffix)}
          supportsCallback={supportsManualCallback(dialogCard)}
          sponsor={sponsorOf(dialogCard)}
          onStart={() => void flows.startAuth(dialogCard.id)}
          onCancel={() => void flows.cancelAuth(dialogCard.id)}
          onCallbackChange={(value) => flows.setCallbackInput(dialogCard.id, value)}
          onCallbackSubmit={() => void flows.submitCallback(dialogCard.id)}
          onViewAuthFiles={viewAuthFiles}
          onClose={closeDialog}
        />
      )}

      <VertexImportDialog
        open={dialogOpen && dialog?.kind === 'vertex'}
        heading={{
          title: t('vertex_import.title'),
          caption: t('vertex_import.file_label'),
          icon: iconVertex,
        }}
        vertex={vertexImport.vertex}
        onPickFile={vertexImport.pickFile}
        onLocationChange={vertexImport.setLocation}
        onImport={() => void vertexImport.importCredential()}
        onImportAnother={vertexImport.resetForAnother}
        onViewAuthFiles={viewAuthFiles}
        onClose={closeDialog}
      />
    </div>
  );
}
