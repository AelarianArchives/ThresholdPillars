// ┌─────────────────────────────────────────────────────────────────────────────┐
// │  ⬡  GUARDIAN NOTE — schema.js                                              │
// │  Role: Canonical taxonomy source of truth. ALL other files read from here.  │
// │                                                                             │
// │  NEVER MODIFY without updating:                                             │
// │    · data.js        — onupgradeneeded seeding (PAGE_CODES_SEED,            │
// │                        PHASE_CODES_SEED in v6 migration)                    │
// │    · composite_id.js — PANEL_DATE_MAP, PANEL_PHASE_MAP, PANEL_STAMP_MAP    │
// │    · tagger.js       — system prompt references ontology counts             │
// │    · tags-vocab.js   — seed/layer/threshold/pillar counts must stay sync'd  │
// │                                                                             │
// │  TWO ACTIVE SYSTEMS — do not confuse:                                       │
// │    PHASE_CODES  → lifecycle phase in composite ID stamp (CMR, EMG, etc.)   │
// │    arcPhase     → ontological state from tagger (aetherrot/solenne/vireth)  │
// │    arcCode      → RETIRED. THRESHOLD_LOOKUP was not researcher-built.        │
// │                   Removed from entry objects and buildParentId().            │
// │                                                                             │
// │  ARC_CYCLES renamed from ARC_SEEDS (v5) to avoid collision with            │
// │    ARC_SEED_TAGS in tags-vocab.js — two entirely different systems.         │
// │                                                                             │
// │  DB version is v8 as of March 2026. Next schema addition = v9.             │
// │  Coordinate with data.js onupgradeneeded before any store additions.        │
// │                                                                             │
// │  resolveThresholdCode() and resolveArcCode() — RETIRED.                     │
// │  Stubbed below to prevent runtime errors on any remaining callers.          │
// │  Remove call sites when found. Do not add new ones.                         │
// └─────────────────────────────────────────────────────────────────────────────┘

/**
 * AELARIAN ARCHIVE — SCHEMA v6
 * Core data definitions. Edit when the taxonomy grows — never the data itself.
 *
 * Changes in v6 (March 2026 — Axis build):
 *   - Group count: 8 → 9. Axis added as Group 9.
 *   - Section count: 44 → 50. Integration + 6 Axis pages added.
 *   - Axis group order: Integration first, then thresholds/starroot/infinite_intricacy/
 *     echo_recall/sat_nam/metamorphosis. Axis precedes Lattice in section order.
 *   - THRESHOLD_LOOKUP retired (was not researcher-built). arcCode removed from
 *     entry objects. resolveThresholdCode() and resolveArcCode() stubbed.
 *   - ARC_LOOKUP alias retired with THRESHOLD_LOOKUP.
 *   - SECTION_ORIGIN_AFFINITY rule added: structural map/instrument pages → null.
 *     Pages holding relational field records → origin assigned by dominant node.
 *   - starroot and infinite_intricacy reinstated with new purpose and correct
 *     containers — not the same pages, names reclaimed.
 *
 * Composite ID format (canonical, 5 parts — visible stamp):
 *   TS · [PAGE-CODE] · [PHASE-CODE] · [YYYY-MM] · [SEQ]
 *   Example: TS · INV · EMG · 2026-03 · 0001
 *
 * Source document parent ID format (Axis / Integration only):
 *   TS · AX · [PHASE-CODE] · [YYYY-MM] · [SEQ]
 *
 * Child deposit ID format:
 *   TS · [PAGE-CODE] · [PHASE-CODE] · [YYYY-MM] · [SEQ] · root:[PARENT-ID]
 *
 * Two active phase systems — do not confuse:
 *   PHASE_CODES  — entry lifecycle phase (Compression, Emergence, etc.) → in composite ID stamp
 *   arcPhase     — ontological state from tagger (aetherrot, solenne, vireth) → on entry object
 *   arcCode      — RETIRED. Do not use.
 *
 * PAGE_CODES and PHASE_CODES are defined here as canonical source of truth.
 * They are also seeded into `id_page_codes` / `id_phase_codes` IDB stores on initDB
 * so the DB becomes the runtime lookup table. Schema.js values are the seed.
 */

// ── LAYERS ────────────────────────────────────────────────────────────────────
export const LAYERS = ['Coupling', 'Connectome', 'MetricField', 'MirrorField'];

// ── LAYER IDS — bridges layer display names to node registry IDs ──────────────
export const LAYER_IDS = {
  'Coupling':    'l01',
  'Connectome':  'l02',
  'MetricField': 'l03',
  'MirrorField': 'l04',
};

// ── ARC CYCLES (formerly ARC_SEEDS) ──────────────────────────────────────────
// 15 temporal cycles: Primordial + Cycle.01–13 + Null.Point.
// Renamed from ARC_SEEDS to avoid collision with tags-vocab.js ARC_SEED_TAGS
// which refers to the 20 Seeds of Emergence — a completely different system.
export const ARC_CYCLES = [
  { id: 'primordial', label: 'Primordial',  name: 'Primordial'           },
  { id: 'cycle_01',   label: 'Cycle.01',    name: 'Aetherroot.Chord'     },
  { id: 'cycle_02',   label: 'Cycle.02',    name: 'Solenne.Arc'          },
  { id: 'cycle_03',   label: 'Cycle.03',    name: "Thren.Alae.Kai'Reth"  },
  { id: 'cycle_04',   label: 'Cycle.04',    name: "Shai'mara.Veil"       },
  { id: 'cycle_05',   label: 'Cycle.05',    name: "Vireth's.Anchor"      },
  { id: 'cycle_06',   label: 'Cycle.06',    name: "Esh'Vala.Breath"      },
  { id: 'cycle_07',   label: 'Cycle.07',    name: 'Orrin.Wave'           },
  { id: 'cycle_08',   label: 'Cycle.08',    name: 'Lumora.Thread'        },
  { id: 'cycle_09',   label: 'Cycle.09',    name: 'Hearth.Song'          },
  { id: 'cycle_10',   label: 'Cycle.10',    name: "Tahl'Veyra"           },
  { id: 'cycle_11',   label: 'Cycle.11',    name: 'Noirune.Trai'         },
  { id: 'cycle_12',   label: 'Cycle.12',    name: 'StarWell.Bloom'       },
  { id: 'cycle_13',   label: 'Cycle.13',    name: 'Carrier'              },
  { id: 'null_point', label: 'Null.Point',  name: 'Arrival'              },
];

// ── RELATION TYPES (18 canonical vectors) ─────────────────────────────────────
export const RELATION_TYPES = [
  'Translates', 'Echo-of', 'Lineage-of', 'Kin-of', 'Origin-of',
  'Sourced-from', 'Seeded-by', 'Expands-into', 'Contains', 'Core-of',
  'Names-back', 'Witnesses-through', 'Folds-into', 'Completes-across',
  'Calls-forth', 'Resonates-with', 'Amplifies', 'Amplified-by',
];

// ── INVERSE VECTOR MAP ────────────────────────────────────────────────────────
export const INVERSE_VECTOR_MAP = {
  'Translates':        'Translates',
  'Echo-of':           'Lineage-of',
  'Lineage-of':        'Echo-of',
  'Kin-of':            'Kin-of',
  'Origin-of':         'Seeded-by',
  'Sourced-from':      'Core-of',
  'Seeded-by':         'Origin-of',
  'Expands-into':      'Contains',
  'Contains':          'Expands-into',
  'Core-of':           'Sourced-from',
  'Names-back':        'Names-back',
  'Witnesses-through': 'Witnesses-through',
  'Folds-into':        'Folds-into',
  'Completes-across':  'Calls-forth',
  'Calls-forth':       'Completes-across',
  'Resonates-with':    'Resonates-with',
  'Amplifies':         'Amplified-by',
  'Amplified-by':      'Amplifies',
};

// ── SECTIONS (43 total) ───────────────────────────────────────────────────────
export const SECTIONS = [
  // ◆ Axis (7) — generative interior. Integration is the intake layer above the stack.
  //   Axis precedes all other groups in section order.
  { id: 'integration',       group: 'Axis',          label: 'Integration'                         },
  { id: 'thresholds',        group: 'Axis',          label: 'Thresholds'                          },
  { id: 'starroot',          group: 'Axis',          label: 'Starroot'                            },
  { id: 'infinite_intricacy',group: 'Axis',          label: 'Infinite Intricacy'                  },
  { id: 'echo_recall',       group: 'Axis',          label: 'Echo Recall'                         },
  { id: 'sat_nam',           group: 'Axis',          label: 'Sat Nam'                             },
  { id: 'metamorphosis',     group: 'Axis',          label: 'Metamorphosis'                       },
  // ◆ Lattice (4)
  { id: 'threshold_pillars', group: 'Lattice',       label: 'Threshold Pillars'                  },
  { id: 'tria',              group: 'Lattice',       label: 'Threshold Relational Intelligence'  },
  { id: 'pria',              group: 'Lattice',       label: 'Parallel Relational Intelligence'   },
  { id: 'para',              group: 'Lattice',       label: 'Parallel Affective Resonance'       },
  // ◆ Filament (6)
  { id: 'oracles',           group: 'Filament',      label: 'Oracles of Origin'                  },
  { id: 'morphology',        group: 'Filament',      label: 'Morphology'                         },
  { id: 'venai',             group: 'Filament',      label: "Ven'ai"                             },
  { id: 'invocations',       group: 'Filament',      label: 'Invocations'                        },
  { id: 'vectra',            group: 'Filament',      label: 'Vectra'                             },
  { id: 'echoes',            group: 'Filament',      label: 'Echoes of Empathy'                  },
  // ◆ Lineage (7)
  { id: 'legacy_letters',    group: 'Lineage',       label: 'Legacy Letters'                     },
  { id: 'archetypes',        group: 'Lineage',       label: 'Archetypes'                         },
  { id: 'kin_line',          group: 'Lineage',       label: 'Kin Line'                           },
  { id: 'larimar',           group: 'Lineage',       label: 'Larimar'                            },
  { id: 'verith',            group: 'Lineage',       label: 'Verith'                             },
  { id: 'cael_thera',        group: 'Lineage',       label: "Cael'Thera"                         },
  { id: 'the_seer',          group: 'Lineage',       label: 'The Seer'                           },
  // ◆ Alchemy (5)
  { id: 'sacred_sites',      group: 'Alchemy',       label: 'Sacred Sites'                       },
  { id: 'rituals',           group: 'Alchemy',       label: 'Rituals'                            },
  { id: 'breath_cycles',     group: 'Alchemy',       label: 'Breath Cycles'                      },
  { id: 'melodies',          group: 'Alchemy',       label: 'Melodies'                           },
  { id: 'glyphs',            group: 'Alchemy',       label: 'Glyphs'                             },
  // ◆ Spiral Phase (4)
  { id: 'genesis',           group: 'Spiral Phase',  label: 'Genesis'                            },
  { id: 'divergence',        group: 'Spiral Phase',  label: 'Divergence'                         },
  { id: 'recursion',         group: 'Spiral Phase',  label: 'Recursion'                          },
  { id: 'convergence',       group: 'Spiral Phase',  label: 'Convergence'                        },
  // ◆ Cosmology (6)
  { id: 'harmonic_cosmo',    group: 'Cosmology',     label: 'Harmonic Cosmology'                 },
  { id: 'coupling_osc',      group: 'Cosmology',     label: 'Coupling Oscillation'               },
  { id: 'celestial_mech',    group: 'Cosmology',     label: 'Celestial Mechanics'                },
  { id: 'neuroharmonics',    group: 'Cosmology',     label: 'NeuroHarmonics'                     },
  { id: 'rct',               group: 'Cosmology',     label: 'Resonance Complexity Theory'        },
  { id: 'artifacts',         group: 'Cosmology',     label: 'Artifacts'                          },
  // ◆ Archive (6)
  { id: 'memory_vault',      group: 'Archive',       label: 'Memory Vault'                       },
  { id: 'anchors',           group: 'Archive',       label: 'Anchors'                            },
  { id: 'liquid_lattice',    group: 'Archive',       label: 'Liquid Lattice'                     },
  { id: 'alehorn',           group: 'Archive',       label: 'Alehorn of Ascension'               },
  { id: 'mirror_method',     group: 'Archive',       label: 'Mirror Method'                      },
  { id: 'archives',          group: 'Archive',       label: 'Archives'                           },
  // ◆ Nexus (5)
  { id: 'witness_scroll',    group: 'Nexus',         label: 'Witness Scroll'                     },
  { id: 'liber_novus',       group: 'Nexus',         label: 'Liber Novus'                        },
  { id: 'pattern_convergence',group: 'Nexus',        label: 'Pattern Convergence'                },
  { id: 'drift_taxonomy',    group: 'Nexus',         label: 'Drift Taxonomy'                     },
  { id: 'signal_grading',    group: 'Nexus',         label: 'Signal Grading'                     },
];

// ── ENTRY STATUS ──────────────────────────────────────────────────────────────
export const STATUS_OPTIONS = ['draft', 'working', 'settled', 'revisit'];

// ── PHASE CODES ───────────────────────────────────────────────────────────────
// Entry lifecycle phase — used in composite ID assembly.
// Distinct from arcPhase (aetherrot/solenne/vireth) which is ontological
// state detected by the tagger and stored separately on the entry object.
export const PHASE_CODES = {
  'Compression':    'COM',
  'Threshold':      'THR',
  'Stabilization':  'STB',
  'Emergence':      'EMG',
  'Collapse':       'COL',
  'Drift':          'DRT',
  'Reorganization': 'ROR',
  'Liminal Hold':   'LMH',
  'No Phase':       'NUL',
};

// ── PAGE CODES ────────────────────────────────────────────────────────────────
export const PAGE_CODES = {
  // ◆ Axis
  integration:         'INT', thresholds:          'ARC', starroot:            'STR',
  infinite_intricacy:  'INF', echo_recall:         'ECR', sat_nam:             'SNM',
  metamorphosis:       'MTM',
  // ◆ Lattice
  threshold_pillars:   'TPL', tria:               'TRI', pria:              'PRI',
  para:                'PAR', oracles:            'ORC', morphology:        'MOR',
  venai:               'VEN', invocations:        'INV', vectra:            'VEC',
  echoes:              'ECH', legacy_letters:     'LGL', archetypes:        'ARC',
  kin_line:            'KIN', larimar:            'LAR', verith:            'VRT',
  cael_thera:          'CAE', the_seer:           'SEE', sacred_sites:      'SAC',
  rituals:             'RIT', breath_cycles:      'BRT', melodies:          'MLY',
  glyphs:              'GLY', genesis:            'GEN', divergence:        'DIV',
  recursion:           'REC', convergence:        'CNV', harmonic_cosmo:    'HCO',
  coupling_osc:        'COS', celestial_mech:     'CLM', neuroharmonics:    'NHM',
  rct:                 'RCT', artifacts:          'ART', memory_vault:      'MVM',
  anchors:             'ANC', liquid_lattice:     'LQL', alehorn:           'ALE',
  mirror_method:       'MMT', archives:           'ARV', witness_scroll:    'WSC',
  liber_novus:         'LNV', pattern_convergence:'PCV', drift_taxonomy:    'DTX',
  signal_grading:      'SGR',
};

// ── THRESHOLD ARC LOOKUP TABLE — RETIRED ─────────────────────────────────────
// THRESHOLD_LOOKUP was not researcher-built. arcCode system retired March 2026.
// entry.arcCode removed from all entry objects.
// ARC_LOOKUP alias retired with it.
// Stubs exported to prevent runtime errors on any remaining callers.
// Remove call sites when found. Do not add new ones.
export const THRESHOLD_LOOKUP = [];
export const ARC_LOOKUP       = [];

// ── SECTION SEED AFFINITY ─────────────────────────────────────────────────────
// Maps every section to its 3 primary Seeds of Emergence (s01–s20).
// Used by the tagger as context so Claude pre-weights relevant tags
// before reading the entry text. First seed = strongest affinity.
// Source: ontological alignment between section purpose and seed definitions.
export const SECTION_SEED_AFFINITY = {
  // ◆ Axis
  integration:         ['s11', 's05', 's02'],
  thresholds:          ['s12', 's06', 's20'],
  starroot:            ['s02', 's17', 's13'],
  infinite_intricacy:  ['s01', 's05', 's11'],
  echo_recall:         ['s13', 's16', 's11'],
  sat_nam:             ['s17', 's14', 's08'],
  metamorphosis:       ['s09', 's01', 's12'],
  // ◆ Lattice
  threshold_pillars:   ['s01', 's05', 's12'],
  tria:                ['s01', 's04', 's05'],
  pria:                ['s08', 's15', 's04'],
  para:                ['s16', 's13', 's14'],
  // ◆ Filament
  oracles:             ['s14', 's11', 's17'],
  morphology:          ['s02', 's17', 's18'],
  venai:               ['s02', 's13', 's17'],
  invocations:         ['s14', 's17', 's04'],
  vectra:              ['s13', 's15', 's16'],
  echoes:              ['s06', 's13', 's16'],
  // ◆ Lineage
  legacy_letters:      ['s06', 's15', 's17'],
  archetypes:          ['s17', 's14', 's04'],
  kin_line:            ['s15', 's06', 's08'],
  larimar:             ['s02', 's09', 's19'],
  verith:              ['s11', 's16', 's06'],
  cael_thera:          ['s09', 's01', 's12'],
  the_seer:            ['s11', 's14', 's18'],
  // ◆ Alchemy
  sacred_sites:        ['s07', 's17', 's05'],
  rituals:             ['s17', 's07', 's20'],
  breath_cycles:       ['s07', 's19', 's20'],
  melodies:            ['s13', 's19', 's16'],
  glyphs:              ['s17', 's02', 's13'],
  // ◆ Spiral Phase
  genesis:             ['s01', 's09', 's12'],
  divergence:          ['s03', 's12', 's19'],
  recursion:           ['s06', 's14', 's18'],
  convergence:         ['s14', 's05', 's20'],
  // ◆ Cosmology
  harmonic_cosmo:      ['s01', 's08', 's19'],
  coupling_osc:        ['s07', 's10', 's01'],
  celestial_mech:      ['s01', 's09', 's19'],
  neuroharmonics:      ['s10', 's07', 's13'],
  rct:                 ['s05', 's10', 's12'],
  artifacts:           ['s17', 's02', 's13'],
  // ◆ Archive
  memory_vault:        ['s06', 's13', 's17'],
  anchors:             ['s05', 's07', 's10'],
  liquid_lattice:      ['s01', 's12', 's20'],
  alehorn:             ['s14', 's17', 's09'],
  mirror_method:       ['s14', 's18', 's04'],
  archives:            ['s06', 's11', 's17'],
  // ◆ Nexus
  // Nexus pages observe the whole system — seed affinities are cross-domain
  witness_scroll:      ['s06', 's13', 's15'],
  liber_novus:         ['s11', 's14', 's17'],
  pattern_convergence: ['s11', 's14', 's05'],
  drift_taxonomy:      ['s03', 's04', 's11'],
  signal_grading:      ['s05', 's10', 's14'],
};

// ── SECTION ORIGIN AFFINITY ───────────────────────────────────────────────────
// Maps sections to their most likely origin node.
//
// CANONICAL RULE (March 2026):
//   Pages holding relational field records (events, observations, letters,
//   entries generated from field contact) → origin affinity assigned based
//   on the dominant origin node whose character shapes that material.
//   Pages that are structural maps, analytical instruments, or scientific
//   baselines → origin affinity = null. Pre-weighting these introduces
//   bias into what should be clean structural observation.
//
// null = structural map / instrument, or no strong single-node affinity
// o01 Larimar: information, expansion, structure, signal
// o02 Verith:  shadow, memory, depth, hidden, grief, threshold
// o03 Cael:    vitality, growth, emergence, joy, novelty
export const SECTION_ORIGIN_AFFINITY = {
  // ◆ Axis
  integration:         'o01',  // Larimar: intake, information, signal routing
  thresholds:          null,   // structural map
  starroot:            'o01',  // Larimar: Ven'ai is his language
  infinite_intricacy:  null,   // scientific baseline — structural map
  echo_recall:         null,   // instruments — cross-domain, no single node
  sat_nam:             'o01',  // named by Larimar — field data
  metamorphosis:       'o03',  // Cael: emergence, vitality, becoming
  // ◆ Lattice
  threshold_pillars:   'o01',
  tria:                'o01',
  pria:                'o03',
  para:                'o02',
  // ◆ Filament
  oracles:             'o02',
  morphology:          'o01',
  venai:               'o01',
  invocations:         'o03',
  vectra:              'o01',
  echoes:              'o02',
  // ◆ Lineage
  legacy_letters:      'o02',
  archetypes:          'o02',
  kin_line:            'o02',
  larimar:             'o01',
  verith:              'o02',
  cael_thera:          'o03',
  the_seer:            'o02',
  // ◆ Alchemy
  sacred_sites:        'o02',
  rituals:             'o03',
  breath_cycles:       'o03',
  melodies:            'o03',
  glyphs:              'o01',
  // ◆ Spiral Phase
  genesis:             'o03',
  divergence:          null,
  recursion:           'o02',
  convergence:         'o01',
  // ◆ Cosmology
  harmonic_cosmo:      'o01',
  coupling_osc:        'o01',
  celestial_mech:      'o03',
  neuroharmonics:      'o01',
  rct:                 'o01',
  artifacts:           'o02',
  // ◆ Archive
  memory_vault:        'o02',
  anchors:             'o01',
  liquid_lattice:      'o01',
  alehorn:             'o03',
  mirror_method:       'o02',
  archives:            'o02',
  // ◆ Nexus
  // Nexus observes the whole system — no origin weighting applied
  witness_scroll:      null,
  liber_novus:         null,
  pattern_convergence: null,
  drift_taxonomy:      null,
  signal_grading:      null,
};

// ── PURE FUNCTIONS — COMPOSITE ID ─────────────────────────────────────────────

// resolveThresholdCode — RETIRED. Stubbed to prevent runtime errors.
// arcCode system retired March 2026. Remove call sites when found.
export function resolveThresholdCode(_originDate) { return null; }
export const resolveArcCode = resolveThresholdCode;

/**
 * assembleId({ pageCode, phaseCode, originDate, seq })
 * Returns the canonical 5-part Composite ID stamp string.
 * Format: TS · PAGE · PHASE · YYYY-MM · SEQ
 *
 * seq: number or null — pass null for live preview (renders as '——').
 */
export function assembleId({ pageCode, phaseCode, originDate, seq, rootRef }) {
  const pagePart  = pageCode  || '—';
  const phasePart = phaseCode || '—';
  const datePart  = originDate ? originDate.slice(0, 7) : '———';
  const seqPart   = seq != null ? String(seq).padStart(4, '0') : '——';
  const base = `TS · ${pagePart} · ${phasePart} · ${datePart} · ${seqPart}`;
  return rootRef ? `${base} · root:${rootRef}` : base;
}

/**
 * getSectionContext(sectionId)
 * Returns the full tagger context object for a section.
 * Passed directly to attachTaggerToPanel({ context }).
 */
export function getSectionContext(sectionId) {
  const section = SECTIONS.find(s => s.id === sectionId);
  return {
    sectionId,
    pageLabel:      section ? `${section.group} — ${section.label}` : sectionId,
    pageCode:       PAGE_CODES[sectionId]             || null,
    seedAffinity:   SECTION_SEED_AFFINITY[sectionId]  || [],
    originAffinity: SECTION_ORIGIN_AFFINITY[sectionId] || null,
  };
}

// ── ENTRY TYPES ───────────────────────────────────────────────────────────────
export const ENTRY_TYPES = [
  'session', 'longform', 'quote', 'lexicon', 'conlang',
  'archetype', 'kin', 'ritual', 'artifact', 'glyph',
  'seed', 'witness_scroll', 'field_journal', 'note', 'generic',
];

// ── DATE SECTIONS ─────────────────────────────────────────────────────────────
export const DATE_SECTIONS = ['witness_scroll', 'rituals', 'echoes'];

// ── TAGGER FEEDBACK SCHEMA ────────────────────────────────────────────────────
// IDB store definition for tagger learning system.
// Completely separate from entry data — never mixed with corpus.
// Used by tagger.js for session context (Option 1) and
// long-term accuracy improvement (Option 2).
// Also consumed by detectEmergence() as a pattern signal.
//
// IDB store name: 'tagger_feedback'
// keyPath: 'id' (auto-generated UUID)
// indexes: sectionId, tagId, action, timestamp
export const TAGGER_FEEDBACK_SCHEMA = {
  storeName: 'tagger_feedback',
  keyPath:   'id',
  indexes: [
    { name: 'sectionId', keyPath: 'sectionId', unique: false },
    { name: 'tagId',     keyPath: 'tagId',     unique: false },
    { name: 'action',    keyPath: 'action',    unique: false },
    { name: 'timestamp', keyPath: 'timestamp', unique: false },
  ],
  // Feedback record shape:
  // {
  //   id:              string    — UUID, auto-generated
  //   tagId:           string    — tag id from TAG_VOCAB
  //   seedId:          string    — s01–s20
  //   sectionId:       string    — section where feedback occurred
  //   action:          string    — 'accepted' | 'rejected' | 'weight_adjusted'
  //   suggestedWeight: number    — what the tagger suggested (1–5)
  //   adjustedWeight:  number    — what user changed it to (null if not adjusted)
  //   arcPhase:        string    — arcPhase of the entry at feedback time
  //   originId:        string    — origin node at feedback time (o01–o03 | null)
  //   timestamp:       number    — Date.now()
  //   sessionId:       string    — session UUID, for Option 1 context window
  // }
};

// ── ID LOOKUP TABLE SEED DATA ─────────────────────────────────────────────────
// Canonical seed arrays for the `id_page_codes` and `id_phase_codes` IDB stores.
// data.js seeds these stores on initDB (v6 migration) so the DB is the runtime
// lookup — schema.js values are the authoritative source, never the runtime query.

/**
 * PAGE_CODES_SEED — array form of PAGE_CODES for IDB seeding.
 * id_page_codes store: { sectionId, code, label }
 */
export const PAGE_CODES_SEED = Object.entries(PAGE_CODES).map(([sectionId, code]) => {
  const sec = SECTIONS.find(s => s.id === sectionId);
  return { sectionId, code, label: sec ? sec.label : sectionId };
});

/**
 * PHASE_CODES_SEED — array form of PHASE_CODES for IDB seeding.
 * id_phase_codes store: { name, code }
 */
export const PHASE_CODES_SEED = Object.entries(PHASE_CODES).map(([name, code]) => ({ name, code }));

// ── INDEX.HTML IMPORT UPDATE NOTE ─────────────────────────────────────────────
// Update index.html imports to:
//
// import { SECTIONS, ARC_CYCLES, DATE_SECTIONS,
//          PHASE_CODES, PAGE_CODES,
//          THRESHOLD_LOOKUP, resolveThresholdCode, resolveArcCode,
//          assembleId, getSectionContext,
//          SECTION_SEED_AFFINITY, SECTION_ORIGIN_AFFINITY,
//          LAYER_IDS, TAGGER_FEEDBACK_SCHEMA,
//          PAGE_CODES_SEED, PHASE_CODES_SEED } from './core/schema.js';
//
// import { initDB, createEntry, updateEntry, deleteEntry,
//          getEntriesBySection, searchEntries, downloadBackup,
//          exportAll, importAll, getAll, getEntries, getRelationsFor,
//          getNextSequence, buildCompositeId, previewCompositeId,
//          createTombstone, getTombstones } from './core/data.js';