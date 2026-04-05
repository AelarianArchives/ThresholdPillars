# **SYSTEM: Archive**

## **archive\_system.md**

### **/DESIGN/systems/**

---

## **WHAT THIS SYSTEM OWNS**

* Archives page (ARV · 45\) — the permanent sealed record surface  
* Three-surface architecture — PostgreSQL archives record \+ Archives page deposit \+ parent page placement  
* Authentication threshold — criteria for what qualifies for sealing  
* Sealed record rule — no reopening, no reinterpretation after seal  
* Archives page deposit format — what AI writes here at retirement  
* `page_deposit_id` — field on PostgreSQL archives record linking to the page deposit  
* Media intake trigger — dropdown button on all pages routing media files to INT

## **WHAT THIS SYSTEM DOES NOT OWN**

* Retirement sequence — owned by integration\_system  
* PostgreSQL archives table schema — defined by SQLAlchemy models (backend/models/), writes executed by FastAPI service layer (backend/services/). Authoritative spec: INTEGRATION DB SCHEMA.md  
* Provenance summary generation — owned by integration\_system (AI generates at retirement step 5; content surfaces here but originates there)  
* ARC id generation or stamp assembly — owned by composite\_id\_system and FastAPI composite ID service  
* Media intake processing — owned by integration\_system  
* Source document parsing — owned by integration\_system  
* Routing authority — owned by SOT

---

## **THREE-SURFACE ARCHITECTURE**

Every retired source document produces three outputs that share the same ARC id:

### **Surface 1 — PostgreSQL Archives Record**

Machine-readable. System source of truth. Created at retirement step 6\. Contains the full provenance record, routing data, and statistical summary of the parsed document. Not directly browsable on the Archives page.

Key fields:

id                  — ARC stamp: TS · ARC · \[PHASE\] · \[YYYY-MM\] · \[SEQ\]  
root\_ref            — references root\_entries.id  
provenance\_summary  — six-section AI-generated text (from retirement step 5\)  
confirmed\_targets   — all confirmed section routing from parsing  
total\_deposits      — integer  
confirmed           — integer  
skipped             — integer  
lifetime\_deferrals  — integer  
retired\_at          — ISO timestamp  
page\_deposit\_id     — references the Archives page deposit entry id  
                      Written at retirement after the page deposit is created.  
                      Links machine record to browsable surface.

### **Surface 2 — Archives Page Deposit**

Human-browsable. Written by AI at retirement as a structured entry on the Archives page. Content is drawn from the provenance\_summary on the PostgreSQL record. This is what Sage reads, searches, and retrieves on the Archives page.

The page deposit carries the ARC id and `retired_at` as metadata fields — the same values on the PostgreSQL record. The ARC id is the thread between all three surfaces: PostgreSQL record, page deposit, and parent page placement.

**Write sequence at retirement:**

1\. PostgreSQL archives record created (retirement step 6\) — page\_deposit\_id is null  
2\. Archives page deposit written from provenance\_summary content  
3\. page\_deposit\_id written to PostgreSQL archives record with the deposit's entry id  
4\. Retirement label surfaced in Integration UI — copy-ready for Sage

### **The Third Surface — Parent Page Placement**

Not an automated output. Sage manually creates a deposit entry in the section where the physical file belongs (e.g. Recursion for a document parsed across Recursion entries) and references the ARC id. The retirement label — displayed copy-ready at retirement completion — carries exactly what is needed:

\[ARC-ID\] · \[YYYY-MM-DD\]  
Example: TS·ARC·EMG·2026-03·0001 · 2026-03-31

All three surfaces share the ARC id. No surface is authoritative over the others — each serves a distinct function. The PostgreSQL record is the system source. The page deposit is the browsable index. The parent page placement is the contextual home of the physical file.

---

## **ARCHIVES PAGE DEPOSIT FORMAT**

The page deposit written at retirement is a structured entry on the Archives page. It is not the provenance\_summary verbatim — it is a formatted deposit drawn from that content.

**Required fields on the deposit:**

title       — document title from root\_entries.title  
arc\_id      — the ARC stamp id  
retired\_at  — ISO timestamp, formatted for display  
doc\_type    — mirrors root\_entries.doc\_type  
section     — 'archives'  
type        — 'archive\_record'  
status      — 'sealed'

**Body content — drawn from provenance\_summary sections:**

Source overview       — what the document is and where it came from  
Signal weight         — what the material carried and why it mattered  
Deposit distribution  — deposit count, receiving sections, routing patterns  
Split routing notes   — deposits that crossed multiple sections  
Unresolved notes      — anything flagged during parsing that didn't fit cleanly  
Parsing confidence    — honest self-assessment of read quality

**What the deposit does not contain:**

No interpretation beyond what the provenance\_summary states. No narrative framing. No thematic expansion. The deposit reflects what the system found. It does not editorialize what it means.

---

## **AUTHENTICATION THRESHOLD**

The Archives page receives only retired source documents. It is not a thematic page. It does not receive deposits routed from INT parsing. It receives the retirement record of the document itself — after that document has been fully parsed, all deposits resolved or deferred, and the provenance\_summary generated with honest confidence reporting.

**What qualifies for the Archives page:**

— Source document has completed the full INT retirement sequence  
— confirmed\_targets is fully written on root\_entries  
— provenance\_summary contains all six required sections  
— retirement\_status on root\_entries \= 'complete'  
— No deposits in pending state (open\_deferrals \= 0, or Sage has explicitly  
  accepted remaining deferrals as unresolvable)

**What does not qualify:**

— Partially parsed documents with open pending deposits  
— Documents where provenance\_summary is incomplete  
— Native entries from any content page — those live on their own pages  
— Any entry that has not passed through INT retirement

**The sealed record rule:**

Once an entry is written to the Archives page with status `sealed`, it is not reopened and not reinterpreted. The record reflects what the system found at retirement. If new analysis reveals something missed, that finding lives in the relevant content page or in a new INT intake — not as a modification to the sealed record. The ledger records what happened. It does not revise it.

---

## **MEDIA INTAKE TRIGGER**

A media intake button appears in a dropdown on every page in the archive. Its function is a routing shortcut — it sends a media file to INT as a new source document intake. It does not attach files directly to entries. Nothing enters the archive without INT provenance.

**Why this rule exists:**

An image that is relevant to both Convergence and Lineage must not be siloed to one page entry. It needs INT intake so confirmed\_targets can route it to all relevant sections cleanly. Direct attachment bypasses that routing and creates a cross-mapping dead end. The button exists to make INT intake frictionless — not to circumvent it.

**What the button does:**

1\. Opens a lightweight media intake form  
2\. User selects file (image · audio · document · other)  
3\. File and basic metadata submitted to INT as a new source document  
   with doc\_type matching the file type  
4\. INT intake sequence begins — file receives provenance, parsing,  
   confirmed\_targets routing, and retirement in the normal sequence  
5\. Deposits from that media file route to confirmed target pages  
   through INT — not directly from the upload point

**Button placement:**

Dropdown on every page. Consistent position and label across all pages. Does not replace or interfere with the page's primary deposit flow. It is an entry point to INT, not a page-level function.

**PLANNED:** exact UI spec — dropdown position, label, form fields, file type handling, and INT handoff implementation. Defined here as a required feature. Built in Svelte Archives page component.

---

## **SEQUENCES**

### **RETIREMENT WRITE SEQUENCE — strict order**

Fires at INT retirement completion. INT owns the retirement sequence and calls into ARV at this point.

1. Receive retirement data: root\_ref, provenance\_summary (six sections complete),
   confirmed\_targets, deposit statistics (total\_deposits, confirmed, skipped,
   lifetime\_deferrals), retired\_at.
2. Validate provenance\_summary completeness — all six sections non-null. Reject
   if any missing. No write occurs.
3. Write PostgreSQL archives record: id (ARC stamp), root\_ref, provenance\_summary,
   confirmed\_targets, total\_deposits, confirmed, skipped, lifetime\_deferrals,
   retired\_at. page\_deposit\_id null at this point.
4. Write Archives page deposit entry drawn from provenance\_summary content.
   Entry fields: title, arc\_id, retired\_at, doc\_type, section='archives',
   type='archive\_record', status='sealed'.
5. Write page\_deposit\_id on PostgreSQL archives record with the deposit entry id
   returned from step 4.
6. Return ARC id and page\_deposit\_id to INT for retirement label assembly.

Failure at step 2: retirement rejected. No write occurs. INT retirement halts.
Failure at step 3: PostgreSQL write failure. No archives record created. Re-initiation
  by INT required.
Failure at step 4: Archives page deposit not created. PostgreSQL archives record exists
  with page\_deposit\_id null. Recovery: re-run from step 4 only — PostgreSQL record is
  already written.
Failure at step 5: page\_deposit\_id write fails. Both surfaces exist but are not
  linked by the pointer field. Guard: page\_deposit\_id null on a PostgreSQL archives
  record with a retired\_at timestamp is a visible recovery signal — resolvable
  by querying Archives deposits for matching arc\_id.

### **MEDIA INTAKE TRIGGER SEQUENCE**

1. User opens media intake form from dropdown on any page.
2. User selects file and submits.
3. File and metadata routed to INT as a new source document intake with
   doc\_type matching the file type.
4. INT intake sequence begins.

Failure at step 3: form submission fails. No INT record created. User notified.
  No partial state written.

---

## **NEXUS FEED**

Archives feeds three pages. What makes Archives a distinct nexus source is epistemic weight — sealed records are authenticated and fixed. Nexus pages reading from Archives are reading from the most verified layer of the system.

**Pattern Convergence (PCV · 50\)**

Reads from Archives as authenticated structural data. When PCV aligns cross-domain signals on shared axes, sealed archive records carry more weight than provisional entries. A pattern that appears in both live entries and sealed archive records is structurally confirmed, not just emergent.

**Liber Novus (LNV · 47\)**

Receives Archives outputs as part of the consolidated surface. Sealed records arriving on LNV carry their provenance intact — arc\_id, retired\_at, source origin, confirmed routing. LNV holds them without editorializing.

**RCT (38)**

Archives feeds RCT with fixed relational configurations. RCT reads sealed archive records as the stable reference layer against which current relational configurations are measured. What is archived is what the system was confident enough to seal — that confidence is the data RCT needs.

---

## **PUBLIC API**

**ARV.activateSection(sectionId) → void**
Activates the ARV section in the UI. Called on section navigation.

**ARV.writeArchiveDeposit(archivesRecord) → Promise\<string\>**
Creates the Archives page deposit entry drawn from provenance\_summary content.
Called by INT at step 4 of the retirement write sequence, after the PostgreSQL archives
record is written. Returns the deposit entry id. INT writes this id to
page\_deposit\_id on the PostgreSQL archives record at step 5.

---

## **KNOWN FAILURE MODES**

**1\. page\_deposit\_id not written after retirement** PostgreSQL archives record has no pointer to the browsable surface. The three surfaces are linked only by ARC id — no direct machine-readable join between PostgreSQL record and page deposit. Downstream reads that expect page\_deposit\_id will find null. Guard: page\_deposit\_id is written in the same retirement transaction after the Archives page deposit is confirmed created. It is never left null after a successful retirement.

**2\. Archives page deposit written before PostgreSQL record is created** page\_deposit\_id references an entry that exists before the PostgreSQL record does. Write sequence inverts. page\_deposit\_id cannot be written to the PostgreSQL record because the record does not exist yet. Guard: PostgreSQL archives record is always created first (retirement step 6). Archives page deposit is written second. page\_deposit\_id written third. Sequence is non-negotiable.

**3\. Sealed entry modified after retirement** A sealed record is updated — status changed, body edited, fields overwritten. The ledger no longer reflects what actually happened at retirement. Guard: entries with status `sealed` are read-only in the UI. No edit function is exposed on sealed entries. The FastAPI service layer enforces this at the update layer — updates to sealed entries are rejected.

**4\. Media file uploaded directly to a page entry** File bypasses INT. No provenance. No confirmed\_targets. Cross-mapping impossible. The file exists on one entry in one section with no routing record. Guard: no direct file attachment path exists on content page entries. The only upload path is the media intake trigger, which routes to INT. If a direct attachment mechanism is ever added for other purposes, it must be explicitly scoped to non-source-document file types.

**5\. Archives page deposit missing one of the six provenance sections** The deposit is incomplete. Future models reading the record cannot assess parsing confidence. The signal weight and routing distribution are absent. Guard: provenance\_summary completeness is validated at retirement step 5\. All six sections must be present before retirement continues. The Archives page deposit is drawn from a complete provenance\_summary or it is not written.

---

## **FILES**

| File | Role | Status |
| ----- | ----- | ----- |
| `backend/services/entry.py` | PostgreSQL archives table — record creation, page\_deposit\_id write, sealed entry enforcement | PLANNED |
| `frontend/ (Archives page)` | Svelte — Archives page render, media intake trigger dropdown, sealed entry display | PLANNED |

