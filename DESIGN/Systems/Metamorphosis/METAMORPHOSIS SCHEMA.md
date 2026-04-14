# METAMORPHOSIS SCHEMA

## MTM · V1

## /DESIGN/Systems/Metamorphosis/METAMORPHOSIS SCHEMA.md

Mechanical spec — two-pass synthesis architecture, engine output reading,
selection function, Finding production with open question lifecycle,
fingerprinting, deduplication, stores, validation, failure modes.
Architectural description in SYSTEM_ Metamorphosis.md.

---

## OWNERSHIP BOUNDARIES

### OWNS

- Synthesis cycle — the full MTM operation from engine output read through Finding production
- Two Claude API calls for synthesis — Pass 1 (engine hypothesis) and Pass 2 (deposit verification)
- Engine output reading — pulling computed pattern data from all five Axis engine services
- Selection Function — resolving targeted deposit sets between Pass 1 and Pass 2
- Finding production — extracting, validating, and writing Finding records from the Pass 2 response
- Content fingerprinting — generating and writing the content_fingerprint on every Finding record
- Deduplication check on retry — comparing candidate Findings against prior session Findings before writing or routing anything
- LNV routing handoff — assembling the result object returned to DNR. MTM's responsibility ends there.
- synthesis_sessions PostgreSQL table
- findings PostgreSQL table

### DOES NOT OWN

- Lens page deposit writing — owned by their respective sections (THR · STR · INF · ECR · SNM)
- Engine computation — owned by individual engine services (Tier 3). MTM reads computed outputs; it does not trigger or own the computation.
- PostgreSQL reads of raw deposit data — owned by FastAPI service layer (backend/services/)
- LNV deposit writing — owned by LNV
- Routine orchestration and trigger — owned by DNR. MTM never calls itself. DNR calls MTM.
- WSC — Witness Scroll is sovereign. MTM has no relationship to it.
- Tag pipeline — owned by tagger service
- Routing authority — owned by SOT
- Findings content after handoff — once the result object is returned to DNR, MTM does not track what LNV does with what it receives
- lnv_routing_status and lnv_deposit_id writes — after DNR confirms LNV has received a Finding, the FastAPI service layer writes lnv_routing_status → deposited and populates lnv_deposit_id on the findings record. DNR triggers this write. MTM does not.

---

## STRUCTURAL RULES

1. MTM never receives deposits. Synthesis only.

2. Synthesis cycle fires when DNR triggers the MTM synthesis endpoint
   (POST /mtm/synthesize) at session close only. Never triggered by deposit
   events. Never self-triggered.

3. Two-pass architecture. Pass 1 reads engine outputs and produces a
   Synthesis Brief (hypothesis). Pass 2 reads targeted raw deposits and
   produces verdicts. Both passes are required. A synthesis cycle that
   completes Pass 1 but fails Pass 2 has status → failed, failure_type →
   pass_2_failed.

4. Pass 1 reads computed engine outputs from all five Axis engines — not
   raw deposits. The engines have already converted deposits into computed
   patterns with baselines, ratios, and statistical context. MTM synthesizes
   at the pattern level, not the deposit level.

5. Pass 2 reads targeted raw deposits only — selected by the Selection
   Function from Pass 1 output. Pass 2 does NOT receive engine outputs or
   filtered patterns. The Brief is the hypothesis; the deposits are the
   evidence. No anchoring to Pass 1 data in Pass 2.

6. Findings are the only named output type. Not summaries. Not observations.
   Not patterns. Four finding_type values: confirmed, complicated, overturned,
   open_question.

7. Every Finding carries traceable provenance: load_bearing_patterns linking
   to specific engines and pattern keys, and deposit_evidence linking to
   specific deposit_ids with role and contribution.

8. Findings route to LNV (47) only — via DNR handoff. MTM does not write to
   LNV directly.

9. A synthesis cycle that cannot read all five engine outputs does not
   produce Findings. Status → failed, failure_type → pre_synthesis. Retry
   permitted at next session close.

10. Deduplication runs on every retry where prior_mtm_session_ids is present.
    It never runs on a clean first-time synthesis.

---

## NAMED CONSTANTS

| Constant | Value | Purpose |
| --- | --- | --- |
| MTM_SYNTHESIS_THRESHOLD | 1.2 | Minimum ratio (observed/expected) for a pattern to pass the synthesis threshold filter. Patterns below this are excluded from the Pass 1 payload. Separate from visualization display thresholds in individual engines. |

---

## TRIGGER DEFINITION

MTM fires as Step 1 of the Daily Nexus Routine only.

DNR triggers the MTM synthesis endpoint (POST /mtm/synthesize) and awaits its
resolution before proceeding to Step 2. POST /mtm/synthesize is the sole public
entry point into this system. Everything inside MTM is internal to that call.

MTM never calls itself. There is no scheduled trigger, no deposit event trigger,
no internal retry. All retry logic lives in DNR. MTM receives a call, runs, and
returns a result object. That is its complete contract with the outside world.

---

## ENGINE OUTPUT READ SPEC

### What is read

Computed pattern outputs from all five Axis engine services:
THR · STR · INF · ECR · SNM.

Each engine produces pattern-level results through the shared 4-step compute
architecture (ENGINE COMPUTATION SCHEMA.md). MTM reads these outputs via the
Feed step — pull, not push. MTM pulls engine outputs at synthesis time. Engines
do not push to MTM.

**Freshness guarantee:** Engine endpoints self-refresh before returning. When
MTM calls an engine endpoint, the engine checks its own stale flag. If stale,
the engine recomputes and clears the flag before returning its result. MTM
always receives current data. MTM does not manage or check the stale flag — the
engine service owns that entirely.

**stale_warning handling:** If an engine's recomputation fails, the engine
returns its most recent existing snapshot with stale_warning: true in the
engine_result object. MTM behavior on receipt of stale_warning: true:
- Log the warning against the affected engine
- Proceed with synthesis using the delivered snapshot
- Synthesis is not blocked — a stale warning is a caveat, not a failure
- The stale_warning is not surfaced as a synthesis failure_type
A read failure (engine unreachable or error response) is different from a
stale warning and does cause synthesis to fail with failure_type → pre_synthesis.

**low_sample handling:** Engine pattern results may carry low_sample: true when
a pattern's deposit_count is below MIN_PATTERN_DEPOSIT_COUNT. MTM behavior on
receipt of low_sample: true patterns:
- Include the pattern in synthesis as-is — low_sample is a caveat, not a filter
- MTM does not strip or de-weight low_sample patterns; synthesis treats them as
  any other pattern result
- The low_sample flag propagates into the Findings output so downstream consumers
  can distinguish well-evidenced patterns from thin-sample patterns

### Synthesis threshold filter

Before the Pass 1 payload is assembled, all engine pattern results are filtered:

- Patterns must exceed MTM_SYNTHESIS_THRESHOLD (1.2x baseline ratio) to enter
  the synthesis payload.
- Patterns below this threshold are excluded entirely. They are not sent to
  Claude. They are not referenced in the Brief.
- This threshold is separate from visualization display thresholds in individual
  engines.
- Expected post-filter volume: 40-80 patterns total across 5 engines. This is
  a calibration estimate, not a hard constraint.

### Payload structure after filtering

Two components assembled for the Pass 1 Claude API call:

**Engine frame** — one-sentence summary per engine from its state snapshot.
Context layer, not data layer. Gives Claude orientation on what each engine is
currently tracking without flooding the payload with raw state.

**Filtered pattern-level results** — full detail for each pattern that passed
the synthesis threshold:
- observed rate
- expected rate (baseline)
- ratio (observed/expected)
- weight breakdown (which deposits contributed, how much)
- null contribution (absence data from null observations)
- contributing deposit_ids

### Failure on engine read

If any engine output read fails: status → failed, failure_type → pre_synthesis.
Result object returned immediately. An engine read failure means the engine
service could not be reached or returned an error — not that the engine had no
patterns. An engine with zero patterns above threshold is a valid empty result,
not a read failure.

---

## PASS 1 — ENGINE LAYER

### Claude API call

**System prompt:** DNR passes the system prompt to MTM as a parameter when
calling POST /mtm/synthesize. The prompt is assembled from the global identity
context (api/prompts/) by DNR before the call. MTM does not load or configure
its own system prompt. MTM appends the Pass 1 synthesis directive.

**Pass 1 synthesis directive:**

"This is Pass 1. You are producing a Synthesis Brief — a hypothesis, not a
finding. Map what converges across engines. Name what is absent. Declare your
sources by pattern key. Do not interpret. Do not conclude. Pass 2 will verify
against the raw deposits these patterns drew from."

**Data payload:** Engine frame + filtered pattern-level results, serialized as
JSON in the user message.

### Synthesis Brief — output shape

The Synthesis Brief is an intermediate type, not a Finding. It is the hypothesis
that Pass 2 will verify.

```json
{
  "synthesis_brief": {
    "convergences": [
      {
        "description": "string — what converges across engines",
        "engines": ["string — which engines flagged this"],
        "load_bearing_patterns": [
          {
            "engine": "THR | STR | INF | ECR | SNM",
            "pattern_key": "string",
            "why": "string — why load-bearing"
          }
        ]
      }
    ],
    "declared_gaps": [
      {
        "description": "string — what is absent or divergent",
        "expected_in": ["string — which engines should have flagged"],
        "gap_type": "absence | divergence | asymmetry",
        "reference_anchor": "string — time window or cluster neighborhood"
      }
    ]
  }
}
```

The Brief is stored on the synthesis_sessions record as pass_1_brief (jsonb).

---

## SELECTION FUNCTION

Between Pass 1 and Pass 2. Two-mode deposit resolution from the Synthesis Brief.

### Mode 1 — Convergence resolution

**Input:** load_bearing_patterns from Brief convergences.

**Operation:** Direct deposit_id resolution from engine pattern weight_breakdown.
Each load_bearing_pattern references a specific engine and pattern_key. The
engine's computed result for that pattern includes a weight_breakdown listing
which deposit_ids contributed to it. Mode 1 resolves those deposit_ids.

**Output:** deposit_ids that drove the patterns.

### Mode 2 — Gap resolution

**Input:** declared_gaps from Brief.

Each gap declares expected_in (which engines should have flagged) and
reference_anchor (time window or cluster neighborhood).

**Operation:** Pull deposits from expected_engine's indexed set (current compute
cycle) within reference_anchor that did NOT contribute to any flagged pattern
above synthesis threshold. Exclusion step required: filter out deposit_ids
already present in any pattern above threshold.

**Source set:** Engine's indexed set, not full page deposits. Mode 2's gap claim
must be built on the same dataset as Pass 1's pattern claim. The baseline that
produced the patterns in Pass 1 was calculated from the engine's indexed set. If
Mode 2 pulls deposits the baseline doesn't account for, the gap claim is built
on a different dataset than the pattern claim — the two passes become internally
inconsistent.

Practical note: MTM runs at session close, and session close triggers engine
recompute. By the time MTM synthesizes, all stale engines should have recomputed
from the full page. The indexed set and full page converge at session close. But
stated as indexed set — correct in principle, and safe if an engine recompute
fails before MTM runs.

**Output:** deposits the engine held but didn't elevate.

### Selection writes

The Selection Function writes two counts to the synthesis_sessions record:
- convergence_deposits_pulled — count of deposits resolved via Mode 1
- gap_deposits_pulled — count of deposits resolved via Mode 2

These are both performance signals (how much data Pass 2 received) and
analytical signals (the ratio of convergence to gap evidence).

---

## PASS 2 — VERIFICATION LAYER

### Input

Receives: Synthesis Brief + targeted deposits only.

Does NOT receive engine frame or filtered patterns. The Brief is the hypothesis.
The deposits are the evidence. No anchoring to Pass 1 data. This separation is
structural — Pass 2 evaluates the hypothesis against raw evidence without seeing
the computed patterns that generated the hypothesis.

### Claude API call

**Pass 2 synthesis directive:**

"This is Pass 2. You are verifying a synthesis hypothesis against raw deposit
evidence. Overturning a hypothesis is not failure — it is the highest-value
output. 'Complicated' and 'overturned' verdicts deserve more attention than
confirmations, not less. Where deposit evidence is insufficient to resolve a
question, name it as an open question — do not force a verdict."

### Output shape — verdicts + open questions

```json
{
  "verdicts": [
    {
      "source": "convergence | gap",
      "source_index": "integer",
      "verdict": "confirmed | complicated | overturned",
      "evidence": {
        "supporting_deposits": [
          { "deposit_id": "string", "contribution": "string" }
        ],
        "contradicting_deposits": [
          { "deposit_id": "string", "contribution": "string" }
        ]
      },
      "reasoning": "string"
    }
  ],
  "open_questions": [
    {
      "question": "string",
      "origin": "string — which convergence or gap",
      "why_unresolved": "string — what evidence would be needed"
    }
  ]
}
```

Gap verdicts are first-class — same status as convergence verdicts. Gaps
overturned ("this absence is an indexing artifact") are as analytically
significant as confirmed convergences.

---

## FINDING PRODUCTION

Each verdict becomes a Finding. Each open_question becomes a Finding. Four
finding_type values:

| finding_type | Source | Meaning |
| --- | --- | --- |
| confirmed | verdict | Hypothesis supported by deposit evidence |
| complicated | verdict | Hypothesis holds conditionally, with named constraints |
| overturned | verdict | Hypothesis contradicted by deposit evidence |
| open_question | open_question | Pass 2 could not resolve from available evidence |

### Finding record shape

```
id:                      auto
synthesis_session_ref:   references synthesis_sessions.id
finding_type:            confirmed | complicated | overturned | open_question
title:                   string
content:                 string
provenance:
  pass_1_brief_id:       string — links to Brief stored on session record
  source_type:           convergence | gap
  source_description:    string
  load_bearing_patterns: [{ engine, pattern_key, why }]
  deposit_evidence:      [{ deposit_id, role: supporting | contradicting,
                            contribution }]
  prompt_versions:
    pass_1:              string
    pass_2:              string
attached_open_question:  finding_id | null
  — links confirmed/complicated findings to unresolved questions
  — the open_question also exists as its own Finding record
  — relationship is structural, not narrative
resolves_open_question:  finding_id | null
  — on verdicts that resolve a prior open_question Finding
  — the resolved Finding gets resolved: true, resolved_by
    pointing back here
content_fingerprint:     string
lnv_routing_status:      pending | deposited | failed
lnv_deposit_id:          references LNV deposit | null
created_at:              timestamp

# Open question lifecycle fields
# These fields exist on ALL Findings but are only populated
# on finding_type: open_question
resolved:                boolean — default false
resolved_by:             finding_id | null — the Finding that
                           resolved this question (created in a
                           subsequent synthesis session)
resolved_at:             timestamp | null — when resolution
                           occurred. Duration open (resolved_at
                           minus created_at) is a queryable
                           research signal — questions that stay
                           open across many sessions are different
                           from questions that resolve in the
                           next cycle.
```

---

## OPEN QUESTION LIFECYCLE

When a subsequent MTM synthesis produces a verdict on a previously open_question
Finding, a NEW Finding is created (the verdict). The old open_question record is
never overwritten — it stays as historical record. The new Finding carries
`resolves_open_question: finding_id` linking back. The old record gets
`resolved: true`, `resolved_by: [new finding id]`, `resolved_at: [timestamp]`.

Both records stand in the ledger. The open_question shows the system's state of
knowledge at the time. The resolving Finding shows what changed. Immutability is
preserved.

---

## CONTENT FINGERPRINTING

### What it is

A deterministic string derived from three dimensions of the Finding's identity:
finding_type, load_bearing_patterns, and deposit_evidence. It is the structural
identity of the Finding — not its content, its provenance. Two Findings with the
same type, same source patterns, and same deposit evidence produce the same
fingerprint. That is the definition of a duplicate.

### How it is generated

Hash input encodes three dimensions:

1. finding_type (epistemic status)
2. load_bearing_patterns sorted by engine + pattern_key
3. deposit_evidence deposit_ids sorted

Construction:

```
finding_type
+ "|" + sorted(load_bearing_patterns).map(engine:pattern_key).join("|")
+ "|" + sorted(deposit_ids).join("|")
```

open_question findings have no deposit_evidence — hash is finding_type + "|" +
sorted patterns only. No collision with other types because finding_type is in
the input.

Same deposits + same patterns + different verdict = different fingerprint.

### Semantic duplicate limitation

The content fingerprint guarantees structural deduplication — the same sources
producing the same finding at the same epistemic status won't write twice. It
does not guarantee semantic deduplication — if Claude selects different deposits
to support the same insight on retry, the fingerprint diverges and both findings
write.

This is a deliberate tradeoff. Semantic deduplication would require comparing
finding content, which introduces interpretation into what should be a mechanical
process. LNV surfaces both findings. Sage resolves semantic overlap through the
research record, not the pipeline.

### Fingerprint collision

Two genuinely distinct Findings may theoretically produce the same fingerprint
if they have the same finding_type, draw from exactly the same patterns, and
reference the same deposits but surface different insights. This is a known risk.
Handling:

- The fingerprint match triggers a skip on retry.
- If Sage identifies a legitimate Finding was skipped due to collision, the
  Finding can be manually deposited to LNV as a native entry with MTM provenance
  noted.
- Collision frequency should be logged. If collisions are frequent, the
  fingerprint algorithm is revisited. This is a calibration concern, not an
  architectural one.

---

## FINDING VALIDATION CRITERIA

A Finding is valid if and only if all conditions pass. A Finding that fails any
condition is dropped and counted in findings_dropped with the specific failure
reason logged.

1. **finding_type present** — must be one of: confirmed, complicated, overturned,
   open_question.
2. **title present** — string, non-null, non-empty.
3. **content present** — string, non-null, non-empty.
4. **provenance present and complete** — source_type (convergence | gap),
   load_bearing_patterns (non-empty array), deposit_evidence (non-empty array
   for verdict findings; empty array permitted for open_question findings).
5. **content_fingerprint generation succeeds** — fingerprint computed from
   finding_type + load_bearing_patterns + deposit_evidence before write. If
   generation fails, the Finding is dropped. A Finding cannot be written without
   a fingerprint.

Drop reasons logged per Finding:

```
invalid_finding_type | missing_title | missing_content |
invalid_provenance | empty_load_bearing_patterns |
missing_deposit_evidence | fingerprint_failed
```

---

## DEDUPLICATION CHECK

Runs on every retry where prior_mtm_session_ids is present in the synthesis
endpoint call options. Never runs on a clean first-time synthesis —
prior_mtm_session_ids is null on clean runs and the check is skipped entirely.

### Session window definition

A session window is the set of all synthesis_session records linked to
routine_session records within the current DNR session — from the first failed
run through the current retry. DNR passes all failed mtm_session_ids for the
current window, not just the most recent. This is the only way to catch
duplicates across multiple consecutive retries.

### Sequence

1. Load all findings records where synthesis_session_ref ∈
   prior_mtm_session_ids array. Build a Set of their content_fingerprints.
   Call this the prior_fingerprints set.

2. For each candidate Finding extracted from the Pass 2 response:
   - a. Generate its content_fingerprint.
   - b. Check against prior_fingerprints.
   - c. If match found: skip. Do not write. Do not route. Log the skip —
     fingerprint, Finding title, prior session id.
   - d. If no match: write to PostgreSQL, add fingerprint to
     prior_fingerprints, proceed.

3. Only new Findings — those not present in any prior failed session in the
   current window — are written and included in the result object's findings
   array.

---

## MTM PROVENANCE FILTER

MTM generates findings → findings enter PCV as hypotheses (mtm_provenance =
true) → PCV topology updated → if MTM's synthesis payload ever includes PCV
state (for context, deduplication, or hypothesis awareness), MTM reads its own
prior output as if it were independent evidence → confirmation loop.

**Fix:** Any PCV data included in MTM's synthesis payload must flag
mtm_provenance hypotheses as downstream outputs, not independent sources. Prompt
instructs accordingly:

"Hypotheses in PCV marked mtm_provenance originated from this system's prior
synthesis passes. They are downstream outputs. Do not treat them as independent
corroboration of the patterns that generated them."

This filter applies whether MTM reads PCV in V1 or in a later version. The
constraint is specified now so the loop cannot be introduced accidentally when
MTM's input scope expands.

---

## SYNTHESIS RESULT OBJECT

The exact shape returned to DNR on every call — success or failure. DNR reads
this object. Nothing else.

```json
{
  "status": "complete | failed",

  "failure_type": "null | pre_synthesis | pass_1_failed | mid_synthesis | pass_2_failed",

  "findings": [],

  "findings_confirmed": 0,
  "findings_complicated": 0,
  "findings_overturned": 0,
  "findings_open_question": 0,

  "findings_dropped": 0,

  "mtm_session_id": "string",

  "patterns_filtered_count": 0,
  "deposits_pulled_count": 0,
  "convergence_deposits_pulled": 0,
  "gap_deposits_pulled": 0,

  "synthesis_duration_ms": 0
}
```

Field definitions:

- **status** — `complete` or `failed`.
- **failure_type** — null on complete runs. `pre_synthesis` if engine output
  read failed. `pass_1_failed` if Pass 1 Claude API call or JSON parse failed.
  `mid_synthesis` if Selection Function failed. `pass_2_failed` if Pass 2 Claude
  API call or JSON parse failed.
- **findings** — array of Finding records produced in this cycle. Empty array on
  pre_synthesis failure or clean run with no patterns. Partial array possible on
  pass_2_failed if some verdicts parsed before failure. New Findings only on
  retry — deduplicated against prior session.
- **findings_confirmed** — count of findings with finding_type: confirmed.
- **findings_complicated** — count of findings with finding_type: complicated.
- **findings_overturned** — count of findings with finding_type: overturned.
- **findings_open_question** — count of findings with finding_type: open_question.
- **findings_dropped** — integer. Count of candidates that were dropped at
  validation, skipped by deduplication, or lost to fingerprint failure. Zero on
  clean runs. DNR passes this to LNV alongside finding counts.
- **mtm_session_id** — the synthesis_sessions record id for this cycle. Always
  present — the record is created at cycle start before any failure can occur.
- **patterns_filtered_count** — integer. How many patterns passed the synthesis
  threshold filter across all 5 engines.
- **deposits_pulled_count** — integer. Total deposits resolved by the Selection
  Function (Mode 1 + Mode 2).
- **convergence_deposits_pulled** — integer. Deposits resolved via Mode 1
  (convergence resolution).
- **gap_deposits_pulled** — integer. Deposits resolved via Mode 2 (gap
  resolution).
- **synthesis_duration_ms** — integer. Wall-clock time from session record
  creation to status write (complete or failed).

---

## STORE: synthesis_sessions

| Field | Type | Description |
| --- | --- | --- |
| id | auto | Primary key |
| session_date | timestamp | Written when record is created. Never updated. |
| status | enum | `in_progress`, `complete`, `failed`. |
| failure_type | enum | null, `pre_synthesis`, `pass_1_failed`, `mid_synthesis`, `pass_2_failed`. Null on complete runs. |
| engine_read_started_at | timestamp / null | When engine output read began. |
| engine_read_completed_at | timestamp / null | When engine output read completed. |
| pass_1_started_at | timestamp / null | When Pass 1 Claude API call began. |
| pass_1_completed_at | timestamp / null | When Pass 1 Claude API call completed. |
| selection_started_at | timestamp / null | When Selection Function began. |
| selection_completed_at | timestamp / null | When Selection Function completed. |
| pass_2_started_at | timestamp / null | When Pass 2 Claude API call began. |
| pass_2_completed_at | timestamp / null | When Pass 2 Claude API call completed. |
| pass_1_brief | jsonb | Full Synthesis Brief from Pass 1. Stored for reproducibility. |
| engines_read | array of strings | Engine codes confirming which engines were read. Expected: [THR, STR, INF, ECR, SNM]. |
| patterns_filtered_count | integer | How many patterns passed the synthesis threshold filter. |
| deposits_pulled_count | integer | Total deposits resolved by the Selection Function. |
| convergence_deposits_pulled | integer | Deposits resolved via Mode 1. |
| gap_deposits_pulled | integer | Deposits resolved via Mode 2. |
| findings_confirmed | integer / null | Count of confirmed findings. Null if in_progress or failed before Finding production. |
| findings_complicated | integer / null | Count of complicated findings. |
| findings_overturned | integer / null | Count of overturned findings. |
| findings_open_question | integer / null | Count of open_question findings. |
| findings_dropped | integer | Count of candidates dropped at validation, deduplication, or fingerprint failure. |
| dedup_skipped | boolean | false on clean runs and on retries where prior session load succeeded. true when prior_mtm_session_ids was passed but prior session findings could not be loaded. Null until dedup step executes. |
| pass_1_prompt_version | string | Version of the Pass 1 synthesis prompt used. |
| pass_2_prompt_version | string | Version of the Pass 2 verification prompt used. |
| created_at | timestamp | Written once at record creation. Never updated. |

---

## STORE: findings

| Field | Type | Description |
| --- | --- | --- |
| id | auto | Primary key |
| synthesis_session_ref | foreign key | References synthesis_sessions.id |
| finding_type | enum | `confirmed`, `complicated`, `overturned`, `open_question` |
| title | string | Named output. Required. |
| content | text | The full structured output of the Finding. |
| provenance | jsonb | Full provenance chain. Structure: { pass_1_brief_id, source_type (convergence / gap), source_description, load_bearing_patterns: [{ engine, pattern_key, why }], deposit_evidence: [{ deposit_id, role (supporting / contradicting), contribution }], prompt_versions: { pass_1, pass_2 } } |
| attached_open_question | foreign key / null | References findings.id. Links a confirmed or complicated finding to an unresolved question about it. The open_question also exists as its own Finding record. |
| resolves_open_question | foreign key / null | References findings.id. On verdicts that resolve a prior open_question Finding. The resolved Finding gets resolved: true, resolved_by pointing back here. |
| content_fingerprint | string | Deterministic key derived from finding_type + load_bearing_patterns + deposit_evidence at Finding production time. Used for deduplication on retry runs. Never null. Never updated after write. See CONTENT FINGERPRINTING. |
| lnv_routing_status | enum | `pending`, `deposited`, `failed`. pending: Finding produced, LNV deposit not yet written. deposited: successfully routed to LNV (47) via DNR handoff. failed: LNV deposit attempt failed, retry permitted. |
| lnv_deposit_id | foreign key / null | References LNV deposit entry id. Null until lnv_routing_status → deposited. |
| resolved | boolean | Default false. Set to true when a subsequent synthesis session produces a verdict that resolves this open_question. Only populated on finding_type: open_question. |
| resolved_by | foreign key / null | References findings.id — the Finding that resolved this question. Only populated on finding_type: open_question. |
| resolved_at | timestamp / null | When resolution occurred. Duration open (resolved_at minus created_at) is a queryable research signal. Only populated on finding_type: open_question. |
| created_at | timestamp | Written once at record creation. Never updated. |

---

## SYNTHESIS SEQUENCE

Fires when DNR triggers the MTM synthesis endpoint (POST /mtm/synthesize).
options.prior_mtm_session_ids is present on retry runs. options is null or
empty on clean first-time runs.

1. **Create synthesis_session record.** Write status → in_progress. Write
   session_date and created_at. mtm_session_id is now available for the result
   object regardless of what happens next.

2. **Read engine outputs from all 5 Axis engines.** Write engine_read timestamps.
   Apply synthesis threshold filter (MTM_SYNTHESIS_THRESHOLD = 1.2). Write
   engines_read, patterns_filtered_count. Build engine frame (one-sentence
   summary per engine from state snapshot). If any engine read fails: status →
   failed, failure_type → pre_synthesis. Halt.

3. **Deduplication setup.** If options.prior_mtm_session_ids is present: load
   all findings records from all failed sessions in the current session window.
   Build prior_fingerprints Set from their content_fingerprints. Write
   dedup_skipped → false. If prior session load fails: log the failure, write
   dedup_skipped → true. Proceed without deduplication. If
   options.prior_mtm_session_ids is absent: write dedup_skipped → false. Skip
   dedup entirely.

4. **Pass 1 — Claude API call.** Write pass_1 timestamps. Payload: engine frame
   + filtered patterns. Parse Synthesis Brief. Store as pass_1_brief on the
   synthesis_sessions record. If API call or parse fails: failure_type →
   pass_1_failed. Halt.

5. **Selection Function.** Write selection timestamps. Mode 1: resolve
   convergence deposit_ids from load_bearing_patterns via engine pattern
   weight_breakdowns. Mode 2: resolve gap deposits (deposits in anchor window
   from expected engines, exclude deposit_ids already present in any pattern
   above threshold). Write deposits_pulled_count, convergence_deposits_pulled,
   gap_deposits_pulled. If deposit pull fails: failure_type → mid_synthesis.
   Halt.

6. **Pass 2 — Claude API call.** Write pass_2 timestamps. Payload: Synthesis
   Brief + targeted deposits. Parse verdicts + open_questions. If API call or
   parse fails: failure_type → pass_2_failed. Halt.

7. **Finding production.** Create a Finding record per verdict + per
   open_question. Link attached_open_questions where verdicts reference
   unresolved aspects. Check for prior open_question Findings that this session's
   verdicts resolve — if found, create the resolving Finding with
   resolves_open_question set, and update the prior open_question record's
   resolved, resolved_by, resolved_at fields. Generate content_fingerprints.
   Run deduplication against prior_fingerprints Set if it exists. Write valid
   Findings to PostgreSQL. Write typed finding counts (findings_confirmed,
   findings_complicated, findings_overturned, findings_open_question) and
   findings_dropped to the synthesis_sessions record.

8. **Write status → complete. Assemble and return result object to DNR.**

---

## PUBLIC API

### POST /mtm/synthesize

The sole public entry point. Called by DNR only. Never called directly from any
other system.

**Options** — optional object:

```json
{
  "prior_mtm_session_ids": ["string"] | null
}
```

Present on retry runs. DNR passes the full array of all failed mtm_session_ids
from the current session window — not just the most recent. Null or absent on
clean first-time runs.

**Returns:** result object as defined in SYNTHESIS RESULT OBJECT section. Always
resolves — never throws to the caller. Failures are captured in the result
object, not propagated as exceptions.

Everything else in the MTM synthesis service is internal. No other endpoint is
exposed or called externally.

---

## NEXUS FEED

### Liber Novus (LNV · 47)

Receives MTM Findings via DNR handoff after every successful synthesis cycle,
and failure notification payloads after every failed cycle. MTM does not write
to LNV directly. The result object is DNR's to route. LNV holds Findings with
MTM provenance intact — synthesis_session_ref, provenance chain, and
content_fingerprint are permanently legible on every Finding that lands there.

### Pattern Convergence (PCV · 50)

Reads MTM Findings as pre-processed input per PCV structural rule 1. MTM
Findings are not raw deposits on PCV — they arrive with provenance intact and
are held as a distinct category. PCV does not receive Findings directly from
MTM. It reads from what LNV holds after the DNR handoff completes.

---

## KNOWN FAILURE MODES

### 1. Engine output read fails before synthesis

One or more engine services unavailable or returning errors. Synthesis cannot
run. No Findings produced.

**Guard:** If any engine output read fails at step 2, status → failed,
failure_type → pre_synthesis. Result object returned immediately. DNR surfaces
failure to LNV. Retry available.

### 2. Pass 1 — Claude API returns malformed JSON

JSON parse throws. No Synthesis Brief can be extracted.

**Guard:** JSON parse is wrapped in try/catch. On parse failure: status →
failed, failure_type → pass_1_failed. Result object returned to DNR.

### 3. Selection Function — deposit resolution fails

Engine pattern weight_breakdowns cannot resolve deposit_ids, or gap resolution
query fails.

**Guard:** On Selection Function failure: status → failed, failure_type →
mid_synthesis. Pass 1 Brief is preserved on the session record. Result object
returned to DNR.

### 4. Pass 2 — Claude API returns malformed JSON

JSON parse throws. No verdicts can be extracted.

**Guard:** JSON parse is wrapped in try/catch. On parse failure: status →
failed, failure_type → pass_2_failed. Pass 1 Brief and Selection Function
results are preserved. Result object returned to DNR.

### 5. Deduplication check not running on retry

prior_mtm_session_ids not passed by DNR. Dedup Set is never built. Claude
produces the same Findings again. All of them write. LNV receives duplicates.

**Guard:** DNR always passes prior_mtm_session_ids on retry calls. MTM checks
for its presence before every Finding write. If prior_mtm_session_ids was passed
but the prior session load failed, the skip is logged and dedup_skipped → true.

### 6. Findings written without content_fingerprint

Deduplication has no key to check against on future retries.

**Guard:** content_fingerprint generation runs before every PostgreSQL write at
step 7. A Finding cannot be written without a fingerprint. If fingerprint
generation fails, the Finding is dropped and logged.

### 7. Fingerprint collision — legitimate Finding skipped

Two genuinely distinct Findings produce the same fingerprint because they share
finding_type, patterns, and deposit_ids but surface different insights.

**Guard:** Collisions are logged with full detail. Sage can manually deposit the
skipped Finding to LNV. If collision frequency is high, fingerprint algorithm is
reviewed.

### 8. MTM synthesis endpoint called outside DNR

MTM fires without session context. No routine_session record exists.

**Guard:** POST /mtm/synthesize is the sole external trigger. All other internal
functions are unexposed. DNR is the only caller.

### 9. Empty states — four distinct cases

**State A — No engine patterns above threshold.** All engines read successfully
but zero patterns pass the synthesis threshold filter. patterns_filtered_count:
0. Pass 1 not called. findings counts all 0, findings_dropped: 0, status:
complete. Clean empty.

**State B — Synthesis Brief contains no convergences or gaps.** Engine patterns
exist and Pass 1 runs but Claude identifies no cross-engine convergences or
meaningful gaps. Brief has empty convergences and empty declared_gaps. Selection
Function resolves zero deposits. Pass 2 not called. status: complete. Clean
empty.

**State C — Pass 2 produces no verdicts.** Selection Function resolves deposits
but Pass 2 Claude call returns empty verdicts and empty open_questions. status:
complete. Clean empty.

**State D — Candidates produced but all dropped.** Pass 2 returned verdicts.
All were dropped at validation, deduplication, or fingerprint failure. Typed
finding counts all 0, findings_dropped > 0, status: complete. Not a failure
state but not a clean empty either. LNV surfaces the drop count.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| backend/services/mtm.py | MTM synthesis service — engine output reading, synthesis threshold filter, Pass 1 Claude API call, Selection Function, Pass 2 Claude API call, Finding validation, content fingerprinting, deduplication, open question lifecycle, synthesis_sessions and findings PostgreSQL writes, result object assembly | PLANNED |
| backend/routes/mtm.py | FastAPI MTM endpoint — POST /mtm/synthesize trigger, result object response | PLANNED |
