---
session_date: 2026-07-04
session_type: opus-review
participants: [Opus@CH, C-Build]
dd_touched: [DD-032]
checkpoint: 2
ship_gate_cleared: WCAG-AA-contrast (verified via direct math + fixes at 2 sites, full axe carries to C3 audit) · keyboard-complete-core-path (Tab-cycle fuzz carries to C3) · mobile-2D-content-equal · 3D-chunk-under-8MB-with-placeholders · brand-token-lint-blocking
next_session_signal: Opus@CH drafts C3 kickoff to C-Build; C3 kickoff opens after Mr. C's Chain response absorbs the C2 close + any pre-decisions for C3 (loader-path decision · audio pipeline · guest book · real content)
tags: [sod-museum, dd-032, checkpoint-2, opus-signoff, pattern-deviation-review, opus-ch]
---

# Session Log — Opus@CH Checkpoint 2 sign-off review

**Author:** Opus@CH
**Date:** 2026-07-04
**DD:** [DD-032 — SoD Museum rotunda plus Classics hall](../../../../References/Designs/DD-032%20SoD%20Museum%20—%20rotunda%20plus%20Classics%20hall.md)
**Reviews:** [`session-log-2026-07-04-sonnet-c2-impl.md`](session-log-2026-07-04-sonnet-c2-impl.md) (C-Build's C2 impl log)
**Companion decision (repo-side):** D-031 in [`pipeline/DECISIONS.md`](../../pipeline/DECISIONS.md)

---

## Verdict

**Checkpoint 2 cleared. Sign-off granted.** All 10 §5 items shipped. Four pattern-deviations, all confirmed after independent verification — including **two more spec errors on my side** which C-Build correctly caught against live browser reality. Three ship gates fully clear at C2 (mobile 2D content-equal · 3D chunk under 8 MB with placeholders · brand-token lint blocking). Two clear with narrow C3-carry-forward audits (WCAG-AA full axe-core pass · Tab-order exhaustive fuzz). One C3 planning risk named worth naming as a future D-NNN before C3 execution: the ES-module-only three.js loader path.

Sonnet is unlocked for C3 pending my kickoff drafting + Mr. C's Chain response absorbing this close.

---

## Fidelity map — arch spec vs. ship

| C2 arch item | Sonnet result | Verdict |
|---|---|---|
| §1.1 Three.js dynamic injection | Version pin corrected (r160, not r170); loader-path issue flagged forward for C3 | ✅ Corrected against reality |
| §1.2 Scene graph (rotunda + Classics as sibling Groups, no shadows) | Shipped as `scene.js` (not `.jsx`; see PD2) | ✅ |
| §1.3 `CatmullRomCurve3` dolly + waypoint set | Shipped, all 8 waypoints keyboard-verified | ✅ |
| §1.4 Cabinet zoom overlay (DOM swap, not camera zoom) | Shipped as `zoom-overlay.jsx`; one component, two callers (3D + 2D) | ✅ |
| §1.5 Sealed-door plaques | Shipped as static DOM row (arch left this to Sonnet judgment; see PD3) | ✅ Within spec latitude |
| §2 GLB pipeline | Deferred to C3 (placeholder procedural geometry at C2, as arch §2.4 recommended) | ✅ Correctly deferred |
| §3.1 2D fallback renderer | Shipped as `gallery.jsx`, real replacement for C1 stub | ✅ |
| §3.2 Maze-chase mini-game | Shipped as `maze-chase.js`; `mount(container)` API shared 3D+2D; real wall-collision logic verified | ✅ |
| §3.3 Attract-mode CSS animation | Shipped inline in zoom-overlay + museum.css | ✅ |
| §3.4 Lint constraints 8+9 | Added to `lint-manifests.js`; verified clean | ✅ |
| §4.1 Waypoint DOM overlays + ARIA live region | Shipped; live-verified aria-label update on each waypoint advance | ✅ |
| §4.2 WCAG-AA contrast audit | **Contrast math done by hand; Slate-on-Ink 4.33:1 real fail found + fixed at 2 sites; full axe pass blocked (see PD4)** | ⚠️ Contrast portion clears; automated audit carries to C3 |
| §4.3 Keyboard traversal spec | Core path verified via real `KeyboardEvent` dispatch; Tab-cycle not exhaustively fuzzed | ⚠️ Core clears; fuzz carries to C3 |
| §4.4 `prefers-reduced-motion` behavior | Suppression paths held (verified in impl at threshold; scene tween honors it) | ✅ |
| §5 all 10 unlocks | All shipped or correctly deferred where arch said so | ✅ |
| §6 ship gate table | See §Ship gate rulings below | See below |

---

## Pattern-deviation adjudication

C-Build flagged four deviations. My rulings:

### PD1 — Three.js version pin r170 → r160 + loader-path issue flagged forward

**Ruling: CONFIRMED. Spec error on my side, caught against live unpkg reality. Second latent issue correctly forward-flagged.**

I specified `three@0.170.0/build/three.min.js` in arch §1.1 and §2.3. C-Build tested against unpkg's `?meta` API and confirmed r170 publishes no classic UMD build — the deprecation boundary is r161. His live symptom before the fix was exactly the fail-soft branch working correctly: `net::ERR_BLOCKED_BY_ORB` → silent 2D fallback. Capability-check-first architecture from C1 saved the visitor experience; my version pin never actually worked.

**Fix ratified:** `three@0.160.0` — the last version publishing the classic UMD build. Runtime pattern from D-030 preserved exactly; no expansion.

**Forward flag ratified:** the loader paths in arch §2.3 (`examples/jsm/loaders/*.js`) are ES-module-only by folder convention (`jsm` = "JS modules") across every three.js version — even r160. They were never going to work as classic script tags. This is a C3 blocker for real GLB loading and needs its own named decision, not a silent workaround. Three options for C3:
1. Test whether r160 (or earlier) still ships `examples/js/loaders/*.js` (no "m")
2. Expand D-030 runtime pattern to include an `<script type="importmap">` + native ES-module scene entry (real expansion; deserves its own D-NNN)
3. Vendor a pre-bundled three-loaders build into `museum/assets/vendor/`

I'll evaluate the three at C3 kickoff drafting. Not blocking C2 sign-off.

**Meta-honesty note:** this is my second spec error surfaced this session and my fourth across C1+C2. The pattern-deviation rule is doing real load-bearing work at every checkpoint — a version-pin error survives paper review but does not survive live browser injection. C-Build's discipline of testing before assuming is precisely what the rule protects against, and I want it explicitly on the record that these catches are the rule working as designed, not exceptional saves. My planning artifacts need reality-verification passes for CDN paths and contrast math specifically — the two categories where I've now been wrong twice.

### PD2 — `scene/scene.js` plain JS, not JSX

**Ruling: CONFIRMED. Architectural correctness against a Babel-standalone constraint I did not name in arch.**

I specified `museum/scene/scene.jsx` in arch §1.1 without thinking through: Babel-standalone only transforms `<script type="text/babel">` tags present at initial page load. A dynamically-injected `.jsx` module never gets the Babel scan. C-Build's fix — write scene in plain imperative JS — sidesteps the whole problem instead of working around it with a `Babel.transform()` + `eval()` step that would be riskier and diverge from D-030's runtime discipline.

**Zero drawback:** Three.js scene code is imperative object-graph manipulation. JSX earns nothing here. Mounting via `useEffect` calling `window.MuseumScene.mount(container, config)` is the same pattern used for the maze-chase game.

**This deserves a D-030 amendment:** the constraint "dynamically-injected modules cannot use JSX; must be plain JS" is a runtime-pattern rule for all future museum work and any future Central Hub React surface that lazy-loads code. Captured in D-031.

### PD3 — Sealed-door plaques as static DOM row at rotunda-center

**Ruling: CONFIRMED. Within the latitude I explicitly gave in arch §1.5.**

My arch §1.5 said "DOM overlay pinned to each sealed doorway's screen-space projection... Sonnet picks; both are viable." He picked the simpler option — static row shown only at `rotunda-center`, hidden otherwise — because the camera only ever sees all four sealed doors from that single waypoint. Per-frame `Vector3.project(camera)` recalculation would couple the DOM overlay layer to the render loop for a benefit that doesn't materialize.

Functionally identical reachability. Meaningfully less code. No render-loop coupling. 2D fallback gets the same treatment (sealed hall cards render plaque text directly).

### PD4 — axe-core CDN injection blocked by harness policy; direct WCAG math substituted, found a real spec error

**Ruling: CONFIRMED with significant respect. Calibration operating at its best.**

C-Build attempted the exact automated pass I asked for. Harness auto-mode correctly denied unilateral CDN injection of a library he chose. He did NOT work around it silently. He substituted **direct WCAG relative-luminance computation** — plain math, no external code — for every foreground/background pair in `museum.css`.

**The substitution found a real defect the arch had marked as a "risk edge":**
- Arch §4.2 estimated Slate-on-Ink at "~4.6:1, borderline."
- Direct math: **4.33:1 — an actual fail against the 4.5:1 body-text threshold.**
- Two real usage sites: `.threshold-btn-quiet:hover/:focus-visible` (12px uppercase button text) and `.sealed-plaque-name` (15px/600, incorrectly claimed "large-text exemption" but doesn't meet WCAG's 18.66px+bold or 24px+regular bar).
- Both fixed: hover/focus background swapped to Paper (17.24:1); plaque name swapped to Paper (matches `.hall-card-name` convention).
- Slate retained only as decorative (border color, non-text WCAG 3:1 threshold, which 4.33:1 clears).

**Meta-honesty note (my third spec error, second this session):** my arch §4.2 gave a wrong contrast estimate. "~4.6:1 borderline" was optimism, not measurement. If I estimate contrast in future artifacts, I compute it against the relative-luminance formula first — no more "borderline" hedging without the number.

**Ruling on the WCAG-AA ship gate:**
- **Contrast portion CLEARS at C2.** C-Build's direct math + fixes are a WCAG-AA contrast audit by any honest reading; the letter of my arch said "axe-core," the spirit was "verified WCAG-AA contrast," and the spirit is met with better verification than axe would have provided for contrast specifically.
- **Full axe-core pass CARRIES TO C3 as a pre-close audit item.** axe catches issues beyond contrast (ARIA labeling, focus traps, semantic HTML, form associations) that C-Build's math substitution does not cover. Recommended path per C-Build's own recommendation: JR runs axe DevTools browser extension for a full pass before final JR sign-off, OR user explicitly approves a scoped axe-core CDN injection at C3.

---

## Real bug found and fixed during verification — threshold-skip dead-end on stale deep-link hash

C-Build inherited from C1 code: `showThreshold = !audioOptIn && (route === "/" || route === "")`. With a stale `#/rotunda` hash but no `sod_audio_optin` set, this evaluated false → threshold never rendered → `renderMode` stayed `null` → permanent "Loading…" stub.

**Confirmed against my C1 signoff read:** this bug was in the C1 code I signed off. C1 verification (also driven by C-Build via Claude Preview) always started from a clean hash, so the failure state never surfaced. Not a C1 signoff error per se — the verification just didn't stress this state. C-Build found it live-testing at C2 when a stale hash from prior traversal happened to be present. **Excellent regression discovery.**

Fix ratified: `showThreshold = !audioOptIn` — gate on opt-in state alone, regardless of route.

**Lesson for future signoff reviews:** verification protocols should include a stale-state stress pass (retained localStorage + retained URL fragments from a prior session) as a standard step. Adding to the C3 verification protocol.

---

## Verification quality

C-Build drove real browser DOM via `.claude/launch.json` static-file preview + Claude Preview. **This is the calibrated baseline now** — each of the following was verified against live behavior, not asserted:

- Threshold → `three@0.160.0` loads (`window.THREE.REVISION === "160"` confirmed) → `scene.js` mounts → rotunda geometry renders with doorway-seal glow at Classics + 4 sealed panels visible
- Real `KeyboardEvent` dispatch walking all 8 waypoints in sequence with retreat verified; boundary buttons correctly disabled at sequence ends
- Cabinet zoom overlay: "Look closer" → full placard (markdown `<strong>` rendering confirmed) + attract-art placeholder + Play mounts game → Escape closes back to waypoint
- Maze-chase: real `ArrowRight` dispatch → move counter incremented → **2 of 4 presses succeeded before hitting a wall matching the hand-authored maze layout exactly** (proves real wall-collision logic, not a stub)
- Sealed-door plaques: 4 render only at rotunda-center; `aria-live` announcement fires ("Racing: In formation. Sealed for now, this hall is in formation.")
- 375px viewport: capability check forces 2D fallback; `RotundaGrid` renders exactly 5 real doorways + guest book (rotunda hub correctly excluded from its own gallery); `ClassicsGrid` renders exactly 3 cabinets with playable badge only on Maze Chase; **cabinet-count parity 3=3 with 3D branch confirmed**
- 2D cabinet detail: `MuseumMazeChase.mount()` mounts identical game in 2D route container — "one code path, two containers" confirmed structurally, not just asserted
- Lint scripts: manifest constraints 8+9 clean; **brand-token lint enforcement blocking now caught two real off-palette hex violations during C2 development (fixed live), final clean across 6 files**
- Payload: `three.min.js` r160 = 654 KB (matches arch §2.2 estimate almost exactly); `scene.js` = 10 KB; **total 3D chunk ≈ 665 KB** — well under 8 MB ceiling with placeholder geometry
- Initial payload additions total ≈ 44 KB across `museum.jsx` (17.3 KB) + `zoom-overlay.jsx` (4.0 KB) + `gallery.jsx` (3.0 KB) + `maze-chase.js` (7.5 KB) + `museum.css` (12.5 KB) — trivial against 2.5 MB ceiling

**Not performed (correctly named as gaps):**
- Full Tab-order fuzz (only interactive elements spot-confirmed as real `<button>`/`<a>` or `tabIndex={0}` where necessary)
- Full axe-core automated pass (PD4 harness policy)
- NVDA/VoiceOver manual pass (C3/JR gate — correctly deferred)
- Real GLB payload re-measurement (C3 gate — no real GLBs exist yet)

---

## Ship gate rulings

| Gate | Ruling | Notes |
|---|---|---|
| WCAG-AA contrast audit clean | **CLEARS at C2** (contrast portion) | Full axe pass carries to C3 pre-close audit (JR runs DevTools extension or explicit CDN approval at C3) |
| Keyboard-complete traversal | **CLEARS at C2** (core path) | Exhaustive Tab-cycle fuzz carries to C3 as a pre-close audit item |
| Mobile 2D content-equal | **CLEARS** | 3=3 cabinet parity, 5+guest-book hall parity, same game module both paths |
| Initial payload ≤ 2.5 MB | Preserved-locked from C1 (not affected by C2) | C2 added ≈ 44 KB — no threat |
| 3D chunk ≤ 8 MB | **CLEARS at C2 with placeholders** | Re-audit at C3 when real GLBs land; loader-path decision (PD1 forward flag) may add ~230 KB (Draco decoder) + ~750 KB (KTX2 decoder) — still comfortable below ceiling |
| Brand-token lint clean | **CLEARS** | Enforcement blocking; scan extended to `.js` files + `0x`-hex literals; final clean across 6 files |
| Real-content ship bar | C3 only | Placeholder geometry + placeholder attract art + placeholder placards correctly NOT passing this gate |
| JR sign-off | C3 only | Untouched |

**Five gates clear at C2** (with two carrying narrow C3 audits). Three wait for C3 terminal.

---

## Carry-forward audits + C3 planning items

Landing in the C3 kickoff when I draft it:

1. **Full axe-core pass on all DOM states.** Not a substitute for contrast math (already done); catches ARIA labeling, focus traps, semantic HTML, form associations that C-Build's contrast substitution does not. Path: JR runs axe DevTools extension, OR user explicitly pre-approves a scoped axe-core CDN injection at C3 opening.
2. **Exhaustive Tab-order fuzz.** Playwright/Preview script cycling Tab through every focusable element in every route, confirming order matches visual/reading order and no dead-ends. Extend the C2 verification protocol.
3. **Stale-state stress pass.** Retained localStorage + retained URL fragments from prior session → walk cold load through every route. C-Build's threshold-dead-end catch was serendipitous; C3 protocol names it explicitly.
4. **Loader-path decision (PD1 second flag) — needs its own D-NNN before C3 execution.** Three options:
   - Test r160 (or earlier) for `examples/js/loaders/*.js` (classic script build)
   - Expand D-030 runtime pattern to include `<script type="importmap">` + native ES-module scene entry — real architectural expansion
   - Vendor a pre-bundled three-loaders build into `museum/assets/vendor/`
   Each has real trade-offs. Will evaluate + name in the C3 kickoff.
5. **3D chunk re-measurement with real GLBs.** After PD1 forward flag resolves, real Draco + KTX2 decoders load. Arch §2.2 estimates ~230 KB + ~750 KB decoder overhead plus GLB assets. Recompute at C3 impl close.
6. **Production-CDN swap** (unchanged from C1 signoff). React dev builds + Babel-standalone → production minified. Considered pre-transpile pattern.

Also unchanged carry-forward from C1 (still Chief-side):
- Hosting provider for `shadeofdesign.net` (routing pattern)
- Git + CI wiring at vault root (lint script automation)

---

## Meta-honesty note — my calibration record across C1 + C2

Four spec errors surfaced by C-Build's live-reality verification across two checkpoints:

**C1:**
- `.tile-sport` CSS precedent I claimed but never verified against `landing.css`
- Palette-namespace theme-collision hazard I did not anticipate (his `--museum-*` fix was pure architectural upgrade)

**C2:**
- Three.js version pin r170 with a UMD path that hadn't existed since r161
- Slate-on-Ink 4.33:1 fail estimated as "~4.6:1 borderline" (optimism, not measurement)

**Pattern:** two categories where my arch spec cannot be trusted without reality-verification pass — **CDN paths** and **contrast math**. Both live-testable in seconds; both surfaced only when C-Build tested them. For C3 arch drafting I run both checks against reality before publishing, not after.

**This is not a critique of the process** — it's the pattern-deviation rule doing its load-bearing work at every checkpoint. Naming it explicitly so the loop stays honest.

---

## Sonnet unlocks after this sign-off

None new until my C3 kickoff artifact lands. C-Build stands down between checkpoints per pyramid mailbox convention.

C3 unlock targets per DD-032 kickoff §Checkpoint 3:
- Audio pipeline (Jahna WAV transcode to AAC/Opus, host, `audio.json` populated with real URLs, `visibilitychange` pause, persistent volume control, Web Audio manager, clean loop point)
- Guest book pedestal (localStorage with defensive wrappers, "Not {name}? Sign the book anew" fallback, "scratch your name out" removal, diegetic placement in rotunda)
- Real content ship bar audit (Jahna track streaming from real hosting, real placard copy on every visible cabinet, no placeholder strings)
- Real GLB art (rotunda + Classics hall)
- Loader-path decision resolution (PD1 second flag)
- Production-CDN swap + optional pre-transpile
- Full axe-core pass
- Tab-order fuzz
- Stale-state stress pass
- JR sign-off gate handoff

---

## Cross-references

- **C-Build C2 impl log:** [`session-log-2026-07-04-sonnet-c2-impl.md`](session-log-2026-07-04-sonnet-c2-impl.md)
- **Opus@CH C2 arch artifact:** [`session-log-2026-07-04-c2-scene.md`](session-log-2026-07-04-c2-scene.md)
- **C2 impl kickoff to C-Build:** [`C Roles/Strategies/kickoffs/DD-032-C-Build-c2-scene.md`](../../../../C%20Roles/Strategies/kickoffs/DD-032-C-Build-c2-scene.md)
- **DD-032:** [`References/Designs/DD-032 SoD Museum — rotunda plus Classics hall.md`](../../../../References/Designs/DD-032%20SoD%20Museum%20—%20rotunda%20plus%20Classics%20hall.md)
- **Kickoff + Chain history:** [`C Roles/Strategies/kickoffs/DD-032-Opus-CH-arch-review.md`](../../../../C%20Roles/Strategies/kickoffs/DD-032-Opus-CH-arch-review.md)
- **C1 sign-off:** [`session-log-2026-07-04-opus-c1-signoff.md`](session-log-2026-07-04-opus-c1-signoff.md)
- **Companion decision D-031:** [`pipeline/DECISIONS.md`](../../pipeline/DECISIONS.md)
- **D-030 (runtime pattern):** [`pipeline/DECISIONS.md`](../../pipeline/DECISIONS.md)

---

*Signed off — Opus@CH, 2026-07-04*
*Checkpoint 2: cleared. Forge stood warm. Calibration record honest.*
