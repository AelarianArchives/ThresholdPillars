# SYSTEM: Metamorphosis

## /DESIGN/Systems/Metamorphosis/

### Two-pass synthesis layer · engine output reading · Finding production

---

## WHAT THIS SYSTEM OWNS

* Synthesis cycle — the full MTM operation from engine output read through Finding production
* Two Claude API calls — Pass 1 (engine hypothesis via synthesis directive) and Pass 2 (deposit verification via anti-confirmation bias directive). System prompt received from DNR as parameter, synthesis directives appended by MTM.
* Engine output reading — pulling computed pattern data from all five Axis engine services at synthesis time. Pull, not push. MTM reads when DNR triggers it.
* Synthesis threshold filter — patterns must exceed MTM_SYNTHESIS_THRESHOLD (1.2x baseline ratio) to enter the Pass 1 payload. Patterns below this are excluded.
* Selection Function — two-mode deposit resolution between Pass 1 and Pass 2. Mode 1: convergence resolution (deposit_ids from engine pattern weight_breakdowns). Mode 2: gap resolution (deposits in anchor window not contributing to flagged patterns, from engine's indexed set).
* Finding production — extracting verdicts and open questions from Pass 2 response, creating Finding records with four finding_types (confirmed, complicated, overturned, open_question)
* Open question lifecycle — tracking resolution of open_question Findings across subsequent synthesis sessions. New verdicts create new Findings; old open_question records receive resolved/resolved_by/resolved_at updates. Immutability preserved.
* Content fingerprinting — generating and writing the content_fingerprint on every Finding record. Three-dimension hash: finding_type + load_bearing_patterns + deposit_evidence.
* Deduplication check on retry — comparing candidate Findings against prior session Findings before writing or routing anything
* synthesis_sessions PostgreSQL table — record creation, per-phase timestamps, pass_1_brief storage, engine/pattern/deposit counts, typed finding counts, prompt versions
* findings PostgreSQL table — record creation, provenance chain, fingerprint write, open question lifecycle fields, lnv_routing_status tracking
* LNV routing handoff — assembling the result object returned to DNR. MTM's responsibility ends there.

## WHAT THIS SYSTEM DOES NOT OWN

* Receives no deposits — synthesis only. A deposit routed to MTM is a routing error.
* Lens page deposit writing — owned by their respective sections (THR · STR · INF · ECR · SNM)
* Engine computation — owned by individual engine services (Tier 3). MTM reads computed outputs; it does not trigger or own the computation.
* PostgreSQL reads of raw deposit data — owned by FastAPI service layer (backend/services/)
* LNV deposit writing — owned by LNV
* Routine orchestration and trigger — owned by DNR. MTM never calls itself. DNR calls MTM.
* lnv_routing_status and lnv_deposit_id writes after LNV receipt — DNR triggers the FastAPI service layer to write these. MTM does not.
* Witness Scroll — WSC is sovereign. MTM has no relationship to it.
* Tag pipeline — owned by tagger service
* Routing authority — owned by SOT
* Findings content after handoff — once the result object is returned to DNR, MTM does not track what LNV does with what it received

---

## THE TWO-PASS ARCHITECTURE

MTM synthesizes in two passes at session close. This architecture exists because
synthesis from raw deposits directly cannot distinguish pattern from noise at
scale. The engines (Tier 3) have already done the statistical work — baselines,
co-occurrence rates, significance testing. MTM reads at the pattern level, then
verifies against the deposit level.

**Pass 1 — Engine Layer:**
MTM reads computed outputs from all five Axis engines simultaneously. A
synthesis threshold filter (1.2x baseline ratio) excludes weak patterns. Claude
receives engine frame (one-sentence orientation per engine) plus filtered
pattern-level results (observed rate, expected rate, ratio, weight breakdown,
null contribution, contributing deposit_ids). Claude produces a Synthesis Brief
— convergences across engines and declared gaps (absences, divergences,
asymmetries). The Brief is a hypothesis, not a finding.

**Selection Function:**
Between passes. Resolves targeted deposits from the Brief. Mode 1 resolves
deposit_ids directly from the engine pattern weight_breakdowns that produced
convergences. Mode 2 resolves deposits in the gap's reference anchor window that
did NOT contribute to any flagged pattern — the evidence the engines held but
didn't elevate. Source set is the engine's indexed set (same dataset as Pass 1's
baseline), not full page deposits.

**Pass 2 — Verification Layer:**
Claude receives the Synthesis Brief plus targeted deposits only. No engine
frame, no filtered patterns. The Brief is the hypothesis; the deposits are the
evidence. Claude produces verdicts (confirmed, complicated, overturned) and
open questions. Overturning a hypothesis is the highest-value output.

Each verdict and each open question becomes a Finding. Four finding_types.
Full provenance chain on every Finding: which patterns were load-bearing, which
deposits supported or contradicted, which prompt versions were active.

**Why two passes instead of one:** A single pass reading raw deposits produces
synthesis that cannot distinguish signal from noise — it has no baselines, no
statistical context. A single pass reading engine outputs produces synthesis
that has no ground truth — it builds on computed abstractions without checking
them against evidence. Two passes give MTM both: pattern-level synthesis
(what's converging across engines) and evidence-level verification (do the
raw deposits actually support this).

Full mechanical spec — synthesis sequence, Selection Function details,
fingerprinting algorithm, store definitions, result object shape, failure modes
— in METAMORPHOSIS SCHEMA.md.

---

## TRIGGER DEFINITION

MTM fires as Step 1 of the Daily Nexus Routine only.

DNR triggers the MTM synthesis endpoint (POST /mtm/synthesize) and awaits its
resolution before proceeding to Step 2. POST /mtm/synthesize is the sole public
entry point. Everything inside MTM is internal to that call.

MTM never calls itself. There is no scheduled trigger, no deposit event trigger,
no internal retry. All retry logic lives in DNR. MTM receives a call, runs, and
returns a result object. That is its complete contract with the outside world.

---

## LNV HANDOFF

MTM produces Findings and writes them to the findings PostgreSQL table. It then
returns the result object to DNR. DNR owns routing to LNV — MTM does not write
to LNV directly.

After LNV confirms receipt of each Finding, DNR triggers the FastAPI service
layer to write lnv_routing_status → deposited and lnv_deposit_id on each
findings record. MTM does not own or trigger these writes.

Pattern Convergence (PCV · 50) reads MTM Findings as pre-processed input. PCV
does not receive Findings directly from MTM — it reads from what LNV holds
after the DNR handoff completes.

---

## MTM PROVENANCE FILTER

MTM-generated Findings can enter PCV as hypotheses (mtm_provenance = true). If
MTM's synthesis payload ever includes PCV state, MTM would read its own prior
output as independent evidence — a confirmation loop. The provenance filter
ensures any PCV data in MTM's payload flags mtm_provenance hypotheses as
downstream outputs, not independent sources. This constraint is specified now
so the loop cannot be introduced accidentally when MTM's input scope expands.

---

## KNOWN LIMITATIONS

**Semantic deduplication is not performed.**

The content fingerprint guarantees structural deduplication — the same finding
type, source patterns, and deposit evidence producing the same finding won't
write twice. It does not guarantee semantic deduplication — if Claude selects
different deposits to support the same insight on retry, the fingerprint
diverges and both findings write.

This is a deliberate tradeoff. Semantic deduplication would require comparing
finding content, which introduces interpretation into what should be a mechanical
process. LNV surfaces both findings. Sage resolves semantic overlap through the
research record, not the pipeline.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| backend/services/mtm.py | MTM synthesis service — engine output reading, synthesis threshold filter, Pass 1 + Pass 2 Claude API calls, Selection Function, Finding validation, content fingerprinting, deduplication, open question lifecycle, synthesis_sessions and findings PostgreSQL writes, result object assembly | PLANNED |
| backend/routes/mtm.py | FastAPI MTM endpoint — POST /mtm/synthesize trigger, result object response | PLANNED |

All mechanical specs — synthesis sequence, result object shape, fingerprinting
algorithm, deduplication check, store definitions, Claude API call structure,
Finding validation criteria, failure modes, public API — in METAMORPHOSIS
SCHEMA.md.
