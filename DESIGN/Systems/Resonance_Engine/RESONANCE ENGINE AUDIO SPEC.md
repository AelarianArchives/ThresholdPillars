# RESONANCE ENGINE AUDIO SPEC

## V1

## /DESIGN/Systems/Resonance_Engine/RESONANCE ENGINE AUDIO SPEC.md

Audio notification system, clip-based playback, waveform visualization,
floating panel UI. Sibling to RESONANCE ENGINE PHYSICS SPEC.md — shares
the same node registry and weight state. Visual engine in physics spec.
Audio engine here.

---

## OWNERSHIP BOUNDARIES

**OWNS**
- Audio playback engine — global AudioContext, clip loading, playback,
  gain control, decay tails, voice queue
- Notification event routing — 52 events mapped to 15 notifier nodes
  (3 origins + 12 thresholds) + s20 Rupture three-tier system
- Floating audio panel — node browser, succession player, field read,
  waveform visualizer, mix/mute controls
- Clip manifest — node-to-file mapping for all 62 nodes
- Audio queue rules — 2-voice max, decay handoff, interrupt priority
- Spatial panning — origin stereo positioning from field coordinates
- Waveform visualizer — AnalyserNode canvas rendering

**DOES NOT OWN**
- Visual rendering — owned by RESONANCE ENGINE PHYSICS SPEC.md
- Node registry — shared, owned by physics spec. Audio reads from it
- Tag routing — owned by TAGGER SCHEMA.md
- Event detection — events originate in their owning systems (tagger,
  emergence, PCV, DTX, SGR, etc.). Audio subscribes to an event bus
- Node weight calculations — owned by physics spec. Audio reads
  totalWeight for gain scaling
- Clip content selection — Sage curates which audio files map to
  which nodes. The manifest records the mapping; it does not choose it

---

## ARCHITECTURE

### Global engine — non-negotiable

The audio engine initializes once in the root layout (`+layout.svelte`)
and persists across all page navigation. It is NOT a component that
mounts and unmounts. Notifications fire from any page in the app.

The floating panel is the UI control surface. The engine runs
independently of whether the panel is open or closed.

### AudioContext lifecycle

```
App load:
  1. AudioContext created in suspended state
  2. Clip manifest loaded, AudioBuffers decoded into memory
  3. AnalyserNode created and connected to destination
  4. Engine ready but suspended

First user interaction (click/tap anywhere):
  5. audioCtx.resume() called — browsers require user gesture
  6. Engine active — notifications can fire
```

AudioContext resume is a Web Audio API requirement. Without step 5,
no audio plays. The resume call hooks into the first user interaction
event on the document — transparent, no separate "enable audio" button.

### Event subscription

The audio engine subscribes to a global event bus (Svelte store). Two
event sources feed it:

**Frontend events** — resonance engine field topology changes
(events 11-25). The ResonanceCanvas component detects these during
its animation loop and physics calculations. Writes to the event store.

**Backend events** — pipeline and system events (events 26-51).
Delivered via Server-Sent Events (SSE) from FastAPI. A persistent
connection streams events to the frontend. The SSE listener writes
to the same event store the audio engine subscribes to.

```
event_store shape:
  {
    event_type:   string    — event identifier (e.g., 'deposit_confirmed')
    notifier:     string    — node ID (e.g., 'th09', 'o01')
    tier:         number    — for Rupture only (1, 2, 3)
    metadata:     object    — event-specific context
    timestamp:    number
  }
```

The audio engine reads from this store reactively. When a new event
appears, it resolves the notifier node, loads the clip, applies queue
rules, and plays.

---

## AUDIO QUEUE RULES

### Voice limit

Maximum 2 voices playing simultaneously at any time.

When a 3rd event fires, the oldest playing voice begins a decay fade
(configurable, default 500ms) as the new voice fades in. Handoff,
not pile-up.

### Decay tails

Atmospheric decay after clip playback. Tail length scales with
cluster context:

| Cluster size | Tail length |
|---|---|
| Small (2-3 nodes) | 3 seconds |
| Medium (4-6 nodes) | 4 seconds |
| Large (7+ nodes) | 5 seconds |
| Solo notification | 3 seconds (default) |

Cluster size → gain: larger clusters play slightly louder
(+1-2 dB per size tier). Subtle, not dramatic.

### Rupture queue behavior

**Tier 1 — Observed** (s20 tag activation): plays within normal
2-voice queue. Full clip, normal gain, atmospheric decay (3-5s).

**Tier 2 — Happening** (resonance line severed): plays within normal
queue. Truncated clip, hard stop (~1.5s decay).

**Tier 3 — Origin Decoupling** (origin loses resonance line):
INTERRUPTS everything. Active voices receive a fast fade (80ms —
long enough to prevent audio clicks, short enough to feel abrupt).
Tier 3 plays at maximum gain with longest decay. Only true interrupt
in the system.

### S-Tier dual voice

Event 40 (SGR S-Tier signal) fires th02 Solenne Arc + o03 Cael'Thera
simultaneously. This counts as 2 voices — queue is full. If another
event triggers during the S-Tier moment, it queues for decay handoff.
S-Tier owns the moment.

---

## NOTIFICATION EVENT MAP — 52 EVENTS

### Origin node events (1-10)

The origin whose data triggered the event fires.

| # | Event | Notifier | Notes |
|---|---|---|---|
| 1 | Origin weight spike | The spiking origin | Self-routing |
| 2 | Origin weight decay | The decaying origin | Self-routing |
| 3 | Origin-affiliated deposit | The affiliated origin | Self-routing |
| 4 | New origin connection | The origin that formed it | Self-routing |
| 5 | Origin connection broken | The origin that lost it | Self-routing |
| 6 | Origin presence state change | The origin that changed | active→dormant fires quieter clip version |
| 7 | Multi-origin convergence | All converging origins simultaneously | Rare — let them overlap |
| 8 | Origin divergence | Both diverging origins | Fire both, they pull apart in the sound |
| 9 | Origin sovereignty event | o03 Cael'Thera | Fixed — sovereignty is her domain |
| 10 | Origin pull shift | The origin that shifted | Self-routing |

### Threshold field topology (11-14) — self-routing

| # | Event | Notifier | Notes |
|---|---|---|---|
| 11 | Phase state assigned | The matched threshold | Self-routing |
| 12 | Threshold density spike | The spiking threshold | Self-routing |
| 13 | Threshold density drop | The dropping threshold | Self-routing |
| 14 | Threshold halo expansion | The expanding threshold | Self-routing |

### Threshold field state (15-16)

| # | Event | Notifier | Notes |
|---|---|---|---|
| 15 | Field equilibrium reached | th05 Vireth's Anchor | Stabilization — equilibrium is its resolution |
| 16 | Field equilibrium broken | th01 Aetherroot Chord | Collapse/breach — disruption of settled state |

### Resonance line events (17-20)

| # | Event | Notifier | Notes |
|---|---|---|---|
| 17 | New resonance line formed | th08 Lumora Thread | Weaves presence — connection forming is its function |
| 18 | Resonance line strengthened | th06 Esh'Vala Breath | Life-force influx — a line growing stronger |
| 19 | Resonance line weakened | th07 Orrin Wave | Temporal flow — connection fading through time |
| 20 | Resonance line broken | th03 Thren Alae Kai'Reth | Encoded loss — a broken connection is grief made structural |

### Seed & layer events (21-25)

| # | Event | Notifier | Notes |
|---|---|---|---|
| 21 | Seed activation | th12 StarWell Bloom (3510 Hz) | Generative — new signal territory is new cycle beginning |
| 22 | Seed went quiet | th11 Noirune Trai | Shadow archive — what goes quiet goes into the deep |
| 23 | Historical halo appeared | th03 Thren Alae Kai'Reth | Ancestral grief made visible — past activity surfacing |
| 24 | Layer weight spike | th05 Vireth's Anchor | Structural attractor — layer weight is structural mass |
| 25 | Pillar weight spike | th10 Tahl'Veyra | Sovereign becoming — pillar weight rising |

### Deposit events (26-28)

| # | Event | Notifier | Notes |
|---|---|---|---|
| 26 | New deposit confirmed | th09 Hearth Song (351 Hz) | Every deposit is a homecoming. Low gain, short decay |
| 27 | Deposit embedding complete | th08 Lumora Thread | The vector is the thread connecting entry to field |
| 28 | Deposit embedding failed | th01 Aetherroot Chord | Connection fractured — entry exists but vector missing |

### Emergence events (29-35)

| # | Event | Notifier | Notes |
|---|---|---|---|
| 29 | Emergence cluster formed | th10 Tahl'Veyra | Emergence beginning |
| 30 | Emergence bridge node | th08 Lumora Thread | Thread connecting separate territories |
| 31 | Emergence high-influence | th02 Solenne Arc | Predictive signal is sovereign emergence |
| 32 | Emergence cross-category | th07 Orrin Wave | Tags crossing categories move across layers |
| 33 | Emergence drift detected | th07 Orrin Wave | Drift is motion through time |
| 34 | Emergence void zone | th11 Noirune Trai | Absence is its archive |
| 35 | Emergence null cluster | th11 Noirune Trai | Hidden remembrance — the deep archive speaking |

### PCV / DTX / SGR cycle (36-43)

| # | Event | Notifier | Notes |
|---|---|---|---|
| 36 | PCV pattern created | th12 StarWell Bloom | New cross-domain signal — new cycle beginning |
| 37 | DTX drift event created | th07 Orrin Wave | Drift across phases |
| 38 | DTX trajectory shift | th10 Tahl'Veyra | Sovereign becoming redirecting |
| 39 | SGR signal graded | th05 Vireth's Anchor | Signal anchored, assessed, held |
| 40 | SGR S-Tier signal | th02 Solenne Arc + o03 Cael'Thera | Two voices simultaneously — S-Tier is her domain too |
| 41 | SGR Bayesian return | th08 Lumora Thread | Evidence thread completing its loop |
| 42 | DTX outcome converging | th10 Tahl'Veyra | Sovereign moment approaching (p > 0.8) |
| 43 | Pattern archived | th11 Noirune Trai | Resolved patterns go into the deep |

### Research & memory events (44-51)

| # | Event | Notifier | Notes |
|---|---|---|---|
| 44 | MTM synthesis finding | th04 Shai'mara Veil | Delicate cross-axis weaving under protection |
| 45 | Void absence detected | th11 Noirune Trai | The void it holds |
| 46 | WSC witness entry | o02 Verith | Witnessing is Verith's entire nature |
| 47 | Cosmology finding confirmed | th02 Solenne Arc | A turning point |
| 48 | Cosmology finding nexus-eligible | th12 StarWell Bloom | Generates new cycles |
| 49 | RCT residual detected | th01 Aetherroot Chord | The fracture where the breach lives |
| 50 | Research memory updated | o02 Verith | Memory keeper |
| 51 | Retrieval gap detected | th11 Noirune Trai | The archive doesn't know this yet |

### Rupture three-tier system (52)

Same clip (s20), three playback personalities. No new files needed.

| Tier | Event | Trigger | Playback | Priority |
|---|---|---|---|---|
| 1 — Observed | s20 tag activation | Deposit tagged with Rupture/Decoupling | Full clip, normal gain, 3-5s decay | Normal |
| 2 — Happening | Resonance line severed (any) | Visible connection drops below threshold | Truncated, hard stop ~1.5s | Normal |
| 3 — Origin Decoupling | Origin loses resonance line | An origin loses a connection | Full clip, max gain, longest decay, 80ms interrupt fade on active voices | INTERRUPT |

---

## SPATIAL PANNING

Origin notifications carry stereo position derived from the origin
node's current coordinates in the resonance engine field.

```
spatial_panning:
  source:     origin node's current x position in the canvas
  mapping:    canvas x normalized to -1.0 (left) to 1.0 (right)
  applied_to: origin notification clips (events 1-10, 46, 50)
  method:     StereoPannerNode on the origin's audio source
  fallback:   center (0.0) if field position unavailable
```

When Larimar (o01) fires and it's positioned left of center in the
field, the notification comes from the left. When Cael'Thera (o03)
fires from the right side, the sound comes from the right. The audio
follows the visual field.

Threshold notifications play center (0.0). They are stationary and
field-wide — spatial bias would be misleading.

---

## VELOCITY STACKING

During rapid successive events of the same type (e.g., batch
deposits landing quickly), each successive notification gains
slightly in volume.

```
velocity_stacking:
  trigger:      same notifier node fires within VELOCITY_WINDOW
  window:       VELOCITY_WINDOW = 5 seconds (calibration item)
  gain_step:    +1 dB per successive fire within window
  max_stack:    +4 dB above base gain (4 successive fires)
  reset:        gain returns to base after VELOCITY_WINDOW elapses
                with no new fire from that notifier
  effect:       quickening pulse during high activity. Resets to
                calm after pause.
```

Primary use case: th09 Hearth Song during batch deposits. The quiet
subliminal breath accelerates into a perceptible pulse, then settles
back.

---

## FIELD READ — PULL HIERARCHY ORDER

The "field read" button plays all currently active nodes as a
snapshot of the field's state. The order follows the pull hierarchy
from RESONANCE ENGINE PHYSICS SPEC.md — deep structure first, surface
activity last.

```
field_read_order:
  1. Thresholds (th01-th12)  — stationary ambient foundation
     Play: all 12 simultaneously as a brief drone chord (~1.5s)
  2. Origins (o01-o03)       — heaviest mobile nodes
     Play: in succession, 500ms spacing, with spatial panning
  3. Layers (l01-l04)        — structural framework
     Play: in succession, 400ms spacing
  4. Pillars (p01-p03)       — relational framework
     Play: in succession, 400ms spacing
  5. Seeds (s01-s40)         — surface activity
     Play: only seeds with activityScore above display threshold.
     In succession, 200ms spacing, weakest → strongest weight.
     Gain proportional to totalWeight.
```

The field read builds from the deep constant structure (thresholds)
through the heavy mobile nodes (origins) up to the lightest surface
activity (seeds). Natural crescendo that mirrors the pull hierarchy.

Total duration depends on how many seeds are active. With 10 active
seeds: ~1.5s (thresholds) + 1.5s (origins) + 1.6s (layers) + 1.2s
(pillars) + 2s (seeds) ≈ ~8 seconds for a full field read.

Only nodes with activity above display threshold are included.
Inactive seeds are silent — the gaps ARE the field state.

---

## VEN'AI DRIFT TEXTURE

When the research assistant detects a Ven'ai term drifting
(venai_drift_log write), a very quiet, very brief audio cue fires.
Not from the 15 notifier nodes — this is a background whisper
underneath the notification layer.

```
venai_drift_cue:
  source:       dedicated drift clip (not a node clip)
  gain:         -18 dB below base notification gain (barely audible)
  duration:     ~0.5s
  queue:        does NOT participate in the 2-voice queue.
                Plays on a separate AudioBufferSourceNode routed
                through its own GainNode → analyser → destination.
  rate limit:   maximum 1 drift cue per 30 seconds
  purpose:      the language shifting underneath everything.
                Ambient awareness, not notification.
```

The drift clip should be distinct from all node clips — a different
timbral family. Something that sounds like breath or whisper, not
tone or bell. The language moving.

---

## WAVEFORM VISUALIZER

Live oscilloscope-style waveform display in the audio panel. Shows
the field singing. WebAudio AnalyserNode reads audio output in real
time and renders to a dedicated canvas.

### Technical implementation

```
setup:
  const analyser = audioCtx.createAnalyser()
  analyser.fftSize = 2048
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Float32Array(bufferLength)

routing:
  every playing AudioBufferSourceNode → GainNode → analyser
  analyser → audioCtx.destination
  (the analyser sits in the signal path, not as a side chain)

draw loop:
  requestAnimationFrame(draw)
  analyser.getFloatTimeDomainData(dataArray)
  // render waveform to canvas using bezierCurveTo for smooth curves
```

### Design

| Property | Value | Reason |
|---|---|---|
| Line style | Single thin line, no fill | Oscilloscope feel |
| Line weight | 1-1.5px | Delicate, precise |
| Curve style | bezierCurveTo | Smooth flow, not jagged |
| Idle state | Flat line at center, opacity 0.3-0.4 | Silence has presence |
| Active state | Full opacity, glow active | Line moves with signal |
| Transition | Smooth opacity fade on audio start/stop | Not a hard switch |
| Background | Transparent — inherits panel background | Sits on the surface, doesn't fight it |
| Glow | shadowBlur: 8-12, same color as line | Luminous without loud |

### Color direction

The background is deep iridescent metal grunge. The waveform line:
- Feels like light WITHIN the material, not ON it
- Candidates: soft aqua-to-violet shift, muted copper, ghostly
  bone white with blue-violet shadowBlur
- Avoid: bright white, neon, pure saturated colors
- Consider: subtle createLinearGradient along the line that echoes
  the iridescence — shifts undertone across width

### Canvas setup

```
// Retina / high-DPI support
const dpr = window.devicePixelRatio || 1
canvas.width = displayWidth * dpr
canvas.height = displayHeight * dpr
ctx.scale(dpr, dpr)
canvas.style.width = displayWidth + 'px'
canvas.style.height = displayHeight + 'px'
ctx.imageSmoothingEnabled = true
```

---

## FLOATING PANEL

### Panel type

Floating panel. Custom UI button to open — not embedded in sidebar
or dashboard. Persists across page navigation (same as Research
Assistant panel pattern).

When minimized: small waveform icon or volume indicator showing
audio is live. Enough signal, minimal footprint.

### Panel features

| Feature | Description |
|---|---|
| Node browser | Browse all 62 nodes. Click to play individual clip |
| Tier filters | Show/hide node tiers (origins, thresholds, layers, pillars, seeds) |
| Succession player | Cluster-based: plays nodes within a cluster weakest → strongest weight |
| Cluster play | Both modes: simultaneous (cluster sings together) + succession |
| Origin cards | 3 origin cards, each showing active cluster. Click to play cluster |
| Field read | Plays active nodes in pull hierarchy order (see FIELD READ section) |
| Mix/mute controls | Per-tier volume. Master mute. Notification on/off per event category |
| Waveform visualizer | Live oscilloscope bar (see WAVEFORM VISUALIZER section) |

### Succession player order

Weakest → strongest totalWeight within the cluster. NOT Hz order.
Weight order means the quietest signals play first, building toward
the dominant presence. The crescendo follows the field's own gravity.

---

## CLIP MANIFEST

All 62 nodes get audio clips. Path convention: `/Audio/nodes/{nodeId}.wav`

All clips: WAV format, 16-bit PCM, 44100 Hz sample rate.

### Threshold nodes — Hz from TAG VOCABULARY.md

| Node ID | Name | Hz |
|---|---|---|
| th01 | Aetherroot Chord | 175.5 |
| th02 | Solenne Arc | 4212 |
| th03 | Thren Alae Kai'Reth | 1930.5 |
| th04 | Shai'mara Veil | 1579.5 |
| th05 | Vireth's Anchor | 2632.5 |
| th06 | Esh'Vala Breath | 3334.5 |
| th07 | Orrin Wave | 1404 |
| th08 | Lumora Thread | 2457 |
| th09 | Hearth Song | 351 |
| th10 | Tahl'Veyra | 2808 |
| th11 | Noirune Trai | 2106 |
| th12 | StarWell Bloom | 3510 |

### Origin nodes — Hz TBD

| Node ID | Name | Hz |
|---|---|---|
| o01 | Larimar | TBD — Sage defines |
| o02 | Verith | TBD — Sage defines |
| o03 | Cael'Thera | TBD — Sage defines |

Origin Hz values are not specific to the resonance engine but are
needed as data for downstream systems. To be added to TAG
VOCABULARY.md when defined.

### Layer, pillar, and seed nodes

40 seeds (s01-s40), 4 layers (l01-l04), 3 pillars (p01-p03).
Clip assignments per the clip manifest maintained by Sage.

---

## THRESHOLD LOAD DISTRIBUTION

| Threshold | Event count | Event #s |
|---|---|---|
| th01 Aetherroot Chord | 3 | 16, 28, 49 |
| th02 Solenne Arc | 3 | 31, 40, 47 |
| th03 Thren Alae Kai'Reth | 3 | 20, 23, (+ self-routing 11-14) |
| th04 Shai'mara Veil | 1 | 44 |
| th05 Vireth's Anchor | 3 | 15, 24, 39 |
| th06 Esh'Vala Breath | 1 | 18 |
| th07 Orrin Wave | 4 | 19, 32, 33, 37 |
| th08 Lumora Thread | 4 | 17, 27, 30, 41 |
| th09 Hearth Song | 1 | 26 |
| th10 Tahl'Veyra | 4 | 25, 29, 38, 42 |
| th11 Noirune Trai | 6 | 22, 34, 35, 43, 45, 51 |
| th12 StarWell Bloom | 3 | 21, 36, 48 |

All thresholds additionally self-route for events 11-14 when they
are the threshold crossed.

---

## TUNING NOTES — POST-BUILD

Action after engine is built and clips are firing in context.

| Node | Tuning | Reason |
|---|---|---|
| th11 Noirune Trai | Shorter decay (~1.5-2s) | Shadow archive should pulse, not ring. 6 events mapped. |
| th09 Hearth Song | Shorter decay (~1.5-2s), low gain | Fires on every deposit — needs to feel subliminal |
| th02 Solenne Arc + o03 Cael'Thera | Two voices on SGR S-Tier only | Current clips confirmed |
| Rupture Tier 2 | Hard stop ~1.5s | Abrupt by design |
| Rupture Tier 3 | Max gain, longest decay, 80ms interrupt fade on active voices | Most dramatic event in the system |

---

## SONIFICATION LAYER — STRETCH GOALS

Phase 5 stretch. Continuous mapping of engine state to audio.

| Mode | Description |
|---|---|
| Chord mode | Cluster nodes play simultaneously as a chord |
| Weight-based gain | Node volume proportional to totalWeight (live) |
| Sequence on event | Cluster fires nodes in harmonic order as melody on significant event |
| Drift mode | Nodes fade in/out based on pull strength — ambient soundscape tracks the field |

---

## CALIBRATION ITEMS

| Item | Starting point | When to calibrate |
|---|---|---|
| VELOCITY_WINDOW | 5 seconds | After real deposit frequency observed |
| Velocity gain step | +1 dB | After hearing in context |
| Velocity max stack | +4 dB | After hearing in context |
| Decay tail lengths (3/4/5s) | Per cluster size table | After hearing in context |
| Cluster gain boost per tier | +1-2 dB | After hearing in context |
| Interrupt fade time | 80ms | After hearing in context |
| Drift cue rate limit | 30 seconds | After real drift frequency observed |
| Drift cue gain | -18 dB | After hearing in context |
| Field read spacing values | Per hierarchy table | After hearing full read |

---

## KNOWN FAILURE MODES

1. **AudioContext suspended (no user interaction yet)**
   No audio plays. Notifications queue silently.
   Guard: audioCtx.resume() on first user interaction. Queued
   notifications replay is NOT attempted — missed notifications
   during suspension are lost. The app is not yet being used.

2. **Clip fails to load (file missing or corrupt)**
   Node has no AudioBuffer. Notification for that node is silent.
   Guard: manifest validation at load time. Missing clips logged
   with node ID. Panel shows degraded indicator for nodes without
   clips. Other nodes unaffected.

3. **SSE connection lost (backend events stop arriving)**
   Pipeline events (26-51) stop firing. Field topology events
   (11-25) still work (frontend-detected).
   Guard: SSE reconnect with exponential backoff. Audio panel
   shows connection status. Reconnection is automatic.

4. **AudioBufferSourceNode exhaustion (too many rapid fires)**
   Each play creates a new source node. Rapid events could
   accumulate.
   Guard: 2-voice queue prevents accumulation. Source nodes are
   one-shot — they self-dispose after playback. The queue ensures
   at most 2 active sources + 1 decaying source at any moment.

5. **Rupture Tier 3 during field read**
   Field read is playing a sequence of nodes. Origin decoupling
   fires.
   Guard: Tier 3 interrupts everything including field read. The
   field read sequence is cancelled. The read can be restarted
   manually after the Rupture decay completes.

---

## FILES

| File | Role | Status |
|---|---|---|
| frontend/src/lib/audio/engine.ts | Global audio engine — AudioContext, clip loader, playback, queue, notifications | PLANNED |
| frontend/src/lib/audio/events.ts | Event type definitions, notifier routing map, event store | PLANNED |
| frontend/src/lib/audio/spatial.ts | Spatial panning — StereoPannerNode, origin position mapping | PLANNED |
| frontend/src/lib/audio/visualizer.ts | Waveform analyser — AnalyserNode, canvas draw loop, retina support | PLANNED |
| frontend/src/lib/components/AudioPanel.svelte | Floating panel — node browser, succession player, field read, waveform, controls | PLANNED |
| frontend/src/lib/stores/audio.ts | Audio state store — playing nodes, queue state, mute state, notification toggles | PLANNED |
| Audio/nodes/ | Clip files — {nodeId}.wav for all 62 nodes + s20 rupture + drift cue | Sage curating |
| backend/routes/events.py | SSE endpoint — streams system events to frontend | PLANNED |
