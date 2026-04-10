# LNV Correction Plan
# Liber Novus (LNV · 47) — content audit and verification
# Created: 2026-04-09 (session 45)

---

## SCAN FINDINGS — BEFORE ANY WORK

### "Linvara" infection scope

  Scanned all project files. Zero matches in any DESIGN/, api/,
  backend/, frontend/, or PROTOCOL/ file.

  "Linvara" exists only in:
    - ROT_OPEN.md — the rot entry written session 45
    - ROT_REGISTRY.md — the rot entry written session 45

  The name was introduced in session 45 oral summary output only.
  It was never written to any project file by any prior session.
  The rot did not propagate into the archive.

### Name confirmed

  Sage confirmed: the correct name is Liber Novus.
  All project files use "Liber Novus" consistently. No mass rename needed.

### LNV files inventory

  Five primary files:
    DESIGN/Systems/Liber_Novus/LNV SCHEMA.md         484 lines
    DESIGN/Systems/Liber_Novus/SYSTEM_ LNV.md         89 lines
    DESIGN/Domains/10_Nexus/Domain_Liber_Novus.txt
    DESIGN/Domains/10_Nexus/Manifest_47_Liber_Novus.txt
    DESIGN/Systems/Pipeline_Contracts/
      PIPELINE CONTRACT 1 — INT TO LNV.md            703 lines

  Cross-references in 10 SYSTEM_ files and 3 domain/API files
  that mention Liber Novus by name.

---

## PASS 1 — LNV SCHEMA.md content audit

  Read in full. Audit against the design plan LNV summary.

  Verify present and correct:
    - lnv_entries table: all fields (lnv_entry_id, entry_type,
      source_system, source_page, session_ref, prompt_version,
      content jsonb, sage_note, created_at)
    - entry_type enum: 6 types (mtm_finding | engine_snapshot |
      wsc_entry | void_output | cosmology_finding | rct_residual)
      Tier 5 added cosmology_finding and rct_residual — both must be present
    - Content jsonb shapes: all 4 original + 2 Tier 5 shapes defined
    - Receive contract: POST /api/lnv/receive — request shape, both
      response shapes (success + failure), hard validation rule
    - Read contract: GET /api/lnv/entries — all query params
    - Who calls receive: DNR (mtm_finding), engine viz (engine_snapshot),
      WSC write path (wsc_entry), Void (void_output)
    - Snapshot storage: data + template_ref, not rendered images
    - Session-close policy: automatic (MTM Findings, Void pulse) vs
      Sage-triggered (engine snapshots, Void on-demand)
    - Gallery display: card structure, type badge labels, expand behavior,
      filters, sort default (chronological, most recent first)
    - Failure modes section present

  Flag: any field missing, any type missing from the enum, any
  contradiction with design plan summary. No corrections without
  Sage review of findings.

---

## PASS 2 — SYSTEM_ LNV.md content audit

  Read in full. Audit:
    - Ownership boundaries accurate and complete
    - Does not contain unauthorized design decisions
      (Entry 006 lesson — entropy scan ≠ content approval)
    - No sub-rhythms, curation panel, error states, constellation,
      or other Entry 006 rot family items
    - Cross-references to other systems accurate

---

## PASS 3 — Domain and manifest audit

  Domain_Liber_Novus.txt:
    - PURPOSE statement accurate to current architecture
    - STRUCTURAL RULES match schema and system doc
    - CONNECTS TO: feeds LNV(47), verify downstream list is correct
    - SIGNAL PROFILE: domain-level content, verify no architectural drift

  Manifest_47_Liber_Novus.txt:
    - Vision, objective, AI role consistent with schema
    - Session open protocol: does not describe WSC (separate page)
    - Entry structure: matches lnv_entries receive contract
    - Good/bad output examples accurate

---

## PASS 4 — Pipeline Contract audit

  PIPELINE CONTRACT 1 — INT TO LNV.md (703 lines — full read):
    - Pipeline stages described match current architecture
    - LNV receive contract matches schema
    - No phantom steps or deprecated flows
    - entry_type references use current 6-type enum

---

## PASS 5 — Cross-file verification

  For each file referencing "Liber Novus (LNV · 47)" — read the
  LNV reference in context. Verify:
    - What the file says LNV receives matches receive contract
    - Routing described correctly (POST /api/lnv/receive)
    - No phantom capabilities attributed to LNV
    - No stale architecture references

  Files:
    DESIGN/Systems/Archive/SYSTEM_ Archive.md
    DESIGN/Systems/Echo_Recall_Engine/SYSTEM_ Echo Recall Engine.md
    DESIGN/Systems/Emergence/SYSTEM_ Emergence.md
    DESIGN/Systems/Engine_Computation/SYSTEM_ Engine Computation.md
    DESIGN/Systems/Infinite_Intricacy_Engine/SYSTEM_ Infinite Intricacy Engine.md
    DESIGN/Systems/Metamorphosis/METAMORPHOSIS SCHEMA.md
    DESIGN/Systems/Sat_Nam_Engine/SYSTEM_ Sat Nam Engine.md
    DESIGN/Systems/StarRoot_Engine/SYSTEM_ StarRoot Engine.md
    DESIGN/Systems/Thread_Trace/SYSTEM_ Thread Trace.md
    DESIGN/Systems/Threshold_Engine/SYSTEM_ Threshold Engine.md
    api/prompts/GLOBAL_KNOWLEDGE_BASE.txt
    DESIGN/Domains/07_Spiral_Phase/Domain_Convergence.txt
    DESIGN/Domains/07_Spiral_Phase/Manifest_33_Convergence.txt

---

## REPORTING

  After each pass: findings reported to Sage before any correction.
  Format: file, line, what was found, what it should say.

  Blocking findings (wrong data, missing fields, broken contracts):
  named and held for Sage decision before continuing.

  Calibration findings (wording drift, minor inconsistencies not
  affecting pipeline behavior): collected and reported together.

---

## COMMIT STRATEGY

  No commits during audit passes — findings only.
  Corrections: one commit per file, or one bulk commit — Sage decides.
  All corrections go through Sage review first.

---

## WHAT THIS PLAN DOES NOT DO

  - Does not touch SESSION_LOG.md
  - Does not rename any file (Liber Novus confirmed correct in all files)
  - Does not correct anything before Sage sees the findings
  - Does not audit LNV content against the design plan Tier 2
    section (that is Tier 2 unmangle work — separate pass)
