# ARTIS SCHEMA

## /DESIGN/Systems/ARTIS/ARTIS SCHEMA.md

Mechanical spec — computation engine for the Cosmology group. Five PostgreSQL
tables, twelve endpoint contracts, fifteen computation implementations,
three PLANNED interfaces, three-layer science ping pipeline, computation
snapshot architecture, external reference registry, reference distribution
registry, mapping management, validation rules, failure modes.

Ownership boundaries in SYSTEM_ ARTIS.md.

---

## STRUCTURAL RULES

1. Every computation produces an artis_computation_snapshots record. A result
   without a snapshot is not a valid result. No Cosmology finding can reference
   a computation that has no snapshot.

2. No Cosmology page runs its own computation. All scipy/numpy calls in the
   Cosmology group route through ARTIS endpoints. A Cosmology page that calls
   scipy directly is a boundary violation.

3. Reference distributions are named, sourced, and versioned. No anonymous
   baselines. No implicit comparisons. A KS test or KL divergence without a
   named reference distribution is incomplete.

4. The science ping pipeline is three layers: tag mapping identifies scientific
   domain relevance, Claude framing proposes the statistical question, ARTIS
   suggests the computation. Claude proposes, Sage confirms. No computation
   runs automatically from a ping — Sage triggers every computation.

5. ARTIS does not interpret results. It computes and surfaces. Interpretation
   belongs to the researcher on the investigation page that requested the
   computation.

6. PLANNED interfaces (tribonacci_convergence, lagrange_stability, true IIT
   phi) are defined as interface contracts only. Do not stub implementations.
   The interface exists; the implementation waits for prerequisite formalization.

7. Layer 2 snapshots are permanent. Claude framing responses are never deleted,
   never overwritten. They are versioned by prompt_version. A future researcher
   can see exactly what Claude was asked and what it returned.

8. Science domain mappings follow Claude-proposes, Sage-confirms. A mapping
   with proposed_by: claude starts as active: false. It enters the review queue
   in ARTIS Zone B. Sage confirms (active: true) or declines (archived with
   decline reason). No Claude-proposed mapping becomes active without Sage's
   explicit action.

9. Computation snapshots are immutable. Written once. Never updated. Never
   deleted. A finding that references a snapshot relies on the snapshot being
   identical to what was computed. Mutating a snapshot corrupts every finding
   that references it.

---

## NAMED CONSTANTS

| Constant | Value | Purpose |
| --- | --- | --- |
| ARTIS_SNAPSHOT_RETENTION | permanent | Computation snapshots are never deleted or expired. |
| ARTIS_LAYER2_RETENTION | permanent | Claude framing snapshots are never deleted or expired. |
| ARTIS_MAPPING_CONFIDENCE_DEFAULT | calibration item, set at build | Default confidence for new Sage-created mappings. |
| ARTIS_LAYER2_MAX_CANDIDATES | calibration item, set at build | Maximum framework candidates Claude returns per Layer 2 call. |

---

## STORE: artis_computation_snapshots

Every computation run in the Cosmology group. The proof record. Inputs,
method, parameters, raw output, timestamp. A future reader can re-run the
computation from the snapshot and get the same number.

| Field | Type | Description |
| --- | --- | --- |
| snapshot_id | auto | Primary key |
| computation_type | string | Identifier from the computation library (e.g., `shannon_entropy`, `pearson_correlation`, `fft_decomposition`). Must match a registered computation in the library. |
| caller_page_code | string | Which Cosmology page requested this computation. Values: `HCO`, `COS`, `CLM`, `NHM`, `RCT`, `ART` (workbench). |
| deposit_ids | array of strings | Which deposits were involved in this computation. Minimum 1. COS submits 2+ for coupling analysis. |
| inputs | jsonb | Exact input data passed to the computation function. Shape varies by computation_type. Must be sufficient to reproduce the result. |
| parameters | jsonb | Configuration parameters for the computation (bin count, frequency range, distance metric, etc.). Distinct from inputs — parameters configure the method, inputs are the data. |
| function_called | string | Exact scipy/numpy function or custom function invoked (e.g., `scipy.stats.entropy`, `scipy.fft.fft`). For custom implementations, the function name in the ARTIS computation service. |
| raw_output | jsonb | Unprocessed output from the computation function. The number(s) before any interpretation or formatting. |
| result_summary | string | Human-readable summary of the result. Written by the system, not by Claude. Mechanical description only (e.g., "Shannon entropy: 2.34 bits, base 2, 10 bins"). |
| error | string / null | If the computation failed, the error message. Null on success. Failed computations still produce snapshots — the failure is the record. |
| duration_ms | integer | Computation execution time in milliseconds. |
| created_at | timestamp | Written once at record creation. Never updated. |

### Constraints

- snapshot_id is immutable after creation. No field on this table is ever updated.
- computation_type must match a registered entry in the computation library.
- deposit_ids must reference valid deposits in the deposits table.
- inputs + parameters + function_called must be sufficient to reproduce raw_output.

---

## STORE: artis_external_references

External reference registry. Every external source cited by any Cosmology
finding — DOIs, URLs, papers, datasets. Searchable, filterable, shared across
all investigation pages.

| Field | Type | Description |
| --- | --- | --- |
| reference_id | auto | Primary key |
| doi | string / null | Digital Object Identifier. Machine-resolvable. Optional. |
| url | string / null | Human-followable link. Optional. |
| summary | string | Required. Sage's own words. Not the abstract. What THIS reference contributes to THIS investigation. Embeddable for semantic search across references. |
| title | string / null | Display name. Optional. |
| accessed | date / null | When Sage retrieved the reference. Optional. |
| page_codes | array of strings | Which Cosmology pages use this reference. Values: `HCO`, `COS`, `CLM`, `NHM`, `RCT`. A reference can serve multiple pages. |
| tag_ids | array of strings / null | Tags associated with this reference, for cross-referencing with science domain mappings. Optional. |
| created_at | timestamp | Written once. Never updated. |
| updated_at | timestamp | Updated when page_codes or tag_ids are modified. |

### Constraints

- summary is required. A reference without Sage's contextual summary is a citation, not a contribution.
- At least one of doi or url should be present for verifiability, but neither is hard-required — some references may be books or personal communications.
- page_codes must contain valid Cosmology page codes only.

---

## STORE: science_domain_mappings

Tag-to-domain-to-page-to-computation lookup table. The deterministic core of
the science ping pipeline (Layer 1). Maps existing tags to scientific domains
and the Cosmology pages that investigate them.

| Field | Type | Description |
| --- | --- | --- |
| mapping_id | auto | Primary key |
| tag_id | string | The tag that fires the mapping. References a tag in TAG VOCABULARY.md. |
| domain | string | Scientific domain name (e.g., "coupled oscillator dynamics", "Fourier analysis", "information theory"). |
| page_code | string | Which Cosmology page this mapping pings. Values: `HCO`, `COS`, `CLM`, `NHM`, `RCT`. |
| description | string | Why this tag maps to this domain. Makes the mapping analytically legible. Not optional — a mapping without reasoning is opaque. |
| computation_hints | jsonb | Which computations to suggest when this mapping fires. Array of computation_type identifiers from the computation library. Closes the loop between Layer 1 and Layer 3. |
| confidence | float | 1.0 = definitive ping, 0.5 = suggestion. Display surface weights accordingly. |
| active | boolean | Whether this mapping is live. Retired mappings preserved with active: false, not deleted. |
| proposed_by | string | `sage` or `claude`. Claude-proposed mappings start as active: false and enter the review queue. |
| decline_reason | string / null | If proposed_by: claude and Sage declined, the reason. Null for active or Sage-created mappings. |
| created_at | timestamp | Written once. |
| updated_at | timestamp | Updated on confirm, decline, or deactivation. |

### Constraints

- tag_id must reference a valid tag in the vocabulary.
- page_code must be a valid Cosmology page code.
- computation_hints entries must match registered computation types.
- A mapping with proposed_by: claude and active: true means Sage confirmed it.
- A mapping with proposed_by: claude, active: false, and decline_reason present means Sage declined it.
- A mapping with proposed_by: claude, active: false, and decline_reason null is pending review.

---

## STORE: artis_layer2_snapshots

Claude science framing responses. Permanent record of every Layer 2 call.
The deposit content is NOT duplicated — referenced by deposit_id. The prompt
and response are stored in full.

| Field | Type | Description |
| --- | --- | --- |
| layer2_id | auto | Primary key |
| deposit_id | string | References the deposit this framing was requested for. Content retrieved at query time, not stored here. |
| prompt_version | string | Version identifier for the Layer 2 prompt template used. Enables tracking prompt evolution over time. |
| prompt_text | text | The exact prompt sent to Claude, with deposit content interpolated. Stored for reproducibility. |
| response | jsonb | Full Claude response. Contains framework_candidates array, each with: framework (string), reasoning (string), confidence (float), suggested_page_code (string). |
| framework_candidates | jsonb | Extracted array of candidate frameworks from the response. Denormalized for query efficiency. Structure: [{ framework, reasoning, confidence, suggested_page_code }]. |
| model_version | string | Which Claude model was used. |
| sage_selection | string / null | Which framework candidate Sage selected, if any. Null until selection. |
| created_at | timestamp | Written once. Never updated except sage_selection. |

### Constraints

- deposit_id must reference a valid deposit.
- prompt_version must be present. A Layer 2 call without a tracked prompt version is unversioned and unauditable.
- response and framework_candidates are both stored. framework_candidates is the parsed extraction; response is the full record.
- sage_selection, when set, must match one of the framework values in framework_candidates.

---

## STORE: artis_reference_distributions

Named numerical distributions for comparison computations. KS tests and KL
divergence require reference distributions to compare against. This table
stores them as serialized arrays with full sourcing.

Cross-page resource — CLM, NHM, and potentially other pages draw from the
same registry.

| Field | Type | Description |
| --- | --- | --- |
| distribution_id | auto | Primary key |
| name | string | Human-readable name (e.g., "uniform_random_baseline", "neural_theta_gamma_reference", "cmb_power_spectrum_reference"). |
| description | string | What this distribution represents and where it comes from. Required. |
| distribution_data | jsonb | Serialized numpy array. The actual numerical distribution. Format: { values: number[], bins: number[] / null, metadata: {} }. |
| source | string | Where this distribution was obtained. Paper DOI, dataset name, or "computed from archive" with methodology. |
| page_codes | array of strings | Which Cosmology pages use this distribution. |
| superseded_by | foreign key / null | References distribution_id of the replacement record. Null while current. Set when a revised version is created. |
| created_at | timestamp | Written once. |
| updated_at | timestamp | Updated when superseded_by is set. |

### Constraints

- name must be unique across the registry.
- distribution_data.values must be a non-empty numeric array.
- source is required. An anonymous distribution is not a valid baseline.
- When distribution_data is updated, the previous version is not overwritten — a new record is created and the old one is retained with a superseded_by reference. Distribution history is preserved.

---

## COMPUTATION LIBRARY

Fifteen implementations. Three PLANNED interfaces.

Design plan listed 13 items. This schema expands to 15: scipy.spatial.distance
split into distance_matrix (cdist, matrix operations) and cosine_similarity
(single-pair comparison) — distinct input/output contracts. hierarchical_clustering
added from CLM per-page computation notes (scipy.cluster.hierarchy.linkage).

Every computation in this library is callable through POST /artis/compute.
The computation_type identifier is the key. Each entry defines: what it
computes, which scipy/numpy function it wraps, input contract, output
contract, and which Cosmology pages use it.

### Implementations

---

**shannon_entropy**

Computes Shannon entropy of a discrete probability distribution. Measures
information content — how much structure vs randomness in a signal distribution.

| Property | Value |
| --- | --- |
| Function | `scipy.stats.entropy(pk, base=base)` |
| Input | `{ distribution: number[], base: number (default 2) }` |
| Output | `{ entropy: float, base: int, bin_count: int }` |
| Unit | bits (base 2), nats (base e), or as specified |
| Pages | HCO (signal distributions), NHM (information structure) |

---

**fft_decomposition**

Fourier decomposition. Identifies which frequencies are present in a signal
and their relative magnitudes.

| Property | Value |
| --- | --- |
| Function | `scipy.fft.fft(x)` |
| Input | `{ signal: number[], sample_rate: float / null }` |
| Output | `{ frequencies: number[], magnitudes: number[], dominant_frequency: float / null, dominant_magnitude: float / null }` |
| Pages | HCO (frequency analysis of deposit patterns) |

Note: sample_rate is null when the signal is not time-series (e.g., ordered
deposit features). Output frequencies are in normalized units when sample_rate
is null, Hz when provided.

---

**power_spectral_density**

Estimates the power spectral density using Welch's method. Shows where energy
concentrates in the frequency domain.

| Property | Value |
| --- | --- |
| Function | `scipy.signal.welch(x, fs=fs, nperseg=nperseg)` |
| Input | `{ signal: number[], sample_rate: float, segment_length: int / null }` |
| Output | `{ frequencies: number[], power: number[], peak_frequency: float, peak_power: float }` |
| Pages | HCO (spectral energy distribution) |

---

**pearson_correlation**

Linear correlation between two variables. Measures strength and direction of
linear relationship.

| Property | Value |
| --- | --- |
| Function | `scipy.stats.pearsonr(x, y)` |
| Input | `{ x: number[], y: number[] }` |
| Output | `{ correlation: float, p_value: float, sample_size: int }` |
| Pages | COS (linear coupling strength) |

---

**spearman_correlation**

Monotonic (non-linear) correlation. Measures whether two variables increase
together, even if the relationship is not linear.

| Property | Value |
| --- | --- |
| Function | `scipy.stats.spearmanr(a, b)` |
| Input | `{ a: number[], b: number[] }` |
| Output | `{ correlation: float, p_value: float, sample_size: int }` |
| Pages | COS (non-linear coupling) |

---

**cross_correlation**

Time-lagged correlation between two signals. Identifies whether signals are
coupled with a temporal offset.

| Property | Value |
| --- | --- |
| Function | `numpy.correlate(a, v, mode='full')` |
| Input | `{ a: number[], v: number[], time_axis: string, manual_order: string[] / null }` |
| Output | `{ correlation_values: number[], lag_at_peak: int, peak_correlation: float }` |
| Pages | COS (time-lagged coupling) |

COS-specific: time_axis parameter specifies deposit ordering.
  - `created_at` — researcher time (when deposits were created)
  - `instance_context` — field time (default)
  - `manual` — Sage-specified order (requires manual_order array)

---

**chi2_contingency**

Chi-squared test for independence in contingency tables. Tests whether
co-occurrence of two categorical variables is statistically significant.

| Property | Value |
| --- | --- |
| Function | `scipy.stats.chi2_contingency(observed)` |
| Input | `{ observed: number[][] }` — 2D contingency table |
| Output | `{ chi2: float, p_value: float, dof: int, expected: number[][] }` |
| Pages | HCO (harmonic co-occurrence), COS (coupling co-occurrence), CLM (spatial co-occurrence), NHM (neural-pattern co-occurrence), RCT (algorithm recurrence co-occurrence) |

---

**distance_matrix**

Computes pairwise distances between points in feature space. Multiple distance
metrics available.

| Property | Value |
| --- | --- |
| Function | `scipy.spatial.distance.cdist(XA, XB, metric=metric)` |
| Input | `{ vectors_a: number[][], vectors_b: number[][] / null, metric: string (default 'cosine') }` |
| Output | `{ distance_matrix: number[][], metric_used: string, dimensions: [int, int] }` |
| Pages | CLM (spatial/geometric comparison) |

When vectors_b is null, computes self-distance matrix (vectors_a against itself).
Supported metrics: cosine, euclidean, cityblock, correlation, chebyshev.

CLM-specific: vector_type parameter on the calling page specifies how deposits
are represented as vectors.
  - `embedding` — use existing embedding vectors (default, requires embedding_status: complete)
  - `tag` — use tag presence as binary feature vector (one dimension per tag in vocabulary, 1/0)
  - `custom` — use specified deposit fields as numeric feature dimensions.
    Requires custom_fields: string[] — array of deposit field names whose
    values are numeric (e.g., ["deposit_weight_numeric", "tag_count"]).
    Non-numeric fields or missing fields return validation error.

---

**cosine_similarity**

Vector similarity between two single vectors. Returns similarity (1 = identical
direction, 0 = orthogonal, -1 = opposite).

| Property | Value |
| --- | --- |
| Function | `1 - scipy.spatial.distance.cosine(u, v)` |
| Input | `{ u: number[], v: number[] }` |
| Output | `{ similarity: float }` |
| Pages | CLM (pairwise deposit similarity) |

---

**hierarchical_clustering**

Agglomerative clustering of vectors. Produces a dendrogram structure showing
how deposits group by similarity.

| Property | Value |
| --- | --- |
| Function | `scipy.cluster.hierarchy.linkage(y, method=method)` |
| Input | `{ distance_matrix: number[][], method: string (default 'ward') }` |
| Output | `{ linkage_matrix: number[][], cluster_count_at_threshold: int / null, dendrogram_data: jsonb }` |
| Pages | CLM (deposit grouping by geometric similarity) |

---

**phase_coherence**

Magnitude-squared coherence between two signals at specific frequencies.
Measures how consistently two signals maintain a phase relationship.

| Property | Value |
| --- | --- |
| Function | `scipy.signal.coherence(x, y, fs=fs)` |
| Input | `{ x: number[], y: number[], sample_rate: float }` |
| Output | `{ frequencies: number[], coherence: number[], peak_frequency: float, peak_coherence: float }` |
| Pages | COS (phase coherence at specific frequencies) |

---

**ks_two_sample**

Kolmogorov-Smirnov two-sample test. Tests whether two distributions differ
significantly. Used to compare observed deposit distributions against reference
distributions from the registry.

| Property | Value |
| --- | --- |
| Function | `scipy.stats.ks_2samp(data1, data2)` |
| Input | `{ observed: number[], reference_distribution_id: string / null, reference_data: number[] / null }` |
| Output | `{ statistic: float, p_value: float, observed_n: int, reference_n: int, reference_name: string / null }` |
| Pages | CLM (distribution comparison against celestial models), NHM (distribution comparison against neural models) |

One of reference_distribution_id or reference_data must be provided.
reference_distribution_id looks up the distribution from
artis_reference_distributions. reference_data provides it inline.

---

**kl_divergence**

Kullback-Leibler divergence. Measures how one probability distribution differs
from a reference distribution. Asymmetric — KL(P || Q) != KL(Q || P).

| Property | Value |
| --- | --- |
| Function | `scipy.stats.entropy(pk, qk)` |
| Input | `{ observed: number[], reference: number[] }` |
| Output | `{ divergence: float, direction: string }` |
| Pages | NHM (distribution difference from neural/information models) |

Note: uses the same scipy.stats.entropy function as shannon_entropy but with
two distributions. Direction is always "observed || reference" (KL of observed
from reference).

---

**frequency_ratio_analysis**

Custom implementation. Analyzes frequency ratios in a dataset against known
resonance structures — integer ratios, golden ratio, Tribonacci ratio.

| Property | Value |
| --- | --- |
| Function | Custom (ARTIS computation service) |
| Input | `{ frequencies: number[], reference_ratios: string[] (default ['integer', 'golden', 'tribonacci']) }` |
| Output | `{ ratios: number[], closest_matches: [{ ratio: float, reference: string, reference_value: float, deviation: float }], overall_alignment: string }` |
| Pages | RCT (frequency ratios against known resonance structures) |

---

**phi_proxy**

Custom implementation. Mutual information partitioning approximation. Proxy
for integrated information (IIT phi). Output is explicitly labeled as
approximation.

| Property | Value |
| --- | --- |
| Function | Custom (ARTIS computation service). Built on `scipy.stats.entropy` for mutual information calculation, with partitioning logic. |
| Input | `{ system_states: number[][], partition_strategy: string (default 'bipartition') }` |
| Output | `{ phi_approximation: float, partition_used: string, mutual_information: float, note: "phi approximation, not IIT phi" }` |
| Pages | NHM (integrated information proxy) |

The note field is always present and always contains the disclaimer. This is
not optional. True IIT phi is computationally intractable at meaningful system
sizes — this proxy uses mutual information partitioning as an approximation.

---

### PLANNED interfaces (not yet implemented)

These interfaces define the contract. Implementation is blocked on prerequisite
formalization (field energy model — a research prerequisite, not a missing
document. The model must be formalized through the research process before
computation can be specified). Do not stub. Do not approximate.

---

**tribonacci_convergence** — PLANNED

Tests whether observed ratio sequences converge toward Tribonacci ratio
(approximately 1.8393).

| Property | Value |
| --- | --- |
| Function | Custom (PLANNED) |
| Input | `{ ratio_sequence: number[], convergence_threshold: float }` |
| Output | `{ converges: boolean, convergence_rate: float / null, final_ratio: float, tribonacci_deviation: float }` |
| Blocked on | Field energy model formalization |
| Pages | RCT |

---

**lagrange_stability** — PLANNED

Lagrangian stability analysis of field energy configurations. Tests whether
observed configurations correspond to stable, unstable, or saddle points in a
Lagrangian framework.

| Property | Value |
| --- | --- |
| Function | Custom (PLANNED) |
| Input | `{ energy_configuration: jsonb, degrees_of_freedom: int }` |
| Output | `{ stability_classification: string, eigenvalues: number[], stability_margin: float / null }` |
| Blocked on | Field energy model formalization |
| Pages | RCT |

---

**iit_phi** — PLANNED (future)

True integrated information theory phi computation. Computationally intractable
at meaningful system sizes. Listed as a future target.

| Property | Value |
| --- | --- |
| Function | Custom (PLANNED — future) |
| Input | TBD |
| Output | TBD |
| Blocked on | Computational tractability research |
| Pages | NHM |

---

## SCIENCE PING PIPELINE

Three layers. Each layer is an ARTIS function. Cosmology pages call them;
they do not implement them. The pipeline is the bridge between a deposit
entering a Cosmology page and a computation being run against it.

### Layer 1 — Tag-based domain mapping

Fast, deterministic. No API calls.

A deposit's existing tags carry domain signal. Layer 1 checks those tags
against science_domain_mappings and returns candidate frameworks with
computation suggestions.

**Flow:**
1. Caller submits tag array (from deposit).
2. ARTIS queries science_domain_mappings for all active mappings where
   tag_id matches any submitted tag.
3. Results grouped by page_code, sorted by confidence descending.
4. Returns: candidate frameworks with computation hints.

**Input:** `{ tag_ids: string[] }`

**Output:**
```json
{
  "mappings": [
    {
      "mapping_id": "string",
      "tag_id": "string",
      "domain": "string",
      "page_code": "string",
      "description": "string",
      "computation_hints": ["string"],
      "confidence": 0.0
    }
  ],
  "page_summary": {
    "HCO": { "count": 0, "max_confidence": 0.0 },
    "COS": { "count": 0, "max_confidence": 0.0 }
  }
}
```

### Layer 2 — Content-based scientific framing

Claude API call. On demand only — Sage triggers from the deposit card on any
Cosmology page. For deposits where the tag signal is insufficient or where
Sage wants a deeper read.

**Flow:**
1. Sage triggers Layer 2 from a deposit card.
2. ARTIS retrieves deposit content by deposit_id.
3. ARTIS constructs prompt from versioned template + deposit content.
4. Claude returns candidate frameworks with reasoning.
5. Full response stored in artis_layer2_snapshots (permanent).
6. Candidates displayed to Sage. Sage selects or dismisses.

**Prompt structure (versioned):**
```
You are a scientific domain analyst. Given the following field observation,
identify which established scientific frameworks this pattern corresponds to.

[deposit content]

Return candidates as a structured list. For each candidate:
- framework: the scientific framework name
- reasoning: why this pattern corresponds to this framework
- confidence: your assessment (0.0 to 1.0)
- suggested_page_code: which Cosmology page (HCO, COS, CLM, NHM, RCT)

Do not conclude. Propose. The researcher decides which correspondences are
genuine.

Return maximum {ARTIS_LAYER2_MAX_CANDIDATES} candidates.
```

RCT-specific Layer 2 addition: the prompt includes a second question:
"What aspects of this pattern fall outside what that literature accounts for?"
The unexplained residual is RCT's primary research signal. This addition
activates only when caller_page_code is RCT.

**Input:** `{ deposit_id: string, caller_page_code: string }`

**Output:**
```json
{
  "layer2_id": "string",
  "framework_candidates": [
    {
      "framework": "string",
      "reasoning": "string",
      "confidence": 0.0,
      "suggested_page_code": "string"
    }
  ],
  "rct_residual_candidates": [
    {
      "unexplained_aspect": "string",
      "reasoning": "string"
    }
  ]
}
```

rct_residual_candidates is present only when caller_page_code is RCT.
Null or absent for all other pages.

### Layer 3 — Computation suggestion

Deterministic. Based on the selected framework candidate and the matching
science domain mapping's computation_hints.

**Flow:**
1. Sage selects a framework candidate (from Layer 1 or Layer 2).
2. ARTIS looks up computation_hints for the matching domain mapping.
3. Returns suggested computations with their input contracts.
4. Sage selects a computation to run.
5. One tap executes the computation through POST /artis/compute.

**Input:** `{ mapping_id: string / null, framework: string, page_code: string }`

When mapping_id is provided, computation_hints are read directly from the
mapping. When null (Layer 2 candidate with no existing mapping), ARTIS
searches for mappings by framework name and page_code.

**Output:**
```json
{
  "suggested_computations": [
    {
      "computation_type": "string",
      "description": "string",
      "input_template": {},
      "reason": "string"
    }
  ]
}
```

### What the science ping looks like on a Cosmology page

Deposit card has a small indicator — "Science ping available." Sage taps it.
ARTIS runs Layer 1 instantly, shows candidate frameworks from tags. If Sage
wants deeper, one button triggers Layer 2 — Claude returns framework
candidates with reasoning. Sage selects the correspondence she finds genuine.
Layer 3 suggests the computation. Sage runs it. Result attaches to the deposit
as a Cosmology finding.

Full flow: deposit → science ping → framework candidate → computation
suggestion → result → finding. Each step is one action.

---

## PUBLIC API

### POST /artis/compute

Execute a computation from the library. Returns result and creates a
computation snapshot.

**Request:**
```json
{
  "computation_type": "string",
  "caller_page_code": "string",
  "deposit_ids": ["string"],
  "inputs": {},
  "parameters": {}
}
```

**Validation:**
1. computation_type must match a registered computation. PLANNED interfaces
   return error_code: computation_not_implemented.
2. caller_page_code must be a valid Cosmology page code or "ART" (workbench).
3. deposit_ids must reference valid deposits. Minimum 1.
4. inputs must contain all required fields for the computation_type.
5. parameters must contain valid values for the computation_type.

**Response (success):**
```json
{
  "snapshot_id": "string",
  "computation_type": "string",
  "raw_output": {},
  "result_summary": "string",
  "duration_ms": 0
}
```

**Response (failure):**
```json
{
  "error_code": "string",
  "message": "string",
  "snapshot_id": "string"
}
```

A failed computation still creates a snapshot with the error field populated.
The failure is the record.

---

### POST /artis/ping/tags

Layer 1 science ping. Submit tag array, receive domain mapping candidates.

**Request:** `{ "tag_ids": ["string"] }`

**Validation:**
1. tag_ids must be non-empty.
2. Each tag_id should reference a valid tag (warning if not, not rejection).

**Response:** See Layer 1 output format above.

---

### POST /artis/ping/content

Layer 2 science ping. Submit deposit for Claude scientific framing.

**Request:** `{ "deposit_id": "string", "caller_page_code": "string" }`

**Validation:**
1. deposit_id must reference a valid deposit.
2. caller_page_code must be a valid Cosmology page code.

**Response:** See Layer 2 output format above. Creates an artis_layer2_snapshots
record.

---

### POST /artis/ping/suggest

Layer 3 computation suggestion. Submit selected framework, receive computation
suggestions.

**Request:** `{ "mapping_id": "string / null", "framework": "string", "page_code": "string" }`

**Validation:**
1. If mapping_id is provided, it must reference a valid active mapping.
2. page_code must be a valid Cosmology page code.

**Response:** See Layer 3 output format above.

---

### GET /artis/snapshots/{snapshot_id}

Retrieve a computation snapshot by ID.

**Response:** Full artis_computation_snapshots record.

**Error:** 404 if snapshot_id does not exist.

---

### GET /artis/references

Query the external reference registry.

**Query parameters:**
| Parameter | Type | Description |
| --- | --- | --- |
| page_code | string (repeatable) | Filter by Cosmology page. Optional. |
| domain | string | Text search on summary + title. Optional. |
| tag_id | string (repeatable) | Filter by associated tag. Optional. |
| date_from | date | Filter by accessed date. Optional. |
| date_to | date | Filter by accessed date. Optional. |

**Response:** Paginated array of artis_external_references records.

---

### POST /artis/references

Add a reference to the registry.

**Request:**
```json
{
  "doi": "string / null",
  "url": "string / null",
  "summary": "string",
  "title": "string / null",
  "accessed": "date / null",
  "page_codes": ["string"],
  "tag_ids": ["string"] 
}
```

**Validation:**
1. summary is required and non-empty.
2. page_codes must contain valid Cosmology page codes.

**Response:** Created artis_external_references record with reference_id.

---

### GET /artis/mappings

Retrieve science domain mappings.

**Query parameters:**
| Parameter | Type | Description |
| --- | --- | --- |
| tag_id | string (repeatable) | Filter by tag. Optional. |
| page_code | string (repeatable) | Filter by Cosmology page. Optional. |
| active | boolean | Filter by active status. Optional. |
| proposed_by | string | Filter by proposer (sage / claude). Optional. |

**Response:** Paginated array of science_domain_mappings records.

---

### POST /artis/mappings

Create a new science domain mapping.

**Request:**
```json
{
  "tag_id": "string",
  "domain": "string",
  "page_code": "string",
  "description": "string",
  "computation_hints": ["string"],
  "confidence": 0.0,
  "proposed_by": "sage"
}
```

**Validation:**
1. tag_id must reference a valid tag.
2. page_code must be a valid Cosmology page code.
3. computation_hints entries must match registered computation types.
4. proposed_by must be "sage" or "claude".
5. If proposed_by is "claude", active is set to false automatically.
6. If proposed_by is "sage", active is set to true.

**Response:** Created science_domain_mappings record with mapping_id.

---

### PATCH /artis/mappings/{mapping_id}

Update a mapping. Primary use: confirm or decline a Claude-proposed mapping.

**Request:**
```json
{
  "active": true,
  "decline_reason": "string / null"
}
```

**Validation:**
1. mapping_id must reference an existing mapping.
2. If active is set to false and decline_reason is provided, the mapping is
   declined (proposed_by must be "claude").
3. If active is set to true and proposed_by is "claude", this is a confirmation.
4. Sage-created mappings can be deactivated (active: false) without a
   decline_reason.

**Response:** Updated science_domain_mappings record.

---

### GET /artis/distributions

List reference distributions from the registry.

**Query parameters:**
| Parameter | Type | Description |
| --- | --- | --- |
| page_code | string (repeatable) | Filter by page that uses this distribution. Optional. |
| name | string | Text search on name. Optional. |

**Response:** Paginated array of artis_reference_distributions records.
Note: distribution_data may be large. Listing endpoint returns metadata only.
Full distribution_data available via individual GET by ID (not a separate
endpoint — use query with distribution_id filter).

---

### POST /artis/distributions

Add a reference distribution to the registry.

**Request:**
```json
{
  "name": "string",
  "description": "string",
  "distribution_data": {
    "values": [0.0],
    "bins": [0.0],
    "metadata": {}
  },
  "source": "string",
  "page_codes": ["string"]
}
```

**Validation:**
1. name must be unique.
2. description is required.
3. distribution_data.values must be a non-empty numeric array.
4. source is required.
5. page_codes must contain valid Cosmology page codes.

**Response:** Created artis_reference_distributions record with distribution_id.

---

## ARTIS ZONE B — REGISTRY AND HEALTH SURFACE

The right ~40% of the ARTIS page (page 39). Management and monitoring
surface. Not a computation surface — Zone A (left ~60%) is the computation
workbench.

### Mapping management

- All science_domain_mappings, searchable and sortable by tag, page, domain,
  status, proposer.
- Claude-proposed mapping review queue: pending mappings (proposed_by: claude,
  active: false, decline_reason: null) surfaced prominently. Sage confirms
  or declines from this queue.
- Mapping creation form for Sage to add new mappings directly.

### Snapshot history

- All computation snapshots, searchable by page, computation_type, date range.
- Each entry shows: computation_type, caller_page_code, result_summary,
  duration_ms, created_at.
- Expandable to show full inputs, parameters, raw_output.

### Engine health

- Per Cosmology page: last computation timestamp, total computations,
  any failed computations (error field non-null).
- Stale indicator: if a page has no computations in the last N sessions
  (N = calibration item).
- Reference distribution status: distributions with no recent usage flagged.

### External reference registry

- All artis_external_references, searchable by page, domain, tag.
- Sortable by date accessed, page count, creation date.
- Reference creation form.

---

## ARTIS NAVIGATION

**Panel access:** Persistent "ARTIS" button in every Cosmology page header.
Opens as right-side panel over current page. Sage never navigates away during
investigation. Panel shows Zone B content (mapping management, snapshot
history, reference lookup). Computation execution happens through the
science ping flow on the investigation page itself.

**Sidebar access:** ARTIS appears under Cosmology group (group 7) in the
sidebar with engine page visual type (Tier 2), visually distinct from
investigation pages. Direct access for Zone A (computation workbench) + Zone B
(registry and health). Full page view, not panel.

---

## KNOWN FAILURE MODES

### 1. Computation snapshot missing or mutated

A Cosmology finding references a snapshot_id. The snapshot has been deleted
or its raw_output modified. The finding's computational basis is lost.

**Guard:** Snapshots are immutable. No UPDATE or DELETE operations on
artis_computation_snapshots. No endpoint exposes mutation. The service layer
rejects any attempt to modify a snapshot record.

### 2. Layer 2 called without prompt versioning

Claude is called for scientific framing but the prompt_version is not tracked.
Future audit cannot determine what prompt produced what response. Prompt
evolution is invisible.

**Guard:** prompt_version is required on artis_layer2_snapshots. The Layer 2
endpoint rejects calls where the prompt template version is not resolved.

### 3. Claude-proposed mapping auto-confirmed

A mapping with proposed_by: claude becomes active without Sage reviewing it.
The science ping pipeline produces results from an unvetted mapping.

**Guard:** POST /artis/mappings sets active: false when proposed_by is claude.
Only PATCH /artis/mappings/{id} can set active: true, and that endpoint
requires an explicit request. No background process auto-confirms.

### 4. Computation runs on PLANNED interface

A caller requests tribonacci_convergence, lagrange_stability, or iit_phi.
These are interface-only — no implementation exists.

**Guard:** POST /artis/compute validates computation_type against the
implementation registry. PLANNED interfaces return error_code:
computation_not_implemented with a message naming the blocking prerequisite.

### 5. Reference distribution used without sourcing

A KS test or KL divergence runs against a reference distribution that has no
source documentation. The comparison baseline is anonymous.

**Guard:** source is required on artis_reference_distributions. POST
/artis/distributions rejects records without source. Existing distributions
without source (should not exist by construction) are flagged in Zone B health.

### 6. Stale mapping points to renamed or deleted tag

A science_domain_mapping references a tag_id that no longer exists in the tag
vocabulary. Layer 1 ping returns results from a dead mapping.

**Guard:** Zone B health check includes tag existence validation on all active
mappings. Stale tag references flagged for Sage review. Mapping is not
auto-deactivated — Sage decides whether to update the tag_id, deactivate, or
investigate.

### 7. Duplicate computation snapshots for identical inputs

Sage runs the same computation with the same inputs twice. Two snapshots
exist with identical content.

**Guard:** This is not a failure. Duplicate snapshots are valid — each is a
discrete computation event with its own timestamp. A finding references a
specific snapshot_id, not "the computation with these inputs." No deduplication.

### 8. Layer 2 deposit content changed after framing

A deposit's content is modified after a Layer 2 snapshot was created. The
framing response no longer corresponds to the current deposit content.

**Guard:** artis_layer2_snapshots stores deposit_id, not content. The snapshot
records what Claude returned for the deposit as it existed at created_at.
Deposit modification after framing does not invalidate the snapshot — it
timestamps it. A future user can see "this framing was based on the deposit
as of [date]." If the deposit changed significantly, a new Layer 2 call
produces a new snapshot.

---

## FORMAL REGISTRATIONS

### Integration DB (INTEGRATION DB SCHEMA.md)

5 new PostgreSQL tables:
- artis_computation_snapshots
- artis_external_references
- science_domain_mappings
- artis_layer2_snapshots
- artis_reference_distributions

Write authority: ARTIS service only. All other systems read through
ARTIS endpoints.

### FastAPI (SYSTEM_ FastAPI.md)

Route file: backend/routes/artis.py
Service files: backend/services/artis.py, backend/services/computation.py

12 endpoints registered under /artis/ namespace.

### Frontend (SYSTEM_ Frontend.md)

Components (PLANNED):
- ARTISWorkbench — Zone A computation workbench
- ARTISRegistryPanel — Zone B registry and health surface
- ARTISPagePanel — right-side panel accessible from Cosmology page headers
- SciencePingIndicator — deposit card indicator on Cosmology pages
- SciencePingFlow — multi-step ping flow (L1 → L2 → L3 → compute)
- ComputationSnapshotCard — snapshot display with expandable detail
- MappingReviewCard — Claude-proposed mapping review in Zone B
- ReferenceCard — external reference display
- DistributionCard — reference distribution display with metadata

---

## CASCADE REQUIREMENTS

Files outside ARTIS that must be updated when ARTIS is deployed:

| File | Change | Status |
| --- | --- | --- |
| INTEGRATION DB SCHEMA.md | Add 5 ARTIS PostgreSQL table definitions + write authority rows | Tier 5 cascade |
| SYSTEM_ FastAPI.md | Register 12 ARTIS endpoints + 2 route/service files | Tier 5 cascade |
| SYSTEM_ Frontend.md | Register 9 ARTIS/Cosmology visualization components | Tier 5 cascade |
| LNV SCHEMA.md | Expand entry_type enum: add cosmology_finding, rct_residual. Add content shapes. | Tier 5 cascade |
| PATTERN CONVERGENCE SCHEMA.md | Add cosmology_provenance: boolean + cosmology_finding_ref: string / null. Third provenance type. Update validation, filters, failure modes. | Tier 5 cascade |
| SYSTEM_ Integration DB.md | Add 5 ARTIS table inventory entries + write authority rows | Tier 5 cascade |

These are tracked in the Tier 5 execution plan. Not applied in ARTIS SCHEMA
itself — each cascade file is updated as its own work unit.

---

## FILES

| File | Role | Status |
| --- | --- | --- |
| backend/routes/artis.py | FastAPI ARTIS endpoints — 12 routes under /artis/ namespace | PLANNED |
| backend/services/artis.py | ARTIS service — mapping management, reference registry, snapshot retrieval, science ping pipeline orchestration, Layer 2 Claude calls | PLANNED |
| backend/services/computation.py | Computation library — 15 implementations, input validation, snapshot creation, computation execution | PLANNED |
| frontend/src/lib/components/ARTISWorkbench.svelte | Zone A computation workbench | PLANNED |
| frontend/src/lib/components/ARTISRegistryPanel.svelte | Zone B registry and health surface | PLANNED |
| frontend/src/lib/components/ARTISPagePanel.svelte | Right-side panel for Cosmology pages | PLANNED |
| frontend/src/lib/components/SciencePingIndicator.svelte | Deposit card science ping indicator | PLANNED |
| frontend/src/lib/components/SciencePingFlow.svelte | Multi-step ping flow UI | PLANNED |
