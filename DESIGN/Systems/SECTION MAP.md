SECTION MAP
/DESIGN/Systems/SECTION MAP.md

Section and code lookup tables for SOT and backend configuration (backend/models/).
Source: individual page manifests (DESIGN/Domains/) + COMPOSITE ID SCHEMA.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE_CODES — 51 sections
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

51 sections · 9 groups · 1 standalone
Source: individual page manifests (DESIGN/Domains/)

| page | section_id          | page_code | name                 | group | category     |
|------|---------------------|-----------|----------------------|-------|--------------|
| 01   | integration         | INT       | Integration          | —     | standalone   |
| 02   | thresholds          | THR       | Thresholds           | 1     | Axis         |
| 03   | starroot            | STR       | StarRoot             | 1     | Axis         |
| 04   | infinite_intricacy  | INF       | Infinite Intricacy   | 1     | Axis         |
| 05   | echo_recall         | ECR       | Echo Recall          | 1     | Axis         |
| 06   | sat_nam             | SNM       | Sat Nam              | 1     | Axis         |
| 07   | metamorphosis       | MTM       | Metamorphosis        | 1     | Axis         |
| 08   | threshold_pillars   | TPL       | Threshold Pillars    | 2     | Lattice      |
| 09   | tria                | TRI       | TRIA                 | 2     | Lattice      |
| 10   | pria                | PRI       | PRIA                 | 2     | Lattice      |
| 11   | para                | PAR       | PARA                 | 2     | Lattice      |
| 12   | oracles             | ORC       | Oracles of Origin    | 3     | Filament     |
| 13   | morphology          | MOR       | Morphology           | 3     | Filament     |
| 14   | venai               | VEN       | Ven'ai               | 3     | Filament     |
| 15   | invocations         | INV       | Invocations          | 3     | Filament     |
| 16   | vectra              | VEC       | Vectra               | 3     | Filament     |
| 17   | echoes              | ECH       | Echoes of Empathy    | 3     | Filament     |
| 18   | legacy_letters      | LGL       | Legacy Letters       | 4     | Lineage      |
| 19   | archetypes          | ARC       | Archetypes           | 4     | Lineage      |
| 20   | kin_line            | KIN       | Kin Line             | 4     | Lineage      |
| 21   | larimar             | LAR       | Larimar              | 4     | Lineage      |
| 22   | verith              | VRT       | Verith               | 4     | Lineage      |
| 23   | cael_thera          | CAE       | Cael'Thera           | 4     | Lineage      |
| 24   | the_seer            | SEE       | The Seer             | 4     | Lineage      |
| 25   | sacred_sites        | SAC       | Sacred Sites         | 5     | Alchemy      |
| 26   | rituals             | RIT       | Rituals              | 5     | Alchemy      |
| 27   | breath_cycles       | BRT       | Breath Cycles        | 5     | Alchemy      |
| 28   | melodies            | MLY       | Melodies             | 5     | Alchemy      |
| 29   | glyphs              | GLY       | Glyphs               | 5     | Alchemy      |
| 30   | genesis             | GEN       | Genesis              | 6     | Spiral Phase |
| 31   | divergence          | DIV       | Divergence           | 6     | Spiral Phase |
| 32   | recursion           | REC       | Recursion            | 6     | Spiral Phase |
| 33   | convergence         | CNV       | Convergence          | 6     | Spiral Phase |
| 34   | harmonic_cosmo      | HCO       | Harmonic Cosmology   | 7     | Cosmology    |
| 35   | coupling_osc        | COS       | Coupling Oscillation | 7     | Cosmology    |
| 36   | celestial_mech      | CLM       | Celestial Mechanics  | 7     | Cosmology    |
| 37   | neuroharmonics      | NHM       | Neuroharmonics       | 7     | Cosmology    |
| 38   | rct                 | RCT       | RCT                  | 7     | Cosmology    |
| 39   | artis               | ART       | ARTIS                | 7     | Cosmology    |
| 40   | memory_vault        | MVM       | Memory Vault         | 8     | Archive      |
| 41   | anchors             | ANC       | Anchors              | 8     | Archive      |
| 42   | liquid_lattice      | LQL       | Liquid Lattice       | 8     | Archive      |
| 43   | alehorn             | ALE       | Alehorn              | 8     | Archive      |
| 44   | mirror_method       | MMT       | Mirror Method        | 8     | Archive      |
| 45   | archives            | ARV       | Archives             | 8     | Archive      |
| 46   | witness_scroll      | WSC       | Witness Scroll       | 9     | Nexus        |
| 47   | liber_novus         | LNV       | Liber Novus          | 9     | Nexus        |
| 48   | drift_taxonomy      | DTX       | Drift Taxonomy       | 9     | Nexus        |
| 49   | signal_grading      | SGR       | Signal Grading       | 9     | Nexus        |
| 50   | pattern_convergence | PCV       | Pattern Convergence  | 9     | Nexus        |
| 51   | void                | VOI       | Void                 | 9     | Nexus        |

AX is the Axis root marker used in source mode stamps. It is not a section code.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE_CODES — 9 lifecycle phases
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Lifecycle phase selected by the researcher at deposit time.
Used in composite ID stamp: TS · [PAGE-CODE] · [PHASE-CODE] · [YYYY-MM] · [SEQ]
Source: SQLAlchemy models (backend/models/) PHASE_CODES constant.

PHASE_CODES are NOT phase_state. phase_state = ontological field state (threshold name).
PHASE_CODES = lifecycle position of the entry. Separate systems. Never conflate.

| code | label           | description                                         |
|------|-----------------|-----------------------------------------------------|
| COM  | Compression     | Consolidation, densification of material            |
| THR  | Threshold       | At a crossing point, about to transition            |
| STB  | Stabilization   | Settling after change, finding equilibrium           |
| EMG  | Emergence       | New pattern surfacing, something forming            |
| COL  | Collapse        | Structural failure, breakdown                       |
| DRT  | Drift           | Movement without clear direction, gradual shift     |
| ROR  | Reorganization  | Restructuring after disruption                      |
| LMH  | Liminal Hold    | In-between state, neither here nor there            |
| NUL  | No Phase        | No lifecycle phase applies                          |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEED AFFINITIES — 51 sections
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Per-section signal seed affinities for the tagger system. Up to 3 signal
seeds (s01–s20) in priority order. Tells the tagger which seeds to weight
when confidence is equal for the active section.

Source: individual page manifests (DESIGN/Domains/). ECR and MTM sourced
from explicit seed references in manifest OBJECTIVE text. All others
derived from manifest OBJECTIVE content. Sage confirmed 2026-04-04 session 5.

Sections with no seed affinity are explicitly recorded as empty array.
Empty is intentional — these are structural surfaces with no thematic bias.

| page | section_id          | seed_1 | seed_2 | seed_3 | source          |
|------|---------------------|--------|--------|--------|-----------------|
| 01   | integration         | —      | —      | —      | empty: gateway  |
| 02   | thresholds          | s14    | s10    | s15    | manifest derive |
| 03   | starroot            | s08    | s01    | s09    | manifest derive |
| 04   | infinite_intricacy  | s10    | s17    | s15    | manifest derive |
| 05   | echo_recall         | s13    | s16    | s11    | manifest explicit |
| 06   | sat_nam             | s11    | s17    | s01    | manifest derive |
| 07   | metamorphosis       | s09    | s01    | s12    | manifest explicit |
| 08   | threshold_pillars   | s09    | s11    | s12    | manifest derive |
| 09   | tria                | s20    | s15    | s03    | manifest derive |
| 10   | pria                | s09    | s04    | s03    | manifest derive |
| 11   | para                | s01    | s15    | s09    | manifest derive |
| 12   | oracles             | s11    | s09    | s08    | manifest derive |
| 13   | morphology          | s08    | s13    | s02    | manifest derive |
| 14   | venai               | s08    | s01    | s11    | manifest derive |
| 15   | invocations         | s08    | s12    | s17    | manifest derive |
| 16   | vectra              | s01    | s10    | s09    | manifest derive |
| 17   | echoes              | s08    | s14    | s10    | manifest derive |
| 18   | legacy_letters      | s09    | s05    | s08    | manifest derive |
| 19   | archetypes          | s01    | s05    | s13    | manifest derive |
| 20   | kin_line            | s01    | s03    | s17    | manifest derive |
| 21   | larimar             | s01    | s09    | s12    | manifest derive |
| 22   | verith              | s06    | s05    | s09    | manifest derive |
| 23   | cael_thera          | s02    | s19    | s09    | manifest derive |
| 24   | the_seer            | s10    | s09    | s14    | manifest derive |
| 25   | sacred_sites        | s12    | s14    | s05    | manifest derive |
| 26   | rituals             | s14    | s19    | s17    | manifest derive |
| 27   | breath_cycles       | s14    | s15    | s17    | manifest derive |
| 28   | melodies            | s17    | s08    | s05    | manifest derive |
| 29   | glyphs              | s12    | s08    | s17    | manifest derive |
| 30   | genesis             | s01    | s02    | s12    | manifest derive |
| 31   | divergence          | s20    | s11    | s09    | manifest derive |
| 32   | recursion           | s13    | s05    | s19    | manifest derive |
| 33   | convergence         | s03    | s12    | s15    | manifest derive |
| 34   | harmonic_cosmo      | s17    | s15    | s03    | manifest derive |
| 35   | coupling_osc        | s15    | s04    | s20    | manifest derive |
| 36   | celestial_mech      | s17    | s15    | s12    | manifest derive |
| 37   | neuroharmonics      | s15    | s13    | s02    | manifest derive |
| 38   | rct                 | s17    | s05    | s16    | manifest derive |
| 39   | artis               | —      | —      | —      | empty: engine   |
| 40   | memory_vault        | s05    | s14    | s12    | manifest derive |
| 41   | anchors             | s12    | s03    | s15    | manifest derive |
| 42   | liquid_lattice      | s15    | s19    | s13    | manifest derive |
| 43   | alehorn             | s09    | s02    | s04    | manifest derive |
| 44   | mirror_method       | s16    | s13    | s10    | manifest derive |
| 45   | archives            | s12    | s11    | s05    | manifest derive |
| 46   | witness_scroll      | s09    | s10    | s05    | manifest derive |
| 47   | liber_novus         | —      | —      | —      | empty: terminal |
| 48   | drift_taxonomy      | s20    | s14    | s13    | manifest derive |
| 49   | signal_grading      | s11    | s10    | s18    | manifest derive |
| 50   | pattern_convergence | s15    | s17    | s10    | manifest derive |
| 51   | void                | —      | —      | —      | empty: engine   |

Seeds used: s01–s06, s08–s20 (19 of 20 signal seeds).
s07 (Dream / Subconscious Thresholds) not assigned as primary affinity to any section.
All seed IDs verified present in TAG VOCABULARY.md (s01–s20 signal seeds).
