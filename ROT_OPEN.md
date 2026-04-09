# ROT_OPEN.md
# Aelarian Archives — Active Rot Queue
# Last updated: 2026-04-09

---

## PURPOSE

Active rot items needing resolution. The action queue.

If this file is empty, there is no open rot. If it has entries,
those are the first priority before any new work begins.

**Rule: items are DELETED when fixed.** Deleted means removed from
this file. Not struck through. Not marked closed. Not checked off.
Gone. The permanent record of the rot event lives in ROT_REGISTRY.md.
This file only shrinks.

When rot is found:
  1. Full entry logged in ROT_REGISTRY.md (permanent record)
  2. Short pointer added here (action queue)

When rot is fixed:
  1. Entry deleted from this file
  2. ROT_REGISTRY.md entry stays forever

---

## OPEN ITEMS

TRIA name corruption
  Registry: Entry 005
  Found: session 14 (2026-04-05)
  Cross-tier item #13 in design-session-plan.md
  Description: Variations from the collapsed system renamed the
    "T" in TRIA. Correct name: TRIA = Triadic Relational
    Intelligence Architecture (Page 09, TRI, Lattice group).
    Every occurrence must use the correct expansion.
  Affected: grep -rn "TRIA" DESIGN/ — verify all expansions
