## Task
Audit all files touched by Tier 3 item 3.3 (Compute Trigger — Hybrid)
for completeness, consistency, and undefined issues. Verify the trigger
chain from session close through DNR, MTM, and engine recompute is
traceable end-to-end with no gaps or conflicts.

## Files examined

- DESIGN/Systems/Engine_Computation/ENGINE COMPUTATION SCHEMA.md
  (HYBRID COMPUTE TRIGGER, ENGINE RESULT OBJECT, KNOWN FAILURE MODES)
- DESIGN/Systems/Operational_DB/OPERATIONAL DB SCHEMA.md
  (engine_stale_flags table)
- DESIGN/Systems/Metamorphosis/METAMORPHOSIS SCHEMA.md
  (OWNERSHIP BOUNDARIES, ENGINE OUTPUT READ SPEC, STRUCTURAL RULES)
- DESIGN/Systems/Daily_Nexus_Routine/DAILY NEXUS ROUTINE SCHEMA.md
  (SESSION-CLOSE PIPELINE, STEP: MTM SYNTHESIS)

## Findings — CLEAN

### ENGINE COMPUTATION SCHEMA.md — HYBRID COMPUTE TRIGGER
Three triggers documented correctly: page view, batch window close,
MTM pull. Stale flag mechanics accurate. Batch optimization rationale
present. No conflicts. ✓

### OPERATIONAL DB SCHEMA.md — engine_stale_flags
5 rows, one per engine. Fields: engine (PK), stale (0|1), updated_at.
Default 1 (stale on first load). SET TO 1 / SET TO 0 behavior matches
ENGINE COMPUTATION SCHEMA.md. ✓

### DAILY NEXUS ROUTINE SCHEMA.md — trigger chain
Session close → in-progress guard → routine_session written →
POST /mtm/synthesize → MTM resolves → LNV routing → Void pulse check.
Strict step order, correct. MTM synthesis is step 1 of the pipeline. ✓

### METAMORPHOSIS SCHEMA.md — structural rules
"DNR calls MTM. MTM never calls itself." Correct. "Synthesis cycle
fires when DNR triggers POST /mtm/synthesize at session close only."
Correct. Engine output read: pull not push. Correct. ✓

## Findings — GAPS REQUIRING RESOLUTION

### GAP 1 — METAMORPHOSIS SCHEMA.md: freshness guarantee not documented
SEVERITY: HIGH (builder implementing MTM engine read has no guarantee)

METAMORPHOSIS SCHEMA.md ENGINE OUTPUT READ SPEC says MTM "reads
computed outputs via the Feed step — pull, not push." It does NOT say
that the engine endpoints guarantee freshness: checking stale flag and
recomputing before returning. Without this note, a builder implementing
MTM's engine read call would not know that the engine service
self-refreshes before responding.

The guarantee lives in ENGINE COMPUTATION SCHEMA.md only (trigger 3:
"Stale engines refresh before delivering snapshot to MTM. MTM always
reads fresh data.").

METAMORPHOSIS SCHEMA.md ENGINE OUTPUT READ SPEC needs a note:
engine endpoints self-refresh before returning — freshness is
guaranteed by the engine service, not enforced by MTM.

### GAP 2 — stale_warning field referenced but not defined
SEVERITY: HIGH (build-blocking conflict)

ENGINE COMPUTATION SCHEMA.md KNOWN FAILURE MODE 4 says:
"If recomputation fails, MTM receives the most recent existing snapshot
with a stale_warning flag."

But the ENGINE RESULT OBJECT definition has no stale_warning field.
The FIELD NOTES say "stale: always false in the result object" — stale
is a SQLite flag, not a result field. The result object shape cannot
deliver stale_warning because the field does not exist in the defined
structure.

Conflict: failure mode 4 promises a flag that the result object cannot
carry.

Resolution: add stale_warning: boolean to ENGINE RESULT OBJECT.
Default false. Set true only when a stale snapshot is served due to
failed recomputation. Update FIELD NOTES accordingly. Update failure
mode 4 to reference it precisely.

### GAP 3 — METAMORPHOSIS SCHEMA.md: stale_warning handling undefined
SEVERITY: HIGH (MTM behavior on stale delivery is unspecified)

When an engine returns stale_warning: true, MTM behavior is defined
only in ENGINE COMPUTATION SCHEMA.md ("Synthesis proceeds with the
caveat recorded") — not in METAMORPHOSIS SCHEMA.md. A builder
implementing MTM's engine read step would not know what to do when
stale_warning arrives: log it, abort, surface it in the result object?

METAMORPHOSIS SCHEMA.md ENGINE OUTPUT READ SPEC needs to document:
if any engine returns stale_warning: true, MTM logs the warning,
proceeds with synthesis, and carries stale_warning into the MTM result
object so DNR can surface the caveat. Synthesis is not blocked by a
stale warning — only by a read failure.

## Gap Resolutions (applied same session)

GAP 1 — freshness guarantee: RESOLVED
  METAMORPHOSIS SCHEMA.md ENGINE OUTPUT READ SPEC: added "Freshness
  guarantee" note. Engine endpoints self-refresh before returning. MTM
  does not manage or check stale flag — engine service owns it entirely.

GAP 2 — stale_warning field missing: RESOLVED
  ENGINE COMPUTATION SCHEMA.md ENGINE RESULT OBJECT: stale_warning:
  boolean added to result object shape. FIELD NOTES updated to explain
  it. Failure mode 4 updated to reference stale_warning: true precisely
  instead of vague "stale_warning flag."

GAP 3 — MTM stale_warning handling undefined: RESOLVED
  METAMORPHOSIS SCHEMA.md ENGINE OUTPUT READ SPEC: added "stale_warning
  handling" section. Behavior: log warning, proceed with synthesis,
  not a failure. Distinction between stale_warning (caveat) and read
  failure (aborts synthesis) now explicit.

## Conclusion

3.3 COMPLETE. Trigger chain fully documented and consistent across all
four files. MTM ↔ engine service boundary is now unambiguous for build.
