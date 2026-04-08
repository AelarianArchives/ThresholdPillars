# SYSTEM: Tagger

## /DESIGN/Systems/Tagger/

### Claude API tag suggestion pipeline · phase_state · elarianAnchor · doc_type · tagger Svelte store

---

## WHAT THIS SYSTEM OWNS

* Claude API tag suggestion pipeline — receives entry text + section context via FastAPI /tagger/ endpoint, returns tag candidates with routing, phase_state, elarianAnchor, doc_type
* Tagger Svelte store — single shared state surface for tagger results. Read-only for all consumers (Thread Trace, Resonance Engine). Writable only by the tagger panel
* Tagger panel UI — Svelte component that sends section context to /tagger/ endpoint, displays returned suggestions, allows Sage to accept/reject/modify before deposit
* Elarian Anchor detection logic — prompt block that identifies the psychological state of self present in the entry. Returns one of seven anchor codes or null. Composite ID owns the field definition and its states; the tagger owns how it detects them
* phase_state suggestion — AI-suggested ontological threshold state per entry. One of 12 canonical threshold names or null. TAG VOCABULARY.md is the canonical source for threshold names and IDs
* doc_type suggestion — AI-suggested content classification per entry. Sage can override
* clearResult() sequencing — tagger result is cleared only after createEntry() confirms success. Never before
* Seed affinity weighting — section-specific seed weighting for tag suggestions. Canonical source for seed affinity data is a blocking decision (SECTION MAP vs domain files — unresolved)

## WHAT THIS SYSTEM DOES NOT OWN

* Tag vocabulary, seeds, routing rules, threshold names — owned by TAG VOCABULARY.md
* Section IDs, page codes, group names — owned by SECTION MAP.md
* elarianAnchor field definition and its seven states — owned by SYSTEM_ Composite ID.md and COMPOSITE ID SCHEMA.md. Tagger owns detection logic only
* Entry data, entry schema, or entry reads/writes — owned by INTEGRATION DB SCHEMA.md, served via FastAPI /entries/
* Embedding pipeline — owned by EMBEDDING PIPELINE SCHEMA.md
* The entries the tagger reads from — it receives entry text from the frontend, never queries entries directly
* Research assistant RAG pipeline — owned by SYSTEM_ Research Assistant.md. Separate Claude API consumer

---

## PIPELINE OVERVIEW

1. Sage opens a section panel and begins a deposit
2. Tagger panel sends entry text + section_id to FastAPI /tagger/ endpoint
3. FastAPI /tagger/ route calls Claude API with: entry text, section context, tag vocabulary summary, seed affinity weights, threshold names, Elarian Anchor prompt block
4. Claude API returns: tag suggestions (with seed_id, layer_id, threshold_id, pillar_id routing per tag), phase_state, elarianAnchor, doc_type
5. FastAPI /tagger/ route validates response shape and returns to frontend
6. Tagger panel displays suggestions in the UI
7. Sage reviews — accepts, rejects, or modifies each suggestion
8. On deposit confirm: accepted tags, phase_state, elarianAnchor, doc_type travel with the entry to createEntry()
9. createEntry() confirms success → clearResult() fires → tagger store is cleared

---

## TAGGER STORE

The tagger Svelte store is the single shared state surface. Other systems subscribe read-only.

| Consumer | When it reads | What it reads |
| --- | --- | --- |
| Thread Trace | On overlay open | Active filter state — pre-populates filter bar |
| Thread Trace | On thread save | Routing snapshot assembly |
| Resonance Engine | On confirmed deposit | Tag routing payload for weight updates |

Store is writable only by the tagger panel. Consumers subscribe via Svelte store subscription (reactive) or Svelte store get (snapshot).

If the store has no active result, consumers degrade gracefully — Thread Trace opens with empty filters, Resonance Engine receives no weight update.

---

## NEXUS FEED

None. The tagger is a service layer. It feeds data into entries, which feed into the Nexus systems (PCV, DTX, SGR, LNV) through their own pipelines. The tagger does not write directly to any Nexus page.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| DESIGN/Systems/Tagger/TAGGER SCHEMA.md | Mechanical spec — prompt blocks, API contract, sequences, filter dimensions, failure modes | V1 |
| backend/routes/tagger.py | FastAPI /tagger/ — receives entry text + section context, calls Claude API, returns suggestions | PLANNED |
| backend/services/claude.py | Claude API client — shared by tagger and research assistant | LIVE |
| frontend/src/lib/components/TaggerPanel.svelte | Tagger panel UI — suggestion display, accept/reject/modify, deposit integration | PLANNED |
| frontend/src/lib/stores/tagger.ts | Svelte store — tagger result state, shared read surface | PLANNED |

All mechanical specs — prompt blocks, API request/response shapes, sequences, failure modes — in TAGGER SCHEMA.md.
