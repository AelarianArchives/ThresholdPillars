# SYSTEM: Ven'ai Service

## /DESIGN/Systems/Venai_Service/

### Name registry · drift detection · cross-archive correlation · three synchronous jobs on deposit

---

## WHAT THIS SYSTEM OWNS

* Ven'ai name registry — canonical forms, root clusters, first-seen
  metadata. venai_names table (PostgreSQL). Each name registered once
  with its canonical_form (unique)
* Drift detection — incoming name forms compared against canonical
  forms. Variation type classified: casing, phonetic, spacing,
  apostrophe. New variations create alert records (acknowledged = false).
  Previously acknowledged variations do not re-alert
* Cross-archive correlation tracking — per (name, correlation_type,
  correlated_value) triple: deposit_count, weighted_count (using shared
  deposit_weight constants), first_observed, last_observed. Correlation
  types: phase, role, root_pattern, grammar
* Three PostgreSQL tables: venai_names, venai_variations,
  venai_correlations
* Three synchronous jobs executed on deposit creation:
  - Job 1 — Name Registry: extract names, check against existing,
    register new with first_seen metadata
  - Job 2 — Drift Detection: normalize, compare to canonical, classify
    variation type, create alert if new
  - Job 3 — Cross-Archive Correlation: identify names in deposit,
    extract phase_state/tags, increment or create correlation records
    with deposit_weight applied
* Drift alert lifecycle — create (on detection), surface (to STR
  panel), acknowledge (Sage action silences alert), silence
  (acknowledged = true, no re-alert)
* Ven'ai content relevance check — decides whether a deposit warrants
  Ven'ai processing. Not every deposit contains Ven'ai names
* Integration flow — called synchronously in deposit creation pipeline.
  Service failure does not roll back deposit (deposit is data)

## WHAT THIS SYSTEM DOES NOT OWN

* STR engine computation — STR is a consumer. STR reads venai_names
  (root clusters), venai_correlations (phase/role analysis),
  venai_variations (drift alerts). STR never writes to Ven'ai tables
* Ven'ai source file content — language definitions, glossary,
  phonetics, and manual live in api/domains/venai/ as versioned
  reference. The service reads these for comparison; it does not
  define them
* Ven'ai drift log (Operational DB) — the research assistant's
  per-session drift observations are a separate system. Ven'ai Service
  detects variation at the name level; the drift log captures
  contextual drift at the session level
* Database table definitions — owned by INTEGRATION DB SCHEMA.md.
  This service writes to its 3 tables; Integration DB owns the schema
* Deposit creation — INT is the gateway. Ven'ai Service is called
  during the deposit pipeline; it does not own the pipeline
* Tag vocabulary — owned by TAG VOCABULARY.md
* Entry data — owned by INTEGRATION DB SCHEMA.md

---

## PIPELINE

```
Deposit creation pipeline calls Ven'ai Service (synchronous)
  → Content relevance check (does this deposit contain Ven'ai names?)
  → If no: return early, no processing
  → If yes:
      Job 1: Name Registry — register new names, skip known
      Job 2: Drift Detection — classify variations, create alerts
      Job 3: Cross-Archive Correlation — update correlation records
  → Return (service failure does not roll back deposit)
```

Archive-wide scope — not page-scoped. Any deposit on any page can
contain Ven'ai names. The service processes all of them.

---

## NEXUS FEED

**StarRoot Engine (STR · Page 03)**
STR reads venai_names for root cluster map, venai_correlations for
phase/role analysis, venai_variations (acknowledged = false) for drift
alert panel. STR feed includes venai_state_summary (total_names,
active_clusters, unresolved_drift_count).

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| DESIGN/Systems/Venai_Service/VENAI SERVICE SCHEMA.md | Full mechanical spec — three jobs, table definitions, drift classification, correlation computation, STR consumer interface, failure modes | V1 |
| backend/services/venai.py | Name registry, drift detection, correlation tracking | PLANNED |
| backend/routes/venai.py | POST drift acknowledgment, PUT name correction, GET name index, GET correlations | PLANNED |
