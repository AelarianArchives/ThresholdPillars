# PATTERN CONVERGENCE SCHEMA

## PCV · V1

## /DESIGN/Systems/Pattern_Convergence/PATTERN CONVERGENCE SCHEMA.md

Mechanical spec — hypothesis record shape, three provenance types (MTM, Void,
Cosmology), card board and network graph visualizations, hypothesis_id format,
pattern record creation, status transitions, validation, failure modes.

---

## OWNERSHIP BOUNDARIES

### OWNS

- patterns PostgreSQL table — record creation and status transitions
- hypothesis_id assignment — the structural thread connecting PCV to DTX and SGR
- Cross-domain signal aggregation — observing and logging patterns as structurally testable hypotheses
- MTM Finding integration — receiving MTM Findings as pre-processed input via LNV, tracking mtm_provenance on pattern records
- Void absence integration — receiving Void absence hypotheses (types A, D), tracking void_provenance on pattern records
- Pattern status management — active/archived transitions
- hypothesis_ref production — the hypothesis_id that DTX classifies against and SGR grades
- Card board display — primary working surface, filterable/sortable hypothesis cards
- Network graph display — secondary analytical view, domain-as-node topology

### DOES NOT OWN

- Drift event classification — owned by DTX (DTX receives hypothesis_id from PCV and classifies against it)
- Signal grading — owned by SGR
- MTM synthesis — owned by MTM (MTM produces Findings; PCV reads them from LNV as pre-processed input)
- Void absence detection — owned by Void (Void detects absence patterns; types A and D enter PCV as hypotheses)
- PostgreSQL reads outside patterns table — owned by FastAPI service layer (backend/services/)
- Routing authority — owned by SOT
- Outcome determination — owned by SGR. PCV does not confirm outcomes.
- Bayesian inference — owned by SGR

---

## STRUCTURAL RULES

1. Every aggregated pattern carries required metadata fields: domain_of_origin,
   timestamp, interval, coupling_vector, hypothesis_id, source_signals,
   hypothesis_statement. All required. A pattern record missing any field is
   incomplete and does not feed DTX or SGR.

2. MTM Findings arrive as pre-processed input — not raw deposit. They are not
   equivalent to unprocessed cross-domain signal. mtm_provenance flag
   distinguishes them. Their provenance chain remains intact and traceable on
   the record. PCV reads MTM Findings from LNV via
   GET /api/lnv/entries?entry_type=mtm_finding.

3. Void absence hypotheses (types A, D) arrive with void_provenance flag.
   They are absence claims — structurally distinct from presence-based
   hypotheses. void_finding_ref links to the originating Void absence record.
   They thread through DTX → SGR like any other hypothesis.

3a. Cosmology findings marked nexus_eligible arrive with cosmology_provenance
    flag. They are computation-backed hypotheses — structurally distinct from
    direct observations. cosmology_finding_ref links to the originating
    cosmology_findings record. They thread through DTX → SGR like any other
    hypothesis. Circularity protection: downstream systems do not treat these
    as independent corroboration of the computation that generated them.

4. PCV does not assign significance. PCV does not assign predictive weight. PCV
   does not confirm outcomes. Patterns are observed and logged as structurally
   testable hypotheses. Nothing more.

5. PCV must not pre-bias DTX or SGR. A pattern record that contains significance
   language, outcome language, or predictive weight is a structural violation.

6. Domain distinctions remain intact throughout. The system view never flattens
   what the source pages kept distinct. Every pattern is traceable to its
   originating signals via source_signals[].

7. When X shifts in one domain and Y reliably follows in another: name the
   interval, name the vector, log the relationship as a hypothesis. The interval
   and coupling vector are required fields, not optional annotations.

8. Provenance flags (mtm_provenance, void_provenance, cosmology_provenance)
   are first-class metadata. Downstream systems (DTX, SGR, Void's Claude tool,
   MTM's provenance filter) read these flags to distinguish independent
   observations from downstream outputs. A hypothesis with any provenance flag
   is not independent corroboration of the system that generated it.

---

## HYPOTHESIS ID FORMAT

Format: `H · [YYYY-MM] · [SEQ]`

SEQ: query patterns for highest existing SEQ at same YYYY-MM. Increment by 1.
Start at 1 if none exist.

Example: `H · 2026-03 · 001`

Scope: unique system-wide. This ID is the structural thread connecting the
pattern record in PCV to its drift event in DTX and its signal grade in SGR. It
must remain stable and unmodified after assignment.

---

## STORE: patterns

| Field | Type | Description |
| --- | --- | --- |
| id | auto | Primary key |
| hypothesis_id | string | H · [YYYY-MM] · [SEQ]. Assigned at record creation. Never changes after assignment. Structural thread to DTX and SGR. |
| domain_of_origin | array of strings | All source domain page codes contributing to this pattern. Minimum one. Populated from source_signals[]. |
| timestamp | timestamp | Session date at which the pattern was first observed. Written once at record creation. Never updated. |
| interval | string / null | Named interval between correlated domain shifts. Required when the pattern describes cross-domain movement. Null only for single-domain observations with no temporal coupling component. |
| coupling_vector | string | Named description of the directional relationship between correlated signals. Required. Not a free-text annotation — a named structural vector with direction and domain endpoints. |
| source_signals | array of objects | Traceable links to the specific signals this pattern emerged from. Element structure: { page_code, signal_ref, note }. Minimum one entry. |
| hypothesis_statement | text | The structurally testable claim this pattern record represents. Written as observation, not conclusion. No significance language. No outcome language. |
| mtm_provenance | boolean | True if this pattern record was generated from or incorporates an MTM Finding. When true, mtm_finding_ref is required. |
| mtm_finding_ref | foreign key / null | References findings.id in MTM schema. Null if mtm_provenance is false. |
| void_provenance | boolean | True if this hypothesis originated from Void absence detection (types A or D). When true, void_finding_ref is required. |
| void_finding_ref | string / null | References Void absence record. Null if void_provenance is false. |
| cosmology_provenance | boolean | True if this hypothesis originated from a Cosmology finding marked nexus_eligible. When true, cosmology_finding_ref is required. |
| cosmology_finding_ref | foreign key / null | References cosmology_findings.finding_id. Null if cosmology_provenance is false. |
| status | enum | `active`, `archived`. active: pattern is live, feeding DTX. archived: pattern resolved, superseded, or closed by SGR outcome. |
| created_at | timestamp | Written once at record creation. Never updated. |

### Provenance types

Three provenance types exist on pattern records. Each marks a hypothesis as
originating from a system output rather than direct observation. Downstream
systems check these flags to prevent circular confirmation.

| Flag | Source | Ref field | Protection |
| --- | --- | --- | --- |
| mtm_provenance | MTM Finding | mtm_finding_ref | Not independent corroboration of MTM synthesis |
| void_provenance | Void absence detection (types A, D) | void_finding_ref | Not independent corroboration of absence pattern |
| cosmology_provenance | Cosmology finding (nexus_eligible) | cosmology_finding_ref | Not independent corroboration of the computation that generated it |

---

## VISUALIZATIONS

Two views: card board (primary working surface) + network graph (secondary
analytical view). Toggle or tab, not one replacing the other. LayerCake + D3
per Tier 3 visualization architecture (SVG instrument category).

### Card board (primary)

Each active hypothesis is a card. Filterable, sortable.

**Card shows:**

| Element | Source |
| --- | --- |
| hypothesis_id | patterns.hypothesis_id |
| hypothesis_statement | Truncated, expand on click |
| domain_of_origin | Colored badges (per-page accent color) |
| status | active / archived |
| MTM provenance flag | Visually distinct badge. MTM-generated vs direct observation. |
| Void provenance flag | Visually distinct badge. Void-generated absence claim. |
| Cosmology provenance flag | Visually distinct badge. Cosmology-finding-generated hypothesis. |
| created_at | Date |

**Filters:** by domain, by status, by MTM provenance, by void provenance, by
cosmology provenance, by date range. All combinable.

**Sort:** by date, by domain count, by provenance type.

**Click expands:** full hypothesis_statement, source_signals with page_code and
deposit_id links, coupling_vector, interval, DTX/SGR thread (drift event status,
current grade if exists).

**Provenance as first-class filter dimension:** "Which hypotheses did the system
generate vs which came from direct observation" is a research question. All
three provenance types (MTM, Void, Cosmology) are filterable and sortable as
first-class dimensions — not footnotes.

### Network graph (secondary)

Domains as nodes, hypotheses as weighted edges.

**Structure:**
- Each domain (page) is a node positioned in the graph.
- Each hypothesis connecting two or more domains becomes an edge (or weighted
  edge when multiple hypotheses connect the same pair).
- Edge thickness = hypothesis count between those domains.

**Visual answers:**
- Which domains talk to each other most
- Which are isolated
- Where convergence is densest
- Where structural holes are

**Interaction:**
- Click an edge → see the hypotheses connecting those two domains.
- Isolated nodes (domains with no cross-domain hypotheses) are immediately
  visible — analytically significant.

**Data mapping:** domain_of_origin on each pattern defines which nodes to
connect. Pattern count gives edge weight.

---

## SEQUENCES

### Pattern record creation — strict order

1. Receive observation data: domain_of_origin, timestamp, interval (if
   applicable), coupling_vector, source_signals, hypothesis_statement,
   mtm_provenance flag, void_provenance flag, cosmology_provenance flag.

2. Validate all required fields present — domain_of_origin (min one entry),
   coupling_vector, source_signals (min one entry), hypothesis_statement.
   Reject if any missing. No partial record written.

3. Validate hypothesis_statement contains no significance, outcome, or
   predictive language. Reject if violation found. No write occurs.

4. If mtm_provenance true: validate mtm_finding_ref is present and references
   a valid findings record. Reject if absent. No write occurs.

5. If void_provenance true: validate void_finding_ref is present and references
   a valid Void absence record. Reject if absent. No write occurs.

5a. If cosmology_provenance true: validate cosmology_finding_ref is present and
    references a valid cosmology_findings record with nexus_eligible: true.
    Reject if absent or if finding is not nexus_eligible. No write occurs.

6. Assign hypothesis_id: query patterns for highest existing SEQ at same
   YYYY-MM. Increment by 1. Start at 1 if none exist.
   Format: H · [YYYY-MM] · [SEQ].

7. Write pattern record: all fields, status → active, created_at = timestamp.
   hypothesis_id is now available for DTX and SGR.

Failure at step 2, 3, 4, 5, or 5a: record rejected. No write occurs.
Failure at step 7: PostgreSQL write failure. No partial record written.
Re-submission required.

### Status transition — active → archived

1. Receive archive trigger: hypothesis_id + resolution_ref (DTX drift event id
   or SGR outcome record). resolution_ref required — no archive without it.

2. Write status → archived on pattern record.

Failure at step 2: status remains active. Retry permitted.

---

## PUBLIC API

### POST /pcv/patterns

Validates all required fields, checks hypothesis_statement for violation
language, validates mtm_finding_ref when mtm_provenance is true, validates
void_finding_ref when void_provenance is true, validates cosmology_finding_ref
when cosmology_provenance is true (must reference nexus_eligible finding),
assigns hypothesis_id, writes pattern record. Returns hypothesis_id. This is
the value DTX receives as hypothesis_ref and SGR receives for grading.

### PATCH /pcv/patterns/{hypothesis_id}/archive

Transitions pattern status from active to archived. resolution_ref must be
present — a reference to the DTX drift event or SGR outcome that resolved the
pattern. No archive without a resolution reference.

### GET /pcv/patterns

Query active and/or archived patterns. Filterable by domain_of_origin, status,
mtm_provenance, void_provenance, cosmology_provenance, date range. Sortable by
date, domain count, provenance type. Paginated.

---

## KNOWN FAILURE MODES

### 1. Pattern record created without source_signals

Pattern has no traceable provenance. Cannot be linked to originating
observations. Domain distinctions are lost. DTX and SGR receive a hypothesis
with no observable basis.

**Guard:** source_signals minimum one entry validated at record creation. Record
rejected before write if source_signals is absent or empty.

### 2. Hypothesis statement contains significance or outcome language

PCV pre-biases DTX and SGR before they run. The structural neutrality that makes
the pattern testable is violated before the pattern is observed.

**Guard:** hypothesis_statement validated at record creation. Statements
containing significance, outcome, or predictive language are rejected. No write
occurs.

### 3. Hypothesis_id modified after assignment

The structural thread connecting PCV to DTX and SGR is broken. Drift events and
signal grades lose their pattern reference. Data integrity across all three
systems fails.

**Guard:** hypothesis_id written once at record creation. Never updated. No write
path accepts a hypothesis_id modification after assignment.

### 4. mtm_provenance true with mtm_finding_ref null

MTM Finding provenance is claimed but not traceable. The provenance chain is
lost. The pre-processed status of the pattern cannot be verified.

**Guard:** when mtm_provenance is true, mtm_finding_ref is required and
validated at record creation. Record rejected if mtm_finding_ref is absent.

### 5. void_provenance true with void_finding_ref null

Void absence provenance is claimed but not traceable. The originating absence
record cannot be verified. The void-provenance circularity filter cannot
function without the reference.

**Guard:** when void_provenance is true, void_finding_ref is required and
validated at record creation. Record rejected if void_finding_ref is absent.

### 5a. cosmology_provenance true with cosmology_finding_ref null or non-nexus finding

Cosmology provenance is claimed but not traceable, or the referenced finding
is not nexus_eligible. The provenance chain is broken. The circularity filter
cannot function without the reference.

**Guard:** when cosmology_provenance is true, cosmology_finding_ref is required,
must reference a valid cosmology_findings record, and that record must have
nexus_eligible: true. Record rejected if any condition fails.

### 6. Pattern archived without resolution_ref

Pattern status transitions to archived with no DTX or SGR reference. The
resolution is structurally invisible — no downstream system can determine why
the pattern closed.

**Guard:** archive trigger must carry a resolution_ref. Status transition
without resolution_ref is rejected.

### 7. Provenance-flagged hypothesis treated as independent corroboration

Downstream systems (SGR, Void's Claude tool, MTM, Cosmology) read a
provenance-flagged hypothesis as if it were independent evidence of the pattern
that generated it. Confirmation loop.

**Guard:** All three provenance flags (mtm_provenance, void_provenance,
cosmology_provenance) exist precisely for this. All downstream systems reading
PCV data check these flags. Prompt instructions for Void, MTM, and Cosmology
explicitly flag provenance-tagged hypotheses as downstream outputs. SGR grading
does not treat provenance-flagged hypotheses differently in computation, but
the grade is legible as "grade of a system-generated hypothesis" through the
provenance chain.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| backend/services/convergence.py | PCV service — pattern record creation, hypothesis_id assignment, provenance validation, status transitions, query/filter | PLANNED |
| backend/routes/convergence.py | FastAPI PCV endpoints — POST /pcv/patterns, PATCH /pcv/patterns/{id}/archive, GET /pcv/patterns | PLANNED |
