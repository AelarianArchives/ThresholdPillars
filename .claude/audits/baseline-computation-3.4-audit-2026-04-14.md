## Task
Audit all files touched by Tier 3 item 3.4 (Baseline Computation) for
completeness, consistency, and undefined issues. Verify the marginal
probability product formula, signal classification, null observation
flow, and pattern reliability flags are consistent across all five
engine schemas, the shared computation spec, and MTM.

## Files examined

- DESIGN/Systems/Engine_Computation/ENGINE COMPUTATION SCHEMA.md
  (BASELINE COMPUTATION, SIGNAL CLASSIFICATION, ENGINE RESULT OBJECT,
  FIELD NOTES, PATTERN RELIABILITY CONSTANTS)
- DESIGN/Systems/Engine_Computation/SYSTEM_ Engine Computation.md
  (WHAT THIS SYSTEM OWNS)
- DESIGN/Systems/Threshold_Engine/THRESHOLD ENGINE SCHEMA.md
  (COMPUTATION, RESULT OBJECT, co-occurrence and sequence JSON shapes)
- DESIGN/Systems/Echo_Recall_Engine/ECHO RECALL ENGINE SCHEMA.md
  (COMPUTATION, co-occurrence and sequence JSON shapes)
- DESIGN/Systems/Infinite_Intricacy_Engine/INFINITE INTRICACY ENGINE SCHEMA.md
  (COMPUTATION, intersection JSON shape)
- DESIGN/Systems/StarRoot_Engine/STARROOT ENGINE SCHEMA.md
  (COMPUTATION, co-occurrence and metadata correlation JSON shapes)
- DESIGN/Systems/Sat_Nam_Engine/SAT NAM ENGINE SCHEMA.md
  (co-occurrence and prompt pattern JSON shapes; no inline definition)
- DESIGN/Systems/Metamorphosis/METAMORPHOSIS SCHEMA.md
  (ENGINE OUTPUT READ SPEC)

## Findings — CLEAN

### ENGINE COMPUTATION SCHEMA.md — baseline formula
Marginal probability product correctly defined. observed_rate / expected_rate.
Three-band classification (suppressed < 1.0, mild 1.0–2.0, strong > 2.0) is
consistent across all engine schemas and referenced uniformly. ✓

### ENGINE COMPUTATION SCHEMA.md — null observation flow
Two-counter system (times_observed, times_examined) is defined and consistent
with individual engine schemas referencing null_contribution fields. ✓

### Deposit weight constants
HIGH: 2.0, STANDARD: 1.0, LOW: 0.5. Consistent across all engine schemas
and weight_breakdown JSON shapes. ✓

## Findings — GAPS REQUIRING RESOLUTION

### GAP 1 — No flag for low-sample patterns
SEVERITY: HIGH (computation correctness issue — thin patterns indistinguishable
from well-evidenced ones in result objects)

Engine computation produces ratio values for patterns with very few deposits.
Small-N patterns can produce misleadingly strong ratios. Without a flag,
downstream consumers (MTM, visualizations) cannot distinguish a ratio of 2.8
based on 3 deposits from one based on 300.

No constant defined. No field in the engine result object. No engine schema
acknowledges the problem.

Resolution: define MIN_PATTERN_DEPOSIT_COUNT as calibration constant in
ENGINE COMPUTATION SCHEMA.md. Add low_sample: boolean to ENGINE RESULT OBJECT
pattern structure. Add low_sample to all engine JSON shapes. Add low_sample
handling note to METAMORPHOSIS SCHEMA.md.

### GAP 2 — insufficient_data trigger too narrow (zero-only)
SEVERITY: HIGH (near-zero frequency elements produce unreliable ratios but
are not flagged)

All five engine schemas define:
  insufficient_data: true if expected_rate = 0

This only covers the absolute zero case (element never observed). Elements
appearing once or twice in the entire corpus can produce severely unstable
marginal rates, making the expected_rate a division by a very small number —
leading to inflated ratios that look like strong signal but are not reliable.

Near-zero frequency elements are as dangerous to the baseline computation as
zero-frequency elements. Covering only zero leaves a gap.

Resolution: define MIN_ELEMENT_COUNT as calibration constant. Extend
insufficient_data trigger in all engine schemas to include below MIN_ELEMENT_COUNT.
Update division-by-zero guard language in ENGINE COMPUTATION SCHEMA.md to match.

### GAP 3 — low_sample not documented in MTM behavior
SEVERITY: MEDIUM (builder implementing MTM engine read has no defined behavior
for low_sample: true patterns)

ENGINE COMPUTATION SCHEMA.md defines low_sample: boolean in the pattern result.
But METAMORPHOSIS SCHEMA.md ENGINE OUTPUT READ SPEC says nothing about what
MTM does when a pattern arrives with low_sample: true. Without this, a builder
implementing MTM synthesis would need to guess whether low_sample patterns are
filtered, de-weighted, or passed through unchanged.

Resolution: add low_sample handling note to METAMORPHOSIS SCHEMA.md ENGINE
OUTPUT READ SPEC. Behavior: pass through unchanged, flag propagates to
Findings output.

## Gap Resolutions (applied same session)

GAP 1 — low_sample flag missing: RESOLVED
  ENGINE COMPUTATION SCHEMA.md: added PATTERN RELIABILITY CONSTANTS section
  defining MIN_PATTERN_DEPOSIT_COUNT (calibration item, PLANNED). Added
  low_sample: boolean to ENGINE RESULT OBJECT pattern structure. Added FIELD
  NOTES entry for low_sample. Updated SIGNAL CLASSIFICATION to reference both
  constants. Updated SYSTEM_ Engine Computation.md OWNS list.
  All five engine JSON shapes updated with "low_sample": boolean after
  "insufficient_data": boolean (THR co-occurrence, THR sequence, ECR
  co-occurrence, ECR sequence, INF intersection, STR co-occurrence, STR
  metadata correlation, SNM co-occurrence, SNM prompt pattern).

GAP 2 — insufficient_data trigger extended: RESOLVED
  ENGINE COMPUTATION SCHEMA.md: updated BASELINE COMPUTATION guard and SIGNAL
  CLASSIFICATION to reference MIN_ELEMENT_COUNT. Added MIN_ELEMENT_COUNT to
  PATTERN RELIABILITY CONSTANTS.
  THR SCHEMA.md: both co-occurrence and sequence insufficient_data definitions
  updated to include MIN_ELEMENT_COUNT.
  ECR SCHEMA.md: co-occurrence insufficient_data definition updated.
  INF SCHEMA.md: intersection insufficient_data definition updated.
  STR SCHEMA.md: co-occurrence insufficient_data definition updated.
  SNM SCHEMA.md: no inline definition (inherits from shared spec) — no update
  needed for definition, only JSON shapes.

GAP 3 — MTM low_sample handling undefined: RESOLVED
  METAMORPHOSIS SCHEMA.md ENGINE OUTPUT READ SPEC: added "low_sample handling"
  section. Behavior: include in synthesis as-is, flag propagates to Findings
  output, downstream consumers use it to distinguish thin-sample patterns.

## Conclusion

3.4 COMPLETE. Baseline computation fully defined and consistent across all
eight files. Both calibration constants (MIN_PATTERN_DEPOSIT_COUNT,
MIN_ELEMENT_COUNT) are marked PLANNED — values to be set at build time, not
during design. Signal classification, null flow, and pattern reliability
flags are unambiguous for build.
