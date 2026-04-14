## Task
Audit all files touched by Tier 3 item 3.2 (Deposit Weight Mechanics)
for completeness, consistency, and undefined issues. Verify the
tagWeight gap identified during 3.1/3.2 was fully closed, and that
the data flow from deposit_weight → Resonance Engine node activity is
traceable end-to-end.

## Files examined

- DESIGN/Systems/Engine_Computation/ENGINE COMPUTATION SCHEMA.md
  (DEPOSIT WEIGHT CONSTANTS + BEHAVIOR BY TIER section)
- DESIGN/Systems/Resonance_Engine/RESONANCE ENGINE PHYSICS SPEC.md
  (WEIGHT SYSTEM — FORMULAS, TAGGER SYNC SEQUENCE)
- DESIGN/Systems/Resonance_Engine/SYSTEM_ Resonance Engine.md
  (WEIGHT SYSTEM section)
- DESIGN/Systems/Tagger/TAGGER SCHEMA.md
  (CLAUDE API RESPONSE, TAGGER STORE, CONSUMERS table)
- DESIGN/Systems/Tagger/SYSTEM_ Tagger.md
  (CONSUMERS table, files list)
- DESIGN/Systems/Integration/INTEGRATION DB SCHEMA.md
  (deposit_weight field on deposits table)
- .claude/plans/design-build-spec.md (section 3.2)

## Findings — CLEAN

### ENGINE COMPUTATION SCHEMA.md
BEHAVIOR BY TIER now covers all four tiers that consume deposit_weight:
Axis (Tier 3), Nexus (Tier 4), Cosmology (Tier 5), Resonance Engine
(Tier 6). Two-layer weight system described accurately. No conflicts.
DEPOSIT_WEIGHT_HIGH = 2.0, DEPOSIT_WEIGHT_STANDARD = 1.0,
DEPOSIT_WEIGHT_LOW = 0.5 all present and unambiguous. ✓

### RESONANCE ENGINE PHYSICS SPEC.md
tagWeight now defined in the activity score formula. Source confirmed
as deposit_weight multiplier. Tagger sync payload weight field
annotated. baseWeight vs. tagWeight distinction clear. ✓

### SYSTEM_ Resonance Engine.md
WEIGHT SYSTEM section updated. tagWeight source and baseWeight
ownership documented. No conflict with physics spec. ✓

### INTEGRATION DB SCHEMA.md
deposit_weight field on deposits table: enum (high | standard | low).
Present, correctly typed. ✓

### design-build-spec.md section 3.2
DEPOSIT_WEIGHT constants, tier-by-tier behavior, Resonance Engine
two-layer system, spec authority — all accurate. ✓

## Findings — GAPS REQUIRING RESOLUTION

### GAP 1 — TAGGER SYNC PAYLOAD: WEIGHT CONVERSION UNDOCUMENTED
SEVERITY: HIGH (blocks build — the conversion must be coded somewhere)

The TaggerResponse (what the tagger store holds) has:
  deposit_weight: "high" | "standard" | "low"   — string, deposit-level

The Resonance Engine sync payload expects:
  tags: [{ ..., weight: 2.0 | 1.0 | 0.5 }]     — float, per-tag

The conversion from TaggerResponse.deposit_weight (string, one field
for the whole deposit) to per-tag weight (float, repeated on every tag)
is not documented anywhere. No file specifies:
  - Which component does the conversion
  - When the conversion happens (at store read? at sync?)
  - That all tags on a deposit carry the same value (implied but not
    stated in the tagger output path)

TAGGER SCHEMA.md's consumers table says Resonance Engine reads "Tag
routing payload" — but "Tag routing payload" is never defined as a
derived shape from TaggerResponse. It is referenced but not specified.

### GAP 2 — TAGGER SYNC PAYLOAD: originId SOURCE UNDEFINED
SEVERITY: HIGH (blocks build — the value has no defined source)

The Resonance Engine sync payload requires:
  originId: 'o01' | 'o02' | 'o03' | null

The TaggerResponse does not contain this field. The tagger produces
tags, phase_state, elarianAnchor, doc_type, deposit_weight. None of
these map to originId.

Origin nodes (o01 Larimar / o02 Verith / o03 Cael'Thera) receive
weight updates when a deposit carries "matching origin affinity" — but
how that affinity is determined is not documented. Candidates:
  a) Inferred from deposit authored_by / agent identity
  b) Explicit origin tag in the tag vocabulary (not present)
  c) A separate field on the deposit record (not present)
  d) Not yet designed — open decision

### GAP 3 — TAGGER SYNC PAYLOAD: timestamp SOURCE NOT SPECIFIED
SEVERITY: MEDIUM (likely obvious at build time, but should be explicit)

The Resonance Engine sync payload has:
  timestamp: ISO string

This is not in the TaggerResponse. Most likely source is the deposit's
created_at timestamp from createEntry() confirmation. Not stated.

### NOTE — confidence field handling
TaggerResponse per-tag includes confidence: 0.0-1.0. The Resonance
sync payload does not carry it. Drop is intentional (Resonance Engine
doesn't use per-tag confidence). Not a gap — just noted for clarity.

## Gap Resolutions (applied same session)

GAP 1 — weight conversion: RESOLVED
  TAGGER SCHEMA.md: TAG ROUTING PAYLOAD section added after consumers
  table. Defines the full transformation from TaggerResponse to the
  Resonance Engine payload shape, including "high"→2.0 / "standard"→1.0
  / "low"→0.5 conversion and confirmation that all tags on a deposit
  carry the same value.

GAP 2 — originId source: RESOLVED
  Confirmed by Sage: originId = authored_by (agent identity).
  Mapping: Larimar→o01, Verith→o02, Cael'Thera→o03, Sage/other→null.
  Added to TAGGER SCHEMA.md (TAG ROUTING PAYLOAD) and to
  RESONANCE ENGINE PHYSICS SPEC.md (payload field annotations).

GAP 3 — timestamp source: RESOLVED
  timestamp = deposit's created_at from createEntry() confirmation.
  Added to TAGGER SCHEMA.md (TAG ROUTING PAYLOAD) and to
  RESONANCE ENGINE PHYSICS SPEC.md (payload field annotations).

Additional note documented: confidence field from TaggerResponse is
intentionally dropped in the routing payload — Resonance Engine does
not use per-tag confidence.

## Conclusion

3.2 COMPLETE. All seven files clean. Data flow from deposit_weight
through tagger store to Resonance Engine node activity is fully
traceable end-to-end with no undefined values.
