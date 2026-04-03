// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  snapshot.js — Page Vault · Ae'larian Archive                               ║
// ║  Threshold Pillars Research Framework · Sage Sirona                         ║
// ╠══════════════════════════════════════════════════════════════════════════════╣
// ║                                                                              ║
// ║  PURPOSE                                                                     ║
// ║  IDB-backed persistence for _PAGE_MODULES. Complements pages.js.            ║
// ║  Session crashes cannot erase IDB. Pages survive.                           ║
// ║                                                                              ║
// ║  WHAT THIS FILE DOES                                                         ║
// ║  · On load: reads IDB and re-injects all saved pages into _PAGE_MODULES     ║
// ║    before any section is navigated to.                                       ║
// ║  · Wraps window.snapshotPage() so every download also writes to IDB.        ║
// ║  · Detects stubs (pages still using defaultRender) — never overwrites a     ║
// ║    real saved page with a stub.                                              ║
// ║                                                                              ║
// ║  WIRE-IN (one-time setup)                                                    ║
// ║  In index.html, after the pages.js script tag:                              ║
// ║    <script src="pages.js"></script>                                          ║
// ║    <script src="snapshot.js"></script>   ← add this line                   ║
// ║  Order matters: pages.js registers stubs first, snapshot.js patches them.   ║
// ║                                                                              ║
// ║  CONSOLE API                                                                 ║
// ║  SnapshotVault.save('section_id')   — save one page to IDB                  ║
// ║  SnapshotVault.saveAll()            — save every non-stub page to IDB       ║
// ║  SnapshotVault.restore()            — re-inject all IDB pages (auto on load)║
// ║  SnapshotVault.list()               — table of all saved pages + dates      ║
// ║  SnapshotVault.delete('section_id') — remove one page from IDB              ║
// ║  SnapshotVault.deleteAll()          — wipe the vault (use carefully)        ║
// ║                                                                              ║
// ║  RELATIONSHIP TO snapshotPage() / snapshotAll()                             ║
// ║  snapshotPage('id')  → downloads .js file AND saves to IDB (patched here)  ║
// ║  snapshotAll()       → downloads .js file only (portable archive)           ║
// ║  SnapshotVault       → IDB only (crash-safe session persistence)            ║
// ║                                                                              ║
// ║  IDB                                                                         ║
// ║  Database : AelarianSnapshots (v1)                                           ║
// ║  Store    : page_snapshots  { sectionId, fnSource, savedAt, isStub }        ║
// ║  Separate DB — no version bump needed on the main archive DB.               ║
// ║                                                                              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

(function () {
  'use strict';

  // ── CONSTANTS ─────────────────────────────────────────────────────────────────
  var DB_NAME    = 'AelarianSnapshots';
  var DB_VERSION = 1;
  var STORE      = 'page_snapshots';

  // A page is a stub if its source still calls defaultRender.
  // We never write a stub to IDB, and never overwrite a real saved page with one.
  var STUB_MARKER = 'defaultRender';

  // ── IDB LAYER ─────────────────────────────────────────────────────────────────
  var _db = null;

  function _openDB() {
    return new Promise(function (resolve, reject) {
      if (_db) { resolve(_db); return; }

      var req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'sectionId' });
        }
      };

      req.onsuccess = function (e) {
        _db = e.target.result;
        resolve(_db);
      };

      req.onerror = function (e) {
        console.error('[SnapshotVault] IDB open failed:', e.target.error);
        reject(e.target.error);
      };

      req.onblocked = function () {
        console.warn('[SnapshotVault] IDB open blocked — another tab may be open.');
      };
    });
  }

  function _put(record) {
    return new Promise(function (resolve, reject) {
      _openDB().then(function (db) {
        var tx  = db.transaction(STORE, 'readwrite');
        var req = tx.objectStore(STORE).put(record);
        tx.oncomplete = function () { resolve(record); };
        tx.onerror    = function () { reject(tx.error); };
        req.onerror   = function () { reject(req.error); };
      }).catch(reject);
    });
  }

  function _getAll() {
    return new Promise(function (resolve, reject) {
      _openDB().then(function (db) {
        var req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
        req.onsuccess = function () { resolve(req.result || []); };
        req.onerror   = function () { reject(req.error); };
      }).catch(reject);
    });
  }

  function _delete(sectionId) {
    return new Promise(function (resolve, reject) {
      _openDB().then(function (db) {
        var tx  = db.transaction(STORE, 'readwrite');
        var req = tx.objectStore(STORE).delete(sectionId);
        tx.oncomplete = function () { resolve(sectionId); };
        tx.onerror    = function () { reject(tx.error); };
        req.onerror   = function () { reject(req.error); };
      }).catch(reject);
    });
  }

  function _clearAll() {
    return new Promise(function (resolve, reject) {
      _openDB().then(function (db) {
        var tx  = db.transaction(STORE, 'readwrite');
        var req = tx.objectStore(STORE).clear();
        tx.oncomplete = function () { resolve(); };
        tx.onerror    = function () { reject(tx.error); };
        req.onerror   = function () { reject(req.error); };
      }).catch(reject);
    });
  }


  // ── HELPERS ───────────────────────────────────────────────────────────────────

  function _isStub(fn) {
    if (typeof fn !== 'function') return true;
    return fn.toString().indexOf(STUB_MARKER) !== -1;
  }

  // Reconstruct a live function from stored source string.
  // Stored source is the full fn.toString() output: "function (entries) { ... }"
  function _reconstruct(fnSource) {
    try {
      // new Function('return ' + source)() safely reconstructs without global eval
      return new Function('return ' + fnSource)(); // eslint-disable-line no-new-func
    } catch (e) {
      console.warn('[SnapshotVault] Could not reconstruct function:', e.message);
      return null;
    }
  }

  function _toast(msg, title) {
    if (window.idbToast) window.idbToast(msg, { title: title || 'SNAPSHOT ERROR' });
  }


  // ── PUBLIC API ────────────────────────────────────────────────────────────────

  var SnapshotVault = {};

  /**
   * save(sectionId)
   * Writes the current live render function for sectionId to IDB.
   * Refuses to save stubs (pages still using defaultRender).
   * Returns a Promise that resolves with the saved record.
   */
  SnapshotVault.save = function (sectionId) {
    var modules = window._PAGE_MODULES || {};
    var fn      = modules[sectionId];

    if (typeof fn !== 'function') {
      console.warn('[SnapshotVault] No module for: ' + sectionId);
      return Promise.resolve(null);
    }
    if (_isStub(fn)) {
      console.warn('[SnapshotVault] "' + sectionId + '" is still a stub — not saving.');
      return Promise.resolve(null);
    }

    var record = {
      sectionId : sectionId,
      fnSource  : fn.toString(),
      savedAt   : new Date().toISOString(),
      isStub    : false,
    };

    return _put(record).then(function (r) {
      console.log('[SnapshotVault] Saved: ' + sectionId + ' (' + r.savedAt + ')');
      return r;
    }).catch(function (err) {
      console.error('[SnapshotVault] Save failed for ' + sectionId + ':', err);
      _toast(err.message || 'Could not save page to vault.', 'VAULT SAVE FAILED');
      throw err;
    });
  };

  /**
   * saveAll()
   * Saves every non-stub page currently in _PAGE_MODULES to IDB.
   * Safe to call at any time. Skips stubs silently.
   * Returns a Promise that resolves with { saved, skipped }.
   */
  SnapshotVault.saveAll = function () {
    var modules = window._PAGE_MODULES || {};
    var ids     = Object.keys(modules);
    var saved   = 0;
    var skipped = 0;

    var tasks = ids.map(function (id) {
      if (_isStub(modules[id])) {
        skipped++;
        return Promise.resolve(null);
      }
      return SnapshotVault.save(id).then(function (r) {
        if (r) saved++;
      });
    });

    return Promise.all(tasks).then(function () {
      console.log('[SnapshotVault] saveAll complete — saved: ' + saved + ', skipped stubs: ' + skipped);
      return { saved: saved, skipped: skipped };
    }).catch(function (err) {
      console.error('[SnapshotVault] saveAll error:', err);
      _toast(err.message, 'VAULT SAVE ALL FAILED');
      throw err;
    });
  };

  /**
   * restore()
   * Reads all saved pages from IDB and injects them into _PAGE_MODULES.
   * Skips any IDB record that still looks like a stub.
   * Never overwrites a live non-stub with an IDB stub.
   * Returns a Promise that resolves with { restored, skipped }.
   * Called automatically on load.
   */
  SnapshotVault.restore = function () {
    return _getAll().then(function (records) {
      if (!records.length) {
        console.log('[SnapshotVault] Vault is empty — nothing to restore.');
        return { restored: 0, skipped: 0 };
      }

      window._PAGE_MODULES = window._PAGE_MODULES || {};
      var R       = window._PAGE_MODULES;
      var restored = 0;
      var skipped  = 0;

      records.forEach(function (rec) {
        // Don't restore a record that was saved as a stub
        if (rec.isStub || rec.fnSource.indexOf(STUB_MARKER) !== -1) {
          skipped++;
          return;
        }

        // Don't overwrite a live non-stub with something from IDB
        var live = R[rec.sectionId];
        if (typeof live === 'function' && !_isStub(live)) {
          // Live version is real — IDB version may be older. Keep live.
          skipped++;
          return;
        }

        // Inject
        var fn = _reconstruct(rec.fnSource);
        if (fn) {
          R[rec.sectionId] = fn;
          restored++;
        } else {
          skipped++;
        }
      });

      if (restored > 0) {
        console.log(
          '[SnapshotVault] Restored ' + restored + ' page(s) from vault.' +
          (skipped ? ' (' + skipped + ' skipped)' : '')
        );
      }
      return { restored: restored, skipped: skipped };
    }).catch(function (err) {
      console.error('[SnapshotVault] restore failed:', err);
      _toast(err.message, 'VAULT RESTORE FAILED');
      return { restored: 0, skipped: 0 };
    });
  };

  /**
   * list()
   * Logs a console table of all saved pages, their save dates, and stub status.
   * Run this to verify what's in the vault.
   */
  SnapshotVault.list = function () {
    return _getAll().then(function (records) {
      if (!records.length) {
        console.log('[SnapshotVault] Vault is empty.');
        return [];
      }
      var rows = records.map(function (r) {
        return {
          sectionId : r.sectionId,
          savedAt   : r.savedAt ? new Date(r.savedAt).toLocaleString() : '—',
          isStub    : r.fnSource.indexOf(STUB_MARKER) !== -1 ? 'yes (warn)' : 'no',
          bytes     : r.fnSource ? r.fnSource.length : 0,
        };
      });
      console.table(rows);
      console.log('[SnapshotVault] ' + records.length + ' record(s) in vault.');
      return rows;
    }).catch(function (err) {
      console.error('[SnapshotVault] list failed:', err);
    });
  };

  /**
   * delete(sectionId)
   * Removes a single page from the vault.
   * Does not affect the live _PAGE_MODULES entry.
   */
  SnapshotVault.delete = function (sectionId) {
    return _delete(sectionId).then(function () {
      console.log('[SnapshotVault] Deleted from vault: ' + sectionId);
    }).catch(function (err) {
      console.error('[SnapshotVault] delete failed for ' + sectionId + ':', err);
      _toast(err.message, 'VAULT DELETE FAILED');
      throw err;
    });
  };

  /**
   * deleteAll()
   * Wipes the entire vault. Use carefully.
   * Does not affect the live _PAGE_MODULES entries.
   */
  SnapshotVault.deleteAll = function () {
    if (!confirm('Delete ALL saved pages from the vault? This cannot be undone.\n\nRun snapshotAll() first to download a full backup.')) {
      return Promise.resolve(false);
    }
    return _clearAll().then(function () {
      console.log('[SnapshotVault] Vault cleared.');
      return true;
    }).catch(function (err) {
      console.error('[SnapshotVault] deleteAll failed:', err);
      _toast(err.message, 'VAULT CLEAR FAILED');
      throw err;
    });
  };


  // ── PATCH snapshotPage() ──────────────────────────────────────────────────────
  // Wraps the existing download-based snapshotPage() so every download
  // also writes to IDB. Both safety nets fire with one call.
  // If snapshotPage hasn't loaded yet, retries on DOMContentLoaded.

  function _patchSnapshotPage() {
    if (typeof window.snapshotPage !== 'function') return false;

    var _originalSnapshotPage = window.snapshotPage;

    window.snapshotPage = function (sectionId) {
      // 1. Run the original download
      _originalSnapshotPage(sectionId);

      // 2. Also persist to IDB
      SnapshotVault.save(sectionId).then(function (r) {
        if (r) {
          console.log('[SnapshotVault] IDB write confirmed for: ' + sectionId);
        }
      }).catch(function (err) {
        // Download already succeeded — IDB failure is non-fatal but should be visible
        _toast(
          '"' + sectionId + '" was downloaded but vault save failed: ' + (err.message || err),
          'VAULT SYNC WARN'
        );
      });
    };

    return true;
  }

  // Try to patch immediately (snapshot.js loads after pages.js, so should be available)
  if (!_patchSnapshotPage()) {
    // Fallback: retry after DOM is ready
    document.addEventListener('DOMContentLoaded', _patchSnapshotPage);
  }


  // ── STARTUP RESTORE ───────────────────────────────────────────────────────────
  // Run restore() early — before any user navigation — so IDB pages are live
  // by the time the first section is selected.
  //
  // Timing: snapshot.js loads synchronously after pages.js (which is also sync).
  // At this point the DOM may not be complete, but _PAGE_MODULES is ready.
  // IDB is async, so we fire and let it settle. The app starts on the landing
  // page, giving IDB time to inject before any section navigation.

  SnapshotVault.restore();


  // ── EXPOSE ────────────────────────────────────────────────────────────────────
  window.SnapshotVault = SnapshotVault;

  console.log('[snapshot.js] loaded — vault initializing.');

})();