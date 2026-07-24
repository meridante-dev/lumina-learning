#!/bin/bash
# ---------------------------------------------------------------------------
# sync-core.sh — sync the Lumina core into a brand repo WITHOUT clobbering
# that deployment's own divergences.
#
#   ./scripts/sync-core.sh ../belong-academy
#
# Why this exists: core/ is copied per brand repo, and we hand-synced 5+ times.
# One near-miss is already on record: a plain `cp core/firestore.rules` would
# have replaced Belong's isSuper() admin allowlist with EdenRise's emails —
# silently locking Belong's real admin out and granting access to accounts that
# don't exist in that project. A comment saying "do not overwrite" is not a
# guarantee; this script is.
#
# What it does:
#   SYNCS   core/app.js core/auth.js core/brandkit.js core/styles.css
#           core/ots.js core/ots.test.js verify.html privacy.html
#   RULES   copies core/firestore.rules but PRESERVES the target's isSuper()
#           email allowlist (extracted before, re-inserted after)
#   CHECKS  data.js — warns on divergence, never auto-copies (i18n additions
#           are applied per-brand deliberately)
#   NEVER   touches index.html, sw.js, brands/, CNAME (per-deploy by design)
#
# After running: bump ?v= + sw VERSION in the TARGET repo, commit, push.
# ---------------------------------------------------------------------------
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)"
TGT="${1:?usage: sync-core.sh <path-to-brand-repo>}"
TGT="$(cd "$TGT" && pwd)"
[ -d "$TGT/core" ] || { echo "✗ $TGT does not look like a brand repo (no core/)"; exit 1; }
[ "$TGT" = "$SRC" ] && { echo "✗ target is the source repo"; exit 1; }

echo "core sync: $SRC → $TGT"

# 1 · plain syncs
for f in core/app.js core/auth.js core/brandkit.js core/styles.css core/ots.js core/ots.test.js verify.html privacy.html; do
  cp "$SRC/$f" "$TGT/$f"
  echo "  ✓ $f"
done

# 2 · rules: copy, then re-insert the TARGET's isSuper allowlist
python3 - "$SRC" "$TGT" <<'PY'
import re, sys
src_dir, tgt_dir = sys.argv[1], sys.argv[2]
rules_rx = re.compile(r"(function isSuper\(\)[\s\S]*?email in \[)([\s\S]*?)(\])")
tgt_path = tgt_dir + "/core/firestore.rules"
src_rules = open(src_dir + "/core/firestore.rules").read()
tgt_rules = open(tgt_path).read()
tgt_m = rules_rx.search(tgt_rules)
src_m = rules_rx.search(src_rules)
if not (tgt_m and src_m):
    print("  ✗ could not locate isSuper() allowlist in one of the rules files — rules NOT synced"); sys.exit(1)
preserved = tgt_m.group(2)
merged = src_rules[:src_m.start(2)] + preserved + src_rules[src_m.end(2):]
open(tgt_path, "w").write(merged)
emails = ", ".join(e.strip().strip("'\"") for e in preserved.split(",") if e.strip())
print(f"  ✓ core/firestore.rules (preserved this deployment's admins: {emails})")
PY

# 3 · data.js divergence check (warn only)
if ! diff -q "$SRC/data.js" "$TGT/data.js" >/dev/null 2>&1; then
  echo "  ⚠ data.js differs between repos — review manually (i18n keys are patched per-brand):"
  diff "$SRC/data.js" "$TGT/data.js" | head -6 || true
else
  echo "  ✓ data.js identical"
fi

# 4 · syntax gate — a broken sync must fail here, not in production
for f in core/app.js core/auth.js core/ots.js; do node --check "$TGT/$f"; done
echo "  ✓ syntax OK in target"

echo
echo "Next (in $TGT): bump ?v= in index.html + VERSION in sw.js TOGETHER, commit, push,"
echo "then curl the live site for the new marker (DEPLOY.md protocol)."
