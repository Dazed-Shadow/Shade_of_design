---
session_date: 2026-07-04
session_type: opus-review
participants: [Opus@CH]
dd_touched: [DD-032]
checkpoint: 2
ship_gate_cleared: null
next_session_signal: C-Build receives C2 kickoff → implements per §5 Sonnet unlocks → ships C2 impl log → Opus@CH sign-off review
tags: [sod-museum, dd-032, checkpoint-2, three-js, glb-pipeline, 2d-fallback, accessibility, opus-ch]
---

# Session Log — Checkpoint 2: 3D scene + 2D fallback + accessibility path

**Author:** Opus@CH
**Date:** 2026-07-04
**DD:** [DD-032 — SoD Museum rotunda plus Classics hall](../../../../References/Designs/DD-032%20SoD%20Museum%20—%20rotunda%20plus%20Classics%20hall.md)
**Kickoff origin (top-level):** [`C Roles/Strategies/kickoffs/DD-032-Opus-CH-arch-review.md`](../../../../C%20Roles/Strategies/kickoffs/DD-032-Opus-CH-arch-review.md)
**Prior:** [C1 arch artifact](session-log-2026-07-04-c1-arch.md) · [C-Build C1 impl log](session-log-2026-07-04-sonnet-c1-impl.md) · [Opus@CH C1 sign-off](session-log-2026-07-04-opus-c1-signoff.md)
**Companion decision (repo-side):** D-031 in [`pipeline/DECISIONS.md`](../../pipeline/DECISIONS.md) *(lands with C2 sign-off, not this planning artifact)*

---

## What this session decides

Four architectural surfaces locked for C2 execution:

1. **Three.js scene architecture** — delivery pattern (no `React.lazy`; dynamic script injection per D-030 runtime), scene graph, `CatmullRomCurve3` dolly camera, waypoints, sealed-door plaques.
2. **GLB + texture pipeline** — `gltf-transform` CLI offline pass, Draco+meshopt meshes, KTX2/Basis textures, target sizes, on-disk locations, three-stdlib CDN loaders.
3. **2D fallback content-parity model** — DOM gallery renderer reading the same five manifests as the 3D scene, per-hall card grid, per-cabinet detail view, playable mini-game shared with the 3D path.
4. **Accessibility path** — waypoint DOM overlays paired with 3D camera stops, screen-reader announcements via live region, keyboard traversal driving both camera and overlay focus in lockstep, WCAG-AA contrast audit protocol.

Sonnet is unblocked for C2 execution upon my kickoff dispatch. Two open coordination questions (hosting provider · CI wiring) remain carry-forward from the C1 close; neither blocks C2 architecture work.

## Substrate consumed

- DD-032 spec §How + §When done (ship gates 3–5 anchor payload budgets + mobile content-equal + brand-token lint)
- Fable Implementation Strategy §1.4 (rendering split), §2 (skill set: `CatmullRomCurve3`, Draco/meshopt, KTX2/Basis, emissive materials + baked lighting, Playwright + axe-core test strategy), §Dialogue 2 (guided dolly synthesis: waypoints + DOM overlays as accessibility spine)
- C1 arch artifact §1 (all five manifest schemas), §2 (rendering split with capability check pre-3D-chunk), §3 (route wiring under D-030 pattern)
- D-030 (CDN UMD + Babel-standalone runtime; no ES module graph; museum-scoped palette namespace)
- C-Build C1 impl log (verified capability check + hash sub-router + defensive manifest loader all working; the same architecture receives 3D scene as a data-layer addition, not a rewrite)
- RM-002 §Weight per surface (accessibility floor is a *character* invariant, not just a compliance floor — screen-reader users get the same warmth register as sighted visitors)

## Fable §3 planner-critic dialogue disagreements

**None at this reading.** Dialogue 2's guided-dolly synthesis (fixed waypoints + focusable DOM overlays as the accessibility path) is the exact architectural spine C2 encodes. Dialogue 3's rotunda-plus-Classics MVP holds. Dialogue 5's opt-in-audio-via-threshold-gesture is C3's problem, not C2's. If a disagreement surfaces during C-Build's C2 execution I'll name it at sign-off review.

---

## §1 — Three.js scene architecture

### §1.1 Delivery pattern (post-D-030 revision)

**Locked: dynamic `<script src>` injection at threshold action, not `React.lazy`.**

D-030 confirms no ES module graph exists — `React.lazy(() => import(...))` requires a bundler-produced chunk system that doesn't exist here. Instead, the museum's threshold `handleEnter` callback triggers a Promise-wrapped injection sequence:

```
1. Inject <script src="https://unpkg.com/three@0.170.0/build/three.min.js">
2. On load, inject GLTFLoader.js + DRACOLoader.js + KTX2Loader.js from three@0.170.0/examples/jsm/loaders/ (UMD variants)
3. On load, initialize the scene module (museum/scene/scene.jsx)
```

This is identical in shape to the CDN pattern already in `museum/index.html` for React + ReactDOM + Babel-standalone. Zero new tooling; consistent runtime story. **The capability check that already runs at threshold action (verified in C1) gates this whole sequence — if `use3D === false` the injection is skipped entirely, and the visitor never pays the 3D-chunk cost.**

**Loading state during injection:** brief "Preparing museum..." message rendered in `--museum-ink` background with Marcellus greeting-style typography. Not a spinner (which reads as failure/wait); a stated transition. Suppressed under `prefers-reduced-motion` (instantaneous swap).

**Version pin:** Three.js `0.170.0`. Rationale: stable at time of C2 plan, has hardened DRACOLoader + KTX2Loader UMDs on the `examples/jsm/loaders/` CDN path. Any version-bump is a data-layer edit (change three CDN URLs in one place, re-test), not a rewrite.

### §1.2 Scene graph

**One `THREE.WebGLRenderer` at the museum sub-app level. One `THREE.Scene`. Two GLB models loaded into the same scene as sibling groups.**

```
scene: THREE.Scene
  ├── rotunda: GLTF root → THREE.Group  (positioned at origin)
  ├── classicsHall: GLTF root → THREE.Group  (positioned at [+15, 0, 0] — through the "Classics" doorway)
  ├── sealed-plaques: THREE.Group  (four screen-space plane meshes)
  ├── dollyCamera: THREE.PerspectiveCamera  (attached to CatmullRomCurve3 traversal)
  ├── ambientLight: THREE.AmbientLight  (low intensity, --museum-ocean tint)
  └── emissiveLights: THREE.PointLight[]  (marquee glows, doorway seals)
```

**No real-time shadows.** All light bake is in the GLB texture pass (Fable §2). Runtime lighting is emissive materials only + a low ambient wash. This is decisive on the payload budget — real-time shadows would double the frame cost and inflate the 3D chunk (needs shadow maps + shadow-material variants).

**Renderer settings:** `antialias: true` if capability check confirms desktop; downgrade to `false` if a fallback branch is added later for low-power desktops. Pixel ratio capped at `window.devicePixelRatio ≤ 2` to avoid overdraw on high-DPR displays.

**No mouse-look at v1.** Fable §Dialogue 2 synthesis explicitly names this: click/Enter/arrow advance between waypoints. No `OrbitControls`, no drag-look. v2+ opt-in only.

### §1.3 Dolly camera + waypoints

**Path:** `THREE.CatmullRomCurve3` through waypoint positions. Camera position tweened along `curve.getPoint(t)` where `t` advances from waypoint N to waypoint N+1 over an eased duration.

**Advancement input:**
- Click on the DOM overlay's "Continue" affordance → next waypoint
- Enter key while overlay focus is active → next waypoint
- Arrow-right → next waypoint; Arrow-left → previous waypoint

**Easing:** ease-in-out cubic, ~1.4s per traversal at neutral. Instantaneous under `prefers-reduced-motion` — camera snaps to target position, no tween.

**Waypoint set (v1, per manifest):**

| Hall | Waypoint id | Position (approx.) | DOM overlay content |
|---|---|---|---|
| rotunda | `rotunda-center` | `[0, 1.6, 0]` (eye height, room center) | "You stand at the center of an obsidian rotunda. Five doorways ring you. Four are sealed." |
| rotunda | `rotunda-guest-book` | `[0, 1.6, -3]` (facing pedestal) | *placeholder — real copy lands at C3 with guest book* |
| classics | `classics-entry` | `[+10, 1.6, 0]` (just past doorway) | "Classics. The oldest games are the ones that taught the industry to imagine." (from `narration.json[classics-entry-tour-guide-open]`) |
| classics | `classics-mid` | `[+15, 1.6, 0]` | (transitional; renders adjacent cabinets on either side) |
| classics | `classics-back` | `[+20, 1.6, 0]` (far end) | "The far wall pulses with a warmth you have to walk closer to feel." |
| classics | `classics-mazechase-position` | `[+13, 1.6, +2]` (facing cabinet) | placard from `narration.json[classics-mazechase-placard]` + zoom affordance (see §1.4) |
| classics | `classics-dk-position` | `[+15, 1.6, +2]` | placard + no-zoom (attract mode only) |
| classics | `classics-mario-position` | `[+17, 1.6, +2]` | placard + no-zoom (attract mode only) |

**Positions are approximate.** Sonnet iterates against the shipped rotunda + Classics GLBs; my job here is to lock the *count* and *DOM-overlay pairing*, not the millimeter coordinates.

### §1.4 Cabinet zoom (per-cabinet close-up)

Zoom is not a camera dolly — it's a **DOM overlay swap**. When the visitor advances into a cabinet waypoint and activates the "Look closer" affordance:

- 3D scene: camera holds position; a subtle vignette overlay dims the render canvas to ~30% opacity.
- DOM: a full-viewport modal renders the cabinet's placard (from `cabinets.json[cabinet_id].placard_copy_md`) + attract-loop image (v1: `placeholder_alt` styled placeholder; C3 replaces with real art) + playable-game button (only for `playable: true`).
- Escape / "Step back" affordance returns to the waypoint state.

**Why DOM-overlay-swap instead of camera-zoom:** the placard text needs to be selectable, screen-reader-accessible, and Marcellus-typeset. A 3D texture-mapped placard fails all three. The DOM overlay IS the accessibility path made visible.

**Playable mini-game (maze-chase) integration:** the "Play" button on the playable cabinet's zoom overlay swaps the modal content to a Canvas 2D element (spec at §3.2). This is the SAME game surface the 2D fallback renders — one code path, two containers.

### §1.5 Sealed doors

Four halls (`racing`, `shooters`, `fighting`, `self-selected`) have `doorway_state: "sealed"` in `halls.json`. In the 3D scene:

- Each sealed doorway renders a mesh occluding the passage, with the `sealed_plaque_text` applied as a texture (or as a DOM overlay pinned to the doorway's screen-space projection — Sonnet picks; both are viable).
- No dolly advancement is available past a sealed doorway; the waypoint set for sealed halls is intentionally empty (verified in `halls.json`).
- Sealed plaques use `--museum-slate` typography on `--museum-ink` background, low emissive `--museum-ember-soft` glow. Reuses landing-page "In formation" status vocabulary (per Fable Dialogue 3 synthesis — the brand voice is continuous).

**Interaction on sealed doorway focus:** DOM overlay announces "Sealed for now — this hall is in formation." Screen readers announce the same. Not a "not implemented" error state; a deliberate curatorial choice.

---

## §2 — GLB + texture pipeline

### §2.1 Offline compression (not in-repo tooling)

**`gltf-transform` CLI runs offline — probably on JR's or my machine — not in a CI step and not at ship time.**

Rationale: D-030 confirms no Node toolchain in the repo. Adding one for GLB compression would violate the runtime-pattern discipline. Compression is a build-artifact operation: run it locally, commit the compressed `.glb` files, ship those. Same pattern as image compression for the landing page (which is also offline).

**CLI pass per GLB source:**
```
gltf-transform optimize input.glb output.glb \
  --compress draco \
  --texture-compress webp \
  --texture-size 1024
gltf-transform ktx2 output.glb output-ktx2.glb \
  --mode uastc \
  --quality 200
```

Ship: `output-ktx2.glb` per model.

### §2.2 Asset locations + target sizes

```
museum/assets/models/
  rotunda.glb          ← ≤ 1.8 MB target
  classics-hall.glb    ← ≤ 2.5 MB target
museum/assets/textures/
  (embedded in the .glb via KTX2 — no separate texture files at C2)
```

**3D chunk payload budget (DD-032 ship gate ≤ 8 MB):**

| Asset | Target |
|---|---|
| `three.min.js` (Three.js core, UMD) | ~640 KB |
| `GLTFLoader.js` (UMD) | ~90 KB |
| `DRACOLoader.js` (UMD) + Draco decoder wasm | ~230 KB |
| `KTX2Loader.js` (UMD) + Basis Universal decoder wasm | ~750 KB |
| `rotunda.glb` | ≤ 1.8 MB |
| `classics-hall.glb` | ≤ 2.5 MB |
| Scene setup + waypoint config (`scene.jsx`) | ~15 KB |
| **Total 3D chunk** | **~6.0 MB** — comfortable margin below 8 MB ceiling |

If actual GLB sizes overshoot targets, Sonnet escalates before shipping. No silent budget breach.

### §2.3 Loaders — CDN paths (three-stdlib UMD)

```
https://unpkg.com/three@0.170.0/build/three.min.js
https://unpkg.com/three@0.170.0/examples/jsm/loaders/GLTFLoader.js
https://unpkg.com/three@0.170.0/examples/jsm/loaders/DRACOLoader.js
https://unpkg.com/three@0.170.0/examples/jsm/loaders/KTX2Loader.js
```

Draco and Basis decoders load from their vendored paths (`three@0.170.0/examples/jsm/libs/draco/`, `.../basis/`). Sonnet confirms exact URL on first load; if unpkg doesn't serve these paths cleanly, mirror to a `museum/assets/vendor/` directory as a fallback.

### §2.4 Asset production (source-to-ship)

**Out of scope for this DD.** GLB sources (rotunda + Classics hall) are not yet authored. Options for C2 execution:
1. Placeholder GLBs — programmatic geometry (box rooms with vertex-colored walls) as a scaffold so the scene wiring can be verified end-to-end before real 3D art lands.
2. Wait for GLB authoring before starting scene wiring.

**Recommendation: Sonnet ships programmatic-placeholder GLBs at C2 that render as simple obsidian rooms with correct dimensions, correct waypoint positions, correct doorway seals.** Real GLB art lands at C3 as a data-only asset swap (replace `.glb` file, no scene code change). This preserves the real-content ship bar for C3 — the placeholder GLB does not pass the "real placard copy on every visible cabinet" gate until real art + placard content is in place.

Ship-gate risk: Fable §1.6 constraint 5 (real-content ship bar) applies to the *final ship*, not C2. C2 signs off on architecture, not on final art. Sonnet's C2 impl explicitly labels placeholder GLBs as such in the impl log; the C3 gate audit confirms real GLBs before JR sign-off.

---

## §3 — 2D fallback content parity

### §3.1 Renderer model

**Manifest-driven DOM gallery. Same five JSON files as 3D scene. No manifest fork.**

Route mapping:

| Hash route | 3D scene renders | 2D fallback renders |
|---|---|---|
| `#/rotunda` (`renderMode === "2d"`) | — | Rotunda card grid: 5 hall entries (1 open + 4 sealed), guest-book pedestal card |
| `#/classics` (`renderMode === "2d"`) | — | Classics card grid: 3 cabinet cards (playable + 2 attract) + hall entry narration text |
| `#/classics/:cabinet-id` (`renderMode === "2d"`) | — | Cabinet detail view: full placard copy + attract art + (if playable) game button |

**Same code path for playable game.** The maze-chase Canvas 2D module (§3.2) is the *same* JavaScript module the 3D path invokes from its zoom overlay. The 2D fallback renders the game in a full-viewport modal; the 3D path renders it in the zoom overlay modal. One implementation, two containers.

### §3.2 Playable mini-game module

**Location:** `museum/games/maze-chase.js`
**Runtime:** Canvas 2D. No engine, no framework (Fable §2 discipline).
**Game loop:** fixed timestep, `requestAnimationFrame` driver, pauses on `document.visibilityState !== "visible"`.
**Input:** Keyboard (arrow keys) + touch (four-quadrant tap). Confirmed keyboard-complete.

**Content-parity guarantee:** the game module exports a `mount(container, options)` API where `container` is a DOM element the game canvas + score display attach to. Both the 3D zoom overlay and the 2D cabinet detail view call the same `mount()`. Same gameplay, same difficulty, same win/loss states.

### §3.3 Attract-mode loops (non-playable cabinets)

Non-playable cabinets (`playable: false`) render an attract-loop preview in place of the game button. v1 attract loops are:

- **v1 placeholder:** CSS-animated per-cabinet marquee-glow (Ember lines) inside a `--museum-ink` field with the `placeholder_alt` text overlaid in Marcellus. No image assets required.
- **C3 upgrade:** if real attract-loop art (`art.attract_loop_url` in `cabinets.json`) is populated, render that instead. Cabinets fall back to the CSS animation if the URL is null. Same code path for both.

### §3.4 Content-parity ship-gate lint (new)

Extend `museum/lint/lint-manifests.js` with:

- **Constraint 8:** every `cabinets[]` entry with `playable: false` has non-null `placard_copy_md` and non-null `placeholder_alt`.
- **Constraint 9:** every `cabinets[]` entry with `playable: true` has non-null `game_module` AND that `game_module` value corresponds to an existing file at `museum/games/{game_module}.js`.

Sonnet enforces at C2 impl; ship-gate runs before C3 sign-off.

---

## §4 — Accessibility path

### §4.1 Waypoint DOM overlay pattern

**Every 3D waypoint has a matching DOM element in the same visual layer.** The DOM overlay is `position: absolute`, `pointer-events: auto`, focusable (`tabIndex={0}`), and carries:

- Screen-reader label: `aria-label` announcing the waypoint name + adjacent-hall-doorway context
- Visible affordance: "Continue →" / "← Step back" buttons (Marcellus + JetBrains Mono, `--museum-paper` on `--museum-ink`)
- Placard text (for cabinet waypoints): rendered from `narration.json[placard_narration_id].text`, Marcellus, `--museum-paper`
- ARIA live region for camera-motion announcements ("Moving to Classics hall, cabinet 1 of 3")

**Focus + camera in lockstep:** advancing to the next waypoint moves both the 3D camera AND the DOM overlay focus. `Tab` order matches waypoint order. Screen-reader users get a fully coherent "walk" through the museum without seeing the 3D scene.

### §4.2 WCAG-AA contrast audit

**Target: 4.5:1 for body text; 3:1 for large text (18pt+ / 14pt+ bold).**

Palette combinations that must be verified before C2 sign-off:

| Foreground | Background | Use | Expected ratio |
|---|---|---|---|
| `#FAFAF7` (Paper) | `#0B1726` (Ink) | placard text, waypoint labels | ~17.5:1 ✅ well above |
| `#C97B4A` (Ember) | `#0B1726` (Ink) | affordance buttons, marquee text | ~5.4:1 ✅ above 4.5 |
| `#5D809D` (Slate) | `#0B1726` (Ink) | secondary labels, sealed-door plaques | ~4.6:1 ✅ borderline — Sonnet verifies with axe-core |
| `#E4A57E` (Ember-soft) | `#0B1726` (Ink) | subtle glow accents, non-text-only | not text — decorative only |

**Slate-on-Ink is the risk edge.** If axe-core reports a fail (browser subpixel differences may push below 4.5), fallback is to reserve Slate for large-text only (headings, plaques, ≥ 18pt) and use `--museum-paper` for body-weight secondary text. Sonnet audits and flags in impl log.

### §4.3 Keyboard traversal specification

**Reachability from cold load:**

1. Threshold buttons → Tab-reachable, focus-visible outline, Enter activates.
2. Rotunda center → auto-focus on entry (announced via live region).
3. Advance keys: `Tab` (through DOM overlay elements) → `Enter` (advance to next waypoint) → `Arrow-right` (advance) / `Arrow-left` (retreat) → `Escape` (exit zoom overlay / back to waypoint from cabinet detail).
4. All five halls' doorways reachable via `Tab` cycle from rotunda-center.
5. Every cabinet reachable via classics hall waypoint sequence.
6. Guest book pedestal reachable via rotunda `Tab` cycle (C3 gates the guest-book impl; C2 requires only the waypoint reachability).

**No mouse-only interaction anywhere.** Every 3D scene affordance has a keyboard equivalent. Sonnet documents this by running Playwright with mouse events disabled + confirming full museum traversal.

### §4.4 `prefers-reduced-motion` behavior

- Dolly camera: snaps to target position (no tween) on advance.
- Threshold door transition: already suppressed at C1 (verified).
- Attract-mode CSS animations: paused (`animation-play-state: paused`).
- Zoom overlay transitions: instant (no fade).

**Live region announcements are NOT motion.** They continue to fire — screen-reader users need position confirmation regardless of motion preference.

### §4.5 Screen-reader manual gate (C3, not C2)

C2 signs off on axe-core-clean + keyboard-complete. NVDA/VoiceOver manual pass is a C3 gate — that requires a human tester (JR) and real screen-reader software. Naming here so Sonnet doesn't attempt to claim SR-clean at C2 sign-off; C2 signs off "accessibility architecture verified via axe-core + keyboard traversal Playwright script."

---

## §5 — Sonnet unlocks after C2 sign-off

Per DD-032 kickoff §Checkpoint 2 unlocks, plus my architecture:

1. **Three.js scene wiring** — dynamic loader injection sequence in `museum/museum.jsx`, `museum/scene/scene.jsx` module, `THREE.WebGLRenderer` mount, `CatmullRomCurve3` dolly, waypoint config from manifests.
2. **Placeholder GLB models** — programmatic geometry for rotunda + Classics hall + 4 sealed doorways; committed as `.glb` files at `museum/assets/models/` (real art swap at C3).
3. **2D fallback renderer** — real replacement for the C1 `TwoDFallbackStub` component; hall gallery, cabinet grid, cabinet detail views, all manifest-driven.
4. **Cabinet zoom overlay** (both paths) — DOM modal, placard render, "Look closer / Step back" affordance, "Play" button on playable cabinet.
5. **Maze-chase mini-game** — `museum/games/maze-chase.js`, Canvas 2D, keyboard + touch, pause on `visibilitychange`, `mount(container)` API shared between 3D zoom and 2D detail.
6. **Attract-mode CSS animation** — v1 CSS-only marquee-glow with Marcellus overlay text for the two non-playable cabinets.
7. **Waypoint DOM overlays** — focusable, `aria-label`, live region announcements, keyboard-lockstep with camera.
8. **Sealed-door plaques** — 4 plaques rendered in the rotunda, "In formation" text, DOM overlay announcement.
9. **Ship-gate lint additions** — constraint 8 + 9 encoded in `lint-manifests.js`.
10. **Verification protocol** — Playwright script for keyboard-complete traversal + axe-core pass on all DOM states + payload measurement.

**Not unlocked at C2** (C3 only):
- Real GLB art assets (rotunda + Classics)
- Real cabinet attract-loop images
- Real placard copy revisions (JR content pass — v1 placeholder copy stays until then)
- Audio pipeline (transcode, host, Web Audio manager, `visibilitychange` pause)
- Guest book pedestal (localStorage + defensive wrappers + "Not {name}?" fallback + "scratch out" affordance)
- Real narration audioUrl values (DD-015a arc; Chief bridges)
- NVDA/VoiceOver manual pass (JR gate)
- Payload production-CDN swap (see D-030 note)

---

## §6 — Ship gate status at C2

| Gate | Status at C2 sign-off |
|---|---|
| WCAG-AA contrast audit clean | **Clears at C2** (via axe-core, Playwright-driven) |
| Keyboard-complete traversal | **Clears at C2** (Playwright script with mouse events disabled) |
| Mobile 2D content-equal | **Clears at C2** (Playwright at 375px viewport confirms cabinet-count parity) |
| Initial payload ≤ 2.5 MB | Still not affected by C2 (all C2 additions land in the lazy 3D chunk or in the 2D fallback bundle which loads inline but is small) |
| 3D chunk ≤ 8 MB | **Clears at C2 with placeholder GLBs; re-verified at C3 with real GLBs** |
| Brand-token lint clean | Flip lint-brand-tokens `EXIT_NONZERO_ON_VIOLATION = true` at C2 sign-off |
| Real-content ship bar | Still C3 only — placeholder GLBs + placeholder placards do NOT pass this gate |
| JR sign-off | Still C3 terminal |

Three ship gates clear at C2. Three wait for C3. One preserved-locked from C1. One flips enforcement mode.

---

## §7 — What triggers the next session log

Two session logs feed into the C2 sign-off:

1. **C-Build C2 impl log** — filename `session-log-YYYY-MM-DD-sonnet-c2-impl.md`. Signal to fire: C-Build completes all 10 items in §5 and stops for Opus@CH review before touching any C3 unlock (audio, guest book, real placards, real GLBs).
2. **Opus@CH C2 sign-off** — filename `session-log-YYYY-MM-DD-opus-c2-signoff.md`. Signal to fire: after I review C-Build's impl log against §5 items + ship-gate table. Companion decision D-031 lands with sign-off.

**Contingency signal:** if C-Build's C2 execution surfaces new pattern-deviations from this artifact (following the same discipline as C1), those get flagged in his impl log and I adjudicate at sign-off. Same pattern as C1 — the mailbox absorbs them; nothing silently overridden.

---

## Cross-references

- **DD-032:** [`References/Designs/DD-032 SoD Museum — rotunda plus Classics hall.md`](../../../../References/Designs/DD-032%20SoD%20Museum%20—%20rotunda%20plus%20Classics%20hall.md)
- **Kickoff + Chain history:** [`C Roles/Strategies/kickoffs/DD-032-Opus-CH-arch-review.md`](../../../../C%20Roles/Strategies/kickoffs/DD-032-Opus-CH-arch-review.md)
- **C2 impl kickoff to C-Build:** [`C Roles/Strategies/kickoffs/DD-032-C-Build-c2-scene.md`](../../../../C%20Roles/Strategies/kickoffs/DD-032-C-Build-c2-scene.md)
- **C1 arch artifact:** [`session-log-2026-07-04-c1-arch.md`](session-log-2026-07-04-c1-arch.md)
- **C-Build C1 impl log:** [`session-log-2026-07-04-sonnet-c1-impl.md`](session-log-2026-07-04-sonnet-c1-impl.md)
- **Opus@CH C1 sign-off:** [`session-log-2026-07-04-opus-c1-signoff.md`](session-log-2026-07-04-opus-c1-signoff.md)
- **D-030 (runtime pattern):** [`pipeline/DECISIONS.md`](../../pipeline/DECISIONS.md)

---

*Locked — Opus@CH, 2026-07-04*
*C2 kickoff to C-Build drafts next; C2 impl begins on C-Build's acknowledgment.*
