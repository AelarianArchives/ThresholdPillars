PAGE LAYOUTS — Master Reference
/DESIGN/Systems/PAGE_LAYOUTS.md

LEGACY CONTAMINATION NOTE (session 33, 2026-04-09):
This file was organized by a "page type system" (Gateway, Lens, Synthesis,
Engine, Output, Scroll, Investigation, Domain) that introduced secondary
names competing with canonical page names and pre-decided layouts by
category. That system was ROT — removed from all active specs in session 33.
This file's contents below the note are STALE and will be deleted and
rebuilt by Sage as per-page layout specs using canonical names only.

Visual layout specification for all 52 pages + Home + Observatory.
Defines what's shared, what changes per page, and what's unique
per page. Source for frontend build (step 4) and SOT.

Created: 2026-04-09

---

## MIR (38) — Chiral Mechanics

**Layout:** Two-panel

**Left panel:** Field pattern display with bilateral structure overlay.
Deposits selected for investigation shown with bilateral symmetry indicators —
which elements correspond across the axis of symmetry, which break it.
Symmetry axis visible. Chirality direction annotated where present.

**Right panel:** Symmetry analysis results from ARTIS.
- bilateral_symmetry_score output: score value, input specification,
  scoring formula documented, symmetry axis used
- parity_analysis output: parameter values explicit, observed vs expected
  parity behavior
- pearson_correlation output: coefficient, p-value, sample size,
  confidence interval
- chi2_contingency output: chi-squared statistic, degrees of freedom,
  p-value

**Signature component:** MirrorSymmetryDisplay — bilateral structure mapping
with explicit scoring. Shows the symmetry/asymmetry structure of the
selected field pattern. Identity owned by MIR page; layout by MPL.

**Finding placement:** Inline indicator on deposit card ("N findings") +
separate findings panel below the two-panel display. Both surfaces active.

**Findings panel:** All findings for the current session's investigation,
filterable by status, framework, and deposit. MIR findings card uses the
shared FindingCard.svelte four-zone layout.

