╔══════════════════════════════════════════════════════════════╗ ║ EMERGENCE SCHEMA · v1 ║ ║ /DESIGN/systems/emergence\\\_schema\\\_v1.md ║ ╚══════════════════════════════════════════════════════════════╝



OWNERSHIP BOUNDARIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



OWNS Seven-detector pattern analysis engine — runs as FastAPI service-layer analysis (backend/services/emergence.py), using pgvector similarity queries for cross-entry pattern detection Three-mode overlay — translation · timeline · trace (Svelte components) On-demand finding narratives via Claude API (routed through backend/services/claude.py) Proactive nudge — scheduled pattern scan with cooldown, triggered by FastAPI Thread Trace bridge — hands off findings to Thread Trace Svelte component for thread navigation Graph export — assembles ThreadGraphPayload for the graph page Findings persistence — findings write through FastAPI to PostgreSQL (findings table)



DOES NOT OWN Tag session logic or pipeline — owned by tagger service (backend/services/claude.py, backend/routes/tagger.py) Thread navigation or overlay — owned by Thread Trace Svelte component and thread trace service Database schema definitions — owned by SQLAlchemy models (backend/models/) and INTEGRATION DB SCHEMA.md Writes to entries — read-only analysis layer. Never modifies what it reads. Entry schema — owned by SQLAlchemy models (backend/models/)



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SEVEN DETECTORS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



Each detector runs across the tag set and entry corpus passed to runDetectors(). Each produces zero or more findings. All findings share the canonical finding shape defined below.



All threshold values are calibration constants. Starting reference values are given here. All are marked PLANNED — confirm at build.



1\. CLUSTER ━━━━━━━━━━ Builds a co-occurrence graph from tag → entry membership. Tags that appear together in entries form connected components. Components above the minimum size threshold are flagged as cluster findings.



CLUSTER\\\_MIN\\\_SIZE \\= 3 Minimum tags to flag a component as a cluster. PLANNED — confirm at build.



Finding meaning: these tags consistently co-occur. They activate together. The pattern is structural, not coincidental.



2\. BRIDGE NODE ━━━━━━━━━━━━━━ Identifies tags with high bridgeScore — tags that connect otherwise separate clusters. A bridge node sits between two or more distinct communities in the co-occurrence graph. Its removal would disconnect them.



BRIDGE\\\_THRESHOLD \\= 0.65 bridgeScore above this \\= bridge node. PLANNED — confirm at build.



Finding meaning: this tag is load-bearing. It is the connective tissue between domains that would otherwise not touch. High structural significance.



3\. HIGH INFLUENCE ━━━━━━━━━━━━━━━━━ Identifies tags with high equilibriumState — tags whose activation reliably precedes or accompanies activation of many other tags. Influence is not the same as frequency. A tag can appear rarely and still carry high influence if its appearances consistently pull other tags into activation.



INFLUENCE\\\_THRESHOLD \\= 0.78 equilibriumState above this \\= high influence. PLANNED — confirm at build.



Finding meaning: when this tag appears, the field moves.



4\. CROSS-CATEGORY ━━━━━━━━━━━━━━━━━ Identifies pairs of tags from different seeds or pillars that share entries above the minimum threshold. Cross-category findings surface connections the routing architecture did not predict — places where field signal is crossing structural boundaries.



CROSS\\\_CAT\\\_MIN\\\_ENTRIES \\= 2 Minimum shared entries to flag a cross-category link. PLANNED — confirm at build.



Finding meaning: two structurally separate domains are touching in the field. This is the interference pattern PCV reads.



5\. DRIFT ━━━━━━━━ Identifies tags that were active in recent phases but have faded — their presence is declining across the phase window. Drift findings name what is losing signal rather than gaining it.



DRIFT\\\_PHASE\\\_WINDOW \\= 2 Phases back to check for fading tag presence. PLANNED — confirm at build.



Finding meaning: this tag was load-bearing and is receding. DTX receives these findings as named drift events for trajectory classification.



6\. VOID ZONE ━━━━━━━━━━━━ Identifies sections with low tag coverage — sections where entries exist but are not being tagged, or are being tagged at a rate far below the corpus average. A void zone is a gap in the signal map.



VOID\\\_COVERAGE\\\_FLOOR \\= 0.3 Sections with \\< 30% tagged entries \\= void zone. PLANNED — confirm at build.



Finding meaning: there is field activity here that the tagging system has not reached. The data exists. The routing does not.



7\. NPA SPIKE ━━━━━━━━━━━━ Identifies sessions where non-primary arc tags dominate — where the tags activated do not align with the primary arc of the active section. A spike suggests the session is producing signal outside the expected routing path.



NPA\\\_SPIKE\\\_RATIO \\= 0.4 Non-primary arc tags \\> 40% of session \\= spike. PLANNED — confirm at build.



Finding meaning: the field is producing signal that is not landing where the architecture expects it. May indicate an emergent routing need or a misaligned section assignment.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SEVERITY CRITERIA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



Severity is not an aesthetic judgment. It is a structural assessment based on the finding's scope, persistence, and routing implications.



low Pattern is present but narrow in scope. Affects a single section or a small tag subset. No evidence of cross-domain propagation. Watchlist only — no immediate routing action required.



medium Pattern spans multiple sections or involves a structurally significant node. Appears in more than one detection pass. Cross-domain signal present but not yet convergent. Worth tracking actively — may escalate.



high Pattern is system-wide or involves a bridge node or high-influence tag. Appears consistently across multiple sessions or phases. Cross-domain convergence confirmed or strongly indicated. Requires routing attention — input to DTX classification and SGR grading.



ASSIGNMENT RULE ━━━━━━━━━━━━━━━ Severity is assigned by the detector at finding creation time. It is not retrospectively adjusted by the Emergence system. SGR re-evaluates signal weight against documented outcomes independently.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FINDING SHAPE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



All seven detectors produce findings in this canonical shape. No detector may deviate from this structure.



{ id string 'emg\\\_\\\[timestamp\\]\\\_\\\[rand\\]' Unique per finding per detection pass.



type            string    'cluster' | 'bridge' |  

&nbsp;                         'influence' |  

&nbsp;                         'cross\\\_category' |  

&nbsp;                         'drift' | 'void' |  

&nbsp;                         'npa\\\_spike'



title           string    Human-readable label for  

&nbsp;                         the finding.



description     string    Structural description of  

&nbsp;                         what was detected.



severity        string    'low' | 'medium' | 'high'  

&nbsp;                         Assigned at creation.  

&nbsp;                         Never changed by this system.



metrics         object    Numeric values from the  

&nbsp;                         detector calculation.  

&nbsp;                         e.g. { bridgeScore: 0.72,  

&nbsp;                                entryCount: 14 }



involvedTags    object\\\[\\]  Tags implicated in the  

&nbsp;                         finding.



involvedEntries object\\\[\\]  Entries implicated in the  

&nbsp;                         finding. This is what Thread  

&nbsp;                         Trace reads when building an  

&nbsp;                         Emergence thread from a  

&nbsp;                         finding.



canTrace        boolean   True if Thread Trace  

&nbsp;                         component can open a thread  

&nbsp;                         from this finding. Gates the  

&nbsp;                         "Trace this pattern" button  

&nbsp;                         in the overlay.



}



PERSISTENCE RULE ━━━━━━━━━━━━━━━━ Findings write through FastAPI to the PostgreSQL findings table (see INTEGRATION DB SCHEMA.md). Each detection pass writes its findings to the database with full provenance: finding id, type, severity, metrics, involved tags, involved entries. Thread Trace reads findings from PostgreSQL when building threads. Findings are queryable across sessions — they are not ephemeral.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ THREE OVERLAY MODES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



All three modes render inside the same overlay shell. Tab navigation switches modes without closing the overlay.



translation Renders the findings from the most recent tag session — what the current set of tags produced across the seven detectors. Primary mode after a tag commit. Shows finding cards with metrics, involved tags, severity, and trace button.



timeline Renders entries bucketed by time period. Shows how pattern activity has distributed across the corpus chronologically. Primary mode for phase-level pattern review.



trace Focused mode opened from a specific finding — either via the trace button on a finding card or via openFromFinding(). Shows the thread of entries and tags implicated in that finding. Hands off to the Thread Trace Svelte component for full thread navigation.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CLAUDE API INTEGRATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



Model: claude-sonnet-4-20250514 Used for all Emergence API calls.



ON-DEMAND FINDING NARRATIVES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Triggered by requestNarrative(finding). Produces a finding narrative in the language of the framework — a translation of what the detector already measured, expressed using framework terminology.



This is not interpretation added to the finding. It is a translation of what the detector measured. The narrative does not expand beyond the finding's metrics, involved tags, and structural description.



PROACTIVE NUDGE ━━━━━━━━━━━━━━━ Scheduled. Runs automatically after a detection pass if findings above a significance threshold are present and the cooldown has elapsed.



NUDGE\\\_COOLDOWN\\\_MS \\= 4 min (240000ms) Minimum interval between proactive nudge calls. PLANNED — confirm at build.



NUDGE\\\_INIT\\\_DELAY\\\_MS \\= 4000ms Delay before first scan after app load. PLANNED — confirm at build.



Behavior: — Surfaces a single high-significance finding as a non-blocking notification. — Does not open the overlay. — Invites attention without demanding it.



DEDUPLICATION RULE ━━━━━━━━━━━━━━━━━━ Findings already surfaced in the current session are tracked by key (type::title). The nudge does not repeat findings the user has already seen in this session. \\\_seenKeys holds the session-scoped set. Never cleared mid-session.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PUBLIC API ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



BACKEND ENDPOINTS ━━━━━━━━━━━━━━━━━━

All emergence operations route through FastAPI. The service reads entries and tags directly from PostgreSQL — no injected fetcher pattern. Representative endpoints — full contracts defined at build time against SOT.

POST /entries/{id}/detect — run detection pass
Triggered after tag commit. Runs all seven detectors against the current entry corpus using pgvector similarity queries. Writes findings to PostgreSQL. Returns findings array.

GET /entries/findings — query findings
Returns findings filtered by type, severity, section, or time range. Supports pagination. Findings are persistent and queryable across sessions.

POST /entries/findings/{id}/narrative — request finding narrative
Triggers Claude API call via backend/services/claude.py. Returns narrative text — a translation of what the detector measured, not interpretation beyond the finding's metrics.

GET /entries/findings/nudge — proactive nudge check
Returns the highest-significance unseen finding if cooldown has elapsed. Does not repeat findings already surfaced in the current session.

FRONTEND INTERFACE ━━━━━━━━━━━━━━━━━━━━

Svelte Emergence component — three overlay modes (translation, timeline, trace), finding cards, trace button, nudge notification. Calls FastAPI endpoints via API client. Representative interface — full implementation defined at frontend build time.

open(mode) — opens overlay in 'translation' | 'timeline' | 'trace' mode
openFromFinding(finding) — opens overlay in 'trace' mode focused on a specific finding
requestNarrative(finding) — calls POST /entries/findings/{id}/narrative, displays result



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMMIT HOOK — onTagSessionComplete() ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



After every panel save, the frontend triggers a detection pass. The pattern:

1. Frontend reads current suggestion from tagger store. Tags captured before clear.
2. Entry saved via POST /entries/ to FastAPI — written to PostgreSQL.
3. Tagger store clears suggestion result.
4. Frontend calls POST /entries/{id}/detect with the entry id.
5. Emergence service runs all seven detectors against the current corpus.
6. Findings written to PostgreSQL. Response returned to frontend.
7. If overlay is open, frontend refreshes with new findings.
8. Proactive nudge evaluated — if warranted, nudge notification surfaces.

The detection pass does not read from the tagger store. Tags are already persisted on the entry in PostgreSQL at step 2. The service reads the full corpus from PostgreSQL directly.

CORPUS FRESHNESS RULE ━━━━━━━━━━━━━━━━━━━━━ The detection pass always queries entries fresh from PostgreSQL. It does not rely on cached data.

The entry that just triggered the commit is the reason the analysis is running — running detectors on a corpus that does not yet include that entry is structurally incorrect. The finding produced would miss the most relevant connection.

The performance cost is one database query per commit. This is acceptable. The freshness rule is non-negotiable.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ THREAD TRACE BRIDGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



openFromFinding() hands off to the Thread Trace Svelte component, passing the finding data. The Svelte component import handles the dependency — no circular dependency concern (Svelte resolves component imports at build time, not at runtime).

canTrace GATE ━━━━━━━━━━━━━ canTrace on a finding gates the "Trace this pattern" button in the overlay. The button renders when the Thread Trace component is available. In the Svelte architecture, components are always available once mounted — the gate is effectively always true when the app is running.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ NEXUS FEED ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



PATTERN CONVERGENCE (PCV · 50\\) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Reads: cluster · bridge · cross-category findings as interference pattern data.



These three detector types produce the cross-domain signal PCV is designed to receive. A cross-category finding that tags from s04 and s15 share entries is exactly the kind of structural relationship PCV aligns on shared axes. Emergence names these findings with precision. PCV interprets them. Emergence does not.



DRIFT TAXONOMY (DTX · 48\\) ━━━━━━━━━━━━━━━━━━━━━━━━━ Reads: drift findings as named drift events for trajectory classification.



Emergence detects that a tag is fading. DTX classifies whether that fading is linear escalation, oscillation, fragmentation, or containment. The drift detector produces the event. DTX provides the taxonomy. DTX also receives the phase window and entry context embedded in the finding — that is the raw state data its classification runs against.



LIBER NOVUS (LNV · 47\\) ━━━━━━━━━━━━━━━━━━━━━━━ Receives: processed Emergence findings routed through Thread Trace or deposited directly as part of the Daily Nexus Routine.



Findings land on LNV with provenance intact: finding id, type, severity, involved tags, and the session context in which they were produced. LNV holds them without editorializing. Findings are traceable to the detection pass that produced them.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ KNOWN FAILURE MODES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



1\. EMERGENCE SERVICE UNREACHABLE FastAPI emergence endpoints are down. Detection passes do not run. Findings are not generated. Proactive nudge never fires. Guard: frontend displays error state when detection endpoint returns HTTP error. Entry save is not blocked — entries save without triggering detection. Missing findings are visible as gaps in the findings timeline.

2\. DETECTION PASS ON STALE CORPUS If the detection service queries entries before the just-committed entry is visible in PostgreSQL, the detector pass misses the most relevant connection. Finding produced is structurally incomplete. Guard: detection runs after the entry write transaction commits. The service queries entries fresh from PostgreSQL at the start of every detection pass. Never use cached data at commit time.

3\. PGVECTOR QUERY TIMEOUT Similarity queries across a large corpus exceed the query timeout. Detection pass returns partial or no results. Guard: pgvector queries use appropriate index (IVFFlat or HNSW) for performance. Query timeout returns error, not partial results. Frontend surfaces the timeout. Retry is safe — detection is idempotent.

4\. FINDINGS NOT DEDUPED ACROSS NUDGE CALLS Same finding surfaces as a nudge multiple times in one session. User sees repeated notifications for the same pattern. Guard: seen keys tracked by type::title within the session. Nudge only fires for findings with keys not yet seen.

5\. GRAPH EXPORT BEFORE GRAPH PAGE EXISTS Graph page route is a stub. Routing there before the page is built produces dead navigation. Guard: graph export remains disabled until the graph route is live. Graph export button state follows Thread Trace's coordination — Emergence does not independently enable graph export. GRAPH_PAGE_PATH imported from frontend/src/lib/config.ts.

6\. CLAUDE API FAILURE DURING NARRATIVE REQUEST Claude API is unreachable or rate-limited when a finding narrative is requested. Guard: endpoint returns appropriate HTTP error. Finding data is still available — only the narrative translation is missing. Frontend displays the finding without narrative and allows retry.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CALIBRATION VARIABLES — ALL PLANNED ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



CLUSTER\\\_MIN\\\_SIZE minimum cluster component size BRIDGE\\\_THRESHOLD bridgeScore cutoff INFLUENCE\\\_THRESHOLD equilibriumState cutoff CROSS\\\_CAT\\\_MIN\\\_ENTRIES minimum shared entries VOID\\\_COVERAGE\\\_FLOOR tagged entry ratio floor NPA\\\_SPIKE\\\_RATIO non-primary arc tag ratio DRIFT\\\_PHASE\\\_WINDOW phases back for drift check NUDGE\\\_COOLDOWN\\\_MS minimum nudge interval NUDGE\\\_INIT\\\_DELAY\\\_MS first scan delay after load



All starting reference values documented in detector sections above. All subject to calibration at build.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FILES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



| File | Role | Status |
| --- | --- | --- |
| backend/services/emergence.py | Seven detectors, pgvector similarity queries, finding persistence, proactive nudge scheduling | PLANNED |
| backend/routes/emergence.py | FastAPI endpoints — detect, query findings, narrative request, nudge check | PLANNED |
| frontend emergence components | Svelte — three overlay modes (translation, timeline, trace), finding cards, trace button, nudge notification | PLANNED |

