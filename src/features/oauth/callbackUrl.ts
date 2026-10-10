/**
 * 手动回调输入 → 提交给后端的 redirect_url。
 *
 * 只有 xAI 需要拼装：Grok 有时只在页面显示 code，此时用本次登录的 state
 * 拼回固定的回环地址。Z.AI 同理：zcode:// 回调（或裸 code）用本次登录的
 * state 拼回固定的 zcode 回调地址。其余提供商原样提交（Devin 另有严格校验，
 * 见 devinOAuth.ts）。
 */

export const XAI_CALLBACK_URL = 'http://127.0.0.1:56121/callback';
export const ZAI_CALLBACK_URL = 'zcode://zai-auth/callback';

// 只认 http(s)：`code: xyz` 这类页面展示文本也能被 URL 解析（`code:` 是合法 scheme）。
const isAbsoluteHttpUrl = (value: string): boolean => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

const readQueryLikeCallbackInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const queryStart = trimmed.indexOf('?');
  const hashStart = trimmed.indexOf('#');
  const rawParams =
    queryStart >= 0
      ? trimmed.slice(queryStart + 1)
      : hashStart >= 0
        ? trimmed.slice(hashStart + 1)
        : trimmed;

  if (!/(^|[&#?])(code|state|error)=/i.test(rawParams)) return null;
  return new URLSearchParams(rawParams.replace(/^[?#]/, ''));
};

const extractDisplayedXaiCode = (value: string): string => {
  const trimmed = value.trim();
  const codeMatch = trimmed.match(/\bcode\s*[:=]\s*([^\s&]+)/i);
  return (codeMatch?.[1] ?? trimmed).trim();
};

const buildXaiCallbackUrl = (input: string, state?: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (isAbsoluteHttpUrl(trimmed)) return trimmed;

  const params = readQueryLikeCallbackInput(trimmed);
  if (params) {
    const code = params.get('code')?.trim();
    const error = params.get('error')?.trim();
    const errorDescription = params.get('error_description')?.trim();
    const callbackState = params.get('state')?.trim() || state?.trim();
    if (!callbackState) return null;

    const callbackUrl = new URL(XAI_CALLBACK_URL);
    callbackUrl.searchParams.set('state', callbackState);
    if (code) callbackUrl.searchParams.set('code', code);
    if (error) callbackUrl.searchParams.set('error', error);
    if (errorDescription) callbackUrl.searchParams.set('error_description', errorDescription);
    return callbackUrl.toString();
  }

  const code = extractDisplayedXaiCode(trimmed);
  const callbackState = state?.trim();
  if (!code || !callbackState) return null;

  const callbackUrl = new URL(XAI_CALLBACK_URL);
  callbackUrl.searchParams.set('code', code);
  callbackUrl.searchParams.set('state', callbackState);
  return callbackUrl.toString();
};
const buildZaiCallbackUrl = (input: string, state?: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // 粘贴回来的 zcode://（或 https）回调自带 code + state，直接提交。
  // 注意不能用 isAbsoluteHttpUrl：zcode: 不是 http(s) scheme。
  try {
    const protocol = new URL(trimmed).protocol;
    if (protocol === 'zcode:' || protocol === 'http:' || protocol === 'https:') return trimmed;
  } catch {
    // 不是 URL：继续按裸 code / 参数串处理。
  }

  const params = readQueryLikeCallbackInput(trimmed);
  const callbackState = (params?.get('state')?.trim() || state?.trim()) ?? '';
  if (!callbackState) return null;
  if (params) {
    const code = params.get('code')?.trim();
    const error = params.get('error')?.trim();
    const errorDescription = params.get('error_description')?.trim();
    const callbackUrl = new URL(ZAI_CALLBACK_URL);
    callbackUrl.searchParams.set('state', callbackState);
    if (code) callbackUrl.searchParams.set('code', code);
    if (error) callbackUrl.searchParams.set('error', error);
    if (errorDescription) callbackUrl.searchParams.set('error_description', errorDescription);
    return callbackUrl.toString();
  }

  // 裸 code：附上本次登录的 state。
  const callbackUrl = new URL(ZAI_CALLBACK_URL);
  callbackUrl.searchParams.set('code', trimmed);
  callbackUrl.searchParams.set('state', callbackState);
  return callbackUrl.toString();
};


export const resolveCallbackUrl = (
  provider: string,
  input: string,
  state?: string
): string | null => {
  if (provider === 'zai') return buildZaiCallbackUrl(input, state);
  if (provider !== 'xai') return input.trim();
  return buildXaiCallbackUrl(input, state);
};
