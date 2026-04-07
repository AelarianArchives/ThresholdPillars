# PATTERN CONVERGENCE SCHEMA

## PCV · V1

## /DESIGN/Systems/Pattern_Convergence/PATTERN CONVERGENCE SCHEMA.md

OWNERSHIP BOUNDARIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OWNS
patterns PostgreSQL table — record creation and status transitions
hypothesis_id assignment — the structural thread connecting PCV to DTX and SGR
Cross-domain signal aggregation — observing and logging patterns as structurally testable hypotheses
MTM Finding integration — receiving MTM Findings as pre-processed input, tracking mtm_provenance on pattern records
Pattern status management — active/archived transitions
hypothesis_ref production — the hypothesis_id that DTX classifies against and SGR grades

DOES NOT OWN
Drift event classification — owned by DTX (DTX receives hypothesis_id from PCV and classifies against it)
Signal grading — owned by SGR
MTM synthesis — owned by MTM (MTM produces Findings; PCV receives them as pre-processed input)
PostgreSQL reads outside patterns table — owned by FastAPI service layer (backend/services/)
Routing authority — owned by SOT
Outcome determination — owned by SGR. PCV does not confirm outcomes.
Bayesian inference — owned by SGR

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURAL RULES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Every aggregated pattern carries four required metadata fields: domain_of_origin · timestamp and interval · coupling_vector · hypothesis_id. All four required. A pattern record missing any field is incomplete and does not feed DTX or SGR.

2. MTM Findings arrive as pre-processed input — not raw deposit. They are not equivalent to unprocessed cross-domain signal. mtm_provenance flag distinguishes them. Their source lens page chain remains intact and traceable on the record.

3. PCV does not assign significance. PCV does not assign predictive weight. PCV does not confirm outcomes. Patterns are observed and logged as structurally testable hypotheses. Nothing more.

4. PCV must not pre-bias DTX or SGR. A pattern record that contains significance language, outcome language, or predictive weight is a structural violation.

5. Domain distinctions remain intact throughout. The system view never flattens what the source pages kept distinct. Every pattern is traceable to its originating signals via source_signals[].

6. When X shifts in one domain and Y reliably follows in another: name the interval, name the vector, log the relationship as a hypothesis. The interval and coupling vector are required fields, not optional annotations.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ HYPOTHESIS ID FORMAT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Format — H · [YYYY-MM] · [SEQ] SEQ: query patterns for highest existing SEQ at same YYYY-MM. Increment by 1. Start at 1 if none exist.
Example — H · 2026-03 · 001
Scope — Unique system-wide. This ID is the structural thread connecting the pattern record in PCV to its drift event in DTX and its signal grade in SGR. It must remain stable and unmodified after assignment.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ STORE: patterns ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
id — auto
hypothesis_id — H · [YYYY-MM] · [SEQ] Assigned at record creation. Never changes after assignment. Structural thread to DTX and SGR.
domain_of_origin — array of page codes All source domains contributing to this pattern. Minimum one. Populated from source_signals[].
timestamp — timestamp Session date at which the pattern was first observed. Written once at record creation. Never updated.
interval — string Named interval between correlated domain shifts. Required when the pattern describes cross-domain movement (X shifts → Y follows). Null only for single-domain observations with no temporal coupling component.
coupling_vector — string Named description of the directional relationship between correlated signals. Required. Not a free-text annotation — a named structural vector with direction and domain endpoints.
source_signals — array of objects Traceable links to the specific signals this pattern emerged from. Element structure: { page_code, signal_ref, note } page_code: originating page. signal_ref: specific entry or deposit id that carried the signal. note: what this source contributed to the pattern observation. Minimum one entry. A pattern with no source_signals is not a valid pattern record.
mtm_provenance — boolean True if this pattern record was generated from or incorporates an MTM Finding. When true, mtm_finding_ref is required.
mtm_finding_ref — references findings.id in MTM schema. Null if mtm_provenance is false.
hypothesis_statement — text The structurally testable claim this pattern record represents. Written as observation, not conclusion. No significance language. No outcome language.
status — enum: active | archived active: pattern is live, feeding DTX. archived: pattern resolved, superseded, or closed by SGR outcome. DTX drift_event carries the resolution.
created_at — timestamp Written once at record creation. Never updated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEQUENCES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PATTERN RECORD CREATION — strict order
1. Receive observation data: domain_of_origin, timestamp, interval (if applicable),
   coupling_vector, source_signals, hypothesis_statement, mtm_provenance flag.
2. Validate all required fields present — domain_of_origin (min one entry),
   coupling_vector, source_signals (min one entry), hypothesis_statement.
   Reject if any missing. No partial record written.
3. Validate hypothesis_statement contains no significance, outcome, or predictive
   language. Reject if violation found. No write occurs.
4. If mtm_provenance true: validate mtm_finding_ref is present and references a
   valid findings record. Reject if absent. No write occurs.
5. Assign hypothesis_id: query patterns for highest existing SEQ at same YYYY-MM.
   Increment by 1. Start at 1 if none exist.
   Format: H · [YYYY-MM] · [SEQ].
6. Write pattern record: all fields, status → active, created_at = timestamp.
   hypothesis_id is now available for DTX and SGR.
Failure at step 2, 3, or 4: record rejected. No write occurs.
Failure at step 6: PostgreSQL write failure. No partial record written. Re-submission required.

STATUS TRANSITION — active → archived
1. Receive archive trigger: hypothesis_id + resolution_ref (DTX drift event id or
   SGR outcome record). resolution_ref required — no archive without it.
2. Write status → archived on pattern record.
Failure at step 2: status remains active. Retry permitted.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWN FAILURE MODES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. PATTERN RECORD CREATED WITHOUT SOURCE_SIGNALS
Pattern has no traceable provenance. Cannot be linked to originating observations.
Domain distinctions are lost. DTX and SGR receive a hypothesis with no observable basis.
Guard: source_signals minimum one entry validated at record creation. Record rejected
before write if source_signals is absent or empty.

2. HYPOTHESIS_STATEMENT CONTAINS SIGNIFICANCE OR OUTCOME LANGUAGE
PCV pre-biases DTX and SGR before they run. The structural neutrality that makes the
pattern testable is violated before the pattern is observed.
Guard: hypothesis_statement validated at record creation. Statements containing
significance, outcome, or predictive language are rejected. No write occurs.

3. HYPOTHESIS_ID MODIFIED AFTER ASSIGNMENT
The structural thread connecting PCV to DTX and SGR is broken. Drift events and
signal grades lose their pattern reference. Data integrity across all three systems fails.
Guard: hypothesis_id written once at record creation. Never updated. No write path
accepts a hypothesis_id modification after assignment.

4. MTM_PROVENANCE TRUE WITH MTM_FINDING_REF NULL
MTM Finding provenance is claimed but not traceable. The source lens page chain is
lost. The pre-processed status of the pattern cannot be verified.
Guard: when mtm_provenance is true, mtm_finding_ref is required and validated at
record creation. Record rejected if mtm_finding_ref is absent.

5. PATTERN ARCHIVED WITHOUT RESOLUTION_REF
Pattern status transitions to archived with no DTX or SGR reference. The resolution
is structurally invisible — no downstream system can determine why the pattern closed.
Guard: archive trigger must carry a resolution_ref. Status transition without
resolution_ref is rejected.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PUBLIC API ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PCV.recordPattern(patternData) → string
Validates all required fields, checks hypothesis_statement for violation language,
validates mtm_finding_ref when mtm_provenance is true, assigns hypothesis_id, writes
pattern record. Returns hypothesis_id. This is the value DTX receives as hypothesis_ref
and SGR receives for grading.

PCV.archivePattern(hypothesisId, resolutionRef) → void
Transitions pattern status from active to archived. resolutionRef must be present —
a reference to the DTX drift event or SGR outcome that resolved the pattern.
No archive without a resolution reference.

PCV.activateSection(sectionId) → void
Activates the PCV section in the UI.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

backend/services/convergence.py
patterns PostgreSQL table — record creation, hypothesis_id assignment, status transitions.
Status: PLANNED