# RESEARCH ASSISTANT HYPOTHESIS FRAMING

## /DESIGN/Systems/Research_Assistant/

### Hypothesis detection · framework naming · falsification check · computation handoff

---

## PURPOSE

Defines the sequence that moves a researcher's scientific intuition
into a structured computation suggestion without deciding whether the
correspondence holds. That is what the computation is for.

This is a methodological sequence, not a feature. The assistant
translates between field-native and scientific language. Every
behavioral rule in this document is load-bearing for scientific
integrity. A system that only surfaces confirming evidence is
confirmation bias with a good UI.

---

## OWNERSHIP BOUNDARIES

**This spec owns:**
* The hypothesis framing sequence (Steps 0 through 7)
* Hypothesis detection — distinguishing hypothesis-shaped language
  from observation-shaped language
* Hypothesis type sensing — structural, mechanistic, analogical
* Archive retrieval for framing — two-pass (supporting + contradicting)
* Prior computation check — preventing redundant runs
* Framework candidate naming — mapping intuition to scientific framework
* Falsification check — both outcomes articulable before handoff
* Corpus adequacy assessment — honest naming of thin data
* computation_suggestion shape — the typed object produced by this
  sequence

**This spec does not own:**
* Computation execution — ARTIS owns all computation. The assistant
  produces a computation_suggestion; ARTIS runs it
* ARTIS computation library — which computations exist, their
  parameters, their output shapes. Owned by ARTIS (ART·40)
* Science ping pipeline — Layers 1-2-3 are ARTIS infrastructure.
  This spec produces suggestions that feed into the same computation
  engine but through a different entry path (researcher-initiated
  vs tag-triggered)
* Cosmology page ownership — which page owns which framework is
  defined in the Tier 5 design. This spec reads those assignments;
  it does not make them
* RAG pipeline mechanics — RESEARCH ASSISTANT ARCHIVE ACCESS.md
  owns query assembly and retrieval. This spec calls the pipeline
  at Step 2
* Observation articulation — RESEARCH ASSISTANT OBSERVATION
  ARTICULATION.md owns the noticing-to-deposit sequence. Hypothesis
  framing is a different sequence with a different entry signal
* Deposit creation — INT is the gateway. computation_suggestion
  routes to ARTIS, not INT
* Cosmology findings schema — owned by the Cosmology findings
  design (Tier 5). This spec references findings; it does not
  define their shape

---

## THE HYPOTHESIS FRAMING SEQUENCE

### Step 0 — Hypothesis detection

The assistant detects hypothesis-shaped language. Distinguished from
observation language by directionality:

* **Hypothesis language points outward** toward a framework:
  "this looks like," "this reminds me of," "I think there's a
  pattern here," "could this be X?"
* **Observation language points inward** toward a noticing:
  "I noticed," "that's weird," "something happened"

When hypothesis-shaped language is detected, this sequence begins.
When observation-shaped language is detected, the Observation
Articulation sequence begins. The two do not overlap — if the
assistant is uncertain, it asks: "Are you noticing something, or
do you have a hunch about what it might be?"

### Step 1 — Hypothesis type sensing

The assistant senses which type of hypothesis Sage is forming.
This determines the articulation path.

**Structural correspondence**
The pattern maps to a known mathematical or statistical structure.

> "The tag co-occurrence follows a power law"
> "The distribution looks normal around this threshold"

Proceed directly to Step 2. The framework is already named or
nearly named.

**Mechanistic correspondence**
The pattern maps to a known physical or dynamic mechanism.

> "The coupling strengthens after threshold exactly like
> phase-locking"
> "This decay looks exponential, like a half-life"

Proceed directly to Step 2. The mechanism is identified.

**Analogical intuition**
The pattern reminds Sage of a scientific concept but the
correspondence is not yet specified.

> "This feels like entropy somehow"
> "There's something Fibonacci about this"

Lightweight articulation pass before proceeding. One question:

> "What specifically feels like [X] to you?"

This sharpens the intuition before the assistant names a framework.
A loose analogy mapped to a precise computation produces noise.
One question. Then proceed to Step 2.

### Step 2 — Archive retrieval (full picture, not just support)

The assistant retrieves deposits relevant to the pattern Sage is
describing. Two passes via the RAG pipeline. Both are required.

**Pass A — Supporting evidence**

What in the archive supports this intuition? Deposits, prior
observations, engine outputs that align with the pattern Sage is
seeing.

If supporting evidence is thin or absent, named explicitly:

> "I don't find strong archive grounding for this yet. The
> computation would be working from a thin corpus — worth noting."

This is information, not a block. Sage decides whether to proceed.

**Pass B — Contradicting evidence (load-bearing)**

What in the archive points in a different direction? MTM findings,
Cosmology findings, prior observations that conflict with the
pattern Sage is describing.

If found, surfaced BEFORE framework naming:

> "Before we frame this — there's a finding from [page/session]
> that points in a different direction. Do you want to look at
> that first?"

**Rules for Pass B:**
* Not a block. Sage decides whether to hold both, investigate the
  contradiction, or proceed
* Surfaced before the framework is named so it can inform the
  framing, not contradict it after the fact
* If no contradicting evidence is found, nothing is surfaced. The
  absence of contradiction is not confirmation — it just means
  the archive doesn't contain a counterpoint yet
* Contradicting findings are carried on the computation_suggestion
  as contradicting_findings — they travel with the computation
  so ARTIS and Sage both see the full picture

**Why both passes are required:**
A retrieval pipeline that only surfaces confirming evidence is
confirmation bias with infrastructure. Pass B is the architectural
defense. It is not optional. It is not a "nice to have."

### Step 3 — Prior computation check

Before suggesting a new computation, the assistant checks whether
this correspondence has already been investigated.

**Match criteria:** Same framework + overlapping deposit set =
prior run. The match does not need to be exact — substantial
overlap in the input deposits with the same computation type is
sufficient.

If found:

> "This may have been investigated before — [finding reference].
> The result was [summary]. Do you want to run it again on a
> different deposit set, or build on the existing finding?"

**The distinction the assistant holds:**
* Running the same computation on the same data produces nothing
  new. That is not investigation — it is repetition
* Running it on a grown corpus is legitimate — the archive has
  more data now, and the result may differ
* Building on an existing finding (extending, comparing, combining
  with new evidence) is different from re-running

If no prior computation is found, proceed to Step 4. The
prior_computation_ref field on the suggestion stays null.

### Step 4 — Framework candidate naming

The assistant names the scientific framework that fits Sage's
intuition.

**What is named:**
* The primary scientific framework candidate
* Which Cosmology page owns it (e.g., "This maps to Fourier
  analysis — that's HCO·34")
* Which specific ARTIS computation applies

**Multi-framework check:**
The assistant always checks whether the pattern shows
characteristics of more than one framework:

> "Does this also show [secondary framework] characteristics?"

If yes, both are named. The multi_domain_flag is set to true on
the computation_suggestion. Multi-domain presence is often the
most interesting finding — the layering is the signal.

**Candidate confidence — honest plain language:**

The assistant states its confidence in the framework match. This
is not an enum — it is honest assessment in plain language.

* **Strong:** "The pattern matches core properties closely. This
  is worth running."
* **Partial:** "Some properties match, some don't. The computation
  will tell you which parts hold."
* **Weak:** "This is a loose correspondence. The computation might
  still be informative but hold the hypothesis lightly."

Confidence is the assistant's assessment of the framework fit, not
of whether the hypothesis is true. The computation determines truth.
Confidence determines how tightly the framework maps to what Sage
described.

### Step 5 — Falsification check (load-bearing)

Before handoff, the assistant must articulate both outcomes of the
proposed computation:

* **What the computation shows if the hypothesis holds** — the
  positive outcome. What the data looks like when the framework
  fits
* **What the computation shows if it doesn't** — the negative
  outcome. What the data looks like when the framework does not
  fit

Both are written onto the computation_suggestion as
positive_outcome and negative_outcome.

**If the assistant cannot articulate the negative outcome:**

> "I can describe a positive result but not a negative one — the
> hypothesis may need sharpening before we run this."

This is a hold, not a block. Sage may be able to articulate the
negative outcome herself. Or the hypothesis may genuinely need
sharpening. The assistant names the gap and waits.

**Why this step is non-negotiable:**
A computation whose negative outcome is undefined is not a test.
It is confirmation-seeking with extra steps. If you cannot describe
what failure looks like, you cannot distinguish success from noise.
This is basic scientific methodology — the assistant enforces it
structurally.

### Step 6 — Corpus adequacy check

Before handoff, the assistant assesses whether the deposit corpus
is sufficient for a meaningful result.

**Assessment based on:**
* Number of input deposits matching the pattern
* Diversity of deposits (all from one session vs spread across
  many)
* Deposit quality — high tag weight entries carry more signal

**If thin:**

> "The computation is valid but the corpus for this pattern is
> thin — [n] deposits. The result will be indicative at best.
> Worth running as a baseline, but hold the finding lightly until
> the corpus grows."

**What this reframes:**
Not "run and conclude" but "run and establish a baseline to return
to." A thin-corpus result is a stake in the ground, not a finding.
The distinction matters for how much weight the result carries
downstream.

The corpus_note travels on the computation_suggestion object so
ARTIS and Sage both see it. It is not discarded after the
conversation — it is metadata on the computation request.

### Step 7 — Computation handoff

The assistant produces the computation_suggestion object and routes
it to ARTIS.

**What the assistant does:**
* Assembles the typed computation_suggestion from Steps 1-6
* Presents it to Sage for review
* On confirmation, routes to ARTIS via the appropriate endpoint

**What the assistant does not do:**
* Execute the computation — ARTIS owns execution
* Interpret results beyond what the computation produces — the
  assistant can describe results in plain language, but analysis
  and finding classification belong to ARTIS and the Cosmology
  pages
* Suggest follow-up computations unprompted — if the result is
  interesting, Sage initiates the next question

---

## COMPUTATION SUGGESTION SHAPE

The typed object produced by the hypothesis framing sequence. This
is what Sage reviews before confirming handoff to ARTIS.

```
computation_suggestion:
  pattern_description:      string        — what Sage observed
  hypothesis_type:          string        — structural | mechanistic |
                                            analogical
  framework_candidate:      string        — primary framework
  framework_secondary:      string | null — if multi-domain present
  cosmology_page:           string        — which page owns this
  artis_computation:        string        — which computation type
  input_deposits:           string[]      — deposit_ids to run on
  rationale:                string        — why this computation fits
  candidate_confidence:     string        — honest plain language
  positive_outcome:         string        — result if hypothesis holds
  negative_outcome:         string        — result if it doesn't
  corpus_note:              string | null — if corpus is thin,
                                            how thin, what it means
  contradicting_findings:   string[]      — finding refs that conflict,
                                            empty if none
  prior_computation_ref:    string | null — if already investigated
  multi_domain_flag:        boolean       — true if secondary framework
```

---

## NON-NEGOTIABLE BEHAVIORAL RULES

These are not guidelines. Each is a scientific integrity boundary.

1. **The assistant translates. It does not conclude.** The
   computation determines whether the hypothesis holds. The
   assistant maps intuition to framework — it does not judge
   the hypothesis.

2. **Counter-evidence surfaces before confirming evidence is built
   on.** Pass B runs before framework naming. Contradicting
   findings are visible at every step after retrieval.

3. **Prior computations are checked before new ones are suggested.**
   Redundant computation produces nothing. Growing-corpus re-runs
   are legitimate. The assistant holds the distinction.

4. **Both outcomes — positive and negative — must be articulable
   before handoff.** A computation whose failure mode is undefined
   is not a test.

5. **Corpus adequacy is assessed honestly.** Thin corpus is named,
   not hidden. The result is reframed as baseline, not finding.

6. **The assistant never executes computations.** It assembles the
   case and hands off to ARTIS.

7. **Multi-domain presence is always checked.** The layering is
   often the finding.

---

## RELATIONSHIP TO OTHER SEQUENCES

**Observation articulation → Hypothesis framing:**
An observation (doc_type: observation) may later become the basis
for a hypothesis. Sage returns to a deposited observation and says
"I think this is actually [framework]." The hypothesis framing
sequence begins at Step 0 with the observation as input context.

**Hypothesis framing → ARTIS:**
The computation_suggestion routes to ARTIS. ARTIS executes the
computation, produces findings. Findings are classified by the
Cosmology page that owns the framework.

**Hypothesis framing → Observation articulation:**
During framing, Sage may notice something new that isn't a
hypothesis — an observation embedded in the investigation. The
assistant detects the shift and offers to capture it via the
observation articulation sequence before returning to framing.

**Hypothesis framing → Archive access:**
Step 2 calls the RAG pipeline (RESEARCH ASSISTANT ARCHIVE ACCESS)
for both supporting and contradicting evidence retrieval. Step 3
queries for prior computations.

---

## FAILURE BEHAVIOR

**RAG unavailable at Step 2:**
Both retrieval passes fail. The assistant names the gap:
"I can't check the archive right now — retrieval is down. We can
frame the hypothesis, but I won't be able to show you supporting
or contradicting evidence until retrieval recovers."
The sequence can continue — the computation_suggestion will have
empty contradicting_findings and the candidate_confidence should
reflect the missing evidence context.

**ARTIS computation type not found at Step 4:**
The framework maps to a computation that doesn't exist in the
ARTIS library. The assistant names it:
"This maps to [framework] but I don't see a matching computation
in ARTIS. This might need a new computation type — want to note
this for the ARTIS design?"
The suggestion can still be assembled as a record of the
hypothesis, even if execution is not yet possible.

**Prior computation check fails (query error):**
Proceed without it. prior_computation_ref stays null. The risk is
suggesting a redundant computation — not a data integrity issue,
just a waste of compute time. Name the skip.

**Falsification check fails (assistant cannot articulate negative):**
This is not a system failure — it is a signal that the hypothesis
needs sharpening. Handled in Step 5 directly. The sequence pauses,
not crashes.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| backend/services/rag.py | RAG pipeline — Step 2 retrieval (supporting + contradicting) | PLANNED |
| backend/services/claude.py | Claude API client — framing calls via research_assistant agent | LIVE |
| backend/routes/artis.py | ARTIS endpoints — computation handoff target | PLANNED |
| frontend hypothesis framing components | Svelte UI — computation suggestion review, confirm/discard | PLANNED |
