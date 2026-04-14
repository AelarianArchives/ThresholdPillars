# EMERGENCE SCHEMA

## /DESIGN/Systems/Emergence/EMERGENCE SCHEMA.md

Mechanical spec — detectors, finding shape, commit hook, nudge, Claude API,
severity, failure modes. Architectural description in SYSTEM_ Emergence.md.


OWNERSHIP BOUNDARIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OWNS
Eight detectors — algorithms, thresholds, calibration constants
Finding shape — canonical record structure for all detectors
emergence_findings PostgreSQL table — distinct from MTM's findings table
Severity criteria — assignment rules per detector
Commit hook — change significance filter, detection sequence
Claude API integration — narrative endpoint, nudge scan, model constant
Proactive nudge — per-severity cooldown, suppression list, dedup
Change significance filter — skip logic for minor edits
Detection config versioning — tracking which config produced which findings
LNV routing — payload shape for POST /api/lnv/receive
Known failure modes — all guards and recovery paths

DOES NOT OWN
Architectural identity — owned by SYSTEM_ Emergence.md
Nexus feed definitions — owned by SYSTEM_ Emergence.md
Tag pipeline — owned by tagger service
Thread Trace navigation — owned by Thread Trace
Entry schema — owned by INTEGRATION DB SCHEMA.md
MTM findings table — owned by MTM
Routing authority — owned by SOT


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NAMED CONSTANTS — ALL CALIBRATION ITEMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Detector thresholds:
  CLUSTER_MIN_SIZE       = 3      — minimum tags per cluster component
  BRIDGE_THRESHOLD       = 0.65   — bridgeScore cutoff
  INFLUENCE_THRESHOLD    = 0.78   — equilibriumState cutoff
  CROSS_CAT_MIN_ENTRIES  = 2      — minimum shared entries
  VOID_COVERAGE_FLOOR    = 0.3    — tagged entry ratio floor (30%)
  NPA_SPIKE_RATIO        = 0.4    — non-primary arc tag ratio (40%)
  DRIFT_PHASE_WINDOW     = 2      — phases back for drift check
  NULL_CLUSTER_MIN_SIZE  = 3      — minimum null observations per
                                    cluster. PLANNED — dependent on
                                    null observation data model.

Nudge:
  NUDGE_COOLDOWN_HIGH_MS = 240000 — 4 min. High-severity findings.
  NUDGE_COOLDOWN_LOW_MS  = 600000 — 10 min. Low/medium severity.
  NUDGE_INIT_DELAY_MS    = 4000   — delay before first scan after
                                    app load.

Detection:
  WEIGHT_DETECTION       = true   — apply deposit_weight multipliers
                                    in detection computations.
                                    Toggle for calibration.
  DETECTION_SKIP_THRESHOLD        — change significance filter.
                                    Minor edits (weight adjustment,
                                    note edit) skip detection pass.
                                    Significant changes (new tag,
                                    routing change, new deposit,
                                    doc_type change) always fire.
                                    Calibration item at build.

Model:
  EMERGENCE_NARRATIVE_MODEL       — Claude model for all Emergence
                                    API calls (narrative + nudge).
                                    Defined once in constants file,
                                    referenced everywhere. Update
                                    this constant when model changes.
                                    Do not embed string literals in
                                    individual endpoints.

All starting reference values are PLANNED — confirm at build.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EIGHT DETECTORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each detector runs across the tag set and entry corpus passed to
runDetectors(). Each produces zero or more findings. All findings
share the canonical finding shape defined below.

When WEIGHT_DETECTION is true, all detectors apply deposit_weight
multipliers from the deposit record (high: 2.0, standard: 1.0,
low: 0.5). A cluster built from high-weight analyses and hypotheses
is structurally more significant than the same cluster built from
raw entry fragments. Particularly load-bearing for bridge and
influence detectors.

1. CLUSTER
  Builds a co-occurrence graph from tag → entry membership. Tags
  that appear together in entries form connected components.
  Components above CLUSTER_MIN_SIZE are flagged as cluster findings.

2. BRIDGE NODE
  Identifies tags with high bridgeScore — tags that connect
  otherwise separate clusters. A bridge node sits between two or
  more distinct communities in the co-occurrence graph. Its removal
  would disconnect them. Threshold: BRIDGE_THRESHOLD.

3. HIGH INFLUENCE
  Identifies tags with high equilibriumState — tags whose activation
  reliably precedes or accompanies activation of many other tags.
  Influence is not frequency. Threshold: INFLUENCE_THRESHOLD.

4. CROSS-CATEGORY
  Identifies pairs of tags from different seeds or pillars that
  share entries above CROSS_CAT_MIN_ENTRIES. Surfaces connections
  the routing architecture did not predict.

5. DRIFT
  Identifies tags active in recent phases that have faded — presence
  declining across DRIFT_PHASE_WINDOW. Names what is losing signal.

6. VOID ZONE
  Identifies sections with tagged entry ratio below
  VOID_COVERAGE_FLOOR. Gaps in the signal map. Void zone findings
  route to the Observatory coverage gap view — NOT to the Void engine
  page (VOI). VOI aggregates confirmed observational absence. Void
  zones are coverage gaps. Structurally distinct.

7. NPA SPIKE
  Identifies sessions where non-primary arc tags exceed
  NPA_SPIKE_RATIO. Signal landing outside expected routing path.

8. NULL CLUSTER — PLANNED
  Runs a second pass on null-observation entries only. Clusters of
  null observations around specific tag sets — the researcher
  consistently looking for patterns and finding nothing. Produces
  cluster_null findings. Feeds directly into the Void engine.
  NULL_CLUSTER_MIN_SIZE as calibration constant. Dependent on null
  observation data model confirmation at build time.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEVERITY CRITERIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Severity is a structural assessment based on scope, persistence,
and routing implications. Not aesthetic.

  low     — narrow scope, single section or small tag subset,
            no cross-domain propagation. Watchlist only.

  medium  — spans multiple sections or involves significant node,
            appears in more than one detection pass, cross-domain
            signal present but not yet convergent. Track actively.

  high    — system-wide or involves bridge/high-influence tag,
            consistent across multiple sessions or phases,
            cross-domain convergence confirmed or strongly indicated.
            Input to DTX classification and SGR grading.

Severity assigned by detector at creation time. Not retrospectively
adjusted by this system. SGR re-evaluates independently.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINDING SHAPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All detectors produce findings in this canonical shape:

    {
      id:                     string — 'emg_[timestamp]_[rand]'
      type:                   string — 'cluster' | 'bridge' |
                              'influence' | 'cross_category' |
                              'drift' | 'void' | 'npa_spike' |
                              'cluster_null'
      title:                  string — human-readable label
      description:            string — structural description
      severity:               string — 'low' | 'medium' | 'high'
      metrics:                object — numeric values from detector.
                              Always includes doc_type_distribution
                              (see below).
      involvedTags:           object[] — tags implicated
      involvedEntries:        object[] — entries implicated. This is
                              what Thread Trace reads.
      canTrace:               boolean — gates "Trace this pattern"
                              button
      detection_config_version: string — version marker of the
                              calibration constants active at
                              detection time. Maps to a stored
                              config record.
    }

DOC_TYPE_DISTRIBUTION IN METRICS:

Every finding's metrics object includes:

    doc_type_distribution: {
      observation: integer,
      analysis: integer,
      hypothesis: integer,
      entry: integer,
      discussion: integer,
      transcript: integer,
      glyph: integer,
      media: integer,
      reference: integer
    }

Counts of involvedEntries by doc_type. A cluster where 80% of
entries are hypotheses means something different than one where 80%
are transcripts. PCV and DTX read this downstream — they know what
the finding was built from without re-querying the corpus.

DETECTION CONFIG VERSIONING:

detection_config_version is a snapshot marker of the calibration
constants active when the finding was produced. When Sage looks at
findings longitudinally, she can see which were produced under
which detection configuration. Calibration changes become visible
in the historical record rather than silently redefining what old
findings mean.

Same principle as prompt versioning in SNM and Void. The detection
config includes: all threshold constants, WEIGHT_DETECTION state,
EMERGENCE_NARRATIVE_MODEL, and any prompt template versions.

PERSISTENCE:

Findings write to the emergence_findings PostgreSQL table (distinct
from MTM's findings table). Each detection pass writes findings with
full provenance. Findings are persistent and queryable across
sessions — not ephemeral.

LNV ROUTING:

Emergence findings route to LNV via POST /api/lnv/receive with
entry_type: emergence_finding.

    {
      entry_type:     "emergence_finding"
      source_system:  "emergence"
      source_page:    null
      content: {
        finding_id:   string
        type:         string
        title:        string
        description:  string
        severity:     string
        metrics:      object (includes doc_type_distribution)
        involvedTags: object[]
        detection_config_version: string
      }
    }


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMMIT HOOK — onTagSessionComplete()
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After every panel save, the frontend evaluates whether a detection
pass should fire.

CHANGE SIGNIFICANCE FILTER:

Before the detection pass fires, the commit delta is evaluated
against DETECTION_SKIP_THRESHOLD:

  Significant changes — always fire full detection pass:
    New tag added, tag removed, routing change, new deposit,
    doc_type change, observation_presence change.

  Minor changes — skip detection pass, return cached findings:
    Tag weight adjustment only, note edit only, no new tags,
    no routing changes.

This is not premature optimization. At scale, detection on every
minor edit becomes a real performance problem. The filter is in the
schema before build so the builder doesn't retrofit it later.

DETECTION SEQUENCE (when significance filter passes):

1. Entry saved via POST /entries/ — written to PostgreSQL.
2. Tagger store clears suggestion result.
3. Frontend calls POST /entries/{id}/detect with entry id.
4. Emergence service queries fresh entry corpus from PostgreSQL.
   Includes the just-committed entry (CORPUS FRESHNESS RULE).
5. All detectors run against tags and fresh corpus. Findings
   written to emergence_findings with detection_config_version.
6. If overlay is open, frontend refreshes with new findings.
7. Proactive nudge evaluated (see PROACTIVE NUDGE below).

CORPUS FRESHNESS RULE:

The detection pass always queries entries fresh from PostgreSQL.
Never cached data. The entry that just triggered the commit is the
reason the analysis is running — running detectors on a corpus that
does not yet include that entry is structurally incorrect. One
database query per significant commit. This is acceptable. The
freshness rule is non-negotiable.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLAUDE API INTEGRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Model: EMERGENCE_NARRATIVE_MODEL (named constant). Used for all
Emergence API calls.

ON-DEMAND FINDING NARRATIVES:

Triggered by requestNarrative(finding). Returns a narrative that
translates the structural finding into framework language — what
the detector measured, expressed using Threshold Pillars terminology.

Not interpretation. Translation. The narrative does not expand
beyond the finding's metrics, involved tags, and structural
description.

PROACTIVE NUDGE:

Runs after a detection pass if findings above significance threshold
are present and the cooldown has elapsed.

Per-severity cooldown:
  High severity: NUDGE_COOLDOWN_HIGH_MS (shorter — surface quickly)
  Low/medium: NUDGE_COOLDOWN_LOW_MS (longer — don't spam)

Behavior:
  Surfaces a single highest-significance unseen finding as a
  non-blocking notification. Does not open the overlay. Invites
  attention without demanding it.

Finding deduplication:
  _seenKeys tracks findings by type::title within the session.
  Nudge does not repeat findings already seen. Never cleared
  mid-session.

SESSION-SCOPED SUPPRESSION:

Sage can dismiss a nudge type for the remainder of the session
with one action. suppressed_types: string[] held in session state
(not persisted — session-scoped only). Nudge check filters against
suppressed types before surfacing. Suppression clears on next
session open — the nudge system resets clean.

A system that Sage can't silence becomes noise. A system she can
silence on demand gets listened to.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THREE OVERLAY MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All three render inside the same overlay shell. Tab navigation
switches modes without closing the overlay.

  translation — findings from the most recent detection pass.
    Primary mode after tag commit. Finding cards with metrics,
    involved tags, severity, doc_type distribution, trace button.

  timeline — entries bucketed by time. Structural view of when
    signal arrived and how it distributed across phases and
    sections.

  trace — findings with Thread Trace integration foregrounded.
    Trace buttons prominent. openFromFinding() opens directly
    in this mode.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THREAD TRACE BRIDGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

openFromFinding() hands off to the Thread Trace Svelte component,
passing finding data. Svelte resolves component imports at build
time — no circular dependency concern.

canTrace gates the "Trace this pattern" button. In Svelte
architecture, components are always available once mounted — the
gate is effectively always true when the app is running.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PUBLIC API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BACKEND ENDPOINTS:

POST /entries/{id}/detect — run detection pass
  Triggered after significant tag commit. Runs all detectors
  against current corpus. Writes findings to emergence_findings.
  Returns findings array. Skipped if change significance filter
  determines the edit was minor.

GET /entries/findings — query findings
  Returns findings filtered by type, severity, section, time range,
  or detection_config_version. Supports pagination. Findings are
  persistent and queryable across sessions.

POST /entries/findings/{id}/narrative — request finding narrative
  Triggers Claude API call via EMERGENCE_NARRATIVE_MODEL. Returns
  narrative text.

GET /entries/findings/nudge — proactive nudge check
  Returns highest-significance unseen finding if per-severity
  cooldown has elapsed and type is not in suppressed_types.

POST /entries/findings/nudge/suppress — suppress nudge type
  Adds a finding type to session-scoped suppressed_types list.
  Clears on next session open.

FRONTEND INTERFACE:

Svelte Emergence component. Calls FastAPI endpoints via API client.

  open(mode) — opens overlay in translation | timeline | trace
  openFromFinding(finding) — opens overlay in trace mode
  requestNarrative(finding) — calls narrative endpoint
  suppressNudgeType(type) — suppresses nudge type for session


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWN FAILURE MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. EMERGENCE SERVICE UNREACHABLE
FastAPI endpoints down. Detection passes don't run. Findings not
generated. Guard: frontend displays error state. Entry save is not
blocked. Missing findings visible as gaps in the findings timeline.

2. DETECTION PASS ON STALE CORPUS
Detection queries before just-committed entry is visible in
PostgreSQL. Guard: detection runs after entry write transaction
commits. Always queries fresh. Never cached data at commit time.

3. PGVECTOR QUERY TIMEOUT
Similarity queries exceed timeout on large corpus. Guard: pgvector
queries use appropriate index (IVFFlat or HNSW). Timeout returns
error, not partial results. Retry is safe — detection is idempotent.

4. FINDINGS NOT DEDUPED ACROSS NUDGE CALLS
Same finding surfaces repeatedly. Guard: _seenKeys tracked by
type::title within session. Per-severity cooldown prevents rapid
re-fire. Session-scoped suppression gives Sage control.

5. GRAPH EXPORT BEFORE GRAPH PAGE EXISTS
Graph route is a stub. Guard: graph export disabled until graph
route is live. Follows Thread Trace's coordination.

6. CLAUDE API FAILURE DURING NARRATIVE
API unreachable or rate-limited. Guard: endpoint returns HTTP error.
Finding data still available. Frontend displays finding without
narrative and allows retry.

7. DETECTION PASS ON MINOR EDIT
Full seven-detector pass fires on weight adjustment or note edit.
Identical findings produced. Wasted computation.
Guard: change significance filter evaluates commit delta before
detection fires. Minor changes return cached findings.

8. HISTORICAL FINDINGS COMPARED ACROSS CONFIG VERSIONS
Bridge finding from BRIDGE_THRESHOLD = 0.65 compared to one from
0.58. Not directly comparable but nothing marks the difference.
Guard: detection_config_version on every finding record. Sage can
see which config produced which findings. Calibration changes are
visible in the historical record.

9. EMERGENCE FINDINGS COLLISION WITH MTM FINDINGS TABLE
Both systems write "findings." Different shapes, different
provenance, different consumers. Silent collision at build time.
Guard: Emergence writes to emergence_findings. MTM writes to
findings. INTEGRATION DB SCHEMA lists both tables with distinct
ownership.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

backend/services/emergence.py
  Eight detectors, pgvector queries, finding persistence to
  emergence_findings, proactive nudge with per-severity cooldown,
  change significance filter, detection config versioning,
  deposit_weight application.
  Status: PLANNED

backend/routes/emergence.py
  FastAPI endpoints — detect, query findings, narrative, nudge
  check, nudge suppress.
  Status: PLANNED

frontend emergence components
  Svelte — three overlay modes (translation, timeline, trace),
  finding cards with doc_type distribution, trace button, nudge
  notification with session-scoped suppression.
  Status: PLANNED
