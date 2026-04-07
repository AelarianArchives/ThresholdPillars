# SIGNAL GRADING SCHEMA

## SGR · V1

## /DESIGN/Systems/Signal_Grading/SIGNAL GRADING SCHEMA.md

Mechanical spec — four-dimension evidence-locked grading, tier derivation,
Bayesian return to DTX, grade latency computation, score radar and tier
dashboard and grade latency distribution visualizations, stores, failure modes.

---

## OWNERSHIP BOUNDARIES

### OWNS

- signal_grades PostgreSQL table — record creation, score vector writes, tier assignment, grade state transitions, Bayesian return tracking
- Evidence-locked grading — scoring all four dimensions against documented evidence
- Tier derivation — deriving tier from score_vector per lowest-qualifying-dimension rule
- Grade latency computation — validation_session minus detection_session in days
- Bayesian return to DTX — assembling and sending confirmed outcome and likelihood update
- Score radar visualization — per-signal four-axis profile with tier boundary rings
- Tier dashboard visualization — aggregate tier counts + distribution over time
- Grade latency distribution visualization — latency histogram optionally split by tier

### DOES NOT OWN

- Drift event classification — owned by DTX
- Pattern detection — owned by PCV
- DTX outcome_vector update — owned by DTX (SGR sends the payload; DTX writes the update)
- PostgreSQL reads outside signal_grades — owned by FastAPI service layer (backend/services/)
- Routing authority — owned by SOT

---

## STRUCTURAL RULES

1. Every signal is evaluated across four evidence-locked dimensions:
   structural_impact, cross_domain_resonance, predictive_validity,
   temporal_stability. These produce a score_vector from which the tier is
   derived. All four dimensions required. A grade without a complete score
   vector is not a grade.

2. A signal is not eligible for grading until outcome data exists. grade_state
   begins as Unrated. It moves to Rated only when documented evidence exists
   for all four dimensions. It moves to Revised when new outcomes require
   reassessment.

3. Recency is not a grading criterion. Emotional weight is not a grading
   criterion. How striking a signal felt is not a grading criterion. A grade
   that cannot be decomposed back into its four dimensions and their documented
   evidence is not a grade.

4. Grade latency — the interval between detection_session and
   validation_session — is a signal property recorded on the grade record.
   Faster validation is a stronger signal.

5. After grading, confirmed outcomes and Bayesian likelihood updates are
   returned to DTX so outcome_vector can be refined against what actually
   happened. bayesian_return_status tracks whether this has occurred.

6. No signal moves from Unrated to Rated without documented evidence on all
   four dimensions. Partial evidence does not produce a partial grade.

---

## GRADING DIMENSIONS

| Dimension | Values | What it measures |
| --- | --- | --- |
| structural_impact | `negligible`, `local`, `cross_node`, `system_wide` | How much the signal actually affected system behavior |
| cross_domain_resonance | `isolated`, `echoed`, `convergent`, `universal` | Whether the signal appeared independently across multiple domains |
| predictive_validity | `none`, `weak`, `moderate`, `strong` | Whether the signal successfully preceded real outcomes. weak: one instance. moderate: repeatable. strong: validated across multiple documented events. |
| temporal_stability | `transient`, `recurring`, `stable`, `anchoring` | Whether the signal persisted or decayed over time |

---

## TIER DERIVATION

| Tier | Requirements | Operational meaning |
| --- | --- | --- |
| S | system_wide impact, convergent or universal resonance, strong predictive validity, stable or anchoring | Decision-driving. Applied to active system decisions. |
| A | cross_node impact, echoed or convergent resonance, moderate predictive validity, recurring or stable | Advisory. Worth tracking. Not yet decisive. |
| B | local impact, isolated or echoed resonance, weak predictive validity, transient or recurring | Emerging. Watchlist only. |
| C | negligible impact, no cross-domain support, no predictive validity, transient | Archival. Stored, not used. |

**Derivation rule:** Tier is derived from the lowest qualifying dimension. A
signal cannot claim S-Tier if any dimension scores below S-Tier threshold.
Elevation requires all four dimensions to support it.

---

## STORE: signal_grades

| Field | Type | Description |
| --- | --- | --- |
| id | auto | Primary key |
| drift_event_ref | foreign key | References drift_events.id in DTX schema. Required. |
| hypothesis_ref | foreign key | References patterns.hypothesis_id in PCV schema. Carried forward from DTX for full chain traceability: PCV → DTX → SGR. |
| score_vector | jsonb | { structural_impact, cross_domain_resonance, predictive_validity, temporal_stability }. Each holds the enum value from its dimension. Null on individual fields while Unrated. All four populated before Rated. |
| grade_rationale | jsonb | { impact_rationale, resonance_rationale, predictive_rationale, stability_rationale }. One rationale per dimension. Each states the documented evidence. Required at Rated. |
| tier | enum / null | `S`, `A`, `B`, `C`. Null while Unrated. Derived from score_vector per lowest-qualifying-dimension rule. |
| grade_state | enum | `Unrated`, `Rated`, `Revised`. Default Unrated at creation. |
| revised_at | timestamp / null | Null until grade_state → Revised. |
| detection_session | timestamp | Mirrors drift_events.detection_session. Written at record creation. |
| validation_session | timestamp / null | Session date at which grading completed. Null until Rated. |
| grade_latency | integer / null | Days between detection_session and validation_session. Null until validation. Signal property. |
| bayesian_return_status | enum | `pending`, `sent`, `failed`. Tracks whether Bayesian update has been returned to DTX. |
| bayesian_payload | jsonb / null | { confirmed_outcome, p_resolve_delta, p_collapse_delta, p_stable_delta }. Written when bayesian_return_status → sent. Preserved as record of what was returned. |
| created_at | timestamp | Written once at record creation. Never updated. |
| last_updated | timestamp | Updated on every state change. |

---

## VISUALIZATIONS

Three visualizations: score radar (per-signal), tier dashboard (aggregate),
grade latency distribution. LayerCake + D3 per Tier 3 visualization
architecture (SVG instrument category).

### Score radar chart (per-signal)

One radar per graded signal. Four axes: structural_impact,
cross_domain_resonance, predictive_validity, temporal_stability.

**Polygon shape:** shows signal profile. Balanced (even polygon) vs skewed
(one weak dimension pulling tier down).

**Lowest-qualifying dimension:** visually distinct — highlighted axis or
different color segment. Shows *why* a signal is at its tier, not just what
tier it holds.

**Tier boundary rings:** concentric rings on the radar showing where S/A/B/C
thresholds fall on each axis. The polygon's relationship to the rings makes
tier derivation visible without reading numbers.

**Data source:** score_vector on signal_grades record. Each axis maps to one
dimension. Ring positions derived from tier derivation rules.

### Tier dashboard (aggregate)

Two layers — header summary + distribution over time. Header and chart are not
competing views — two layers of the same question.

**Header (always visible):** four numbers with tier labels.

```
S: n | A: n | B: n | C: n
```

Current counts. "Where are we now."

**Main chart:** stacked area over time. X-axis = sessions or months. Y-axis =
signal count. Color = tier.

Shows whether research is producing stronger signals over time. S-tier
accumulating? B-tier getting promoted? The trend is the signal. "Where are we
going."

**Data source:** aggregate query on signal_grades — group by tier, bucket by
validation_session date.

### Grade latency distribution

Histogram or density plot.

**X-axis:** latency in days (detection to validation).
**Y-axis:** count / frequency.

Optionally split by tier — do S-tier signals resolve faster than B-tier? That
correlation is a research question the visualization answers directly.

Faster validation = stronger signal property (per DTX/SGR schemas).

**Data source:** grade_latency + tier on signal_grades records where
grade_state is Rated or Revised.

---

## SEQUENCES

### Grade record creation — strict order

1. Receive grade initiation: drift_event_ref (from DTX), hypothesis_ref
   (carried from DTX record).
2. Validate drift_event_ref present and references a valid DTX record. Reject
   if missing or invalid. No write occurs.
3. Write signal_grades record: drift_event_ref, hypothesis_ref,
   detection_session (mirrored from DTX), grade_state → Unrated,
   bayesian_return_status → pending, created_at, last_updated. All
   score_vector fields null. tier null.

Failure at step 2: record rejected. No write occurs.
Failure at step 3: PostgreSQL write failure. No partial record written.

### Grading — strict order (fires when outcome data exists for all four dimensions)

1. Receive evidence: structural_impact, cross_domain_resonance,
   predictive_validity, temporal_stability values and a rationale for each.
2. Validate all four score_vector values present and within enum. Reject if
   any missing or invalid.
3. Validate grade_rationale complete — all four rationale fields non-null.
   Reject if any missing.
4. Write score_vector with all four values.
5. Derive tier from score_vector — lowest-qualifying-dimension rule.
6. Write tier and grade_rationale.
7. Write validation_session = timestamp.
8. Compute grade_latency: validation_session minus detection_session in days.
9. Write grade_latency, grade_state → Rated, last_updated.

Failure at steps 2 or 3: grading rejected. grade_state remains Unrated.
Failure at any write step: last successful write preserved. Retry from point
of failure.

### Bayesian return to DTX — strict order (fires when grade_state → Rated)

1. Assemble bayesian_payload: { confirmed_outcome, p_resolve_delta,
   p_collapse_delta, p_stable_delta }.
2. Write bayesian_return_status → sent. Write bayesian_payload. Write
   last_updated.
3. DTX receives payload and updates outcome_vector on drift event record.

Failure at step 2: bayesian_return_status remains pending. Retry permitted.
Failure at step 3 (DTX write): bayesian_return_status remains sent — visible
recovery signal.

### Grade revision — fires when new outcomes require reassessment

1. Receive revised evidence for one or more dimensions.
2. Update score_vector fields with new values.
3. Re-derive tier from updated score_vector — lowest-qualifying-dimension rule.
4. Write updated score_vector, tier, and grade_rationale fields.
5. Write revised_at = timestamp.
6. Write grade_state → Revised, last_updated.
7. If bayesian_payload changes: reset bayesian_return_status → pending.
   Re-run Bayesian return sequence.

---

## PUBLIC API

### POST /sgr/grades

Creates signal_grades record in Unrated state. Requires drift_event_ref and
hypothesis_ref. Mirrors detection_session from DTX record. Returns
signal_grades id.

### PATCH /sgr/grades/{id}/score

Validates score vector completeness and rationale, derives tier, writes grade,
computes grade_latency, transitions grade_state → Rated. Called only when
outcome data exists for all four dimensions.

### PATCH /sgr/grades/{id}/revise

Updates score_vector, re-derives tier, writes revised_at, transitions
grade_state → Revised. Resets bayesian_return_status if payload changes.

### POST /sgr/grades/{id}/bayesian-return

Assembles bayesian_payload, writes bayesian_return_status → sent, sends
payload to DTX.

### GET /sgr/grades

Query grades. Filterable by tier, grade_state, hypothesis_ref, date range.
Paginated.

### GET /sgr/grades/dashboard

Returns aggregate tier counts (current) and tier distribution over time
(bucketed by session/month). Used by tier dashboard visualization.

### GET /sgr/grades/latency-distribution

Returns grade_latency values with tier for all Rated/Revised grades. Used by
grade latency distribution visualization. Optionally filterable by tier.

---

## KNOWN FAILURE MODES

### 1. Grade record created without drift_event_ref

Signal grade has no DTX origin. Traceability chain PCV → DTX → SGR is broken.

**Guard:** drift_event_ref validated at record creation. Record rejected if
absent or invalid.

### 2. Grade state → Rated with incomplete score vector

One or more dimensions null. Tier derivation invalid. Meaningless tier
propagates downstream.

**Guard:** all four score_vector fields validated before Rated. Grading
rejected if any dimension is null or outside its enum.

### 3. Grade rationale missing at Rated

Score vector present but evidence not documented. Grade cannot be decomposed
into its evidence base.

**Guard:** grade_rationale completeness validated before Rated. Grading
rejected if any rationale field is absent.

### 4. Bayesian return not sent to DTX after grading

DTX outcome_vector not updated. Bayesian inference chain incomplete.

**Guard:** bayesian_return_status tracks return state. pending and failed are
visible states, not silent gaps.

### 5. Tier written above lowest-qualifying dimension

Signal claims higher tier than its weakest dimension supports.

**Guard:** tier derivation enforces lowest-qualifying-dimension rule at every
write. No tier write path accepts a tier above what the weakest dimension
supports.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| backend/services/grading.py | SGR service — grade record creation, score vector writes, tier derivation, grade state transitions, grade latency computation, Bayesian return assembly and tracking, dashboard/latency aggregate queries | PLANNED |
| backend/routes/grading.py | FastAPI SGR endpoints — POST/PATCH/GET grades, dashboard, latency-distribution, bayesian-return | PLANNED |
