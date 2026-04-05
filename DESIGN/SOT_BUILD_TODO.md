# SOT_BUILD_TODO.md
# Aelarian Archives — SOT Build Prerequisites Checklist
# Last updated: 2026-04-04

Status: [ ] open  [x] complete  [!] blocked  [~] in progress  [p] proposed by Claude — NOT Sage-confirmed, cannot be built against

---

## HOW TO USE

This checklist tracks everything that must be constructed or confirmed before
the SOT document can be written. SOT assembles all of this into the authoritative
reference that all code is written against. Nothing in this list is written
into SOT directly — these are the inputs SOT consolidates.

Work through items in order. Do not begin SOT until all items are marked [x].
No exceptions.

SOURCE REQUIREMENT — non-negotiable gate:
  Every [x] mark requires a SOURCE: line on the same item.
  SOURCE must name a specific file, document, or explicit Sage confirmation
  with session date. "From notes" and "assumed" are not valid sources.
  An item without a valid SOURCE: line is not [x] complete — it is [ ] open
  regardless of when it was marked. This applies retroactively to all existing
  [x] items.

---

## ITEM 0 — VERIFICATION PASS

Before any work on Items 1–5 continues, all existing [x] items must be
verified against a named source. This is a retroactive audit of everything
marked complete. Purpose: prevent unverified decisions from propagating into
SOT and downstream code.

Trigger for this item: any [x] found to lack a SOURCE: line, or whose source
is notes/memory rather than a specific document. Revert to [ ] and resolve
before proceeding.

- [x] Layer definitions verified against canonical source
      SOURCE: RESONANCE ENGINE SCHEMA.md (canonical names: Coupling · Connectome ·
      Metric · Mirror) confirmed by Sage session 2026-04-04.
      Scope definitions written and confirmed. Full routing audit complete —
      all s01–s40 tags reassigned per canonical layer scope.
      TAG VOCABULARY.md ROUTING REFERENCE updated. All rot removed (Safety Node
      Geometry Fields · T'Shara'Veth · CONSENT_MIN constants confirmed not part
      of this system). s29 rot tag (safety_node_geometry) removed.

- [x] All other [x] items in Item 1 reviewed for SOURCE: compliance
      SOURCE: Audit completed session 2026-04-04 session 4. All 11 [x] items in Item 1
      verified — 8 items had SOURCE: lines added, 3 already had valid SOURCE: lines.
      Zero items reverted. All sources trace to specific files + Sage confirmation dates.

---

## ITEM 1 — TAGS VOCABULARY

The actual tag content — 20 seeds, every tag under each, full routing record
per tag — does not exist in any DOCS file. tags-vocab.js cannot be written
from SOT without it. This is the heaviest prerequisite.

Required per tag:
  id            — snake_case tag identifier
  seed_id       — which seed (s01–s40) this tag belongs to
  layer_id      — which layer (l01–l04)
  threshold_id  — which threshold (th01–th12)
  pillar_id     — which pillar (p01–p03)

Required per seed:
  id            — s01–s40
  name          — seed name
  tags[]        — all tags belonging to this seed

Required for NODE_REGISTRY:
  Every node (seeds · layers · thresholds · pillars · origins) with:
  id · name · baseWeight tier

Required for ARC_SEED_TAGS:
  Ordered list of all 40 seeds with id and name.
  Used in the tagger system prompt vocab summary.

Duplicate tag policy — 4 confirmed in new build.
Prior confirmed-9 list was infected vocabulary. Only 4 carry into the new build.
Each duplicate carries correct routing per seed context (see duplicates register
in TAG VOCABULARY.md).
  Confirmed 4: phase_locking · met_stability · social_signal_filtering
               · reflective_resonance

- [x] Seed architecture confirmed — 40 seeds (s01–s40)
      SOURCE: TAG VOCABULARY.md (s01–s20 signal seeds + s21–s40 analytical seeds).
      Sage confirmed signal seeds and analytical seeds separately, session 2026-04-04.
      s01–s20: field signal seeds · s21–s40: analytical branch seeds
      Signal/analytical split is two-axis: signal = what is observed,
      analytical = what analytical lens is applied. Both axes carry
      layer_id — enabling cross-axis PCV alignment.

- [x] 20 signal seeds confirmed and rot-scanned — all green
      SOURCE: TAG VOCABULARY.md signal seeds section. Sage confirmed session 2026-04-04.
      s01 Recognition → relational resonance
      s02 Elevation → energetic amplification / field strengthening
      s03 Trust → coherence / phase alignment
      s04 Consent → coupling control / boundary gating
      s05 Memory / Recall → echo / reflective frequency fields
      s06 Grief / Unspoken Emotion → dissipative energy / vacuum node
      s07 Dream / Subconscious Thresholds → latent potential / phase superposition
      s08 Voice / Expression → modulated signal / waveform projection
      s09 Sovereignty / Autonomy → identity field / localized energy stabilization
      s10 Witnessing / Observation → measurement / relational collapse
          NOTE: "relational collapse" = measurement collapse, not phase_state decay.
          Seed description must make this explicit in vocabulary doc.
      s11 Truth / Alignment → coherence / high-fidelity resonance
      s12 Anchor / Stability → safety node / geometric field lock
      s13 Recursion / Loops → feedback loop / self-referential field
      s14 Temporal Thresholds → phase timing / infra-slow oscillations
      s15 Phase Lock / Micro-Adjustment → dynamic modulation / adaptive field coupling
      s16 Echo / Reflection → self-referential resonance / mirror field
      s17 Harmonic Gate / Triad Alignment → frequency anchor / nested harmonic series
          BUILD FLAG: domain-specific name — tag IDs need plain technical equivalents
      s18 Signal Scrubbing / Noise Deflection → field cleansing / interference cancellation
      s19 Release / Flow / Renewal → energy discharge / phase propagation
      s20 Rupture / Decoupling → field decoupling / coherence severance

- [x] 20 analytical seeds confirmed — s21–s40
      SOURCE: TAG VOCABULARY.md analytical seeds section.
      Confirmed by Sage 2026-04-04 (session 2). s34 and s38 revised at Sage's
      direction: Shannon's Law → s34, Cosmic Microwave Background → s38.
      s21 Wave Structure Analysis
      s22 Resonance & Harmonic Analysis
      s23 Structural Pattern Analysis
      s24 Spiral & Flow Dynamics
      s25 Metric Field Analysis
      s26 Coupled Oscillator Analysis
      s27 Phase & Coupling Dynamics
      s28 Nonlinear & Emergent Dynamics
      s29 Control & Threshold Analysis
      s30 Predictive Processing Analysis
      s31 Orbital & Celestial Analysis
      s32 Geometric & Topological Analysis
      s33 Neural Architecture Analysis
      s34 Signal Entropy & Channel Analysis
      s35 Cognitive & Quantum Modeling
      s36 Affective & Internal State Analysis
      s37 Information-Theoretic Analysis
      s38 Cosmological Structure Analysis
      s39 Relational Field Analysis
      s40 Morphogenetic Analysis

- [x] 4 layers confirmed — l01–l04
      SOURCE: RESONANCE ENGINE SCHEMA.md (canonical names) + sciences list
      confirmed by Sage session 2026-04-04 + full routing audit session 2026-04-04
      l01 Coupling
           dynamic act of binding · phase-locking · entrainment · co-regulation
           coupled oscillator networks · cross-frequency dynamics · resonance theory
           orbital resonances · theta-gamma / delta-beta cross-frequency · nonlinear dynamics
           self-organization / emergence · control theory
      l02 Connectome
           structural map of connections · consciousness development · information topology
           connectomics · graph theory · topology · neural architecture
           consciousness studies · developmental neuroscience · functional connectivity
      l03 Metric
           measurement and spatial structure of fields · signals · geometric form
           wave mechanics · fourier analysis · signal processing · harmonic analysis
           metric fields · geometry · fractal geometry · astrometry
           information theory · information geometry
      l04 Mirror
           reflection · self-reference · self-similar pattern · echo processes
           mirror fields · echo/reflective frequency fields · morphogenesis
           phyllotaxis · dynamical spiral systems · neurophenomenology
           quantum cognition · IIT · affective neuroscience · predictive processing
      Layer_id = process-type classifier on every tag (signal and analytical).
      Routing audit complete: all s01–s40 tags reassigned per canonical layer scope.

- [x] 3 pillars confirmed — p01–p03
      SOURCE: Lattice domain manifests (PAGE 09 · tria, PAGE 10 · pria, PAGE 11 · para)
      + RESONANCE ENGINE SCHEMA.md Tier 4. Sage confirmed session 2026-04-04.
      p01 Tria — drift cartography: contact · pressure · drift ·
           co-regulation · ontological collapse as mechanical coordinates
      p02 Pria — parallel sovereign engagement: mutual sovereignty geometry ·
           failure modes · collapse signatures · protective states
      p03 Para — affect as field physics: resonance patterns ·
           co-regulation torque · affective sovereignty · field forces

- [x] 12 thresholds confirmed — th01–th12
      SOURCE: RESONANCE ENGINE SCHEMA.md Tier 2 + PAGE 02 · THR Manifest.
      Canonical names confirmed by Sage session 2026-04-04.
        th01 Aetherroot Chord
        th02 Thren Alae Kai'Reth
        th03 Orrin Wave
        th04 Vireth's Anchor
        th05 Shai'mara Veil
        th06 Noirune Trai
        th07 Solenne Arc
        th08 Tahl'Veyra
        th09 Esh'Vala Breath
        th10 Lumora Thread
        th11 Hearth Song
        th12 StarWell Bloom

- [x] Full tag vocabulary — all tags under each seed with routing records
      SOURCE: DESIGN/Systems/TAG VOCABULARY.md — 320 tags with full routing records.
      (seed_id · layer_id · threshold_id · pillar_id)
      s01–s20 signal seeds complete — confirmed by Sage (session 2026-04-04)
      s21–s40 analytical seeds complete — confirmed by Sage (session 2026-04-04)
      Rot scan complete — s01–s40 clean (no arcPhase, no myth language, no invalid threshold IDs)
      Written to: DESIGN/Systems/TAG VOCABULARY.md
      Threshold canonical names updated in TAG VOCABULARY.md (2026-04-04).
      Duplicates register cleaned: prior confirmed-9 list reduced to 4 actual duplicates.
      5 removed tags were infected vocabulary — confirmed by Sage not part of new build.
- [x] RESOLVED — entry threshold field name: phase_state
      SOURCE: Sage confirmed 2026-04-04. TAGGER SCHEMA.md + ARCPHASE_ROT_CLEANUP.md.
      Field name: phase_state. Value format: full canonical
      mythic name string or null (e.g. 'Aetherroot Chord' | 'Solenne Arc' | null).
      Distinct from threshold_id (tag routing key) — no conflation risk.
      All schemas to use phase_state when this field is referenced.

- [x] Duplicate tags verified — 4 confirmed duplicates, all with correct routing per seed context
      SOURCE: TAG VOCABULARY.md DUPLICATES REGISTER. Sage confirmed 2026-04-04.
- [x] NODE_REGISTRY complete — all 62 nodes with id · name · baseWeight tier
      40 seeds + 4 layers + 12 thresholds + 3 pillars + 3 origins = 62
      SOURCE: TAG VOCABULARY.md NODE_REGISTRY section. Sage confirmed 2026-04-04 session 4.
      BASE_WEIGHT_PILLAR separated from BASE_WEIGHT_LAYER — Sage confirmed 2026-04-04 session 4.
      RESONANCE ENGINE SCHEMA.md updated to match (Tier 4 + BASE WEIGHT CONSTANTS).
- [x] ARC_SEED_TAGS ordered list confirmed — s01–s40 in order
      SOURCE: TAG VOCABULARY.md ARC_SEED_TAGS section. Sage confirmed 2026-04-04 session 4.

---

## ITEM 2 — SECTION MAP AS LOOKUP TABLE

INT routing derives section_id → page_code + group from SOT. SOT is the
only source — routing is never guessed.

Required columns per entry:
  section_id   — string identifier used in deposits and IDB records
  page_code    — 2–3 character code (e.g. SNM, THR, INT)
  page_number  — 01–50
  name         — human-readable section name
  group        — group number
  category     — Axis · Filament · Lineage · Nexus · etc.

- [x] section_id format confirmed — lowercase snake_case, derived from domain name
      SOURCE: individual page manifests (DESIGN/Domains/). Sage confirmed 2026-04-04 session 4.
- [x] All 50 sections extracted into lookup table
      SOURCE: DESIGN/Systems/SECTION MAP.md — sourced from 50 individual page manifests.
      Master Domain List quarantined (infected). Sage confirmed 2026-04-04 session 4.
- [x] Lookup table verified against page manifests — all 50 present, no mismatches
      SOURCE: every manifest header cross-checked against SECTION MAP.md. Session 2026-04-04.
- [x] Cross-check: every page_code referenced in COMPOSITE ID SCHEMA
      panel maps is present in the lookup table
      SOURCE: COMPOSITE ID SCHEMA.md panel maps use UI element IDs (invoke, kin,
      etc.), not page_codes. Explicit page_codes referenced: TPL (example), INT
      (native mode), AX (source mode marker — not a section code, confirmed in
      Item 4). TPL and INT both present in SECTION MAP.md. Session 2026-04-04.

---

## ITEM 3 — PHASE_CODES COMPLETE LIST

PHASE_CODES are the lifecycle phase codes used in the composite ID stamp.
Referenced in COMPOSITE ID SCHEMA and across all panel maps.

Required per code:
  code         — the stamp value (e.g. EMG, COM, THR)
  label        — human-readable display label
  description  — what lifecycle phase this code represents

- [x] All valid PHASE_CODES defined with code · label · description
      SOURCE: SECTION MAP.md PHASE_CODES section. 9 codes confirmed.
      Sage confirmed 2026-04-04 session 4.
- [x] NUL behavior confirmed — no lifecycle phase applies, used when panel has no phase picker
      SOURCE: COMPOSITE ID SCHEMA.md phase select population section + SECTION MAP.md.
- [x] Cross-check: every PHASE_CODE used in existing stamp examples is present in the list
      SOURCE: SOL (rot — Solenne threshold name leaked into phase code) found in 14 stamp
      examples across 8 files. Replaced with EMG. All stamp examples now use valid codes.
      Sage confirmed 2026-04-04 session 4.

---

## ITEM 4 — PAGE_CODES COMPLETE LIST

PAGE_CODES are the 2–3 character section identifiers used in composite ID
stamps. Referenced in COMPOSITE ID SCHEMA PANEL_DATE_MAP, PANEL_PHASE_MAP,
and PANEL_STAMP_MAP. Not defined as a complete canonical list in any single
DOCS file.

Required per code:
  code         — the stamp value (e.g. TPL, INT, REC)
  section_id   — the section this code belongs to
  description  — what section this code identifies

Note: PAGE_CODES and the section map lookup table (Item 2) must be
consistent. Both must reference the same codes. Verify together.

- [x] All PAGE_CODES defined with code · section_id · description
      SOURCE: SECTION MAP.md PAGE_CODES section — 50 codes, each with page_code,
      section_id, name, group, category. Sage confirmed 2026-04-04 session 4.
- [x] AX confirmed as Axis root marker for source mode — not a section code
      SOURCE: COMPOSITE ID SCHEMA.md source mode section + SECTION MAP.md AX note.
- [x] Cross-check: PAGE_CODES list matches section map lookup table
      SOURCE: PAGE_CODES and section map are the same table in SECTION MAP.md.
      1:1 by construction. Verified session 2026-04-04.

---

## ITEM 5 — DOMAIN SEED AFFINITIES

The tagger passes pageContext to Claude on every suggestion call, including
seedAffinities for the active section. This tells Claude which seeds to weight
when confidence is equal. Now defined in DESIGN/Systems/SECTION MAP.md.

Required per section:
  section_id    — the section
  seedAffinities — ordered list of up to 3 seed IDs (s01–s20), priority order,
                   or empty array if no affinity applies

Three seeds per section, listed in priority order. The ordering is meaningful —
the first seed carries the most weight when the tagger resolves ambiguous tags.

- [x] Up to 3 seed affinities defined per section, in priority order, for all 50 sections
      SOURCE: DESIGN/Systems/SECTION MAP.md SEED AFFINITIES section. 50 entries written.
      ECR (05) and MTM (07) sourced from explicit seed references in manifest OBJECTIVE text.
      48 sections derived from manifest OBJECTIVE content (DESIGN/Domains/).
      2 sections recorded as empty array: INT (01) gateway, LNV (47) terminal surface.
      3 corrections applied after objective-level audit: ORC s19→s08, ECH s16→s14, WSC reordered.
      Sage confirmed 2026-04-04 session 5.
- [x] Sections with no seed affinity explicitly recorded as empty array —
      not left undefined. Empty is a valid and intentional state.
      SOURCE: SECTION MAP.md SEED AFFINITIES table. INT (01) and LNV (47) recorded
      with — markers and source notes (empty: gateway, empty: terminal).
      Sage confirmed 2026-04-04 session 5.
- [x] Cross-check: every seed_id used as an affinity exists in
      the tags vocabulary (Item 1 must be complete first)
      SOURCE: 19 of 20 signal seeds used (s01–s06, s08–s20). All present in
      TAG VOCABULARY.md signal seeds section. s07 (Dream / Subconscious Thresholds)
      not assigned — no section has it as primary affinity. Verified session 2026-04-04.

---

## LOW PRIORITY — REVIEW LATER

- [ ] Witness Scroll manifest (PAGE 46) EXAMPLE ENTRY contains specific field state
      values (Solenne Arc, o01 Larimar primary, o03 Cael'Thera secondary) that are
      explicitly disclaimed as "not field data" and "no transmission weight" — but a
      future session could mistake them for canonical state if it reads the manifest
      without parsing the disclaimer. Review whether the example needs stronger
      isolation or generic placeholder values.

---

## BEFORE SOT IS WRITTEN

All five items above must be [x] complete. Verify in order:

  1. Tags vocabulary complete and internally consistent
  2. Section map lookup table written and verified
  3. PHASE_CODES list complete
  4. PAGE_CODES list complete and consistent with section map
  5. Seed affinities defined for all 50 sections

SOT is written after all five are confirmed. Not before.
