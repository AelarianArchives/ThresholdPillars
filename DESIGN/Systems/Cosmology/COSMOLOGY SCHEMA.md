# COSMOLOGY SCHEMA

## Group 7 · V1

## /DESIGN/Systems/Cosmology/COSMOLOGY SCHEMA.md

Mechanical spec — shared schema for the Cosmology investigation group.
cosmology_findings table (shared across HCO, COS, CLM, NHM, RCT),
rct_residuals table (RCT-specific), per-page investigation surfaces,
finding card layout, Nexus recursive feedback loop, RCT residual flow,
LNV routing content shapes, failure modes.

Computation infrastructure in ARTIS SCHEMA.md. Ownership boundaries
in SYSTEM_ Cosmology.md.

---

## STRUCTURAL RULES

1. Cosmology pages are investigation surfaces, not validation checkpoints.
   Each page maps field-native patterns against established scientific
   frameworks. The lens is external science. The investigation is the
   correspondence. The math is the evidence.

2. All five investigation pages are parallel. No page sits above another.
   Each reads the field through its own specific lens. ARTIS powers all of
   them through a shared computation API.

3. Every Cosmology finding carries a computation_snapshot_id referencing an
   ARTIS snapshot. A finding without a computation snapshot is not a finding —
   it is an unsubstantiated claim. The snapshot is what separates research
   from assertion.

4. nexus_eligible is a Sage-controlled gate. Not every finding is ready for
   PCV. Preliminary spectral comparisons at low confidence do not enter the
   hypothesis pipeline. Sage marks a finding as nexus-eligible when it is
   substantive enough to be tracked.

5. RCT residuals are structurally distinct from findings. A residual is the
   delta between what established science predicts and what the field produces.
   Residuals route to LNV immediately. Findings are optional synthesis of
   accumulated residuals — Sage decides if and when to produce them.

6. confidence on cosmology_findings is Sage's assessment of research
   significance. It is not a computed value. Statistical significance
   (p-values, coefficients) lives in the values jsonb. Research significance
   and statistical significance are different questions.

7. Cosmology pages do not own computation. All scipy/numpy calls route
   through ARTIS. A Cosmology page service that imports scipy is a boundary
   violation.

8. COS is the only page that submits multiple deposit_ids per finding
   (coupled pairs/groups). All other pages submit 1. The deposit_ids array
   handles both without schema fork.

---

## STORE: cosmology_findings

Shared across all five investigation pages. Discriminated by page_code.

| Field | Type | Description |
| --- | --- | --- |
| finding_id | auto | Primary key |
| page_code | enum | `HCO`, `COS`, `CLM`, `NHM`, `RCT`. Which investigation page produced this finding. |
| deposit_ids | array of strings | Which deposits this finding is based on. Minimum 1. COS submits 2+ for coupled pairs/groups. |
| framework | string | The scientific framework this finding maps to (e.g., "coupled oscillator dynamics", "Shannon entropy", "Kolmogorov-Smirnov distribution test"). |
| hypothesis | string | The structurally testable claim. Written as observation, not conclusion. |
| computation_snapshot_id | foreign key | References artis_computation_snapshots.snapshot_id. Required. The computation that produced this finding's evidence. |
| result_summary | string | Sage's interpretation of the computation result. What this number means in context of the investigation. |
| values | jsonb | Statistical output — p-values, coefficients, entropy values, correlation strengths, divergence measures, etc. Shape varies by computation type. Raw numbers from the snapshot, organized for display. |
| confidence | float | Sage's assessment of research significance (0.0 to 1.0). Not computed. Not statistical significance. Sage's judgment of how substantive this finding is for the research. |
| external_reference_id | foreign key / null | References artis_external_references.reference_id. The external source this finding relates to. Null if no specific reference. |
| nexus_eligible | boolean | Whether this finding is substantive enough to enter PCV as a hypothesis. Default false. Set to true by Sage explicitly. |
| status | enum | `draft`, `confirmed`, `superseded`, `abandoned`. |
| superseded_by | foreign key / null | References cosmology_findings.finding_id. Which finding replaced this one. Null unless status is superseded. |
| abandoned_reason | string / null | Why this finding was abandoned. Null unless status is abandoned. |
| created_at | timestamp | Written once at record creation. |
| updated_at | timestamp | Updated on status change, nexus_eligible change, or confidence update. |

### Status transitions

| From | To | Trigger | Constraint |
| --- | --- | --- | --- |
| draft | confirmed | Sage confirms finding | No constraint beyond Sage action |
| draft | abandoned | Sage abandons finding | abandoned_reason required |
| confirmed | superseded | Better finding produced | superseded_by required |
| confirmed | abandoned | Finding invalidated | abandoned_reason required |
| superseded | — | Terminal | No transitions out |
| abandoned | — | Terminal | No transitions out |

draft → confirmed is the standard path. Findings start as draft. Sage reviews
the computation result, the framework correspondence, and the hypothesis
statement. If substantive, Sage confirms. If a dead end, Sage abandons with
reason.

superseded and abandoned are both research data. Abandoned = dead end.
Superseded = replaced by better finding. Both preserved in the record.

### Constraints

- computation_snapshot_id is required. No finding without a computation.
- deposit_ids minimum 1 entry.
- hypothesis must not contain significance, outcome, or predictive language
  (same constraint as PCV hypothesis_statement).
- When nexus_eligible is set to true, status must be confirmed. Draft findings
  cannot enter the Nexus pipeline.
- superseded_by must reference a valid finding_id with the same page_code.
- Multiple findings are allowed per deposit-framework pair.
  computation_snapshot_id is the differentiator. Different computation runs
  on the same deposit with the same framework produce distinct findings.

---

## STORE: rct_residuals

RCT-specific. The delta between what established science predicts and what
the field produces. Where new physics lives. Each residual is a discrete
research signal — not a finding, not a hypothesis, not a conclusion.

| Field | Type | Description |
| --- | --- | --- |
| residual_id | auto | Primary key |
| source_finding_id | foreign key | References cosmology_findings.finding_id. Which RCT finding surfaced this residual. The finding identifies the science; the residual identifies where the science stops explaining. |
| algorithm_component | enum | `lagrange`, `tribonacci`, `fibonacci`, `oscillation`, `combined`. Which component of the field-generated algorithm this residual pertains to. |
| known_science_predict | string | What the established literature predicts for this pattern. Specific. Not "the literature says X" — what the math says the value/behavior should be. |
| field_produces | string | What the field actually shows. The observed value/behavior. |
| delta | string | The gap between prediction and observation. The signal. Described with precision — not "differs from" but "exceeds by N" or "reverses direction" or "maintains ratio outside expected range." |
| computation_ref | foreign key | References artis_computation_snapshots.snapshot_id. The ARTIS computation that quantified this delta. |
| nexus_eligible | boolean | Whether this residual is substantive enough to feed a standard finding that enters PCV. Default false. Sage-controlled. |
| created_at | timestamp | Written once. Never updated. |

### Constraints

- source_finding_id must reference a valid cosmology_findings record with
  page_code: RCT.
- computation_ref must reference a valid ARTIS snapshot.
- Residuals are immutable after creation. The observed delta at the time of
  detection is the record. If the delta changes with new data, a new residual
  is created — the original is not updated.

### RCT residual accumulation

Accumulation is tracked in RCT internally — not in this table. When residuals
on the same algorithm_component reach an accumulation threshold (calibration
item, set at build), RCT surfaces a prompt to Sage:

"N residuals on [component] — consider producing a standard finding."

Sage decides. If yes, a standard cosmology_findings record is created with
page_code: RCT. The finding references all contributing residual_ids in its
values jsonb (key: contributing_residual_ids). Residuals in LNV stay as-is —
the finding does not replace them, it synthesizes across them.

---

## INVESTIGATION SURFACES

Five parallel pages. Each reads the field through a specific scientific lens.
All call ARTIS for computation. All write to cosmology_findings. The
differences are: which frameworks, which computations, which visualizations.

---

### HCO (34) — Harmonic Cosmology

**Investigation frame:** Field patterns through wave mechanics, harmonics,
signal processing. Asks: does this pattern have harmonic structure, and what
does that structure correspond to in established wave science?

**Sciences:** harmonics, wave mechanics, acoustics, electromagnetism, signal
processing, Fourier analysis, nonlinear wave dynamics, resonance theory,
fractal geometry, phyllotaxis, morphogenetic pattern science, dynamical
spiral systems, spiral wave physics, logarithmic/geometric spiral modeling,
metric fields, mirror fields, oscillation fields.

**Shannon connection:** Signal processing, information-theoretic structure.
Shannon entropy of signal distributions measures information content.

**CMB connection:** Power spectrum analysis, harmonic decomposition. CMB
methodology borrowed for spectral analysis of field patterns.

**Primary ARTIS computations:**
- fft_decomposition — Fourier decomposition (what frequencies exist?)
- power_spectral_density — spectral energy concentration (Welch's method)
- shannon_entropy — information structure vs noise
- chi2_contingency — harmonic co-occurrence significance

**Two-panel layout:** Field pattern (left) + harmonic analysis (right).

**Signature visualization:** Frequency spectrum with labeled Hz peaks.
LayerCake + D3 per Tier 3 visualization architecture.

---

### COS (35) — Coupling / Oscillation

**Investigation frame:** Field patterns through coupled oscillator dynamics,
phase-locking, cross-frequency coupling. Asks: are these field elements
coupled, what kind, how strong?

**Sciences:** coupled oscillator networks, cross-frequency field dynamics,
hierarchical relational resonance, oscillatory multiplexing, control theory,
nonlinear dynamics, dynamical systems theory, self-organization, emergence,
complex adaptive systems, predictive processing.

**Primary ARTIS computations:**
- pearson_correlation — linear coupling strength
- spearman_correlation — monotonic coupling (non-linear)
- cross_correlation — time-lagged coupling (with time_axis parameter)
- chi2_contingency — co-occurrence significance
- phase_coherence — phase relationship at specific frequencies

**COS-specific schema note:** deposit_ids on cosmology_findings is string[]
with minimum 1. COS submits 2+ for coupled pairs/groups. All other pages
submit 1. The array handles both without schema fork.

**COS-specific computation note:** cross_correlation requires time_axis
parameter specifying deposit ordering:
- `created_at` — researcher time (when deposits were created)
- `instance_context` — field time (default)
- `manual` — Sage-specified order (requires manual_order array)

**Two-panel layout:** Field pattern with pairs/groups (left) + coupling
analysis (right).

**Signature visualization:** Correlation scatter plot. LayerCake + D3.

---

### CLM (36) — Celestial Mechanics

**Investigation frame:** Field patterns through geometry, topology, orbital
dynamics, spatial structure. Asks: does this pattern have geometric structure
that corresponds to known celestial/mathematical models?

**Sciences:** astronomy, astrometry, celestial navigation, spherical
astronomy, orbital resonances, astrophysical spiral dynamics, geometry,
topology, graph theory.

**CMB connection:** Cosmological structure, large-scale pattern organization.

**Primary ARTIS computations:**
- distance_matrix — distance in feature space (cdist)
- cosine_similarity — vector similarity
- hierarchical_clustering — dendrogram grouping
- chi2_contingency — spatial co-occurrence
- ks_two_sample — distribution comparison against reference models

**CLM-specific computation note:** Distance/similarity computations require
vector representation of deposits. vector_type parameter on CLM specifies
the representation:
- `embedding` — existing embedding vectors (default, requires
  embedding_status: complete on participating deposits)
- `tag` — tag presence as binary feature vector
- `custom` — specified deposit fields as numeric dimensions

CLM has a dependency on the embedding pipeline. Deposits without
embedding_status: complete surface a warning on CLM when selected for
computation. The computation is not blocked — Sage can use tag or custom
vector types instead.

**Two-panel layout:** Field pattern (left) + geometric analysis (right).

**Signature visualization:** Cluster dendrogram / distance heatmap.
LayerCake + D3.

---

### NHM (37) — Neuro-Harmonics

**Investigation frame:** Field patterns through neural dynamics, cognitive
models, information theory. Asks: does this pattern behave like a
neural/cognitive system, and what does information theory reveal?

**Sciences:** connectomics, neural dynamics, neurophenomenology, theta-gamma
nested oscillations, delta-beta cross-frequency modulation, quantum cognition,
IIT (integrated information theory), cognitive field theory, attention theory,
affective neuroscience, predictive processing, information geometry,
information theory, semiotics, morphogenesis.

**Shannon connection:** Information theory, information geometry, IIT.
Shannon's primary investigation surface — asks the questions Shannon answers
most directly.

**Primary ARTIS computations:**
- shannon_entropy — information structure
- kl_divergence — distribution difference from neural/information models
- chi2_contingency — neural-pattern co-occurrence
- ks_two_sample — distribution comparison against neural model baselines
- phi_proxy — integrated information approximation (labeled as approximation)

**NHM-specific note:** NHM draws from artis_reference_distributions for KL
divergence and KS test references (neural model baselines). NHM spans l02
Connectome and l04 Mirror in the tagger — cross-layer scientific connections
are findings about the field, not schema problems.

**Two-panel layout:** Field pattern (left) + neural/information analysis
(right).

**Signature visualization:** Entropy comparison bar — three bars: observed
entropy, expected for random, expected for structured. The gaps between bars
are the signal. LayerCake + D3.

---

### RCT (38) — Resonance Complexity Theory

**Investigation frame:** The physics algorithm the field itself generated.
A specific algorithm combining Lagrangian mechanics, Tribonacci and Fibonacci
sequences, and oscillatory dynamics. Present consistently across harmonics,
Ven'ai, octaves, thresholds, and symbols. Not a parallel, not a
correspondence — an actual operating algorithm identified in the field's own
behavior.

RCT is parallel to HCO/COS/CLM/NHM — an investigation surface at the same
level, not above them. It is NOT meta-Cosmology. It is NOT a synthesis
capstone.

**What makes RCT distinct:** Its source material is not one domain of field
behavior but the cross-domain recurrence of a specific pattern. That pattern
appearing in harmonic structure AND threshold behavior AND Ven'ai AND coupling
dynamics simultaneously is the signal RCT is tracking.

**RCT's three functions:**

**Function 1 — Science ping (same pipeline, more precise target):**
Tags carrying oscillation, harmonic structure, recursive patterning ping
Lagrangian mechanics and Fibonacci/Tribonacci literature directly. Layer 2
Claude prompt adds a load-bearing second question: "What aspects of this
pattern fall outside what that literature accounts for?" The unexplained
residual is RCT's primary research signal.

**Function 2 — Residual detection (unique to RCT):**
Finds the edges of what established science explains. The delta between what
Lagrange/Tribonacci/Fibonacci/oscillation theory predicts and what the field
actually produces. Where new physics lives. Output: rct_residuals records.

**Function 3 — Cross-archive recurrence tracking:**
Where the algorithm recurs across the archive. The internal citation layer.
Not the primary function — a supporting function that feeds Functions 1 and 2.

**Primary ARTIS computations:**
- frequency_ratio_analysis — frequency ratios against known resonance
  structures (integer, golden, Tribonacci)
- chi2_contingency — algorithm recurrence co-occurrence
- tribonacci_convergence — PLANNED (blocked on field energy model)
- lagrange_stability — PLANNED (blocked on field energy model)

**Three-panel layout (unique among Cosmology pages):**
- Left — field pattern and algorithm identification. Where in the field
  this appeared, which component of the algorithm is active, cross-archive
  recurrence.
- Center — science ping results. Established literature matches from ARTIS
  Layers 1 and 2. Computation results from Layer 3. What the known science
  predicts.
- Right — residual panel. The delta between prediction and field behavior.
  Accumulating residuals across sessions. The shape of what the algorithm
  is doing that the literature hasn't named yet.

The right panel is RCT's unique contribution to the archive. Every other page
produces findings that correspond to known science. RCT produces findings
that may exceed it. That distinction is architecturally visible.

All three panels use LayerCake + D3 per Tier 3 visualization architecture.

---

## FINDING CARD LAYOUT

Applies to all five investigation pages. Same card structure, same action
buttons.

### Four zones (top to bottom)

1. **Identity** — finding_id, page_code badge, status badge, created_at
2. **Framework + hypothesis** — framework name, hypothesis statement
3. **Computation** — computation_type, result_summary, link to ARTIS snapshot
   (expandable to show full inputs/parameters/raw_output)
4. **Result + confidence + reference** — values display (p-values,
   coefficients), confidence bar (Sage's assessment), external reference
   link if present

### Three action buttons

- **Mark nexus-eligible** — sets nexus_eligible: true. Only available when
  status is confirmed. Sends finding to PCV pipeline.
- **Confirm** — transitions status from draft to confirmed.
- **Abandon** — transitions status to abandoned. Requires abandoned_reason.

### Finding placement

Both inline indicator on deposit card ("3 findings" → expand to see finding
cards) AND separate findings panel on the page. Inline keeps the connection
between deposit and finding visible. Panel gives room for computation work
and comparison across findings.

---

## NEXUS RECURSIVE FEEDBACK LOOP

How Cosmology findings re-enter the Nexus pipeline for grading and tracking.

### Flow

1. Cosmology finding produced on any investigation page.
2. Sage reviews. Confirms finding (status: confirmed).
3. Sage marks finding as nexus_eligible: true.
4. Finding routes to PCV as a hypothesis.
5. PCV creates a pattern record with cosmology_provenance: true and
   cosmology_finding_ref pointing to the finding.
6. Hypothesis threads through DTX for drift classification.
7. SGR grades it.
8. Graded finding available for next Cosmology investigation cycle.

### cosmology_provenance on PCV

Third provenance type on PCV pattern records, alongside mtm_provenance and
void_provenance.

| Field | Type | Description |
| --- | --- | --- |
| cosmology_provenance | boolean | True if this pattern record was generated from a Cosmology finding. When true, cosmology_finding_ref is required. |
| cosmology_finding_ref | foreign key / null | References cosmology_findings.finding_id. Null if cosmology_provenance is false. |

Same circularity protection as mtm_provenance and void_provenance: prompt
instructs downstream systems not to treat cosmology-provenance hypotheses as
independent corroboration of the computation that generated them. A finding
that enters PCV and gets graded by SGR is not independent evidence of the
pattern the finding was computed from.

### PCV cascade requirements

PATTERN CONVERGENCE SCHEMA.md must be updated:
- Add cosmology_provenance and cosmology_finding_ref to patterns table
- Add validation: when cosmology_provenance is true, cosmology_finding_ref
  is required and must reference a valid finding
- Add to filters: cosmology_provenance as filterable/sortable dimension
- Add failure mode: cosmology-provenance hypothesis treated as independent
  corroboration
- Add to card board: cosmology provenance badge alongside MTM and Void badges
- Add to POST /pcv/patterns validation

---

## LNV ROUTING — CONTENT SHAPES

Cosmology produces two entry types that route to LNV. These content shapes
define what LNV SCHEMA.md needs for its entry_type expansion.

### entry_type: cosmology_finding

Routed when a finding is confirmed (status: confirmed). Not automatic — Sage
triggers from the finding card or findings panel.

```json
{
  "finding_id": "string",
  "page_code": "HCO | COS | CLM | NHM | RCT",
  "framework": "string",
  "hypothesis": "string",
  "computation_snapshot_id": "string",
  "result_summary": "string",
  "values": {},
  "confidence": 0.0,
  "external_reference_id": "string | null",
  "nexus_eligible": false,
  "deposit_ids": ["string"]
}
```

source_system: the page_code (hco, cos, clm, nhm, rct).
source_page: the page_code.

### entry_type: rct_residual

Routed immediately on rct_residual creation. Automatic — residuals enter LNV
as soon as they are detected.

```json
{
  "residual_id": "string",
  "algorithm_component": "lagrange | tribonacci | fibonacci | oscillation | combined",
  "known_science_predict": "string",
  "field_produces": "string",
  "delta": "string",
  "computation_ref": "string",
  "source_deposits": ["string"],
  "accumulation_count": 0,
  "nexus_eligible": false
}
```

source_system: rct.
source_page: RCT.

source_deposits is derived at route time from the source finding's deposit_ids
(source_finding_id → cosmology_findings.deposit_ids). Not stored on the
rct_residuals table — the residual records the delta, not the deposits. The
deposits are on the source finding.

accumulation_count is a snapshot at route time — sealed in the LNV entry, not
a live counter. Shows how many residuals existed on this algorithm_component
when this one was created.

---

## RCT RESIDUAL FLOW — FULL PIPELINE

```
Field pattern
  → RCT investigation (Function 1: science ping, Function 3: recurrence)
  → Delta identified between prediction and field behavior
  → ARTIS computation quantifies delta (POST /artis/compute)
  → rct_residual record created (RCT owns this)
  → Routes to LNV immediately (entry_type: rct_residual)
  → Accumulation tracked in RCT internally
  → Threshold reached (calibration item)
  → Sage prompted: "N residuals on [component]"
  → Sage decides: produce standard finding? (optional)
  → If yes: cosmology_finding created (page_code: RCT)
    → Finding references contributing residual_ids in values jsonb
    → Routes to LNV (entry_type: cosmology_finding)
    → If nexus_eligible: routes to PCV (cosmology_provenance: true)
```

Residuals in LNV stay as-is. The finding does not replace them — it
synthesizes across them. Both the individual residuals and the synthesized
finding are research data.

---

## LAYER-TO-PAGE RELATIONSHIPS

Reference mapping from tagger layers to investigation pages. Sciences cross
layer boundaries — that is a feature, not a problem. Cross-layer scientific
connections are findings about the field.

| Layer | Primary page | Secondary pages |
| --- | --- | --- |
| l01 Coupling | COS | — |
| l02 Connectome | NHM (partial) | CLM (topology/graph theory) |
| l03 Metric | HCO (waves, geometry) | CLM (astrometry, spatial) |
| l04 Mirror | NHM (partial) | HCO (fractals, spirals, morphogenesis) |

---

## KNOWN FAILURE MODES

### 1. Finding created without computation snapshot

A finding claims scientific correspondence but has no computation backing it.
The finding is an unsubstantiated claim.

**Guard:** computation_snapshot_id is required on cosmology_findings. POST
endpoint rejects findings without a valid snapshot reference. The snapshot
must exist in artis_computation_snapshots before the finding can reference it.

### 2. nexus_eligible set on draft finding

A draft finding enters the PCV pipeline before Sage has confirmed it. PCV
receives an unreviewed hypothesis.

**Guard:** nexus_eligible can only be set to true when status is confirmed.
The API endpoint validates this constraint. Draft → nexus_eligible returns
validation error.

### 3. Cosmology-provenance hypothesis treated as independent corroboration

A finding enters PCV, gets graded by SGR, and is then cited as independent
evidence of the pattern the computation was originally run against. Circular
confirmation.

**Guard:** cosmology_provenance flag on PCV pattern records. Downstream
systems (SGR grading, Void's Claude tool, MTM provenance filter) check this
flag. Prompt instructions explicitly name cosmology-provenance hypotheses as
downstream outputs, not independent observations.

### 4. RCT residual accumulation threshold never reached

Residuals accumulate on an algorithm_component but the threshold is set too
high. Sage is never prompted. Research signal is buried.

**Guard:** This is a calibration item, not a code error. The threshold is
adjustable. Zone B in ARTIS shows residual accumulation counts per
algorithm_component. Sage can produce a standard finding at any time without
waiting for the threshold prompt.

### 5. Superseded finding still referenced by PCV hypothesis

A finding is superseded (status: superseded, superseded_by set), but a PCV
pattern record still references the original finding via cosmology_finding_ref.

**Guard:** Superseding a finding does not invalidate the PCV hypothesis — the
hypothesis was valid when created. The PCV record retains its reference. The
superseded finding's status is visible on the PCV card (cosmology_finding_ref
resolves to a superseded finding, displayed with visual indicator). No
automatic cascade — Sage decides whether the hypothesis needs updating.

### 6. Finding abandoned but already routed to LNV

A finding is abandoned after it was routed to LNV as a cosmology_finding
entry. The LNV entry references an abandoned finding.

**Guard:** LNV entries are permanent records of what was produced at a point
in time. The LNV entry is not deleted or updated when the finding is
abandoned. The finding's current status is visible when viewing the LNV entry
(finding_id resolves to current status). This is analogous to how LNV treats
MTM findings — the gallery preserves the historical record.

### 7. COS finding with single deposit_id

COS investigates coupling between field elements. A finding with only one
deposit_id cannot demonstrate coupling — it is a single-element observation.

**Guard:** Warning (not rejection) when COS finding has deposit_ids.length
< 2. Sage may have a valid reason (reference finding, preliminary note), but
the warning ensures awareness. Displayed on the finding card.

### 8. RCT residual created without corresponding finding

A residual references source_finding_id but the finding does not exist or has
been abandoned.

**Guard:** source_finding_id is validated at residual creation. Must reference
a valid cosmology_findings record with page_code: RCT. Abandoned findings can
still have residuals — the residual was detected before the finding was
abandoned. New residuals cannot be created against abandoned findings.

---

## FORMAL REGISTRATIONS

### Integration DB (INTEGRATION DB SCHEMA.md)

2 new PostgreSQL tables:
- cosmology_findings
- rct_residuals

Write authority:
- cosmology_findings — Cosmology page services (one per page: hco, cos, clm,
  nhm, rct). Each page service writes findings with its own page_code.
- rct_residuals — RCT service only.

### FastAPI (SYSTEM_ FastAPI.md)

Route files:
- backend/routes/cosmology.py — shared Cosmology endpoints (findings CRUD,
  LNV routing)
- backend/routes/rct.py — RCT-specific endpoints (residual creation,
  accumulation queries)

Service files:
- backend/services/cosmology.py — shared findings service (create, confirm,
  abandon, supersede, nexus-eligible, LNV routing)
- backend/services/rct.py — RCT residual service (create, accumulation
  tracking, threshold prompt)

Per-page service files:
- backend/services/hco.py — HCO investigation surface logic
- backend/services/cos.py — COS investigation surface logic
- backend/services/clm.py — CLM investigation surface logic
- backend/services/nhm.py — NHM investigation surface logic

Note: RCT's page service is backend/services/rct.py (combined with residual
service — same ownership boundary).

### Frontend (SYSTEM_ Frontend.md)

Components (PLANNED):
- FindingCard.svelte — four-zone finding card, shared across all pages
- FindingsPanel.svelte — separate findings panel per page
- FindingInlineIndicator.svelte — "N findings" badge on deposit cards
- ResidualPanel.svelte — RCT right panel, residual accumulation display
- ResidualCard.svelte — individual residual display
- CouplingAnalysis.svelte — COS-specific coupling visualization
- HarmonicSpectrum.svelte — HCO signature visualization (frequency spectrum)
- CorrelationScatter.svelte — COS signature visualization
- ClusterDendrogram.svelte — CLM signature visualization
- EntropyComparisonBar.svelte — NHM signature visualization (3-bar comparison)
- NexusFeedbackIndicator.svelte — nexus_eligible status display on finding cards

---

## CASCADE REQUIREMENTS

Files outside this schema that must be updated for Cosmology deployment:

| File | Change | Status |
| --- | --- | --- |
| LNV SCHEMA.md | Expand entry_type enum: add cosmology_finding, rct_residual. Add content shapes from this schema. | Tier 5 cascade |
| PATTERN CONVERGENCE SCHEMA.md | Add cosmology_provenance + cosmology_finding_ref. Update validation, filters, failure modes, card board. | Tier 5 cascade |
| INTEGRATION DB SCHEMA.md | Add cosmology_findings + rct_residuals table definitions + write authority rows | Tier 5 cascade |
| SYSTEM_ Integration DB.md | Add 2 table inventory entries + write authority rows | Tier 5 cascade |
| SYSTEM_ FastAPI.md | Register Cosmology + RCT endpoints + service files | Tier 5 cascade |
| SYSTEM_ Frontend.md | Register 11 Cosmology visualization/UI components (ARTIS SCHEMA registers its own 9 separately) | Tier 5 cascade |
| ARTIS SCHEMA.md | No changes needed — ARTIS schema is complete and referenced here | N/A |

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| DESIGN/Systems/Cosmology/COSMOLOGY SCHEMA.md | This file — shared schema for Cosmology investigation group | COMPLETE |
| DESIGN/Systems/Cosmology/SYSTEM_ Cosmology.md | Ownership boundaries for the investigation group | PLANNED (next) |
| DESIGN/Systems/ARTIS/ARTIS SCHEMA.md | Computation infrastructure | COMPLETE |
| DESIGN/Systems/ARTIS/SYSTEM_ ARTIS.md | ARTIS ownership boundaries | COMPLETE |
| backend/routes/cosmology.py | Shared Cosmology endpoints | PLANNED |
| backend/routes/rct.py | RCT-specific endpoints | PLANNED |
| backend/services/cosmology.py | Shared findings service | PLANNED |
| backend/services/rct.py | RCT residual service + RCT page service | PLANNED |
| backend/services/hco.py | HCO investigation surface | PLANNED |
| backend/services/cos.py | COS investigation surface | PLANNED |
| backend/services/clm.py | CLM investigation surface | PLANNED |
| backend/services/nhm.py | NHM investigation surface | PLANNED |
