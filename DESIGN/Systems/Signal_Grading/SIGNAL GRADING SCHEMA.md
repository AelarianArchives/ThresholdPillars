╔══════════════════════════════════════════════════════════════╗ ║ SIGNAL GRADING SCHEMA · SGR · v1 ║ ║ /DESIGN/systems/signal_grading_schema_v1.md ║ ╚══════════════════════════════════════════════════════════════╝

OWNERSHIP BOUNDARIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OWNS
signal_grades PostgreSQL table — record creation, score vector writes, tier assignment,
  grade state transitions, Bayesian return tracking
Evidence-locked grading — scoring all four dimensions against documented evidence
Tier derivation — deriving tier from score_vector per lowest-qualifying-dimension rule
Grade latency computation — validation_session minus detection_session in days
Bayesian return to DTX — assembling and sending confirmed outcome and likelihood update

DOES NOT OWN
Drift event classification — owned by DTX
Pattern detection — owned by PCV
DTX outcome_vector update — owned by DTX (SGR sends the payload; DTX writes the update)
PostgreSQL reads outside signal_grades — owned by FastAPI service layer (backend/services/)
Routing authority — owned by SOT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURAL RULES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Every signal is evaluated across four evidence-locked dimensions: structural_impact · cross_domain_resonance · predictive_validity · temporal_stability. These produce a score_vector from which the tier is derived. All four dimensions required. A grade without a complete score vector is not a grade.

2. A signal is not eligible for grading until outcome data exists. grade_state begins as Unrated. It moves to Rated only when documented evidence exists for all four dimensions. It moves to Revised when new outcomes require reassessment.

3. Recency is not a grading criterion. Emotional weight is not a grading criterion. How striking a signal felt is not a grading criterion. A grade that cannot be decomposed back into its four dimensions and their documented evidence is not a grade.

4. Grade latency — the interval between detection_session and validation_session — is a signal property recorded on the grade record. Faster validation is a stronger signal. This field mirrors the DTX record and is written here independently.

5. After grading, confirmed outcomes and Bayesian likelihood updates are returned to DTX so outcome_vector can be refined against what actually happened. bayesian_return_status tracks whether this has occurred.

6. No signal moves from Unrated to Rated without documented evidence on all four dimensions. Partial evidence does not produce a partial grade. The signal remains Unrated until the evidence base is complete.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ GRADING DIMENSIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
structural_impact How much the signal actually affected system behavior. Values: negligible | local | cross_node | system_wide
cross_domain_resonance Whether the signal appeared independently across multiple domains. Values: isolated | echoed | convergent | universal
predictive_validity Whether the signal successfully preceded real outcomes. Values: none | weak | moderate | strong weak: one instance of predictive success. moderate: repeatable across more than one instance. strong: validated across multiple documented events.
temporal_stability Whether the signal persisted or decayed over time. Values: transient | recurring | stable | anchoring
TIER DERIVATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
S-Tier — system_wide impact · convergent or universal resonance · strong predictive validity · stable or anchoring. Decision-driving. Applied to active system decisions.
A-Tier — cross_node impact · echoed or convergent resonance · moderate predictive validity · recurring or stable. Advisory. Worth tracking. Not yet decisive.
B-Tier — local impact · isolated or echoed resonance · weak predictive validity · transient or recurring. Emerging. Watchlist only.
C-Tier — negligible impact · no cross-domain support · no predictive validity · transient. Archival. Stored, not used.
DERIVATION RULE: Tier is derived from the lowest qualifying dimension. A signal cannot claim S-Tier if any dimension scores below S-Tier threshold. Elevation requires all four dimensions to support it.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ STORE: signal_grades ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
id — auto
drift_event_ref — references drift_events.id in DTX schema. Required. A signal grade without a DTX origin is not valid.
hypothesis_ref — references patterns.hypothesis_id in PCV schema. Carried forward from the DTX record for full chain traceability: PCV → DTX → SGR.
// Score vector — all four required before Rated
score_vector — object { structural_impact, cross_domain_resonance, predictive_validity, temporal_stability } Each field holds the enum value from its dimension. Null on individual fields while grade_state is Unrated. All four populated before grade_state → Rated.
grade_rationale — object { impact_rationale, resonance_rationale, predictive_rationale, stability_rationale } One rationale field per dimension. Each states the documented evidence supporting that dimension score. Required at Rated. A dimension score without documented rationale is not complete.
tier — enum: S | A | B | C Null while grade_state is Unrated. Derived from score_vector per tier derivation rules. Written when grade_state → Rated. Updated when grade_state → Revised.
grade_state — enum: Unrated | Rated | Revised Unrated: outcome data does not yet exist. Default at record creation. Rated: all four dimensions scored with documented evidence. Tier assigned. Revised: new outcomes required reassessment. Score vector and tier updated. revised_at written.
revised_at — timestamp Null until grade_state → Revised. Written at the moment of reassessment.
// Grade latency
detection_session — timestamp Mirrors drift_events. detection_session. Written at record creation.
validation_session — timestamp Session date at which grading was completed. Null until grade_state → Rated.
grade_latency — integer (days) Computed when validation_session is written: validation_session minus detection_session in days. Null until validation occurs. Signal property, not administrative field.
// Bayesian return to DTX
bayesian_return_status — enum: pending | sent | failed pending: grade complete, Bayesian update not yet sent to DTX. sent: confirmed outcome and likelihood update returned to DTX. DTX outcome_vector updated. failed: return attempt failed. Retry permitted. WRITE ORDER: SGR writes bayesian_return_status → sent before DTX updates outcome_vector. If DTX write fails, bayesian_return_status remains sent — visible signal, recoverable on retry.
bayesian_payload — object The confirmed outcome and likelihood delta sent to DTX. { confirmed_outcome, p_resolve_delta, p_collapse_delta, p_stable_delta } Written when bayesian_return_status → sent. Null until then. Preserved as record of what was returned.
// Lifecycle
created_at — timestamp Written once at record creation. Never updated.
last_updated — timestamp Written at record creation. Updated on every state change: score_vector update, tier assignment, grade_state change, bayesian_return_status change.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEQUENCES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GRADE RECORD CREATION — strict order
1. Receive grade initiation: drift_event_ref (from DTX), hypothesis_ref (carried
   from DTX record).
2. Validate drift_event_ref present and references a valid DTX record. Reject if
   missing or invalid. No write occurs.
3. Write signal_grades record: drift_event_ref, hypothesis_ref, detection_session
   (mirrored from DTX), grade_state → Unrated, bayesian_return_status → pending,
   created_at, last_updated. All score_vector fields null. tier null.
Failure at step 2: record rejected. No write occurs.
Failure at step 3: PostgreSQL write failure. No partial record written. Re-initiation required.

GRADING — strict order (fires when outcome data exists for all four dimensions)
1. Receive evidence: structural_impact, cross_domain_resonance, predictive_validity,
   temporal_stability values and a rationale for each.
2. Validate all four score_vector values present and within enum. Reject if any
   missing or invalid. No write occurs.
3. Validate grade_rationale complete — all four rationale fields non-null. Reject
   if any missing. No write occurs.
4. Write score_vector with all four values.
5. Derive tier from score_vector — lowest-qualifying-dimension rule.
6. Write tier and grade_rationale.
7. Write validation_session = timestamp.
8. Compute grade_latency: validation_session minus detection_session in days.
9. Write grade_latency, grade_state → Rated, last_updated.
Failure at steps 2 or 3: grading rejected. score_vector not written. grade_state
  remains Unrated.
Failure at any write step: last successful write preserved. Retry from point of failure.

BAYESIAN RETURN TO DTX — strict order (fires when grade_state → Rated)
1. Assemble bayesian_payload: { confirmed_outcome, p_resolve_delta,
   p_collapse_delta, p_stable_delta }.
2. Write bayesian_return_status → sent. Write bayesian_payload. Write last_updated.
3. DTX receives payload and updates outcome_vector on drift event record.
Failure at step 2: bayesian_return_status remains pending. Retry permitted.
Failure at step 3 (DTX write): bayesian_return_status remains sent — visible
  recovery signal. DTX retries from bayesian_return_status on next recovery pass.

GRADE REVISION — fires when new outcomes require reassessment
1. Receive revised evidence for one or more dimensions.
2. Update score_vector fields with new values.
3. Re-derive tier from updated score_vector — lowest-qualifying-dimension rule.
4. Write updated score_vector, tier, and grade_rationale fields.
5. Write revised_at = timestamp.
6. Write grade_state → Revised, last_updated.
7. If bayesian_payload changes: reset bayesian_return_status → pending.
   Re-run BAYESIAN RETURN sequence.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWN FAILURE MODES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. GRADE RECORD CREATED WITHOUT DRIFT_EVENT_REF
Signal grade has no DTX origin. The traceability chain PCV → DTX → SGR is broken.
Guard: drift_event_ref validated at record creation. Record rejected before write
if absent or invalid.

2. GRADE STATE → RATED WITH INCOMPLETE SCORE VECTOR
One or more dimensions null. Tier derivation cannot be valid. A partial grade
produces a meaningless tier that propagates to all downstream reads.
Guard: all four score_vector fields validated before grade_state → Rated. Grading
rejected if any dimension value is null or outside its enum.

3. GRADE RATIONALE MISSING AT RATED
Score vector present but evidence not documented. Grade cannot be decomposed into
its evidence base. Audit trail broken — future reassessment has no baseline.
Guard: grade_rationale completeness (all four fields non-null) validated before
grade_state → Rated. Grading rejected if any rationale field is absent.

4. BAYESIAN RETURN NOT SENT TO DTX AFTER GRADING
DTX outcome_vector not updated. Bayesian inference chain incomplete. Pattern
outcome data is lost to the system.
Guard: bayesian_return_status tracks return state — pending means return has not
occurred, failed means a retry attempt failed. Neither state is silent. No write
path marks bayesian_return_status as complete without a successful DTX handoff.

5. TIER WRITTEN ABOVE LOWEST-QUALIFYING DIMENSION
A signal claims S-Tier while one or more dimensions score below S-Tier threshold.
Grade integrity compromised. Invalid tier propagates to all downstream reads.
Guard: tier derivation enforces lowest-qualifying-dimension rule at every write.
No tier write path accepts a tier above what the weakest dimension supports.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PUBLIC API ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SGR.initGrade(driftEventRef, hypothesisRef) → string
Creates signal_grades record in Unrated state. Mirrors detection_session from
DTX record. Returns signal_grades id. Called when a DTX drift event is classified
and awaits outcome data before grading can begin.

SGR.recordGrade(gradeId, scoreVector, gradeRationale) → void
Validates score vector completeness and rationale, derives tier via
lowest-qualifying-dimension rule, writes grade, computes grade_latency, transitions
grade_state → Rated. Called only when outcome data exists for all four dimensions.

SGR.reviseGrade(gradeId, updatedScoreVector, updatedRationale) → void
Updates score_vector, re-derives tier, writes revised_at, transitions
grade_state → Revised. Resets bayesian_return_status → pending and re-triggers
Bayesian return if payload changes.

SGR.sendBayesianReturn(gradeId) → void
Assembles bayesian_payload from grade record. Writes bayesian_return_status → sent
and bayesian_payload. Sends payload to DTX for outcome_vector update.
Called after grade_state → Rated or → Revised.

SGR.activateSection(sectionId) → void
Activates the SGR section in the UI.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

backend/services/grading.py
signal_grades PostgreSQL table — record creation, score vector writes, tier assignment,
grade state transitions, Bayesian return tracking. Status: PLANNED