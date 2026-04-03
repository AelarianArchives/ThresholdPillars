// ┌─────────────────────────────────────────────────────────────────────────────┐
// │  ⬡  GUARDIAN NOTE — data.js                                                │
// │  Role: Single source of truth for ALL IDB operations. No raw IDB calls     │
// │  anywhere else in the codebase. Everything reads/writes through this file.  │
// │                                                                             │
// │  CURRENT DB VERSION: 8 (March 2026)                                        │
// │  NEXT VERSION MUST: increment DB_VERSION to 9, add new onupgradeneeded     │
// │    block — NEVER skip version numbers or merge migrations.                  │
// │                                                                             │
// │  STORES (v8 complete):                                                      │
// │    concepts · facets · entries · relations · tags · ts_sequence            │
// │    tagger_feedback · id_tombstones · id_page_codes · id_phase_codes        │
// │    saved_threads · thread_annotations                                       │
// │    nexus_hypotheses · nexus_drift_events · nexus_grades · nexus_event_log  │
// │                                                                             │
// │  SEQUENCE COUNTER RULE:                                                     │
// │    getNextSequence() — call ONLY on confirmed Save. Never on preview.       │
// │    Sequence numbers are permanently retired on delete. Never reused.        │
// │    peekSequence() for read-only display.                                    │
// │                                                                             │
// │  COMPOSITE ID RULE:                                                         │
// │    buildCompositeId()   — async, only on Save. Locks global sequence.      │
// │    buildParentId()      — async, only on Save. Source document intake.     │
// │                           SEQ = Integration section entry count + 1.       │
// │                           Returns { stamp, arcCode }.                      │
// │    buildChildId()       — async, only on confirmed deposit.                │
// │                           SEQ = target section entry count + 1.            │
// │                           Appends · root:[parentId] to stamp.              │
// │    previewCompositeId() — sync, safe on every keystroke. Seq = '——'.      │
// │    arcCode stored on entry.arcCode. NEVER part of visible stamp.           │
// │                                                                             │
// │  THREAD TRACE STORES:                                                       │
// │    thread_trace_db.js piggybacks on this DB connection.                    │
// │    REQUIRED_VERSION in thread_trace_db.js must match DB_VERSION here.      │
// │    Always coordinate store additions between both files.                    │
// │                                                                             │
// │  SOFT DELETE PATTERN:                                                       │
// │    Never hard-delete entries. Use is_deleted flag + createTombstone().      │
// │    Legacy records without is_deleted pass getEntries() filters safely.      │
// └─────────────────────────────────────────────────────────────────────────────┘

/**
 * AELARIAN ARCHIVE — DATA MANAGER
 * 
 * Single source of truth for all storage operations.
 * IndexedDB = working cache (fast, browser-native)
 * JSON export = the real database (portable, survives everything)
 * 
 * STORES:
 *   concepts    — global concept nodes (Category level)
 *   facets      — layer-specific expressions (4 per concept)
 *   entries     — all archive entries (sessions, lexicon, longforms, etc.)
 *   relations   — explicit graph edges between any two nodes
 *   tags        — free tags attached to entries
 *   ts_sequence — global sequence counter for Composite ID (single record)
 * 
 * RULE: Never write raw IndexedDB calls outside this file.
 */

import { newConceptId, newFacetId, newEntryId, newRelId, normalizeHash } from './ids.js';
import {
  LAYERS, RELATION_TYPES, INVERSE_VECTOR_MAP,
  PAGE_CODES, PHASE_CODES_SEED, PAGE_CODES_SEED,
  assembleId,  // resolveThresholdCode retired — removed from import
} from './schema.js';
import { TAG_VOCAB } from './tags-vocab.js';

const DB_NAME    = 'AelarianArchive';
const DB_VERSION = 8;

// ⚠️  IDB TRANSACTION SAFETY RULE — NON-NEGOTIABLE
// IDB transactions auto-commit the moment the JS call stack goes idle.
// NEVER await a non-IDB operation inside an open transaction.
// Awaiting fetch(), setTimeout(), or any Promise that isn't a direct
// IDB request will silently close the transaction and corrupt writes.
// Pattern: complete all IDB reads/writes first, then do async work outside.
// This rule applies to every function in this file, forever.

let _db = null;

// ── INIT ──────────────────────────────────────────────────────────────────────

export async function initDB() {
  if (_db) return _db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db  = e.target.result;
      const old = e.oldVersion;

      // ── Fresh install (v0 → v2) ───────────────────────────────────────────
      if (old < 1) {
        // Concepts store
        const concepts = db.createObjectStore('concepts', { keyPath: 'id' });
        concepts.createIndex('label', 'label', { unique: false });

        // Facets store
        const facets = db.createObjectStore('facets', { keyPath: 'id' });
        facets.createIndex('conceptId', 'conceptId', { unique: false });
        facets.createIndex('layer',     'layer',     { unique: false });

        // Entries store
        const entries = db.createObjectStore('entries', { keyPath: 'id' });
        entries.createIndex('section',     'section',     { unique: false });
        entries.createIndex('type',        'type',        { unique: false });
        entries.createIndex('status',      'status',      { unique: false });
        entries.createIndex('originDate',  'originDate',  { unique: false });
        entries.createIndex('createdAt',   'createdAt',   { unique: false });
        entries.createIndex('hash',        'hash',        { unique: false });
        entries.createIndex('arcSeedId',   'arcSeedId',   { unique: false });
        entries.createIndex('is_deleted',  'is_deleted',  { unique: false });

        // Relations store
        const relations = db.createObjectStore('relations', { keyPath: 'id' });
        relations.createIndex('fromId',       'fromId',       { unique: false });
        relations.createIndex('toId',         'toId',         { unique: false });
        relations.createIndex('relationType', 'relationType', { unique: false });
        relations.createIndex('is_deleted',   'is_deleted',   { unique: false });

        // Tags store (global tag registry)
        const tags = db.createObjectStore('tags', { keyPath: 'id' });
        tags.createIndex('label',    'label',    { unique: false });
        tags.createIndex('category', 'category', { unique: false });
        tags.createIndex('layer',    'layer',    { unique: false });

        // ts_sequence store — global sequence counter for Composite ID
        // Single record: { key: 'seq', val: 0 }
        db.createObjectStore('ts_sequence', { keyPath: 'key' });
      }

      // ── v1 → v2 migration: add is_deleted index to existing stores ────────
      if (old >= 1 && old < 2) {
        const entriesStore   = e.target.transaction.objectStore('entries');
        const relationsStore = e.target.transaction.objectStore('relations');
        if (!entriesStore.indexNames.contains('is_deleted')) {
          entriesStore.createIndex('is_deleted', 'is_deleted', { unique: false });
        }
        if (!relationsStore.indexNames.contains('is_deleted')) {
          relationsStore.createIndex('is_deleted', 'is_deleted', { unique: false });
        }
        // Backfill note: IDB upgrade transactions auto-commit before async Promises
        // resolve, so a cursor-based backfill via Promise.all silently does nothing.
        // Pre-v2 records without is_deleted are safe — getEntries() and getRelationsFor()
        // filter on !e.is_deleted and !undefined === true, so they pass through correctly.
        // The is_deleted index simply won't cover legacy records. Acceptable tradeoff.
      }

      // ── v2 → v3 migration: add ts_sequence store ─────────────────────
      if (old >= 1 && old < 3) {
        if (!db.objectStoreNames.contains('ts_sequence')) {
          db.createObjectStore('ts_sequence', { keyPath: 'key' });
        }
      }

      // ── v3 → v4 migration: add tagger_feedback store ─────────────────────
      // Separate from entry data. Used by smart tagger for session context
      // and long-term accuracy improvement. Never mixed with corpus entries.
      if (old < 4) {
        if (!db.objectStoreNames.contains('tagger_feedback')) {
          const feedback = db.createObjectStore('tagger_feedback', { keyPath: 'id' });
          feedback.createIndex('sectionId', 'sectionId', { unique: false });
          feedback.createIndex('tagId',     'tagId',     { unique: false });
          feedback.createIndex('action',    'action',    { unique: false });
          feedback.createIndex('timestamp', 'timestamp', { unique: false });
          feedback.createIndex('sessionId', 'sessionId', { unique: false });
        }
      }

      // ── v4 → v5 migration: add compositeId index to entries ──────────────
      if (old < 5) {
        const entriesStore = e.target.transaction.objectStore('entries');
        if (!entriesStore.indexNames.contains('compositeId')) {
          entriesStore.createIndex('compositeId', 'compositeId', { unique: false });
        }
      }

      // ── v5 → v6 migration: tombstones + ID lookup tables ─────────────────
      // id_tombstones: permanent record of deleted entry IDs
      // id_page_codes: DB-backed lookup for page code → section mapping
      // id_phase_codes: DB-backed lookup for phase name → code mapping
      if (old < 6) {
        if (!db.objectStoreNames.contains('id_tombstones')) {
          const tombs = db.createObjectStore('id_tombstones', { keyPath: 'compositeId' });
          tombs.createIndex('sectionId',   'sectionId',   { unique: false });
          tombs.createIndex('deletedAt',   'deletedAt',   { unique: false });
          tombs.createIndex('entryKind',   'entryKind',   { unique: false });
        }
        if (!db.objectStoreNames.contains('id_page_codes')) {
          db.createObjectStore('id_page_codes', { keyPath: 'sectionId' });
        }
        if (!db.objectStoreNames.contains('id_phase_codes')) {
          db.createObjectStore('id_phase_codes', { keyPath: 'code' });
        }
        // Entries store: add arcCode and entryKind indexes
        // arcCode index retained for DB upgrade compatibility — field retired March 2026,
        // no longer populated. Index stays dormant. Do not remove from migration.
        const entriesStore = e.target.transaction.objectStore('entries');
        if (!entriesStore.indexNames.contains('arcCode')) {
          entriesStore.createIndex('arcCode',   'arcCode',   { unique: false });
        }
        if (!entriesStore.indexNames.contains('entryKind')) {
          entriesStore.createIndex('entryKind', 'entryKind', { unique: false });
        }
      }

      // ── v6 → v7 migration: thread trace stores ───────────────────────────
      // saved_threads: persisted thread records (name, seed, entry_ids, annotations)
      // thread_annotations: per-thread annotations with filter snapshots
      if (old < 7) {
        if (!db.objectStoreNames.contains('saved_threads')) {
          const threads = db.createObjectStore('saved_threads', { keyPath: 'id' });
          threads.createIndex('thread_type',   'thread_type',   { unique: false });
          threads.createIndex('last_accessed', 'last_accessed', { unique: false });
          threads.createIndex('is_deleted',    'is_deleted',    { unique: false });
        }
        if (!db.objectStoreNames.contains('thread_annotations')) {
          const ann = db.createObjectStore('thread_annotations', { keyPath: 'id' });
          ann.createIndex('thread_id', 'thread_id', { unique: false });
          ann.createIndex('timestamp', 'timestamp', { unique: false });
        }
      }

      // ── v7 → v8 migration: Nexus persistence layer ───────────────────────
      //
      // Four stores forming the complete Nexus data architecture:
      //
      // nexus_hypotheses  — PCV: cross-domain patterns from Emergence.js,
      //                     held as testable hypotheses with full provenance.
      //                     Source: emergence.js detector output.
      //
      // nexus_drift_events — DTX: live drift classifications with trajectory
      //                      states and Bayesian probability vectors. Receives
      //                      input from PCV state vectors. Updates from SGR.
      //
      // nexus_grades       — SGR: evidence-locked signal grades with score
      //                      vectors [Impact|Resonance|Predictive|Stability],
      //                      tier assignment, rationale, and revision history.
      //                      Post-hoc only — never graded before outcomes exist.
      //
      // nexus_event_log    — Immutable append-only audit record. Every state
      //                      change across hypotheses, drift events, and grades
      //                      is logged here. Nothing ever overwrites a log entry.
      //                      This is the provenance chain for all Nexus data.
      //
      if (old < 8) {

        // nexus_hypotheses — PCV deposit records
        if (!db.objectStoreNames.contains('nexus_hypotheses')) {
          const hyp = db.createObjectStore('nexus_hypotheses', { keyPath: 'id' });
          hyp.createIndex('hypId',           'hypId',           { unique: true  });
          hyp.createIndex('findingType',     'findingType',     { unique: false });
          hyp.createIndex('status',          'status',          { unique: false });
          hyp.createIndex('sessionDetected', 'sessionDetected', { unique: false });
          hyp.createIndex('timestamp',       'timestamp',       { unique: false });
          hyp.createIndex('originPillar',    'originPillar',    { unique: false });
        }

        // nexus_drift_events — DTX classification records
        if (!db.objectStoreNames.contains('nexus_drift_events')) {
          const drift = db.createObjectStore('nexus_drift_events', { keyPath: 'id' });
          drift.createIndex('driftId',          'driftId',          { unique: true  });
          drift.createIndex('hypId',            'hypId',            { unique: false });
          drift.createIndex('initiationSource', 'initiationSource', { unique: false });
          drift.createIndex('trajectoryState',  'trajectoryState',  { unique: false });
          drift.createIndex('thresholdLevel',   'thresholdLevel',   { unique: false });
          drift.createIndex('sessionDetected',  'sessionDetected',  { unique: false });
          drift.createIndex('resolvedAt',       'resolvedAt',       { unique: false });
          drift.createIndex('timestamp',        'timestamp',        { unique: false });
        }

        // nexus_grades — SGR evidence-locked grade records
        if (!db.objectStoreNames.contains('nexus_grades')) {
          const grades = db.createObjectStore('nexus_grades', { keyPath: 'id' });
          grades.createIndex('gradeId',          'gradeId',          { unique: true  });
          grades.createIndex('hypId',            'hypId',            { unique: false });
          grades.createIndex('driftId',          'driftId',          { unique: false });
          grades.createIndex('tier',             'tier',             { unique: false });
          grades.createIndex('status',           'status',           { unique: false });
          grades.createIndex('sessionDetected',  'sessionDetected',  { unique: false });
          grades.createIndex('sessionValidated', 'sessionValidated', { unique: false });
          grades.createIndex('timestamp',        'timestamp',        { unique: false });
        }

        // nexus_event_log — immutable append-only provenance log
        // RULE: putNexusLogEntry() only. Never update or delete records here.
        if (!db.objectStoreNames.contains('nexus_event_log')) {
          const log = db.createObjectStore('nexus_event_log', { keyPath: 'id' });
          log.createIndex('entityType', 'entityType', { unique: false });
          log.createIndex('entityId',   'entityId',   { unique: false });
          log.createIndex('action',     'action',     { unique: false });
          log.createIndex('timestamp',  'timestamp',  { unique: false });
          log.createIndex('sessionId',  'sessionId',  { unique: false });
        }
      }
    };

    req.onsuccess = async (e) => {
      _db = e.target.result;
      console.log('[DataManager] DB ready — version', DB_VERSION);
      // Seed lookup tables if empty (idempotent — safe to run every init)
      await _seedLookupTables();
      resolve(_db);
    };

    req.onerror = (e) => {
      console.error('[DataManager] DB error', e.target.error);
      reject(e.target.error);
    };
  });
}

// ── GENERIC CRUD ──────────────────────────────────────────────────────────────

function tx(store, mode = 'readonly') {
  return _db.transaction(store, mode).objectStore(store);
}

// ── LOOKUP TABLE SEEDING ──────────────────────────────────────────────────────
// Populates id_page_codes and id_phase_codes from schema constants.
// Runs on every initDB — only writes records that don't already exist (idempotent).
async function _seedLookupTables() {
  try {
    // Seed page codes
    const existingPages = await new Promise((res, rej) => {
      const r = tx('id_page_codes').getAll();
      r.onsuccess = () => res(r.result);
      r.onerror   = () => rej(r.error);
    });
    if (existingPages.length === 0) {
      const pageStore = _db.transaction('id_page_codes', 'readwrite').objectStore('id_page_codes');
      for (const rec of PAGE_CODES_SEED) {
        pageStore.put(rec);
      }
      console.log('[DataManager] id_page_codes seeded:', PAGE_CODES_SEED.length, 'entries');
    }

    // Seed phase codes
    const existingPhases = await new Promise((res, rej) => {
      const r = tx('id_phase_codes').getAll();
      r.onsuccess = () => res(r.result);
      r.onerror   = () => rej(r.error);
    });
    if (existingPhases.length === 0) {
      const phaseStore = _db.transaction('id_phase_codes', 'readwrite').objectStore('id_phase_codes');
      for (const rec of PHASE_CODES_SEED) {
        phaseStore.put(rec);
      }
      console.log('[DataManager] id_phase_codes seeded:', PHASE_CODES_SEED.length, 'entries');
    }
  } catch (err) {
    console.warn('[DataManager] lookup table seeding failed:', err.message);
  }
}

export function getAll(storeName) {
  return new Promise((resolve, reject) => {
    const req = tx(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export function getById(storeName, id) {
  return new Promise((resolve, reject) => {
    const req = tx(storeName).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror   = () => reject(req.error);
  });
}

export function getByIndex(storeName, indexName, value) {
  return new Promise((resolve, reject) => {
    const req = tx(storeName).index(indexName).getAll(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export function putRecord(storeName, record) {
  return new Promise((resolve, reject) => {
    const req = tx(storeName, 'readwrite').put(record);
    req.onsuccess = () => resolve(record);
    req.onerror   = () => reject(req.error);
  });
}

export function deleteRecord(storeName, id) {
  return new Promise((resolve, reject) => {
    const req = tx(storeName, 'readwrite').delete(id);
    req.onsuccess = () => resolve(id);
    req.onerror   = () => reject(req.error);
  });
}

// ── ENTRIES ACCESSOR (soft-delete aware) ──────────────────────────────────────
// Default: excludes tombstoned entries. Pass { includeDeleted: true } for audit/restore UI.
export async function getEntries({ includeDeleted = false } = {}) {
  const all = await getAll('entries');
  return includeDeleted ? all : all.filter(e => !e.is_deleted);
}

// ── CONCEPTS ──────────────────────────────────────────────────────────────────

export async function createConcept({ label, description = '', category = '' }) {
  const concept = {
    id:          newConceptId(),
    label,
    description,
    category,
    createdAt:   new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };
  await putRecord('concepts', concept);

  // Auto-create all 4 layer facets
  for (const layer of LAYERS) {
    await createFacet({
      conceptId:   concept.id,
      layer,
      description: '',
    });
  }

  return concept;
}

export async function updateConcept(id, updates) {
  const concept = await getById('concepts', id);
  if (!concept) throw new Error(`Concept not found: ${id}`);
  const updated = { ...concept, ...updates, lastModified: new Date().toISOString() };
  return putRecord('concepts', updated);
}

export async function deleteConcept(id) {
  // Cascade: delete facets
  const facets = await getByIndex('facets', 'conceptId', id);
  for (const f of facets) await deleteRecord('facets', f.id);
  // Cascade: delete relations
  const allRels = await getAll('relations');
  for (const r of allRels) {
    if (r.fromId === id || r.toId === id) await deleteRecord('relations', r.id);
  }
  return deleteRecord('concepts', id);
}

// ── FACETS ────────────────────────────────────────────────────────────────────

export async function createFacet({ conceptId, layer, description = '' }) {
  if (!LAYERS.includes(layer))
    throw new Error(`Invalid layer: "${layer}". Must be one of: ${LAYERS.join(', ')}`);
  const facet = {
    id:          newFacetId(),
    conceptId,
    layer,
    description,
    createdAt:   new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };
  return putRecord('facets', facet);
}

export async function getFacetsForConcept(conceptId) {
  return getByIndex('facets', 'conceptId', conceptId);
}

// ── ENTRIES ───────────────────────────────────────────────────────────────────

export async function createEntry({
  section,
  type           = 'note',
  title          = '',
  body           = '',
  speaker        = '',
  status         = 'draft',
  originDate     = null,
  phaseCode      = null,   // lifecycle phase for composite ID (e.g. 'EMG') — distinct from arcPhase
  timeframeStart = null,
  timeframeEnd   = null,
  arcSeedId      = null,
  arcPhase       = null,       // phase state tag (aetherrot|solenne|vireth — ontological state from tagger)
  layerIds       = [],         // resonance field layers this entry touches (Coupling/Connectome/MetricField/MirrorField)
  witness        = null,       // structured Witness Scroll object
  facetIds       = [],
  tagIds         = [],
  crossLinks     = [],         // [{toId, relationType}]
  presence       = '',
  metadata       = {},
}) {
  // Duplicate detection
  const hashKey = normalizeHash(title + body);
  const existing = (await getByIndex('entries', 'hash', hashKey))
    .filter(e => !e.is_deleted);
  if (existing.length > 0) {
    return { duplicate: true, existing: existing[0] };
  }

  // ── entryKind — single-char semantic flag for AI/export disambiguation ────
  // 'L' = lexicon/defined term, 'O' = field observation (default)
  // Stored in DB only — never part of the visible composite ID stamp.
  // Lexicon entries also always get phaseCode 'NUL' (not null) per spec.
  const resolvedEntryKind = type === 'lexicon' || type === 'conlang' ? 'L' : 'O';
  const resolvedPhaseCode = resolvedEntryKind === 'L' ? 'NUL' : (phaseCode || null);

  // ── Composite ID — only generated on confirmed save ───────────────────────
  const compositeId = await buildCompositeId({ sectionId: section, phaseCode: resolvedPhaseCode, originDate });

  const entry = {
    id:           newEntryId(),
    compositeId,
    entryKind:    resolvedEntryKind,           // 'L' | 'O' — semantic flag for AI/export
    section,
    type,
    title,
    body,
    speaker,
    status,
    originDate:   originDate || null,
    phaseCode:    resolvedPhaseCode,           // 'NUL' (string) for lexicon, code or null for others
    timeframeStart,
    timeframeEnd,
    arcSeedId,
    arcPhase,
    layerIds:     [...layerIds],
    witness,
    facetIds:     [...facetIds],
    tagIds:       [...tagIds],
    crossLinks:   [...crossLinks],
    presence,
    metadata,
    hash:         hashKey,
    is_deleted:   false,
    createdAt:    new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };

  await putRecord('entries', entry);
  return { duplicate: false, entry };
}

export async function updateEntry(id, updates) {
  const entry = await getById('entries', id);
  if (!entry) throw new Error(`Entry not found: ${id}`);

  // Recompute hash if content changed
  if (updates.title !== undefined || updates.body !== undefined) {
    const title = updates.title ?? entry.title;
    const body  = updates.body  ?? entry.body;
    updates.hash = normalizeHash(title + body);
  }

  const updated = { ...entry, ...updates, lastModified: new Date().toISOString() };
  return putRecord('entries', updated);
}

export async function deleteEntry(id) {
  const now = new Date().toISOString();

  const entry = await getById('entries', id);
  if (!entry) throw new Error(`Entry not found: ${id}`);

  // ── Write tombstone — permanent record, sequence number retired forever ───
  // Stored in id_tombstones keyed by compositeId (not internal id).
  // If entry never got a compositeId (draft never saved), skip tombstone.
  if (entry.compositeId) {
    await putRecord('id_tombstones', {
      compositeId: entry.compositeId,
      internalId:  entry.id,
      sectionId:   entry.section,
      entryKind:   entry.entryKind || 'O',
      deletedAt:   now,
    });
  }

  // ── Soft-delete the entry (tombstone flag on record) ─────────────────────
  await putRecord('entries', {
    ...entry,
    is_deleted:   true,
    deleted_at:   now,
    lastModified: now,
  });

  // ── Cascade: soft-delete all relations involving this entry ───────────────
  const allRels = await getAll('relations');
  for (const r of allRels) {
    if (!r.is_deleted && (r.fromId === id || r.toId === id)) {
      await putRecord('relations', {
        ...r,
        is_deleted: true,
        deleted_at: now,
      });
    }
  }
}

/**
 * createTombstone — manually write a tombstone for an entry whose
 * compositeId is known but the entry record may already be gone.
 * Safety valve for import/migration scenarios.
 */
export async function createTombstone({ compositeId, internalId, sectionId, entryKind = 'O' }) {
  return putRecord('id_tombstones', {
    compositeId,
    internalId:  internalId || null,
    sectionId:   sectionId  || null,
    entryKind,
    deletedAt:   new Date().toISOString(),
  });
}

/**
 * getTombstones() — returns all tombstone records.
 * Used by audit UI and import deduplication.
 */
export async function getTombstones() {
  return getAll('id_tombstones');
}

export async function getEntriesBySection(sectionId) {
  const all = await getEntries();
  return all.filter(e => e.section === sectionId);
}

export async function getEntriesByArcSeed(arcSeedId) {
  const all = await getEntries();
  return all.filter(e => e.arcSeedId === arcSeedId);
}

export async function getEntriesByStatus(status) {
  const all = await getEntries();
  return all.filter(e => e.status === status);
}

// ── RELATIONS ─────────────────────────────────────────────────────────────────

export async function createRelation({ fromId, toId, relationType, weight = null, bidirectional = false }) {
  if (!RELATION_TYPES.includes(relationType))
    throw new Error(`Invalid relationType: "${relationType}". Use: ${RELATION_TYPES.join(', ')}`);

  const relation = {
    id:           newRelId(),
    fromId,
    toId,
    relationType,
    weight,
    bidirectional,
    is_deleted:   false,
    createdAt:    new Date().toISOString(),
  };
  await putRecord('relations', relation);

  if (bidirectional) {
    const inverseType = INVERSE_VECTOR_MAP[relationType] || relationType;
    const inverse = {
      id:           newRelId(),
      fromId:       toId,
      toId:         fromId,
      relationType: inverseType,
      weight,
      bidirectional: true,
      is_deleted:   false,
      createdAt:    new Date().toISOString(),
    };
    await putRecord('relations', inverse);
  }

  return relation;
}

export async function getRelationsFor(nodeId) {
  const [from, to] = await Promise.all([
    getByIndex('relations', 'fromId', nodeId),
    getByIndex('relations', 'toId',   nodeId),
  ]);
  return {
    outgoing: from.filter(r => !r.is_deleted),
    incoming: to.filter(r => !r.is_deleted),
  };
}

// ── TAGS ──────────────────────────────────────────────────────────────────────

export async function getOrCreateTag({ label, category = '', layer = '' }) {
  const all = await getAll('tags');
  const norm = label.toLowerCase().trim();
  const existing = all.find(t => t.label.toLowerCase().trim() === norm);
  if (existing) return existing;

  // Check TAG_VOCAB for a canonical definition before creating a free tag.
  // If matched, preserve the vocab ID and all vocab fields.
  // TAG_VOCAB tags use snake_case ids — normalise the input label to match.
  const normId = norm.replace(/\s+/g, '_');
  const canonical = TAG_VOCAB.find(t => t.id === normId);

  const tag = {
    id:              canonical
      ? canonical.id
      : `tag_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,5)}`,
    label:           label.trim(),
    category:        canonical?.category        ?? category,
    layer:           canonical?.layer           ?? layer,
    mode:            canonical?.mode            ?? 'overlay',
    seedSpan:        canonical?.seedSpan        ?? null,
    seedWeight:      canonical?.seedWeight      ?? 0.5,
    intrinsicWeight: canonical?.intrinsicWeight ?? null,
    createdAt:       new Date().toISOString(),
  };
  return putRecord('tags', tag);
}

// ── SEARCH ────────────────────────────────────────────────────────────────────

export async function searchEntries(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase();
  const all = await getEntries();
  return all.filter(e =>
    e.title?.toLowerCase().includes(q) ||
    e.body?.toLowerCase().includes(q)  ||
    e.speaker?.toLowerCase().includes(q) ||
    e.section?.toLowerCase().includes(q)
  );
}

// ── EXPORT / IMPORT ───────────────────────────────────────────────────────────

export async function exportAll() {
  const [concepts, facets, entries, relations, tags,
         nexusHypotheses, nexusDriftEvents, nexusGrades, nexusEventLog] = await Promise.all([
    getAll('concepts'),
    getAll('facets'),
    getAll('entries'),
    getAll('relations'),
    getAll('tags'),
    getAll('nexus_hypotheses'),
    getAll('nexus_drift_events'),
    getAll('nexus_grades'),
    getAll('nexus_event_log'),
  ]);

  return JSON.stringify({
    _meta: {
      version:   2,
      exportedAt: new Date().toISOString(),
      counts: {
        concepts:         concepts.length,
        facets:           facets.length,
        entries:          entries.length,
        relations:        relations.length,
        tags:             tags.length,
        nexusHypotheses:  nexusHypotheses.length,
        nexusDriftEvents: nexusDriftEvents.length,
        nexusGrades:      nexusGrades.length,
        nexusEventLog:    nexusEventLog.length,
      }
    },
    concepts,
    facets,
    entries,
    relations,
    tags,
    nexusHypotheses,
    nexusDriftEvents,
    nexusGrades,
    nexusEventLog,
  }, null, 2);
}

export async function importAll(jsonString, mode = 'merge') {
  const data = JSON.parse(jsonString);

  if (mode === 'replace') {
    // Wipe core stores. nexus_event_log is NEVER wiped — it is append-only.
    for (const store of ['concepts','facets','entries','relations','tags',
                         'nexus_hypotheses','nexus_drift_events','nexus_grades']) {
      const all = await getAll(store);
      for (const rec of all) await deleteRecord(store, rec.id);
    }
  }

  // Write all records (merge = put, which updates existing by ID)
  const stores = ['concepts','facets','entries','relations','tags',
                  'nexus_hypotheses','nexus_drift_events','nexus_grades'];
  for (const store of stores) {
    if (data[store]) {
      for (const rec of data[store]) await putRecord(store, rec);
    }
  }

  // Event log: always append-only — never replace, always merge new entries.
  if (data.nexusEventLog) {
    const existing = await getAll('nexus_event_log');
    const existingIds = new Set(existing.map(e => e.id));
    for (const rec of data.nexusEventLog) {
      if (!existingIds.has(rec.id)) await putRecord('nexus_event_log', rec);
    }
  }

  return data._meta?.counts || {};
}

// ── BACKUP (download JSON) ─────────────────────────────────────────────────────

export async function downloadBackup() {
  const json = await exportAll();
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  const meta = JSON.parse(json)._meta.counts;
  const ts = new Date().toISOString().slice(0,19).replace(/:/g,'-');
  a.download = `aelarian-backup-${ts}_concepts${meta.concepts}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── STATS ─────────────────────────────────────────────────────────────────────

export async function getStats() {
  const [concepts, facets, liveEntries, relations, tags] = await Promise.all([
    getAll('concepts'),
    getAll('facets'),
    getEntries(),          // excludes tombstones
    getAll('relations'),
    getAll('tags'),
  ]);

  const sectionCounts = {};
  for (const e of liveEntries) {
    sectionCounts[e.section] = (sectionCounts[e.section] || 0) + 1;
  }

  return {
    concepts:  concepts.length,
    facets:    facets.length,
    entries:   liveEntries.length,
    relations: relations.filter(r => !r.is_deleted).length,
    tags:      tags.length,
    sections:  sectionCounts,
  };
}

// ── NEXUS ─────────────────────────────────────────────────────────────────────
//
// Four-store Nexus persistence layer.
// Entry point for all PCV, DTX, SGR, and audit log operations.
//
// ID convention: nexus records use crypto.randomUUID() internally (uuid field)
// plus a human-readable ID stamp (hypId / driftId / gradeId / logId) for
// cross-store foreign keys and UI display. Both are stored; uuid is the keyPath.
//
// Provenance rule: every write to nexus_hypotheses, nexus_drift_events, or
// nexus_grades MUST be followed by a putNexusLogEntry() call in the same
// operation. The log is the audit record — it must never fall behind.

function _nexusId(prefix) {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rnd}`;
}

// ── nexus_hypotheses (PCV) ────────────────────────────────────────────────────

/**
 * createNexusHypothesis — deposit a new PCV pattern record.
 *
 * Shape:
 *   findingType       string   — emergence.js detector type
 *                                (cluster|bridge|influence|cross_category|
 *                                 drift|void|npa_spike|phase_shift)
 *   title             string   — human-readable pattern label
 *   description       string   — full pattern description
 *   involvedSeeds     string[] — seed IDs active in this pattern
 *   involvedDomains   string[] — section IDs contributing signal
 *   couplingVector    number   — 0–1 strength of cross-domain correlation
 *   interval          string   — session range string e.g. 'sessions 14–19'
 *   sessionDetected   number   — session number of first detection
 *   sourceEntries     string[] — entry IDs from emergence analysis
 *   originPillar      string   — TRIA|PRIA|PARA — dominant pillar
 *   metadata          object   — arbitrary extra fields
 *   sessionId         string   — current session identifier
 */
export async function createNexusHypothesis({
  findingType,
  title        = '',
  description  = '',
  involvedSeeds   = [],
  involvedDomains = [],
  couplingVector  = null,
  interval        = null,
  sessionDetected = null,
  sourceEntries   = [],
  originPillar    = null,
  metadata        = {},
  sessionId       = null,
}) {
  const now   = new Date().toISOString();
  const hypId = _nexusId('HYP');
  const record = {
    id:             crypto.randomUUID(),
    hypId,
    findingType,
    title,
    description,
    involvedSeeds:   [...involvedSeeds],
    involvedDomains: [...involvedDomains],
    couplingVector,
    interval,
    sessionDetected,
    sourceEntries:   [...sourceEntries],
    originPillar,
    status:          'open',   // open | closed | archived
    metadata,
    createdAt:       now,
    lastModified:    now,
    timestamp:       now,
  };
  await putRecord('nexus_hypotheses', record);
  await putNexusLogEntry({
    entityType: 'hypothesis',
    entityId:   hypId,
    action:     'created',
    priorState: null,
    newState:   record,
    sessionId,
  });
  return record;
}

/**
 * updateNexusHypothesis — update fields on an existing hypothesis.
 * Logs the state transition automatically.
 */
export async function updateNexusHypothesis(id, updates, sessionId = null) {
  const existing = await getById('nexus_hypotheses', id);
  if (!existing) throw new Error(`Hypothesis not found: ${id}`);
  const prior  = { ...existing };
  const now    = new Date().toISOString();
  const updated = { ...existing, ...updates, lastModified: now, timestamp: now };
  await putRecord('nexus_hypotheses', updated);
  await putNexusLogEntry({
    entityType: 'hypothesis',
    entityId:   existing.hypId,
    action:     'updated',
    priorState: prior,
    newState:   updated,
    sessionId,
  });
  return updated;
}

export async function getNexusHypotheses({ status = null } = {}) {
  const all = await getAll('nexus_hypotheses');
  return status ? all.filter(h => h.status === status) : all;
}

export async function getNexusHypothesisById(id) {
  return getById('nexus_hypotheses', id);
}

export async function getNexusHypothesisByHypId(hypId) {
  const all = await getAll('nexus_hypotheses');
  return all.find(h => h.hypId === hypId) || null;
}

// ── nexus_drift_events (DTX) ──────────────────────────────────────────────────

/**
 * createNexusDriftEvent — deposit a new DTX classification record.
 *
 * Trajectory states: Escalating | Stabilizing | Oscillating |
 *                    Fragmenting | Contained
 * Initiation sources: internal_instability | external_perturbation |
 *                     cross_node_interference | recursion_overload
 * Trajectory patterns: linear_escalation | oscillation | fragmentation |
 *                      cascade | containment
 * Threshold levels: sub_threshold | threshold_breach |
 *                   critical_cascade | irreversible_shift
 *
 * RULE: resolvedAt and outcome must remain null until explicitly observed
 * and timestamped. A drift event cannot include an outcome label before
 * the outcome has been confirmed.
 */
export async function createNexusDriftEvent({
  hypId,
  initiationSource,
  trajectoryPattern,
  thresholdLevel,
  signaturePattern    = {},   // { timingRhythm, nodeInvolvement, escalationShape }
  trajectoryState     = 'Escalating',
  probabilityVector   = { resolve: null, collapse: null, stable: null },
  sessionDetected     = null,
  sourceSignal        = null,  // description of the signal that triggered this event
  metadata            = {},
  sessionId           = null,
}) {
  const now     = new Date().toISOString();
  const driftId = _nexusId('DTX');
  const record  = {
    id:                crypto.randomUUID(),
    driftId,
    hypId,
    initiationSource,
    trajectoryPattern,
    thresholdLevel,
    signaturePattern,
    trajectoryState,
    probabilityVector: { ...probabilityVector },
    sessionDetected,
    sourceSignal,
    resolvedAt:        null,   // null until outcome observed and timestamped
    outcome:           null,   // null until confirmed — NEVER infer
    metadata,
    createdAt:         now,
    lastModified:      now,
    timestamp:         now,
  };
  await putRecord('nexus_drift_events', record);
  await putNexusLogEntry({
    entityType: 'drift_event',
    entityId:   driftId,
    action:     'created',
    priorState: null,
    newState:   record,
    sessionId,
  });
  return record;
}

/**
 * updateNexusDriftEvent — update trajectory state or probability vector.
 * Used when SGR returns Bayesian updates or when trajectory state changes.
 */
export async function updateNexusDriftEvent(id, updates, sessionId = null) {
  const existing = await getById('nexus_drift_events', id);
  if (!existing) throw new Error(`Drift event not found: ${id}`);
  const prior   = { ...existing };
  const now     = new Date().toISOString();
  const updated = { ...existing, ...updates, lastModified: now, timestamp: now };
  await putRecord('nexus_drift_events', updated);
  await putNexusLogEntry({
    entityType: 'drift_event',
    entityId:   existing.driftId,
    action:     updates.probabilityVector ? 'bayesian_update' : 'updated',
    priorState: prior,
    newState:   updated,
    sessionId,
  });
  return updated;
}

/**
 * resolveNexusDriftEvent — record an observed outcome.
 * Outcome label is ONLY written here, after explicit observation.
 */
export async function resolveNexusDriftEvent(id, { outcome, sessionId = null } = {}) {
  const now = new Date().toISOString();
  return updateNexusDriftEvent(id, {
    resolvedAt: now,
    outcome,
    trajectoryState: 'Contained',
  }, sessionId);
}

export async function getNexusDriftEvents({ trajectoryState = null, hypId = null } = {}) {
  let all = await getAll('nexus_drift_events');
  if (hypId)            all = all.filter(d => d.hypId === hypId);
  if (trajectoryState)  all = all.filter(d => d.trajectoryState === trajectoryState);
  return all;
}

export async function getNexusDriftEventByDriftId(driftId) {
  const all = await getAll('nexus_drift_events');
  return all.find(d => d.driftId === driftId) || null;
}

// ── nexus_grades (SGR) ────────────────────────────────────────────────────────

/**
 * createNexusGrade — deposit a new SGR evidence-locked grade.
 *
 * RULE: grading is post-hoc only. This function should never be called
 * before documented outcomes exist. Status starts as 'rated' (not 'unrated')
 * because the act of calling this function IS the grading event.
 * Unrated signals are tracked in nexus_hypotheses with status 'open'.
 *
 * Score vector dimensions (each 1–4 ordinal scale):
 *   impact      — negligible(1) | local(2) | cross_node(3) | system_wide(4)
 *   resonance   — isolated(1)   | echoed(2) | convergent(3) | universal(4)
 *   predictive  — none(0)       | weak(1)   | moderate(2)   | strong(3)
 *   stability   — transient(1)  | recurring(2) | stable(3)  | anchoring(4)
 *
 * Tier assignment (derived from score vector):
 *   S — Structural:  impact≥3 AND resonance≥3 AND predictive≥2 AND stability≥3
 *   A — Advisory:    impact≥2 AND resonance≥2 AND predictive≥1
 *   B — Emerging:    at least one dimension ≥ 2
 *   C — Archival:    all dimensions = 1 or 0
 *
 * Weights: fixed at 0.25 each (w1=w2=w3=w4=0.25).
 * dynamicWeights flag reserved for future per-signal reliability adjustment.
 */
export async function createNexusGrade({
  hypId,
  driftId          = null,
  title            = '',
  scoreVector      = { impact: null, resonance: null, predictive: null, stability: null },
  tier,
  rationale        = '',
  outcomes         = [],    // documented real-world outcomes this grade is based on
  sessionDetected  = null,
  sessionValidated = null,
  gradeLatency     = null,  // sessionValidated - sessionDetected
  dynamicWeights   = false,
  metadata         = {},
  sessionId        = null,
}) {
  const now     = new Date().toISOString();
  const gradeId = _nexusId('SGR');
  const record  = {
    id:               crypto.randomUUID(),
    gradeId,
    hypId,
    driftId,
    title,
    scoreVector:      { ...scoreVector },
    tier,
    rationale,
    outcomes:         [...outcomes],
    sessionDetected,
    sessionValidated,
    gradeLatency:     gradeLatency ?? (
      sessionValidated != null && sessionDetected != null
        ? sessionValidated - sessionDetected
        : null
    ),
    dynamicWeights,
    status:           'rated',   // rated | revised
    revisionHistory:  [],
    metadata,
    createdAt:        now,
    lastModified:     now,
    timestamp:        now,
  };
  await putRecord('nexus_grades', record);
  await putNexusLogEntry({
    entityType: 'grade',
    entityId:   gradeId,
    action:     'graded',
    priorState: null,
    newState:   record,
    sessionId,
  });
  return record;
}

/**
 * reviseNexusGrade — update a grade when new outcomes require reassessment.
 * Prior state is pushed onto revisionHistory before overwriting.
 */
export async function reviseNexusGrade(id, updates, sessionId = null) {
  const existing = await getById('nexus_grades', id);
  if (!existing) throw new Error(`Grade not found: ${id}`);
  const prior   = { ...existing };
  const now     = new Date().toISOString();
  const updated = {
    ...existing,
    ...updates,
    status:          'revised',
    revisionHistory: [
      ...existing.revisionHistory,
      { revisedAt: now, priorScoreVector: existing.scoreVector, priorTier: existing.tier },
    ],
    lastModified: now,
    timestamp:    now,
  };
  await putRecord('nexus_grades', updated);
  await putNexusLogEntry({
    entityType: 'grade',
    entityId:   existing.gradeId,
    action:     'revised',
    priorState: prior,
    newState:   updated,
    sessionId,
  });
  return updated;
}

export async function getNexusGrades({ tier = null, status = null, hypId = null } = {}) {
  let all = await getAll('nexus_grades');
  if (hypId)  all = all.filter(g => g.hypId === hypId);
  if (tier)   all = all.filter(g => g.tier === tier);
  if (status) all = all.filter(g => g.status === status);
  return all;
}

export async function getNexusGradeByGradeId(gradeId) {
  const all = await getAll('nexus_grades');
  return all.find(g => g.gradeId === gradeId) || null;
}

// ── nexus_event_log (immutable audit) ────────────────────────────────────────

/**
 * putNexusLogEntry — append an immutable event to the Nexus audit log.
 *
 * RULE: This function only ever writes. It never reads, never updates,
 * never deletes. The log is the provenance chain for all Nexus data.
 * Called automatically by all create/update/resolve/revise functions above.
 *
 * actions: created | updated | bayesian_update | graded | revised |
 *          resolved | archived
 */
export async function putNexusLogEntry({
  entityType,   // hypothesis | drift_event | grade
  entityId,     // hypId | driftId | gradeId
  action,
  priorState  = null,
  newState    = null,
  sessionId   = null,
  note        = null,
}) {
  const now    = new Date().toISOString();
  const record = {
    id:         crypto.randomUUID(),
    entityType,
    entityId,
    action,
    priorState,
    newState,
    sessionId,
    note,
    timestamp:  now,
  };
  return putRecord('nexus_event_log', record);
}

/**
 * getNexusLog — retrieve audit log entries.
 * Pass entityId to scope to a single hypothesis/drift/grade chain.
 * Returns in chronological order (oldest first).
 */
export async function getNexusLog({ entityId = null, entityType = null } = {}) {
  let all = await getAll('nexus_event_log');
  if (entityId)   all = all.filter(e => e.entityId   === entityId);
  if (entityType) all = all.filter(e => e.entityType === entityType);
  return all.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/**
 * getNexusChain — retrieve the full provenance chain for a hypothesis:
 * the hypothesis record, all drift events linked to it, all grades linked to it,
 * and the complete audit log for all three.
 */
export async function getNexusChain(hypId) {
  const [hypothesis, allDrift, allGrades, allLog] = await Promise.all([
    getNexusHypothesisByHypId(hypId),
    getNexusDriftEvents({ hypId }),
    getNexusGrades({ hypId }),
    getAll('nexus_event_log'),
  ]);

  const relatedIds = new Set([
    hypId,
    ...allDrift.map(d => d.driftId),
    ...allGrades.map(g => g.gradeId),
  ]);
  const log = allLog
    .filter(e => relatedIds.has(e.entityId))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return { hypothesis, driftEvents: allDrift, grades: allGrades, log };
}



/**
 * buildCompositeId({ sectionId, phaseCode, originDate })
 * Generates the permanent 5-part composite ID stamp and increments the global sequence.
 * Format: TS · PAGE · PHASE · YYYY-MM · SEQ
 *
 * Call ONLY on confirmed Save — sequence numbers are permanently retired on use.
 *
 * @param {string} sectionId   — section id from SECTIONS (e.g. 'invocations')
 * @param {string} phaseCode   — PHASE_CODES value (e.g. 'EMG') or null → 'NUL'
 * @param {string} originDate  — 'YYYY-MM' or 'YYYY-MM-DD' or null
 * @returns {Promise<string>}  — e.g. 'TS · INV · EMG · 2026-03 · 0001'
 */
export async function buildCompositeId({ sectionId, phaseCode = null, originDate = null }) {
  const pageCode = PAGE_CODES[sectionId] || '—';
  const seq      = await getNextSequence();
  return assembleId({ pageCode, phaseCode: phaseCode || 'NUL', originDate, seq });
}

/**
 * getEntryCountBySection(sectionId)
 * Returns the count of non-deleted entries in a section.
 * Used by buildParentId and buildChildId to derive section-scoped SEQ.
 * Sequence reflects actual deposit history — gaps from deletes are honest.
 */
export async function getEntryCountBySection(sectionId) {
  const entries = await getEntriesBySection(sectionId);
  return entries.length;
}

/**
 * buildParentId({ phaseCode, originDate })
 * Generates the root entry stamp for a source document arriving at Integration.
 * Format: TS · AX · [PHASE] · [YYYY-MM] · [SEQ]
 *
 * AX = Axis group marker. Signals "this is a root/source entry."
 * SEQ = count of existing Integration section entries + 1.
 * arcCode is resolved and returned separately — caller stores on entry.arcCode.
 *
 * Call ONLY on confirmed Save.
 *
 * @param {string} phaseCode  — PHASE_CODES value or null → 'NUL'
 * @param {string} originDate — 'YYYY-MM' or 'YYYY-MM-DD' or null
 * @returns {Promise<{ stamp: string, arcCode: string }>}
 */
export async function buildParentId({ phaseCode = null, originDate = null }) {
  const seq   = (await getEntryCountBySection('integration')) + 1;
  const stamp = assembleId({
    pageCode:   'AX',
    phaseCode:  phaseCode || 'NUL',
    originDate,
    seq,
  });
  return stamp;
}

/**
 * buildChildId({ sectionId, phaseCode, originDate, parentId })
 * Generates a deposit stamp for a manifest entry being written to a target section.
 * Format: TS · [PAGE] · [PHASE] · [YYYY-MM] · [SEQ] · root:[PARENT-ID]
 *
 * SEQ = count of existing entries in target section + 1.
 * root_ref travels visibly in the ID string and is also stored on entry.rootRef.
 *
 * Call ONLY on confirmed deposit — sequence is permanently retired on use.
 *
 * @param {string} sectionId  — target section id (e.g. 'genesis')
 * @param {string} phaseCode  — PHASE_CODES value or null → inherits from parent
 * @param {string} originDate — 'YYYY-MM' or 'YYYY-MM-DD' or null
 * @param {string} parentId   — the parent stamp string (TS · AX · ...)
 * @returns {Promise<string>} — e.g. 'TS · GEN · EMG · 2026-03 · 0001 · root:TS·AX·EMG·2026-03·0001'
 */
export async function buildChildId({ sectionId, phaseCode = null, originDate = null, parentId }) {
  const pageCode = PAGE_CODES[sectionId] || '—';
  const seq      = (await getEntryCountBySection(sectionId)) + 1;
  return assembleId({
    pageCode,
    phaseCode: phaseCode || 'NUL',
    originDate,
    seq,
    rootRef: parentId,
  });
}

/**
 * previewCompositeId({ sectionId, phaseCode, originDate })
 * Returns a live preview stamp WITHOUT touching the sequence counter.
 * Safe to call on every input change for real-time display in add panels.
 * Seq slot renders as '——' until Save is confirmed.
 *
 * @returns {string}  — e.g. 'TS · INV · EMG · 2026-03 · ——'
 */
export function previewCompositeId({ sectionId, phaseCode = null, originDate = null }) {
  const pageCode = PAGE_CODES[sectionId] || '—';
  return assembleId({ pageCode, phaseCode: phaseCode || 'NUL', originDate, seq: null });
}

// ── COMPOSITE ID SEQUENCE ─────────────────────────────────────────────────

// Atomically increment the global sequence counter and return the new value.
// Called ONLY on Save — drafts do not consume sequence numbers.
// Sequence numbers are permanently retired on delete (never reused).
export async function getNextSequence() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('ts_sequence', 'readwrite');
    const store = tx.objectStore('ts_sequence');
    const req = store.get('seq');
    req.onsuccess = () => {
      const current = req.result ? req.result.val : 0;
      const next    = current + 1;
      store.put({ key: 'seq', val: next });
      tx.oncomplete = () => resolve(next);
      tx.onerror    = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}

// Read the current sequence value without incrementing — for preview/display.
export async function peekSequence() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction('ts_sequence', 'readonly');
    const store = tx.objectStore('ts_sequence');
    const req   = store.get('seq');
    req.onsuccess = () => resolve(req.result ? req.result.val : 0);
    req.onerror   = () => reject(req.error);
  });
}