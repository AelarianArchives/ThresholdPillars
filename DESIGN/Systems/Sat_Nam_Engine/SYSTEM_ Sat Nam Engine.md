# SYSTEM: Sat Nam Engine

## /DESIGN/Systems/Sat_Nam_Engine/

### Page 06 · two-stream architecture · Claude structural analysis · pattern category classification · prompt versioning

---

## WHAT THIS SYSTEM OWNS

* SNM two-stream architecture — Stream 1: Sage's observations (tradition
  presence, co-occurrence, pattern category rates). Stream 2: Claude
  structural analysis (per-deposit and batch modes). Neither stream is
  privileged; both are data
* Claude API integration in compute step — structural analysis function
  within the engine compute pipeline. Uses shared Claude API client
  (backend/services/claude.py) with SNM-specific system prompt and
  context. Not a tagger — a structural analysis instrument
* snm_claude_snapshots table (PostgreSQL) — immutable snapshots of every
  Claude response. Never overwritten. If same deposit re-analyzed after
  prompt version bump, new snapshot created alongside old. History of
  analysis is data
* Correspondence computation — strength (weighted deposit count adjusted
  by confidence), clustering by pattern_category, genuine vs. surface
  classification (2.0x+/1.0–2.0x/below 1.0x)
* Stream agreement classification — convergent (both see it),
  researcher-led (Sage sees, Claude does not), knowledge-led (Claude
  surfaces, Sage does not)
* Pattern category classification — correspondences organized by manifest
  category (ancient_philosophy / triadic_architecture / celestial /
  uncategorized). pattern_category: null sits outside all three manifest
  categories (uncategorized = active research surface, not error)
* Prompt versioning — uses shared prompt_versions table
  (prompt_type: 'snm'). Three changelog triggers: sage_directed,
  calibration_triggered (repeated dismissals recommend bump), manual
* Two visualizations: bipartite force-directed graph (field patterns ×
  traditions, tradition nodes colored by pattern_category, uncategorized
  cluster explicit), temporal correspondence view (prompt version
  boundaries marked)
* SNM pattern_id format and generation
* SNM-specific snapshot_data JSON structure with claude_snapshot_summary
  (total_snapshots, latest_prompt_version, per_deposit_count,
  batch_count, unique_traditions, uncategorized_count)
* SNM failure modes

## WHAT THIS SYSTEM DOES NOT OWN

* Shared computation framework — owned by Engine Computation.
  Engine_Computation owns the four-step contract, baseline formula,
  deposit weight constants, signal classification, null observation
  flow, snapshot writes, and stale flag mechanics. SNM implements
  its lens within that contract
* Claude API client — owned by backend/services/claude.py (shared
  infrastructure). SNM owns its prompt templates and context assembly;
  the client is infrastructure
* prompt_versions table — owned by INTEGRATION DB SCHEMA.md. Shared
  with INT Parsing Partner. SNM reads and writes entries with
  prompt_type: 'snm'
* Database table definitions (except snm_claude_snapshots) — owned by
  INTEGRATION DB SCHEMA.md and OPERATIONAL DB SCHEMA.md
* Three manifest pattern categories (ancient_philosophy, triadic_architecture,
  celestial) — defined in Manifest_06_Sat_Nam.txt, not owned by this system
* Entry data — owned by INTEGRATION DB SCHEMA.md
* MTM synthesis — MTM reads SNM snapshots; SNM does not participate
  in synthesis
* Cosmology investigation — SNM's external knowledge problem (Claude
  applying known traditions) carries to Cosmology Tier 5 as a design
  reference, but SNM does not own Cosmology

---

## LENS

Structural correspondence between field patterns and known traditions.
Two independent analytical streams produce parallel readings of the
same deposits.

Stream 1 runs through the shared baseline — tradition presence rates,
co-occurrence, pattern category rates. Stream 2 calls Claude for
structural analysis (per-deposit for immediate context, batch for
relational context across sets).

After both streams complete, stream agreement classification labels
each correspondence as convergent, researcher-led, or knowledge-led.
The uncategorized cluster (pattern_category: null) is where a
correspondence sits outside the three manifest categories — an active
research surface, not a gap. The celestial category is the structural
bridge to the Cosmology group.

Most complex Axis engine — Claude embedded in the compute step.

All mechanical detail in SAT NAM ENGINE SCHEMA.md.

---

## NEXUS FEED

**Metamorphosis (MTM)**
Reads engine_snapshots — current, previous, delta. SNM correspondence
patterns, stream agreement data, and Claude snapshot summary consumed
at synthesis time.

**Liber Novus (LNV · 47)**
Receives visualization_snapshots via POST /api/lnv/receive.
Auto-triggered on signal delta or Sage-triggered on demand.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| DESIGN/Systems/Sat_Nam_Engine/SAT NAM ENGINE SCHEMA.md | Full mechanical spec — two-stream architecture, Claude integration, correspondence computation, prompt versioning, visualization specs, failure modes | COMPLETE |
| backend/services/engine_snm.py | SNM computation — two-stream compute, Claude calls (per-deposit + batch), correspondence computation, stream agreement classification | NOT STARTED |
| backend/routes/engines.py | SNM-specific endpoints — Claude snapshot read, prompt management (shared routes file with other engines) | NOT STARTED |
| frontend/src/lib/components/SnmBipartiteGraph.svelte | Field patterns × traditions, tradition nodes colored by pattern_category, uncategorized cluster explicit, edge style encoding — d3-force | NOT STARTED |
| frontend/src/lib/components/SnmTemporalCorrespondence.svelte | Correspondence strength over time, prompt version boundaries, filterable — d3-scale | NOT STARTED |
