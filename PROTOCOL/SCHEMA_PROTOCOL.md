# SCHEMA_PROTOCOL.md
# Aelarian Archives — Schema and Domain Protocol
# Last updated: April 2026

---

## PURPOSE

Defines three things:
1. The procedure for modifying any verified schema or domain file
2. The human-readable schema cascade reference
3. Verification prompt templates for domain and system files

All schema and domain files in DESIGN/ are verified. This protocol protects
that verification state through every future modification.

---

## 1. SCHEMA MODIFICATION PROCEDURE

Run this procedure before changing any file in DESIGN/Systems/ or DESIGN/Domains/.

1. State the intended change — what field, section, or rule is being modified
   and why. Do not begin the edit until this is stated and acknowledged.

2. Open PROTOCOL/DEPENDENCY_MAP.json. Look up the file being modified.
   List every file in its `affects` array.
   NOTE: DEPENDENCY_MAP.json is currently empty (old-build entries
   cleared 2026-04-08). Use the human-readable cascade reference in
   section 2 below for manual cascade analysis until the map is
   rebuilt during Step 4 (core files phase).

3. For each affected file: state what specifically could break as a result
   of the change. If the impact is unknown, say so — do not proceed until
   it is known.

4. Sage approves the change and the cascade impact list before any edit
   is made.

5. Make the change to the originating file.

6. Open each affected file and verify the change does not break the
   connection. If a connected file needs updating, state it explicitly
   before touching it — do not silently update.

7. Run the stress test protocol (CLAUDE.md) on every file touched:
   - Blocking gaps: fix before moving forward
   - Calibration gaps: log and continue

8. Write a WORK_UNIT entry to SESSION_LOG.md:
   - Files modified
   - Change made
   - Cascade files checked
   - Any calibration gaps found

9. Commit. Pre-commit hook runs automatically.

**Rule:** A schema change is not complete until every file in its affects
list has been checked and the result recorded in SESSION_LOG.md.
A single unchecked cascade is a blocking gap — not a calibration item.

---

## 2. SCHEMA CASCADE REFERENCE

Human-readable version of DEPENDENCY_MAP.json for schema files.
Use this when planning changes. Machine version in PROTOCOL/DEPENDENCY_MAP.json
is what the hook reads — both must stay in sync.
NOTE: The JSON map is currently empty (rebuild pending, Step 4). This
human-readable section is the active cascade reference until then.

---

### INTEGRATION SCHEMA.md
Touches: COMPOSITE ID SCHEMA.md · INTEGRATION DB SCHEMA.md · TAGGER SCHEMA.md

- Composite ID: stamp assignment in INT flow — format and sequence counter
  behavior must align
- Integration DB: store write sequence must match INT step order. Known
  conflict point: intake_status field — see INTEGRATION DB SCHEMA.md header before
  touching either
- Tagger: INT step 5 calls the tagger routing chain. Any change to INT
  step 5 sequence cascades to TAGGER SCHEMA.md

---

### TAGGER SCHEMA.md
Touches: RESONANCE ENGINE PHYSICS SPEC.md · EMERGENCE SCHEMA.md · SYSTEM_ Tagger.md · INTEGRATION SCHEMA.md

- Resonance Engine: ae:tagCommit payload field names are a hard contract.
  seed_id/layer_id/threshold_id/pillar_id — exact spelling, always
- Emergence: onTagSessionComplete sequence depends on tagger commit hook.
  capturedTags and _emgNotify steps must stay aligned
- Tagger System: sync sequence step count and step content must match
  between schema and system doc
- Integration: tagger routing is INT step 5 — change here echoes there

---

### COMPOSITE ID SCHEMA.md
Touches: INTEGRATION SCHEMA.md · INTEGRATION DB SCHEMA.md

- Integration: stamp format is used at INT step 4. previewCompositeId()
  is sync (safe on every keystroke). buildCompositeId() is async (permanent
  sequence counter increment — called only on confirmed save)
- Integration DB: stamp field in the Integration DB must match schema definition

---

### METAMORPHOSIS SCHEMA.md
Touches: DAILY NEXUS ROUTINE SCHEMA.md

- DNR calls MTM.runSynthesis(options?) as step 1. prior_mtm_session_ids
  is plural — confirmed in both. Return type must match DNR expectation.
  MTM never receives deposits — synthesis only, at session close

---

### DAILY NEXUS ROUTINE SCHEMA.md
Touches: METAMORPHOSIS SCHEMA.md

- Calls MTM.runSynthesis(). Sequence is strictly ordered: step 1 MTM,
  step 2 LNV notification. WSC is a separate sovereign act — DNR does
  not trigger it

---

### EMERGENCE SCHEMA.md
Touches: THREAD TRACE SCHEMA.md · TAGGER SCHEMA.md

- Thread Trace: graph export stub is disabled in both files. Update both together
  when the graph route is live.
- Tagger: onTagSessionComplete always fetches entries fresh from the FastAPI backend.
  capturedTags flows from tagger commit hook

---

### THREAD TRACE SCHEMA.md
Touches: EMERGENCE SCHEMA.md

- Graph export stub: GRAPH_PAGE_PATH = '/graph' — stays stubbed until
  route is live. Update both EmergencePanel and ThreadTrace components together

---

### RESONANCE ENGINE PHYSICS SPEC.md
Touches: TAGGER SCHEMA.md

- ae:tagCommit payload received from tagger — payload field names must
  match exactly. This was a confirmed mismatch that was corrected:
  seed/layer/threshold/pillar → seed_id/layer_id/threshold_id/pillar_id.
  Never revert.

---

### ARCHIVE SCHEMA.md
Touches: INTEGRATION SCHEMA.md (for sealed record write path)

- Entries with status: 'sealed' are read-only everywhere. The FastAPI backend
  enforces this at the API layer. This constraint must be reflected in
  Integration if the write path changes.

---

## 3. DOMAIN VERIFICATION PROMPT TEMPLATES

Use these prompts for any new domain or re-verification of an existing one.
These were the working prompts from the full verification pass (all groups
COMPLETE as of April 2026). Preserved here for future use.

---

### DOMAIN GROUP VERIFICATION PROMPT

Replace [GROUP] and [FOLDER].

```
Read all files in [FOLDER] simultaneously.
For each domain in this group verify:

1. All required fields present — page code, group, seeds,
   origin affinity, threshold affinity, pillar, purpose,
   structural rules, connects to, signal profile

2. No narrative language, no poetic framing,
   no inspirational content — specs only

3. CONNECTS TO routing matches actual page numbers
   and codes in the architecture

4. Nothing truncated — every section complete

5. Signal profile tags exist in the tag vocabulary

6. Cross-check against any relevant system schema
   in DESIGN/Systems/ for alignment

For each file: state what is correct, what is missing,
what needs correction. Do not fix anything yet.
Produce a gap report first.
```

---

### SYSTEM FILE VERIFICATION PROMPT

Replace [FILE].

```
Read [FILE].
Verify:

1. Ownership boundaries complete — OWNS and DOES NOT OWN
   both present and specific

2. All stores fully defined — every field has type,
   enum values where applicable, write rules, null conditions

3. All sequences in strict order with failure handling
   at every step

4. Known failure modes present — at minimum 3,
   each with a named guard

5. Public API defined — every exposed function named
   with parameters and return type

6. Files section present — every file listed with
   status PLANNED or built

7. No forward references to systems that don't exist yet
   without PLANNED label

8. Cross-check handoffs against the schemas of connected
   systems — what this system sends must match what the
   receiving system expects

State what is correct, what is missing, what needs
correction. Do not fix anything yet.
Produce a gap report first.
```

---

### VERIFICATION SESSION RHYTHM

For every domain group or system file:

1. Run the verification prompt → gap report produced
2. Sage reviews gap report → decides what to fix
3. Fix one file at a time → audit after each fix
4. Confirm complete → write WORK_UNIT to SESSION_LOG.md
5. Move to next file or group

Never fix without a gap report first.
Never skip the audit after a fix.
Never move to the next file until the current one is confirmed complete.

---

## 4. DEPENDENCY MAP MAINTENANCE

PROTOCOL/DEPENDENCY_MAP.json is a living document. Currently empty
(old-build entries cleared 2026-04-08, rebuild pending Step 4).

**When to update it:**
- A new file is created → add an entry for it
- A new import or event connection is introduced → add to affects[]
- A dependency is removed → remove from affects[]
- A file is renamed → update all references to it

**How to update it:**
Update the map as part of the work unit that introduces the change.
Not after. The map update and the code change are one work unit.
A dependency that exists in code but not in the map is a silent cascade
waiting to happen.

**The hook reads this map.** If the map is stale, the cascade alerts
are wrong. Stale map = broken cascade protection.
