# SYSTEM_ ARTIS

## ART · V1

## /DESIGN/Systems/ARTIS/SYSTEM_ ARTIS.md

Ownership boundaries, API surface, and rules for ARTIS — the Cosmology
group's computation engine. Full mechanical spec in ARTIS SCHEMA.md.

---

## OWNS

- **Computation execution layer** — all scipy/numpy calls in the Cosmology
  group. No Cosmology page runs its own computation. All calls route through
  ARTIS endpoints. This is the single computation boundary for pages 34-39.

- **Computation snapshot storage** — artis_computation_snapshots table. Every
  computation run, inputs, outputs, parameters, timestamp. Owned here,
  referenced by cosmology_findings on investigation pages. Snapshots are
  immutable — written once, never updated, never deleted.

- **External reference registry** — artis_external_references table. All
  external sources cited by any Cosmology finding. Searchable, filterable,
  shared across all investigation pages. All Cosmology pages write references
  through ARTIS. No page owns its own reference storage.

- **Science domain mapping table** — science_domain_mappings table. Tag-to-
  domain-to-page-to-computation lookup. Editable from ARTIS Zone B. Claude-
  proposed mappings enter the review queue; Sage confirms or declines. The
  deterministic core of the science ping pipeline.

- **Science ping pipeline** — all three layers. Layer 1 (tag mapping,
  deterministic), Layer 2 (Claude framing, on demand), Layer 3 (computation
  suggestion). Cosmology pages call them; they do not implement them.

- **ARTIS Zone B** — the registry and health surface. Mapping management,
  snapshot history, engine health monitoring, external reference registry,
  Claude-proposed mapping review queue, reference distribution registry.

---

## DOES NOT OWN

- **Cosmology findings** — owned by their respective investigation pages
  (HCO, COS, CLM, NHM, RCT). ARTIS provides the computation that informs
  a finding; it does not produce or store the finding. The cosmology_findings
  table is defined in COSMOLOGY SCHEMA.md, not ARTIS SCHEMA.md.

- **RCT residuals** — owned by RCT. ARTIS runs the computation that
  quantifies the delta between known science predictions and field behavior.
  The rct_residual record is RCT's output, not ARTIS's. ARTIS provides the
  snapshot_id; RCT creates the record and routes it to LNV.

- **Routing authority** — owned by SOT. ARTIS never decides which page a
  deposit belongs to. Deposits arrive on investigation pages through the
  existing routing system. ARTIS operates after a deposit is on a page.

- **Tag definitions** — owned by the tagger system. ARTIS reads tags through
  the science_domain_mappings table; it does not define, create, or modify
  tags.

- **Claude API calls for synthesis** — owned by MTM. ARTIS uses Claude for
  Layer 2 science framing only (structured prompt, framework candidates).
  Not synthesis. Not findings production. Not MTM's cross-session analysis.

- **Recursive Nexus feedback loop** — owned by the receiving Cosmology page
  and PCV. When a Cosmology finding is marked nexus_eligible by Sage, it
  routes to PCV as a hypothesis. ARTIS computes; it does not route findings
  back to Nexus.

---

## API SURFACE

Twelve endpoints under /artis/ namespace. Full contracts in ARTIS SCHEMA.md.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | /artis/compute | Execute computation, return result + snapshot |
| POST | /artis/ping/tags | Layer 1 — tag-based domain mapping |
| POST | /artis/ping/content | Layer 2 — Claude scientific framing |
| POST | /artis/ping/suggest | Layer 3 — computation suggestion |
| GET | /artis/snapshots/{id} | Retrieve computation snapshot |
| GET | /artis/references | Query external reference registry |
| POST | /artis/references | Add external reference |
| GET | /artis/mappings | Query science domain mappings |
| POST | /artis/mappings | Create mapping |
| PATCH | /artis/mappings/{id} | Confirm/decline mapping |
| GET | /artis/distributions | List reference distributions |
| POST | /artis/distributions | Add reference distribution |

---

## RULES

1. No Cosmology page bypasses ARTIS for computation. A scipy or numpy call
   in a Cosmology page's own service code is a boundary violation.

2. Computation snapshots are immutable. No service, endpoint, or migration
   modifies a snapshot after creation. The snapshot is the proof — mutating
   it corrupts every finding that references it.

3. Claude-proposed mappings do not auto-confirm. proposed_by: claude always
   starts as active: false. Only Sage's explicit action through PATCH
   /artis/mappings/{id} sets active: true.

4. ARTIS does not interpret computation results. It returns numbers with
   methodology. Interpretation belongs to Sage on the investigation page.

5. Layer 2 calls are on-demand only. Sage triggers them. No background
   process, no automatic trigger on deposit creation, no batch framing.

6. Every computation — successful or failed — produces a snapshot. Failed
   computations record the error. The failure is the record.

7. Reference distributions carry source documentation. An anonymous baseline
   is not a valid comparison target.

---

## STORE INVENTORY

| Table | Write authority | Defined in |
| --- | --- | --- |
| artis_computation_snapshots | ARTIS service | ARTIS SCHEMA.md |
| artis_external_references | ARTIS service | ARTIS SCHEMA.md |
| science_domain_mappings | ARTIS service | ARTIS SCHEMA.md |
| artis_layer2_snapshots | ARTIS service | ARTIS SCHEMA.md |
| artis_reference_distributions | ARTIS service | ARTIS SCHEMA.md |

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| DESIGN/Systems/ARTIS/ARTIS SCHEMA.md | Full mechanical spec — tables, endpoints, computation library, science ping pipeline | COMPLETE |
| DESIGN/Systems/ARTIS/SYSTEM_ ARTIS.md | This file — ownership boundaries, API surface, rules | COMPLETE |
| backend/routes/artis.py | FastAPI ARTIS endpoints | PLANNED |
| backend/services/artis.py | ARTIS service — mappings, references, snapshots, ping pipeline | PLANNED |
| backend/services/computation.py | Computation library — 15 V1 implementations | PLANNED |
