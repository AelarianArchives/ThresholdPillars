# SYSTEM: Liber Novus

## /DESIGN/Systems/Liber_Novus/

### Consolidated output surface · type-discriminated gallery · universal receive contract

---

## WHAT THIS SYSTEM OWNS

* lnv_entries PostgreSQL table — single table for all LNV content, type-discriminated
* Receive contract — POST /api/lnv/receive. Universal endpoint. All callers use the same pipe. No bespoke routes.
* Read contract — GET /api/lnv/entries. Query endpoint for all consumers (LNV page, PCV, Observatory, any system).
* Content validation — type-shape matching on receive. Hard rejection on mismatch. A request whose content does not match its declared entry_type is never written.
* Gallery display — card layout, filtering (by type, source, page, date), sorting, expand-on-click. All types displayed uniformly with type-specific badges.
* Snapshot storage format — data + template_ref, not rendered images. Visualization data is canonical; rendering is current.

## WHAT THIS SYSTEM DOES NOT OWN

* MTM Finding production — owned by MTM. LNV receives Findings after DNR routes them. LNV does not produce, modify, or interpret Findings.
* Cosmology finding production — owned by Cosmology page services (HCO, COS, CLM, NHM, MIR, RCT). LNV receives confirmed findings; it does not produce them.
* RCT residual production — owned by RCT. LNV receives residuals; it does not produce them.
* Engine computation — owned by individual engine services (Tier 3). LNV stores snapshots of computed visualizations; it does not trigger or own computation.
* WSC entry production — owned by WSC. LNV receives entries after WSC write path completes. LNV does not produce or modify WSC entries.
* Void analytical output — owned by Void. LNV receives outputs after Void session-close or on-demand analysis completes.
* Thread Trace sequence and visualization production — owned by Thread Trace. LNV receives outputs automatically on thread save. LNV does not build or own threads.
* Emergence finding production — owned by Emergence service. LNV receives findings after detection completes. LNV does not run detectors or own the emergence_findings table.
* Archive sealed record production — owned by Archive (ARV). LNV receives sealed records via INT post-retirement sequence after authentication threshold is met. LNV does not seal, authenticate, or modify archive records.
* Routing decisions — DNR routes MTM Findings. WSC routes its own entries. Void routes its own outputs. Engine visualization capture routes snapshots. Thread Trace routes its own outputs. Emergence routes findings. INT post-retirement sequence routes archive records. LNV does not pull from any system — it receives.
* Content interpretation — LNV holds content in structural juxtaposition. It does not synthesize, interpret, editorialize, or draw conclusions across types. Juxtaposition is the method.
* Visualization rendering — owned by frontend Svelte components. LNV stores the data and template_ref; the component renders from stored data at display time.
* Deduplication — owned by callers. MTM deduplicates via content fingerprinting before Findings reach DNR. Other callers are responsible for not sending duplicates. LNV writes every receive call.

---

## DUAL ROLE — DISPLAY SURFACE AND DATA SOURCE

LNV is not just a gallery. It is also a data source.

**Display surface:** The LNV page shows all entry types in a unified gallery. Cards in responsive grid, filterable, sortable. Each card shows type badge, source system, date, content preview, sage note if present, prompt version if AI-authored. Expand on click for full content.

**Data source:** PCV reads mtm_finding entries from LNV as pre-processed input for hypothesis detection. PCV also reads cosmology_finding entries when findings are marked nexus_eligible. RCT reads rct_residual entries for accumulation tracking. Observatory reads recent entries for signal surface. Any system can query LNV's consolidated output through the read contract.

These are both first-class roles. The read contract exists because LNV is the single place where processed outputs from across the archive land. Systems that need to read those outputs read from LNV — not from the producing systems directly.

---

## THE SINGLE-TABLE ARCHITECTURE

One table. Nine entry types. All types share the same provenance fields (source_system, source_page, session_ref, prompt_version, sage_note). The content field is type-specific jsonb — each entry_type has a defined content shape.

**Why one table:** The gallery treats all types uniformly. Filtering by type is a query parameter, not a table join. PCV's read path (entry_type=mtm_finding) is a single filtered query. Adding a new entry_type requires adding an enum value and defining a content shape — no schema migration, no new tables, no new endpoints.

**Why type-discriminated content:** Each entry type carries different data. An engine_snapshot needs template_ref and visualization_data. An mtm_finding needs finding_type and provenance chain. A wsc_entry needs session_summary and handoff_note. The content jsonb field holds all of this, validated against the declared entry_type at receive time.

---

## SNAPSHOT STORAGE

Store data plus template, not rendered images.

Rendered images are large, non-queryable, and break if the template changes. Data plus template means the visualization re-renders from stored data, can be queried analytically, and stays correct if the display layer improves. The gallery thumbnail generates at display time from stored data — not a stored file.

template_ref is a string identifier mapping to a Svelte visualization component. The component knows how to render from the visualization_data object. If the component is updated, all historical snapshots re-render with the improved display. The data is canonical. The rendering is current.

Engine snapshots have two triggers: automatic when engine_base.py detects a significant signal delta, and Sage-triggered on demand. Auto-captures fire mid-session when the signal warrants it. Sage-triggered captures let Sage flag a moment the auto-threshold didn't catch. Both routes produce the same entry_type. trigger_source on the visualization_snapshots record distinguishes them.

---

## SESSION-CLOSE POLICY

**Automatic at session close (via DNR):**
- MTM Findings (entry_type: mtm_finding)
- Void session-close pulse check output (entry_type: void_output)

**Outside session close:**
- Engine visualization snapshots (automatic on signal delta via engine_base.py, or Sage-triggered on demand; entry_type: engine_snapshot)
- WSC entries (automatic after WSC write, entry_type: wsc_entry)
- Void on-demand read outputs (Sage triggers void analysis; automatic LNV routing follows, entry_type: void_output)
- Thread Trace outputs (automatic on thread save, entry_type: thread_trace)
- Cosmology findings (Sage triggers route from finding card; automatic LNV routing follows, entry_type: cosmology_finding)
- RCT residuals (automatic on residual creation, entry_type: rct_residual)
- Emergence findings (automatic on significant tag commit or on-demand detection run, entry_type: emergence_finding)
- Archive sealed records (automatic on retirement via INT post-retirement sequence, entry_type: archive_record)

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| backend/services/lnv.py | LNV service — receive validation, content shape checking, lnv_entries PostgreSQL writes, read queries with filtering and pagination | PLANNED |
| backend/routes/lnv.py | FastAPI LNV endpoints — POST /api/lnv/receive, GET /api/lnv/entries | PLANNED |

All mechanical specs — lnv_entries table, content shapes per entry type, receive contract, read contract, validation rules, gallery display, failure modes — in LNV SCHEMA.md.
