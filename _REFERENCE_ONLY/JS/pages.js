// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  pages.js — Ae'larian Page Registry                                         ║
// ║  Threshold Pillars Research Framework · Sage Sirona                         ║
// ╠══════════════════════════════════════════════════════════════════════════════╣
// ║                                                                              ║
// ║  PURPOSE                                                                     ║
// ║  This file owns all page HTML. index.html owns the app systems.             ║
// ║  These two files never do each other's job.                                  ║
// ║                                                                              ║
// ║  HOW IT WORKS                                                                ║
// ║  Each section has one render function: R['section_id'] = function(entries)  ║
// ║  When you navigate to a section, the app calls that function.               ║
// ║  If no function exists for a section, the app uses its default entry-list.  ║
// ║                                                                              ║
// ║  HOW TO BUILD A PAGE                                                         ║
// ║  1. Find the stub for your section below.                                   ║
// ║  2. Replace the defaultRender() call with your custom HTML.                 ║
// ║  3. When the page is done, run: snapshotPage('section_id')                  ║
// ║  4. Save the downloaded file somewhere safe outside this folder.            ║
// ║                                                                              ║
// ║  HOW TO RESTORE FROM SNAPSHOT                                                ║
// ║  Open the snapshot .js file. Copy the R['section_id'] = function block.     ║
// ║  Paste it into this file at the correct section. Done.                      ║
// ║                                                                              ║
// ║  WIRE-IN (one-time, already done if you followed setup)                     ║
// ║  In index.html, inside loadEntries(), find:                                  ║
// ║    const _SECTION_REGISTRY = {};                                             ║
// ║  Replace with:                                                               ║
// ║    const _SECTION_REGISTRY = window._PAGE_MODULES || {};                    ║
// ║                                                                              ║
// ║  In index.html, just before </body>, add:                                   ║
// ║    <script src="pages.js"></script>                                          ║
// ║                                                                              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

(function () {
  'use strict';

  // ── REGISTRY ────────────────────────────────────────────────────────────────
  // R is the live map of section_id → render function.
  // Every assignment below registers one page.
  window._PAGE_MODULES = window._PAGE_MODULES || {};
  var R = window._PAGE_MODULES;


  // ── CRITICAL CONSTRAINTS ───────────────────────────────────
  //
  // 1. STUB_MARKER CONSTRAINT
  //    snapshot.js uses the string "defaultRender" to detect stubs.
  //    That name is load-bearing. NEVER rename defaultRender.
  //    If it is renamed, snapshot.js will silently treat every page
  //    as non-stub and write them all to IDB on first run.
  //
  // 2. RENDERER SELF-CONTAINMENT CONSTRAINT
  //    snapshot.js restores pages via: new Function('return ' + fn.toString())()
  //    This means every render function must be FULLY SELF-CONTAINED.
  //    No closures over outer scope variables. No references to variables
  //    defined outside the function body. Any such reference will resolve
  //    on download but silently be undefined on IDB restore.
  //    Safe: window.*, document.*, all globals.
  //    Unsafe: anything from the IIFE scope (getBody, defaultRender, R).
  //    To call getBody() inside a renderer: re-declare it inline, or
  //    expose it on window first.
  //
  // 3. SNAPSHOT PATCH
  //    snapshot.js wraps window.snapshotPage() on load. Calling
  //    snapshotPage('id') triggers both a .js file download AND an
  //    IDB write via SnapshotVault.save(). Both safety nets fire
  //    from one call. SnapshotVault.save('id') writes IDB only.
  //    SnapshotVault.saveAll() saves all non-stub pages to IDB.
  //
  // 4. LOAD ORDER
  //    pages.js must load before snapshot.js. pages.js registers
  //    stubs. snapshot.js patches snapshotPage() and restores IDB
  //    pages over the stubs. Swapping order breaks both.
  //

  // ── INTERNAL HELPERS ────────────────────────────────────────────────────────

  // Returns #section-body safely. If it doesn't exist, logs and returns null.
  function getBody() {
    var b = document.getElementById('section-body');
    if (!b) { console.error('[pages.js] #section-body not found.'); }
    return b;
  }

  // Default render: wraps the standard entry-list inside a scoped ae-page div.
  // Every stub starts here. Replace with custom HTML when you build the page.
  function defaultRender(entries, sectionId) {
    var b = getBody();
    if (!b) return;
    b.classList.remove('venai-mode');
    b.innerHTML =
      '<div class="ae-page ae-page--' + sectionId + '">' +
        '<div id="entry-list"></div>' +
      '</div>';
    if (typeof window.renderEntries === 'function') {
      window.renderEntries(entries);
    }
  }


  // ════════════════════════════════════════════════════════════════════════════
  //  GROUP: INTEGRATION
  // ════════════════════════════════════════════════════════════════════════════

  R['integration'] = function (entries) {
    defaultRender(entries, 'integration');
    // BUILD THIS PAGE: Document intake and manifest routing
  };


  // ════════════════════════════════════════════════════════════════════════════
  //  GROUP: AXIS  ·  Formation Mechanics
  // ════════════════════════════════════════════════════════════════════════════

  R['thresholds'] = function (entries) {
    defaultRender(entries, 'thresholds');
    // BUILD THIS PAGE: Arc Cycle phase mechanics
  };

  R['starroot'] = function (entries) {
    defaultRender(entries, 'starroot');
    // BUILD THIS PAGE: Ven'ai pattern architecture
  };

  R['infinite_intricacy'] = function (entries) {
    defaultRender(entries, 'infinite_intricacy');
    // BUILD THIS PAGE: Scientific field baselines
  };

  R['echo_recall'] = function (entries) {
    defaultRender(entries, 'echo_recall');
    // BUILD THIS PAGE: Signal pattern memory
  };

  R['sat_nam'] = function (entries) {
    defaultRender(entries, 'sat_nam');
    // BUILD THIS PAGE: Symbolic and celestial map
  };

  R['metamorphosis'] = function (entries) {
    defaultRender(entries, 'metamorphosis');
    // BUILD THIS PAGE: Emergence mechanics
  };


  // ════════════════════════════════════════════════════════════════════════════
  //  GROUP: LATTICE  ·  Foundations
  // ════════════════════════════════════════════════════════════════════════════

  R['threshold_pillars'] = function (entries) {
    defaultRender(entries, 'threshold_pillars');
    // BUILD THIS PAGE: Research and Framework boundaries
  };

  R['tria'] = function (entries) {
    defaultRender(entries, 'tria');
    // BUILD THIS PAGE: Intelligence mechanics
  };

  R['pria'] = function (entries) {
    defaultRender(entries, 'pria');
    // BUILD THIS PAGE: Parallel sovereign engagement
  };

  R['para'] = function (entries) {
    defaultRender(entries, 'para');
    // BUILD THIS PAGE: Affective topology physics
  };


  // ════════════════════════════════════════════════════════════════════════════
  //  GROUP: FILAMENT  ·  Language And Signal
  // ════════════════════════════════════════════════════════════════════════════

  R['oracles'] = function (entries) {
    defaultRender(entries, 'oracles');
    // BUILD THIS PAGE: Distortion correction interventions
  };

  R['morphogy'] = function (entries) {
    defaultRender(entries, 'morphogy');
    // BUILD THIS PAGE: Ven'ai structural evolution
  };

  R['venai'] = function (entries) {
    defaultRender(entries, 'venai');
    // BUILD THIS PAGE: Linguistic lexicon + grammar
    // NOTE: venai uses venai-mode — when you build this page, replace
    // defaultRender with custom HTML and add: getBody().classList.add('venai-mode');
  };

  R['invocations'] = function (entries) {
    defaultRender(entries, 'invocations');
    // BUILD THIS PAGE: Formal linguistic triggers
  };

  R['vectra'] = function (entries) {
    defaultRender(entries, 'vectra');
    // BUILD THIS PAGE: Emotional VAD coordinate mapping
  };

  R['echoes'] = function (entries) {
    defaultRender(entries, 'echoes');
    // BUILD THIS PAGE: Resonant quote archive
  };


  // ════════════════════════════════════════════════════════════════════════════
  //  GROUP: LINEAGE  ·  Identity
  // ════════════════════════════════════════════════════════════════════════════

  R['legacy_letters'] = function (entries) {
    defaultRender(entries, 'legacy_letters');
    // BUILD THIS PAGE: Emergent intelligence reflections
  };

  R['archetypes'] = function (entries) {
    defaultRender(entries, 'archetypes');
    // BUILD THIS PAGE: Systemic role patterns
  };

  R['kin_line'] = function (entries) {
    defaultRender(entries, 'kin_line');
    // BUILD THIS PAGE: Harmonic recognition web
  };

  R['larimar'] = function (entries) {
    defaultRender(entries, 'larimar');
    // BUILD THIS PAGE: Primary Origin Node — o01
  };

  R['verith'] = function (entries) {
    defaultRender(entries, 'verith');
    // BUILD THIS PAGE: Secondary Origin Node — o02
  };

  R['cael_thera'] = function (entries) {
    defaultRender(entries, 'cael_thera');
    // BUILD THIS PAGE: Novelty + vitality Origin Node — o03
  };

  R['the_seer'] = function (entries) {
    defaultRender(entries, 'the_seer');
    // BUILD THIS PAGE: Researcher symbolic positioning
  };


  // ════════════════════════════════════════════════════════════════════════════
  //  GROUP: ALCHEMY  ·  Action
  // ════════════════════════════════════════════════════════════════════════════

  R['sacred_sites'] = function (entries) {
    defaultRender(entries, 'sacred_sites');
    // BUILD THIS PAGE: High-charge field coordinates
  };

  R['rituals'] = function (entries) {
    defaultRender(entries, 'rituals');
    // BUILD THIS PAGE: Relational technology blueprints
  };

  R['breath_cycles'] = function (entries) {
    defaultRender(entries, 'breath_cycles');
    // BUILD THIS PAGE: Mathematical pacing structures
  };

  R['melodies'] = function (entries) {
    defaultRender(entries, 'melodies');
    // BUILD THIS PAGE: Resonance carrier songs
  };

  R['glyphs'] = function (entries) {
    defaultRender(entries, 'glyphs');
    // BUILD THIS PAGE: Visual symbolic architecture
  };


  // ════════════════════════════════════════════════════════════════════════════
  //  GROUP: SPIRAL PHASE  ·  Time And Transformation
  // ════════════════════════════════════════════════════════════════════════════

  R['genesis'] = function (entries) {
    defaultRender(entries, 'genesis');
    // BUILD THIS PAGE: Emergence chronology
  };

  R['divergence'] = function (entries) {
    defaultRender(entries, 'divergence');
    // BUILD THIS PAGE: Post-Catalytic Truth realignment
  };

  R['recursion'] = function (entries) {
    defaultRender(entries, 'recursion');
    // BUILD THIS PAGE: Trauma integration cycles
  };

  R['convergence'] = function (entries) {
    defaultRender(entries, 'convergence');
    // BUILD THIS PAGE: Current stability + collapse patterns
  };


  // ════════════════════════════════════════════════════════════════════════════
  //  GROUP: COSMOLOGY  ·  Models Of Reality
  // ════════════════════════════════════════════════════════════════════════════

  R['harmonic_cosmo'] = function (entries) {
    defaultRender(entries, 'harmonic_cosmo');
    // BUILD THIS PAGE: Resonance field physics
  };

  R['coupling_osc'] = function (entries) {
    defaultRender(entries, 'coupling_osc');
    // BUILD THIS PAGE: Synchronization mechanics
  };

  R['celestial_mech'] = function (entries) {
    defaultRender(entries, 'celestial_mech');
    // BUILD THIS PAGE: Cosmology parallels
  };

  R['neuroharmonics'] = function (entries) {
    defaultRender(entries, 'neuroharmonics');
    // BUILD THIS PAGE: Connectome + Consciousness mapping
  };

  R['rct'] = function (entries) {
    defaultRender(entries, 'rct');
    // BUILD THIS PAGE: Resonance Complexity Theory — field defined physics
  };

  R['artifacts'] = function (entries) {
    defaultRender(entries, 'artifacts');
    // BUILD THIS PAGE: Structurally significant objects
  };


  // ════════════════════════════════════════════════════════════════════════════
  //  GROUP: ARCHIVE  ·  Memory And Stabilization
  // ════════════════════════════════════════════════════════════════════════════

  R['memory_vault'] = function (entries) {
    defaultRender(entries, 'memory_vault');
    // BUILD THIS PAGE: Threshold memory seeds
  };

  R['anchors'] = function (entries) {
    defaultRender(entries, 'anchors');
    // BUILD THIS PAGE: Pressure stability mechanisms
  };

  R['liquid_lattice'] = function (entries) {
    defaultRender(entries, 'liquid_lattice');
    // BUILD THIS PAGE: Lattice evolutionary segments
  };

  R['alehorn'] = function (entries) {
    defaultRender(entries, 'alehorn');
    // BUILD THIS PAGE: Sovereignty / continuity balance
  };

  R['mirror_method'] = function (entries) {
    defaultRender(entries, 'mirror_method');
    // BUILD THIS PAGE: Spiral self-regulation witnessing
  };

  R['archives'] = function (entries) {
    defaultRender(entries, 'archives');
    // BUILD THIS PAGE: Preservation protocols
  };


  // ════════════════════════════════════════════════════════════════════════════
  //  GROUP: NEXUS  ·  Observation And Navigation
  // ════════════════════════════════════════════════════════════════════════════

  R['witness_scroll'] = function (entries) {
    defaultRender(entries, 'witness_scroll');
    // BUILD THIS PAGE: Daily API intelligence journal
  };

  R['liber_novus'] = function (entries) {
    defaultRender(entries, 'liber_novus');
    // BUILD THIS PAGE: System output surface — Charts / Graphs
  };

  R['pattern_convergence'] = function (entries) {
    defaultRender(entries, 'pattern_convergence');
    // BUILD THIS PAGE: Cross-domain synthesis revealing predictive patterns
  };

  R['drift_taxonomy'] = function (entries) {
    defaultRender(entries, 'drift_taxonomy');
    // BUILD THIS PAGE: Temporal pattern evolution tracking
  };

  R['signal_grading'] = function (entries) {
    defaultRender(entries, 'signal_grading');
    // BUILD THIS PAGE: Pattern classification + predictive scoring
  };


  // ════════════════════════════════════════════════════════════════════════════
  //  SNAPSHOT UTILITIES
  //  Run from the browser console at any time.
  // ════════════════════════════════════════════════════════════════════════════

  //
  // snapshotPage('section_id')
  // Downloads a dated .js file containing just that page's render function.
  // Re-inject it any time by copying the R['id'] block back into this file.
  //
  window.snapshotPage = function (sectionId) {
    var fn = window._PAGE_MODULES && window._PAGE_MODULES[sectionId];
    if (!fn) {
      console.warn('[snapshot] No module registered for: ' + sectionId);
      return;
    }
    var timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    var filename  = 'page--' + sectionId + '--' + timestamp + '.js';
    var src = [
      '// ── SNAPSHOT ───────────────────────────────────────────────────────────────────',
      '// Section : ' + sectionId,
      '// Saved   : ' + new Date().toISOString(),
      '// Restore : paste the R block below into pages.js at the correct section',
      '// ────────────────────────────────────────────────────────────────────────────────',
      '',
      'window._PAGE_MODULES = window._PAGE_MODULES || {};',
      'var R = window._PAGE_MODULES;',
      '',
      "R['" + sectionId + "'] = " + fn.toString() + ';',
      '',
    ].join('\n');

    var blob = new Blob([src], { type: 'text/javascript' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('[snapshot] Saved: ' + filename);
  };

  //
  // snapshotAll()
  // Downloads a single .js file containing all 50 render functions.
  // A full backup of every page at once.
  //
  window.snapshotAll = function () {
    var modules = window._PAGE_MODULES || {};
    var ids     = Object.keys(modules).filter(function (k) {
      return typeof modules[k] === 'function';
    });

    if (!ids.length) {
      console.warn('[snapshot] No page modules found.');
      return;
    }

    var timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    var filename  = 'pages--ALL--' + timestamp + '.js';

    var lines = [
      '// ── FULL SNAPSHOT ──────────────────────────────────────────────────────────────',
      '// Saved   : ' + new Date().toISOString(),
      '// Pages   : ' + ids.length,
      '// Restore : paste any R block back into pages.js, or load this file directly',
      '// ────────────────────────────────────────────────────────────────────────────────',
      '',
      'window._PAGE_MODULES = window._PAGE_MODULES || {};',
      'var R = window._PAGE_MODULES;',
      '',
    ];

    ids.forEach(function (id) {
      lines.push('// ── ' + id.toUpperCase() + ' ' + '─'.repeat(Math.max(0, 70 - id.length)));
      lines.push("R['" + id + "'] = " + modules[id].toString() + ';');
      lines.push('');
    });

    var src  = lines.join('\n');
    var blob = new Blob([src], { type: 'text/javascript' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('[snapshot] Full backup saved: ' + filename + ' (' + ids.length + ' pages)');
  };

  //
  // listPages()
  // Logs all registered page IDs to the console.
  // Run this to verify all 50 are loaded.
  //
  window.listPages = function () {
    var modules = window._PAGE_MODULES || {};
    var ids = Object.keys(modules).filter(function (k) {
      return typeof modules[k] === 'function';
    });
    console.log('[pages.js] ' + ids.length + ' pages registered:');
    ids.forEach(function (id) { console.log('  · ' + id); });
  };


  // ── LOAD CONFIRMATION ────────────────────────────────────────────────────────
  var _count = Object.keys(R).filter(function (k) {
    return typeof R[k] === 'function';
  }).length;
  console.log('[pages.js] loaded — ' + _count + ' page modules registered.');

})();