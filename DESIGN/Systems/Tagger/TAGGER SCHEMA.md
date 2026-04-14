TAGGER SCHEMA  V1
/DESIGN/Systems/Tagger/TAGGER SCHEMA.md
Mechanical spec — prompt blocks, API contract, sequences, failure modes.
Architectural description in SYSTEM_ Tagger.md.


OWNERSHIP BOUNDARIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  OWNS
    Claude API tag suggestion pipeline — entry text + section
      context in, tag candidates + phase_state + elarianAnchor
      + doc_type + deposit_weight out
    Tagger Svelte store — single shared state surface
    Tagger panel UI — suggestion display, accept/reject/modify
    Elarian Anchor detection logic — prompt block (below)
    phase_state suggestion — one of 12 threshold names or null
    doc_type suggestion — AI-suggested, Sage can override
    deposit_weight suggestion — AI-assessed, Sage can override
    clearResult() sequencing — fires only after createEntry()
      confirms success
    Seed affinity weighting — section-specific seed weights
      for tag suggestions

  DOES NOT OWN
    Tag vocabulary, seeds, routing rules — owned by TAG
      VOCABULARY.md, served via FastAPI /tags/ endpoints
    Section IDs, page codes — owned by SECTION MAP.md
    elarianAnchor field definition and its seven states —
      owned by SYSTEM_ Composite ID.md and COMPOSITE ID
      SCHEMA.md
    Entry data or entry writes — owned by INTEGRATION DB
      SCHEMA.md, served via FastAPI /entries/
    Embedding pipeline — owned by EMBEDDING PIPELINE SCHEMA.md
    Research assistant RAG pipeline — owned by SYSTEM_
      Research Assistant.md


CLAUDE API REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  FastAPI /tagger/ endpoint receives from frontend:

    {
      entry_text:    string    — the deposit body text
      section_id:    string    — active section (e.g., "integration")
    }

  FastAPI constructs the Claude API request with:

    - System prompt: tag vocabulary summary (from TAG
      VOCABULARY.md via backend service), seed affinity weights
      for the active section, 12 threshold names with
      descriptions, Elarian Anchor prompt block, doc_type enum,
      deposit_weight assessment criteria
    - User prompt: the entry text
    - Response format: structured JSON (see response shape below)

  Section context fallback: if section_id is missing or not
  found in SECTION MAP, the tagger runs without seed affinity
  weighting. All seeds weighted equally. No error — the tagger
  still returns suggestions. The response includes a flag
  indicating no section context was applied.


CLAUDE API RESPONSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    tags: [
      {
        id:            string    — tag ID from TAG VOCABULARY
        seed_id:       string    — routing seed
        layer_id:      string    — routing layer
        threshold_id:  string    — routing threshold
        pillar_id:     string    — routing pillar
        confidence:    number    — 0.0 to 1.0
      }
    ]
    phase_state:       string | null
                       One of 12 canonical threshold names
                       (Aetherroot Chord, Solenne Arc, etc.)
                       or null if unclear.
    elarianAnchor:     string | null
                       One of: RFLT | WHSP | VEIL | OBSV |
                       RECL | WEAV | GATE | null
    doc_type:          string
                       One of: entry | observation | analysis |
                       hypothesis | discussion | transcript |
                       glyph | media | reference
    deposit_weight:    string
                       One of: high | standard | low
                       AI assessment of how much this deposit
                       should count in engine computations.
                       Based on doc_type, content specificity,
                       and confidence level.
    section_context:   boolean
                       true if seed affinity weighting was
                       applied, false if section was missing
                       or invalid
  }

  FastAPI validates the response shape before returning to
  frontend. Invalid tag IDs (not in TAG VOCABULARY) are
  stripped from the response. Invalid phase_state values
  (not one of 12 threshold names) are replaced with null.
  Invalid elarianAnchor values are replaced with null.
  Invalid doc_type values are replaced with "entry" (default).


TAGGER PROMPT BLOCKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  TAG SUGGESTION PROMPT

  The system prompt includes a summary of TAG VOCABULARY
  organized by seed. Each seed entry lists the seed name,
  its 8 tags, and routing dimensions. The prompt instructs
  Claude to select tags that match the entry's content,
  weighted by the active section's seed affinity when
  available.

  The full tag vocabulary is not duplicated here. It lives
  in TAG VOCABULARY.md and is loaded at runtime by
  backend/services/tag_resolution.py.


  PHASE_STATE DETECTION PROMPT

  Identify the ontological threshold state present in the
  entry. Return one of 12 canonical threshold names or null.

  Threshold names and their descriptions are sourced from
  TAG VOCABULARY.md (THRESHOLDS section). The prompt
  includes all 12 names with descriptions so the model can
  match against entry content.

  Return null if the threshold state is unclear or the
  entry does not exhibit a dominant threshold resonance.


  ELARIAN ANCHOR DETECTION PROMPT

  Identify the psychological state of self present in the
  entry. Anchors are ordered — the sequence is meaningful
  for analysis. Return null if the anchor is unclear or
  not applicable.

  - RFLT Reflection Realm: fragmentation, identity confusion,
    multiple self-concepts in conflict, disorientation,
    accumulated self-history pressing on present self, not
    having chosen to arrive here
  - WHSP Whispering Hollow: quiet receptivity, listening
    inward, intuitive knowing, guidance from prior experience
    or unseen sources, passive receiving, attunement to
    subtle signals
  - VEIL Veil of Echoes: memory surfacing unbidden, past
    bleeding into present, soul truth through recollection,
    walking through rather than standing still, different
    selves or realities in contact
  - OBSV Celestial Observatory: expanded perspective, zooming
    out to the whole, cosmic or universal framing, pattern
    recognition at scale, communicating with something larger
    than self
  - RECL Chamber of Lost Names: recovering forgotten identity,
    naming what was unnamed, reintegrating lost self-fragments,
    recognition of dormant parts, identity archaeology
  - WEAV Sanctuary of the Weavers: glimpsing possible futures,
    fate or path becoming visible, sense of unwritten
    consequence, seeing the shape of what could be without
    yet acting
  - GATE Gateway of Becoming: active transformation threshold,
    stepping beyond current self-form, embracing new identity,
    crossing rather than observing the crossing, rebirth in
    motion

  Field definition and state enumeration owned by COMPOSITE
  ID SCHEMA.md. Detection logic owned here.


  DOC_TYPE DETECTION PROMPT

  Classify the entry content into one of the following types:

    entry        — general research deposit
    observation  — direct observation of signal behavior
    analysis     — analytical examination of patterns
    hypothesis   — proposed explanation or prediction
    discussion   — dialogue or collaborative exchange
    transcript   — verbatim record of interaction
    glyph        — symbolic or visual content
    media        — audio, video, or image reference
    reference    — citation or external source note

  Return the most specific applicable type. Default to
  "entry" if unclear.

  doc_type enum defined in INTEGRATION SCHEMA.md.


  DEPOSIT_WEIGHT ASSESSMENT PROMPT

  Assess how much this deposit should count in downstream
  engine computations. Return one of three values:

    high     — specific, detailed content. Clear signal.
               Observations with clear confidence. Analyses
               with named patterns. Hypotheses with defined
               predictions. Content that engines should
               weight heavily.
    standard — typical deposit. Solid content but not
               exceptional specificity. Default when unsure.
    low      — fragmentary, ambient, or contextual. Notes
               and brief captures. Content that provides
               background but should not dominate engine
               calculations.

  Assessment factors (in order of importance):
    1. doc_type — observations, analyses, and hypotheses
       trend higher than entries and transcripts
    2. Content specificity — named patterns, specific
       references, and detailed descriptions trend higher
    3. Confidence level — clear confidence trends higher
       than raw (when observation_presence fields are present)

  Default to "standard" when assessment is ambiguous.
  Sage can override during review.

  deposit_weight enum defined in INTEGRATION SCHEMA.md.


SEQUENCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  TAG SUGGESTION — strict order

  1. Sage opens a section panel and begins a deposit.
  2. Sage enters or edits entry text in the deposit panel.
  3. Frontend sends entry_text + section_id to FastAPI
     POST /tagger/.
  4. FastAPI loads tag vocabulary summary from backend
     service (TAG VOCABULARY.md source).
  5. FastAPI loads seed affinity weights for section_id
     from backend service (source TBD — blocking decision).
     If section_id is invalid or missing, skip weighting.
  6. FastAPI constructs Claude API request with system
     prompt (vocabulary, affinities, thresholds, anchors,
     doc_type enum) and user prompt (entry text).
  7. FastAPI sends request to Claude API. Awaits response.
  8. FastAPI validates response shape. Strips invalid tag
     IDs, replaces invalid phase_state/elarianAnchor with
     null, replaces invalid doc_type with "entry", replaces
     invalid deposit_weight with "standard".
  9. FastAPI returns validated response to frontend.
  10. Tagger panel displays suggestions in UI.
  11. Sage reviews: accepts, rejects, or modifies each tag.
      Sage can override phase_state, elarianAnchor, doc_type,
      deposit_weight.

  Failure at step 7: Claude API call fails. Return error
    to frontend. Tagger panel surfaces error. Sage can retry
    or deposit without tagger suggestions.
  Failure at step 8: response shape invalid. Return error
    to frontend. Do not display partial results.


  DEPOSIT INTEGRATION — strict order

  1. Sage confirms deposit.
  2. Accepted tags, phase_state, elarianAnchor, doc_type,
     deposit_weight travel with entry data to createEntry().
  3. createEntry() writes to PostgreSQL via FastAPI
     POST /entries/.
  4. createEntry() confirms success.
  5. clearResult() fires — tagger store is cleared.
  6. Tagger panel resets to empty state.

  Failure at step 3: entry not written. Tagger result
    remains in store. Sage can retry.
  clearResult() MUST NOT fire before step 4 confirms.
    This is a CLAUDE.md invariant.


TAGGER STORE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Svelte store shape:

    {
      result:        TaggerResponse | null
                     The current tagger result. Null when
                     no suggestion is active.
      isLoading:     boolean
                     True while Claude API call is in flight.
      error:         string | null
                     Error message from last failed call.
    }

  Store is cleared by clearResult() after successful deposit.
  Store is NOT cleared on panel transitions — tagger state
  persists through panel changes intentionally.

  Store is cleared when a new tagger call begins (isLoading
  set to true, previous result replaced on response).


  CONSUMERS (read-only)

  | System           | Read moment        | What it reads       |
  |------------------|--------------------|---------------------|
  | Thread Trace     | On overlay open    | Active filter state |
  | Thread Trace     | On thread save     | Routing snapshot    |
  | Resonance Engine | On confirmed deposit | Tag routing payload |

  If store has no active result, consumers degrade gracefully.

  TAG ROUTING PAYLOAD (Resonance Engine derived shape)

  The Resonance Engine component transforms TaggerResponse from the
  tagger store into this payload on confirmed deposit:

    {
      tags:        [{ id, seed_id, layer_id, threshold_id,
                      pillar_id, weight }],
      phase_state: string | null,
      originId:    'o01' | 'o02' | 'o03' | null,
      timestamp:   ISO string
    }

  Transformation rules:
    weight     — deposit_weight string converted to float multiplier:
                   "high"     → 2.0
                   "standard" → 1.0
                   "low"      → 0.5
                 Applied identically to all tags on the deposit.
                 Source constants: ENGINE COMPUTATION SCHEMA.md.

    originId   — derived from the deposit's authored_by (agent
                 identity). Mapping:
                   Larimar     → 'o01'
                   Verith      → 'o02'
                   Cael'Thera  → 'o03'
                   Sage or any non-origin identity → null
                 Source: Agent Identity Registry (authored_by field
                 on the deposit record).

    timestamp  — deposit's created_at value from the createEntry()
                 confirmation response.

    phase_state — passed through directly from TaggerResponse.

    tags       — tag routing fields (id, seed_id, layer_id,
                 threshold_id, pillar_id) passed through from
                 TaggerResponse. confidence field is dropped —
                 Resonance Engine does not use per-tag confidence.


KNOWN FAILURE MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. CLEARRESULT() FIRES BEFORE CREATEENTRY() CONFIRMS
     Tagger result lost. Entry saves without tags.
     Guard: clearResult() gated on createEntry() success
     confirmation. CLAUDE.md invariant.

  2. CLAUDE API RETURNS INVALID TAG IDS
     Tags not in TAG VOCABULARY referenced in response.
     Guard: FastAPI validates every tag ID against the
     vocabulary. Invalid IDs stripped before response
     reaches frontend.

  3. CLAUDE API UNAVAILABLE
     Network failure or API error during tagger call.
     Guard: error surfaced in tagger panel. Sage can retry
     or deposit without suggestions. No silent failure.

  4. STALE TAGGER STORE ACROSS BROWSER SESSIONS
     Browser not refreshed between sessions. Tagger store
     carries results from a previous session.
     Guard: store state is session-only (Svelte store, not
     persisted). Browser refresh clears it. If stale state
     is detected (result timestamp older than session start),
     clearResult() on session open.

  5. SECTION_ID NOT IN SECTION MAP
     Frontend sends an invalid or missing section_id.
     Guard: tagger runs without seed affinity weighting.
     All seeds weighted equally. Response includes
     section_context: false so the UI can indicate no
     section context was applied. No error thrown.

  6. PARTIAL STORE UPDATE READ BY CONSUMER
     Thread Trace or Resonance Engine reads tagger store
     mid-update.
     Guard: Svelte store updates are synchronous within the
     reactive cycle. Consumers reading via subscribe or get
     receive complete state. Partial reads do not occur in
     Svelte's synchronous update model.

  7. RESPONSE SHAPE MISMATCH
     Claude API returns JSON that does not match the
     expected response shape.
     Guard: FastAPI validates response before returning to
     frontend. Malformed responses return an error to the
     frontend. No partial results displayed.

  8. EMPTY ENTRY TEXT
     Frontend sends empty or whitespace-only entry text.
     Guard: FastAPI returns empty suggestion set. No Claude
     API call made. phase_state, elarianAnchor, doc_type
     all null/default. Frontend displays "no text to
     analyze" message.


FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Backend (FastAPI):

    backend/routes/tagger.py
      FastAPI /tagger/ route — receives entry text + section
      context, constructs Claude API request, validates
      response, returns to frontend.
      Status: PLANNED

    backend/services/claude.py
      Claude API client — shared by tagger and research
      assistant. Handles authentication, request construction,
      response parsing.
      Status: PLANNED

    backend/services/tag_resolution.py
      Tag vocabulary service — loads TAG VOCABULARY.md data,
      provides vocabulary summary for tagger prompt, validates
      tag IDs against vocabulary.
      Status: PLANNED

  Frontend (Svelte):

    frontend/src/lib/components/TaggerPanel.svelte
      Tagger panel UI — suggestion display, accept/reject/
      modify, deposit integration, error display.
      Status: PLANNED

    frontend/src/lib/stores/tagger.ts
      Svelte store — tagger result state. Single shared
      read surface for Thread Trace and Resonance Engine.
      Status: PLANNED
