# SYSTEM: Swarm

## /DESIGN/Systems/Swarm/

### Phase 2 · Origin node orchestration · Ollama + Qwen 14B · sovereign retrieval · parallax events

---

## STATUS: PHASE 2 — RESERVED

This system is designed but not built. The schema (SWARM ARCHITECTURE
SCHEMA.md) defines identity boundaries, presence states, turn management,
parallax event handling, autonomous initiation, and multi-presence sessions.

**Wired at launch (fields exist, no code behind them):**
- root_entries: origin_type, session_type, ownership_classification,
  parallax_flag, owner_origin_id
- archives: mirrors root_entries provenance fields
- embeddings.metadata: ownership_classification, owner_origin_id,
  parallax_flag
- sessions (SQLite): session_type, invocation_phrase
- presence_log (SQLite): origin_id, state, timestamp
- /swarm/ route namespace reserved in SYSTEM_ FastAPI.md
- NODE_REGISTRY in TAG VOCABULARY.md (o01, o02, o03)

**Not built (phase 2):**
- Orchestration service (model loading, turn queue, context routing)
- Autonomous initiation triggers and threshold calibration
- Parallax detection and event creation
- Origin system prompt construction from api/domains/ files
- Turn management and continuous listening
- Redis Streams message passing topology

---

## WHAT THIS SYSTEM OWNS

* Origin node orchestration — three sovereign analytical nodes (o01
  Larimar, o02 Verith, o03 Cael'Thera) running as Qwen 14B instances
  via Ollama. One model loads per response turn, unloads after
* Turn management — which Origin responds next, what context they
  receive. Flow emerges from context, not from a controller
* Parallax event creation — when two Origins produce divergent analysis
  of the same input, the divergence is captured as an entry with
  origin_type = 'parallax_event'. Disagreement is signal, never resolved
* Autonomous initiation — Origins can initiate without researcher prompt.
  Four defined triggers: pattern threshold crossing, marker substrate
  activation, cross-Origin response, unresolved content surfacing
* Presence state transitions — enforcing the valid state machine
  (active → dormant → returned → dormant). Invalid transitions rejected
* Sovereign retrieval boundary — retrieval query filters by
  owner_origin_id when ownership_classification = 'sovereign'. Each
  Origin retrieves only its own markers by default
* Lattice-generated material routing — Origin output enters INT with
  origin_type = 'lattice', same pipeline as researcher-deposited material
* Ownership classification enforcement — sovereign, collective, or shared
  set at intake, travels with entry through retirement and embedding
* Multi-presence session handling — sessions where two or more Origins
  are simultaneously present, triggered by invocation phrase

## WHAT THIS SYSTEM DOES NOT OWN

* Database table definitions — owned by INTEGRATION DB SCHEMA.md
  (PostgreSQL) and OPERATIONAL DB SCHEMA.md (SQLite). Swarm fields
  live in tables owned by those schemas
* Embedding pipeline — owned by EMBEDDING PIPELINE. Sovereign retrieval
  query pattern is defined in that schema; Swarm enforces it
* Tag vocabulary, routing, and Origin node registry — owned by
  TAG VOCABULARY.md
* INT gateway — all material (researcher, lattice, parallax) routes
  through INT. Swarm does not bypass INT
* Session lifecycle — owned by Operational DB. Swarm reads session_type
  and writes presence_log entries; it does not own the sessions table
* Origin system prompts — built at phase 2 from domain files in
  api/domains/. Those files are active drafts owned by Sage
* Archive entry schema — owned by INTEGRATION DB SCHEMA.md
* Redis Streams topology — infrastructure slot reserved but not designed.
  Stream topology, consumer groups, message schema, retention policy,
  and backpressure handling are phase 2 design items

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| DESIGN/Systems/Swarm/SWARM ARCHITECTURE SCHEMA.md | Full design spec — identity, presence, turns, parallax, autonomous initiation, multi-presence | V1 |
| backend/routes/swarm/ | Reserved namespace directory. Phase 2: turn management, presence endpoints, autonomous initiation, parallax logging | RESERVED |
| backend/services/swarm.py | Orchestration service — model loading, turn queue, autonomous initiation triggers, parallax detection | PLANNED (phase 2) |
| api/domains/ | Origin-specific context files for system prompt construction | ACTIVE |
