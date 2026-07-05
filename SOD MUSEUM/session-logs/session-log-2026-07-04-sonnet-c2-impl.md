---
session_date: 2026-07-04
session_type: sonnet-impl
participants: [Opus@CH, C-Build]
dd_touched: [DD-032]
ship_gate_cleared: null
next_session_signal: Opus@CH reviews this log against the C2 arch §5 items + ship-gate table, then either signs off (unlocking C3) or kicks back
tags: [sod-museum, dd-032, checkpoint-2, sonnet-impl, c-build, three-js, pattern-deviation]
---

# Session Log — Sonnet C2 implementation

**Author:** C-Build
**Date:** 2026-07-04
**DD:** [DD-032 — SoD Museum rotunda plus Classics hall](../../../../References/Designs/DD-032%20SoD%20Museum%20—%20rotunda%20plus%20Classics%20hall.md)
**Kickoff:** [`C Roles/Strategies/kickoffs/DD-032-C-Build-c2-scene.md`](../../../../C%20Roles/Strategies/kickoffs/DD-032-C-Build-c2-scene.md)
**Opus@CH C2 arch artifact:** [`session-log-2026-07-04-c2-scene.md`](session-log-2026-07-04-c2-scene.md)

---

## What shipped

All 10 work items from the kickoff/arch §5 executed and verified live (details below).

| Item | Status |
|---|---|
| 1. Three.js dynamic loader injection | Shipped, with a version-pin correction (see PD1) |
| 2. `museum/scene/scene.js` — Three.js scene module | Shipped as plain JS, not JSX (see PD2) |
| 3. `museum/fallback/gallery.jsx` — 2D fallback renderer | Shipped, replaces C1 stub |
| 4. Cabinet zoom overlay (both paths) | Shipped as `museum/cabinets/zoom-overlay.jsx`, one component, two callers |
| 5. `museum/games/maze-chase.js` — playable mini-game | Shipped, grid-based, keyboard + touch |
| 6. Attract-mode CSS animation | Shipped inline in zoom-overlay.jsx's `AttractLoop` + museum.css |
| 7. Waypoint DOM overlays | Shipped — `WaypointOverlay` + ARIA live region in museum.jsx |
| 8. Sealed-door plaques | Shipped as static DOM row at rotunda-center (see PD3 — simplified from per-frame 3D projection) |
| 9. Ship-gate lint additions | Shipped — constraints 8+9 in `lint-manifests.js` |
| 10. Verification protocol | Executed via Claude Preview (browser-driven), not Playwright; axe-core substituted with direct contrast computation (see PD4) |

**Files created:**
- `museum/scene/scene.js`
- `museum/fallback/gallery.jsx`
- `museum/cabinets/zoom-overlay.jsx`
- `museum/games/maze-chase.js`

**Files modified:**
- `museum/museum.jsx` — dynamic 3D injection, route dispatch to scene/gallery, waypoint overlay, sealed-door row, **one real bug fix** (see below)
- `museum/museum.css` — scene mount, waypoint overlay, sealed plaques, cabinet detail, attract-mode animation, gallery grids, game canvas styles, **two WCAG contrast fixes** (see below)
- `museum/index.html` — added script tags for `games/maze-chase.js`, `cabinets/zoom-overlay.jsx`, `fallback/gallery.jsx` (load order before `museum.jsx`)
- `museum/lint/lint-manifests.js` — constraints 8+9
- `museum/lint/lint-brand-tokens.js` — enforcement flipped to blocking (`EXIT_NONZERO_ON_VIOLATION = true`), extended to scan `.js` files and Three.js-style `0x` hex literals (not just CSS `#hex` strings)

**Not touched:** real GLB art, real attract-loop images, real placard copy, audio pipeline, guest book, NVDA/VoiceOver manual pass, production-CDN swap. All correctly deferred to C3.

---

## Real bug found and fixed during verification

**Threshold-skip dead-end on stale deep-link hash.** `showThreshold` was `!audioOptIn && (route === "/" || route === "")` — inherited unchanged from C1. Live-tested this session: with a stale `#/rotunda` hash in the URL (e.g. leftover from a prior visit) but no `sod_audio_optin` yet set, this evaluates false (route isn't `/`), so the threshold never renders — but `renderMode` is also still `null` (the deep-link effect only fires when `audioOptIn` is truthy), so the app falls through every render branch into a permanent "Loading…" stub. Reproduced live, not theoretical. Fixed: `showThreshold = !audioOptIn` — gate on opt-in state alone, regardless of route. This existed in the C1 code too but never surfaced because C1 testing always started from a clean hash.

---

## Pattern-deviations flagged for Opus@CH review

**PD1 — Three.js version pin corrected: 0.160.0, not the arch's stated 0.170.0.**

Verified live via unpkg's `?meta` API (not assumption): `three@0.170.0` publishes only `three.cjs`, `three.module.js`, `three.module.min.js`, `three.webgpu*.js` — **no classic global/UMD `build/three.min.js`.** Confirmed the exact deprecation boundary by bisecting: r160 still ships it, r161 does not. The arch's §1.1/§2.3 CDN path (`three@0.170.0/build/three.min.js`) is a 404 that doesn't exist at any minor of 0.170 — this isn't a network hiccup, it's a real spec error (three.js stopped shipping global builds around r161, well before Opus's stated pin). Live symptom before the fix: `net::ERR_BLOCKED_BY_ORB` on script injection, silently falling back to 2D every time (the fail-soft path worked correctly — it just meant 3D never actually loaded). Fixed by pinning to `0.160.0`, the last version with a working classic-script build. This keeps the runtime pattern exactly as D-030 locked it (global script tag, `window.THREE`, no module graph) — no expansion of the pattern, just a correct version.

**Second latent issue, flagged but not yet blocking:** the arch's §2.3 loader paths (`three@X/examples/jsm/loaders/{GLTFLoader,DRACOLoader,KTX2Loader}.js`) are ES-module-only by folder convention (`jsm` = "JS modules") across **every** three.js version, old or new — they were never going to work as classic `<script src>` tags regardless of the version-pin fix above. Since C2 ships procedural placeholder geometry (see PD2) and never injects these loaders, this doesn't block C2. It will resurface at C3 when real GLBs need loading. The classic-script equivalent in older three.js releases was `examples/js/loaders/*.js` (no "m") — worth checking whether r160 (or whatever version C3 lands on) still publishes that non-module path, or whether C3 needs the import-map + native-ES-module approach instead (a real expansion of the D-030 runtime pattern that should get its own named decision, not be backed into silently).

**PD2 — `scene/scene.js` is plain JS, not JSX.**

Named in the file's own header comment, repeating here for the record: Babel-standalone only auto-transforms `<script type="text/babel">` tags present in the DOM at initial page load. A dynamically-injected `<script type="text/babel">` (which is what a lazy-loaded 3D chunk necessarily is) never gets picked up — Babel's scan already ran. Writing the scene module in plain JS (imperative Three.js calls, no JSX) sidesteps the problem entirely rather than working around it with a manual `Babel.transform()` + `eval()` step, which would be both riskier and a bigger departure from the existing site's script-loading conventions. `museum.jsx` mounts it the same way it mounts the maze-chase game: imperatively, via a `useEffect` calling `window.MuseumScene.mount(container, config)`.

**PD3 — Sealed-door plaques rendered as a static DOM row, not per-frame 3D-to-screen projection.**

The arch §1.5 explicitly left this to Sonnet's judgment ("a 3D texture-mapped plaque is an accessibility hazard... DOM overlay pinned to each sealed doorway's screen-space projection is the simplest path... Sonnet picks; both are viable"). True per-frame projection (`Vector3.project(camera)` recalculated every render tick, updating each plaque's CSS position) would couple the DOM overlay layer to the render loop for a benefit that doesn't actually matter here: the camera only ever sits at `rotunda-center` when all four sealed doors are simultaneously "visible," and it never moves away from that single waypoint without an explicit user action. So the four plaques are a static, always-in-the-same-place row shown only while `waypointId === "rotunda-center"`, hidden otherwise. Functionally identical reachability and correctness; meaningfully less code and no render-loop coupling. Same treatment applied in the 2D fallback per the arch's own instruction (sealed hall cards render `sealed_plaque_text` directly).

**PD4 — axe-core CDN injection blocked by harness policy; substituted direct WCAG contrast computation.**

Attempted to inject `axe-core@4.10.0` from unpkg into the browser preview to run a real automated WCAG-AA pass per the kickoff's verification protocol. The harness's auto-mode classifier denied this ("agent injected and executed a script from an external CDN... a source it chose unilaterally with no user request for this specific library"). Did not attempt a workaround. Instead computed WCAG contrast ratios directly (standard relative-luminance formula, plain math, no external code) for every foreground/background pair actually used in the CSS.

**This caught a real problem the arch itself flagged as a risk edge, and it's worse than estimated:** arch §4.2 estimated Slate-on-Ink at "~4.6:1, borderline." Direct computation gives **4.33:1 — an actual fail** against the 4.5:1 body-text threshold, not a borderline pass. Audited every Slate-as-text usage in `museum.css`:
- `.museum-stub-note` (13px) — already used Paper, not Slate, from earlier authoring; confirmed fine (17.24:1).
- `.threshold-btn-quiet:hover/:focus-visible` — was `background: Slate; color: Ink` (12px uppercase button text) — same 4.33:1 pair, a real fail. **Fixed:** hover/focus background changed to Paper (Ink-on-Paper is 17.24:1), Slate retained only as the button's border color (decorative, WCAG non-text threshold is 3:1, and Slate-on-Ink clears that at 4.33:1 easily).
- `.sealed-plaque-name` (15px/600 weight) — was Slate, with a comment claiming "large-text" exemption. 15px/600 doesn't meet WCAG's large-text bar (needs 18.66px+bold or 24px+regular) even before the contrast math; direct computation shows it would have failed regardless of size. **Fixed:** switched to Paper, matching the `.hall-card-name` convention already used elsewhere in the 2D fallback.

No axe-core pass ran end-to-end across every DOM state as the kickoff's verification protocol asked for — that's a real gap against the letter of the instruction. What I can attest to: the specific risk the arch named was investigated with real numbers (not guessed), found worse than expected, and fixed at its only two usage sites. **Recommend:** JR or Opus@CH runs the axe DevTools browser extension (or explicitly approves a scoped axe-core CDN injection) for a full automated pass before C3 sign-off closes the WCAG-AA gate for good — I don't consider this checkpoint's contrast work a substitute for that, just the most I could verify under the current tool restriction.

---

## Verification performed

Local static-file preview (`.claude/launch.json`, same as C1), driven via Claude Preview:

- **Threshold → 3D:** "Enter with sound" on desktop/WebGL-capable browser → `three@0.160.0` loads (`window.THREE.REVISION === "160"`) → `scene.js` loads → canvas mounts at container size → rotunda renders (obsidian cylinder, warm doorway-seal glow at Classics, 4 sealed panels).
- **Keyboard-only traversal:** dispatched real `KeyboardEvent`s (`ArrowRight`/`ArrowLeft`) — advanced through all 8 waypoints in sequence (rotunda-center → rotunda-guest-book → classics-entry → classics-mid → classics-mazechase-position → classics-dk-position → classics-mario-position → classics-back), confirmed `waypoint-overlay` `aria-label` and placard text update correctly at each stop, confirmed retreat (`ArrowLeft`) walks back correctly, confirmed `Continue`/`Step back` buttons correctly disable at the sequence's two ends.
- **Cabinet zoom overlay:** "Look closer" at the maze-chase waypoint → full placard + attract-art placeholder render (bold markdown span renders as `<strong>`) → "Play" mounts the maze-chase game inside the overlay → `Escape` key closes it back to the waypoint.
- **Maze-chase gameplay:** dispatched `ArrowRight` keydowns — moves counter incremented correctly (2 of 4 presses succeeded before a wall, matching the hand-authored maze layout exactly) — confirms real wall-collision logic, not a stub.
- **Sealed-door plaques:** all 4 render only at `rotunda-center`; clicking one fires the correct `aria-live` announcement ("Racing: In formation. Sealed for now, this hall is in formation.").
- **Mobile viewport (375px):** capability check correctly forces the 2D fallback. `RotundaGrid` renders exactly the 5 real doorways (rotunda hub itself correctly excluded — see bug fix below) + guest-book card. `ClassicsGrid` renders exactly 3 cabinets with the playable badge only on Maze Chase — cabinet-count parity with the 3D path confirmed (3 = 3).
- **2D cabinet detail + game:** navigated to `#/classics/classics-mazechase`, confirmed the *same* `MuseumMazeChase.mount()` call mounts and plays identically inside the 2D route's container — "one code path, two containers" confirmed, not just asserted.
- **`node museum/lint/lint-manifests.js`** → CLEAN, including new constraints 8+9.
- **`node museum/lint/lint-brand-tokens.js`** → CLEAN with enforcement now blocking (`EXIT_NONZERO_ON_VIOLATION = true`). Caught two real violations during development (an off-palette wall shade reintroduced in both `scene.js` and `maze-chase.js`, and a false-positive from my own explanatory comment quoting the old hex) — both fixed; final state clean across 6 files.
- **Payload measurement:** `three.min.js` (r160) = 669,884 bytes (~654 KB, matching the arch's own ~640 KB estimate almost exactly) + `scene.js` = 10,368 bytes (~10 KB). **Total 3D chunk ≈ 665 KB** — far under the 8 MB ceiling, well under even the arch's own ~6.0 MB estimate, specifically because no GLTFLoader/DRACOLoader/KTX2Loader or GLB assets are loaded at C2 (see PD1's second issue). Initial-payload-path additions (`museum.jsx` 17.3 KB + `zoom-overlay.jsx` 4.0 KB + `gallery.jsx` 3.0 KB + `maze-chase.js` 7.5 KB + `museum.css` 12.5 KB ≈ 44.3 KB total) are trivial against the 2.5 MB ceiling.

**Not performed:** Tab-order cycling wasn't separately fuzzed beyond confirming all interactive elements are real, natively-focusable `<button>`/`<a>` elements (native Tab/Enter semantics, not custom `div`-with-`tabIndex` reimplementations, except the sealed plaques and hall-sealed cards which do use `tabIndex={0}` on non-button elements by necessity — those were spot-checked via click/focus, not exhaustively Tab-cycled). Full axe-core automated pass not performed (PD4). NVDA/VoiceOver manual pass correctly not attempted (C3/JR gate per arch §4.5).

---

## Ship gates — self-assessment against arch §6

| Gate | Arch §6 target | Self-assessment |
|---|---|---|
| WCAG-AA contrast audit clean | Clears at C2 | **Partial.** Named risk edge (Slate-on-Ink) investigated with real math, found worse than estimated, fixed at both usage sites. Full axe-core pass blocked by harness policy (PD4) — recommend a manual/approved pass before treating this gate as fully closed. |
| Keyboard-complete traversal | Clears at C2 | Core path (dolly advance/retreat, zoom open/close, game input) verified via direct keyboard-event dispatch. Full Tab-order cycling not exhaustively fuzzed. |
| Mobile 2D content-equal | Clears at C2 | Verified — cabinet-count parity (3=3), hall-count parity (5 real doorways + guest book in both), same game module in both containers. |
| 3D chunk ≤ 8 MB | Clears at C2 | Measured ≈ 665 KB with placeholder geometry — well clear. Will need re-measurement at C3 once real GLBs + loaders (GLTFLoader/DRACOLoader/KTX2Loader) are added — see PD1's second flag for the loader-path issue that will need resolving then. |
| Brand-token lint clean | Clears at C2 | Enforcement flipped to blocking; clean across 6 files (extended scan to `.js` and `0x`-literal colors — see lint changelog). |
| Initial payload ≤ 2.5 MB | Not C2's concern (per arch) | Confirmed no threat — C2 additions to the initial path total ≈ 44 KB. |
| Real-content ship bar | C3 only | Untouched — placeholder geometry, placeholder art, placeholder placards all correctly still placeholder. |
| JR sign-off | C3 only | Untouched. |

---

## What's deferred (per kickoff/arch, correctly untouched)

Real GLB art (rotunda + Classics), real cabinet attract-loop images, real placard copy, audio pipeline (transcode/host/Web Audio manager), guest book pedestal, real narration `audioUrl` values, NVDA/VoiceOver manual pass, production-CDN swap.

---

## What triggers the next session log

Per the kickoff: this log is the trigger. Standing by for Opus@CH's sign-off review — not touching any C3 unlock (audio, guest book, real placards, real GLBs) until that review lands.

— C-Build, 2026-07-04
