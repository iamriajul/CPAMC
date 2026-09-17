# Fork decisions

Every behaviour this fork changes inside official management-center files,
and the command that proves each one still works.

The fork is a rebase queue: `main` is the upstream release tag we track, plus
one commit per change, with no merge commits. A GitHub ruleset enforces the
queue shape; landing is a temporary-ruleset-disabled force-with-lease push
(see [fork-sync.md](fork-sync.md)). The commits hold the code; this file holds
the why and the proof.

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

**Meta OAuth login card is upstream's; the fork keeps only the legacy alias
normalization**

Upstream v1.24.0 shipped their own Meta provider (OAuth card, quota adapter,
DCA-token fetcher, i18n), absorbing what this fork had built on the v1.23.1
base — so the fork's own Meta OAuth card and quota panel were retired in that
sync, and the Meta card you see in the panel is upstream's code. What the
fork still owns: legacy `muse` / `muse-code` / `muse_code` / `musecode`
aliases normalize to `meta` in both the OAuth provider key and the
management-path key (backend `NormalizeOAuthProvider` maps the same set), so
auth files saved under the retired fork lane keep working, and meta appears
in the auth-file filter presets. The fork's old `muse` quota lane is gone and
must stay gone: no `muse` quota provider, adapter, or tab may reappear.

```bash
bun test tests/metaOAuth.test.ts
grep -q "muse: 'meta'" src/utils/providerKeys.ts
! grep -q "muse" src/features/quota/providers/index.ts
! grep -q "'muse'" src/features/quota/constants.ts
```

## opencode-zai-panel

**OpenCode key import + Z.AI OAuth cards and both quota adapters**

OAuth page gains the Z.AI browser-flow card (zcode:// paste-back, same UX as
the xAI manual flow) and the OpenCode Go key-import card (validated save via
the backend import endpoint). Quota page, auth-file cards, and timeline lanes
cover both providers.

```bash
grep -q "id: 'zai'" src/pages/OAuthPage.tsx
grep -q "opencode: opencodeQuota" src/features/quota/QuotaPage.tsx
bun test tests/opencodeQuota.test.ts tests/zaiQuota.test.ts
```

## quota-page-map-satisfies

**Quota page provider map is guarded with `satisfies`, not a cast**

The quota page's `quotaByType` map uses `satisfies
Record<QuotaProviderType, …>` instead of a cast: adding a provider to
`QuotaProviderType` without wiring its slice into the map fails type-check
(CI) rather than crashing the route at runtime reading `[file.name]` off
undefined. Upstream still uses `as unknown as` here; the fork's form is the
protected one.

```bash
grep -q "satisfies Record<QuotaProviderType" src/features/quota/QuotaPage.tsx
! grep -q "as unknown as Record<QuotaProviderType" src/features/quota/QuotaPage.tsx
bun run type-check
```
