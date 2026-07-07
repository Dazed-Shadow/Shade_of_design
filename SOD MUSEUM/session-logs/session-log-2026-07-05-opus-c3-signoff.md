---
session_date: 2026-07-05
session_type: opus-review
participants: [Opus@CH, C-Build, JR]
dd_touched: [DD-032]
checkpoint: 3
ship_gate_cleared: initial-payload-under-2.5MB · 3D-chunk-under-8MB · real-content-ship-bar (programmatic scene + real Jahna audio + one designed <<HELD FOR JR>> guest-book string) · brand-token-lint-blocking · WCAG-AA-contrast-portion
next_session_signal: JR pre-close pass (content copy · axe DevTools · Tab-fuzz) → JR sign-off → merge to main → Netlify deploys → JR's felt-first walk-in
tags: [sod-museum, dd-032, checkpoint-3, opus-signoff, terminal-checkpoint, ship-ready]
---

# Session Log — Opus@CH Checkpoint 3 sign-off (terminal)

**Author:** Opus@CH
**Date:** 2026-07-05
**DD:** [DD-032 — SoD Museum rotunda plus Classics hall](../../../../References/Designs/DD-032%20SoD%20Museum%20—%20rotunda%20plus%20Classics%20hall.md)
**Reviews:** [`session-log-2026-07-05-sonnet-c3-impl-amended.md`](session-log-2026-07-05-sonnet-c3-impl-amended.md) (C-Build's C3 amended impl log)
**Executed against:** [`session-log-2026-07-05-c3-arch-addendum-scene.md`](session-log-2026-07-05-c3-arch-addendum-scene.md) (Opus@CH + C-Prime scene addendum)
**Companion decision (repo-side):** D-035 in [`pipeline/DECISIONS.md`](../../pipeline/DECISIONS.md)

---

## Verdict

**Checkpoint 3 cleared. Terminal architectural sign-off granted.** Museum enters JR's pre-close corridor (content pass + axe DevTools + Tab-fuzz), then JR sign-off, then merge to `main`, then Netlify deploys, then JR's felt-first walk-in.

Every remaining open item is JR-side by design. No tool blockers remain in the ship path.

---

## Fidelity map — addendum spec vs. ship

| Addendum item | Sonnet result | Verdict |
|---|---|---|
| §A.1 Rotunda: faceted drum, sparse Ember veins, receding ceiling, Slate floor ring | Shipped — `CylinderGeometry` 12 radial segments + `flatShading`; 5 Ember-emissive vein strips; faceted cone ceiling; Slate radial floor ring | ✅ |
| §A.1 Five doorways: Classics open with PointLight spill, 4 sealed with perimeter seam + no PointLight | Shipped; sealed doorways carry zero PointLights (budget discipline held); re-spaced to true 72° even (72/144/216/288) instead of prior uneven cluster | ✅ Above spec — even-spacing correction |
| §A.1 Guest book pedestal — faceted plinth material match | Shipped; existing C3 pedestal geometry retained + material upgraded per below | ✅ |
| §A.1 Classics hall: faceted walls, one `THREE.Fog` depth, 3 cabinet silhouettes | Shipped — faceted walls (larger segments than rotunda per spec), single shared fog, marquee/screen/control-deck geometry per cabinet | ✅ |
| §A.1 Emissive marquee + screen flicker, playable cabinet marginally brighter, suppressed under `prefers-reduced-motion` | Shipped — ~0.5 Hz sine on screen plane, static under reduced-motion | ✅ |
| §A.1 Lighting budget ≤ 6 PointLights, no realtime shadows | Shipped at 5 PointLights (Classics doorway spill, 3 cabinet marquee warmth, pedestal glow) + one HemisphereLight legibility floor (see PD1 below — not a PointLight, doesn't touch the budget) | ✅ |
| §A.1 Payload target ≈ 680 KB (3D chunk) | Measured 695,773 B ≈ 0.68 MB — 12.5 MB inside ceiling; matches projection almost exactly | ✅ |
| §A.2 Babel transpile: 4 `.jsx` → `.js`, drop Babel-standalone, `index.html` swap | Shipped — 4 `.js` files committed + `index.html` swapped; projected ≈ 0.2 MB, measured 0.21 MB | ✅ Projection accurate |
| §A.2 Ship-gate projection: initial payload ≤ 2.5 MB clears | Measured 213,954 B ≈ 0.21 MB — **12× margin against ceiling** | ✅ Cleared decisively |
| §A.4 Ship-gate table: everything projected to clear this pass | Cleared | ✅ |

---

## Pattern-deviation adjudication

C-Build flagged two real live-verification catches that qualify as pattern-deviations in the C1/C2 discipline sense — one is an implementation refinement of my spec (arguably a spec-gap I should have anticipated), one is a runtime-pattern discovery from the shape change itself.

### PD1 — Obsidian material tuning: roughness 0.9 (spec-implicit) failed under sparse point lighting; corrected to roughness 0.35 + metalness 0.2 + HemisphereLight legibility floor

**Ruling: CONFIRMED. Sharp architectural judgment; addendum §A.1 spec gap.**

My addendum said "faceted seams are the crystal structure" but did not name the material vocabulary that lets sparse point lighting *reveal* those seams. C-Build's first pass used matte `roughness: 0.9` for both walls, which produced a near-formless soft glow — the opposite of the crystal reading the addendum called for.

His root-cause analysis is the correct one: **obsidian is volcanic *glass*, not matte stone.** A highly diffuse material cannot carry specular facet-edge contrast under sparse point lighting no matter how the geometry is built. His fix — roughness 0.35 + metalness 0.2 + a modest `HemisphereLight` (intensity 0.5) as a legibility floor — preserves the moody register while restoring facet visibility. The HemisphereLight sits outside the PointLight budget (not a PointLight), so lighting discipline holds.

Also worth naming his restraint: he ran an interim ambient-intensity-2.2 test to confirm the darkness ceiling is *palette-albedo* driven, not a lighting bug, then reverted the test before ship. He did not flatten the museum into a brightly-lit room to solve legibility. That's exactly the "moody darkness is a feature, not a bug" discipline the intro thesis calls for.

**Addendum § amendment (implicit):** future museum halls that use the same faceted-obsidian language inherit the roughness 0.35 / metalness 0.2 material spec + a HemisphereLight legibility floor. Captured in D-035.

### PD2 — Cross-script `const useState` collision under classic script tags: IIFE-wrap required for transpiled museum modules

**Ruling: CONFIRMED. Runtime-pattern discovery from the Babel-standalone → classic-scripts shape change.**

Under Babel-standalone, each `<script type="text/babel">` gets its own evaluation wrapper — three separate top-level `const { useState, useEffect } = React;` destructures across three files never collided. Under classic `<script src>` tags, all four files share the single global lexical scope per HTML spec. Second and third files' `const useState` redeclared the first's → parse-time `SyntaxError` aborted the entire script. Symptom mirrored C2's Bug 1 (`window.MuseumGuestBookModal === undefined`), root cause was completely different.

C-Build's fix: mechanical IIFE-wrap of each transpiled `.js` file (`(function () { "use strict"; ...; })();`). Scopes each file's top-level declarations to its own closure; the explicit `window.X = ...` global exports work unchanged.

**This is a real D-030/D-031 runtime-pattern amendment** — captured in D-035. Rule: any museum surface that transitions from `type="text/babel"` (isolated Babel wrappers) to classic `<script src>` (shared global scope) IIFE-wraps the emitted output. Future museum extensions and any Central Hub React surface that pre-transpiles inherit this.

Also worth naming: he needed `babel.config.json` with `{"runtime": "classic"}` to force the classic JSX runtime — automatic runtime defaults to `import ... from "react/jsx-dev-runtime"` which is incompatible with the no-bundler + global-`React` pattern. Config file created for the transpile pass, deleted after. Correct discipline: not committing tooling config to the museum tree.

### Additional live catch — sealed-doorway spacing correction

Not flagged as a formal PD but worth marking: the sealed-doorway `angleDeg` values were an uneven cluster (90/162/198/270) in his first-pass. He re-spaced to true 72° even (72/144/216/288) after confirming against `manifest/halls.json` that no external contract reads these angles. Internal-only fix, no contract change. Small, correct, honest.

---

## Preview-tooling reliability note — recommendation carried forward

C-Build named honestly that his live-verification tooling degraded over a long-lived preview tab (screenshot timeouts, stale snapshots, frozen console-log buffer). He cross-verified through channels that stayed reliable (direct `curl`, `node --check`, `localStorage`-based `window.onerror` capture) and the one real bug he caught (the `useState` collision) surfaced through the reliable channels — so nothing was masked. But his own recommendation stands: **a fresh session should re-run the live click-through once more before JR's walk**, since he can't fully vouch for that specific tab's screenshot channel by end of session.

**My ruling:** this is a reasonable request and does not gate C3 sign-off. The verification he DID complete (all 8 waypoints screenshotted; live click-through through threshold → capability resolve → audio → 2D fallback → guest book flow) covers the ship-critical paths through reliable channels. A fresh-session re-verification is a belt-and-braces confirmation, not a re-audit. Recommend running it as the first item in the JR pre-close corridor, before the axe DevTools + Tab-fuzz pass — same fresh browser tab, one clean walk-through.

---

## Ship gate rulings

| Gate | Ruling |
|---|---|
| Initial payload ≤ 2.5 MB | **CLEARS** — 0.21 MB, 12× margin |
| 3D chunk ≤ 8 MB | **CLEARS** — 0.68 MB with programmatic scene + no loaders (v1 posture per D-034) |
| Real-content ship bar | **CLEARS** — programmatic scene is authored per addendum §A.1 (not placeholder); real Jahna AAC + Opus streaming from same-origin Netlify path (from original C3 pass); the single remaining `<<HELD FOR JR>>` string is the guest-book invitation, present by design as JR's content-pass surface |
| WCAG-AA contrast audit | **CLEARS at C3** for the contrast portion (unchanged since C2; no new text/background pairs this pass) — full axe DevTools pass remains JR's (PD-D) |
| Keyboard-complete traversal | **CLEARS at C3** for the core-path portion — all interactive elements remain native `<button>`/`<a>`/`<input>`; exhaustive Tab-fuzz remains JR's (PD-D) |
| Brand-token lint | **CLEARS** — enforcement blocking, 8 files scanned clean including the new geometry code |
| Real content on placards + guest book wording + tile blurb | JR content pass (always was) — one `<<HELD FOR JR>>` guest-book string catches at museum lint; placard copy and tile blurb are landing-scope + JR's register |
| JR sign-off | Terminal — JR closes after content pass + axe DevTools + Tab-fuzz |

**Five ship gates clear at C3 close under Opus@CH sign-off. Three JR-side gates remain by design.** No tool blockers, no arch questions, no coordination gaps left.

---

## Calibration record update

C-Build's C3 amended pass added **zero new spec errors on my side.** PD1 (material tuning) is a spec-gap — the addendum said "facet seams are the crystal structure" without naming the material vocabulary that makes that reading physically possible under sparse lighting. That's a spec omission arguably worth naming; I'll count it soft (not a fifth-category addition, since it's within the existing "external-tool-behavior assumed" category — Three.js material response under sparse point lighting is exactly that shape). PD2 (IIFE-wrap) is a runtime-pattern discovery from the shape change itself, not a spec error — HTML's global-scope-per-classic-script behavior is well-documented but wasn't in the transpile's failure mode until reality reproduced it.

**Total record across C1 → C2 → C3:** five spec errors, all in the "external-tool-or-format-behavior assumed instead of verified" category (CDN paths · contrast math · tool output formats). The pre-publish reality-check discipline is a standing rule now, not an aspiration. Nothing added this session.

Also worth marking C-Build's discipline across all three checkpoints:
- Every pattern-deviation named with root-cause analysis, not just "this didn't work"
- Real bugs caught and fixed live, not asserted-clean
- Tool restrictions respected without silent workarounds (C2 axe-core denied → direct WCAG math substitution that found my Slate error; C3 Babel denied → escalated for JR authorization instead of unilateral workaround)
- Own errors flagged with the same discipline as flagging mine (C2 estimate of Babel-standalone at 700 KB was 4.5× low — he named that on the record)
- Preview-tooling degradation named honestly with the specific recommendation to re-verify in a fresh session, not papered over

This is what the loop looks like when it works.

---

## What triggers JR sign-off

C-Build stands down. The ship path from here is JR's:

1. **Fresh-session re-verification** (belt-and-braces per C-Build's preview-tooling note) — one clean walk-through in a fresh preview tab
2. **Content pass** — placard copy on the three Classics cabinets + guest-book invitation prose ("Sign the book" et al.) + tile 05 blurb on the landing page. Replace the one museum `<<HELD FOR JR>>` string; ship-gate lint confirms clean after
3. **axe DevTools pass** (PD-D) — full automated a11y audit across every DOM state
4. **Tab-order fuzz** (PD-D) — exhaustive Tab cycle through every focusable element in every route
5. **JR sign-off** — sets `ship_verified_by: JR` on DD-032, `shipped_on: 2026-07-05` (or whichever date the sign-off actually lands)
6. **Merge `claude/dark-pivot` → `main`** — anchor commit `b7304be` (C2 checkpoint) + all C3-and-beyond commits
7. **Netlify auto-deploys**
8. **JR walks in.** First felt experience is the museum with real content, real Jahna, faceted obsidian halls, Ember veins, the guest book pedestal waiting.

That is the ship.

---

## Cross-references

- **C-Build C3 amended impl log:** [`session-log-2026-07-05-sonnet-c3-impl-amended.md`](session-log-2026-07-05-sonnet-c3-impl-amended.md)
- **C-Build C3 original impl log:** [`session-log-2026-07-05-sonnet-c3-impl.md`](session-log-2026-07-05-sonnet-c3-impl.md) (blockers-flagged version)
- **Opus@CH + C-Prime C3 scene addendum:** [`session-log-2026-07-05-c3-arch-addendum-scene.md`](session-log-2026-07-05-c3-arch-addendum-scene.md)
- **Opus@CH C3 arch:** [`session-log-2026-07-05-c3-arch.md`](session-log-2026-07-05-c3-arch.md)
- **Chief C3 pre-lift-off:** [`C Roles/Strategies/kickoffs/DD-032-Opus-CH-c3-arch.md`](../../../../C%20Roles/Strategies/kickoffs/DD-032-Opus-CH-c3-arch.md)
- **DD-032:** [`References/Designs/DD-032 SoD Museum — rotunda plus Classics hall.md`](../../../../References/Designs/DD-032%20SoD%20Museum%20—%20rotunda%20plus%20Classics%20hall.md)
- **All museum decisions:** D-029 · D-030 · D-031 · D-032 · D-033 · D-034 · D-035 in [`pipeline/DECISIONS.md`](../../pipeline/DECISIONS.md)

---

*Signed off — Opus@CH, 2026-07-05*
*Checkpoint 3: cleared. Terminal architectural gate closed. Ship goes to JR.*
*The doors are heavy. They open.*
