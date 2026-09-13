# Syncing official management-center

This fork keeps a rebase queue shape: `main` is an upstream release tag plus
one commit per fork change, with no merge commits. Branch protection enforces
it mechanically — direct pushes and merge commits are rejected, so every
change lands as one squash-merged PR rebased onto the current base.

Track **stable release tags** (`v*`). `upstream/main` may move past the latest
tag with unfinished work; never base fork work on an untagged tip.

Every behaviour the fork changes inside an official file has a section in
[fork-decisions.md](fork-decisions.md) holding its policy and the command that
proves it. The commits carry the code; that file carries the why.

## Pick the target

```bash
git fetch upstream --tags
git tag --list 'v*' --sort=-v:refname | head -5
```

Take the newest tag that is an ancestor of `upstream/main` and newer than your
base. Upstream releases are linear — each contains the previous. The listing
sorts by version, not ancestry, so confirm before basing work on it:

```bash
git merge-base --is-ancestor <tag> upstream/main && echo ANCESTOR || echo NOT-ANCESTOR
```

## Rebase

```bash
git status --porcelain                                   # must be empty
git branch backup/pre-sync-$(git rev-parse --short HEAD)
git push origin backup/pre-sync-$(git rev-parse --short HEAD)
```

Push the backup. A branch that exists only on your machine is not a backup.
Delete it after the queue lands so stale backups do not pile up:

```bash
git push origin --delete backup/pre-sync-<sha>
```

Then, for each fork commit from oldest to newest, open (or reuse) a feature
branch rebased onto the new tag and land it via squash-merge once the
reported checks are green — `verify`, `review`, `pullfrog` and
`pullfrog-approval`. Never merge upstream `main`
into the fork, and never merge with a merge commit.

## Verify, then land (via PR)

```bash
bash scripts/fork-verify.sh
bun run verify
```

Land through a PR as usual; branch protection requires checks to be green
before squash-merge.

## Releases from the queue

Tag the queue tip on `main` (never a feature branch), then push the tag:

```bash
git tag vA.B.C-muse.N && git push origin vA.B.C-muse.N
```

`vA.B.C` stays just above the upstream tag the queue sits on; `-muse.N`
marks fork revisions. The `v*` tag build publishes `management.html` to the
fork's GitHub Release; the proxy picks it up via `panel-github-repository`.
Version bumps live in the tag — never land version churn on a feature PR.

## What not to do

- Merge upstream `main` into the fork, or merge with a merge commit.
- Treat "the symbol still exists" as preserved. After a sync, run the verify
  script — do not eyeball it.
- Take `theirs` wholesale to make a conflict go away. Re-read the decision
  section and preserve the policy, not the line numbers.
