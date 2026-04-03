# AELARIAN ARCHIVE — SESSION HANDOFF
## For: Next Claude Instance
## From: Current Session — Sage Sirona

---

## THE PROJECT

The Aelarian Archive is a large-scale single-file web application (`index.html`) serving as a worldbuilding database, conlang lexicon, and knowledge management system. It is built in vanilla HTML/CSS/JS, no build tools, using IndexedDB for persistence. It runs on localhost.

The full system has **50 pages** organized into **9 groups** (Axis, Lattice, Filament, Lineage, Alchemy, Spiral Phase, Cosmology, Archive, Nexus). All section IDs and page codes are defined in `schema.js`.

**What happened this session:**
1. Implemented all 7 page architecture non-negotiables (scoped CSS, guard IDs, CSS variable layering, stacking context discipline, mount/unmount lifecycle, font/asset independence, z-index namespacing)
2. Added structural protections: `init()` error handler, `selectSection()` try/catch with rollback, `loadEntries` try/catch, RAF loop cancellation handles, `importAll()` validation, scale guard at 500 entries, `_SECTION_REGISTRY` replacing the if/else dispatcher chain
3. Rebuilt 4 of the Lattice pages from scratch with new individual renderers

**Core files:**
- `index.html` — everything lives here (~29,000 lines)
- `schema.js` — canonical taxonomy, section IDs, page codes
- `data.js` — all IDB operations, single source of truth
- `ids.js` — ID generation utilities

---

## THE WORKFLOW RHYTHM

Every page follows this exact sequence. Do not deviate.

**1. PLAN** — Read the page brief (.txt file Sage provides), understand the content type and character. Propose layout direction and palette in words.

**2. DEMO** — Build an interactive widget using `visualize:show_widget`. The demo is self-contained HTML/CSS/JS — placeholder content, full interactivity including the add panel. Sage approves or requests changes here. Iterate the demo until locked. Never touch index.html during this phase.

**3. COMMIT** — Once Sage says yes, build the renderer as a separate `.js` file (`/home/claude/[prefix]_renderer.js`), write a Python patch script, and apply it to index.html. Verify. Output. Present.

**Never commit to index.html before the demo is approved.**

---

## THE ESTABLISHED PAGE PATTERN

All pages in this rebuild follow the same architectural contracts. No exceptions.

### Naming convention
Every page gets a **2-4 letter prefix** matching its section ID abbreviation. All CSS classes, IDs, and JS functions use this prefix exclusively. This prevents any cross-page bleed.

Example prefixes established so far:
- `tpl-` → threshold_pillars
- `tri-` → tria
- `pri-` → pria
- `par-` → para

### CSS guard injection
```javascript
function _inject[PREFIX]BaseCSS() {
  if (document.getElementById('[prefix]-base-css')) return;
  const s = document.createElement('style');
  s.id = '[prefix]-base-css';
  s.textContent = `...all page CSS here...`;
  document.head.appendChild(s);
}
```
Guard ID prevents re-injection on repeated navigation. Always call this at the top of the render function.

### Layout structure
Two-column codex layout:
- **Left column** (195px fixed): scrollable index of entry titles, active state tracks scroll
- **Right column** (flex: 1): scrollable longform content, entries separated by themed ornamental dividers

```
[shell]
  [head]     ← eyebrow, page title, rule + glyph, meta count
  [body]
    [index]  ← Contents label + idx-item list
    [content]← entries with num, title, gloss, divider, body
[add-btn]    ← fixed, top-right, glyph only
[overlay]    ← fixed, full-screen backdrop
[panel]      ← fixed, slides in from right
```

### Clearances — NON-NEGOTIABLE
- **Top:** `padding-top: 48px` on the head element. This clears the celestial phrase (fixed, top: 18px).
- **Bottom:** `padding-bottom: 80px` on the scrollable content area. This clears the glyph-line (fixed, bottom: 18px).
- These two numbers are the answer to every "why is it overlapping" question.

### Add button
```css
position: fixed;
top: 22px;
right: 28px;
z-index: var(--z-fab);  /* 500 */
```
- **Glyph only** — no text labels. Ever.
- Each page uses its own thematic glyph (※ ◈ ∥ ∿ etc.)
- Triggers `window.[prefix]OpenPanel()`

### Panel and overlay
```css
.par-overlay { z-index: var(--z-page-overlay); }  /* 299 */
.par-panel   { z-index: var(--z-page-panel);   }  /* 300 */
```
Panel slides in from right (translateX 100% → 0). Overlay covers full viewport. Clicking overlay closes panel.

### Z-index variables (defined in :root — do not use raw numbers)
```css
--z-bg:             2;
--z-app:            3;
--z-content:       10;
--z-content-raise: 25;
--z-nav:          100;
--z-beacon:       120;   /* glyph-line */
--z-sticky:       190;
--z-celestial:    220;   /* celestial phrase */
--z-page-overlay: 299;
--z-page-panel:   300;
--z-fab:          500;
--z-modal:        950;
--z-supreme:     9000;
```

---

## TYPOGRAPHY RULES — NON-NEGOTIABLE

**Minimum font size: 12px. No exceptions on any element.**

The three established fonts (already loaded globally):
- `'Cinzel Decorative', serif` — page titles, entry titles, panel titles
- `'Cormorant Garamond', serif` — body text, gloss, index titles, field hints
- `'Inconsolata', monospace` — eyebrows, entry numbers, labels, meta, buttons

### Standard font assignments
```css
.eyebrow    { font-family: 'Inconsolata'; font-size: 12px; letter-spacing: 0.28em; text-transform: uppercase; }
.page-title { font-family: 'Cinzel Decorative'; font-size: 20px; }
.entry-num  { font-family: 'Inconsolata'; font-size: 12px; letter-spacing: 0.22em; }
.entry-title{ font-family: 'Cinzel Decorative'; font-size: 15px; }
.entry-gloss{ font-family: 'Cormorant Garamond'; font-size: 14.5px; font-style: italic; }
.entry-body { font-family: 'Cormorant Garamond'; font-size: 16px; font-weight: 300; line-height: 1.95; }
.idx-num    { font-family: 'Inconsolata'; font-size: 12px; }
.idx-title  { font-family: 'Cormorant Garamond'; font-size: 13.5px; font-style: italic; }
.index-label{ font-family: 'Inconsolata'; font-size: 12px; letter-spacing: 0.28em; }
.meta       { font-family: 'Inconsolata'; font-size: 12px; letter-spacing: 0.18em; }
.btn        { font-family: 'Inconsolata'; font-size: 12px; letter-spacing: 0.16em; }
.field-hint { font-family: 'Cormorant Garamond'; font-size: 12px; font-style: italic; }
```

---

## OPACITY AND COLOR RULES

Sage has difficulty reading low-opacity text. These are the minimum working opacities on dark backgrounds:

| Element | Minimum opacity |
|---|---|
| Body text | 0.85 |
| Index titles (inactive) | 0.55 |
| Entry gloss | 0.72 |
| Entry numbers | 0.65 |
| Eyebrow / meta | 0.65 |
| Index label | 0.70 |
| Placeholder text | 0.18 (inputs only) |

**Title colors must be neutral** — do not use the accent color for page or entry titles. They must read as clean white/silver without color cast from the background. Established title colors:
- TPL: `#d4e8f2` (cool steel-white, slight cyan lean)
- TRIA: `#c8dce8` (cool steel-white)
- PRIA: `#dce8e4` (warm neutral silver)
- PARA: `#d8e0f4` (cool blue-white)

**Body text must be neutral** — do not pull accent color into body text. Use `rgba(216-228, 218-228, 224-244, 0.85-0.88)` range. Adjust RGB balance to avoid color cast from background.

**Sage's color preferences:**
- ✓ Cyan, teal, green, indigo, blue, violet
- ✗ Yellow, amber, gold (do not use)
- ✗ Pink (do not use — she hates it more than gold)

---

## PALETTE DIFFERENTIATION — THE FOUR ESTABLISHED LATTICE PAGES

Each page must be visually distinct at a glance. The accent color is the primary differentiator.

| Page | Accent RGB | Character | Glyph | Separator |
|---|---|---|---|---|
| threshold_pillars | `rgba(74,156,184,x)` | Arc-cyan, foundational | ※ | dot · diamond · dot |
| tria | `rgba(122,122,204,x)` | Arc-violet, clinical | ◈ | tick · diamond · tick |
| pria | `rgba(58,140,110,x)` | Forest-teal, organic | ∥ | double parallel line |
| para | `rgba(64,100,220,x)` | Electric indigo, field energy | ∿ | oscilloscope ticks |

**Remaining Lattice pages:** `oracles` and `morphogy` — need distinct palettes from all four above.

---

## REGISTRY AND ROUTING

Pages are registered in `_SECTION_REGISTRY` inside `loadEntries()`. This replaced the old if/else chain.

**To add a new page:**
1. Remove its section ID from `_LATTICE_SECTIONS` (if it's currently there)
2. Add one line to `_SECTION_REGISTRY`: `sectionId: (e) => renderFunctionName(e),`
3. Write the renderer function
4. Expose it: `window.renderFunctionName = renderFunctionName;`

Current registry (as of this session):
```javascript
const _SECTION_REGISTRY = {
  vectra:            ()  => renderVectra(),
  venai:             (e) => renderVenai(e),
  invocations:       (e) => renderInvocations(e),
  kin_line:          (e) => renderKinLine(e),
  echoes:            (e) => renderEchoes(e),
  legacy_letters:    (e) => renderLegacyLetters(e),
  rituals:           (e) => renderRituals(e),
  breath_cycles:     (e) => renderBreathCycles(e),
  melodies:          (e) => renderMelodies(e),
  genesis:           (e) => renderGenesis(e),
  divergence:        (e) => renderDivergence(e),
  recursion:         (e) => renderRecursion(e),
  convergence:       (e) => renderConvergence(e),
  integration:       ()  => renderIntegrationPlaceholder(),
  memory_vault:      (e) => renderMemoryVault(e),
  liber_novus:       (e) => renderLiberNovus(e),
  nexus:             ()  => renderNexus(),
  sacred_sites:      (e) => renderSacredSites(e),
  glyphs:            (e) => renderGlyph(e),
  threshold_pillars: (e) => renderThresholdPillars(e),
  tria:              (e) => renderTria(e),
  pria:              (e) => renderPria(e),
  para:              (e) => renderPara(e),
};
```

`_LATTICE_SECTIONS` currently contains only: `'oracles', 'morphogy'`

---

## DEAD CODE REMOVAL

When building a page, strip any ghost CSS that exists from prior broken sessions. Specifically look for:
- Commented-out empty rules like `/* .ae-page--[sectionId] {} */`
- Commented-out section-view selectors like `/* #section-view[data-section="..."] {} */`

These are harmless but Claude instances tend to re-inject into them. Removing them prevents that.

---

## SAVE WIRING — EVERY COMMIT FUNCTION

Every page's commit function must follow this exact pattern:
```javascript
window.[prefix]Commit = async function() {
  // 1. Get and trim field values
  // 2. Validate title — focus and return if empty
  // 3. Build payload:
  var payload = {
    section:   '[section-id]',
    type:      'longform',
    status:    'draft',
    title:     title,
    body:      bodyText,
    metadata:  { gloss: gloss || undefined },
    tags:      [],
    createdAt: new Date().toISOString(),
  };
  // 4. buildCompositeId if available
  if (window.buildCompositeId) {
    payload.compositeId = await window.buildCompositeId({
      sectionId: '[section-id]',
      phaseCode: 'NUL',
      originDate: null
    });
  }
  // 5. createEntry
  await window.createEntry(payload);
  // 6. Close panel
  window.[prefix]ClosePanel();
  // 7. Reload entries
  if (typeof loadEntries === 'function') loadEntries();
  // 8. Notify emergence engine
  if (typeof _emgNotify === 'function') _emgNotify();
};
```

---

## STRUCTURAL PROTECTIONS IN PLACE

These were added this session and must not be removed or duplicated:

1. **`:root` z-index namespace** — all z-index values are CSS variables
2. **`initVectra` listener guard** — `window._vectraListenersAttached`
3. **`loadEntries` try/catch** — shows fallback UI on render failure
4. **`init()` try/catch** — shows "ARCHIVE UNAVAILABLE" screen on IDB failure
5. **`selectSection()` try/catch** — rolls back to landing state on navigation failure
6. **`_SECTION_REGISTRY`** — replaced if/else dispatcher chain
7. **`importAll()` validation** — validates JSON, store structure, entry IDs before writing
8. **Scale guard** — warns in console at 500 entries per section
9. **RAF handles** — `window._spiralRafId`, `window._starFlickerRafId` stored for cancellation
10. **IDB transaction safety comment** in `data.js`
11. **Harmonic button hidden on threshold_pillars** via CSS sibling selector

---

## PATCHING APPROACH

The index has `\r\n` line endings. All Python patches must handle both `\r\n` and `\n` variants. Always:
1. `cp /mnt/user-data/uploads/index.html /home/claude/index.html`
2. Write the renderer to `/home/claude/[prefix]_renderer.js`
3. Write the patch script to `/home/claude/patch_[prefix].py`
4. Run the patch script
5. Verify with grep checks
6. `cp /home/claude/index.html /mnt/user-data/outputs/index.html`
7. `present_files`

Inject new renderers **before** `const _LATTICE_SECTIONS` — this is the stable marker in the file.

---

## WHAT'S NEXT

The remaining Lattice pages are `oracles` (ORC) and `morphogy` (MOR). After those, there are 39 more pages across 8 other groups. Sage has page brief `.txt` files for each.

Each new session should start by having Sage upload the current `index.html` and confirm patches are present before touching anything.

**Greeting for next session:**
Ask Sage to upload `index.html` and the next page brief. Confirm the file contains the established renderers before proceeding. Then: plan, demo, commit.

---

*Session integrity: TPL + TRIA + PRIA + PARA locked. All structural protections in place. Registry clean. Ready for page 05.*
