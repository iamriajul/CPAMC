#!/usr/bin/env bash
# fork-verify.sh — run every proof command in docs/fork-decisions.md.
#
# Each `## <id>` section must contain at least one ```bash block; every block
# is executed with `bash -e`. A decision with no command, a command that names
# a tests/*.test.ts file that does not exist, or any failing command fails the
# run and names the decision. CI job `fork-decisions` runs this script; run it
# locally after every rebase onto a new upstream tag.
set -euo pipefail

DECISIONS_FILE="${1:-docs/fork-decisions.md}"
if [[ ! -f "$DECISIONS_FILE" ]]; then
  echo "fork-verify: decisions file not found: $DECISIONS_FILE" >&2
  exit 1
fi

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

# Split the decisions file into one file per ## section.
awk -v dir="$tmpdir" '
  /^## / {
    id = $2
    gsub(/[^a-zA-Z0-9_.-]/, "", id)
    file = dir "/" id ".md"
    print "" > file
    current = file
    next
  }
  current != "" { print > current }
' "$DECISIONS_FILE"

failures=0
checked=0
shopt -s nullglob
for section in "$tmpdir"/*.md; do
  id="$(basename "$section" .md)"
  # Extract ```bash blocks (strip the fences).
  awk '/^```bash$/ { inblock=1; next } /^```$/ { inblock=0; next } inblock { print }' "$section" > "$section.sh"
  if [[ ! -s "$section.sh" ]]; then
    echo "fork-verify: decision '$id' has no proof command" >&2
    failures=$((failures + 1))
    continue
  fi
  # bun test treats a name it cannot find as a filter, so a deleted test file
  # beside a live one still exits 0. A proof must name only files that exist.
  missing_tests=()
  while IFS= read -r path; do
    [[ -f "$path" ]] || missing_tests+=("$path")
  done < <({ grep -oE 'tests/[A-Za-z0-9_./-]+\.test\.tsx?' "$section.sh" || true; } | sort -u)
  if [[ ${#missing_tests[@]} -gt 0 ]]; then
    echo "fork-verify: decision '$id' names missing test file(s): ${missing_tests[*]}" >&2
    failures=$((failures + 1))
    continue
  fi
  checked=$((checked + 1))
  echo "fork-verify: [$id]"
  if ! bash -e "$section.sh"; then
    echo "fork-verify: decision '$id' FAILED" >&2
    failures=$((failures + 1))
  fi
done

if [[ "$checked" -eq 0 ]]; then
  echo "fork-verify: no decisions found in $DECISIONS_FILE" >&2
  exit 1
fi
if [[ "$failures" -gt 0 ]]; then
  echo "fork-verify: $failures decision(s) failed out of $checked checked" >&2
  exit 1
fi
echo "fork-verify: all $checked decision(s) green"
