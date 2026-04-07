# DRIFT TAXONOMY SCHEMA

## DTX · V1

## /DESIGN/Systems/Drift_Taxonomy/DRIFT TAXONOMY SCHEMA.md

Mechanical spec — drift event classification, four required dimensions,
trajectory state tracking, Bayesian update receipt, outcome validation,
grade latency computation, drift timeline and trajectory probability
visualizations, stores, failure modes.

---

## OWNERSHIP BOUNDARIES

### OWNS

- Drift event classification — all four required dimensions, enforced at record creation
- drift_events PostgreSQL table — record creation, state updates, outcome writes, grade latency computation
- Trajectory state — live trajectory_state tracking and updates on active events
- outcome_vector — Bayesian update receipt from SGR and write to drift event record
- Grade latency computation — interval between detection_session and validation_session
- Outcome validation — outcome_label and outcome_observed_at co-write rule enforcement
- Drift timeline visualization — swim-lane temporal display of all drift events
- Trajectory probability visualizations — stacked bar (aggregate) and ternary plot (per-event deep-dive)

### DOES NOT OWN

- Pattern detection — owned by PCV (PCV produces the hypothesis_ref DTX classifies against)
- Signal grading — owned by SGR (SGR grades signals; DTX receives and applies Bayesian returns)
- Bayesian inference computation — owned by SGR (SGR computes the update; DTX writes it)
- Findings production — owned by MTM synthesis service
- PostgreSQL reads or writes outside drift_events — owned by FastAPI service layer (backend/services/)
- Routing authority — owned by SOT

---

## STRUCTURAL RULES

1. Every drift event is classified across four required dimensions:
   initiation_source, trajectory_pattern, threshold_interaction,
   signature_pattern. All four required. A classification missing any dimension
   is incomplete.

2. Active drift events maintain a live trajectory_state. Each state carries a
   probabilistic outcome_vector updated via Bayesian inference as SGR returns
   confirmed outcomes. The vector is live data — not a one-time assessment.

3. An outcome_label cannot be written until that outcome has been explicitly
   observed and timestamped. The separation between live classification and
   post-hoc validation is structural, not procedural.

4. Grade latency is a tracked signal property: the interval between
   detection_session and validation_session. It is recorded on the drift event
   record, not inferred after the fact.

5. A drift class that cannot be matched to actual session data is not a class.
   It is a label. Precision here is what makes the taxonomy operational.

6. Drift is a mechanical event. Generic language — things degraded, coherence
   broke down — is a failure mode. Classify against the defined enums.

7. Bayesian updates arrive from SGR after grading events. outcome_vector is
   updated at that moment and last_updated is written. Prior vector state is
   not preserved — the current vector reflects all accumulated evidence.

---

## STORE: drift_events

| Field | Type | Description |
| --- | --- | --- |
| id | auto | Primary key |
| hypothesis_ref | foreign key | References patterns.hypothesis_id in PCV schema. The pattern that produced this drift event. Required. |
| initiation_source | enum | `internal_instability`, `external_perturbation`, `cross_node_interference`, `recursion_overload` |
| trajectory_pattern | enum | `linear_escalation`, `oscillation`, `fragmentation`, `cascade`, `containment` |
| threshold_interaction | enum | `sub_threshold`, `threshold_breach`, `critical_cascade`, `irreversible_shift` |
| signature_pattern | jsonb | Mechanical fingerprint: { timing_rhythm, node_involvement, escalation_curve }. All three sub-fields required. |
| trajectory_state | enum | `Escalating`, `Stabilizing`, `Oscillating`, `Fragmenting`, `Contained`. Updated as new session data arrives. Written at record creation and on every state change. |
| outcome_vector | jsonb | { p_resolve, p_collapse, p_stable }. Floats 0-1. Sum must equal 1.0. Initialized at record creation. Updated via Bayesian inference from SGR. |
| outcome_label | string / null | Null until outcome explicitly observed and timestamped. Written only when resolution is documented — never inferred. Co-written with outcome_observed_at. |
| outcome_observed_at | timestamp / null | Null until outcome observed. Co-written with outcome_label. Both or neither. |
| detection_session | timestamp | Session date at which this drift event was first classified. Written once at record creation. |
| validation_session | timestamp / null | Session date at which outcome was confirmed by SGR. Null until validation occurs. |
| grade_latency | integer / null | Days between detection_session and validation_session. Computed when validation_session is written. Null until validation. Faster validation = stronger signal. |
| created_at | timestamp | Written once at record creation. Never updated. |
| last_updated | timestamp | Written at record creation. Updated on every state change: trajectory_state update, outcome_vector update, outcome_label write. |

---

## VISUALIZATIONS

Two visualizations: drift timeline (primary) + trajectory probability display
(stacked bar default, ternary plot deep-dive). LayerCake + D3 per Tier 3
visualization architecture (SVG instrument category).

### Drift timeline (primary)

Horizontal timeline. Time on x-axis, each active drift event as a lane
(swim-lane layout).

**Per-event lane:**

| Element | Source | Visual |
| --- | --- | --- |
| Color | trajectory_state | Escalating / Stabilizing / Oscillating / Fragmenting / Contained — each state gets a distinct color |
| Start marker | detection_session | Left edge of lane |
| End marker | validation_session | Right edge of lane (if resolved), with outcome_label |
| Lane length | grade_latency | Longer lane = slower validation = weaker signal property. Visually encodes grade latency without a separate chart. |
| Classification badges | initiation_source, trajectory_pattern, threshold_interaction, signature_pattern | On hover/expand |

**Temporal story at a glance:** what was detected when, how long events take to
resolve, which trajectory states dominate the current window.

### Trajectory probability — stacked bar (default)

One three-segment horizontal bar per active event.

**Segments:** p_resolve | p_collapse | p_stable

As Bayesian updates arrive from SGR, segments shift. Scannable across many
events — "where does each event stand now?" Good for comparing current state
of all active events side by side.

### Trajectory probability — ternary plot (deep-dive)

Three-axis probability space (resolve / collapse / stable).

Each event is a point. Historical positions trace the inference trajectory —
how the system's confidence about this event evolved as Bayesian updates
accumulated. Shows the *path* of inference, not just the current state.

**Navigation:** accessible directly from drift timeline. Click a drift event's
lane → opens its ternary trail. Timeline is the entry point, ternary is the
depth. Drill-down, not separate tool.

**Data requirement:** ternary plot requires outcome_vector history. The current
drift_events table stores only the current vector (prior state is not
preserved per structural rule 7). Ternary trail requires a vector history
log — each Bayesian update's resulting vector stored with timestamp. This is
a display data requirement surfaced by the visualization spec.

**outcome_vector_history** — auxiliary storage for ternary plot:

| Field | Type | Description |
| --- | --- | --- |
| id | auto | Primary key |
| drift_event_id | foreign key | References drift_events.id |
| p_resolve | float | resolve probability at this update |
| p_collapse | float | collapse probability at this update |
| p_stable | float | stable probability at this update |
| updated_at | timestamp | When this vector was written |

Written on every Bayesian update alongside the outcome_vector write on the
drift event record. The drift event record holds the current state. The
history log holds the trajectory. Both are needed — the timeline reads the
current vector; the ternary plot reads the history.

---

## SEQUENCES

### Drift event creation — strict order

1. Receive state vector from PCV containing hypothesis_id and all four
   classification dimensions.
2. Validate all four classification dimensions present — reject if any missing.
   No partial record written.
3. Validate hypothesis_ref is non-null and references a valid PCV pattern
   record — reject if missing.
4. Initialize outcome_vector: { p_resolve, p_collapse, p_stable } — values
   floats 0-1, sum must equal 1.0.
5. Write drift event record: all classification dimensions, trajectory_state,
   outcome_vector, detection_session, created_at, last_updated.
6. Write initial outcome_vector_history entry.

Failure at step 2 or 3: record rejected. PCV notified. No write occurs.
Failure at step 5: PostgreSQL write failure. No partial record written. PCV
must re-send state vector on recovery.

### Bayesian update from SGR — strict order

1. SGR writes bayesian_return_status → sent on its grading record.
2. DTX receives confirmed outcome data from SGR.
3. Compute new outcome_vector from accumulated evidence.
4. Write outcome_vector and last_updated on drift event record.
5. Write outcome_vector_history entry with new vector and timestamp.

Failure at step 4: outcome_vector write fails. bayesian_return_status on SGR
record remains sent — visible recovery signal. Retry writes outcome_vector
from the SGR record on next recovery pass.

### Outcome validation — strict order

1. Outcome explicitly observed and timestamped — external trigger required.
2. Co-write outcome_label and outcome_observed_at — both fields written
   together or neither is written.
3. Write validation_session timestamp.
4. Compute grade_latency: validation_session minus detection_session in days.
5. Write grade_latency and last_updated.

Failure at step 2: partial write detected if one field writes without the
other — recovery pass rewrites both fields. No outcome_label without
outcome_observed_at. No outcome_observed_at without outcome_label.

---

## PUBLIC API

### POST /dtx/events

Called by PCV with observed state vector. Must include hypothesis_id and all
four classification dimensions. Validates inputs, initializes outcome_vector,
writes drift event record. Returns event id.

### PATCH /dtx/events/{id}/trajectory

Updates trajectory_state on the named event record. newState must match
trajectory_state enum. Writes last_updated.

### PATCH /dtx/events/{id}/bayesian

Applies Bayesian return from SGR. outcome_vector must sum to 1.0. Writes
outcome_vector, last_updated, and outcome_vector_history entry. Called only
after SGR has written bayesian_return_status → sent.

### PATCH /dtx/events/{id}/outcome

Co-writes outcome_label and outcome_observed_at. Writes validation_session.
Computes and writes grade_latency. Writes last_updated. Called only when
outcome is explicitly observed and timestamped — never from inference.

### GET /dtx/events

Query active and/or resolved drift events. Filterable by trajectory_state,
hypothesis_ref, date range. Paginated.

### GET /dtx/events/{id}/vector-history

Returns outcome_vector_history for a single drift event. Used by ternary plot
visualization.

---

## KNOWN FAILURE MODES

### 1. Drift event created without hypothesis_ref

Provenance chain broken. Drift event cannot be traced to a PCV pattern.

**Guard:** hypothesis_ref is required and validated at record creation. Records
without hypothesis_ref are rejected before write.

### 2. Outcome label written before outcome observed

Live classification and post-hoc validation conflated.

**Guard:** outcome_label write path requires outcome_observed_at. Both fields
co-written or neither. No write path accepts one without the other.

### 3. Classification written with missing dimension

Incomplete drift event silently enters the store.

**Guard:** all four classification dimensions validated at record creation. A
record missing any dimension is rejected before write.

### 4. Outcome vector written without SGR Bayesian return

DTX updates outcome_vector without a traceable grading event from SGR.

**Guard:** WRITE ORDER enforced — SGR writes bayesian_return_status → sent
before DTX updates outcome_vector. If outcome_vector write fails,
bayesian_return_status remains sent — visible signal, recoverable on retry.

### 5. Grade latency computed before validation_session is written

grade_latency computed from incomplete data.

**Guard:** grade_latency is computed only when validation_session is written.
Null until validation occurs.

### 6. Ternary plot missing vector history

outcome_vector_history entries not written on Bayesian updates. Ternary trail
has gaps or is empty.

**Guard:** outcome_vector_history write is part of the Bayesian update sequence
(step 5). If the history write fails, the Bayesian update sequence logs the
failure. The drift event's current vector is still correct — only the
historical trail is incomplete.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| backend/services/drift.py | DTX service — drift event creation, classification validation, trajectory state updates, Bayesian update receipt, outcome validation, grade latency computation, vector history writes | PLANNED |
| backend/routes/drift.py | FastAPI DTX endpoints — POST /dtx/events, PATCH trajectory/bayesian/outcome, GET /dtx/events, GET vector-history | PLANNED |
