# LIBER NOVUS SCHEMA

## /DESIGN/Systems/Liber_Novus/LNV SCHEMA.md

Mechanical spec — single-table type-discriminated architecture (9 entry types),
receive contract, read contract, content shapes per entry type, snapshot
storage, session-close policy, gallery display, validation, failure modes.
Architectural description in SYSTEM_ LNV.md.

---

## OWNERSHIP BOUNDARIES

### OWNS

- lnv_entries PostgreSQL table — single table for all LNV content
- Receive contract — POST /api/lnv/receive, universal endpoint for all callers
- Read contract — GET /api/lnv/entries, query endpoint for all consumers
- Content validation — type-shape matching on receive, hard rejection on mismatch
- Gallery display — card layout, filtering, sorting, expand-on-click behavior
- Snapshot storage format — data + template_ref, not rendered images

### DOES NOT OWN

- MTM Finding production — owned by MTM. LNV receives MTM Findings; it does not produce them.
- Cosmology finding production — owned by Cosmology page services (HCO, COS, CLM, NHM, MIR, RCT). LNV receives confirmed findings; it does not produce them.
- RCT residual production — owned by RCT. LNV receives residuals; it does not produce them.
- Engine computation — owned by individual engine services. LNV stores snapshots; it does not trigger or own computation.
- WSC entry production — owned by WSC. LNV receives entries; it does not produce them.
- Void analytical output — owned by Void. LNV receives outputs; it does not trigger analysis.
- Routing authority — DNR routes MTM Findings to LNV. WSC routes entries to LNV. Void routes outputs to LNV. Engine visualization capture routes snapshots to LNV. LNV does not pull from any system.
- Content interpretation — LNV holds content in structural juxtaposition. It does not synthesize, interpret, or editorialize across types.
- Visualization rendering logic — owned by frontend Svelte components. LNV stores the data and template_ref; the component renders.

---

## STRUCTURAL RULES

1. LNV is both a display surface (gallery) and a data source. PCV reads
   mtm_finding entries from LNV as pre-processed input. Observatory reads
   recent entries for signal surface. These are first-class read paths,
   not secondary uses.

2. One table. All LNV content shares the same provenance fields. The gallery
   treats all types uniformly. PCV can filter by type. One receive endpoint
   handles everything.

3. Content validation is a hard gate. A request with entry_type: mtm_finding
   but content missing finding_type is rejected. Type-shape mismatch is a
   hard failure, not a warning.

4. LNV does not edit, modify, or enrich content after receipt. What arrives
   is what is stored. What is stored is what displays. The sealed record
   principle holds.

5. Engine snapshots store data + template, not rendered images. The gallery
   thumbnail generates at display time from stored data. The data is
   canonical. The rendering is current.

6. Engine snapshot entries are not triggered at session close. Auto-captures
   fire mid-session when engine_base.py detects a significant signal delta.
   Session close does not sweep all engines automatically.

---

## STORE: lnv_entries

| Field | Type | Description |
| --- | --- | --- |
| lnv_entry_id | auto | Primary key |
| entry_type | enum | `mtm_finding`, `engine_snapshot`, `wsc_entry`, `void_output`, `cosmology_finding`, `rct_residual`, `thread_trace`, `emergence_finding`, `archive_record`. Determines which content shape is expected. |
| source_system | string | Which system produced this. Values: mtm, thr, str, inf, ecr, snm, wsc, void, pcv, dtx, sgr, hco, cos, clm, nhm, mir, rct, ttr, emr, arv. |
| source_page | string / null | Which page this originated from (page_code). Null for cross-page outputs like MTM. |
| session_ref | string / null | Which session produced this. |
| prompt_version | string / null | For AI-authored types (wsc, void, mtm). Null for engine_snapshot. |
| content | jsonb | Type-specific payload. Shape must match entry_type. See CONTENT SHAPES below. |
| sage_note | string / null | Optional researcher note at capture time. |
| created_at | timestamp | Written once at record creation. Never updated. |

### Entry type expansion history

Tier 5 added two entry_type values: `cosmology_finding` and `rct_residual`.
Content shapes defined below. The lnv_entries table and receive contract
accommodate new types without structural changes — add the enum value and
define the content shape.

LNV content audit (session 45) identified `thread_trace`, `emergence_finding`,
and `archive_record` as missing callers. All three were confirmed LNV callers
in their own system docs (NEXUS FEED sections) and domain files but were absent
from the receive contract, enum, and content shapes. Added as the seventh,
eighth, and ninth entry_types respectively.

---

## CONTENT SHAPES PER ENTRY TYPE

### mtm_finding

```json
{
  "finding_id":             "string — references findings table",
  "finding_type":           "confirmed | complicated | overturned | open_question",
  "title":                  "string",
  "content":                "string",
  "provenance":             "object — full provenance chain from Finding record",
  "prompt_versions":        { "pass_1": "string", "pass_2": "string" },
  "attached_open_question": "finding_id | null",
  "resolves_open_question": "finding_id | null"
}
```

### engine_snapshot

```json
{
  "engine":             "thr | str | inf | ecr | snm",
  "engine_snapshot_id": "string — links to visualization_snapshots.engine_snapshot_id (FK to engine_snapshots)",
  "template_ref":       "string — which visualization component renders this",
  "viz_data":           "object — positions, values, scales, color mappings",
  "deposit_count":      "integer — corpus size at capture time",
  "baseline_scope":     "page"
}
```

template_ref examples: `thr_cooccurrence_matrix`, `ecr_constellation`,
`inf_density_field`, `str_root_cluster_radial`, `snm_correspondence_heatmap`.

template_ref maps to a Svelte visualization component. The component knows how
to render from the visualization_data object. If the component is updated, all
historical snapshots re-render with the improved display. The data is canonical.
The rendering is current.

### wsc_entry

```json
{
  "wsc_entry_id":    "string — references wsc_entries table",
  "wsc_subtype":     "milestone | standard",
  "entry_timestamp": "string — the WSC entry's own timestamp",
  "session_summary": "string — full, not truncated. Sealed at store time.",
  "handoff_note":    "string",
  "milestone_marker": "{ event, date } | null",
  "reconstruction_note": "string | null",
  "open_threads":    "[{ thread, status }]"
}
```

wsc_subtype determination:
- Entry has milestone_marker or reconstruction_note → `milestone`
  (high-signal longitudinal, higher gallery prominence)
- Otherwise → `standard`

LNV content jsonb is self-contained. No join-back to wsc_entries required.
What was stored is what displays, permanently.

### void_output

Trigger-discriminated. Two content shapes depending on trigger value.

**Session-close:**

```json
{
  "trigger":        "session_close",
  "void_output_id": "string — references void_outputs table",
  "prose_output":   "string — Claude's full analytical text, written in flowing prose",
  "engines_read":   "string[]"
}
```

**On-demand (open and targeted):**

```json
{
  "trigger":        "on_demand_open | on_demand_targeted",
  "void_output_id": "string — references void_outputs table",
  "scope":          "object | null — Sage's scope constraint. Null for open reads.",
  "prose_output":   "string — Claude's full analytical text, written in flowing prose",
  "engines_read":   "string[]"
}
```

Validation checks trigger value first, then requires the correct field set for
that shape. Gallery card shows a prose excerpt from prose_output. Expand on click
shows the full prose.

### cosmology_finding

Routed when a Cosmology finding is confirmed (status: confirmed). Sage-
triggered from the finding card or findings panel. Full spec in COSMOLOGY
SCHEMA.md.

```json
{
  "finding_id":              "string — references cosmology_findings table",
  "page_code":               "HCO | COS | CLM | NHM | MIR | RCT",
  "framework":               "string",
  "hypothesis":              "string",
  "computation_snapshot_id": "string — references artis_computation_snapshots",
  "result_summary":          "string",
  "values":                  "object — p-values, coefficients, statistical output",
  "confidence":              "float — Sage's research significance assessment",
  "external_reference_id":   "string | null",
  "nexus_eligible":          "boolean",
  "deposit_ids":             "string[]"
}
```

source_system: the page code in lowercase (hco, cos, clm, nhm, mir, rct).
source_page: the page code (HCO, COS, CLM, NHM, MIR, RCT).
prompt_version: null (not AI-authored).

### rct_residual

Routed immediately on rct_residual creation. Automatic — residuals enter LNV
as soon as they are detected. Full spec in COSMOLOGY SCHEMA.md.

```json
{
  "residual_id":          "string — references rct_residuals table",
  "algorithm_component":  "lagrange | tribonacci | fibonacci | oscillation | combined",
  "known_science_predict": "string",
  "field_produces":        "string",
  "delta":                 "string",
  "computation_ref":       "string — references artis_computation_snapshots",
  "source_deposits":       "string[] — derived from source finding's deposit_ids at route time",
  "accumulation_count":    "integer — snapshot at route time, sealed",
  "nexus_eligible":        "boolean"
}
```

source_system: rct.
source_page: RCT.
prompt_version: null (not AI-authored).

accumulation_count is a snapshot at route time — sealed in the LNV entry, not
a live counter. Shows how many residuals existed on this algorithm_component
when this one was created.

### thread_trace

Sage-triggered at session close as part of the Daily Nexus Routine. Carries
the processed Thread Trace output — sequence trace or structural visualization
— with full provenance intact.

```json
{
  "thread_id":        "string — references saved_threads table",
  "thread_name":      "string",
  "thread_type":      "temporal | relational | cluster | emergence",
  "seed":             "object — { type, id, threadTypes }",
  "entry_ids":        "string[] — entries in the thread at save time",
  "routing_snapshot": "object — dominant routing dimensions and distributions"
}
```

source_system: ttr.
source_page: null (Thread Trace is a cross-cutting system, not page-scoped).
prompt_version: null (not AI-authored — algorithmic thread building).

Routing is automatic on thread save. annotation_types and visualization_type
were removed from this shape: routing fires at save time before any annotations
exist, and the view at that moment is always the default sequence view. Neither
field carries information.

### emergence_finding

Automatic on significant tag commit (proactive nudge) or on-demand detection
run. Carries the Emergence finding with full provenance intact.

```json
{
  "finding_id":               "string — references emergence_findings table",
  "type":                     "cluster | bridge | high_influence | cross_category | drift | void_zone | npa_spike | null_cluster",
  "title":                    "string",
  "description":              "string",
  "severity":                 "low | medium | high",
  "metrics":                  "object — includes doc_type_distribution and detector-specific values",
  "involvedTags":             "object[] — tag objects involved in the finding",
  "detection_config_version": "string — version of detector config at detection time"
}
```

source_system: emr.
source_page: null (Emergence is a cross-cutting analysis layer, not page-scoped).
prompt_version: null (detection is algorithmic, not AI-authored).

### archive_record

Automatic on retirement — triggered by INT post-retirement sequence after
authentication threshold is met and the Archives page deposit is confirmed.
Carries the sealed record with provenance intact.

```json
{
  "arc_id":            "string — ARC stamp id",
  "retired_at":        "timestamp — retirement timestamp, frozen at seal time",
  "title":             "string — from root_entries.title",
  "doc_type":          "string — mirrors root_entries.doc_type at retirement time",
  "source_origin":     "string — source overview from provenance_summary",
  "confirmed_routing": "string[] — confirmed_targets from retirement"
}
```

source_system: arv.
source_page: ARV (Archives page, page 46).
prompt_version: null (not AI-authored).

arc_id and retired_at are frozen at retirement time and never updated.
LNV holds the sealed record as a permanent provenance anchor — it does not
modify or re-derive any field after receipt.

---

## RECEIVE CONTRACT

### POST /api/lnv/receive

Universal receive endpoint. All callers use this endpoint. No bespoke pipes.

**Request:**

```json
{
  "entry_type":     "mtm_finding | engine_snapshot | wsc_entry | void_output | cosmology_finding | rct_residual | thread_trace | emergence_finding | archive_record",
  "source_system":  "string",
  "source_page":    "page_code | null",
  "session_ref":    "string | null",
  "prompt_version": "string | null",
  "content":        "jsonb — shape must match entry_type",
  "sage_note":      "string | null"
}
```

**Response — success:**

```json
{
  "lnv_entry_id": "string",
  "entry_type":   "string",
  "status":       "received",
  "created_at":   "timestamp"
}
```

**Response — failure:**

```json
{
  "error_code": "validation_failed | type_mismatch | content_schema_invalid",
  "message":    "string"
}
```

### Validation

Content jsonb is validated against the expected shape for the declared
entry_type. Validation checks:

1. entry_type is a recognized value.
2. content is present and is a valid JSON object.
3. content contains all required fields for the declared entry_type.
4. Field types within content match expectations (e.g., finding_type is a valid
   enum value, not an arbitrary string).

A request that fails any check is rejected with the appropriate error_code.
Type-shape mismatch is a hard failure, not a warning.

### Who calls this endpoint

| Caller | entry_type | Trigger |
| --- | --- | --- |
| DNR | mtm_finding | After MTM synthesis at session close |
| Engine visualization capture (auto) | engine_snapshot | Automatic on signal delta (engine_base.py) |
| Engine visualization capture (Sage) | engine_snapshot | Sage-triggered on demand |
| WSC write path | wsc_entry | After WSC entry written |
| Void session-close | void_output | Automatic at session close |
| Void on-demand | void_output | Sage-triggered |
| Cosmology page service | cosmology_finding | Sage-triggered from finding card (confirmed findings only) |
| RCT residual service | rct_residual | Automatic on residual creation |
| Thread Trace | thread_trace | Automatic on thread save (step 5 of Thread Trace save sequence) |
| Emergence service | emergence_finding | Automatic on significant tag commit; on-demand detection run |
| Integration post-retirement | archive_record | Automatic on retirement after authentication threshold met |

---

## READ CONTRACT

### GET /api/lnv/entries

Query endpoint for all consumers.

**Query parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| entry_type | string (repeatable) | Filter by type. Optional. Multiple values accepted for multi-type queries. |
| source_system | string | Filter by source system. Optional. |
| source_page | string | Filter by page code. Optional. |
| session_ref | string | Filter by session. Optional. |
| limit | integer | Default 50, max 200. |
| offset | integer | Default 0. |
| sort | enum | `created_at_desc` (default), `created_at_asc`. |

**Response:**

```json
{
  "entries": "array of lnv_entries records",
  "total":   "integer — total matching count",
  "limit":   "integer",
  "offset":  "integer"
}
```

### Who calls this endpoint

| Consumer | Typical query | Purpose |
| --- | --- | --- |
| LNV page | All types, chronological | Gallery display |
| PCV | entry_type=mtm_finding | Pre-processed input for hypothesis detection |
| PCV | entry_type=cosmology_finding, nexus_eligible filter | Cosmology findings entering Nexus pipeline |
| Observatory | Recent entries, all types | Signal surface |
| RCT | entry_type=rct_residual, source_page=RCT | Residual accumulation tracking |
| Any system | Filtered as needed | Query LNV's consolidated output |

---

## SNAPSHOT STORAGE DECISION

Store data plus template, not rendered images.

Rendered images are large, non-queryable, and break if the template changes.
Data plus template means the visualization re-renders from stored data, can be
queried analytically, and stays correct if the display layer improves.

The gallery thumbnail generates at display time from stored data — not a stored
file. This is the right call for a system intended to feed model training
downstream.

### Auto-capture on signal delta flow

1. Engine computation runs (triggered by page view, batch window close, or MTM pull)
2. engine_base.py compares new results to previous snapshot
3. If signal delta exceeds threshold (calibration item): system serializes
   visualization_data + template_ref + computation_snapshot_id
4. POST /api/lnv/receive with entry_type: engine_snapshot
5. LNV entry created. Gallery card shows thumbnail re-rendered from stored data.

Auto-trigger fires mid-session when signal warrants it. Session close does not
trigger engine snapshots.

---

## SESSION-CLOSE SNAPSHOT POLICY

Session close does NOT automatically snapshot all engine pages. Auto-captures
fire mid-session when engine_base.py detects a significant signal delta —
not at session close, not on every computation.

**What DOES enter LNV at session close (via DNR):**
- MTM Findings (automatic, via DNR two-step sequence)
- Void session-close pulse check output (automatic, via DNR)

**What enters LNV outside session close:**
- Engine visualization snapshots (automatic on signal delta, triggered by engine_base.py)
- WSC entries (automatic after WSC write, via WSC write path)
- Void on-demand read outputs (Sage triggers void analysis; automatic LNV routing follows)
- Thread Trace outputs (automatic on thread save, via Thread Trace save sequence)
- Cosmology findings (Sage triggers route from finding card on confirmed findings; automatic LNV routing follows)
- RCT residuals (automatic on residual creation)
- Emergence findings (automatic on significant tag commit or on-demand detection run)
- Archive records (automatic on retirement, via INT post-retirement sequence)

---

## LNV PAGE — GALLERY DISPLAY

Gallery layout. Snapshot cards in responsive grid (2-3 columns).

### Gallery card

```
┌─────────────────────────────────────────────────┐
│ [ENTRY_TYPE BADGE]  [SOURCE_SYSTEM]  [DATE]     │
│                                                  │
│ Visualization thumbnail (re-rendered from data)  │
│   OR Finding title + excerpt                     │
│   OR WSC entry summary                           │
│   OR Void observation summary                    │
│                                                  │
│ [SAGE_NOTE excerpt if present]                   │
│ [PROMPT_VERSION badge if AI-authored]            │
└─────────────────────────────────────────────────┘
```

### Expand on click

Full content per type:
- engine_snapshot: full-size visualization re-rendered from data
- mtm_finding: full Finding with provenance chain
- wsc_entry: full WSC entry text
- void_output: full analytical prose (session-close pulse check or on-demand read)
- cosmology_finding: full finding card (framework, hypothesis, computation result, confidence, reference)
- rct_residual: full residual card (algorithm component, prediction vs observation, delta, computation ref)
- thread_trace: full thread snapshot (thread type, seed, entry count, routing summary)
- emergence_finding: full finding card (title, description, type, severity, metrics, involved tags, config version)
- archive_record: full archive record (ARC stamp, retirement timestamp, title, doc type, source origin, confirmed routing)

### Filters

By entry_type, by source_system, by source_page, by date range. All combinable.

### Sort

Default: chronological (most recent first). Overridable to oldest first.

### Sage-facing surfaces

Entry type badges with plain language:
- mtm_finding → "MTM Finding"
- engine_snapshot → "Visualization"
- wsc_entry → "Witness Scroll"
- void_output → "Void Analysis"
- cosmology_finding → "Cosmology Finding"
- rct_residual → "RCT Residual"
- thread_trace → "Thread Trace"
- emergence_finding → "Emergence Finding"
- archive_record → "Archive Record"

Prompt version visible on AI-authored entries (mtm_finding, wsc_entry,
void_output). Not applicable to cosmology_finding, rct_residual, thread_trace,
emergence_finding, or archive_record (not AI-authored). Sage note visible when
present.

---

## KNOWN FAILURE MODES

### 1. Content shape does not match declared entry_type

Request claims entry_type: mtm_finding but content is missing finding_type or
has extra unexpected fields.

**Guard:** Content validation at receive time. Type-shape mismatch returns
error_code: content_schema_invalid. Entry is not written. Caller receives the
error and can retry with corrected content.

### 2. Caller sends unrecognized entry_type

A caller sends an entry_type value that LNV does not recognize (e.g., a future
type added before the enum is expanded).

**Guard:** entry_type validation at receive time. Unrecognized type returns
error_code: type_mismatch. Entry is not written.

### 3. Duplicate content received

The same Finding, snapshot, or entry is sent to LNV twice (e.g., DNR retries
after a timeout but LNV already received the first call).

**Guard:** LNV does not deduplicate. Each receive call creates a new
lnv_entries record. Deduplication responsibility is on the caller — MTM
deduplicates via content fingerprinting before Findings reach DNR. For other
types, the caller is responsible for not sending duplicates. If duplicates do
land in LNV, they are visible in the gallery and Sage can identify and note
them. This is a known limitation, not a data integrity risk — duplicates are
annoying but not corrupting.

### 4. Engine snapshot references a deleted or updated visualization component

template_ref points to a Svelte component that has been renamed or removed.

**Guard:** The snapshot's visualization_data is canonical. If the template_ref
is invalid, the gallery card displays the data in a fallback format (raw JSON
or table) rather than silently failing. The data is never lost. The rendering
is recoverable by updating the template_ref mapping.

### 5. LNV receive endpoint unavailable at session close

DNR attempts to route MTM Findings to LNV but the endpoint is down.

**Guard:** DNR handles this failure. MTM Findings are written to the findings
table regardless of LNV routing. lnv_routing_status stays `pending`. DNR can
retry routing in a subsequent session. The Findings are preserved even if LNV
never receives them.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| backend/services/lnv.py | LNV service — receive validation, content shape checking, lnv_entries PostgreSQL writes, read queries with filtering and pagination | PLANNED |
| backend/routes/lnv.py | FastAPI LNV endpoints — POST /api/lnv/receive, GET /api/lnv/entries | PLANNED |
