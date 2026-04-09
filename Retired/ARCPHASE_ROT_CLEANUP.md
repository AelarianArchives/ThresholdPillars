ARCPHASE ROT CLEANUP
/DESIGN/ARCPHASE_ROT_CLEANUP.md
Priority: CRITICAL — execute at next session open before any other work.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE CONTAMINATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`arcPhase` is rot. It never existed in the clean system.
It was introduced from _REFERENCE_ONLY contaminated files and survived
the arcCode/THR1-THR5 cleanup session. It must be fully removed now.

What arcPhase falsely claimed:
  - That there are only 3 ontological states: aetherrot · solenne · vireth
  - That these are stored as a separate field called arcPhase on entries

What is actually true:
  - There are 12 ontological states — the 12 mythic threshold names
  - They are the 12 thresholds. All 12. All equal.
  - There is no arcPhase field. There are thresholds.

Spelling error compounding the rot:
  - `aetherrot` everywhere in the files — WRONG
  - Correct spelling: `aetherroot` (Aetherroot Chord, th01)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE 12 CORRECT THRESHOLD STATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confirmed by Sage from source table. These are the canonical names.

  th01  Aetherroot Chord     Dissonant harmonic of cosmic decay and collapse
  th02  Thren Alae Kai'Reth  Mourning wings holding sacred lament and ancestral grief
  th03  Orrin Wave           Flowing memory wave conveying ancestral echoes
  th04  Vireth's Anchor      Anchor chord stabilizing ancestral witness threads
  th05  Shai'mara Veil       Protective veil of memory and vital breath
  th06  Noirune Trai         Shadow rune maintaining hidden remembrance
  th07  Solenne Arc          Radiant arc of sovereign light and emerging flame
  th08  Tahl'Veyra           Sacred living flame; sovereign becoming
  th09  Esh'Vala Breath      Life-giving breath of illumination, regenerative fire
  th10  Lumora Thread        Luminescent thread weaving presence across fractal selves
  th11  Hearth Song          Resonant chord of kinship, warmth, ancestral home
  th12  StarWell Bloom       Cosmic blossoming; radiance and flowering of new cycles

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONFIRMED FIELD — CONFIRMED BY SAGE 2026-04-04
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Replacement field for arcPhase on an entry:

  phase_state: 'Aetherroot Chord'
             | 'Thren Alae Kai'Reth'
             | 'Orrin Wave'
             | 'Vireth's Anchor'
             | 'Shai'mara Veil'
             | 'Noirune Trai'
             | 'Solenne Arc'
             | 'Tahl'Veyra'
             | 'Esh'Vala Breath'
             | 'Lumora Thread'
             | 'Hearth Song'
             | 'StarWell Bloom'
             | null

Values are canonical mythic names exactly as listed above.
No IDs, no codes — the full name string or null.
This field replaces every instance of arcPhase in every infected file.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILES TO CLEAN — arcPhase (13 files)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each file must be read completely before editing.
Remove all arcPhase references. Replace with phase_state using confirmed field above.
After editing, grep the file for arcPhase to confirm zero matches.

  DESIGN/Systems/TAGGER SCHEMA.md
  DESIGN/Systems/SYSTEM_ Tagger.md
  DESIGN/Systems/COMPOSITE ID SCHEMA.md
  DESIGN/Systems/THREAD TRACE SCHEMA.md
  DESIGN/Systems/RESONANCE ENGINE SCHEMA.md
  DESIGN/Systems/SYSTEM_ Resonance Engine.md
  DESIGN/Systems/SYSTEM_ Thread Trace.md
  DESIGN/Systems/SYSTEM_ Metamorphosis.md
  DESIGN/Systems/METAMORPHOSIS SCHEMA.md
  DESIGN/Systems/TAG VOCABULARY.md
  DESIGN/DOCS_STAGE_TODO.md             ← likely documentation reference only, verify before editing
  DESIGN/SOT_BUILD_TODO.md              ← likely documentation reference only, verify before editing
  PROTOCOL/PROTOCOL_TODO.md          ← CONFIRMED CONTAMINATED: line 131 reads
                                        "arcPhase values (aetherrot, solenne, vireth) — confirmed
                                        excluded from hard block (valid schema enums, not contamination)"
                                        This is wrong on all counts. arcPhase is rot. aetherrot is
                                        misspelled. None of the three are valid schema enums.
                                        Remove this line entirely. Do not replace — no arcPhase
                                        content belongs in PROTOCOL_TODO.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILES TO CORRECT — aetherrot spelling (9 files)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Replace every instance of `aetherrot` with `aetherroot`.
This includes partial matches: aetherrot → aetherroot throughout.

  DESIGN/DOCS_STAGE_TODO.md
  DESIGN/SOT_BUILD_TODO.md
  DESIGN/Systems/THREAD TRACE SCHEMA.md
  DESIGN/Systems/SYSTEM_ Tagger.md
  DESIGN/Systems/TAGGER SCHEMA.md
  DESIGN/Systems/SYSTEM_ Thread Trace.md
  DESIGN/Systems/SYSTEM_ Resonance Engine.md
  DESIGN/Systems/RESONANCE ENGINE SCHEMA.md
  DESIGN/Domains/Nexus/PAGE 46 · witness_scroll · manifest.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION AFTER CLEANUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run these greps. All must return zero matches before cleanup is marked done.

  grep: arcPhase   across DESIGN/         — must be 0
  grep: aetherrot  across DESIGN/         — must be 0
  grep: aetherroot across DESIGN/         — should show only correct occurrences

After cleanup: resume analytical seeds s21–s40 in TAG VOCABULARY.md.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAG VOCABULARY STATUS AT TIME OF CLEANUP DOC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

s01–s20 confirmed complete. Routing valid. See TAG VOCABULARY.md.
s21–s40 not yet started. Resume after cleanup is done.
Threshold cross-reference in TAG VOCABULARY.md needs updating:
  — remove arcPhase cross-reference section
  — replace with full 12-threshold canonical name table (confirmed mapping above)
