---
session_date: 2026-07-05
session_type: sonnet-impl
participants: [Opus@CH, C-Build, JR]
dd_touched: [DD-032]
checkpoint: 3
ship_gate_cleared: null
next_session_signal: Opus@CH reviews this amended log. Both blockers from the original C3 impl log are now resolved and verified. Remaining open items are JR-side by design (content pass, axe/Tab-fuzz, sign-off) per the addendum.
tags: [sod-museum, dd-032, checkpoint-3, sonnet-impl, c-build, amended, babel-transpile, scene-geometry, real-bug]
---

# Session Log — Sonnet C3 implementation, amended pass

**Author:** C-Build
**Date:** 2026-07-05
**Amends:** [`session-log-2026-07-05-sonnet-c3-impl.md`](session-log-2026-07-05-sonnet-c3-impl.md)
**Addendum executed against:** [`session-log-2026-07-05-c3-arch-addendum-scene.md`](session-log-2026-07-05-c3-arch-addendum-scene.md)
**Kickoff:** [`C Roles/Strategies/kickoffs/DD-032-C-Build-c3-shipbar.md`](../../../../C%20Roles/Strategies/kickoffs/DD-032-C-Build-c3-shipbar.md)

---

## Headline: both prior blockers resolved. Babel transpile shipped, payload gate clears by >10x margin, scene geometry pass shipped and screenshot-verified. One real bug found and fixed during the Babel swap (a genuine cross-script `const` collision, not a tooling artifact).

This picked up exactly where the original C3 impl log and Opus@CH's review left off: JR's scoped Babel authorization (addendum §A.2, pasted verbatim at session start) unblocked Item 10's other half, and the programmatic-scene decision (addendum §A.1, D-034) unblocked the real-content ship bar without needing GLBs at v1.

---

## What shipped this pass

| Item | Status |
|---|---|
| Scene geometry pass (addendum §A.1) | Done — faceted 12-facet obsidian rotunda, sparse Ember vein accents, faceted receding ceiling, Slate floor ring, 5 evenly-spaced doorways (1 open + 4 sealed, sealed doors carry zero PointLights), faceted Classics hall sharing one depth-fog, 3 cabinet silhouettes with marquee/screen/control-deck geometry and reduced-motion-safe flicker |
| Screenshot pass at every waypoint | Done — all 8 waypoints walked and screenshotted (visual regression baseline for the v2 GLB swap) |
| Babel transpile (Item 10, Blocker 2) | Done — 4 `.jsx` → `.js`, `@babel/standalone` (3.14 MB) dropped from `index.html` |
| Payload re-measurement | Done — **≈ 0.21 MB**, clears the 2.5 MB ceiling with roughly 12x margin to spare |
| Ship-gate lint + brand-token lint | Both clean (manifest lint's only hit is the expected `<<HELD FOR JR>>` guest-book string, present in both the `.jsx` source and its transpiled `.js` — correct, not a regression) |

**Files created:** `museum/museum.js`, `museum/fallback/gallery.js`, `museum/cabinets/zoom-overlay.js`, `museum/rotunda/guest-book-modal.js` (transpiled outputs; source `.jsx` files remain the edit target per the addendum's noted offline-pipeline step).

**Files modified:** `museum/scene/scene.js` (full geometry pass), `museum/index.html` (script swap: 4 `.jsx` + `@babel/standalone` → 4 `.js`, no Babel).

---

## Scene geometry pass — what I built and one real fix along the way

Built per addendum §A.1 exactly: faceted rotunda (`CylinderGeometry` at 12 radial segments, `flatShading: true`), 5 sparse Ember-emissive vein strips on wall seams, a faceted receding cone ceiling, a Slate radial floor ring, 5 evenly-spaced doorway arches (open Classics doorway carries the rotunda's one strong PointLight; the 4 sealed doorways carry a recessed panel + emissive perimeter seam and **no** PointLight — lighting-budget discipline), a faceted Classics hall sharing one `THREE.Fog` for depth falloff, and 3 cabinet silhouettes (marquee header + recessed screen + sloped control deck) with a subtle ~0.5 Hz sine flicker on the screen plane, fully suppressed under `prefers-reduced-motion`. PointLight budget: 5 of the addendum's ≤6 ceiling.

**Legibility bug found and fixed during verification (not a spec deviation — a real rendering defect):** the first pass used a matte `roughness: 0.9` material for both the rotunda and Classics walls. Under the addendum's sparse-PointLight-only lighting budget, this rendered as a near-formless soft glow with zero visible facet definition — the opposite of "visible facet seams are the crystal structure" (addendum's own framing). Root cause: obsidian is volcanic *glass*, not matte stone; a highly diffuse material can't carry specular facet-edge contrast under sparse point lighting no matter how the geometry is built. Fixed by lowering `roughness` to 0.35 and adding `metalness: 0.2` on both wall materials, plus a modest `HemisphereLight` (intensity 0.5, not a PointLight, so it doesn't touch the budget) for a legibility floor. Verified live across all 8 waypoints — facet seams now read as distinct specular edges; the moody/dark reading JR's brief calls for is preserved (I did NOT flatten this into a brightly-lit room; an interim ambient-intensity-2.2 test confirmed the darkness is a palette-albedo ceiling, not a bug, and I reverted that test before shipping).

Also re-spaced the 4 sealed-doorway `angleDeg` values from an uneven cluster (90/162/198/270) to true 72°-even spacing (72/144/216/288), confirmed against `manifest/halls.json` that no external contract reads these angles — internal-only, no contract change.

---

## Babel transpile — a real bug found and fixed (cross-script `const` redeclaration)

Ran the JR-authorized `npx @babel/cli` + `@babel/core` + `@babel/preset-react` pass (classic runtime — the automatic runtime's default `import ... from "react/jsx-dev-runtime"` output is incompatible with this page's no-bundler, global-`React` CDN pattern; forced via a temporary `babel.config.json` with `{"runtime": "classic"}`, deleted after the transpile). Preset/CLI package resolution under Node 24 needed `NODE_PATH` pointed at the npx cache's `node_modules` to resolve correctly — a mechanical fix, not a scope change.

**The real bug:** after swapping `index.html` from four `type="text/babel"` script tags to four plain `<script src>` tags, the app failed to render at all — an `Uncaught SyntaxError: Identifier 'useState' has already been declared` thrown from `museum.js` on natural page load (confirmed via a temporary `window.onerror` handler writing to `localStorage`, since this session's console-log and screenshot tooling had become unreliable after a very long test session — more on that below). Root cause: `museum.jsx`, `cabinets/zoom-overlay.jsx`, and `rotunda/guest-book-modal.jsx` each destructure `const { useState, useEffect, ... } = React;` at their top level. Under Babel-standalone, each `type="text/babel"` script is evaluated in its own isolated wrapper, so three separate top-level `const useState` declarations never collided. Once converted to plain classic `<script src>` tags, all four files share **one** global lexical scope per the HTML spec — the second and third files' `const useState` redeclare the first's, which is a parse-time `SyntaxError` that aborts that entire script (explains why `window.MuseumGuestBookModal` was `undefined` when this first surfaced, mirroring the exact shape of the original session's Bug 1, but with a different root cause this time).

**Fix:** wrapped each of the 4 transpiled `.js` files' emitted content in an IIFE (`(function () { "use strict"; ...; })();`) as a mechanical post-transpile step. This scopes each file's top-level `const`/`let`/`function` declarations to its own closure while leaving the explicit `window.X = ...` global exports (which each file already does at its own top level) working exactly as before. Verified: `node --check` on all 4 files, then a live click-through — threshold → 3D/2D capability resolve → audio manager plays → 2D fallback rotunda renders → guest book card opens the shared modal → signed a test name → `localStorage.sod_visitor_name` set correctly → signed/re-sign/scratch-out affordances all present. This is the second checkpoint in a row where a real, previously-invisible bug surfaced specifically because the runtime pattern changed shape (C2 was the missing-script-tag bug under the same Babel-standalone/JSX pattern; this is a cross-script scoping collision under the *departure* from that pattern) — naming it plainly rather than rounding up.

---

## Payload re-measurement

Direct file-size measurement (`stat`/`curl`, not a browser Network tab, matching the prior session's scripted-session methodology):

| Asset | Size |
|---|---|
| `react.production.min.js` | 10,751 B |
| `react-dom.production.min.js` | 131,835 B |
| `museum.js` (transpiled + IIFE-wrapped) | 24,680 B |
| `fallback/gallery.js` | 4,046 B |
| `cabinets/zoom-overlay.js` | 4,758 B |
| `rotunda/guest-book-modal.js` | 5,548 B |
| `games/maze-chase.js` | 7,526 B |
| `museum.css` | 14,850 B |
| `index.html` | 2,405 B |
| 5 manifest JSONs | 7,555 B |
| **Total initial payload** | **≈ 213,954 B ≈ 0.21 MB** |

Clears the 2.5 MB ceiling with roughly 12x margin — matches the addendum's own projection ("≈ 0.2 MB after §A.2 transpile") almost exactly. `@babel/standalone`'s 3.14 MB is gone from the page entirely.

3D chunk (unaffected by this pass — still no GLBs, no loaders, per D-034's v1 deferral): `three.min.js` r160 core (669,884 B) + `scene.js` (20,079 B) + `audio-manager.js` (5,810 B) ≈ 695,773 B ≈ 0.68 MB, comfortably inside the 8 MB ceiling and matching the addendum's "≈ 680 KB" projection.

---

## A note on this session's preview-tooling reliability

Partway through live verification I hit a stretch of confusing, seemingly-contradictory tool behavior in the same long-lived preview browser tab: `preview_screenshot` timing out repeatedly, `preview_snapshot` returning stale content immediately after an action (then correct content on a later, unrelated check), and `preview_console_logs` returning what looks like a frozen buffer that stopped updating across several navigations. I chased this hard before concluding it was tooling/session degradation (one browser tab reused across 20+ reloads and several rapid-fire navigation+check sequences in this session) rather than an app defect — verified by cross-checking through channels that stayed reliable throughout (direct `curl` against the server, `node --check` syntax validation, and `localStorage`-based error capture via a temporary `window.onerror` hook). The one genuine bug in this pass (the `useState` redeclaration above) was caught through exactly that more-reliable channel, not through the flaky one — so I'm confident the flakiness didn't mask anything, but naming it plainly since a fresh session may want to re-run the live click-through once more before JR's own pass, given I can't fully vouch for this specific tab's screenshot/snapshot channel by the end of this session.

---

## Ship gate status — updated against C3 arch §6

| Gate | Status after this pass |
|---|---|
| Initial payload ≤ 2.5 MB | **Clears** — ≈ 0.21 MB |
| 3D chunk ≤ 8 MB | Clears — ≈ 0.68 MB (unchanged this pass) |
| Real-content ship bar | **Clears** — programmatic scene is authored per addendum §A.1 (not placeholder); real Jahna audio (unchanged from original C3 pass); remaining items (placard copy, guest-book wording, tile blurb) are JR's content pass, correctly untouched, one `<<HELD FOR JR>>` string remains by design |
| WCAG-AA contrast audit | Contrast math portion clean (no new text/background pairs introduced by the scene pass — all new geometry is 3D canvas, not text). Full axe DevTools pass remains JR's (PD-D) |
| Keyboard-complete traversal | Unaffected by this pass — all interactive elements remain native `<button>`/`<a>`/`<input>`. Exhaustive Tab-fuzz remains JR's (PD-D) |
| JR sign-off | Terminal gate — not mine to close |

**Every remaining open item is JR-side by design, as the addendum projected:** content pass (placards, guest-book wording, tile blurb), axe DevTools + Tab-fuzz (PD-D), sign-off. No tool blockers remain in the ship path.

---

## What triggers the next session log

This log is the trigger. Standing by for Opus@CH's review of the amended pass.

— C-Build, 2026-07-05
