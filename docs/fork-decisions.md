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

## modelsdev-provider-picker

**Custom-provider models carry a models.dev provider pin**

A model name is frequently published by many providers with different context
windows and reasoning ladders, so a custom OpenAI-compatible provider needs to
say which models.dev entry describes its endpoint. `models-dev-provider` is
carried on the model alias through the read normalizer, the write allow-list
and the form, so the backend applies the right catalog entry and the operator
can see and change which one is in force. The field is OpenAI-compatible-only
and rides the same flag as `image`, so other brands never emit it.

The picker ranks the provider matching the configured base URL first, because
that is almost always the right one, but keeps the full list available so a
proxied endpoint can still select its upstream. The control adapts to what the
catalog can answer: one provider is applied automatically, several require a
choice, and none is reported quietly rather than as an error, because the
backend then advertises nothing and the operator has nothing to fix. A failed
lookup behaves the same way, so a transient management-API error never blocks
saving a provider.

Uniqueness is derived from the filtered provider list rather than trusted from
the response, so a dropped malformed entry cannot leave the UI claiming no
choice is needed while several valid providers remain. The module follows the
transport-seam convention of `modelsCatalog.ts`, so it is testable without a
DOM harness.

```bash
grep -q "models-dev-provider" src/services/api/transformers.ts
grep -q "models-dev-provider" src/services/api/providers.ts
grep -q "ModelsDevProviderPicker" src/features/providers/sheets/forms/ModelEntriesEditor.tsx
grep -q "modelsDevProvidersApi" src/features/providers/sheets/forms/ModelsDevProviderPicker.tsx
bun test tests/modelsDevProviderPin.test.ts
```
