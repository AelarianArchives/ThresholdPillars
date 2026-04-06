# SYSTEM: Emergence

## /DESIGN/Systems/Emergence/

### Pattern detection engine · seven detectors · read-only analysis layer

---

## WHAT THIS SYSTEM OWNS

* Eight-detector pattern analysis engine — runs as FastAPI service-layer analysis, using pgvector similarity queries for cross-entry pattern detection
* emergence_findings PostgreSQL table — distinct from findings (MTM). Different record shape, different provenance, different downstream consumers
* Three-mode overlay — translation · timeline · trace (Svelte components)
* On-demand finding narratives via Claude API
* Proactive nudge — scheduled pattern scan with per-severity cooldown and session-scoped suppression
* Thread Trace bridge — hands off findings to Thread Trace Svelte component for thread navigation
* Graph export — assembles ThreadGraphPayload for the graph page
* Change significance filter — skips detection pass on minor edits

## WHAT THIS SYSTEM DOES NOT OWN

* Tag session logic or pipeline — owned by tagger service
* Thread navigation or overlay — owned by Thread Trace Svelte component and thread trace service
* Database schema definitions — owned by SQLAlchemy models (backend/models/) and INTEGRATION DB SCHEMA.md
* Writes to entries — read-only analysis layer. It never modifies what it reads.
* Entry schema — owned by SQLAlchemy models (backend/models/)
* MTM findings — owned by MTM. The findings table is MTM's. Emergence writes to emergence_findings.

---

## EIGHT DETECTORS

Each detector runs across the tag set and entry corpus. Each produces zero or more findings. All findings share the canonical finding shape defined in EMERGENCE SCHEMA.md.

1. **Cluster** — tags that consistently co-occur. They activate together. The pattern is structural, not coincidental.

2. **Bridge Node** — tags that connect otherwise separate clusters. Load-bearing connective tissue between domains. High structural significance.

3. **High Influence** — tags whose activation reliably precedes or accompanies activation of many other tags. Influence is not frequency.

4. **Cross-Category** — pairs of tags from different seeds or pillars that share entries. Connections the routing architecture did not predict.

5. **Drift** — tags that were active in recent phases but have faded. Names what is losing signal. DTX receives these as named drift events.

6. **Void Zone** — sections with low tag coverage. Gaps in the signal map where field activity exists but tagging has not reached. Void zone findings route to the dashboard coverage gap view — where the research hasn't looked. They do not route to the Void engine page (VOI), which aggregates confirmed observational absence where the researcher looked and found nothing. These are structurally distinct.

7. **NPA Spike** — sessions where non-primary arc tags dominate. Signal landing outside the expected routing path.

8. **Null Cluster** — clusters of null observations around specific tag sets. The researcher consistently looking for patterns and finding nothing. Feeds directly into the Void engine and makes Emergence and Void genuinely complementary. PLANNED — dependent on null observation data model confirmation at build time.

All detectors apply deposit_weight multipliers (2.0/1.0/0.5) to weight high-quality analyses and hypotheses above raw fragments. Toggleable via WEIGHT_DETECTION constant.

Detector thresholds, algorithms, and calibration constants in EMERGENCE SCHEMA.md.

---

## EMERGENCE AND AXIS ENGINES — INDEPENDENT

Emergence and the Axis engines (THR, STR, INF, ECR, SNM) analyze the same corpus from independent angles and do not coordinate. Emergence fires after every significant tag commit. Axis engines recompute on stale flag. Neither system reads or waits on the other.

This independence is intentional — the outputs are compared at MTM and Nexus, not at the detection layer. Do not wire them together.

---

## THREE OVERLAY MODES

All three modes render inside the same overlay shell. Tab navigation switches modes without closing the overlay.

**translation** — findings from the most recent detection pass. What the current tags produced across the detectors. Primary mode after a tag commit.

**timeline** — entries bucketed by time. Structural view of when signal arrived and how it distributed across phases and sections.

**trace** — findings with Thread Trace integration foregrounded. Designed for navigating from a finding into a full thread.

---

## THREAD TRACE BRIDGE

openFromFinding() hands off to the Thread Trace Svelte component, passing the finding data. canTrace on a finding gates the "Trace this pattern" button in the overlay.

---

## NEXUS FEED

**Pattern Convergence (PCV · 50)**
Reads cluster, bridge, and cross-category findings as interference pattern data. These three detector types produce the cross-domain signal PCV aligns on shared axes. Emergence names them. PCV interprets them.

**Drift Taxonomy (DTX · 48)**
Reads drift findings as named drift events for trajectory classification. Emergence detects fading. DTX classifies the trajectory — linear, oscillation, fragmentation, containment.

**Liber Novus (LNV · 47)**
Receives Emergence findings via POST /api/lnv/receive (entry_type: emergence_finding). Findings land with provenance intact: finding id, type, severity, involved tags, detection config version.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| backend/services/emergence.py | Eight detectors, pgvector queries, finding persistence, proactive nudge, change significance filter | PLANNED |
| backend/routes/emergence.py | FastAPI endpoints — detect, query findings, narrative, nudge check | PLANNED |
| frontend emergence components | Svelte — three overlay modes, finding cards, trace button, nudge notification with suppression | PLANNED |

All mechanical specs — detector algorithms, thresholds, finding shape, commit hook, Claude API, nudge mechanics, severity criteria, failure modes, calibration constants — in EMERGENCE SCHEMA.md.
