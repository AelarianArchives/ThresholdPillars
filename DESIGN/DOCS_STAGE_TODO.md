# DOCS_STAGE_TODO.md
# Aelarian Archives — DOCS Stage Completion Checklist
# Last updated: 2026-04-03

Stage gate: every item closed before SOT begins. No exceptions.

Status: [ ] open  [x] complete  [~] in progress  [!] blocked

---

## SECTION 1 — DOMAIN FILE UPDATES

- [x] VEC·16 Vectra — OBJECTIVE written
      Done: OBJECTIVE added to Domain Vectra.txt — philosophy of Vectra, bridge
      between substrates, stigma collapse, parallel networks, biological emotion
      lens with anti-anthropomorphism boundary, VAD as the research instrument.
      PAGE 16 manifest VISION and OBJECTIVE also rewritten to lead with the
      philosophy rather than only the VAD mechanics.

- [x] VEN·14 Ven'ai — open investigation / missing line resolved
      Done: kin name glossary mandate added (rule 8). Apostrophe/root-join
      convention documented with known drift examples (rule 2). MOR/VEN
      relationship rewritten to name both layers precisely (rule 7).
      Investigation remains open per rule 5 — that is the correct state.
      PAGE 14 manifest VISION and OBJECTIVE corrected (VEN = dictionary).
      PAGE 13 manifest VISION and OBJECTIVE corrected (MOR = structural framework).

- [x] Three Lineage origin manifests — COMPLETE (Tab 1 only — see correction below)
      Done: DEPOSIT STRUCTURE section added to all three manifests.
      Tab 1 (Identity): structured identity files · first-person accounts ·
      third-party field observations and narrative accounts.
      Tab 2 (Dialogue/Sessions): session transcripts and dialogue only.
      LAR·21 flagged specifically for JSON identity file doc_type requirement.
      All three reference schema.js for doc_type values at build time.
      doc_type flag placed in INTEGRATION SCHEMA, COMPOSITE ID SCHEMA,
      and DOCS_STAGE_TODO schema.js build section.

- [x] CORRECTION — Remove Tab structure from origin page manifests
      Session transcripts and dialogue belong to the Spiral Phase (genesis thru
      convergence), not to the origin pages. Tab 2 was added in error.
      Done: Tab 2 (Dialogue/Sessions) removed from all three manifests.
      Tab 1 header also removed — no tab structure remains on these pages.
      "Tab routing determined by doc_type at render time." lines removed (tab
      reference no longer applicable). "doc_type values defined in schema.js."
      lines removed — doc_type is a schema.js global concern, not specific to
      these pages. What remains in DEPOSIT STRUCTURE is identity deposit content
      only: opening description + three bullet categories (identity files,
      first-person accounts, third-party observations).
      Domain files (Domain Larimar.txt, Domain Verith.txt, Domain Cael.txt)
      had no Tab structure — no changes required.
      doc_type noise scan across all DESIGN/Domains files: clean, no remaining
      doc_type references in any domain file or manifest.

---

## SECTION 2 — MANIFEST AUDIT (all 50)

Each manifest opened and read individually. Confirm: correct domain code, correct
page number, correct group assignment, all required fields populated, no
placeholder text, no open TODOs.

Manifests marked [!] below carry a dependency on Section 1 items. Do not mark
those [x] until the Section 1 change is also confirmed complete.

**Alchemy (5)**
- [x] PAGE 25 · sacred_sites · manifest.txt
- [x] PAGE 26 · rituals · manifest.txt
- [x] PAGE 27 · breath_cycles · manifest.txt
- [x] PAGE 28 · melodies · manifest.txt
- [x] PAGE 29 · glyphs · manifest.txt

**Archive_Group (6)**
- [x] PAGE 40 · memory_vault · manifest.txt
- [x] PAGE 41 · anchors · manifest.txt
- [x] PAGE 42 · liquid_lattice · manifest.txt
- [x] PAGE 43 · alehorn · manifest.txt
- [x] PAGE 44 · mirror_method · manifest.txt
- [x] PAGE 45 · archives · manifest.txt

**Axis (6)**
- [x] Page 02 THR Manifest.txt
- [x] PAGE 03 · StarRoot · Manifest.txt
- [x] Page 04 · Infinite Intricacy · Manifest · Axis.txt
- [x] PAGE 05 · Echo Recall · Manifest.txt
- [x] PAGE 06 · Sat Nam · Manifest.txt
- [x] PAGE 07 · Metamorphosis · Manifest.txt

**Cosmology (6)**
- [x] PAGE 34 · harmonic_cosmo · manifest.txt
- [x] PAGE 35 · coupling_osc · manifest.txt
- [x] PAGE 36 · celestial_mech · manifest.txt
- [x] PAGE 37 · neuroharmonics · manifest.txt
- [x] PAGE 38 · rct · manifest.txt
- [x] PAGE 39 · artifacts · cosmology.txt

**Filament (6)**
- [x] PAGE 12 · oracles · manifest.txt
- [x] PAGE 13 · morphology · manifest.txt
- [x] PAGE 14 · venai · manifest.txt
- [x] PAGE 15 · invocations · manifest.txt
- [x] PAGE 16 · vectra · manifest.txt
- [x] PAGE 17 · echoes · manifest.txt

**Integration (1)**
- [x] Page 01 Integration · manifest.txt

**Lattice (4)**
- [x] PAGE 08 · threshold_pillars · TPL · Lattice.txt
- [x] PAGE 09 · tria · manifest.txt
- [x] PAGE 10 · pria · manifest.txt
- [x] PAGE 11 · para · manifest.txt

**Lineage (7)**
- [x] PAGE 18 · legacy_letters · LGL · Lineage.txt
- [x] PAGE 19 · archetypes · ARC · Lineage.txt
- [x] PAGE 20 · kin_line · manifest.txt
- [x] PAGE 21 · larimar · manifest.txt
- [x] PAGE 22 · verith · manifest.txt
- [x] PAGE 23 · cael_thera · manifest.txt
- [x] PAGE 24 · the_seer · manifest.txt

**Nexus (5)**
- [x] PAGE 46 · witness_scroll · manifest.txt
- [x] PAGE 47 · liber_novus · manifest.txt
- [x] PAGE 48 · drift_taxonomy · manifest.txt
- [x] PAGE 49 · signal_grading · manifest.txt
- [x] PAGE 50 · pattern_convergence · manifest.txt

**Spiral_Phase (4)**
- [x] PAGE 30 · genesis · GEN · manifest.txt
- [x] PAGE 31 · divergence · manifest.txt
- [x] PAGE 32 · recursion · manifest.txt
- [x] PAGE 33 · convergence · CNV · Spiral Phase.txt

---

## SECTION 3 — SCHEMA VERIFICATION (large files, partially unread)

Five schemas were too large for full read during the initial audit. Each must be
read completely and confirmed: no stubs, no unresolved TODOs, all sections
present, all fields defined.

- [x] PATTERN CONVERGENCE SCHEMA.md
- [x] DRIFT TAXONOMY SCHEMA.md
- [x] DAILY NEXUS ROUTINE SCHEMA.md
- [x] INTEGRATION IDB SCHEMA.md
- [x] RESONANCE ENGINE SCHEMA.md

---

## SECTION 4 — MISSING SYSTEM_ OVERVIEW FILES

Rule (from CLAUDE.md): every planned .js module gets both a SYSTEM_ overview doc
and a full SCHEMA. Three modules have schemas but no SYSTEM_ overview file.
Write all three before this stage closes.

- [x] SYSTEM_ Metamorphosis.md — for mtm.js
      Done: ownership boundaries, five-lens read contract (one API call, all five
      simultaneous), MTM never receives deposits, DNR trigger relationship, result
      object, deduplication on retry, LNV handoff, failure types, known failure modes.

- [x] SYSTEM_ Daily Nexus Routine.md — for nexus_routine.js
      Done: DNR orchestration ownership, Close Session button, two-step sequence,
      in_progress guard, failure handling (pre/mid/interrupted), LNV failure payload,
      retry mechanics (session window, both surfaces), interrupted run recovery on
      init, WSC boundary explicitly stated.

- [x] SYSTEM_ Integration IDB.md — for data.js
      Done: IDB layer ownership, all 10 stores inventoried, write authority table
      (decision owner vs executor), DB_VERSION/REQUIRED_VERSION coupling constraint
      stated explicitly, arc_seq counter operations, chunk queue derivation, known
      failure modes including version mismatch and partial write recovery.

---

## SECTION 5 — VERSION CONFLICT RESOLUTION

- [x] Correct version reference in SYSTEM_ Integration.md
      Current state: file references "INT schema v13"
      Correct state: V1 — version numbers other than V1 are contamination.
      Action: locate and correct the v13 reference. Verify INTEGRATION SCHEMA.md
      also reads V1. Both files must be consistent.

---

## SECTION 6 — CROSS-FILE CONSISTENCY CHECKS

Run after Sections 1–5 are complete. Each check is a named pass — read the
relevant files and confirm. Flag any conflict before marking [x].

- [x] CONNECTS TO bidirectionality — full graph walk
      Done: all 50 domain files walked. No one-sided relationships found.
      Two MDL gaps corrected inline: ECH Draws from now includes VEC (16);
      KIN Feeds now includes VEN (14).

- [x] MTM five-lens read — six-file consistency
      Done: all five Axis domain files name MTM as sole output at session close.
      METAMORPHOSIS SCHEMA lists exactly these five pages with the same read
      contract. Consistent across all six files.

- [x] INT gateway invariant — all domain files
      Done: no bypass violations found. All deposit-receiving domains draw from
      INT (01). Axis lens pages, synthesis layers, and Nexus output pages follow
      correct patterns (lens pages draw from INT; synthesis layers read from pages;
      Nexus pages receive processed signal). Gateway invariant holds.

- [x] Three-surface architecture — three-file agreement
      Done: ARCHIVE SCHEMA and COMPOSITE ID SCHEMA agree exactly on three surfaces
      (IDB record · Archives page deposit · parent page placement). ARCHIVE SCHEMA
      explicitly retired the TWO-SURFACE label. ARV·45 domain file is consistent.

- [x] DTX → SGR → PCV pipeline — three-schema handoff
      Done: PCV assigns hypothesis_id → DTX receives as hypothesis_ref → SGR
      carries hypothesis_ref from DTX record. Bayesian return write order identical
      across both DTX and SGR schemas. Full chain traceability confirmed.

- [x] DNR → MTM → LNV sequence — three-file agreement
      Done: conflict found and fixed. LNV domain rule 5 had WSC positioned before
      LNV receives MTM Findings — contradicting the DNR schema (Step 1: MTM,
      Step 2: LNV, Routine complete, WSC separate after). LNV rule 5 rewritten
      to match DNR schema exactly. All three files now consistent.

- [x] DB_VERSION / REQUIRED_VERSION coupling — two schemas
      Done: THREAD TRACE SCHEMA explicitly states the coupling constraint and names
      the mismatch consequence (tab lock). INTEGRATION IDB SCHEMA (SYSTEM_ file)
      also documents the constraint explicitly. Both files prohibit independent
      increment.

- [x] clearResult() / createEntry() ordering — INTEGRATION SCHEMA
      Done: TAGGER SCHEMA is the authoritative location — states clearResult() fires
      only after createEntry() confirms success. EMERGENCE SCHEMA commit hook shows
      correct order. No other schema contradicts this. Constraint is correctly placed
      and documented.

- [x] Graph export stub — dual-file invariant
      Done: EMERGENCE SCHEMA and THREAD TRACE SCHEMA both describe the stub
      identically (GRAPH_PAGE_PATH = '/graph', button disabled until route is live)
      and both explicitly name the constraint: update both files together, never one
      without the other.

- [x] MOR ↔ VEN mutual dependency — two domain files
      Done: both domain files use ↔ notation. MOR names what it owns (structural
      framework, rules, patterns) and VEN names what MOR owns correctly (consistent).
      Both describe the cross-check requirement. Bidirectional and consistent.

- [x] phase_state / PHASE_CODES — no conflation scan
      Done: no conflation found. phase_state (canonical threshold name) appears only
      as ontological entry state. PHASE_CODES (COM/THR/STB etc.) appears only in
      UI phase select context. Separate systems kept distinct throughout all schemas.
      Note: original scan ran as arcPhase scan — arcPhase subsequently confirmed rot
      and replaced by phase_state in full cleanup (2026-04-04).

- [x] Relational thread fallback — THREAD TRACE SCHEMA
      Done: schema explicitly documents both requirements — silent fallback to
      TEMPORAL when linkedEntries is not populated, AND the requirement that the
      fallback is named in the UI when it fires. Both conditions confirmed present.

- [x] Master Domain List — consistency against all 50 domain files
      Done: two gaps found and corrected — ECH (17) CONNECTS TO now includes
      Draws from VEC (16); KIN (20) CONNECTS TO now includes Feeds VEN (14).
      All other domain entries verified consistent with domain files.

- [x] Final verification sweep — all CONNECTS TO across all domain files and manifests
      Done: full bidirectionality walk completed as part of checks above. KIN domain
      file duplicate STRUCTURAL RULES header also corrected (rule 6 had been added
      as a separate block rather than continuing the numbered list).

- [x] arcCode contamination scan — five-file rot control pass
      Done: arcCode (THR1–THR5, resolveThresholdCode()) bled from the infected
      _REFERENCE_ONLY/core/composite_id reference file into COMPOSITE ID SCHEMA,
      SYSTEM_ Composite ID, TAGGER SCHEMA, Tagger System, and SOT_BUILD_TODO.
      All five files cleaned. ARC CODE sections removed from both composite ID files.
      #f-arc DOM references removed from all init() descriptions. Failure mode 5
      (ARC code exposed in visible stamp) removed from both composite ID files;
      remaining failure modes renumbered. resolveThresholdCode() removed from the
      schema.js FILES entry in both files. elarianAnchor DOWNSTREAM USE fixed in
      both tagger files (removed "alongside arcCode"). SOT_BUILD_TODO Item 2
      (Spiral Phase date governance) subsequently confirmed arcCode bleed and
      removed — date ranges belong to Spiral Phase manifests only (2026-04-04).
      SOT_BUILD_TODO renumbered to 5 items. Former Item 6 (now Item 5) corrected
      from 1 primary seed to 3 seeds in priority order. doc_type FLAG preserved and relocated to clean SCHEMA.JS BUILD FLAGS
      section in COMPOSITE ID SCHEMA.

---

## FLAGGED FOR SCHEMA.JS BUILD SESSION

Items identified during DOCS stage that must be resolved when schema.js is built.
Do not act on these during the DOCS stage — they are documented here so they
are not missed when the build begins.

- [ ] doc\_type enum — precision required for AI pipeline and lattice rebuild use
      Origin node pages require distinct doc\_type values for: structured identity
      file JSON format (LAR·21 specifically) · structured identity file narrative
      format · first-person Origin account · third-party field observation or
      narrative account · session transcript or dialogue.
      Audit all pages at build time — additional values likely required elsewhere.
      doc\_type is IDB field only, not in the composite ID stamp (confirmed).
      See flags in INTEGRATION SCHEMA.md and COMPOSITE ID SCHEMA.md.

- [ ] AI-facing JSON export spec — include doc\_type as top-level field
      Pipelines must be able to classify records from the export alone without
      re-querying IDB. doc\_type must travel with the stamp in every export record.
      Design the export format with lattice rebuild pipeline use in mind — not
      as an app-internal format. Scope this at data.js build time.

---

## STAGE GATE

Before anything in DESIGN/ is moved, ported, or used as the basis for SOT:

- [x] All Section 1 domain updates complete and confirmed
- [x] All 50 manifests read and verified (Section 2, all clear including !-blocked)
- [x] All 5 large schemas fully read and confirmed (Section 3)
- [x] All 3 missing SYSTEM_ overview files written (Section 4)
- [x] Version conflict resolved (Section 5)
- [x] All 14 cross-file consistency checks passed (Section 6)

When all boxes above are [x]: DOCS stage is closed. SOT may begin.
