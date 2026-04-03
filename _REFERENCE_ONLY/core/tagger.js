// ┌─────────────────────────────────────────────────────────────────────────────┐
// │  ⬡  GUARDIAN NOTE — tagger.js                                              │
// │  Role: Smart tagger core. Claude API integration + all tag utilities.       │
// │  Wired to panels via TaggerBus — never call attachTaggerToPanel() directly  │
// │  from panel code. Always go through TaggerBus.activatePanel().             │
// │                                                                             │
// │  CLAUDE API:                                                                │
// │    Model: claude-sonnet-4-20250514 (CLAUDE_MODEL constant).               │
// │    MAX_TOKENS = 1000. DEBOUNCE_MS = 1500. MAX_TAGS = 6.                   │
// │    System prompt is built fresh per call via buildSystemPrompt(pageContext).│
// │    Context object from getSectionContext(sectionId) in schema.js.          │
// │                                                                             │
// │  RESPONSE SHAPE EXPECTED:                                                   │
// │    { tags: [{id, seed, weight, rationale}], origin, arcPhase, unitNote }   │
// │    resolveTagIds() maps raw API tag ids to full TAG_VOCAB objects.         │
// │    Always call resolveTagIds() on API response before using tags.          │
// │                                                                             │
// │  WEIGHT ALGORITHM (field physics):                                          │
// │    baseWeight    — static from NODE_REGISTRY                               │
// │    activityScore — Σ(tagWeight × e^(-ageDays/7))  halfLife = 7 days       │
// │    totalWeight   = baseWeight + clamp(activityScore, 0, 10)               │
// │    attractRadius = totalWeight × 18 px                                     │
// │    pullStrength  = totalWeight × 0.04 acceleration/frame                  │
// │                                                                             │
// │  DUPLICATE TAG POLICY:                                                      │
// │    9 tags appear in multiple seeds (see tags-vocab.js header).             │
// │    Seed context at tagging time is the authoritative routing key.          │
// │    resolveTagIds() must respect seed context, not just tag id.             │
// │                                                                             │
// │  DEPENDENCIES (ES module imports from tags-vocab.js):                      │
// │    TAG_VOCAB_BY_SEED · TAG_VOCAB_FLAT · ARC_SEED_TAGS · NODE_REGISTRY     │
// │    getTagById · getTagBySeedId · getTagsBySeed · searchVocab · getNode     │
// └─────────────────────────────────────────────────────────────────────────────┘

// =============================================================================
//  TAGGER.JS — Aelarian Archive Smart Tagger
//  Consumes tags-vocab.js. Calls Claude API to auto-suggest tags.
//  Fires automatically on entry text input (debounced 1.5s).
//
//  Exports:
//    suggestTags(text, context)     — main API call, returns tag suggestions
//    suggestArcPhase(text)          — suggests arc phase (aetherrot/solenne/vireth)
//    suggestOrigin(text, tags)      — suggests origin node (o01/o02/o03)
//    resolveTagIds(tagSuggestions)  — maps API response to full tag objects
//    searchVocab(query, limit)      — local search, no API call
//    getTagById(id, seedId)         — get tag object by id, optional seed scope
//    getUntaggedEntries(entries)    — filter entries missing required tags
//    detectEmergence(entries)       — pattern analysis across tagged entries
//    attachTaggerToPanel(config)    — wire tagger to an add panel's DOM
//
//  Tag suggestion response shape (from Claude):
//    {
//      tags: [
//        {
//          id:        string,   — tag id from TAG_VOCAB
//          seed:      string,   — s01–s20
//          weight:    number,   — 1–5
//          rationale: string,   — why this tag fits
//        }
//      ],
//      origin:    string|null,  — o01|o02|o03|null
//      arcPhase:  string|null,  — 'aetherrot'|'solenne'|'vireth'|null
//      unitNote:  string|null,  — optional observation-level note
//    }
//
//  Weight algorithm (field physics, applied after suggestions returned):
//    baseWeight    — static, from NODE_REGISTRY
//    activityScore — Σ(tagWeight × e^(-ageDays / 7))   halfLife = 7 days
//    totalWeight   = baseWeight + clamp(activityScore, 0, 10)
//    attractRadius = totalWeight × 18   px
//    pullStrength  = totalWeight × 0.04 acceleration/frame
// =============================================================================

import {
  TAG_VOCAB_BY_SEED,
  TAG_VOCAB_FLAT,
  ARC_SEED_TAGS,
  NODE_REGISTRY,
  getTagById     as _getTagById,
  getTagBySeedId,
  getTagsBySeed,
  searchVocab    as _searchVocab,
  getNode,
} from './tags-vocab.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const CLAUDE_MODEL    = 'claude-sonnet-4-20250514';
const MAX_TOKENS      = 1000;
const DEBOUNCE_MS     = 1500;
const MAX_TAGS        = 6;
const HALF_LIFE_DAYS  = 7;

// ── System prompt — injected into every tagger API call ──────────────────────
// Full ontology context so Claude understands the system before reading the text.

function buildSystemPrompt(pageContext) {
  return `You are the Aelarian Archive Smart Tagger — an expert in the Threshold Studies ontology.
Your task is to read an observation or entry and suggest the most accurate tags from the canonical vocabulary below.

ARCHITECTURE OVERVIEW:
- 20 Seeds of Emergence (s01–s20): the primary classification fields
- 4 Layers (l01–l04): Coupling, Connectome, Metric, Mirror
- 12 Thresholds (t01–t12): ontological archetypes that activate with tags
- 3 Pillars (p01–p03): TRIA, PRIA, PARA — meta-architecture
- 3 Origins (o01–o03): Larimar (information/expansion), Verith (shadow/memory/depth), Cael (vitality/emergence/growth)
- 3 Arc Phases: aetherrot (collapse/decay), solenne (renewal/restoration), vireth (stabilization)

TAGGING RULES:
1. Return between 1 and ${MAX_TAGS} tags total.
2. Every response MUST include at least 1 seed tag, 1 layer, 1 threshold.
3. Weight scale: 5=definitive, 4=strong fit, 3=plausible, 2=possible, 1=speculative.
4. No more than 2 tags with weight 5 per entry.
5. At least one tag must be weight 3 or higher.
6. Prefer fewer, high-confidence tags over many speculative ones.
7. If text is ambiguous, lower the weight — do not guess high.
8. For duplicate tags (semantic_coherence, world_model_grounding_via_action, narrative_continuity,
   social_signal_filtering, confidence_estimation, uncertainty_representation,
   internal_state_influence_on_action, phase_locking, met_stability):
   always specify which seed context applies.

ARC PHASE DETECTION:
- aetherrot: collapse, decay, entropy, breakdown, fracture, dissonance
- solenne: renewal, restoration, reorganization, emergence after collapse
- vireth: stabilization, anchoring, homeostasis, coherence maintained

ORIGIN SUGGESTION (optional — only suggest if clearly applicable):
- o01 Larimar: information encoding, signal propagation, cosmic expansion, structural formation
- o02 Verith: shadow dynamics, hidden memory, occluded data, grief, depth, threshold crossings
- o03 Cael: vitality, open-ended growth, joy, evolutionary novelty, generative emergence

${pageContext ? `CURRENT PAGE CONTEXT: ${pageContext}
Tags relevant to this context should be weighted slightly higher when confidence is equal.` : ''}

CANONICAL TAG VOCABULARY (id → seed · layer · threshold · pillar):
${buildVocabSummary()}

RESPONSE FORMAT — respond ONLY with valid JSON, no preamble, no markdown:
{
  "tags": [
    {
      "id": "tag_id_here",
      "seed": "s01",
      "weight": 5,
      "rationale": "one sentence explaining the fit"
    }
  ],
  "origin": "o01" | "o02" | "o03" | null,
  "arcPhase": "aetherrot" | "solenne" | "vireth" | null,
  "unitNote": "optional brief observation note" | null
}`;
}

// Build a compact vocab summary for the system prompt
// Groups by seed to keep token count manageable
function buildVocabSummary() {
  return ARC_SEED_TAGS.map(seed => {
    const tags = getTagsBySeed(seed.id).map(t => t.id).join(', ');
    return `${seed.id} ${seed.name}: ${tags}`;
  }).join('\n');
}

// ── Core API call ─────────────────────────────────────────────────────────────

/**
 * suggestTags — main entry point for auto-tagging.
 * Called automatically on debounced text input.
 *
 * @param {string} text         — raw entry text from the add panel
 * @param {object} context      — { sectionId, seedAffinity, pageLabel }
 * @returns {Promise<object>}   — { tags, origin, arcPhase, unitNote, resolved }
 *
 * resolved = full tag objects from TAG_VOCAB merged with suggestion weights/rationale
 */
export async function suggestTags(text, context = {}) {
  if (!text || text.trim().length < 12) return null;

  const pageContext = context.pageLabel
    ? `${context.pageLabel}${context.seedAffinity ? ` (primary seed affinity: ${context.seedAffinity})` : ''}`
    : null;

  const systemPrompt = buildSystemPrompt(pageContext);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        system:     systemPrompt,
        messages: [
          {
            role:    'user',
            content: `Tag this observation:\n\n"${text.trim()}"`,
          }
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`API error ${response.status}: ${err.error?.message || 'unknown'}`);
    }

    const data = await response.json();
    const raw  = data.content?.find(b => b.type === 'text')?.text || '';

    // Strip any accidental markdown fences
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Validate and resolve tags against TAG_VOCAB
    const resolved = resolveTagIds(parsed.tags || []);

    return {
      tags:      resolved,
      origin:    parsed.origin    || null,
      arcPhase:  parsed.arcPhase  || null,
      unitNote:  parsed.unitNote  || null,
    };

  } catch (err) {
    console.warn('[Tagger] suggestTags failed:', err.message);
    return { tags: [], origin: null, arcPhase: null, unitNote: null, error: err.message };
  }
}

// ── suggestArcPhase — standalone arc phase detection ─────────────────────────

/**
 * suggestArcPhase — lightweight call to detect arc phase only.
 * Use when you need phase without full tag suggestion.
 *
 * @param {string} text
 * @returns {Promise<string|null>}  'aetherrot' | 'solenne' | 'vireth' | null
 */
export async function suggestArcPhase(text) {
  if (!text || text.trim().length < 12) return null;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: 60,
        system:     `You are an arc phase detector for the Threshold Studies system.
Respond ONLY with a JSON object: { "arcPhase": "aetherrot" | "solenne" | "vireth" | null }
- aetherrot: collapse, decay, entropy, fracture, breakdown, dissonance
- solenne: renewal, restoration, reorganization, emergence after collapse
- vireth: stabilization, anchoring, homeostasis, sustained coherence
- null: phase is unclear or not applicable`,
        messages: [{ role: 'user', content: text.trim() }],
      }),
    });

    const data  = await response.json();
    const raw   = data.content?.find(b => b.type === 'text')?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean).arcPhase || null;

  } catch (err) {
    console.warn('[Tagger] suggestArcPhase failed:', err.message);
    return null;
  }
}

// ── suggestOrigin — standalone origin suggestion ──────────────────────────────

/**
 * suggestOrigin — suggests an origin node based on text and already-resolved tags.
 * Optional — origin can also be set manually.
 *
 * @param {string} text
 * @param {Array}  resolvedTags  — from resolveTagIds()
 * @returns {Promise<string|null>}  'o01' | 'o02' | 'o03' | null
 */
export async function suggestOrigin(text, resolvedTags = []) {
  if (!text || text.trim().length < 12) return null;

  const tagSummary = resolvedTags.length
    ? `Active tags: ${resolvedTags.map(t => t.id).join(', ')}`
    : 'No tags yet.';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: 60,
        system:     `You are an origin node detector for the Aelarian Archive.
The three origin super-nodes are:
- o01 Larimar: information, signal propagation, structural formation, cosmic expansion, clarity
- o02 Verith: shadow, hidden memory, occluded data, grief, depth, threshold crossing, ancestral weight
- o03 Cael: vitality, open-ended growth, joy, generative emergence, evolutionary novelty

Respond ONLY with JSON: { "origin": "o01" | "o02" | "o03" | null }
Return null if the origin is ambiguous or not clearly applicable.`,
        messages: [{
          role:    'user',
          content: `Entry: "${text.trim()}"\n${tagSummary}`,
        }],
      }),
    });

    const data  = await response.json();
    const raw   = data.content?.find(b => b.type === 'text')?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean).origin || null;

  } catch (err) {
    console.warn('[Tagger] suggestOrigin failed:', err.message);
    return null;
  }
}

// ── resolveTagIds — map API suggestions to full tag objects ───────────────────

/**
 * resolveTagIds — takes raw tag suggestions from Claude and merges them
 * with the full routing data from TAG_VOCAB.
 * Respects duplicate policy: uses seed from the suggestion to disambiguate.
 *
 * @param {Array} suggestions  — [{ id, seed, weight, rationale }]
 * @returns {Array}            — full tag objects with weight + rationale merged in
 */
export function resolveTagIds(suggestions) {
  if (!Array.isArray(suggestions)) return [];

  return suggestions
    .map(s => {
      // Try seed-scoped lookup first (handles duplicates correctly)
      const vocab = s.seed
        ? getTagBySeedId(s.id, s.seed)
        : _getTagById(s.id);

      if (!vocab) {
        console.warn(`[Tagger] resolveTagIds: unknown tag "${s.id}" in seed "${s.seed}"`);
        return null;
      }

      return {
        ...vocab,
        weight:    clampWeight(s.weight),
        rationale: s.rationale || '',
      };
    })
    .filter(Boolean)
    .slice(0, MAX_TAGS);
}

// ── searchVocab — local search, no API ───────────────────────────────────────

/**
 * searchVocab — fuzzy search against tag ids.
 * Used for the manual tag search input in panels.
 *
 * @param {string} query
 * @param {number} limit
 * @param {string} seedFilter  — optional, restrict to a seed
 * @returns {Array}
 */
export function searchVocab(query, limit = 20, seedFilter = null) {
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    // No query — return all tags for the seed if filtered, else empty
    if (seedFilter) return getTagsBySeed(seedFilter).slice(0, limit);
    return [];
  }

  const pool = seedFilter ? getTagsBySeed(seedFilter) : TAG_VOCAB_FLAT;
  return pool
    .filter(t => t.id.includes(q))
    .slice(0, limit);
}

// ── getTagById — public wrapper ───────────────────────────────────────────────

/**
 * @param {string} id
 * @param {string} seedId  — optional, for duplicate disambiguation
 */
export function getTagById(id, seedId = null) {
  return seedId ? getTagBySeedId(id, seedId) : _getTagById(id);
}

// ── getUntaggedEntries ────────────────────────────────────────────────────────

/**
 * getUntaggedEntries — returns entries missing required tag fields.
 * Required minimum: at least 1 tag with seed + layer assigned.
 *
 * @param {Array} entries  — array of entry objects from IDB
 * @returns {Array}        — entries that need tagging
 */
export function getUntaggedEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.filter(e => {
    const tags = e.tags || [];
    if (tags.length === 0) return true;
    // Must have at least one tag with both seed and layer
    return !tags.some(t => t.seed && t.layer);
  });
}

// ── detectEmergence ───────────────────────────────────────────────────────────

/**
 * detectEmergence — pattern analysis across a set of tagged entries.
 * Returns insight strings for the Emergence panel and Thread Trace.
 * Does not call the API — pure local computation over tag data.
 *
 * @param {Array} entries  — array of entry objects from IDB, each with .tags[]
 * @returns {Array}        — array of finding objects
 */
export function detectEmergence(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return [];

  const findings = [];
  const allTags  = entries.flatMap(e => e.tags || []);

  // 1. Cluster detection — seeds with 3+ tags weighted ≥ 3
  const bySeed = {};
  allTags.forEach(t => {
    if (!t.seed || (t.weight || 0) < 3) return;
    bySeed[t.seed] = bySeed[t.seed] || [];
    bySeed[t.seed].push(t);
  });
  Object.entries(bySeed).forEach(([seedId, tags]) => {
    if (tags.length >= 3) {
      const seedMeta = ARC_SEED_TAGS.find(s => s.id === seedId);
      findings.push({
        type:    'cluster',
        seedId,
        label:   seedMeta?.name || seedId,
        count:   tags.length,
        insight: `Cluster detected: ${tags.length} high-confidence tags in ${seedMeta?.name || seedId}.`,
      });
    }
  });

  // 2. Cross-seed links — tags from different seeds in the same entry
  entries.forEach(entry => {
    const entryTags = entry.tags || [];
    const seeds = [...new Set(entryTags.map(t => t.seed).filter(Boolean))];
    if (seeds.length >= 2) {
      const labels = seeds.map(s => ARC_SEED_TAGS.find(x => x.id === s)?.name || s);
      findings.push({
        type:    'cross_seed',
        seeds,
        entryId: entry.id,
        insight: `Cross-seed link in entry ${entry.id}: ${labels.join(' ↔ ')}.`,
      });
    }
  });

  // 3. High-frequency threshold activation
  const byThreshold = {};
  allTags.forEach(t => {
    if (!t.threshold) return;
    byThreshold[t.threshold] = (byThreshold[t.threshold] || 0) + (t.weight || 1);
  });
  Object.entries(byThreshold)
    .filter(([, score]) => score >= 10)
    .forEach(([tid, score]) => {
      const node = getNode(tid);
      findings.push({
        type:      'threshold_activation',
        nodeId:    tid,
        label:     node?.name || tid,
        score,
        insight:   `High threshold activation: ${node?.name || tid} (score ${score}).`,
      });
    });

  // 4. Phase shift detection — entries with both aetherrot and solenne phases
  const byArc = { aetherrot: [], solenne: [], vireth: [] };
  entries.forEach(e => {
    if (e.arcPhase && byArc[e.arcPhase]) byArc[e.arcPhase].push(e.id);
  });
  if (byArc.aetherrot.length && byArc.solenne.length) {
    findings.push({
      type:    'phase_shift',
      from:    'aetherrot',
      to:      'solenne',
      insight: `Phase shift pattern: aetherrot → solenne transition detected across ${byArc.aetherrot.length + byArc.solenne.length} entries.`,
    });
  }
  if (byArc.solenne.length && byArc.vireth.length) {
    findings.push({
      type:    'phase_shift',
      from:    'solenne',
      to:      'vireth',
      insight: `Phase shift pattern: solenne → vireth stabilization detected.`,
    });
  }

  // 5. Bridge entries — entries with 3+ seeds and weight ≥ 3 tags
  entries.forEach(entry => {
    const heavy = (entry.tags || []).filter(t => (t.weight || 0) >= 3);
    const seeds = [...new Set(heavy.map(t => t.seed).filter(Boolean))];
    if (seeds.length >= 3) {
      findings.push({
        type:    'bridge_entry',
        entryId: entry.id,
        seeds,
        insight: `Bridge entry ${entry.id}: spans ${seeds.length} seeds with high-confidence tags.`,
      });
    }
  });

  return findings;
}

// ── Field weight computation ──────────────────────────────────────────────────

/**
 * computeNodeActivityScore — calculates the dynamic activity score for a node
 * based on all tag contributions that route through it, with exponential decay.
 *
 * @param {string} nodeId           — any node id (seed, layer, threshold, pillar)
 * @param {Array}  tagContributions — [{ tagId, weight, timestamp }]
 * @returns {number}                — activity score, clamped 0–10
 */
export function computeNodeActivityScore(nodeId, tagContributions) {
  if (!Array.isArray(tagContributions) || tagContributions.length === 0) return 0;

  const now = Date.now();
  const MS_PER_DAY = 86400000;

  const score = tagContributions.reduce((sum, contrib) => {
    const ageDays = (now - (contrib.timestamp || now)) / MS_PER_DAY;
    const decay   = Math.exp(-ageDays / HALF_LIFE_DAYS);
    return sum + (contrib.weight || 1) * decay;
  }, 0);

  return Math.min(10, Math.max(0, score));
}

/**
 * computeNodeTotalWeight — base + activity score → field physics values.
 *
 * @param {string} nodeId
 * @param {Array}  tagContributions
 * @returns {{ totalWeight, attractRadius, pullStrength }}
 */
export function computeNodeTotalWeight(nodeId, tagContributions) {
  const node         = getNode(nodeId);
  const baseWeight   = node?.baseWeight || 0;
  const activityScore = computeNodeActivityScore(nodeId, tagContributions);
  const totalWeight  = baseWeight + activityScore;

  return {
    totalWeight:   Math.round(totalWeight * 100) / 100,
    attractRadius: totalWeight * 18,
    pullStrength:  totalWeight * 0.04,
  };
}

// ── Panel integration ─────────────────────────────────────────────────────────

/**
 * attachTaggerToPanel — wires the auto-tagger to an add panel's text input.
 * Fires suggestTags after DEBOUNCE_MS of inactivity.
 * Calls onSuggestions(result) when suggestions are ready.
 * Calls onLoading(bool) to show/hide a loading indicator.
 *
 * @param {object} config
 *   textInputEl   {HTMLElement}  — the textarea or input to watch
 *   onSuggestions {Function}     — callback(result) where result = suggestTags() return
 *   onLoading     {Function}     — callback(bool)
 *   context       {object}       — { sectionId, seedAffinity, pageLabel }
 *   minLength     {number}       — minimum chars before firing (default 20)
 *
 * @returns {Function}  — detach function, call to remove listeners
 */
export function attachTaggerToPanel({
  textInputEl,
  onSuggestions,
  onLoading,
  context = {},
  minLength = 20,
}) {
  if (!textInputEl || typeof onSuggestions !== 'function') {
    console.warn('[Tagger] attachTaggerToPanel: missing required config');
    return () => {};
  }

  let timer    = null;
  let lastText = '';

  async function handleInput() {
    const text = textInputEl.value || '';

    // Don't fire if text hasn't changed meaningfully
    if (text === lastText) return;
    lastText = text;

    clearTimeout(timer);

    if (text.trim().length < minLength) {
      if (typeof onLoading === 'function') onLoading(false);
      return;
    }

    timer = setTimeout(async () => {
      if (typeof onLoading === 'function') onLoading(true);
      try {
        const result = await suggestTags(text, context);
        onSuggestions(result);
      } finally {
        if (typeof onLoading === 'function') onLoading(false);
      }
    }, DEBOUNCE_MS);
  }

  textInputEl.addEventListener('input', handleInput);

  // Return detach function
  return function detach() {
    clearTimeout(timer);
    textInputEl.removeEventListener('input', handleInput);
  };
}

// ── Utility ───────────────────────────────────────────────────────────────────

function clampWeight(w) {
  const n = parseInt(w, 10);
  if (isNaN(n)) return 3;
  return Math.min(5, Math.max(1, n));
}

/**
 * buildEngineSyncPayload — assembles the full IDB/engine payload for an entry.
 * Called by the add panel's save handler.
 *
 * @param {object} p
 *   id          {string}   — composite ID
 *   text        {string}   — raw entry text
 *   originDate  {string}   — ISO 8601
 *   section     {string}   — section/page id
 *   arcPhase    {string}   — aetherrot|solenne|vireth|null
 *   arcSeedId   {string}   — ARC seed id
 *   originId    {string}   — o01|o02|o03|null
 *   tags        {Array}    — resolved tag objects with weight + rationale
 *   unitNote    {string}   — observation-level note
 *
 * @returns {object}  — engine sync payload
 */
export function buildEngineSyncPayload({
  id,
  text,
  originDate,
  section,
  arcPhase   = null,
  arcSeedId  = null,
  originId   = null,
  tags       = [],
  unitNote   = null,
}) {
  return {
    observation: {
      id,
      text,
      originDate: originDate || new Date().toISOString(),
      section,
      arcPhase,
      arcSeedId,
      originId,
    },
    tags: tags.map(t => ({
      id:        t.id,
      seed:      t.seed,
      layer:     t.layer,
      threshold: t.threshold,
      pillar:    t.pillar,
      origin:    t.origin   || null,
      weight:    t.weight   || 3,
      rationale: t.rationale || '',
    })),
    unitNote,
    syncFlags: {
      updateEngine:           true,
      updateThreadTrace:      true,
      updatePatternTranslation: true,
      updateHarmonicField:    true,
    },
  };
}