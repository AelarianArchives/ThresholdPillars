# SPEC: DESIGN/Systems/Tagger/SYSTEM_ Tagger.md

## Goal

Write two clean V1 files for the Tagger system:
- SYSTEM_ Tagger.md — ownership boundaries (what Tagger owns, what it does not)
- TAGGER SCHEMA.md — mechanical spec (pipeline, prompt blocks, API contract, sequences, failure modes)

These replace the deleted rotten files. Written from contract — from what the referencing files say the Tagger owns — not from memory of the old files.

## Assumptions

- The Tagger is a Claude API service: receives entry text + section context, returns tag suggestions, phase_state, elarianAnchor, doc_type
- Backend route is /tagger/ on FastAPI (confirmed in SYSTEM_ FastAPI.md line 43)
- Frontend component is a Svelte panel that displays suggestions and allows Sage to accept/reject/modify
- State is held in a tagger Svelte store that other systems read from (Thread Trace, Resonance Engine)
- TAG VOCABULARY.md is the canonical source for tag vocabulary, seed list, routing rules — Tagger references it, does not duplicate it
- Elarian Anchor detection prompt block currently lives in COMPOSITE ID SCHEMA.md lines 290-319 — it moves into TAGGER SCHEMA.md per the BUILD FLAG on line 288
- Composite ID owns the elarianAnchor field definition and its seven states. Tagger owns how it detects them
- Seed affinity authority (SECTION MAP vs domain files) is a blocking decision that is NOT resolved here — the SPEC notes where seed affinity feeds the tagger but does not assert which source is canonical

## Risks

### Edge cases

- The tagger prompt block for Elarian Anchor detection is currently in COMPOSITE ID SCHEMA.md. Moving it means updating COMPOSITE ID SCHEMA.md's BUILD FLAGS to mark the move as complete. Both files must be updated together or the prompt block exists in two places or zero places
- Other systems reference "TAGGER SCHEMA.md" by name (9 files). The new file must use this exact name or every reference breaks
- Some files say "owned by tagger service" (generic) and some say "owned by TAGGER SCHEMA.md" (specific). Both patterns exist. The SYSTEM_ file needs to be clear about what "tagger service" means vs what the schema doc covers

### Invalid inputs

- Tagger receives entry text from the frontend via FastAPI. Entry text could be empty, extremely long, or contain content that is not research-relevant. The schema must define how the tagger handles these cases
- Section context could be missing or invalid (section_id not in SECTION MAP). The schema must define fallback behavior

### Race conditions

- Tagger Svelte store is read by Thread Trace and Resonance Engine. If the store updates while those systems are mid-read, they could get partial state. The schema should define whether the store update is atomic or if consumers handle partial state

### State corruption scenarios

- If clearResult() fires before createEntry() confirms success, the tagger result is lost and the entry saves without tags. CLAUDE.md invariant: clearResult() fires only after createEntry() confirms. The schema must enforce this sequence
- If the tagger store carries stale results from a previous session (browser not refreshed), new entries could receive tag suggestions based on old context

## Invariants

- TAG VOCABULARY.md is the single source for tag vocabulary. Tagger does not define tags, seeds, or routing rules
- SECTION MAP is the single source for section IDs and page codes. Tagger does not define sections
- Composite ID owns elarianAnchor field definition (7 states). Tagger owns detection logic only
- clearResult() fires only after createEntry() confirms success
- Tagger never writes entries. It suggests. Sage decides
- The tagger Svelte store is the single shared state surface. Other systems (Thread Trace, Resonance Engine) subscribe to it read-only

## Test strategy

These are design documents, not code. Verification is an adversarial audit checking:
- Every ownership claim against the referencing files (do they agree on who owns what?)
- Every cross-reference against disk (does the referenced file exist?)
- Every ID, count, and enum value against canonical sources (SECTION MAP, TAG VOCABULARY)
- Internal consistency between SYSTEM_ and SCHEMA (do they say the same things?)
- No old-build patterns (no IDB, IndexedDB, vanilla JS, index.html, old file paths, arcPhase, wrong threshold IDs)
- No formatting corruption (no box-drawing characters carried from old build)

## Test files

- N/A — design documents, no code tests. Verification via AUDIT phase.

## Files

- DESIGN/Systems/Tagger/SYSTEM_ Tagger.md
- DESIGN/Systems/Tagger/TAGGER SCHEMA.md
