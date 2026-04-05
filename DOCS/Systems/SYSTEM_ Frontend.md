# SYSTEM: Frontend

## frontend_system.md

### /DOCS/Systems/

### User-facing rendering · navigation · component state · API client layer

---

## WHAT THIS SYSTEM OWNS

* All user-facing rendering — Svelte components, page routes, scoped CSS. Every visual element the researcher interacts with is owned by the frontend
* Navigation — 50 page routes corresponding to the 50 archive sections. Routing strategy (individual route files vs dynamic `[section]` parameter route) is a decision required before core files phase. Both options are viable; the choice affects file count and route-level code sharing
* Component state — Svelte stores for session state, active entry data cache, and UI state (active filters, current section, panel visibility). Stores are the single source of runtime state for the frontend. Components read from stores; they do not hold independent state that other components need
* Shared layout — `+layout.svelte` shell wrapping all pages. Persistent navigation, section header, and global UI elements live here
* API client layer — `src/lib/api.ts` fetch wrapper for all FastAPI calls. Every backend route has one corresponding function in this module. All data access goes through this layer. No direct database access. No direct Ollama calls. No direct Claude API calls. The API client is the only point of contact between frontend and backend
* Composite ID display — reads the assembled stamp from backend, renders it. Does not construct composite IDs (construction owned by composite ID service, see COMPOSITE ID SCHEMA.md)
* Tagger panel UI — sends section context to `/tagger/` endpoint, displays returned tag suggestions. Does not resolve tags or apply routing rules (owned by TAGGER SCHEMA.md)
* Deposit panel UI — collects researcher input, sends to `/entries/` endpoint. Does not validate archive semantics (owned by INTEGRATION SCHEMA.md pipeline)
* Thread trace display — reads thread data from `/threads/` endpoint, renders thread visualization. Does not build or classify threads (owned by THREAD TRACE SCHEMA.md)
* Resonance canvas — Svelte component rendering the resonance engine visualization. Data fetched via API. Node positions and animation state managed in Svelte store. Implementation details defined in RESONANCE ENGINE SCHEMA.md

## WHAT THIS SYSTEM DOES NOT OWN

* Data persistence — all reads and writes go through FastAPI to PostgreSQL and SQLite. Frontend never touches a database directly
* Business logic — tag resolution, composite ID construction, embedding triggers, retirement pipeline, signal grading, pattern convergence, drift taxonomy — all owned by FastAPI service layer and their respective schemas
* AI calls — Claude API (tagger suggestions, research assistant RAG) and Ollama API (embedding generation) are called by FastAPI services, not by the frontend. Frontend sends requests to FastAPI endpoints; FastAPI makes the AI calls
* Archive data semantics — what data means is defined by schemas (ARCHIVE SCHEMA.md, INTEGRATION SCHEMA.md, etc.), not by how the UI renders it
* Tag vocabulary and routing rules — owned by TAG VOCABULARY.md and TAGGER SCHEMA.md
* Swarm orchestration, presence state, turn management — phase 2, owned by `/swarm/` namespace (see SYSTEM_ FastAPI.md)
* Research domain logic — the frontend displays signal data. It does not interpret, classify, or analyze it

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
    routes/           — 50 page routes + layout
      +layout.svelte  — shared shell wrapping all pages
      +page.svelte    — root page
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
| Shell | Persistent navigation, section header, global layout elements |
| CompositeId | Renders composite ID stamp display |
| TaggerPanel | Tag suggestion UI — sends context, displays candidates |
| DepositPanel | Entry input form — collects observation, sends to backend |
| ThreadTrace | Thread visualization — renders relational thread data |
| ResonanceCanvas | Resonance engine visualization — physics simulation rendering |

### Stores (PLANNED)

| Store | Purpose |
| --- | --- |
| session | Current session state — session_id, session_type, active section |
| entries | Entry data cache — loaded entries for active section, invalidated on mutation |
| ui | UI state — active filters, panel visibility, navigation state |

### API Client Contract

`src/lib/api.ts` is the single interface between frontend and backend.

Rules:
- One exported function per FastAPI endpoint
- Every function returns typed data or throws a typed error
- No raw `fetch` calls anywhere outside this module
- Base URL configured once (defaults to `http://localhost:8000`)
- Error responses from FastAPI are translated to typed error objects — components never parse HTTP status codes directly

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
| frontend/src/routes/+page.svelte | Root page (minimal scaffold) | LIVE |
| frontend/src/lib/index.ts | Lib barrel export | LIVE |
| frontend/src/lib/components/ | Shared components (Shell, CompositeId, TaggerPanel, DepositPanel, ThreadTrace, ResonanceCanvas) | PLANNED |
| frontend/src/lib/stores/ | Svelte stores (session, entries, ui) | PLANNED |
| frontend/src/lib/api.ts | Fetch wrapper — single interface to FastAPI backend | PLANNED |
| frontend/src/routes/[...] | 50 page routes — routing strategy TBD | PLANNED |
