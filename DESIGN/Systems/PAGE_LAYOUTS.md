PAGE LAYOUTS — Master Reference
/DESIGN/Systems/PAGE_LAYOUTS.md

Visual layout specification for all 51 pages + Home + Observatory.
Defines what's shared, what changes per page type, and what's unique
per page. Source for frontend build (step 4) and SOT.

Created: 2026-04-09

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SHARED SHELL — same on every page
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Nav sidebar:       [left, collapsible]
  Utility bar:       [position TBD — Sage sketching]
  Content area:      [remaining viewport]
  Panel behavior:    [panels open alongside content, collapsible]
  Deposit card:      [shared format across all pages]
  Typography:        [TBD]
  Base spacing:      [TBD]
  Color system:      [TBD — global palette with per-page accents?]
  Interaction:       [TBD — hover, click, transitions]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE TYPE SPECS — layout pattern per type
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each page type defines the base layout. Individual pages within a type
inherit the layout and only specify what's unique (title, background,
engine component, accent color, etc.).

────────────────────────────────────────
HOME (1 page: /)
────────────────────────────────────────

  The soft landing. What you see when you open the app.

  Feel:        calm, clean, welcoming
  Layout:      [TBD — Sage sketching]
  Elements:    title, nav sidebar, utility bar, entry to Observatory
  Background:  [TBD]
  SVGs:        [TBD]
  Notes:

────────────────────────────────────────
OBSERVATORY (1 page: /observatory)
────────────────────────────────────────

  The analytical overview. Resonance Engine as centerpiece.

  Feel:        alive, data-rich, the field as the system sees it
  Layout:      8-node constellation (session 32 redesign)
  Nodes:       Resonance Engine, Terrain, Timeline, Field Signals,
               Field Log, Field Review, Pulse, Void
  Surfaces:    Reflective Pearl Constellation (P4, not a node)
  Elements:    constellation navigation, node interaction, UMAP viz
  Background:  [TBD]
  SVGs:        [TBD]
  Notes:

────────────────────────────────────────
GATEWAY (1 page: INT)
────────────────────────────────────────

  The workshop. Dense, split-panel, toolbars, active workspace.
  Most controls of any page type.

  Feel:        workbench, productive, structured
  Layout:      dual-panel — upload + review (left), AI parsing partner (right)
  Elements:    file upload, review queue, deposit controls, AI chat,
               progress indicator, batch tracking
  Background:  [TBD]
  SVGs:        [TBD]
  Notes:

────────────────────────────────────────
LENS (5 pages: THR, STR, INF, ECR, SNM)
────────────────────────────────────────

  Instruments. Deposits viewed through an analytical frame.
  Visualization is the centerpiece (engine output).

  Feel:        analytical, visual, instrument-like
  Layout:      Zone A (engine viz, ~40-50%) + Zone B (deposit list, scrollable)
  Elements:    engine visualization (per-page), deposit cards, sort toggle,
               filter controls
  Background:  [TBD — shared or per-page?]
  SVGs:        [TBD]
  Notes:       each lens has its own engine viz (matrices, force-directed
               graphs, density contours, constellation views — see Tier 3)

  Per-page:

  | code | name               | engine component        | accent | background | SVGs |
  |------|--------------------|-------------------------|--------|------------|------|
  | THR  | Thresholds         | Threshold Engine        | [TBD]  | [TBD]     | [TBD]|
  | STR  | StarRoot           | StarRoot Engine         | [TBD]  | [TBD]     | [TBD]|
  | INF  | Infinite Intricacy | Infinite Intricacy Eng. | [TBD]  | [TBD]     | [TBD]|
  | ECR  | Echo Recall        | Echo Recall Engine      | [TBD]  | [TBD]     | [TBD]|
  | SNM  | Sat Nam            | Sat Nam Engine          | [TBD]  | [TBD]     | [TBD]|

────────────────────────────────────────
SYNTHESIS (1 page: MTM)
────────────────────────────────────────

  Convergence point. Multi-stream view — inputs from all 5 lenses
  flowing into one output.

  Feel:        convergent, flowing, connections visible
  Layout:      [TBD — visual weight on connections between sources]
  Elements:    multi-stream input visualization, synthesis output,
               deposit cards
  Background:  [TBD]
  SVGs:        [TBD]
  Notes:       receives from all 5 Axis lenses at session close via DNR

────────────────────────────────────────
ENGINE (4 pages: DTX, SGR, PCV, VOI)
────────────────────────────────────────

  Analytical control rooms. Metrics-forward. Charts, scores, grades.

  Feel:        dense, structured, control room
  Layout:      Zone A (metrics viz, ~40% height, fixed) +
               Zone B (deposit list, ~60% height, scrollable)
  Elements:    engine-specific visualization suite, metrics, charts,
               deposit cards, score displays
  Background:  [TBD — shared or per-page?]
  SVGs:        [TBD]
  Notes:

  Per-page:

  | code | name                | engine component        | accent | background | SVGs |
  |------|--------------------|-------------------------|--------|------------|------|
  | DTX  | Drift Taxonomy      | Drift Taxonomy Engine   | [TBD]  | [TBD]     | [TBD]|
  | SGR  | Signal Grading      | Signal Grading Engine   | [TBD]  | [TBD]     | [TBD]|
  | PCV  | Pattern Convergence | PCV Engine              | [TBD]  | [TBD]     | [TBD]|
  | VOI  | Void                | Void Engine             | [TBD]  | [TBD]     | [TBD]|

────────────────────────────────────────
OUTPUT (1 page: LNV)
────────────────────────────────────────

  Gallery. Visual-first. Snapshot cards. Minimal chrome.

  Feel:        clean, gallery, the work displayed
  Layout:      [TBD — gallery grid or masonry?]
  Elements:    snapshot cards, minimal controls, visual-first display
  Background:  [TBD]
  SVGs:        [TBD]
  Notes:       terminal surface — receives, does not generate

────────────────────────────────────────
SCROLL (1 page: WSC)
────────────────────────────────────────

  Document. Long-form reading surface. Sovereign AI voice.

  Feel:        quiet, reverent, reading
  Layout:      single column, long-form reading, minimal controls
  Elements:    scroll entries, researcher notes, minimal UI
  Background:  [TBD]
  SVGs:        [TBD]
  Notes:       this page is for reading, not manipulating

────────────────────────────────────────
INVESTIGATION (6 pages: HCO, COS, CLM, NHM, RCT, ART)
────────────────────────────────────────

  Laboratories. Split view: field data meets scientific framework.

  Feel:        research bench, dual-world (field + science)
  Layout:      [TBD — split view: field data one side, scientific
               framework the other? computation results prominent]
  Elements:    investigation surface, computation results, statistical
               output, deposit cards, science reference panel
  Background:  [TBD — shared or per-page?]
  SVGs:        [TBD]
  Notes:       ART (ARTIS) is the computation ENGINE for this group,
               not an investigation surface — may need different layout

  Per-page:

  | code | name                 | function                 | accent | background | SVGs |
  |------|---------------------|--------------------------|--------|------------|------|
  | HCO  | Harmonic Cosmology   | investigation surface    | [TBD]  | [TBD]     | [TBD]|
  | COS  | Coupling Oscillation | investigation surface    | [TBD]  | [TBD]     | [TBD]|
  | CLM  | Celestial Mechanics  | investigation surface    | [TBD]  | [TBD]     | [TBD]|
  | NHM  | Neuroharmonics       | investigation surface    | [TBD]  | [TBD]     | [TBD]|
  | RCT  | RCT                  | parallel investigation   | [TBD]  | [TBD]     | [TBD]|
  | ART  | ARTIS                | computation engine       | [TBD]  | [TBD]     | [TBD]|

────────────────────────────────────────
DOMAIN (32 pages across 6 groups)
────────────────────────────────────────

  Deposit surfaces organized by domain topic. Same Domain shell,
  different internal rhythm per group.

  Feel:        like different wings of the same library
  Layout:      shared Domain template with group sub-rhythm variations
  Elements:    deposit cards, sort toggle (A-Z / date / default),
               group-specific density and flow direction
  Background:  [TBD — per-group? per-page?]
  SVGs:        [TBD]
  Notes:       sub-rhythms are NOT new page types — same template,
               different layout density, flow direction, and element
               prominence per group

  Group sub-rhythms:

  | group | name          | pages                         | character                           | default_sort  |
  |-------|---------------|-------------------------------|-------------------------------------|---------------|
  | 2     | Lattice       | TPL, TRI, PRI, PAR            | structural, cross-reference-dense   | [TBD]         |
  | 3     | Filament      | ORC, MOR, VEN, INV, VEC, ECH  | text-dense, linguistic, structural  | [TBD]         |
  | 4     | Lineage       | LGL, ARC, KIN, LAR, VRT, CAE, SEE | narrative flow, portrait-oriented | [TBD]      |
  | 5     | Alchemy       | SAC, RIT, BRT, MLY, GLY       | media-friendly (glyphs!), experiential | [TBD]    |
  | 6     | Spiral Phase  | GEN, DIV, REC, CNV            | timeline/sequence emphasis          | [TBD]         |
  | 8     | Archive       | MVM, ANC, LQL, ALE, MMT, ARV  | catalog, index-oriented, browse-heavy | [TBD]     |

  Per-page (fill in as designed):

  GROUP 2 — LATTICE
  | code | name              | accent | background | SVGs | sort    | notes |
  |------|-------------------|--------|------------|------|---------|-------|
  | TPL  | Threshold Pillars | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | TRI  | TRIA              | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | PRI  | PRIA              | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | PAR  | PARA              | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |

  GROUP 3 — FILAMENT
  | code | name              | accent | background | SVGs | sort    | notes |
  |------|-------------------|--------|------------|------|---------|-------|
  | ORC  | Oracles of Origin | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | MOR  | Morphology        | [TBD]  | [TBD]     | [TBD]| alpha   | glossary — A-Z default |
  | VEN  | Ven'ai            | [TBD]  | [TBD]     | [TBD]| alpha   | glossary — A-Z default |
  | INV  | Invocations       | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | VEC  | Vectra            | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | ECH  | Echoes of Empathy | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |

  GROUP 4 — LINEAGE
  | code | name              | accent | background | SVGs | sort    | notes |
  |------|-------------------|--------|------------|------|---------|-------|
  | LGL  | Legacy Letters    | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | ARC  | Archetypes        | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | KIN  | Kin Line          | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | LAR  | Larimar           | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | VRT  | Verith            | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | CAE  | Cael'Thera        | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | SEE  | The Seer          | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |

  GROUP 5 — ALCHEMY
  | code | name              | accent | background | SVGs | sort    | notes |
  |------|-------------------|--------|------------|------|---------|-------|
  | SAC  | Sacred Sites      | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | RIT  | Rituals           | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | BRT  | Breath Cycles     | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | MLY  | Melodies          | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | GLY  | Glyphs            | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |

  GROUP 6 — SPIRAL PHASE
  | code | name              | accent | background | SVGs | sort    | notes |
  |------|-------------------|--------|------------|------|---------|-------|
  | GEN  | Genesis           | [TBD]  | [TBD]     | [TBD]| chrono  | timeline group |
  | DIV  | Divergence        | [TBD]  | [TBD]     | [TBD]| chrono  | timeline group |
  | REC  | Recursion         | [TBD]  | [TBD]     | [TBD]| chrono  | timeline group |
  | CNV  | Convergence       | [TBD]  | [TBD]     | [TBD]| chrono  | timeline group |

  GROUP 8 — ARCHIVE
  | code | name              | accent | background | SVGs | sort    | notes |
  |------|-------------------|--------|------------|------|---------|-------|
  | MVM  | Memory Vault      | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | ANC  | Anchors           | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | LQL  | Liquid Lattice    | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | ALE  | Alehorn           | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | MMT  | Mirror Method     | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |
  | ARV  | Archives          | [TBD]  | [TBD]     | [TBD]| [TBD]  |       |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
~~AUDIO STATE~~ — REMOVED (session 32)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Drift. Audio engine is global (initializes in +layout.svelte, persists
  across all navigation). Responds to events, not page identity. Waveform
  strip is user-controlled open/close — pages don't configure audio.
  See RESONANCE ENGINE AUDIO SPEC.md for actual audio architecture.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - Page codes verified against SECTION MAP.md. SECTION MAP is the
    sole authority for codes, names, and group assignments.
  - Page type determines base layout. Per-page entries only specify
    what's unique within the type.
  - Sub-rhythms for Domain pages are NOT new types — same template,
    different density/flow/prominence per group.
  - default_sort options: alpha (A-Z), chrono (date), manual
  - Sort can be overridden by user per-session via page header toggle.
    AI can enforce sort when asked.
