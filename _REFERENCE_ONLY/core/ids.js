// ┌─────────────────────────────────────────────────────────────────────────────┐
// │  ⬡  GUARDIAN NOTE — ids.js                                                 │
// │  Role: ID generation and normalization utilities. ES module (export only).  │
// │  All record creation routes through typed generators here.                  │
// │                                                                             │
// │  USE TYPED GENERATORS — not generateId() directly:                         │
// │    newConceptId()  → 'con_...'  (concept nodes)                            │
// │    newFacetId()    → 'fct_...'  (layer-specific facets)                    │
// │    newEntryId()    → 'ent_...'  (all archive entries)                      │
// │    newRelId()      → 'rel_...'  (graph relations)                          │
// │    newTagId()      → 'tag_...'  (free tags)                                │
// │    Prefixes make IDs self-describing in the graph.                         │
// │                                                                             │
// │  normalizeHash(str):                                                        │
// │    Used for duplicate detection before createEntry().                       │
// │    Strips case, punctuation, extra whitespace → stable key.                │
// │    Always compare normalized hashes, never raw title strings.              │
// │                                                                             │
// │  ID FORMAT: [prefix]_[Date.now().toString(36)]_[4-char rand]              │
// │    Collision-resistant. Not cryptographically secure. Fine for archive use. │
// │    Do not use for auth tokens or sensitive records.                         │
// │                                                                             │
// │  NOTE: thread_trace_db.js uses its own _newThreadId() and                 │
// │    _newAnnotationId() helpers (thr_... / ann_...) — not imported from here.│
// │    Consider migrating those to this file in a future cleanup pass.         │
// └─────────────────────────────────────────────────────────────────────────────┘

/**
 * AELARIAN ARCHIVE — ID GENERATOR
 * Generates collision-resistant IDs for all record types.
 * Prefix encodes type so IDs are self-describing in the graph.
 */

export function generateId(prefix = 'rec') {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${ts}_${rand}`;
}

// Typed generators — use these, not generateId directly
export const newConceptId  = () => generateId('con');
export const newFacetId    = () => generateId('fct');
export const newEntryId    = () => generateId('ent');
export const newRelId      = () => generateId('rel');
export const newTagId      = () => generateId('tag');

/**
 * Normalized hash for duplicate detection.
 * Strips case, punctuation, whitespace — returns a stable key.
 */
export function normalizeHash(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}