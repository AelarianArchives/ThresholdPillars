# SYSTEM_ Cosmology

## Group 7 · V1

## /DESIGN/Systems/Cosmology/SYSTEM_ Cosmology.md

Ownership boundaries, API surface, and rules for the Cosmology investigation
group — five parallel pages (HCO, COS, CLM, NHM, RCT) sharing a common
findings schema. Full mechanical spec in COSMOLOGY SCHEMA.md. Computation
infrastructure in ARTIS SCHEMA.md.

---

## OWNS

- **cosmology_findings table** — shared across all five investigation pages,
  discriminated by page_code. Each page service writes findings with its own
  page_code. Finding lifecycle (draft → confirmed → superseded/abandoned)
  managed here.

- **rct_residuals table** — RCT-specific. The delta between known science
  predictions and field behavior. Created by RCT service only. Immutable
  after creation.

- **Investigation surface logic** — per-page investigation frame, science
  ping integration, deposit-to-finding workflow. Each page determines which
  ARTIS computations to request for its deposits. The page decides the
  scientific question; ARTIS answers it computationally.

- **Finding lifecycle management** — create (draft), confirm, abandon (with
  reason), supersede (with replacement reference). Status transitions
  validated. Terminal states enforced.

- **nexus_eligible gating** — Sage-controlled gate on confirmed findings.
  Only confirmed findings can be marked nexus-eligible. The gate is the
  boundary between Cosmology investigation and Nexus hypothesis tracking.

- **LNV routing for findings and residuals** — assembling content shapes and
  sending to LNV via POST /api/lnv/receive. Two entry types:
  cosmology_finding (Sage-triggered on confirmed findings) and rct_residual
  (automatic on residual creation).

- **RCT residual accumulation tracking** — counting residuals per
  algorithm_component, surfacing threshold prompts to Sage, supporting
  optional synthesis into standard findings.

---

## DOES NOT OWN

- **Computation** — owned by ARTIS. All scipy/numpy calls route through
  ARTIS endpoints. No Cosmology page service imports scipy or numpy directly.
  ARTIS computes; Cosmology investigates.

- **External references** — owned by ARTIS. The artis_external_references
  table is ARTIS's registry. Cosmology findings reference entries in it but
  do not create or manage references directly (references are created through
  ARTIS endpoints).

- **Science domain mappings** — owned by ARTIS. The science ping pipeline
  (all three layers) is an ARTIS service. Cosmology pages call it; they do
  not maintain the mapping table.

- **Tag definitions** — owned by the tagger system. Cosmology reads tags on
  deposits; it does not define or modify them.

- **PCV hypothesis creation** — owned by PCV. When a finding is marked
  nexus_eligible, it routes to PCV. PCV creates the pattern record with
  cosmology_provenance. Cosmology does not write to PCV directly.

- **Deposits** — owned by individual pages via INT routing. Deposits arrive
  on Cosmology pages through the existing routing system. Cosmology
  investigates what is already there; it does not produce deposits.

- **Computation snapshots** — owned by ARTIS. cosmology_findings references
  snapshot_ids but does not create or manage snapshots. The snapshot is
  created by POST /artis/compute.

---

## API SURFACE

Shared Cosmology endpoints + RCT-specific endpoints. Full contracts in
COSMOLOGY SCHEMA.md.

### Shared (backend/routes/cosmology.py)

| Method | Path | Purpose |
| --- | --- | --- |
| POST | /cosmology/findings | Create finding (draft) |
| GET | /cosmology/findings | Query findings (filterable by page_code, status, nexus_eligible, deposit_id, date range) |
| GET | /cosmology/findings/{id} | Get single finding |
| PATCH | /cosmology/findings/{id}/confirm | Confirm finding (draft → confirmed) |
| PATCH | /cosmology/findings/{id}/abandon | Abandon finding (requires reason) |
| PATCH | /cosmology/findings/{id}/supersede | Supersede finding (requires superseded_by) |
| PATCH | /cosmology/findings/{id}/nexus | Set nexus_eligible (requires confirmed status) |
| POST | /cosmology/findings/{id}/route-lnv | Route confirmed finding to LNV |

### RCT-specific (backend/routes/rct.py)

| Method | Path | Purpose |
| --- | --- | --- |
| POST | /rct/residuals | Create residual (auto-routes to LNV) |
| GET | /rct/residuals | Query residuals (filterable by algorithm_component, source_finding_id, date range) |
| GET | /rct/residuals/{id} | Get single residual |
| GET | /rct/accumulation | Get accumulation counts per algorithm_component |

---

## RULES

1. All computation routes through ARTIS. No Cosmology page service contains
   scipy or numpy calls. A computation import in a Cosmology service file is
   a boundary violation.

2. nexus_eligible requires confirmed status. A draft finding cannot enter the
   Nexus pipeline. The API validates this constraint.

3. Residuals are immutable. Written once, never updated. The observed delta
   at detection time is the record. New data produces new residuals.

4. Every finding carries a computation_snapshot_id. A finding without a
   computation is not a finding. The API rejects findings without valid
   snapshot references.

5. Abandoned and superseded are terminal states. No transitions out. Both
   are research data — dead ends and replacements are preserved.

6. COS findings with single deposit_id produce a warning, not a rejection.
   Coupling analysis semantically requires 2+ deposits, but the schema
   allows 1 for edge cases. The warning ensures awareness.

---

## STORE INVENTORY

| Table | Write authority | Defined in |
| --- | --- | --- |
| cosmology_findings | Cosmology page services (hco, cos, clm, nhm, rct) | COSMOLOGY SCHEMA.md |
| rct_residuals | RCT service only | COSMOLOGY SCHEMA.md |

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| DESIGN/Systems/Cosmology/COSMOLOGY SCHEMA.md | Full mechanical spec — tables, investigation surfaces, finding card, Nexus loop, LNV routing | COMPLETE |
| DESIGN/Systems/Cosmology/SYSTEM_ Cosmology.md | This file — ownership boundaries, API surface, rules | COMPLETE |
| DESIGN/Systems/ARTIS/ARTIS SCHEMA.md | Computation infrastructure | COMPLETE |
| DESIGN/Systems/ARTIS/SYSTEM_ ARTIS.md | ARTIS ownership boundaries | COMPLETE |
| backend/routes/cosmology.py | Shared Cosmology endpoints | PLANNED |
| backend/routes/rct.py | RCT-specific endpoints | PLANNED |
| backend/services/cosmology.py | Shared findings service | PLANNED |
| backend/services/rct.py | RCT residual service + RCT page service | PLANNED |
| backend/services/hco.py | HCO investigation surface | PLANNED |
| backend/services/cos.py | COS investigation surface | PLANNED |
| backend/services/clm.py | CLM investigation surface | PLANNED |
| backend/services/nhm.py | NHM investigation surface | PLANNED |
