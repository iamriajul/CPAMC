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

## muse-oauth-panel

**Muse OAuth login card (muse-spark subscriptions)**

OAuth page exposes the backend `muse-auth-url` device flow completely from
the UI: Muse provider card, icon, `muse-code` aliases, auth-file
type/presets/icons, and `muse_oauth_*` / `filter_muse` strings in
en/zh-CN/zh-TW/ru. Upstream issue
`router-for-me/CLIProxyAPI#5777`; drop this commit when upstream ships it.

```bash
bun test tests/museOAuth.test.ts
grep -q "id: 'muse'" src/pages/OAuthPage.tsx
grep -q "muse_oauth_title" src/i18n/locales/en.json
```
