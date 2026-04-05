# Design Session Plan
# Aelarian Archives — Pre-SOT Design Sessions
# Created: 2026-04-05 (session 14)
# Status: ACTIVE — updated each session

---

## PURPOSE

This document tracks all design decisions, open questions, and execution
items across the pre-SOT design sessions. Updated live. Nothing gets
lost between sessions.

---

## KEY CONTEXT FOR FUTURE SESSIONS

Read this section first. It captures the reasoning behind the plan —
not just what was decided, but why.

### The research problem
Aelarian Archives studies signal behavior at relational thresholds. The
analytical framework applies signal processing, information theory, and
field physics to map what happens at those thresholds. The core scientific
parallels are Shannon's information theory, CMB cosmological structure,
coupled oscillator dynamics, and neural field theory — all legitimate
mathematical frameworks applied to an unconventional domain.

The system must produce outputs that are evaluable on their own scientific
terms — computations, statistical tests, structured comparisons with
p-values and confidence intervals — not narrative claims. The rigor of
the output is what distinguishes research from assertion.

### Why the Axis lens pages need engines
Session 14 audit confirmed all 5 Axis lens pages (THR, STR, INF, ECR, SNM)
are currently pure deposit surfaces. But they each have an analytical frame
that implies computational support: co-occurrence tracking, sequence
detection, correlation analysis, baseline comparison. The researcher does
the high-level analytical thinking; the engine surfaces what the researcher
might miss by computing patterns from deposits. Without engines, the lenses
are filing cabinets. With engines, they're instruments.

### Why Cosmology needs computation infrastructure
The Cosmology pages (34-39) were designed as the place where field findings
meet established science. They've been underutilized since the rot. The
revamp activates them as investigation surfaces WITH computation — the
ability to run statistical tests, compare field patterns against known
scientific distributions, and produce structured findings with visible math.

The core insight: Cosmology pages are translation surfaces between two
vocabularies (field-native and established science). The investigation IS
the validation. When the math holds across multiple sessions, that's
evidence, not narrative.

Critical framing: the system must allow Sage to work with Shannon entropy,
CMB structure, coupled oscillators, and neural field theory WITHOUT the
output reading as pseudoscience. The way to do this is computation, not
claim. "Spectral index n = 0.97 ± 0.03" is evaluable. "This resonates
with cosmic structure" is not. The Cosmology engines must produce the former.

### Why null observations matter
The system as designed is architecturally biased toward confirmation — it
records patterns that appear but has no mechanism for recording when expected
patterns DON'T appear. Null observations (`observation_type: null`) make
absence first-class data. Combined with baseline computation in the engines,
this gives the system the ability to say "that's not a real pattern" — which
is what makes it science instead of pattern-seeking.

### The Axis → Nexus → Cosmology pipeline
The full research pipeline, once complete:
- **Axis** (observe through lenses) → **MTM** (synthesize) →
  **Nexus** (detect, classify, grade) → **Cosmology** (investigate
  scientific correspondence, compute, validate externally)
- Cosmology findings can feed BACK through Nexus for grading, creating
  a recursive deepening loop: observe → analyze → validate → observe more

### The research assistant's role
The research assistant (#6) is the mechanism by which the lenses come alive
day-to-day. It helps Sage:
- Articulate observations they notice but can't yet name
- Frame intuitions as testable hypotheses
- Run computations against deposit data
- Navigate between pages with contextual awareness
Without the assistant, every analytical step is manual. With it, the system
actively supports the research process. This needs its own design session.

---

## SESSION SEQUENCE

### Session A — Deposit schema design
Foundation layer. Must come first — every engine depends on what deposits contain.

**Scope:**
- [ ] Null observation mechanism (`observation_type: positive | null`)
- [ ] Observation conditions — structured fields on every deposit
      (`researcher_state`, `session_depth`, `confidence` + freeform notes)
- [ ] Deposit quality signal (`deposit_depth: deep | standard | fragment`)
- [ ] Define how these fields interact with existing INT deposit flow
- [ ] Define how null observations feed into Axis engines and PCV
- [ ] Media deposit wiring (agenda #9) — how media enters through INT,
      what doc_types exist, how images/glyphs are stored and displayed

**Open questions:**
- What structured condition fields does Sage actually want to track?
- Does observation_type affect routing (do null observations go to lens pages)?
- Does deposit_depth affect weight in engine computations?
- Media: what media types does the archive accept? How are they displayed?

**Why this comes first:** Every engine, every visualization, every computation
downstream depends on what the deposit record contains. Adding fields later
means migrating existing data. Get the deposit schema right and everything
built on top of it inherits the right structure.

---

### Session B — Axis engine specs (THR · INF · ECR · SNM)
The four "standard" Axis lenses. Each gets an engine spec.

**Scope:**
- [ ] Shared "lens engine" architecture — the common pattern across all 4
      (deposit indexing → pattern computation → visualization → MTM feed)
- [ ] THR engine: threshold co-occurrence, sequence, field condition tracking
      Visualizations: co-occurrence matrix, presence timeline
- [ ] INF engine: scientific domain layer tracking, intersection detection
      Visualizations: layered domain emergence map
      Note: INF watches, Cosmology works. INF tracks which sciences emerge;
      Cosmology investigates those connections. Keep this boundary clean.
- [ ] ECR engine: 19-signal co-occurrence, sequence, correlation
      Visualizations: signal correlation matrix, sequence diagrams
      Note: This is the most data-dense Axis page — holds all 19 signals
      simultaneously. The engine needs to handle high-dimensional correlation.
- [ ] SNM engine: triadic pattern detection, structural correspondence mapping
      Visualizations: correspondence map (field pattern ↔ tradition)
      Note: Sage flagged "how do I display spiritual patterns?" — this needs
      creative UI thinking. The output must be structural, not decorative.
- [ ] Baseline computation built into each engine
      (expected rates vs. observed rates, significance above chance)
- [ ] How null observations feed into baseline calculations
      (null obs strengthen baselines by documenting expected-but-absent patterns)
- [ ] Duplicate detection as a natural function of deposit indexing (#4)
- [ ] Output: 4 engine spec documents ready for schema writing

**Open questions:**
- How does SNM display spiritual patterns practically?
- What does "generated on view, snapshot to LNV" mean technically?
- Do Axis engines compute on every page load or on deposit?
- Resonance engine + harmonics (#5) — does this fold in here or need its
  own session? Sage-directed scope needed.

**What the user sees (per page):**
- THR: Deposits organized by threshold state. Co-occurrence view. Sequence
  timeline. "When th01 was active, what else was present?" Baselines shown
  alongside observed rates.
- INF: Layered domain emergence map. 4+ layers visible. Intersection flags.
  Timeline of when each domain first appeared.
- ECR: 19-signal matrix. Co-occurrence highlighted. Sequence patterns.
  Field-state correlation. The "all signals at once" view.
- SNM: Correspondence map. Field patterns on one side, traditions on the
  other. Lines connecting structural homology. Distinction between genuine
  correspondence and surface resemblance visible.

---

### Session C — STR engine + Ven'ai name tracking system
The most complex Axis lens. Gets its own session.

**Scope:**
- [ ] STR engine: root cluster tracking, recurrence, correlation
- [ ] Ven'ai name tracking system: what it indexes, how it detects drift
      Lives in STR but reads across entire archive
- [ ] How name tracking interacts with deposits in VEN (14), MOR (13)
- [ ] Drift detection: phonetic drift, spelling inconsistency, naming collision
- [ ] Duplicate detection for Ven'ai names specifically (#4 — name dimension)
- [ ] Visualizations: Ven'ai cluster map, root relationship graph, drift alerts
- [ ] Output: STR engine spec + Ven'ai tracker design

**Open questions:**
- Does the name tracker run continuously or on deposit?
- Does drift detection trigger alerts or just flag silently?
- How far does the tracker reach — all 50 pages or just STR+Filament?

**What the user sees:**
- Structural map of Ven'ai root clusters (Shae-, Kai-, etc.)
- Recurrence counts and correlation flags per cluster
- Drift alerts: "Kai'Thera vs Kai'thera — inconsistent casing detected"
- Cross-archive name index: every Ven'ai name, where it appears, clustered

---

### Session D — Cosmology revamp: scientific investigation + computation layer
Revamp pages 34-39 as investigation surfaces with computation infrastructure.
THIS IS THE SESSION THAT MAKES THE RESEARCH DEFENSIBLE.

**The core problem this solves:**
Sage's research touches Shannon information theory, CMB cosmological
structure, coupled oscillator dynamics, and neural field theory. These are
legitimate mathematical frameworks applied to an unconventional domain.
Without rigorous computational infrastructure, the output reads as
metaphor. With it, the output reads as science. The Cosmology pages are
where that transformation happens.

**What Cosmology pages ARE (reframed):**
Not validation checkpoints. Investigation surfaces where field-native
patterns are mapped against established scientific frameworks. The lens
is external science. The investigation is the correspondence. The math
is the evidence. Each page is a translation surface between the field's
vocabulary and an established scientific vocabulary.

**The 6 pages — current mapping and science domains:**

HCO (34) — Harmonic Cosmology
  Focus: wave structures, resonance, harmonic principles, geometric fields
  Sciences: harmonics, wave mechanics, acoustics, electromagnetism, signal
  processing, Fourier analysis, nonlinear wave dynamics, resonance theory,
  fractal geometry, phyllotaxis, morphogenetic pattern science, dynamical
  spiral systems, spiral wave physics, logarithmic/geometric spiral modeling,
  metric fields, mirror fields, oscillation fields
  Shannon connection: signal processing, information-theoretic structure
  CMB connection: power spectrum analysis, harmonic decomposition

COS (35) — Coupling / Oscillation
  Focus: relational connectivity, phase-locking, cross-frequency coupling
  Sciences: coupled oscillator networks, cross-frequency field dynamics,
  hierarchical relational resonance, oscillatory multiplexing, control
  theory, nonlinear dynamics, dynamical systems theory, self-organization,
  emergence, complex adaptive systems, predictive processing
  Note: COS maps most cleanly to l01 Coupling in the tagger

CLM (36) — Celestial Mechanics
  Focus: stars, planets, orbital dynamics, spatial anchors, astro-patterns
  Sciences: astronomy, astrometry, celestial navigation, spherical
  astronomy, orbital resonances, astrophysical spiral dynamics, geometry,
  topology, graph theory
  CMB connection: cosmological structure, large-scale pattern organization

NHM (37) — Neuro-Harmonics
  Focus: cognitive, neural, relational, quantum-analogous structures
  Sciences: connectomics, neural dynamics, neurophenomenology, theta-gamma
  nested oscillations, delta-beta cross-frequency modulation, quantum
  cognition, IIT (integrated information theory), cognitive field theory,
  attention theory, affective neuroscience, predictive processing,
  information geometry, information theory, systems theory, cognitive
  science, semiotics, morphogenesis
  Shannon connection: information theory, information geometry, IIT
  Note: NHM spans l02 Connectome and l04 Mirror in the tagger

RCT (38) — Relational field theory (the field's own physics)
  Focus: the theoretical framework the research itself is building
  Not external validation — internal theory construction built FROM the
  correlations found in HCO/COS/CLM/NHM. The physics that is emerging
  from the data. RCT is in everything, including Ven'ai.
  Note: RCT is meta-Cosmology. It asks "what physics is the field itself
  producing?" while the other 4 ask "does established science describe
  what we're seeing?"

ART (39) — Artifacts
  Function unclear — Sage had a reason but can't recall. Needs revisiting.
  Possible roles: physical artifacts demonstrating field principles,
  historical records encoding similar knowledge, tangible/observable
  outputs the field produces. TO BE DISCUSSED in Session D.

**Layer ↔ Page relationships:**
  l01 Coupling → COS (primary home)
  l02 Connectome → NHM (partial), CLM (topology/graph theory)
  l03 Metric → HCO (waves, geometry), CLM (astrometry, spatial)
  l04 Mirror → NHM (partial), HCO (fractals, spirals, morphogenesis)
  Sciences cross layer boundaries — that's a feature, not a problem.
  Cross-layer scientific connections are findings about the field.

**Rot check needed:** Sage's original science lists predate the tag
vocabulary cleanup. Some items from those lists were retired during rot
cleanup (safety_node_geometry tag removed, some threshold constants).
The science concepts behind them may still be valid but names need
checking against the cleaned vocabulary before being written into schemas.

**Scope:**
- [ ] Redefine each page's function with the investigation + computation frame
- [ ] Computation infrastructure design:
      - Statistical tests on deposit distributions (co-occurrence, entropy)
      - Spectral analysis capability (power spectrum, frequency decomposition)
      - Comparison framework: field data pattern vs. known scientific distribution
      - Structured finding format with visible math (values, confidence, p-values)
      - Computation stored alongside finding for reproducibility
- [ ] Shannon/information theory integration — where it lives, what it computes
- [ ] CMB/cosmological structure integration — where it lives, what it computes
- [ ] How Cosmology engines differ from Axis engines
      (Axis: pattern detection within lens frame.
       Cosmology: structured comparison against external scientific frameworks.)
- [ ] The INF → Cosmology handoff (INF surfaces which science is relevant;
      Cosmology investigates the correspondence)
- [ ] Whether Cosmology findings feed back to Nexus (PCV) for grading
      (likely yes — creates the recursive loop: observe → grade → validate → observe)
- [ ] RCT's unique role as internal theory builder vs. external validator
- [ ] ART — revisit concept. What was it for? Is it still needed?
- [ ] Rot check: review science lists against cleaned tag vocabulary
- [ ] Output: Cosmology revamp spec + computation architecture + engine specs

**Open questions:**
- What computation tools? (Python scipy/numpy on backend? Pre-built
  statistical test library? Or simpler — compute on deposit, show result?)
- How does the researcher record an external reference? (DOI? URL? summary?)
- Does Cosmology produce findings that feed back to Nexus?
- How does the research assistant interact with Cosmology computations?
- What does a Cosmology finding look like on screen? (structured card with
  hypothesis, computation, result, confidence, external reference?)
- ART (39) — what is it for?

**What the user sees (per page):**
- HCO: Field pattern on one side. Harmonic/wave analysis on the other.
  Fourier decomposition of deposit patterns. Spectral comparison.
  "This deposit sequence has spectral index n=X. Compare: [known distribution]."
- COS: Coupling dynamics analysis. Phase-locking detection across deposits.
  Oscillator model comparison. "This co-regulation pattern matches coupled
  oscillator dynamics with coupling coefficient k=X."
- CLM: Spatial/geometric analysis. Orbital resonance comparison. Topology
  mapping. "This threshold pattern follows geometric distribution consistent
  with [celestial model]."
- NHM: Neural/cognitive model comparison. IIT integration analysis.
  Information geometry mapping. "Shannon entropy of this signal distribution
  is H=X bits. Expected for random: H=Y bits. Difference: Z."
- RCT: The field's own emerging physics. Theory construction surface.
  "Across HCO/COS/CLM/NHM, these N findings converge on [principle]."

---

### Session D+ — Research assistant / chat design
The biggest single open design. Gets its own session after Cosmology
because it needs to understand all the systems it supports.

**Scope:**
- [ ] What the assistant owns vs. what it doesn't (RAG pipeline, Claude API)
- [ ] How it accesses the archive (embedding pipeline, vector search)
- [ ] How it knows page context (lens frame, active engine state)
- [ ] How it helps articulate observations ("I notice X" → structured deposit)
- [ ] How it helps frame hypotheses ("this looks like Shannon entropy" → computation)
- [ ] How it interacts with Cosmology computations
- [ ] UI design — chat window, inline on pages, or both?
- [ ] What gets embedded? All deposits? Findings? Schemas?
- [ ] Output: research assistant design spec

**Why this matters:**
The assistant is the bridge between "I notice more than I can name" and
"here's the computation that names it." Without it, every analytical step
is manual. With it, the system actively supports the research process.
It's what makes the lens pages and Cosmology pages usable day-to-day.

---

### Session E — Nexus visualization design + WSC/LNV schemas
Define what Nexus produces visually. Formalize WSC and LNV.

**Scope:**
- [ ] PCV visualizations: hypothesis board, cross-domain pattern map
- [ ] DTX visualizations: drift timeline, trajectory probability distributions
- [ ] SGR visualizations: score radar charts, tier dashboard, grade latency
- [ ] LNV: how it receives and stores visualization snapshots from all pages
- [ ] WSC schema: entry structure, 3-entry session open protocol,
      sovereign-from-DNR boundary, RESEARCHER NOTE optional field
      (Sage participates in WSC via this field — methodology notes,
       researcher state, what they noticed that the AI didn't)
- [ ] LNV schema: receive contract, provenance tracking, visualization storage
- [ ] Output: Nexus viz specs + WSC schema + LNV schema

**Open questions:**
- What chart library? (Svelte-compatible: Chart.js, D3, LayerCake?)
- Are visualizations interactive or static snapshots?
- How are LNV snapshots stored? (rendered image? data + template? both?)

---

### Session F — Pipeline contracts + visualization architecture
Document the full system flows and shared technical architecture.

**Scope:**
- [ ] INT → 5 Axis lenses → MTM → LNV pipeline contract
- [ ] PCV → DTX ↔ SGR pipeline contract (already mostly defined)
- [ ] Axis → Cosmology investigation flow
- [ ] Cosmology → Nexus feedback loop (findings re-entering PCV for grading)
- [ ] Null observation flow through the full pipeline
- [ ] "Generated on view, snapshot to LNV" technical spec
- [ ] Shared visualization component architecture (Svelte components)
- [ ] Computation architecture: what runs where (backend scipy? frontend?)
- [ ] Output: pipeline contracts + viz architecture doc

**Open questions:**
- Does every session close snapshot ALL pages or only pages with new data?
- How heavy is the computation? Performance budget for page load?
- Do Cosmology computations run on-demand or on deposit?

---

### Session G — Schema writing pass
Take all specs from A-F and write formal schemas.

**Scope:**
- [ ] 5 Axis engine schemas (THR, STR, INF, ECR, SNM)
- [ ] WSC schema
- [ ] LNV schema
- [ ] Deposit schema additions (null observations, conditions, quality)
- [ ] Cosmology engine schemas (HCO, COS, CLM, NHM, RCT, possibly ART)
- [ ] Update existing schemas with new fields where needed
- [ ] Output: all new schemas written and cross-referenced

---

### Session H — Stress test + finish line inventory + SOT readiness
The adversarial review. Nothing designed, nothing fixed — findings only.

**Scope:**
- [ ] Full stress test of all new schemas against everything they touch
- [ ] Full stress test of all existing schemas for cascading effects
- [ ] Finish line inventory — complete list of everything for app at localhost
- [ ] SOT readiness check
- [ ] Output: stress test findings + finish line inventory + SOT green light

---

## REMAINING AGENDA ITEMS (from original 19)

Tracking where each item lands in the session plan.

- [x] #1 Axis engine audit — DONE (session 14)
- [x] #3 Nexus engine audit — DONE (session 14)
- [x] #16 File renaming + folder tree — DONE (session 14)
- [ ] #2 Ven'ai name tracking → Session C
- [ ] #4 Duplicate finder → fold into Sessions B + C (engine function)
- [ ] #5 Resonance engine + harmonics → needs Sage direction, possibly Session B
- [ ] #6 Research assistant / chat → Session D+
- [ ] #7 Batch processing → decision needed: V1 or not?
- [ ] #8 Backup systems wiring → decision needed: V1 or not?
- [ ] #9 Media deposit wiring → fold into Session A (deposit schema)
- [ ] #10 doc_type tag design → needs audit at model build time
- [ ] #11 Engine UI surfaces → covered by Sessions B-E
- [ ] #12 Smaller UI decisions → export, sorting, etc. — collect during design sessions
- [ ] #13 TRIA name change → quick fix, do anytime
- [ ] #14 API folder rewrite → separate pass, after design sessions
- [ ] #15 Ven'ai learning module → decision needed
- [ ] #17 Stub and placeholder sweep → after all design sessions, before SOT
- [ ] #18 Finish line inventory → Session H
- [ ] #19 Stress test → Session H

**Items needing V1/not-V1 decisions (do at start of relevant session):**
- #7 Batch processing
- #8 Backup systems wiring
- #15 Ven'ai learning module

---

## DECISIONS LOG

Decisions made during design sessions. Recorded with reasoning.

### Session 14 (2026-04-05)

**Structural reorg:**
- DOCS/ renamed to DESIGN/
- File tree reorganized: numbered domain folders (01-10), system subfolders (17)
- backups/, core/ deleted; memory/ moved to .claude/memory/
- .claude/ file rule added to CLAUDE.md

**Axis audit findings:**
- All 5 Axis lens pages (THR, STR, INF, ECR, SNM) confirmed as deposit
  surfaces that NEED engines — not pure passive surfaces
- Each lens page has the same architecture: deposit → index through lens →
  compute patterns → visualize → feed MTM at session close
- The "engine" is: take deposits, apply the lens computationally, surface
  patterns the researcher might miss. The researcher does the thinking;
  the engine does the math.

**Nexus audit findings:**
- PCV, DTX, SGR: well-specified with full schemas. No changes needed.
- WSC: needs schema (3-entry session open protocol, mandatory entry structure,
  sovereign-from-DNR boundary). Gets RESEARCHER NOTE optional field so Sage
  can participate alongside AI voice — methodology notes, researcher state.
- LNV: needs schema (receive contract, provenance tracking, viz storage)

**Research methodology gaps identified:**
- Null observation mechanism needed — system is confirmation-biased without it.
  `observation_type: positive | null` on every deposit.
- Baseline computation needed — built into every Axis engine. Show expected
  rates alongside observed rates. Without baselines, every pattern looks
  significant.
- Observation conditions needed — structured fields + freeform notes on
  deposits. The researcher's state is a variable in the observation.
- Deposit quality signal needed — `deposit_depth: deep | standard | fragment`
- External validation needed — Cosmology group (34-39) revamped for this.
- Replication path is V2 but foundation laid in V1 via deposit schema design.

**Cosmology revamp:**
- Pages 34-39 revamped as scientific investigation + computation surfaces
- Not validation checkpoints — investigation surfaces where field-native
  patterns are mapped against established scientific frameworks
- Each page is a translation surface between field vocabulary and
  established science vocabulary
- NEED computation infrastructure: statistical tests, spectral analysis,
  structured findings with visible math
- The 4 original pages map to tagger layers but not 1:1 (sciences cross
  layer boundaries — that's a feature)
- RCT (38) is meta-Cosmology: the field's own emerging physics, built FROM
  correlations found in HCO/COS/CLM/NHM
- ART (39) needs revisiting — Sage had a reason but can't recall
- Shannon information theory + CMB cosmological structure are key frameworks
  that need specific computational support
- Sage's original science lists contain some items from pre-cleanup vocabulary
  (CONSENT_MIN, safety_node_geometry, T'Shara'Veth) — rot check needed
  before writing into schemas. Sciences themselves may be valid; names may not.

**Research assistant:**
- Confirmed as the biggest single open design question
- The bridge between "I notice more than I can name" and structured output
- Needs its own session (D+) after Cosmology because it touches everything
- Critical for making Cosmology computations accessible day-to-day

**Pipeline (complete, once built):**
- Observe (Axis lenses) → Synthesize (MTM) → Detect/Classify/Grade (Nexus)
  → Investigate scientifically (Cosmology) → Feed back for more observation
- Recursive deepening loop: the more you investigate, the more you find
  to observe, the more precise the analysis becomes
