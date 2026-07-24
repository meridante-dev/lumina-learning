#!/usr/bin/env python3
"""ops-report.py — the Monday 5-minute north-star review.

Pulls per-instance counts from each client Firebase project: users, server-side
evidence (events / anchors / proofs), manager confirmations, leaderboard rows.
Read-only, metadata-only (documents are fetched by __name__ mask — no personal
content leaves Firestore).

Auth: reuses the Firebase CLI's token (run `firebase login --reauth` if it
expired — tokens last ~1 h). Usage:

    python3 scripts/ops-report.py                 # all known instances
    python3 scripts/ops-report.py belong-academy  # one project
"""
import json, sys, os, urllib.request

PROJECTS = ["edenrise-academy", "belong-academy"]   # add each new client here

def token():
    p = os.path.expanduser("~/.config/configstore/firebase-tools.json")
    try:
        return json.load(open(p))["tokens"]["access_token"]
    except Exception:
        sys.exit("No CLI token — run: firebase login --reauth")

def api(url, tok, method="GET", body=None):
    r = urllib.request.Request(url, method=method,
        data=json.dumps(body).encode() if body else None,
        headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(r))

def count(base, tok, path):
    try:
        docs = api(f"{base}/{path}?pageSize=300&mask.fieldPaths=__name__", tok).get("documents", [])
        return len(docs)
    except Exception:
        return "-"

def report(project, tok):
    base = f"https://firestore.googleapis.com/v1/projects/{project}/databases/(default)/documents"
    try:
        users = api(f"{base}/users?pageSize=300&mask.fieldPaths=__name__", tok).get("documents", [])
    except urllib.error.HTTPError as e:
        print(f"  {project}: unreachable ({e.code}) — token expired or no access")
        return
    ev = an = pr = 0
    for d in users:
        uid = d["name"].split("/")[-1]
        cols = api(f"{base}/users/{uid}:listCollectionIds", tok, "POST", {"pageSize": 20}).get("collectionIds", [])
        if "events" in cols:  ev += count(base, tok, f"users/{uid}/events")
        if "anchors" in cols: an += count(base, tok, f"users/{uid}/anchors")
        if "proofs" in cols:  pr += count(base, tok, f"users/{uid}/proofs")
    conf = count(base, tok, "confirmations")
    board = count(base, tok, "leaderboard")
    print(f"  {project}")
    print(f"    users: {len(users)}   leaderboard: {board}")
    print(f"    EVIDENCE  events: {ev}   anchors: {an}   btc-proofs: {pr}   mgr-confirmations: {conf}")
    if len(users) and ev == 0:
        print("    ⚠ users exist but ZERO server-side evidence — nobody is completing modules. The north star is red.")

if __name__ == "__main__":
    targets = sys.argv[1:] or PROJECTS
    tok = token()
    print("Lumina ops report — weekly north-star review")
    for p in targets:
        report(p, tok)
