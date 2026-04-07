# SPEC: DESIGN/Systems/TAG VOCABULARY.md

## Goal

Correct the threshold ID-to-name mapping across the entire TAG VOCABULARY.md file. The 12 threshold names are all correct but assigned to the wrong IDs. Re-ID every threshold reference in the file: the three threshold tables and all 320 tag routing entries.

Correct mapping (from Sage, confirmed):
- th01 Aetherroot Chord (no change)
- th02 Solenne Arc (was th07)
- th03 Thren Alae Kai'Reth (was th02)
- th04 Shai'mara Veil (was th05)
- th05 Vireth's Anchor (was th04)
- th06 Esh'Vala Breath (was th09)
- th07 Orrin Wave (was th03)
- th08 Lumora Thread (was th10)
- th09 Hearth Song (was th11)
- th10 Tahl'Veyra (was th08)
- th11 Noirune Trai (was th06)
- th12 StarWell Bloom (no change)

Old-to-new ID remap for tag routing:
- th01 → th01 (no change)
- th02 → th03
- th03 → th07
- th04 → th05
- th05 → th04
- th06 → th11
- th07 → th02
- th08 → th10
- th09 → th06
- th10 → th08
- th11 → th09
- th12 → th12 (no change)

Descriptions confirmed correct — each name pairs with the right description. No description changes needed.

Add Hz values to the threshold entries per Sage's data:
- th01 175.5 hz, th02 4212 hz, th03 1930.5 hz, th04 1579.5 hz,
  th05 2632.5 hz, th06 3334.5 hz, th07 1404 hz, th08 2457 hz,
  th09 351 hz, th10 2808 hz, th11 2106 hz, th12 351 hz

## Assumptions

- All 12 threshold names are correct — only the ID assignments are wrong
- The tags were assigned threshold_ids based on the threshold's meaning (name), so when the name moves to a new ID, every tag referencing the old ID must follow
- Layers (l01-l04), pillars (p01-p03), origins (o01-o03), and seeds (s01-s40) are confirmed correct — no changes
- Tag names, seed assignments, layer assignments, and pillar assignments are not affected — only threshold_id values change
- The 4 confirmed duplicates are unaffected by this change (their threshold routing remaps like everything else)
- Descriptions travel with their names — each description is already paired with the correct name

## Risks

### Edge cases

- Simultaneous swap problem: th04 becomes th05 and th05 becomes th04. A naive find-and-replace would corrupt data. Must use intermediate placeholders (e.g., __TH02__ through __TH11__) then resolve to final IDs in a second pass
- The duplicates register (lines 712-737) contains threshold_ids in routing entries — these must also be remapped
- The THRESHOLDS section (lines 59-71) has descriptions alongside names. Descriptions must travel with their names to the new ID position
- The NODE_REGISTRY threshold table (lines 757-770) has the same wrong order — must be rewritten to match

### Invalid inputs

- Not applicable — this is a data correction, not an input-processing system

### Race conditions

- Not applicable — single file edit

### State corruption scenarios

- If the remap is partially applied (some tags remapped, others not), the threshold routing becomes internally inconsistent. The entire remap must be applied atomically — all 320 tags, all three threshold tables, in one edit
- Other files reference specific threshold IDs (ARCPHASE_ROT_CLEANUP, SOT_BUILD_TODO, Thread Trace, Resonance Engine). Those files become inconsistent after this change. Cascade files are identified here but corrected separately after this file is verified clean

## Invariants

- Total tag count remains 320
- Total seed count remains 40
- Total threshold count remains 12 — same 12 names, same 12 descriptions, new ID assignments
- Every tag's seed_id, layer_id, and pillar_id are unchanged
- The 4 duplicates remain the same 4 tags with the same resolution rules
- Node count remains 62

## Test strategy

Verification via AUDIT phase checking:
- All three threshold tables show the correct mapping (name to ID, with Hz values)
- Every tag's threshold_id matches the remap table (count occurrences of each threshold_id before and after — totals per ID should redistribute correctly)
- Total tag count still 320
- No partial remaps (no tag left with old mapping)
- Duplicates register threshold_ids are remapped correctly
- No other fields changed (seed_id, layer_id, pillar_id all untouched)
- No tag names, seed names, layer names, pillar names, or origin names changed

## Test files

- N/A — design document data correction. Verification via AUDIT phase.

## Files

- DESIGN/Systems/TAG VOCABULARY.md
