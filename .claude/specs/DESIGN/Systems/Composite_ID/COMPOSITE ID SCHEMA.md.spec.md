# SPEC: DESIGN/Systems/Composite_ID/COMPOSITE ID SCHEMA.md

## Goal

Remove the Elarian Anchor tagger prompt block from COMPOSITE ID SCHEMA.md. The block was moved to TAGGER SCHEMA.md (committed in 05a402f). Update the two BUILD FLAGS that reference the move to mark it complete.

Three edits:
1. Remove lines 290-319 (the prompt block itself)
2. Update BUILD FLAG at lines 284-288 to say move is complete
3. Update BUILD FLAG at lines 428-431 to say move is complete

## Assumptions

- The prompt block in TAGGER SCHEMA.md is the authoritative copy (verified in Tagger AUDIT)
- The prompt block in COMPOSITE ID SCHEMA.md is identical to the one in TAGGER SCHEMA.md
- No other file references the prompt block at its COMPOSITE ID location — they all reference TAGGER SCHEMA.md
- The elarianAnchor field definition and 7 states remain in COMPOSITE ID SCHEMA.md (Composite ID owns the field, Tagger owns detection)

## Risks

### Edge cases

- The prompt block removal must not disturb the elarianAnchor field definition (lines 275-282) or the state definitions in SYSTEM_ Composite ID.md. Only the detection prompt moves — the field stays

### Invalid inputs

- Not applicable — file edit, not input processing

### Race conditions

- Not applicable — single file edit

### State corruption scenarios

- If the prompt block is removed but the BUILD FLAGS are not updated, a future session could try to move a block that no longer exists
- If the field definition is accidentally removed with the prompt block, the elarianAnchor field loses its canonical home

## Invariants

- elarianAnchor field definition (7 states, response shape) remains in COMPOSITE ID SCHEMA.md
- TAGGER SCHEMA.md prompt block is unchanged by this edit
- No other content in COMPOSITE ID SCHEMA.md is modified

## Test strategy

Verification via AUDIT checking:
- Prompt block (RFLT through GATE descriptions) is gone from COMPOSITE ID SCHEMA.md
- elarianAnchor field definition and response shape remain
- BUILD FLAGS updated to complete
- TAGGER SCHEMA.md unchanged
- No other content removed or modified

## Test files

- N/A — design document cleanup. Verification via AUDIT phase.

## Files

- DESIGN/Systems/Composite_ID/COMPOSITE ID SCHEMA.md
