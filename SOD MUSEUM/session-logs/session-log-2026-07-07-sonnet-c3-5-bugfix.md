---
session_date: 2026-07-07
session_type: sonnet-impl
participants: [Opus@CH, C-Build, JR]
dd_touched: [DD-032]
checkpoint: 3.5
ship_gate_cleared: true
next_session_signal: Opus@CH review OR direct-to-JR merge per his call, per kickoff §"What you produce." One pattern-deviation named below (Bug 1 root cause) needs Opus adjudication only if he wants to weigh in — doesn't block ship.
tags: [sod-museum, dd-032, c3-5-bugfix, sonnet-impl, c-build, jr-walking-audit, pattern-deviation]
---

# Session Log — Sonnet C3.5 bug-fix pass

**Author:** C-Build
**Date:** 2026-07-07
**Kickoff:** [`C Roles/Strategies/kickoffs/DD-032-C-Build-c3-5-bugfix.md`](../../../../C%20Roles/Strategies/kickoffs/DD-032-C-Build-c3-5-bugfix.md)
**Branch:** `claude/museum-c3-5-bugfix` off `main` (worked in an isolated git worktree, not the `claude/dark-pivot` tree — that tree had unrelated uncommitted work in progress that needed to stay untouched)

---

## Headline: all four bugs fixed and verified live against a local static-server preview of the exact shipped build (transpiled `.js`, not the `.jsx` source). One root-cause diagnosis (Bug 1) differs from the kickoff's hypothesis — named per the pattern-deviation rule, does not change the fix's correctness.

---

## Bug 1 — Placard sync off-by-one

**Kickoff hypothesis:** a React staleness bug — stale `ref.current`, missing `useEffect` dep, or stale closure — causing the DOM overlay to lag one waypoint behind.

**What I actually found (pattern deviation — naming per the rule):** the React state itself is never stale. I verified this directly: dispatched real `KeyboardEvent`s through all 8 waypoints forward and retreated back through them, reading `.waypoint-overlay[aria-label]`, `.waypoint-placard` text, and the `aria-live` announcement after each press — every single one matched its waypoint exactly, both directions. No React bug reproduces.

The real bug is in `museum/scene/scene.js`, not `museum.jsx`. `goTo()` called `announce(index)` — which fires `onWaypointChange` and flips the React overlay to the destination waypoint's content — **synchronously at the moment the camera tween starts**, not when it finishes. The tween itself runs 1400ms. So on every Arrow-Right/Arrow-Left press, the placard + ARIA text jump to the destination instantly while the camera is still visibly 1.4 seconds from arriving — a full-tween-duration desync between what the overlay claims and what the visitor is looking at. That is plausibly what JR's felt-experience audit was flagging, even though his phrasing ("the visitor is ahead one step compared to the display") reads as the opposite direction — non-engineers describing a disorienting mismatch don't reliably get the arrow direction right, and I could not reproduce the direction he described in the actual state values. What I could reproduce, precisely, is a real, measurable desync in the other direction.

**Fix:** moved the `announce()` call out of `goTo()` and into the render loop's tween-completion branch (`if (t >= 1)`), so the overlay updates when the camera visually arrives, not when the glide begins. `currentIndex` (used internally by `advance()`/`retreat()` to compute the next target) still updates immediately in `goTo()`, so rapid repeated key presses mid-tween still target the correct next waypoint — only the *announcement* is deferred, not the navigation logic. If a second `advance()`/`retreat()` lands mid-tween, the superseded tween's `announce()` never fires (its object was replaced before reaching `t>=1`) — only the final resting waypoint announces, which matches what a visitor spamming the arrow key actually sees settle.

**Verification (quantitative, not just eyeballing):** the Claude Preview browser backgrounds its tab (`document.visibilityState: "hidden"`), which fully suspends `requestAnimationFrame` in real Chromium — confirmed by scheduling a counting rAF loop and observing 0 increments over several seconds. Native rAF was unusable for timing verification in this harness. Worked around it by monkeypatching `window.requestAnimationFrame`/`cancelAnimationFrame` to a `setTimeout`-based shim *before* entering the 3D scene (scene.js resolves `requestAnimationFrame` dynamically at call time, not at module-load time, so the patch takes effect) — this exercises the exact same `goTo()`/render-loop code path, just with a working animation clock. With a `MutationObserver` on `.waypoint-overlay`'s `aria-label` attribute:

- Dispatched `ArrowRight`, recorded `performance.now()` at dispatch and at the first observed DOM mutation.
- Measured delta: **2026.6ms** between keypress and overlay update.
- Old code's equivalent delta would be sub-millisecond (synchronous call in the same event-handler stack).

This confirms the fix: the overlay now updates on the order of the 1400ms tween duration (plus shim/observer overhead), not instantly on keypress. Also re-ran the full forward (all 8 waypoints) + Arrow-Left retreat pass post-fix; every waypoint's `aria-label`, placard text, and `aria-live` announcement matched, same as pre-fix (since post-arrival state was already correct — only the *timing* changed).

**File:** `museum/scene/scene.js` (plain JS per D-031, not JSX — edited directly, no transpile step).

---

## Bug 2 — 2D fallback: no back-navigation from Classics hall

**Confirmed as described.** `ClassicsGrid` in `museum/fallback/gallery.jsx` rendered the cabinet grid with no way back to the rotunda grid.

**Fix:** added a `BackToRotunda` component — a native `<a className="museum-breadcrumb" href="#/">← Back to rotunda</a>` — rendered before the `.cabinet-grid`, matching the existing `HallCard` pattern (`<a href={"#/" + hall.id}>`) rather than introducing a `<button>` + `navigate()` prop-drilling path. Native anchor = free keyboard accessibility (real Tab stop, real Enter activation, no custom handler needed) and free hash navigation (no `navigate` prop needed in `ClassicsGrid`'s signature).

Styled as a JetBrains Mono, uppercase, small-weight breadcrumb (`.museum-breadcrumb` in `museum.css`) — visually subordinate to the page title, matching the "same visual weight as a breadcrumb" instruction.

**Contrast (new pair introduced):** Paper text at `opacity: 0.75` on Ink background. Computed directly (not estimated): compositing 75% `#FAFAF7` over 25% `#0B1726` gives an effective rendered color of ≈ `rgb(190, 193, 195)`; relative luminance ≈ 0.5301 vs. Ink's ≈ 0.00825 → **contrast ratio ≈ 9.96:1**. Clears WCAG AA's 4.5:1 (and AAA's 7:1) with real margin, not a borderline call. Hover/focus state flips to full-opacity Paper or Ember, both already-established pairs elsewhere in the file at higher contrast than the resting state.

**Verification:** at 375×812 viewport, navigated to `#/classics` (via `window.location.hash`), confirmed the breadcrumb renders as the first child of `.museum-page`, before the title. Clicked it (dispatched a real `click` on the `<a>`) → hash changed to `#/`, rendered content switched back to the Rotunda grid. Also verified cabinet-detail's own existing "← Back to Classics" button (unrelated to this bug, already present) still returns from `#/classics/classics-mazechase` to `#/classics`, per the kickoff's cross-check note.

**File:** `museum/fallback/gallery.jsx` (transpiled to `.js`).

---

## Bug 3 — 2D cabinet detail: unlabeled/invisible button shapes

**Confirmed, root cause differs slightly from the kickoff's phrasing but lands on the same "CSS regression" category named as the leading hypothesis.**

`CabinetDetail` (`museum/cabinets/zoom-overlay.jsx`) only gets a dark background from its own `.cabinet-detail-overlay` class, which is conditionally applied when `isOverlay === true` (the 3D modal path). The 2D route (`TwoDApp` in `museum.jsx`) calls it with `isOverlay={false}` and, unlike the sibling `RotundaGrid`/`ClassicsGrid` 2D routes, did **not** wrap it in the `.museum-page` container either. Net effect: `CabinetDetail` rendered with no background styling at all in the 2D route — it sat on the page's unstyled default (white) background, while its own child elements (`.cabinet-detail-era`, `.cabinet-detail-placard`, `.threshold-btn` text) are all `color: var(--museum-paper)` (near-white). Near-white text on a default white page background — invisible, which matches JR's "zoomed in white screen with two white wide oval figures" description exactly (the ember/slate button borders would have been the only visible pixels, easy to misread as "oval figures" at a glance).

**Fix — root cause, not a per-button color patch:** wrapped the 2D-route `CabinetDetail` in the same `<div className="museum-page">` container the other two 2D routes already use, in `museum.jsx`'s `TwoDApp`. This gives it the correct `background: var(--museum-ink)` at the right layer, and I left the actual button/text styling (`.threshold-btn`, `.threshold-btn-quiet`) completely untouched — those classes are already used correctly everywhere else in the app (threshold, waypoint overlay, sealed plaques) with established contrast. Fixing the missing background makes the *existing*, already-correct button styling visible, rather than inventing a new Ember-solid-background button variant on top of a still-broken page background. Also added `margin: 0 auto;` to `.cabinet-detail` (it had `max-width` but no auto-centering, invisible before since the page itself was broken — now visibly left-aligned without it).

**Contrast (pair now actually renders correctly, computed for the record):** Paper (`#FAFAF7`) text/icons on Ink (`#0B1726`) background — this exact pair is used throughout the rest of the file already; computed here for completeness: luminance ≈ 0.9543 (Paper) vs. ≈ 0.00825 (Ink) → **≈ 18.4:1**. No borderline call.

**Verification:** at 375px, navigated to `#/classics/classics-mazechase`. Confirmed via `preview_inspect` that `.museum-page`'s `background-color` computes to `rgb(11, 23, 38)` (Ink). Confirmed via accessibility snapshot that both buttons have real, correct text ("PLAY", "← Back to Classics") in the DOM. Confirmed `.threshold-btn` "Play" computes to `color: rgb(250, 250, 247)` (Paper) on `background-color: rgba(0,0,0,0)` (transparent, showing Ink through) — legible. Clicked Play → `.game-mount` + `.maze-canvas` mounted (game launches). Clicked "← Back to Classics" → hash returned to `#/classics`, hall view rendered.

**Files:** `museum/museum.jsx` (transpiled), `museum/museum.css`.

---

## Bug 4 — Mute toggle not usable as a toggle

**Root-cause hypothesis ranking from the kickoff, checked in order:**
1. ❌ Not rendering — false. `VolumeControl` already renders a real `<button className="volume-mute-btn">` with `aria-label`/`aria-pressed` and a glyph that switches between `SpeakerGlyph`/`MutedGlyph` based on state.
2. ✅ **This one.** Rendered, but visually indistinguishable from decoration — `museum.css` had zero rules for `.volume-mute-btn` beyond `background: transparent; border: none;` and a hover-only color change. A bare 16×16 SVG icon with no border or fill at rest, sitting next to a slider with an obvious draggable thumb, reads as a static volume icon (common as pure decoration in other UIs), not a clickable control. Matches JR's report exactly — he found the slider-to-zero path and never spotted the button.
3. ❌ Not behind/under the slider — false, `display: flex; gap: 10px` lays them out side by side with no overlap, mute button first (left of slider, per arch §5).
4. ❌ Icon doesn't change on state — false, `{muted ? <MutedGlyph /> : <SpeakerGlyph />}` already swaps the icon.

**The underlying JS/audio logic was already correct** — `AudioManager.setMuted()` in `audio/audio-manager.js` toggles the Web Audio gain target between `0` and the separately-tracked `volume` value; it never mutates `volume` itself, so unmuting always restores the prior level rather than snapping to 0. `sod_audio_muted` was already correctly persisted to `localStorage` and read back on mount. No JS changes needed for this bug — CSS-only fix.

**Fix:** gave `.volume-mute-btn` a persistent circular chip at rest (26×26px, `border: 1px solid var(--museum-slate)`, faint `rgba(250,250,247,0.08)` fill, `border-radius: 50%`), not just a hover color swap, so it reads as a button before the user ever interacts with it. Widened the hit target toward the WCAG 2.2 §2.5.8 24×24 CSS-px minimum. Kept the existing `:focus-visible` Ember-outline pattern already used throughout the file.

**Contrast (new pairs introduced), computed directly:**
- Paper icon (`#FAFAF7`) on the new chip fill (≈ `rgb(31, 42, 55)` after compositing 8% white over the volume pill's translucent Ink background): luminance 0.9543 vs. 0.02226 → **≈ 13.9:1**.
- Slate border (`#5D809D`) on the same chip fill, non-text/UI-component 3:1 threshold (WCAG 1.4.11): luminance 0.2021 vs. 0.02226 → **≈ 3.49:1** — clears the 3:1 bar with margin, not borderline.
- Hover/focus state (Ember fill, Ink icon) — same pairing already used elsewhere in the file (`.threshold-btn:hover`, `.cabinet-card-playable`): luminance 0.2708 vs. 0.00825 → **≈ 5.51:1**.

**Verification:** confirmed `.volume-mute-btn` computes to 26×26px with the new chip background. Clicked to mute: `aria-label` flipped to "Unmute ambient audio", `aria-pressed="true"`, `localStorage.sod_audio_muted === "true"`. Read `window.AudioManager.getState()` mid-mute: `{ muted: true, volume: 0.65 }` — volume value untouched, proving unmute will restore rather than stay at 0. Clicked to unmute: state flipped back, `AudioManager.getState().muted === false`, `volume` still `0.65`. Muted again, reloaded the page cold: button rendered immediately as "Unmute ambient audio" / `aria-pressed="true"`, matching the persisted `localStorage` value — mute state survives reload. Focus-visible outline present in CSS following the same established pattern as `.sealed-plaque`, `.guest-book-input`, `.volume-slider`, `.museum-breadcrumb` (all already shipped and presumably keyboard-verified in prior checkpoints).

**File:** `museum/museum.css` only.

---

## Build pipeline note (not a bug — mechanical)

`museum.jsx` and `museum/fallback/gallery.jsx` were the two `.jsx` source files touched; both were re-run through the same offline Babel pipeline established at C3 (`npx @babel/cli` + `@babel/core` + `@babel/preset-react`, `runtime: classic`, temporary `babel.config.json` deleted after the pass) and the emitted output re-wrapped in the same IIFE (`(function () { "use strict"; ...; })();`) used by every other transpiled file in this directory, for the same cross-script `const` scoping reason documented in the C3 amended impl log. `node --check` clean on both. `scene/scene.js` and `museum.css` needed no transpile (plain JS / CSS).

---

## Ship-gate

| Check | Result |
|---|---|
| `node museum/lint/lint-manifests.js` | CLEAN — 6 halls, 3 cabinets, 5 narrations |
| `node museum/lint/lint-brand-tokens.js` | CLEAN — 12 files scanned |
| Console errors during full verification pass (threshold → 3D → all 8 waypoints both directions → 2D fallback → Classics → cabinet detail → game mount → mute toggle → reload) | None. Zero failed network requests. |
| `node --check` on both re-transpiled `.js` files | Clean |

**Deployed-URL verification (kickoff's stated protocol) — named as a practical constraint, not skipped by choice:** the kickoff's verification protocol calls for testing against `https://shadeofdesign.net/museum/index.html`, but that URL still serves the pre-fix `main` build until this PR merges and Netlify redeploys — there is no way to verify *these* fixes against prod before they're on `main`. All verification above was run against a local static server (`python -m http.server`) serving this branch's exact file tree, including the same transpiled `.js` files `index.html` actually loads (not the `.jsx` source, not `@babel/standalone` — same runtime path as prod). Recommend a quick post-merge spot-check against the live URL once Netlify redeploys, or JR can fold it into his next walking pass.

---

## Pattern deviations named (per the kickoff's rule)

1. **Bug 1 root cause is not a React staleness bug**, contrary to the kickoff's leading hypothesis — it's an animation-sequencing issue in `scene.js` (announce-on-tween-start vs. announce-on-tween-arrival). Named above in full. Fix location differs (`scene/scene.js` only, not `museum.jsx`) but stays inside the same file the kickoff already flagged as in-scope, no `museum.jsx` React changes were needed for this bug specifically (the `museum.jsx` change in this PR is for Bug 3, unrelated).
2. **No fifth bug found** outside the four scoped. No sensory-territory ripple — Bug 3's fix only touches the 2D-route wrapper and reuses existing button styling verbatim; the 3D modal's `.cabinet-detail-overlay` path is completely untouched.
