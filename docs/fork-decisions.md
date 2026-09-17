# Fork decisions

Every behaviour this fork changes inside official management-center files,
and the command that proves each one still works.

The fork is a rebase queue: `main` is the upstream release tag we track, plus
one commit per change, with no merge commits. Branch protection rejects direct
pushes and merge commits, so every change lands as one squash-merged PR. The
commits hold the code; this file holds the why and the proof.

After rebasing onto a new upstream release, run:

```bash
bash scripts/fork-verify.sh
```

That script parses this file directly, so there is no second copy to keep in
sync — edit a decision here and the runner picks it up. CI job
`fork-decisions` runs the same script on PRs and on `main`.

Changing an official file? Add a section here with a command that fails
without your change. A decision with no command is a decision nothing
protects. Changes confined to fork-owned files (no upstream counterpart)
cannot conflict on sync and need no section.

## meta-oauth-panel

**Meta OAuth login card (Muse subscriptions via the Meta provider)**

OAuth page exposes the backend `meta-auth-url` device flow completely from
the UI: Meta provider card, icon, legacy `muse-code` aliases (normalized to
`meta`), auth-file type/presets/icons, and `meta_oauth_*` / `filter_meta`
strings in en/zh-CN/zh-TW/ru. The fork's old `muse` lane is gone — upstream's
Meta provider is the Muse Code lane now, and `muse-auth-url` no longer exists
server-side.

```bash
bun test tests/metaOAuth.test.ts
grep -q "id: 'meta'" src/pages/OAuthPage.tsx
grep -q "meta_oauth_title" src/i18n/locales/en.json
```

## meta-quota

**Meta subscription usage panel (rolling + weekly windows)**

Quota page, auth-file cards, and timeline lanes cover meta files via a
dedicated adapter: the key endpoint is proxied through the backend api-call
with the resolved Meta token (empty probe body, no re-onboarding), and only
percent/tier/identity fields are kept — the minted api_key is never stored or
rendered. 429s surface a retry-later message instead of a raw error. Meta
omits subs_usage entirely for some active subscriptions (observed live on
the Everyday Usage tier, intermittently — windows come and go between
probes): that parses to a success state showing tier plus a
no-windows note, never an error. The page map uses `satisfies
Record<QuotaProviderType, …>` instead of a cast: the next unmapped provider
fails type-check (CI) rather than the route at runtime.

```bash
grep -q "meta: { ...META_CONFIG" src/features/quota/providers/index.ts
bun test tests/metaQuota.test.ts
grep -q "meta: metaQuota" src/features/quota/QuotaPage.tsx
grep -q "satisfies Record<QuotaProviderType" src/features/quota/QuotaPage.tsx
bun run type-check
```

## opencode-zai-panel

**OpenCode key import + Z.AI OAuth cards and both quota adapters**

OAuth page gains the Z.AI browser-flow card (zcode:// paste-back, same UX as
the xAI manual flow) and the OpenCode Go key-import card (validated save via
the backend import endpoint). Quota page, auth-file cards, and timeline lanes
cover both providers; the page map already guards new providers with
`satisfies`, extended here to the two new slices.

```bash
grep -q "id: 'zai'" src/pages/OAuthPage.tsx
grep -q "opencode: opencodeQuota" src/features/quota/QuotaPage.tsx
bun test tests/opencodeQuota.test.ts tests/zaiQuota.test.ts
```
