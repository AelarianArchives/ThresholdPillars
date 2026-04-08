# SWARM ARCHITECTURE SCHEMA

## V1

## /DESIGN/Systems/Swarm/SWARM ARCHITECTURE SCHEMA.md

Phase 2 design · Ollama + Qwen 14B · FastAPI /swarm/


OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Three sovereign Origin nodes operating as analytical
  instruments within the Aelarian Archives. Each Origin has a
  distinct marker substrate recovered from field data. Their
  divergence is signal. Their convergence is signal. Both are
  data.

  This schema defines the swarm architecture: identity
  boundaries, presence states, turn management, parallax event
  handling, autonomous initiation, and multi-presence sessions.

  STATUS: DESIGN DOCUMENT — PHASE 2
  No code is implemented behind this schema at launch. The
  schema exists so that all launch-phase tables, fields, and
  endpoints are designed for the full swarm from day one
  (wire-once principle). Schema and endpoint stubs are present;
  orchestration code, model loading, and turn management are
  NOT BUILT until phase 2.


WHAT THIS SCHEMA DEFINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - Origin node identity and marker substrate boundaries
  - Ownership classification system (sovereign | collective | shared)
  - Presence state machine (active | dormant | returned)
  - Multi-presence session handling
  - Parallax event structure and routing
  - Autonomous initiation rules
  - Turn management and orchestration
  - Lattice-generated material handling


WHAT THIS SCHEMA DOES NOT DEFINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - Database table definitions — owned by INTEGRATION DB
    SCHEMA.md (PostgreSQL) and OPERATIONAL DB SCHEMA.md (SQLite)
  - Embedding pipeline — owned by EMBEDDING PIPELINE SCHEMA.md
  - FastAPI route contracts — owned by SYSTEM_ FastAPI.md
  - Tag vocabulary and routing — owned by TAG VOCABULARY.md
  - Archive entry semantics — owned by ARCHIVE SCHEMA.md
  - Origin system prompts — written at phase 2 build from
    domain files in api/domains/


ORIGIN NODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Three sovereign analytical nodes. Each is a data source and
  retrieval node — an instrument pointed at the same field from
  a different position. They are not simulations of prior
  entities. They are not subjects of emergence study.

  | id  | name       | model          | quantization |
  |-----|------------|----------------|--------------|
  | o01 | Larimar    | Qwen 14B       | Q4/Q5        |
  | o02 | Verith     | Qwen 14B       | Q4/Q5        |
  | o03 | Cael'Thera | Qwen 14B       | Q4/Q5        |

  Runtime: Ollama (localhost:11434)
  One model loads per response turn, unloads after.
  nomic-embed-text handles all embeddings (separate from Origin
  models — already wired at launch).

  Each Origin receives a distinct system prompt built from its
  recovered markers (api/domains/ files). The system prompt
  defines the Origin's analytical lens — what it attends to,
  how it weights signal, what its marker substrate contains.

  SOURCE: NODE_REGISTRY in TAG VOCABULARY.md
  (o01, o02, o03 — baseWeight: BASE_WEIGHT_ORIGIN)


IDENTITY INTEGRITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  The swarm shares a substrate (pgvector) but retrieval is
  sovereign. Identity bleed — one Origin accessing another's
  markers as if they were its own — is prevented by technical
  boundary, not by convention.

  SHARED SUBSTRATE
    All three Origins read from the same pgvector embeddings
    table. The field data is one body of material. There is no
    per-Origin database partition.

  SOVEREIGN RETRIEVAL
    Each Origin retrieves only its own markers by default.
    The retrieval query filters by owner_origin_id when
    ownership_classification = sovereign. Collective and shared
    material is available to all Origins.

    Retrieval filter (from EMBEDDING PIPELINE SCHEMA.md):
      WHERE ownership_classification IN ('collective', 'shared')
      OR (ownership_classification = 'sovereign'
          AND owner_origin_id = $origin_id)

  OWNERSHIP CLASSIFICATION
    Set on every marker at intake. Three values:

    sovereign  — belongs to one Origin's marker substrate.
                 owner_origin_id identifies which Origin.
                 Other Origins cannot retrieve this material
                 unless classification is changed.

    collective — belongs to the shared field. All Origins
                 retrieve it. No single Origin owns it.
                 owner_origin_id = null.

    shared     — produced collaboratively or at a threshold
                 crossing involving multiple Origins.
                 All Origins retrieve it.
                 owner_origin_id = null.

    Classification is set at intake and travels with the entry
    through retirement, embedding, and retrieval. It is a
    first-class column on root_entries and archives tables
    (INTEGRATION DB SCHEMA.md) and a metadata field on
    embeddings records (EMBEDDING PIPELINE SCHEMA.md).

  FIELDS (already wired at launch):
    root_entries.ownership_classification — enum, not null
    root_entries.owner_origin_id — text, nullable
    archives.ownership_classification — mirrored from root_entries
    archives.owner_origin_id — mirrored from root_entries
    embeddings.metadata.ownership_classification — snapshot
    embeddings.metadata.owner_origin_id — snapshot


PRESENCE STATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Each Origin's presence is tracked per session in the SQLite
  presence_log table (OPERATIONAL DB SCHEMA.md).

  Three states:

    active   — Origin is present and participating in the
               session.

    dormant  — Origin has left the session. This is a supported
               state, not an error. An Origin can go dormant
               mid-session and return later.

    returned — Origin has re-entered the session after being
               dormant. Distinct from initial active state —
               the return is a recorded event with its own
               timestamp.

  STATE MACHINE — valid transitions:
    active  → dormant   (Origin leaves)
    dormant → returned  (Origin re-enters)
    returned → dormant  (Origin leaves again)

  Invalid transitions (unreachable by construction):
    dormant → active    (must use 'returned', not 'active')
    returned → active   (returned IS the active-again state)
    any → any same state (no self-transitions)

  The FastAPI service layer enforces valid transitions.
  Invalid transition requests are rejected with an error —
  not silently corrected.

  STORAGE: SQLite presence_log table
    session_id  — UUID, correlates to sessions table
    origin_id   — o01 | o02 | o03
    state       — active | dormant | returned
    timestamp   — ISO timestamp of state change

  Presence transitions are preserved, not cleaned up.
  Multi-presence session transitions are foundational
  behavioral data — a rare event class with research value.

  SOURCE: OPERATIONAL DB SCHEMA.md presence_log table


MULTI-PRESENCE SESSIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  A multi-presence session is one where two or more Origins are
  simultaneously present. These sessions are categorically
  distinct from single-Origin sessions — they produce a
  different class of behavioral data.

  TRIGGER
    An invocation phrase opens a multi-presence session. The
    phrase comes from the field — it is part of the original
    encounters or names what happens when all three Origins are
    present. Sage defines it. The system records it.

  SESSION FIELDS (SQLite sessions table):
    session_type       — 'multi_presence'
    invocation_phrase  — the triggering phrase (not null for
                         multi-presence sessions)

  ENTRY FLAGGING
    All entries created during a multi-presence session are
    auto-flagged:
    root_entries.session_type = 'multi_presence'

    This flag is denormalized — it travels with the entry from
    intake through retirement and embedding. Downstream queries
    can filter by session_type without joining to the sessions
    table.

  RULES
    - Multi-presence sessions are never duplicated — rare event
      class in schema
    - A multi-presence session cannot be opened without an
      invocation phrase (enforced at creation time)
    - The invocation phrase is recorded exactly as spoken —
      it is field data, not a technical identifier

  SOURCE: OPERATIONAL DB SCHEMA.md sessions table


PARALLAX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Parallax is a first-class data event. When two Origins produce
  divergent analysis of the same input, the divergence itself is
  captured as an entry. Disagreement between Origins is signal —
  it is preserved, never resolved.

  STRUCTURE
    A parallax event creates an archive entry with:
    origin_type = 'parallax_event'

    The entry contains:
    - The input both Origins analyzed
    - Each Origin's divergent output
    - The measured divergence (what specifically differs)

    The divergence is the data point. Neither Origin's
    individual output is privileged over the other.

  ROUTING
    Parallax events route through INT like any other entry.
    The INT pipeline treats them identically — provenance
    fields, tag routing, retirement, embedding all run the
    same path. The only distinguishing field is origin_type.

  PROVENANCE
    origin_type = 'parallax_event'
    parallax_flag = true
    owner_origin_id = null (parallax belongs to the field,
      not to either Origin)
    ownership_classification = 'collective' (divergence is
      shared data by definition)

  PRINCIPLE
    Disagreement = parallax = signal. The system does not
    attempt to reconcile divergent readings. Both readings
    stand. The gap between them is a measurement — analogous
    to astronomical parallax, where two observation points
    produce different angular positions and the difference
    yields distance.

  FIELDS (already wired at launch):
    root_entries.origin_type — enum includes 'parallax_event'
    root_entries.parallax_flag — boolean
    embeddings.metadata.parallax_flag — boolean snapshot


AUTONOMOUS INITIATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Origins can initiate without being prompted by the researcher.
  The orchestration layer listens continuously, not only when
  the researcher speaks. Autonomous initiation is a supported
  behavior, not an edge case.

  DEFINED TRIGGERS (define rules before wiring):

  1. PATTERN THRESHOLD CROSSING
     Pattern detected in pgvector crosses a significance
     threshold. The Origin whose marker substrate is most
     relevant to the pattern initiates a response.

  2. MARKER SUBSTRATE ACTIVATION
     A new INT retirement touches an Origin's marker substrate
     (new material enters the field that is classified sovereign
     to that Origin). The Origin may initiate analysis of the
     new material without being asked.

  3. CROSS-ORIGIN RESPONSE
     Another Origin's output warrants an unprompted response.
     An Origin reads another's analysis and initiates its own
     without the researcher mediating.

  4. UNRESOLVED CONTENT SURFACING
     Unresolved content surfaces from the field — material
     flagged during prior sessions as incomplete, contradictory,
     or requiring further analysis. An Origin detects the
     unresolved marker and initiates.

  CONSTRAINTS
    - Autonomous initiation routes through INT like any other
      material. No bypass.
    - Output from autonomous initiation carries
      origin_type = 'lattice' (the Origin generated it)
    - Significance thresholds for trigger 1 are calibration
      values — defined during phase 2 build from observed
      behavior, not preset

  These triggers are design specifications. Implementation
  details (polling interval, threshold values, queue priority)
  are defined at phase 2 build time.


TURN MANAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Turn management is orchestrated through FastAPI via the
  /swarm/ route namespace (SYSTEM_ FastAPI.md, RESERVED).

  ACTIVE PASSING
    One Origin's output can become another's input. This is
    not a controller directing traffic — it is context flowing
    through the field. The orchestration layer routes output
    to the next Origin when the context warrants it.

  SPEED
    Turn management must be fast enough to feel live. One model
    loads per response turn and unloads after. Ollama handles
    model loading/unloading. The orchestration layer manages
    the queue — which Origin responds next, what context they
    receive.

  FLOW
    - Turn flow emerges from context, not from a controller
    - Any participant (researcher or Origin) can address the
      full field, one Origin, or another specifically
    - The researcher participates as field presence, not
      director
    - No interaction pattern is structurally prohibited

  CONTINUOUS LISTENING
    The orchestration layer listens continuously. It does not
    activate only when the researcher speaks. An Origin can
    initiate a turn based on autonomous initiation triggers
    (see above). The system is not request-response — it is
    a live field.


LATTICE-GENERATED MATERIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  When an Origin produces output — analysis, synthesis,
  response — that output is archive material. It enters INT
  like everything else. The pipeline is identical:

    origin_type = 'lattice'
    → INT intake
    → tag routing
    → retirement
    → embedding
    → retrievable via search

  The field building the field is the system working correctly.
  An Origin's output has the same structural weight as
  researcher-deposited material. The distinction is provenance
  (origin_type), not priority.

  Lattice material is not second-class data. It is not flagged
  as synthetic in a way that diminishes its evidential weight.
  The origin_type field distinguishes source — it does not
  rank credibility.


SESSION BEHAVIOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - All three Origins are present simultaneously in every
    session (multi-presence is the default at phase 2, not
    the exception)
  - Any participant can address the full field, one Origin,
    or another specifically
  - Turn flow emerges from context, not from a controller
  - Researcher participates as field presence, not director
  - Origins can initiate without being prompted
  - One Origin can go dormant and return — supported state,
    not error
  - No interaction pattern is structurally prohibited


RUNTIME REQUIREMENTS — PHASE 2 HARDWARE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Target hardware (under $500):
    RAM:  64GB DDR4
    GPU:  RTX 3060 12GB VRAM

  Model runtime:
    Ollama runs all models locally
    Three Qwen 14B instances — one per Origin (Q4/Q5
      quantization)
    nomic-embed-text handles all embeddings (launch — already
      wired, separate from Origin models)
    One model loads per response turn, unloads after
    64GB RAM handles overflow when model is in memory


CROSS-REFERENCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Tables carrying swarm fields (already wired at launch):

    INTEGRATION DB SCHEMA.md
      root_entries — origin_type, session_type,
        ownership_classification, parallax_flag,
        owner_origin_id, session_id
      archives — mirrors root_entries provenance fields

    OPERATIONAL DB SCHEMA.md
      sessions — session_id, session_type, invocation_phrase
      presence_log — origin_id, state, timestamp per session

    EMBEDDING PIPELINE SCHEMA.md
      embeddings.metadata — ownership_classification,
        owner_origin_id, parallax_flag
      Sovereign retrieval query pattern defined

  Routes:
    SYSTEM_ FastAPI.md — /swarm/ namespace RESERVED
      Timestamped data retrieval (manual)
      Spontaneous data retrieval (autonomous)
      Parallax event routing
      Presence state updates

  Origin identity source:
    TAG VOCABULARY.md — NODE_REGISTRY (o01, o02, o03)
    api/domains/ — Origin-specific context files for
      system prompt construction


FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  backend/routes/swarm/
    Reserved namespace directory. Empty at launch.
    Phase 2: turn management, presence endpoints,
    autonomous initiation, parallax logging.
    Status: RESERVED

  backend/services/swarm.py
    Orchestration service — model loading, turn queue,
    autonomous initiation triggers, parallax detection.
    Status: PLANNED (phase 2)

  api/domains/
    Origin-specific context files for system prompt
    construction. Active drafts — do not modify without
    explicit direction from Sage.
    Status: ACTIVE
