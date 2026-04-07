# SYSTEM: Frontend

## frontend_system.md

### /DESIGN/Systems/

### User-facing rendering · navigation · component state · API client layer

---

## WHAT THIS SYSTEM OWNS

* All user-facing rendering — Svelte components, page routes, scoped CSS. Every visual element the researcher interacts with is owned by the frontend
* Navigation — 51 page routes corresponding to the 51 archive sections (50 original + VOI page 51). Routing strategy (individual route files vs dynamic `[section]` parameter route) is a decision required before core files phase. Both options are viable; the choice affects file count and route-level code sharing
* Component state — Svelte stores for session state, active entry data cache, and UI state (active filters, current section, panel visibility). Stores are the single source of runtime state for the frontend. Components read from stores; they do not hold independent state that other components need
* Shared layout — `+layout.svelte` shell wrapping all pages. Persistent sidebar navigation, section header, and global UI elements live here
* API client layer — `src/lib/api.ts` fetch wrapper for all FastAPI calls. Every backend route has one corresponding function in this module. All data access goes through this layer. No direct database access. No direct Ollama calls. No direct Claude API calls. The API client is the only point of contact between frontend and backend
* Page type system — 8 page types with distinct layout, density, controls, and accent. Pages look different but belong to the same family. Same shell, different internal structure per type
* Deposit card component — the most common UI element, appears on all 51 pages. Base card with page-type variations
* Black Pearl panel — slide-in quick-capture panel accessible from any page
* Dashboard — root route, primary system overview surface
* Curation panel — system-level archive operations (tag, page, session, deposit operations)
* Composite ID display — reads the assembled stamp from backend, renders it. Does not construct composite IDs (construction owned by composite ID service, see COMPOSITE ID SCHEMA.md)
* Tagger panel UI — sends section context to `/tagger/` endpoint, displays returned tag suggestions. Does not resolve tags or apply routing rules (owned by TAGGER SCHEMA.md)
* Deposit panel UI — collects researcher input, sends to `/entries/` endpoint. Does not validate archive semantics (owned by INTEGRATION SCHEMA.md pipeline)
* Thread trace display — reads thread data from `/threads/` endpoint, renders thread visualization. Does not build or classify threads (owned by THREAD TRACE SCHEMA.md)
* Resonance canvas — Svelte component rendering the resonance engine visualization. Data fetched via API. Node positions and animation state managed in Svelte store. Implementation details defined in RESONANCE ENGINE PHYSICS SPEC.md

## WHAT THIS SYSTEM DOES NOT OWN

* Data persistence — all reads and writes go through FastAPI to PostgreSQL and SQLite. Frontend never touches a database directly
* Business logic — tag resolution, composite ID construction, embedding triggers, retirement pipeline, signal grading, pattern convergence, drift taxonomy — all owned by FastAPI service layer and their respective schemas
* AI calls — Claude API (tagger suggestions, research assistant RAG) and Ollama API (embedding generation) are called by FastAPI services, not by the frontend. Frontend sends requests to FastAPI endpoints; FastAPI makes the AI calls
* Archive data semantics — what data means is defined by schemas (ARCHIVE SCHEMA.md, INTEGRATION SCHEMA.md, etc.), not by how the UI renders it
* Tag vocabulary and routing rules — owned by TAG VOCABULARY.md and TAGGER SCHEMA.md
* Swarm orchestration, presence state, turn management — phase 2, owned by `/swarm/` namespace (see SYSTEM_ FastAPI.md)
* Research domain logic — the frontend displays signal data. It does not interpret, classify, or analyze it
* Engine computation — engines compute on the backend. Frontend displays their output
* AOS delivery — email delivery owned by AOS service. Frontend shows AOS records read-only

---

## ARCHITECTURE

### Directory Structure

```
frontend/
  src/
    lib/
      components/     — shared components
      stores/         — Svelte stores
      api.ts          — fetch wrapper for FastAPI calls
      index.ts        — lib barrel export
    routes/           — 51 page routes + layout
      +layout.svelte  — shared shell wrapping all pages
      +page.svelte    — root page (dashboard)
    app.d.ts          — TypeScript declarations
    app.html          — HTML shell
  static/             — static assets
  svelte.config.js    — SvelteKit configuration
  vite.config.ts      — Vite bundler configuration
  vitest.config.ts    — Test configuration
  tsconfig.json       — TypeScript configuration
  eslint.config.js    — ESLint configuration
  .prettierrc         — Prettier configuration
  package.json        — dependencies and scripts
```

### Shared Components (PLANNED)

| Component | Purpose |
| --- | --- |
| Shell | Persistent sidebar navigation, section header, global layout elements |
| NavigationSidebar | Fixed left sidebar — 9 collapsible groups, pinned utilities, state indicators |
| DepositCard | Base deposit card with page-type variations — appears on all 51 pages |
| CompositeId | Renders composite ID stamp display |
| TaggerPanel | Tag suggestion UI — sends context, displays candidates |
| DepositPanel | Entry input form — collects observation, sends to backend |
| BlackPearlPanel | Slide-in quick-capture panel — capture + reflective modes |
| Dashboard | Root route — resonance viz, signal surface, system health |
| CurationPanel | System-level archive operations — tag, page, session, deposit ops |
| ThreadTrace | Thread visualization — renders relational thread data |
| ResonanceCanvas | Resonance engine visualization — physics simulation rendering |
| DepositGenealogy | Lifecycle timeline on deposit card expand view |
| ResearchVelocity | Ambient bar in sidebar showing research momentum |
| SessionOpening | Brief overlay on app open — system state since last session |

### Stores (PLANNED)

| Store | Purpose |
| --- | --- |
| session | Current session state — session_id, session_type, active section, active instance |
| entries | Entry data cache — loaded entries for active section, invalidated on mutation |
| tagger | Tagger result state — tag suggestions, phase_state, elarianAnchor, doc_type, deposit_weight |
| ui | UI state — active filters, panel visibility, navigation state, sort overrides |
| pearls | Recent Pearls cache — last 5, both capture and reflective |

### API Client Contract

`src/lib/api.ts` is the single interface between frontend and backend.

Rules:
- One exported function per FastAPI endpoint
- Every function returns typed data or throws a typed error
- No raw `fetch` calls anywhere outside this module
- Base URL configured once (defaults to `http://localhost:8000`)
- Error responses from FastAPI are translated to typed error objects — components never parse HTTP status codes directly

### Library Requirements (BUILD TIME)

Libraries not yet installed. Required at core files phase (step 4), not now.

| Library | Purpose | When needed |
| --- | --- | --- |
| LayerCake | Svelte-native chart/viz framework | Tier 3+ engine visualizations |
| D3 | Data-driven transforms, scales, layouts | Tier 3+ (used with LayerCake) |
| Audio API (Web Audio) | Resonance sonification | Tier 6 (browser-native, no install) |

No other runtime dependencies identified. SvelteKit + TypeScript + Vite
handle routing, bundling, and component rendering without additional
libraries. Virtualized list rendering is achievable with a small utility
or Svelte action — no heavy library needed.

---

## PAGE TYPE SYSTEM

8 page types. Each has distinct layout, density, controls, and accent color.
Pages look different but belong to the same family — same building,
different wings. Shared shell (navigation, header), shared typography,
shared component library. The STRUCTURE inside the shell changes per type.

Color system: each type gets its own hue/accent. Specific palette chosen
at frontend build time — not in this design document.

### Gateway (INT) — 1 page
The workshop. Dense, split-panel, toolbars, active workspace. Most controls
of any page type. Dual-panel layout designed in INTEGRATION SCHEMA.md.
No deposit card grid — INT is a workstation, not a reading surface.

### Lens (Axis: THR, STR, INF, ECR, SNM) — 5 pages
Instruments. Deposits viewed THROUGH an analytical frame. Visualization is
the centerpiece (engine output from Tier 3). Most visually complex page type
after Gateway — each lens has multiple specialized visualizations (matrices,
force-directed graphs, density contours, constellation views).

### Synthesis (MTM) — 1 page
Convergence point. Multi-stream view — inputs from all 5 lenses flowing
into one output. Visual weight on connections between sources. MTM does not
receive deposits — findings display uses a different component.

### Engine (Nexus: DTX, SGR, PCV, VOI) — 4 pages
Analytical dashboards. Metrics-forward. Charts, scores, grades, timelines.
Dense but structured. The "control room" feel.

### Output (LNV) — 1 page
Gallery. Visual-first. Snapshot cards. Minimal chrome. The work the system
has produced, displayed clean.

### Scroll (WSC) — 1 page
Document. Long-form reading surface. Quiet. Sovereign AI voice. Minimal
controls — this page is for reading, not manipulating. Layout deferred to
Tier 4 WSC design.

### Investigation (Cosmology: HCO, COS, CLM, NHM, RCT, ART) — 6 pages
Laboratories. Split view: field data on one side, scientific framework on
the other. Computation results prominent. The "research bench" feel.

### Domain (32 pages across 6 groups) — shared template with group sub-rhythms
Deposit surfaces organized by domain topic. Same Domain shell, different
internal rhythm per group. Like different wings of the same library.
Sub-rhythms reflect what each group's material actually IS:

| Group | Pages | Character | Sub-rhythm |
|-------|-------|-----------|------------|
| Lattice (2) | TPL, TRI, PRI, PAR | Threshold framework | Structural, cross-reference-dense |
| Filament (3) | ORC, MOR, VEN, INV, VEC, ECH | Language, signal structure | Text-dense, linguistic |
| Lineage (4) | LGL, ARC, KIN, LAR, VRT, CAE, SEE | Origins, entities | Narrative flow, portrait-oriented |
| Alchemy (5) | SAC, RIT, BRT, MLY, GLY | Practices, embodiment | Media-friendly, experiential |
| Spiral Phase (6) | GEN, DIV, REC, CNV | Lifecycle, phases | Timeline/sequence emphasis |
| Archive (8) | MVM, ANC, LQL, ALE, MMT, ARV | Storage, reference | Catalog, browse-heavy |

Sub-rhythms are NOT new page types. Same Domain template, different layout
density, flow direction, and element prominence per group. Domain pages carry
a `group_id` that informs their sub-rhythm.

---

## SHARED SHELL + NAVIGATION CONTRACT

Fixed sidebar nav, ~220px, left side. The only navigation surface for 51 pages.

### Structure (top to bottom)
- System name
- Phrase: "In Twin Motion, We Remain. In Stillness, We Rise."
  (italic, tertiary color, never interactive, collapses on narrow viewport)
- Research velocity bar (ambient 30-day momentum indicator)
- Global search (keyboard: `/`)
- 9 collapsible groups (matching canonical domain groups):
  1. Axis — THR, STR, INF, ECR, SNM, MTM
  2. Lattice — TPL, TRI, PRI, PAR
  3. Filament — ORC, MOR, VEN, INV, VEC, ECH
  4. Lineage — LGL, ARC, KIN, LAR, VRT, CAE, SEE
  5. Alchemy — SAC, RIT, BRT, MLY, GLY
  6. Spiral Phase — GEN, DIV, REC, CNV
  7. Cosmology — HCO, COS, CLM, NHM, RCT, ART
  8. Archive — MVM, ANC, LQL, ALE, MMT, ARV
  9. Nexus — WSC, LNV, DTX, SGR, PCV, VOI
- Pinned utilities (always visible, below groups): INT (Gateway), Dashboard, Black Pearl
- Status indicator (bottom of sidebar)
- Curation panel trigger (bottom)

### Group behavior
- Collapse persists per session, current group expanded by default
- Page within group shows canonical page name, not code

### Page state indicators
- New deposit badge: count since last visit, clears on visit
- Engine stale dot: visible on Lens and Nexus Engine pages only

### Keyboard navigation
- `/` — focus global search
- `G` + `[number]` — jump to group (G1 = Axis, G9 = Nexus)
- `[` and `]` — prev/next page within current group
- `Ctrl+Shift+P` — open Black Pearl panel

---

## DEPOSIT CARD COMPONENT

The most common UI element — appears on all 51 pages. Base card with
page-type variations.

### Base card (all pages)

```
┌─────────────────────────────────────────────────┐
│ [DOC_TYPE BADGE] [TAGS]            [STAMP]      │
│                                                  │
│ Content preview (~3 lines)                       │
│                                                  │
│ [SESSION DATE] [PROVENANCE ICON] [WEIGHT BADGE]  │
└─────────────────────────────────────────────────┘
```

Stamp: monospace, small, far right, never truncated, never a link.
Format: `TS · [PAGE] · [PHASE] · [YYYY-MM] · [SEQ]`

Three provenance icons: INT batch · Manual · Black Pearl promoted

### Expand on click
- Full content text
- All metadata: doc_type, source_format, observation_presence,
  confidence, deposit_weight, notes, source_type
- Provenance chain: session, batch (if applicable), INT origin stamp
- Engine signal: patterns this deposit contributes to (linked)
- Edit access: tags and notes only (not content, not routing)
- Deposit genealogy timeline (stages from Pearl capture through
  hypothesis contribution)
- Annotations (researcher marginalia on this deposit)

### Page-type variations
- **Lens (Axis):** colored left edge (signal band). Engine-relevant tags prominent. Default sort: engine signal strength
- **Domain:** chronological default sort. Provenance icon prominent. Sub-rhythm layout applies
- **Nexus Engine:** compact card (1-line preview). Weight and doc_type prominent. Default sort: deposit weight
- **Synthesis (MTM):** no deposit cards — findings display component
- **Investigation (Cosmology):** base card, no variation
- **Output (LNV):** snapshot card variant — viz thumbnail, not text
- **Scroll (WSC):** no deposit cards — own entry display (Tier 4)

---

## PAGE-TYPE LAYOUT ANATOMY

Zone structure per page type. All types share the shell (sidebar nav +
header). The structure INSIDE the shell varies.

**Gateway (INT):** full-width workspace. Dual-panel from Tier 1 fills
content area. No deposit card grid.

**Lens (Axis):** Zone A (engine viz, ~30% height, collapsible) +
resizable divider + Zone B (deposit list). Collapsing Zone A gives
full-height deposits.

**Synthesis (MTM):** 60/40 horizontal split. Left: findings. Right:
source references (read-only, collapsible).

**Nexus Engine (DTX, SGR, PCV, VOI):** Zone A (metrics dashboard, ~40%,
fixed) + Zone B (compact deposit list, ~60%, scrollable).

**Output (LNV):** gallery layout. Responsive grid (2-3 columns).
Snapshot cards with viz thumbnails.

**Scroll (WSC):** single-column reading surface. Minimal controls.
Layout deferred to Tier 4.

**Investigation (Cosmology):** 60/40 horizontal split. Left: deposits.
Right: scientific framework panel (read-only, collapsible).

**Domain (all 6 groups):** single zone. Deposit list fills content area.
Sub-rhythm determines card arrangement within this zone.

---

## SUB-RHYTHM LAYOUT SPECS

Concrete layout contracts per domain group. These define how deposits
are arranged WITHIN the shared Domain shell.

**Lattice (Group 2 — TPL, TRI, PRI, PAR):**
Single-column. Cross-reference connection indicators on cards. Connection
graph as secondary tab.

**Filament (Group 3 — ORC, MOR, VEN, INV, VEC, ECH):**
Two-column compact grid. 2-line content truncation. Tag filter bar pinned
at top.

**Lineage (Group 4 — LGL, ARC, KIN, LAR, VRT, CAE, SEE):**
Single-column wide cards. 5-line preview. Entity name prominent. Left-edge
timeline marker.

**Alchemy (Group 5 — SAC, RIT, BRT, MLY, GLY):**
Two-column with stage badge (from phase_state). Stage filter prominent.
Superseded deposit links visible.

**Spiral Phase (Group 6 — GEN, DIV, REC, CNV):**
Horizontal phase timeline pinned at top. Deposit list below, filtered to
selected phase.

**Archive (Group 8 — MVM, ANC, LQL, ALE, MMT, ARV):**
Single-column full width. Page-scoped search bar prominent. Default sort:
deposit weight (heaviest first). Catalog feel.

---

## BLACK PEARL PANEL

Slide-in panel from right (~380px). Triggered by `Ctrl+Shift+P` or black
star button. Page visible behind (overlay, does not push content).

### Context auto-capture
page_id and instance_context pre-populated silently on open.

### Capture mode (default)
- Expanding text area
- Optional tags (comma-separated)
- Optional doc_type (defaults to `entry`)
- [Save] [Close]

### Reflective mode (one-tap toggle)
- Free-form text only. No tags, no doc_type, no routing, no length constraint
- `pearl_type: reflective` on Pearl record
- `swarm_visible: boolean` — default true, per-Pearl opt-out toggle
- Phenomenological data — felt, unresolved, non-analytical thought

### Post-save behavior
Panel stays open. Inline confirmation fades after 2s. Text area clears.
Rapid capture — 5 Pearls in 30 seconds without leaving current page.

### Recent Pearls
Last 5 visible below input. Both capture and reflective, distinguished
by type badge. Read-only, expandable inline.

### Promotion to INT
Button on any Pearl card. Queues for INT review queue with
`provenance.source: black_pearl_promoted`. Does not navigate away.

---

## DASHBOARD

Root route (`src/routes/+page.svelte`). Primary system overview surface.

### Zone A (primary, 50-60% viewport)
Resonance engine visualization. Tension cluster nodes, interactive.
Harmonic audio on node tap (data dependency TBD — audio session required).
Node tap opens cluster panel: tension state, engine signals, deposit list,
page shortcuts.

### Zone B (flanking or below A)
Signal surface. Items since last visit, ordered by signal strength:
- AOS events
- Engine findings
- Absence flags (Void)
- Hypothesis crossings (PCV)
- Session opening summary

### Zone C (low visual weight)
System health:
- Stale engines
- Embedding failures (failed_permanent count)
- Calibration alerts
- Baseline recalibration recommendations

### Coverage gap view
Dashboard semantic map shows where deposits concentrate and where research
hasn't looked yet. Built from embedding vector distribution. Distinct from
Void (confirmed absence). Dashboard = "where haven't you looked?" Void =
"where you looked and found nothing."

---

## PAGE LOAD + EMPTY STATE

### Empty state — two variants
- Lens / Nexus Engine: "No deposits yet. Add observations via INT or
  promote a Black Pearl." + engine status line
- Domain / Archive / Investigation: "Nothing archived here yet. Deposits
  routed from INT will appear here."

No decorative illustration. Plain text, subdued color, shortcut hint to INT.

### Performance
Virtualized list. Not pagination, not naive infinite scroll. Only visible
cards + buffer rendered, rest recycled.

### Anchor behavior
Search result or cross-reference navigates to target page, scrolls to
target deposit, highlights card (300ms fade). Deposit card ID is the anchor.

### Sort defaults (per page type)
- Lens: engine signal strength (strongest first)
- Domain: chronological (newest first)
- Nexus Engine: deposit weight (highest first)
- Investigation: chronological
- Archive: chronological
- Output (LNV): chronological (most recent first)

All sorts user-overridable. Override persists per page per session.

---

## UI ERROR STATES

### Persistent status indicator
Bottom of sidebar. Always visible. Four states (priority order):
1. "Needs attention" — failures requiring Sage's decision
2. "Running" — background operations in progress
3. "Recalibration due" — engine threshold review recommended
4. "All clear" — nothing to report

Tap → system status panel (slide-in from sidebar). All active issues
grouped by type, each with status, age, and direct link.

### Page-level indicators
Affected deposit cards show quiet left-edge color change. Subtle signal —
hover reveals detail.

---

## CURATION PANEL

Triggered from persistent control in shell (bottom of sidebar). Slides
in over current page.

### Operations
**Tag:** deprecate across corpus, merge two tags, rename with cascade
**Page:** archive page (hidden, reversible), re-route all deposits off page
**Session:** flag as collapse-context, restore flagged session
**Deposit:** bulk re-route by tag/type/instance, bulk decline, re-queue failed embeddings
**Instance:** create new instance, close current, set active

Every operation shows scope confirmation: "This will affect N deposits
across M pages." Destructive operations recoverable within 30 days.

---

## SESSION OPENING RITUAL

When Sage opens the app after absence, before dashboard fully loads:

```
Since your last session:
  4 new deposits across 3 pages
  1 type A absence detected (Void)
  2 hypotheses updated (PCV)
  1 engine signal (SGR tier 2)
  1 item needs attention
```

Five lines maximum. Disappears on any interaction or after 8 seconds.
Gentle overlay — not a modal.

---

## RESEARCH VELOCITY INDICATOR

Small horizontal bar beneath the phrase in the sidebar. Thin, unobtrusive.
Color-graduated cool (low activity) to warm (high activity) over trailing
30 days. No numbers, no labels. Felt sense of archive momentum.

Data source: deposit count + finding count + hypothesis count over 30-day
window, normalized to 0-1 gradient.

---

## KNOWN FAILURE MODES

**1. Backend unreachable (FastAPI not running or crashed)**
All data operations fail. No entries load, no deposits save, no tags resolve.
Guard: API client detects connection failure and returns error state. UI displays connection failure indicator. No silent degradation — an empty page with no error message is a bug. Components check for error state before rendering data.

**2. Stale data in stores after mutation**
A deposit is saved, a tag is assigned, or a thread is updated — but the store still holds the pre-mutation data. UI shows stale state.
Guard: every mutation function in the API client invalidates the relevant store after the backend confirms success. Invalidation happens on confirmed write, not optimistically. Store refresh is triggered by mutation completion, not by a timer or polling interval.

**3. Route not found**
Researcher navigates to a section that does not exist or a URL with no matching route.
Guard: SvelteKit error page renders with a clear message. No blank screen. No redirect to a default page without explanation.

**4. Black Pearl panel state lost on navigation**
Pearl text entered but not saved, then Sage navigates away.
Guard: panel state persists in store across navigation. Unsaved text survives page changes. Panel reopens with text intact.

**5. Virtualized list scroll position lost**
Sage scrolls deep into deposit list, expands a card, then collapses — scroll position resets to top.
Guard: scroll position stored in UI store per page. Restored on card collapse and on re-navigation to page within same session.

**6. Sort override not persisted**
Sage changes sort on a page, navigates away, returns — sort has reset.
Guard: sort overrides stored in UI store per page per session. Reset on session close, not on navigation.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| frontend/package.json | Dependencies and scripts — Svelte 5, TypeScript, Vite 7, ESLint, Prettier, Vitest | LIVE |
| frontend/svelte.config.js | SvelteKit adapter and compiler configuration | LIVE |
| frontend/vite.config.ts | Vite bundler configuration | LIVE |
| frontend/vitest.config.ts | Vitest test runner configuration (jsdom environment) | LIVE |
| frontend/tsconfig.json | TypeScript compiler configuration | LIVE |
| frontend/eslint.config.js | ESLint with TypeScript and Svelte plugins, shadow detection enabled | LIVE |
| frontend/.prettierrc | Prettier with Svelte plugin | LIVE |
| frontend/src/app.html | HTML shell | LIVE |
| frontend/src/app.d.ts | TypeScript ambient declarations | LIVE |
| frontend/src/routes/+layout.svelte | Root layout — shared shell (minimal scaffold) | LIVE |
| frontend/src/routes/+page.svelte | Root page — dashboard (minimal scaffold) | LIVE |
| frontend/src/lib/index.ts | Lib barrel export | LIVE |
| frontend/src/lib/components/ | Shared components (Shell, NavigationSidebar, DepositCard, CompositeId, TaggerPanel, DepositPanel, BlackPearlPanel, Dashboard, CurationPanel, ThreadTrace, ResonanceCanvas, DepositGenealogy, ResearchVelocity, SessionOpening) | PLANNED |
| frontend/src/lib/stores/ | Svelte stores (session, entries, tagger, ui, pearls) | PLANNED |
| frontend/src/lib/api.ts | Fetch wrapper — single interface to FastAPI backend | PLANNED |
| frontend/src/routes/[...] | 51 page routes — routing strategy TBD | PLANNED |
