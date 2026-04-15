# SYSTEM: Frontend

## frontend_system.md

### /DESIGN/Systems/

### User-facing rendering · navigation · component state · API client layer

---

## WHAT THIS SYSTEM OWNS

* All user-facing rendering — Svelte components, page routes, scoped CSS. Every visual element the researcher interacts with is owned by the frontend
* Navigation — 52 page routes corresponding to the 52 archive sections (51 original + VOI page 52). Routing strategy (individual route files vs dynamic `[section]` parameter route) is a decision required before core files phase. Both options are viable; the choice affects file count and route-level code sharing
* Component state — Svelte stores for session state, active entry data cache, and UI state (active filters, current section, panel visibility). Stores are the single source of runtime state for the frontend. Components read from stores; they do not hold independent state that other components need
* Shared layout — `+layout.svelte` shell wrapping all pages. Persistent sidebar navigation, section header, and global UI elements live here
* API client layer — `src/lib/api.ts` fetch wrapper for all FastAPI calls. Every backend route has one corresponding function in this module. All data access goes through this layer. No direct database access. No direct Ollama calls. No direct Claude API calls. The API client is the only point of contact between frontend and backend
* Per-page layout specs — defined in PAGE_LAYOUTS.md. Each page has its own layout, density, controls, and accent. Pages look different but belong to the same family. Same shell, different internal structure per page
* Deposit card component — the most common UI element, appears on all 52 pages. Base card with per-page variations where needed
* Black Pearl panel — slide-in quick-capture panel accessible from any page
* Observatory — analytical overview surface (`/observatory`), 8-node constellation
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
    routes/           — 52 page routes + layout
      +layout.svelte  — shared shell wrapping all pages
      +page.svelte    — root page (Home — soft landing)
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
| DepositCard | Base deposit card with per-page variations — appears on all 52 pages |
| MediaDepositCard | Media deposit card — large thumbnail, summary alongside, lightbox on click |
| CompositeId | Renders composite ID stamp display |
| TaggerPanel | Tag suggestion UI — sends context, displays candidates |
| DepositPanel | Entry input form — collects observation, sends to backend |
| BlackPearlPanel | Slide-in quick-capture panel — capture mode, Pearl list, INT promotion |
| Observatory | 8-node constellation — Field Review, Field Log, Field Signals, Terrain, Timeline, Resonance Engine, Void, Pulse |
| ThreadTrace | Thread visualization — renders relational thread data |
| ResonanceCanvas | Resonance engine visualization — physics simulation rendering |
| DepositGenealogy | Lifecycle timeline on deposit card expand view |
| ~~ResearchVelocity~~ | REMOVED (session 32) — drift |
| ~~SessionOpening~~ | REMOVED (session 32) — drift |
| ThrCooccurrenceMatrix | 12x12 threshold co-occurrence matrix — LayerCake + d3-interpolate |
| ThrPresenceTimeline | Threshold presence timeline — 12 rows, deposit dots |
| ThrSequenceView | Threshold sequence detection display — table/card layout |
| EcrCorrelationMatrix | 19x19 signal correlation matrix — LayerCake + d3-interpolate + d3-zoom |
| EcrSignalConstellation | Force-directed signal constellation — d3-force, stateful drift tracking |
| EcrPresenceTimeline | Signal presence timeline — 19 rows, d3-zoom |
| EcrSequenceView | Signal sequence display with significance filter |
| InfDensityFieldMap | INF density field map — d3-contour, probabilistic domain boundaries |
| InfEmergenceTimeline | INF emergence timeline — domain bands, dormancy gaps |
| InfIntersectionDetail | INF intersection detail panel — triggered from density field map |
| StrRootClusterMap | Force-directed root cluster map — d3-force + d3-hierarchy + d3-zoom |
| StrCorrelationMatrix | Name correlation matrix — filterable by phase/role/root_pattern/grammar |
| StrNameIndex | Ven'ai name index — grouped by root family, searchable, sortable |
| SnmBipartiteGraph | Bipartite force-directed graph — field patterns, traditions, tradition nodes colored by pattern_category, uncategorized cluster explicit |
| SnmTemporalCorrespondence | Temporal correspondence view — strength over time, prompt version boundaries |
| PcvCardBoard | PCV primary surface — filterable/sortable hypothesis cards with provenance badges, expand for full detail |
| PcvNetworkGraph | PCV secondary view — domains as nodes, hypotheses as weighted edges, isolated nodes visible |
| DtxDriftTimeline | DTX primary view — swim-lane timeline, color-coded by trajectory_state, grade latency as lane length |
| DtxTrajectoryBar | DTX stacked bar — p_resolve/p_collapse/p_stable per active event, scannable comparison |
| DtxTernaryPlot | DTX deep-dive — three-axis probability space, inference trajectory trail per event |
| SgrScoreRadar | SGR per-signal radar — four axes, polygon profile, tier boundary rings, lowest-qualifying dimension highlighted |
| SgrTierDashboard | SGR aggregate — header (S/A/B/C counts) + stacked area over time |
| SgrLatencyDistribution | SGR histogram/density — grade latency in days, optionally split by tier |
| VoidAbsenceHeatmap | Void primary data view — sessions x engines, absence intensity, Type D spread visible |
| VoidExpectedVsObserved | Void quantitative backing — per-engine expected vs observed rate comparison |
| VoidSilenceDuration | Void bar chart/timeline — persistence of absences, feeds Type B/C classification |
| VoidClaudeOutputPanel | Void interpretive view — session-close default, on-demand history, expandable per-read |
| LnvGalleryCard | LNV gallery card — type badge, source system, date, content preview, sage note, prompt version |
| LnvGalleryGrid | LNV responsive grid — 2-3 columns, filterable by type/source/page/date, sortable |
| WscWriteButton | WSC write trigger — available in session close flow and WSC page directly |
| ARTISWorkbench | ARTIS Zone A — computation workbench, ad hoc computation execution, result display |
| ARTISRegistryPanel | ARTIS Zone B — mapping management, snapshot history, engine health, reference registry, review queue |
| ARTISPagePanel | ARTIS right-side panel — opens from Cosmology page headers, Zone B content without navigating away |
| SciencePingIndicator | Deposit card indicator on Cosmology pages — "Science ping available", triggers Layer 1 |
| SciencePingFlow | Multi-step ping flow — Layer 1 results → Layer 2 trigger → framework selection → Layer 3 suggestion → compute |
| ComputationSnapshotCard | ARTIS snapshot display — computation_type, result_summary, duration, expandable to full inputs/parameters/raw_output |
| MappingReviewCard | Claude-proposed mapping review — confirm/decline actions, confidence display, computation_hints preview |
| FindingCard | Cosmology finding card — four zones (identity, framework+hypothesis, computation, result+confidence+reference), three action buttons (nexus-eligible, confirm, abandon) |
| FindingsPanel | Separate findings panel per Cosmology page — all findings for the active page, filterable by status/framework/deposit |
| FindingInlineIndicator | Deposit card badge on Cosmology pages — "N findings" with expand to finding cards |
| ResidualPanel | RCT right panel — accumulating residuals by algorithm_component, threshold indicators, synthesis prompt |
| ResidualCard | Individual RCT residual display — algorithm_component, prediction vs observation, delta, computation ref |
| CouplingAnalysis | COS-specific visualization — correlation scatter plot, phase coherence display, coupled pair/group selection |
| HarmonicSpectrum | HCO signature visualization — frequency spectrum with labeled peaks, LayerCake + D3 |
| CorrelationScatter | COS signature visualization — correlation scatter plot, LayerCake + D3 |
| ClusterDendrogram | CLM signature visualization — hierarchical clustering dendrogram / distance heatmap, LayerCake + D3 |
| EntropyComparisonBar | NHM signature visualization — three-bar comparison (observed, random, structured), LayerCake + D3 |
| MirrorSymmetryDisplay | MIR signature visualization — bilateral structure mapping with explicit symmetry scoring, LayerCake + D3 |
| NexusFeedbackIndicator | nexus_eligible status display on finding cards — visual state for not-eligible, eligible, routed-to-PCV |
| ReferenceCard | External reference display — doi link, url link, summary, title, accessed date, page_codes badges |
| DistributionCard | Reference distribution display — name, description, source, page_codes, data preview |
| ResearchAssistantPanel | Persistent floating panel — navigates with Sage across all pages. Chat input, response display, context health indicators. Does not reset on page navigation |
| ResearchAssistantHeader | Panel header — page context display, retrieval confidence indicator (high/medium/low/none), Ven'ai context indicator (●/○), research state action button, context health warnings |
| DepositSuggestionCard | Observation articulation output — content (Sage's voice), suggested doc_type, suggested tags, suggested routing, confidence (Sage fills), confirm/edit/discard actions |
| ComputationSuggestionCard | Hypothesis framing output — pattern description, framework candidate, Cosmology page, ARTIS computation, positive/negative outcomes, corpus note, confirm/discard actions |
| ResearcherMemoryEditor | Research memory edit UI — opens from panel header, fields for current_focus, active_hypotheses, open_questions, skepticisms, not_yet_named, research_posture, phase_context |
| LongitudinalEchoDisplay | Post-assembly connection surfacing — shows similar observations from archive after deposit suggestion is assembled. Pointer, not conclusion |
| AudioPanel | Floating panel — node browser, succession player, field read, waveform visualizer, mix/mute controls. Persists across navigation |
| WaveformVisualizer | Live oscilloscope-style waveform canvas — AnalyserNode reads audio output, renders bezierCurveTo line with glow. Idle = flat center line |

### Stores (PLANNED)

| Store | Purpose |
| --- | --- |
| session | Current session state — session_id, session_type, active section, active instance |
| entries | Entry data cache — loaded entries for active section, invalidated on mutation |
| tagger | Tagger result state — tag suggestions, phase_state, elarianAnchor, doc_type, deposit_weight |
| ui | UI state — active filters, panel visibility, navigation state, sort overrides |
| pearls | Recent Pearls cache — last 5 active Pearls, searchable by content keyword |
| assistant | Research assistant state — conversation history (synced with Redis), researcher memory snapshot, retrieval confidence, Ven'ai context status, page context, panel visibility |

### API Client Contract

`src/lib/api.ts` is the single interface between frontend and backend.

Rules:
- One exported function per FastAPI endpoint
- Every function returns typed data or throws a typed error
- No raw `fetch` calls anywhere outside this module
- Base URL configured once (defaults to `http://localhost:8000`)
- Error responses from FastAPI are translated to typed error objects — components never parse HTTP status codes directly

### Library Requirements (BUILD TIME)

Visualization libraries not yet installed — required at core files phase
(step 4). WebAudio API and Svelte native motion are browser/framework
native and need no install.

| Library | Purpose | Install |
| --- | --- | --- |
| layercake | Svelte-native chart layout, scales, responsive containers — SVG instrument visualizations | Yes |
| D3 utilities (d3-scale, d3-shape, d3-force, d3-hierarchy, d3-interpolate, d3-zoom, d3-contour) | Scales, shapes, force layouts, hierarchy, color interpolation, zoom, contours — used with LayerCake | Yes |
| GSAP | Advanced animation where Svelte native motion is insufficient | Yes |
| @threlte/core | Three.js with Svelte-native bindings — Node Spiral, embedding constellation | Yes |
| three | 3D rendering engine — used with Threlte | Yes |
| postprocessing | Bloom and depth-of-field — node glow effects | Yes |
| umap-js | 768-dim embedding projection to 2D/3D — embedding constellation | Yes |
| regl | WebGL particle rendering at scale | Yes |
| simplex-noise | Organic noise for movement — spirals and constellations | Yes |
| WebAudio API | Audio playback, spatial panning, waveform analysis via AnalyserNode | Browser-native |
| Svelte native motion | svelte/motion, svelte/transition, svelte/animate — animation primitives | Framework-native |

SvelteKit + TypeScript + Vite handle routing, bundling, and component
rendering without additional libraries. Virtualized list rendering is
achievable with a small utility or Svelte action — no heavy library needed.

---

## PER-PAGE LAYOUT

Per-page layout specs are defined in PAGE_LAYOUTS.md. That file is the
authority for what each page looks like — layout, density, controls, accent,
background, engine component, deposit area, page-specific UI.

**What is retained:**

Color system — per-page or per-group accents. Valid design decision,
palette chosen at frontend build time.

---

## DEPOSIT CARD COMPONENT

The most common UI element — appears on all 52 pages. Base card with
per-page variations.

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
- Engine signal: patterns this deposit contributes to and their signal bands (linked)
- Edit access: tags and annotations only (not content, not routing)
- Deposit genealogy timeline (stages from Pearl capture through
  hypothesis contribution)
- Annotations (researcher marginalia on this deposit)

### Deposit list sort behavior
- Default sort order is per-page (see PAGE_LAYOUTS.md)
- Deposits with null deposit_weight sort to bottom, not randomly. Edge
  case — weight is always populated on creation — but sort is defined.

### Per-page card variations
- **THR, STR, INF, ECR, SNM:** colored left edge (signal band). Engine-relevant tags prominent
- **DTX, SGR, PCV, VOI:** compact card (1-line preview). Weight and doc_type prominent. Default sort: deposit_weight descending
- **MTM:** no deposit cards — findings display component
- **WSC:** no deposit cards — own entry display (Tier 4)
- **Domain pages:** provenance icon prominent. Per-page layout in PAGE_LAYOUTS.md
- **HCO, COS, CLM, NHM, MIR, RCT, ART:** base card, no variation

### Media deposit card

Media deposits use a separate card type (MediaDepositCard component) — not a variation of the base card.

- Large thumbnail
- Summary text alongside thumbnail
- Lightbox on click (full media view)

---

## PAGE LAYOUT

Per-page layout specs are defined in PAGE_LAYOUTS.md. That file is the
authority for per-page layout decisions.

---

---

## BLACK PEARL PANEL

Slide-in panel from left (page nav). Page visible behind (overlay, does
not push content). Keyboard shortcut deferred to Tier 7.

### Context auto-capture
page_id and instance_context pre-populated silently on open.

### Capture mode
- Label input (required — journal entry title)
- Expanding text area for content
- [Save] [Close]

### Post-save behavior
Panel stays open. Inline confirmation fades after 2s. Text area clears.
Rapid capture — 5 Pearls in 30 seconds without leaving current page.

### Pearl list
Keyword search input filters Pearls by content text. Default (no search):
last 5 active Pearls. Search active: matching Pearls. Each Pearl is
read-only and expandable inline.

### Promotion to INT
Button on any Pearl card. Queues for INT review queue with
`provenance.source: black_pearl_promoted`. Does not navigate away.
Pearl-originated deposits are discoverable in the archive via provenance
filter (Source: Black Pearl) — not via a tag vocabulary entry.

---

## OBSERVATORY

Route: `/observatory` (`src/routes/observatory/+page.svelte`).
The system's primary analytical overview surface. Not the root route —
Home (`/`) is the soft landing; Observatory is the analytical destination.

### Constellation layout — 8 interactive nodes (session 32 redesign)

1. **Field Review** — recent deposits with recall to INT. No time limit.
   Status change (deposited → recalled), not deletion.
2. **Field Log** — what happened since last session. Recent deposits,
   findings, engine events.
3. **Field Signals** — AOS events, engine findings, hypothesis crossings
   (PCV), active patterns. Merged signal surface.
4. **Terrain** — UMAP coverage map + custom visual overlay. Where deposits
   cluster and where the research hasn't looked yet. Built from embedding
   vectors. Observatory = "where haven't you looked?" Void = "where you
   looked and found nothing." (VOI-6)
5. **Timeline** — temporal deposit view across all 52 pages
6. **Resonance Engine** — full visualization, centerpiece
7. **Void** — absence flag summary
8. **Pulse** — calibration approvals, system alerts, pattern notifications.
   Stale engines and embedding failures routed to automated alerts
   (backend), not shown here.

### Removed from Observatory
- Black Pearl — lives in page nav
- WSC handoff — redundant

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
| frontend/src/routes/+page.svelte | Root page — Home, soft landing (minimal scaffold) | LIVE |
| frontend/src/lib/index.ts | Lib barrel export | LIVE |
| frontend/src/lib/components/ | Shared components (Shell, NavigationSidebar, DepositCard, MediaDepositCard, CompositeId, TaggerPanel, DepositPanel, BlackPearlPanel, Observatory, ThreadTrace, ResonanceCanvas, DepositGenealogy, ARTISWorkbench, ARTISRegistryPanel, ARTISPagePanel, SciencePingIndicator, SciencePingFlow, ComputationSnapshotCard, MappingReviewCard, FindingCard, FindingsPanel, FindingInlineIndicator, ResidualPanel, ResidualCard, CouplingAnalysis, HarmonicSpectrum, CorrelationScatter, ClusterDendrogram, EntropyComparisonBar, MirrorSymmetryDisplay, NexusFeedbackIndicator, ReferenceCard, DistributionCard) | PLANNED |
| frontend/src/lib/stores/ | Svelte stores (session, entries, tagger, ui, pearls) | PLANNED |
| frontend/src/lib/api.ts | Fetch wrapper — single interface to FastAPI backend | PLANNED |
| frontend/src/routes/[...] | 52 page routes — routing strategy TBD | PLANNED |
