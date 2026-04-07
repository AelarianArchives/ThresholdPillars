# DRIFT TAXONOMY SCHEMA

## DTX · V1

## /DESIGN/Systems/Drift_Taxonomy/DRIFT TAXONOMY SCHEMA.md

OWNERSHIP BOUNDARIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OWNS
Drift event classification — all four required dimensions, enforced at record creation
drift_events PostgreSQL table — record creation, state updates, outcome writes, grade latency computation
Trajectory state — live trajectory_state tracking and updates on active events
outcome_vector — Bayesian update receipt from SGR and write to drift event record
Grade latency computation — interval between detection_session and validation_session
Outcome validation — outcome_label and outcome_observed_at co-write rule enforcement

DOES NOT OWN
Pattern detection — owned by PCV (PCV produces the hypothesis_ref DTX classifies against)
Signal grading — owned by SGR (SGR grades signals; DTX receives and applies Bayesian returns)
Bayesian inference computation — owned by SGR (SGR computes the update; DTX writes it)
Findings production — owned by MTM synthesis service (backend/services/mtm.py)
PostgreSQL reads or writes outside drift_events — owned by FastAPI service layer (backend/services/)
Routing authority — owned by SOT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURAL RULES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Every drift event is classified across four required dimensions: initiation_source · trajectory_pattern · threshold_interaction · signature_pattern. All four required. A classification missing any dimension is incomplete.

2. Active drift events maintain a live trajectory_state. Each state carries a probabilistic outcome_vector updated via Bayesian inference as SGR returns confirmed outcomes. The vector is live data — not a one-time assessment.

3. An outcome_label cannot be written until that outcome has been explicitly observed and timestamped. The separation between live classification and post-hoc validation is structural, not procedural.

4. Grade latency is a tracked signal property: the interval between detection_session and validation_session. It is recorded on the drift event record, not inferred after the fact.

5. A drift class that cannot be matched to actual session data is not a class. It is a label. Precision here is what makes the taxonomy operational.

6. Drift is a mechanical event. Generic language — things degraded, coherence broke down — is a failure mode. Classify against the defined enums.

7. Bayesian updates arrive from SGR after grading events. outcome_vector is updated at that moment and last_updated is written. Prior vector state is not preserved — the current vector reflects all accumulated evidence.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ STORE: drift_events ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
id — auto
hypothesis_ref — references patterns.hypothesis_id in PCV schema. The pattern that produced this drift event. Required. A drift event without a PCV origin is not valid.
// Classification dimensions — all four required
initiation_source — enum: internal_instability | external_perturbation | cross_node_interference | recursion_overload
trajectory_pattern — enum: linear_escalation | oscillation | fragmentation | cascade | containment
threshold_interaction — enum: sub_threshold | threshold_breach | critical_cascade | irreversible_shift
signature_pattern — object Mechanical fingerprint of the drift event. { timing_rhythm, node_involvement, escalation_curve } All three sub-fields required. timing_rhythm: the temporal pattern of the perturbation. node_involvement: which nodes are active in this event. escalation_curve: the shape of movement over time.
// Live trajectory state
trajectory_state — enum: Escalating | Stabilizing | Oscillating | Fragmenting | Contained Updated as new session data arrives. Written at record creation and on every state change.
outcome_vector — object { p_resolve, p_collapse, p_stable } Probabilistic outcome vector. Values are floats 0–1. Sum must equal 1.0. Initialized at record creation. Updated via Bayesian inference each time SGR returns a confirmed outcome. WRITE ORDER on Bayesian update: SGR writes bayesian_return_status → sent first. DTX updates outcome_vector second. If outcome_vector write fails, bayesian_return_status on SGR record remains sent — visible signal, recoverable on retry.
// Resolution
outcome_label — string Null until outcome explicitly observed and timestamped. Written only when resolution is documented — never inferred. Written alongside outcome_observed_at.
outcome_observed_at — timestamp Null until outcome is observed. Written at the same moment as outcome_label. Both fields are written together or neither is written.
// Grade latency
detection_session — timestamp Session date at which this drift event was first classified. Written once at record creation.
validation_session — timestamp Session date at which outcome was confirmed by SGR. Null until validation occurs.
grade_latency — integer (days) Computed when validation_session is written: validation_session minus detection_session in days. Null until validation occurs. Faster validation = stronger signal. This value is a signal property, not an administrative field.
// Lifecycle
created_at — timestamp Written once at record creation. Never updated.
last_updated — timestamp Written at record creation. Updated on every state change: trajectory_state update, outcome_vector update, outcome_label write.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SEQUENCES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DRIFT EVENT CREATION — strict order
1. Receive state vector from PCV containing hypothesis_id and all four classification dimensions.
2. Validate all four classification dimensions present — reject if any missing. No partial record written.
3. Validate hypothesis_ref is non-null and references a valid PCV pattern record — reject if missing.
4. Initialize outcome_vector: { p_resolve, p_collapse, p_stable } — values floats 0–1, sum must equal 1.0.
5. Write drift event record: all classification dimensions, trajectory_state, outcome_vector, detection_session, created_at, last_updated.
Failure at step 2 or 3: record rejected. PCV notified. No write occurs.
Failure at step 5: PostgreSQL write failure. No partial record written. PCV must re-send state vector on recovery.

BAYESIAN UPDATE FROM SGR — strict order
1. SGR writes bayesian_return_status → sent on its grading record.
2. DTX receives confirmed outcome data from SGR.
3. Compute new outcome_vector from accumulated evidence.
4. Write outcome_vector and last_updated on drift event record.
Failure at step 4: outcome_vector write fails. bayesian_return_status on SGR record remains sent — visible recovery signal. Retry writes outcome_vector from the SGR record on next recovery pass.

OUTCOME VALIDATION — strict order
1. Outcome explicitly observed and timestamped — external trigger required.
2. Co-write outcome_label and outcome_observed_at — both fields written together or neither is written.
3. Write validation_session timestamp.
4. Compute grade_latency: validation_session minus detection_session in days.
5. Write grade_latency and last_updated.
Failure at step 2: partial write detected if one field writes without the other — recovery pass rewrites both fields. No outcome_label without outcome_observed_at. No outcome_observed_at without outcome_label.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ KNOWN FAILURE MODES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. DRIFT EVENT CREATED WITHOUT HYPOTHESIS_REF
Provenance chain broken. Drift event cannot be traced to a PCV pattern. The taxonomy loses its connection to the observation that produced it.
Guard: hypothesis_ref is required and validated at record creation. Records without hypothesis_ref are rejected before write. No partial records written.

2. OUTCOME LABEL WRITTEN BEFORE OUTCOME OBSERVED
Live classification and post-hoc validation conflated. outcome_label written from inference rather than an explicitly observed and timestamped event. The separation that makes the taxonomy honest is broken.
Guard: outcome_label write path requires outcome_observed_at. Both fields are written together or neither is written. No write path accepts outcome_label without outcome_observed_at.

3. CLASSIFICATION WRITTEN WITH MISSING DIMENSION
Incomplete drift event silently enters the store. Cannot be matched to actual session data. Taxonomy precision lost — a class without all four dimensions is a label, not a classification.
Guard: all four classification dimensions validated at record creation. A record missing any dimension is rejected before write.

4. OUTCOME_VECTOR WRITTEN WITHOUT SGR BAYESIAN RETURN
DTX updates outcome_vector without a traceable grading event from SGR. Vector update cannot be audited or attributed.
Guard: WRITE ORDER enforced — SGR writes bayesian_return_status → sent before DTX updates outcome_vector. If outcome_vector write fails, bayesian_return_status remains sent — visible signal, recoverable on retry.

5. GRADE_LATENCY COMPUTED BEFORE VALIDATION_SESSION IS WRITTEN
grade_latency computed from incomplete data. Value is inaccurate and cannot be trusted as a signal property.
Guard: grade_latency is computed only when validation_session is written. Null until validation occurs. Computed from validation_session minus detection_session exclusively — no other inputs.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PUBLIC API ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DTX.classifyEvent(stateVector) → string
Called by PCV with observed state vector. stateVector must include hypothesis_id and all four classification dimensions. Validates inputs, initializes outcome_vector, writes drift event record. Returns event id.

DTX.updateTrajectoryState(eventId, newState) → void
Updates trajectory_state on the named event record. newState must match trajectory_state enum. Writes last_updated.

DTX.receiveBayesianUpdate(eventId, outcomeVector) → void
Applies Bayesian return from SGR. outcomeVector must sum to 1.0. Writes outcome_vector and last_updated. Called only after SGR has written bayesian_return_status → sent.

DTX.recordOutcome(eventId, outcomeLabel, observedAt) → void
Co-writes outcome_label and outcome_observed_at. Writes validation_session. Computes and writes grade_latency. Writes last_updated. Called only when outcome is explicitly observed and timestamped — never from inference.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FILES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

backend/services/drift.py
drift_events PostgreSQL table — record creation, state writes, outcome writes, grade latency computation, Bayesian update application. Status: PLANNED