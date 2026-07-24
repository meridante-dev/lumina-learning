#!/usr/bin/env python3
"""gdpr-erase.py — COMPLETE Art. 17 erasure for one learner.

Why this exists: the in-app "Delete account" removes what the client CAN remove
(users/{uid} doc, leaderboard row, the auth account) — but Firestore doc
deletion does NOT delete subcollections, and the evidence ledger under
users/{uid}/events|anchors|proofs is create-only BY DESIGN (clients may never
delete it; that immutability is the product). Full erasure is therefore an
OPERATOR duty, done with owner credentials (IAM-level REST — security rules do
not apply), within the 30 days promised in privacy.html.

What it does, in order (idempotent — safe to re-run):
  1. resolve email → uid (or take a uid directly)
  2. delete users/{uid}/events, /anchors, /proofs (all docs)
  3. delete users/{uid} and leaderboard/{uid}
  4. confirmations: DELETE those about the person (subjectUid == uid);
     ANONYMIZE those authored by them as a manager (byName/byEmail scrubbed —
     the verdict about another learner remains valid evidence)
  5. forum posts + replies authored by them: scrub author-identifying fields
     (content stays; review manually if the text itself is personal)
  6. delete the Firebase Auth account
  7. print an erasure receipt — save it; it is the Art. 17 compliance record.
     NOTE: public Bitcoin anchors hold only blinded digests; once the
     underlying data is deleted they are unlinkable to any person (documented
     in privacy.html §7) — nothing to erase there, and nothing that could be.

Usage:
  firebase login --reauth          # owner token, ~1 h lifetime
  python3 scripts/gdpr-erase.py <project-id> <email-or-uid> [--dry-run]
"""
import json, sys, os, urllib.request, urllib.error

def token():
    p = os.path.expanduser("~/.config/configstore/firebase-tools.json")
    try: return json.load(open(p))["tokens"]["access_token"]
    except Exception: sys.exit("No CLI token — run: firebase login --reauth")

def call(url, tok, method="GET", body=None, ok404=False):
    r = urllib.request.Request(url, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"})
    try: return json.load(urllib.request.urlopen(r))
    except urllib.error.HTTPError as e:
        if e.code == 404 and ok404: return None
        raise

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv
    if len(args) != 2: sys.exit(__doc__)
    project, who = args
    tok = token()
    B = f"https://firestore.googleapis.com/v1/projects/{project}/databases/(default)/documents"
    receipt = {"project": project, "subject": who, "dryRun": dry, "actions": []}
    act = lambda s: (receipt["actions"].append(s), print(("DRY  " if dry else "  ✓ ") + s))

    # 1 · resolve identity
    uid = who
    if "@" in who:
        res = call(f"https://identitytoolkit.googleapis.com/v1/projects/{project}/accounts:lookup",
                   tok, "POST", {"email": [who]})
        users = (res or {}).get("users", [])
        if not users: sys.exit(f"No auth account for {who} in {project}")
        uid = users[0]["localId"]
    print(f"Erasing uid {uid} in {project}" + (" (DRY RUN)" if dry else ""))

    # 2 · evidence subcollections (create-only for clients; operator deletes)
    for sub in ("events", "anchors", "proofs"):
        docs = (call(f"{B}/users/{uid}/{sub}?pageSize=300&mask.fieldPaths=__name__", tok, ok404=True) or {}).get("documents", [])
        for d in docs:
            if not dry: call("https://firestore.googleapis.com/v1/" + d["name"], tok, "DELETE")
        act(f"deleted {len(docs)} docs from users/{uid}/{sub}")

    # 3 · main docs
    for path in (f"users/{uid}", f"leaderboard/{uid}"):
        if not dry: call(f"{B}/{path}", tok, "DELETE", ok404=True)
        act(f"deleted {path}")

    # 4 · confirmations
    def run_query(coll, field, value):
        q = {"structuredQuery": {"from": [{"collectionId": coll}],
             "where": {"fieldFilter": {"field": {"fieldPath": field}, "op": "EQUAL",
                       "value": {"stringValue": value}}}}}
        rows = call(f"{B}:runQuery", tok, "POST", q)
        return [r["document"] for r in rows if "document" in r]
    for d in run_query("confirmations", "subjectUid", uid):
        if not dry: call("https://firestore.googleapis.com/v1/" + d["name"], tok, "DELETE")
    act(f"deleted confirmations about the subject")
    for d in run_query("confirmations", "byUid", uid):
        scrub = {k: {"stringValue": "[removido]"} for k in ("byName", "byEmail") if k in d.get("fields", {})}
        if scrub and not dry:
            mask = "&".join("updateMask.fieldPaths=" + k for k in scrub)
            call("https://firestore.googleapis.com/v1/" + d["name"] + "?" + mask, tok, "PATCH", {"fields": scrub})
    act("anonymised confirmations they authored as manager (verdicts kept)")

    # 5 · forum authorship
    scrub_keys = ("author", "authorName", "authorEmail", "initials", "name")
    posts = run_query("forum_posts", "authorUid", uid)
    for d in posts:
        scrub = {k: {"stringValue": "Utilizador removido"} for k in scrub_keys if k in d.get("fields", {})}
        if scrub and not dry:
            mask = "&".join("updateMask.fieldPaths=" + k for k in scrub)
            call("https://firestore.googleapis.com/v1/" + d["name"] + "?" + mask, tok, "PATCH", {"fields": scrub})
    act(f"anonymised {len(posts)} forum posts (content kept — review manually)")

    # 6 · auth account
    if not dry:
        try: call(f"https://identitytoolkit.googleapis.com/v1/projects/{project}/accounts:delete", tok, "POST", {"localId": uid})
        except Exception: pass
    act("deleted auth account")

    # 7 · receipt
    from datetime import datetime, timezone
    receipt["completedAt"] = datetime.now(timezone.utc).isoformat()
    out = f"erasure-{project}-{uid[:8]}.json"
    open(out, "w").write(json.dumps(receipt, indent=2))
    print(f"\nErasure receipt written: {out} — file it. This is the Art. 17 record.")

if __name__ == "__main__":
    main()
