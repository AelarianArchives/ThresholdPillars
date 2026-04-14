# PIPELINE CONTRACT 1 — INT → AXIS → MTM → LNV

## Full deposit-to-finding pipeline

## /DESIGN/Systems/Pipeline_Contracts/PIPELINE CONTRACT 1 — INT TO LNV.md

End-to-end contract tracing a deposit from INT gateway through the five
Axis engine lenses, MTM synthesis, and LNV receive. Every handoff, payload
shape, trigger mechanism, and failure path documented. No new design — this
assembles existing schema definitions into one flow.

---

## SOURCE REFERENCES

Each section references the schema that owns the definition. This contract
does not override any source schema. If a conflict is found between this
document and a source schema, the source schema wins.

| Schema | Owns |
|--------|------|
| INTEGRATION SCHEMA.md | Deposit creation, field shape, atomicity boundary, gateway contract |
| INTEGRATION DB SCHEMA.md | Database tables for deposits, root entries, manifests |
| ENGINE COMPUTATION SCHEMA.md | Shared 4-step architecture, baseline formula, stale flags, snapshots |
| THRESHOLD ENGINE SCHEMA.md | THR: Index, Compute (3 computations), Visualize, Feed |
| ECHO RECALL ENGINE SCHEMA.md | ECR: Index, Compute (3 computations, scaled), Visualize, Feed |
| INFINITE INTRICACY ENGINE SCHEMA.md | INF: Index, Compute (3 computations), Visualize, Feed, Cosmology boundary |
| STARROOT ENGINE SCHEMA.md | STR: Index, Compute (2 phases), Visualize, Feed |
| SAT NAM ENGINE SCHEMA.md | SNM: Index, Compute (2 streams), Visualize, Feed |
| METAMORPHOSIS SCHEMA.md | MTM: Trigger, engine read, two-pass synthesis, Finding production |
| LNV SCHEMA.md | Receive contract, content shapes, gallery display |
| DAILY NEXUS ROUTINE SCHEMA.md | DNR: session close orchestration, MTM trigger, LNV routing |
| SYSTEM_ Metamorphosis.md | MTM architectural identity |
| SYSTEM_ LNV.md | LNV architectural identity |

---

## PIPELINE OVERVIEW

```
  Sage / AI
     │
     ▼
  ┌─────────────────────────────────────────────────┐
  │  INT GATEWAY                                     │
  │  POST /api/deposits/create                       │
  │  Validate → Duplicate check → Create record      │
  │  ─── ATOMICITY BOUNDARY ───                      │
  │  Assign stamp → Trigger embedding → Route to     │
  │  pages                                           │
  └────────────────────┬────────────────────────────┘
                       │ pages[] array routing
          ┌────────────┼────────────────────┐
          ▼            ▼                    ▼
  ┌──────────┐  ┌──────────┐        ┌──────────┐
  │ THR (02) │  │ STR (03) │  ...   │ SNM (06) │
  │ ECR (05) │  │ INF (04) │        │          │
  └────┬─────┘  └────┬─────┘        └────┬─────┘
       │              │                   │
       │  Stale flag set in SQLite        │
       │  (per engine, on deposit)        │
       │              │                   │
       ▼              ▼                   ▼
  ┌─────────────────────────────────────────────────┐
  │  ENGINE 4-STEP PIPELINE (per engine)             │
  │  1. INDEX   — read deposit fields, index by lens │
  │  2. COMPUTE — engine-specific computations       │
  │  3. VISUALIZE — SVG instruments from results     │
  │  4. FEED    — snapshot to engine_snapshots table  │
  └────────────────────┬────────────────────────────┘
                       │ MTM pulls (not push)
                       ▼
  ┌─────────────────────────────────────────────────┐
  │  MTM SYNTHESIS (triggered by DNR at session      │
  │  close only)                                     │
  │  Engine read → Threshold filter (1.2x) →         │
  │  Pass 1 (hypothesis) → Selection Function →      │
  │  Pass 2 (verification) → Finding production      │
  └────────────────────┬────────────────────────────┘
                       │ Result object to DNR
                       ▼
  ┌─────────────────────────────────────────────────┐
  │  DNR routes Findings to LNV                      │
  │  POST /api/lnv/receive                           │
  │  entry_type: mtm_finding                         │
  └─────────────────────────────────────────────────┘
```

---

## STAGE 1 — INT GATEWAY

**Source:** INTEGRATION SCHEMA.md — INT GATEWAY section

### Entry point

`POST /api/deposits/create`

Deposits enter the archive exclusively through INT. No exceptions. This is
the INT gateway invariant from CLAUDE.md.

### Request payload

```
{
  session_id:            string
  chunk_id:              string | null
  parse_version:         string | null
  content:               string              — REQUIRED
  doc_type:              string              — REQUIRED (entry | observation |
                                               analysis | hypothesis |
                                               discussion | transcript |
                                               glyph | media | reference)
  source_format:         string              — REQUIRED (digital | handwritten |
                                               scan | image | audio | file | json)
  tags:                  string[]            — REQUIRED (may be empty)
  pages:                 string[]            — REQUIRED, routing targets (1+)
  observation_presence:  positive | null     — REQUIRED for observation,
                                               analysis, hypothesis
  confidence:            clear | emerging | raw | null
  deposit_weight:        high | standard | low — REQUIRED
  notes:                 string | null
  source_type:           field | generated   — REQUIRED
  authored_by:           string              — REQUIRED
  node_id:               string              — REQUIRED
  instance_context:      string              — REQUIRED
  provenance:            {
    source:              manual | ai_parsed | ai_suggested_sage_confirmed
    correction_applied:  boolean
    original_suggestion: object | null
  }
}
```

### Atomicity boundary

```
  Step 1: validate              — fails → 400, nothing created
  Step 2: duplicate check       — fails → 409, nothing created
  Step 3: create deposit record — fails → 500, nothing created
  ─────── ATOMICITY BOUNDARY ──────────────────────────────────
  Step 4: assign stamp          — fails → deposit exists, stamp pending
  Step 5: trigger embedding     — fails → deposit exists, embedding failed
  Step 6: route to pages        — fails → deposit exists, routing failed
```

After the boundary, the deposit record exists in PostgreSQL regardless of
downstream failures. Steps 4-6 are recoverable.

### Success response

```
{
  deposit_id:         string
  stamp:              string          — composite ID stamp
  status:             created
  routing_confirmed:  string[]        — pages successfully notified
  embedding_status:   queued | skipped
  created_at:         timestamp
}
```

### Failure response

```
{
  error_code:      duplicate | validation_failed | routing_failed
                   | embedding_queued_failed
  failed_at_step:  string
  deposit_id:      string | null
  partial_state:   object | null
  retry_safe:      boolean
}
```

### What the `pages` array determines

The `pages` array is the routing instruction. It names which pages receive
this deposit. For the Axis pipeline, a deposit routed to any of the five
Axis pages (02 THR, 03 STR, 04 INF, 05 ECR, 06 SNM) enters that engine's
INDEX step. A single deposit may route to multiple pages simultaneously —
each engine indexes independently.

---

## STAGE 2 — DEPOSIT RECORD SHAPE

**Source:** INTEGRATION SCHEMA.md — DEPOSIT RECORD section

The deposit record is the universal input to all downstream systems. Every
field listed here is what engines read from.

```
  id                    — auto
  stamp                 — composite ID (TS · AX · [PHASE] · [YYYY-MM] · [SEQ])
  content               — text (the deposit body)
  doc_type              — enum (entry | observation | analysis | hypothesis |
                          discussion | transcript | glyph | media | reference)
  source_format         — enum (digital | handwritten | scan | image | audio |
                          file | json)
  tags                  — string[] (full tag array with routing metadata)
  pages                 — string[] (routing targets)
  phase_state           — one of 12 threshold states or null
  observation_presence  — positive | null
  confidence            — clear | emerging | raw | null
  deposit_weight        — high | standard | low
  notes                 — string | null
  source_type           — field | generated
  authored_by           — string
  node_id               — string
  instance_context      — string
  provenance            — jsonb
  created_at            — timestamp
```

---

## STAGE 3 — STALE FLAG AND COMPUTE TRIGGER

**Source:** ENGINE COMPUTATION SCHEMA.md — HYBRID COMPUTE TRIGGER section

### Mechanism

When a deposit lands on an engine's page, the engine's stale flag is set to
`true` in the SQLite operational DB (`engine_stale_flags` table, one row per
engine: thr, str, inf, ecr, snm).

Engines do NOT recompute on every deposit. The stale flag debounces.
Recomputation happens on demand via three triggers:

1. **PAGE VIEW** — page is viewed while stale. Recompute, cache, clear flag.
2. **BATCH WINDOW CLOSE** — after batch review completes. One recompute for
   the entire batch.
3. **MTM PULL** — MTM requests engine output for synthesis. Stale engines
   refresh before delivering. MTM always reads fresh data.

### Batch optimization

During batch review (30+ deposits potentially landing in sequence), the
engine stays stale until someone needs the results. No thrashing. This is
the primary purpose of the stale flag.

### Default state

All engines default to stale (`true`) on first load — forces initial
compute.

---

## STAGE 4 — ENGINE 4-STEP PIPELINE

**Source:** ENGINE COMPUTATION SCHEMA.md — shared architecture; individual
engine schemas for engine-specific behavior

Every Axis engine follows the same four steps. The shared behavior is
defined in ENGINE COMPUTATION SCHEMA. Engine-specific behavior is defined
in the engine's own schema.

### Step 1 — INDEX

Deposit arrives on the engine's page. Engine reads specific fields from the
deposit record and indexes by its analytical lens.

| Engine | Page | Lens | Fields read | Indexes by |
|--------|------|------|-------------|------------|
| THR | 02 | Threshold co-occurrence | phase_state, tags (th01-th12), deposit_weight, observation_presence, created_at, id | Which threshold(s) present in tags. phase_state indexed independently if it names a threshold not in tags |
| STR | 03 | Ven'ai root clusters | tags (matched against venai_names.root_cluster), deposit_weight, observation_presence, created_at, id | Which root family/families the deposit touches |
| INF | 04 | Scientific domain layers | tags (layer_id resolved through inf_layer_bridge to INF domains), deposit_weight, observation_presence, created_at, id | Which INF domain(s) via bridge table |
| ECR | 05 | Signal seed presence | tags (routed to s01-s19), deposit_weight, observation_presence, created_at, id | Which signal seed(s) represented. Multiple tags → same seed = one presence |
| SNM | 06 | Structural correspondence | tags (tradition references, pattern category signals, structural markers), content (fed to Claude), deposit_weight, observation_presence, created_at, id | Pattern category signals (ancient_philosophy/triadic_architecture/celestial/uncategorized) + tradition references |

After indexing, stale flag is set to `true` in SQLite.

### Step 2 — COMPUTE

All engines use the shared baseline formula from ENGINE COMPUTATION SCHEMA:

- **Observed rate:** weighted count of pattern / total weighted examined
- **Expected rate (baseline):** marginal product of independent element frequencies
- **Ratio:** observed / expected
- **Signal band:** suppressed (below 1.0x) | mild (1.0-2.0x) | strong (2.0x+) | null (insufficient data)

Deposit weight constants (from backend config, never hardcoded):
- `DEPOSIT_WEIGHT_HIGH = 2.0`
- `DEPOSIT_WEIGHT_STANDARD = 1.0`
- `DEPOSIT_WEIGHT_LOW = 0.5`

Every computation result carries: weight_breakdown (high/standard/low
counts) and null_contribution (null/positive counts and weighted sums).

**Engine-specific computations:**

| Engine | Computations | Combinatorial scale |
|--------|-------------|---------------------|
| THR | Co-occurrence (66 pairs), Presence (12 thresholds), Sequence detection (pairs + triples) | 12 thresholds |
| STR | Root cluster analysis (presence, co-occurrence, emergence timeline) + Correlation integration from Ven'ai service | Dynamic (N clusters) |
| INF | Layer presence (5 domains), Intersection (10 pairs), Emergence timeline + Dormancy detection | 5 domains |
| ECR | Co-occurrence (171 pairs), Presence (19 signals), Sequence detection (pairs + triples) | 19 signals — most data-dense |
| SNM | Stream 1: Sage's observations (tradition presence, co-occurrence, pattern category rates). Stream 2: Claude API structural analysis (per-deposit + batch mode). Stream agreement classification | Open sets + Claude API |

**Pattern ID formats** (deterministic, stable, per engine):

```
  THR: thr_cooc_th01_th05, thr_pres_th01, thr_seq_th01_th05
  STR: str_pres_kai, str_cooc_kai_sha, str_emrg_kai,
       str_corr_vn_kaithera_001_phase_th01
  INF: inf_pres_harmonic_cosmology, inf_isct_coupling_oscillation_neuro_harmonics,
       inf_emrg_mirror_dynamics
  ECR: ecr_cooc_s01_s05, ecr_pres_s01, ecr_seq_s01_s13
  SNM: snm_s1_pres_vedic, snm_s1_cooc_vedic_hermetic,
       snm_s1_cat_ancient_philosophy, snm_corr_threshold_triadic_vedic_trinity
```

### Step 3 — VISUALIZE

All visualizations are SVG instruments rendered via LayerCake + D3 utilities.
All render from computed results (engine result object), never from raw
deposit data. Signal band determines visual weight — everything renders,
visual weight does the filtering.

| Engine | Visualizations |
|--------|---------------|
| THR | Co-occurrence matrix (12x12), Presence timeline, Sequence view |
| STR | Root cluster map (force-directed), Correlation matrix (filterable by type), Drift alert panel, Name index |
| INF | Density field map (d3-contour), Emergence timeline, Intersection detail |
| ECR | Correlation matrix (19x19, d3-zoom), Signal constellation (d3-force, stateful drift), Presence timeline, Sequence view |
| SNM | Bipartite force-directed graph (field patterns ↔ traditions, tradition nodes colored by pattern_category, uncategorized cluster explicit), Temporal correspondence view |

Visualization snapshots are Sage-triggered (not automatic). Captured to LNV
via `POST /api/lnv/receive` with `entry_type: engine_snapshot`.

### Step 4 — FEED

**Source:** ENGINE COMPUTATION SCHEMA.md — ENGINE STATE SNAPSHOTS section

On computation completion:

1. Engine result object assembled
2. `engine_snapshots` record written to PostgreSQL:
   - `snapshot_id` — text, primary key
   - `engine_code` — thr | str | inf | ecr | snm
   - `computed_at` — timestamp
   - `snapshot_data` — jsonb (engine-specific structure)
   - `deposit_count` — integer (corpus size at computation time)
   - `mtm_read_at` — timestamp, nullable (set when MTM consumes)
3. Stale flag cleared in SQLite
4. Results served to requester (page view, MTM pull, or batch close)

**MTM drift tracking:** `mtm_read_at` marks when MTM consumed a snapshot.
On next synthesis, MTM reads the current snapshot + the previous snapshot
where `mtm_read_at IS NOT null` + computes the delta. This is how MTM sees
what changed between synthesis cycles.

---

## STAGE 5 — MTM SYNTHESIS

**Source:** METAMORPHOSIS SCHEMA.md

### Trigger

DNR triggers `POST /mtm/synthesize` at session close only. Step 1 of the
Daily Nexus Routine. Never self-triggered. Never triggered by deposit
events. DNR passes the system prompt (from api/prompts/) as a parameter.

### Engine output read

MTM pulls computed pattern outputs from all five engines via the Feed step.
Pull, not push. If any engine read fails: `status → failed`,
`failure_type → pre_synthesis`. Halt.

**Synthesis threshold filter:** all patterns must exceed
`MTM_SYNTHESIS_THRESHOLD = 1.2` (ratio of observed/expected) to enter the
synthesis payload. Patterns below 1.2x are excluded. Expected post-filter
volume: 40-80 patterns total across 5 engines (calibration estimate).

**Payload assembled for Pass 1:**

1. **Engine frame** — one-sentence summary per engine from its state
   snapshot. Context layer, not data layer.
2. **Filtered pattern-level results** — full detail per pattern: observed
   rate, expected rate, ratio, weight breakdown, null contribution,
   contributing deposit_ids.

### Pass 1 — Engine layer (hypothesis)

Claude API call with synthesis directive:

> "This is Pass 1. You are producing a Synthesis Brief — a hypothesis, not
> a finding. Map what converges across engines. Name what is absent. Declare
> your sources by pattern key. Do not interpret. Do not conclude. Pass 2
> will verify against the raw deposits these patterns drew from."

**Output — Synthesis Brief:**

```json
{
  "synthesis_brief": {
    "convergences": [
      {
        "description": "string",
        "engines": ["string"],
        "load_bearing_patterns": [
          { "engine": "THR|STR|INF|ECR|SNM", "pattern_key": "string", "why": "string" }
        ]
      }
    ],
    "declared_gaps": [
      {
        "description": "string",
        "expected_in": ["string"],
        "gap_type": "absence | divergence | asymmetry",
        "reference_anchor": "string"
      }
    ]
  }
}
```

Stored as `pass_1_brief` on the `synthesis_sessions` record.

### Selection Function

Between Pass 1 and Pass 2. Two-mode deposit resolution:

- **Mode 1 (convergence):** resolves deposit_ids from `load_bearing_patterns`
  via engine pattern weight_breakdowns. Direct lookup.
- **Mode 2 (gap):** pulls deposits from expected engine's indexed set within
  reference_anchor that did NOT contribute to any pattern above threshold.
  Source set is the engine's indexed set (same dataset as Pass 1's baseline).

Writes `convergence_deposits_pulled` and `gap_deposits_pulled` to the
session record.

### Pass 2 — Verification layer

Receives: Synthesis Brief + targeted deposits only. Does NOT receive engine
frame or filtered patterns. The Brief is the hypothesis. The deposits are
the evidence. No anchoring to Pass 1 data.

Claude API call with verification directive:

> "This is Pass 2. You are verifying a synthesis hypothesis against raw
> deposit evidence. Overturning a hypothesis is not failure — it is the
> highest-value output."

**Output — verdicts + open questions:**

```json
{
  "verdicts": [
    {
      "source": "convergence | gap",
      "source_index": "integer",
      "verdict": "confirmed | complicated | overturned",
      "evidence": {
        "supporting_deposits": [{ "deposit_id": "string", "contribution": "string" }],
        "contradicting_deposits": [{ "deposit_id": "string", "contribution": "string" }]
      },
      "reasoning": "string"
    }
  ],
  "open_questions": [
    {
      "question": "string",
      "origin": "string",
      "why_unresolved": "string"
    }
  ]
}
```

### Finding production

Each verdict becomes a Finding. Each open_question becomes a Finding.

| finding_type | Source | Meaning |
|---|---|---|
| confirmed | verdict | Hypothesis supported by deposit evidence |
| complicated | verdict | Holds conditionally, with named constraints |
| overturned | verdict | Contradicted by deposit evidence |
| open_question | open_question | Cannot resolve from available evidence |

**Every Finding carries:**
- `synthesis_session_ref` — links to the synthesis cycle
- `provenance` — `pass_1_brief_id`, `source_type` (convergence/gap),
  `load_bearing_patterns` [{engine, pattern_key, why}],
  `deposit_evidence` [{deposit_id, role, contribution}],
  `prompt_versions` {pass_1, pass_2}
- `content_fingerprint` — deterministic hash from finding_type +
  sorted load_bearing_patterns + sorted deposit_ids. Used for
  deduplication on retry.
- `lnv_routing_status` — pending | deposited | failed

**Open question lifecycle:** resolved by a subsequent synthesis session's
verdict. New Finding created with `resolves_open_question`. Old record gets
`resolved: true`, `resolved_by`, `resolved_at`. Both records stand.

**Validation gate:** finding_type present, title present, content present,
provenance complete, fingerprint generated. Any failure → Finding dropped,
logged.

**Deduplication on retry:** when `prior_mtm_session_ids` is present, all
prior Findings' fingerprints are loaded. Candidate Findings with matching
fingerprints are skipped.

### Synthesis result object

Returned to DNR on every call — success or failure:

```json
{
  "status":                      "complete | failed",
  "failure_type":                "null | pre_synthesis | pass_1_failed |
                                  mid_synthesis | pass_2_failed",
  "findings":                    [],
  "findings_confirmed":          0,
  "findings_complicated":        0,
  "findings_overturned":         0,
  "findings_open_question":      0,
  "findings_dropped":            0,
  "mtm_session_id":              "string",
  "patterns_filtered_count":     0,
  "deposits_pulled_count":       0,
  "convergence_deposits_pulled": 0,
  "gap_deposits_pulled":         0,
  "synthesis_duration_ms":       0
}
```

### MTM provenance filter

MTM Findings enter PCV as hypotheses (`mtm_provenance = true`). If MTM ever
reads PCV state in its payload, those hypotheses must be flagged as
downstream outputs, not independent evidence. Prevents confirmation loop.

---

## STAGE 6 — LNV RECEIVE

**Source:** LNV SCHEMA.md — RECEIVE CONTRACT section

### Handoff

DNR routes MTM Findings to LNV after every successful synthesis cycle.
MTM does not write to LNV directly. The result object is DNR's to route.

### Receive endpoint

`POST /api/lnv/receive`

```json
{
  "entry_type":     "mtm_finding",
  "source_system":  "mtm",
  "source_page":    null,
  "session_ref":    "string",
  "prompt_version": "string",
  "content": {
    "finding_id":             "string",
    "finding_type":           "confirmed | complicated | overturned | open_question",
    "title":                  "string",
    "content":                "string",
    "provenance":             {},
    "prompt_versions":        { "pass_1": "string", "pass_2": "string" },
    "attached_open_question": "finding_id | null",
    "resolves_open_question": "finding_id | null"
  },
  "sage_note": null
}
```

**Validation:** content jsonb validated against `mtm_finding` shape. Type-shape
mismatch is a hard rejection.

### LNV storage

Single table: `lnv_entries`. All entry types share the same provenance
fields. Content stored as received — LNV does not edit, modify, or enrich
after receipt.

### Gallery display

Gallery card shows: entry_type badge ("MTM Finding"), source_system, date,
Finding title + excerpt, prompt_version badge. Expand on click: full Finding
with provenance chain.

### Downstream reads

- **PCV** reads `entry_type=mtm_finding` from LNV as pre-processed input
  for hypothesis detection
- **Observatory** reads recent entries for signal surface
- **Research assistant** can query LNV entries via RAG pipeline

---

## HANDOFF CONTRACTS — SUMMARY

| Boundary | Sender | Receiver | Contract | Payload |
|----------|--------|----------|----------|---------|
| Sage → INT | Sage / AI | INT gateway | `POST /api/deposits/create` | Full deposit request (see Stage 1) |
| INT → Engine page | INT routing | Engine INDEX step | `pages` array + stale flag write | Deposit record in PostgreSQL; stale flag in SQLite |
| Engine INDEX → COMPUTE | Engine service | Engine service | Internal (stale flag trigger) | Deposit fields indexed by engine's lens |
| Engine COMPUTE → FEED | Engine service | `engine_snapshots` table | PostgreSQL write | `snapshot_data` jsonb (engine-specific structure) |
| Engine FEED → MTM | Engine snapshots | MTM engine read | MTM pulls from `engine_snapshots` | Current snapshot + previous MTM-read snapshot + delta |
| MTM → DNR | MTM synthesis | DNR session close | Result object (see Stage 5) | Findings array + counts + metadata |
| DNR → LNV | DNR routing | LNV receive | `POST /api/lnv/receive` | `entry_type: mtm_finding` with content shape |

---

## FAILURE PROPAGATION

What happens when each stage fails, and what survives.

### INT gateway failure

| Step | Effect | Recovery |
|------|--------|----------|
| Validation (1) | 400. Nothing created. | Caller fixes and retries |
| Duplicate check (2) | 409. Nothing created. | Caller resolves duplicate |
| Record creation (3) | 500. Nothing created. | Caller retries |
| Stamp assignment (4) | Deposit exists, stamp pending | Recoverable async |
| Embedding trigger (5) | Deposit exists, embedding failed | Recoverable async |
| Page routing (6) | Deposit exists, routing failed | Recoverable async |

After the atomicity boundary, the deposit record is safe. Downstream
failures are recoverable without data loss.

### Engine failure

| Failure | Effect | Recovery |
|---------|--------|----------|
| Stale flag not set | Engine serves stale data on next view | Stale flag write is part of deposit creation pipeline. If it fails, next deposit re-triggers |
| Computation error | Stale flag stays true. Engine recomputes on next trigger | Automatic on next page view, batch close, or MTM pull |
| Stale flag stuck true | Engine recomputes on every trigger (wasteful but correct) | Clears on successful computation |

### MTM failure

| failure_type | What survived | What didn't | Recovery |
|---|---|---|---|
| pre_synthesis | Nothing. No engine data consumed | No Brief, no Findings | DNR retries at next session close |
| pass_1_failed | Engine data was read | No Brief produced | DNR retries with `prior_mtm_session_ids` |
| mid_synthesis | Brief stored on session record | No deposits resolved | DNR retries |
| pass_2_failed | Brief + Selection Function results stored | No Findings produced | DNR retries |

On retry, deduplication runs against all prior failed sessions in the
current DNR window. New Findings only.

### LNV routing failure

| Failure | Effect | Recovery |
|---------|--------|----------|
| LNV endpoint unavailable | Findings written to `findings` table. `lnv_routing_status: pending` | DNR retries routing in subsequent session |
| Content validation failure | Rejected with error_code | Caller fixes content shape |

MTM Findings are preserved in the `findings` table regardless of LNV
routing outcome. LNV routing failure never loses Findings.

---

## EMPTY STATES

Four distinct empty states in MTM, all status: `complete`, none are failures:

| State | Condition | What happens |
|-------|-----------|-------------|
| A | No patterns above 1.2x threshold | Pass 1 not called. Clean empty. |
| B | Brief has no convergences or gaps | Pass 2 not called. Clean empty. |
| C | Pass 2 returns empty verdicts | Clean empty. |
| D | All candidates dropped at validation/dedup | `findings_dropped > 0`. Not clean — LNV surfaces the count. |

---

## FILES

This contract does not own any code files. It references files owned by the
source schemas listed in SOURCE REFERENCES.

Backend services in this pipeline:

| File | Owner schema | Role |
|------|-------------|------|
| backend/routes/entries.py | INTEGRATION SCHEMA | Deposit creation endpoint |
| backend/services/engine_base.py | ENGINE COMPUTATION SCHEMA | Shared engine computation |
| backend/services/engine_thr.py | THRESHOLD ENGINE SCHEMA | THR engine |
| backend/services/engine_str.py | STARROOT ENGINE SCHEMA | STR engine |
| backend/services/engine_inf.py | INFINITE INTRICACY ENGINE SCHEMA | INF engine |
| backend/services/engine_ecr.py | ECHO RECALL ENGINE SCHEMA | ECR engine |
| backend/services/engine_snm.py | SAT NAM ENGINE SCHEMA | SNM engine |
| backend/services/mtm.py | METAMORPHOSIS SCHEMA | MTM synthesis service |
| backend/routes/mtm.py | METAMORPHOSIS SCHEMA | MTM endpoint |
| backend/services/lnv.py | LNV SCHEMA | LNV service |
| backend/routes/lnv.py | LNV SCHEMA | LNV endpoints |

Frontend components referenced but not owned by this contract:

| File | Owner schema |
|------|-------------|
| ThrCooccurrenceMatrix.svelte, ThrPresenceTimeline.svelte, ThrSequenceView.svelte | THR |
| StrRootClusterMap.svelte, StrCorrelationMatrix.svelte, StrDriftAlertPanel.svelte, StrNameIndex.svelte | STR |
| InfDensityFieldMap.svelte, InfEmergenceTimeline.svelte, InfIntersectionDetail.svelte | INF |
| EcrCorrelationMatrix.svelte, EcrSignalConstellation.svelte, EcrPresenceTimeline.svelte, EcrSequenceView.svelte | ECR |
| SnmBipartiteGraph.svelte, SnmTemporalCorrespondence.svelte | SNM |
