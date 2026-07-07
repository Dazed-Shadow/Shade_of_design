---
session_date: 2026-07-05
session_type: opus-review
participants: [Opus@CH, C-Prime, JR]
dd_touched: [DD-032]
checkpoint: 3
ship_gate_cleared: null
next_session_signal: C-Build next session — JR pastes the Babel authorization, C-Build executes the transpile + this scene spec, ships amended C3 impl log
tags: [sod-museum, dd-032, checkpoint-3, addendum, programmatic-scene, obsidian-facets, c-prime, real-content-ship-bar]
---

# C3 Arch Addendum A — Programmatic scene expansion (v1 real-content resolution)

**Author:** Opus@CH, with C-Prime (Fable) tagged in on vision
**Date:** 2026-07-05
**Amends:** [`session-log-2026-07-05-c3-arch.md`](session-log-2026-07-05-c3-arch.md) §3.2 (real GLB art posture)
**Triggered by:** [C-Build C3 impl log](session-log-2026-07-05-sonnet-c3-impl.md) — two tool-blocked items + the GLB coordination question JR resolved 2026-07-05: **programmatic scene expansion ships v1; authored GLBs move to v2+.**
**Companion decision:** D-034 in [`pipeline/DECISIONS.md`](../../pipeline/DECISIONS.md)

---

## Why this is not a fallback — the C-Prime framing

JR's intro file, the museum's origin document, names the vision in one line:

> *"a place that is a crystalized structure of Obsidian. Gold accents shows volcanic flares to resemble a design closest to what you would envision a 'King of feeling the pressure of the earth' would live in."*

**Crystallized obsidian is faceted.** Low-poly, flat-shaded, hard-edged geometry — the thing procedural generation produces naturally — is not an approximation of that vision; it IS that vision. A sculpted, smooth, photoreal GLB would need deliberate faceting work to read as "crystalized structure." The procedural path gets the crystal for free.

What this reframing changes: `scene.js` v1 geometry is **authored procedural art**, held to the same real-content bar as placard copy and the Jahna track. It is not "the C2 placeholder shipped anyway." The C2 placeholder was box-rooms that said "geometry goes here." The v1 scene is faceted obsidian that says what the intro said. The difference is authorship, and authorship is what the doll-without-a-soul rule actually gates on.

Authored GLBs (v2+) remain the upgrade path — same data-only asset-swap seam the manifests already protect. When a sculpted rotunda earns its slot, it lands without touching this code.

## §A.1 — Scene composition spec (Fable §1.4 palette rules, applied to geometry)

All colors from the `--museum-*` fixed palette (D-030). Brand-token lint (already extended to `0x` hex literals in `.js` at C2) enforces.

### Rotunda

- **Form:** faceted cylindrical drum — 10–14 flat segments, not a smooth cylinder. Visible facet seams are the crystal structure. Ink `0x0B1726` base material, flat shading (`flatShading: true`).
- **Facet vein accents:** thin emissive strips along a subset of facet seams — Ember `0xC97B4A` at low emissive intensity. These are the "volcanic flares": light escaping the pressure of the earth through cracks in the crystal. Sparse — 4–6 veins total, not a grid. Ember is a light source, never a surface (Fable §1.4).
- **Ceiling:** tall, faceted cone or stepped drum receding upward into darkness — Ocean `0x1A3E62` tinted fog or vertex-darkening toward the apex. Height IS the "pressure of the earth" register: the visitor should feel mass above them.
- **Floor:** large flat disc, Ink with a subtle Slate `0x5D809D` radial ring inscribing the walkable center — reads as polished stone, keeps pure Ink-on-Ink from becoming void (Fable §1.4 Slate rule).
- **Five doorways:** evenly-spaced arches in the drum wall. Classics arch is open — warm Ember glow spilling from within (PointLight just inside the arch, the strongest single light in the rotunda). Four sealed arches: filled with a slightly-recessed faceted panel, thin Ember seam glowing around each panel's perimeter — sealed, but alive behind the seal. Existing sealed-plaque DOM overlays (C2) remain unchanged.
- **Guest book pedestal:** C-Build's C3 mesh stands; upgrade the material to match the faceted language — small faceted obsidian plinth, Ember proximity glow already implemented. No Paper in the 3D scene (Paper appears exactly twice, both DOM: threshold + guest book page — Fable §1.4 scarcity rule holds).

### Classics hall

- **Form:** rectangular gallery, faceted Ink walls (fewer, larger facets than the rotunda — a calmer room), same flat shading.
- **Depth falloff:** far end of the hall darkens toward Ocean — `THREE.Fog(0x1A3E62, near, far)` or vertex darkening. The "pressure of the earth" reads as depth here rather than height.
- **Three cabinet silhouettes** at the existing waypoint coordinates (`classics-mazechase-position`, `classics-dk-position`, `classics-mario-position`): box-form arcade cabinet masses — angled marquee header, recessed screen plane, control-deck slope. Each gets:
  - **Marquee plane:** emissive Ember-soft `0xE4A57E` at low intensity — the marquee glow from Fable's tile-art motif ("the cabinet seen from across a dark room"), now inhabited.
  - **Screen plane:** emissive with slight flicker (subtle sine-driven intensity oscillation, ~0.5 Hz, amplitude small; **fully static under `prefers-reduced-motion`**) — attract mode seen from across the room.
  - The playable cabinet (maze-chase) gets marginally brighter marquee intensity than the two display cabinets — findable by light, not by label.
- **Ceiling:** lower than the rotunda, flat faceted panels — gallery intimacy against rotunda grandeur.

### Lighting budget (unchanged from C2 arch §1.2 discipline)

- No realtime shadows. Ambient low-intensity Ocean-tinted wash + emissive materials + ≤ 6 PointLights total (Classics doorway spill, per-cabinet marquee warmth, pedestal glow). Frame cost stays flat.
- All flicker/oscillation animation suppressed under `prefers-reduced-motion` — static emissive intensity at the mean value.

### What does NOT change

- Waypoint coordinates, dolly path, DOM overlays, ARIA live region, capability check, hash routes, manifests — zero contract changes. This is a `scene.js` geometry-and-materials pass only.
- 2D fallback untouched — it renders from manifests and never saw the placeholder geometry anyway.
- No textures introduced. Pure vertex-color/material geometry means **no KTX2, no Draco, no GLTFLoader needed at v1** — which is what lets Blocker 1 defer cleanly (see §A.3).

### Payload + verification

- Estimated addition: geometry + material code only, ≈ 10–20 KB on `scene.js`. 3D chunk stays ≈ 680 KB — the 8 MB ceiling is not approached.
- Verification additions to the C3 protocol: screenshot pass at every waypoint (visual regression baseline for v2 GLB swap later); brand-token lint on the new `0x` literals; `prefers-reduced-motion` flicker suppression check; frame-rate spot-check at rotunda-center (all lights visible).

## §A.2 — Blocker 2 resolution: Babel pre-transpile (JR-side, one action)

**Path chosen: in-session authorization** (lower friction than a local toolchain run; keeps the work in C-Build's audited hands).

**JR action — paste this verbatim at the top of C-Build's next session:**

> I authorize you to run npx with @babel/cli, @babel/core, and @babel/preset-react in this session to transpile the museum's four .jsx files (museum/museum.jsx, museum/fallback/gallery.jsx, museum/cabinets/zoom-overlay.jsx, museum/rotunda/guest-book-modal.jsx) into .js files, and to update museum/index.html to load the transpiled .js files and remove the @babel/standalone script tag. This authorization covers this transpile task only.

That sentence is the "specific user request" the harness classifier requires — C-Build chose nothing unilaterally. Exact `npx` invocation shape is C-Build's to work out (e.g. `npx -p @babel/core -p @babel/cli -p @babel/preset-react babel <in> -o <out>`); the authorization covers the intent.

**Expected outcome:** museum initial payload drops from ≈ 3.19 MB to ≈ 0.2 MB (Babel-standalone's 3.14 MB leaves the page; production React 142.6 KB + museum assets ≈ 66 KB remain). The ≤ 2.5 MB gate clears with an order of magnitude to spare.

**Ripple (captured in D-034):** once museum `.jsx` files are pre-transpiled, D-031's "dynamically-injected modules must be plain JS" rule becomes moot *for the museum* — but stays authoritative for any surface still running Babel-standalone (the landing page). The transpile step becomes part of the museum's offline pipeline (alongside audio transcode + future GLB compression): edit `.jsx` → re-run transpile → commit both.

## §A.3 — Blocker 1 resolution: vendored Three.js bundle → deferred to v2, no action now

The programmatic-scene decision dissolves this blocker rather than resolving it. The vendored bundle exists to carry `GLTFLoader` + `DRACOLoader` + `KTX2Loader` — loaders whose only job is decoding authored GLB assets. §A.1 introduces no GLBs and no textures. **Nothing at v1 needs the bundle.**

- **v1:** Three.js r160 core continues loading via the existing CDN UMD path (D-030/D-031 pattern, working since C2).
- **v2+ (when authored GLBs land):** JR grants a scoped esbuild authorization using the same sentence pattern as §A.2, C-Build builds `three-with-loaders-r160.min.js` per D-033, GLBs swap in. D-033 stands as the reasoning archive; its Option 1 fallback is now confirmed dead (C-Build's curl check: all three legacy URLs 404).

## §A.4 — Ship-gate impact

| Gate | Before this addendum | After C-Build's next session (projected) |
|---|---|---|
| Initial payload ≤ 2.5 MB | ❌ 3.19 MB (Babel-standalone) | ✅ ≈ 0.2 MB after §A.2 transpile |
| Real-content ship bar | ❌ placeholder geometry + JR copy pending | ✅ geometry authored per §A.1; remaining items are JR's content pass (placards, guest-book wording, tile blurb) — the always-planned JR gate, no tool blockers |
| 3D chunk ≤ 8 MB | ✅ 665 KB | ✅ ≈ 680 KB |
| All other gates | per C3 impl log | unchanged; JR's axe DevTools + Tab-fuzz pass at pre-close (PD-D) |

**After C-Build's next session, every remaining open item is JR-side by design:** content pass, axe/Tab-fuzz pass, sign-off. No tool blockers remain in the ship path.

---

*Locked — Opus@CH, with C-Prime on vision. 2026-07-05*
*The crystal was already the brief. We just stopped apologizing for it.*
