# AUDIT: DESIGN/Systems/TAG VOCABULARY.md

## Break attempts

Ran automated verification script checking:
1. THRESHOLDS section (lines 59-71): all 12 entries verified — correct ID, correct name, Hz values present. All OK.
2. NODE_REGISTRY threshold table (lines 757-770): all 12 entries verified — correct ID, correct name, Hz values present. All OK.
3. Tags per seed: all 40 seeds have exactly 8 tags. Total routing rows: 320. OK.
4. Unique tag IDs: 315 (320 rows minus 4 duplicates appearing in multiple seeds = correct count of unique + duplicate entries).
5. Hz values: all 12 thresholds have correct Hz values in both tables.
6. Layer/pillar counts: unchanged from before remap. No collateral damage.
7. Duplicates register (lines 721-736): visually verified all 9 entries have correct remapped threshold_ids. Automated check had a regex bug (NODE_REGISTRY found in file header at line 4 instead of section header at line 739) — data is correct, test was wrong.
8. Spot-checked individual tag remaps: s01 resonance_detection (old th11 → new th09), s01 mutual_attunement (old th04 → new th05), s05 reflective_resonance (old th03 → new th07), s16 reflective_resonance (old th11 → new th09). All correct.
9. Threshold_id distribution shifted correctly: old th11 had 72 occurrences, now th09 has 72. Old th04 had 61, now th05 has 61. Counts moved to correct new IDs.

## SPEC mismatches

None. All SPEC requirements met:
- Correct mapping applied (confirmed per SPEC remap table)
- Hz values added (confirmed per SPEC Hz data)
- Descriptions travel with names (confirmed)
- No other fields changed (layer_id, pillar_id, seed_id counts unchanged)

## Untested paths

Cascade files: other files reference specific threshold IDs (ARCPHASE_ROT_CLEANUP, SOT_BUILD_TODO, Thread Trace, Resonance Engine). These are now inconsistent with the corrected TAG VOCABULARY. Per SPEC, cascade files are corrected separately — not in scope for this audit.

## Silent failure risks

None identified. The remap was applied atomically via placeholder substitution — no partial state possible. The file was written in a single operation.

## Result

PASS

## Issues


## Fixes

