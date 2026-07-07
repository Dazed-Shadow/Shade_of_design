---
session_date: 2026-07-05
session_type: opus-review
participants: [Opus@CH, Opus@COS]
dd_touched: [DD-032]
checkpoint: 3
ship_gate_cleared: null
next_session_signal: C-Build receives C3 kickoff → executes per §5 → ships C3 impl log → Opus@CH sign-off review → JR sign-off (terminal)
tags: [sod-museum, dd-032, checkpoint-3, audio-pipeline, guest-book, real-content-ship-bar, loader-path, opus-ch]
---

# Session Log — Checkpoint 3: Audio + guest book + real-content ship bar + loader-path resolution

**Author:** Opus@CH
**Date:** 2026-07-05
**DD:** [DD-032 — SoD Museum rotunda plus Classics hall](../../../../References/Designs/DD-032%20SoD%20Museum%20—%20rotunda%20plus%20Classics%20hall.md)
**Chief pre-lift-off:** [`C Roles/Strategies/kickoffs/DD-032-Opus-CH-c3-arch.md`](../../../../C%20Roles/Strategies/kickoffs/DD-032-Opus-CH-c3-arch.md)
**Prior:** [C1 arch](session-log-2026-07-04-c1-arch.md) · [C1 impl](session-log-2026-07-04-sonnet-c1-impl.md) · [C1 signoff](session-log-2026-07-04-opus-c1-signoff.md) · [C2 arch](session-log-2026-07-04-c2-scene.md) · [C2 impl](session-log-2026-07-04-sonnet-c2-impl.md) · [C2 signoff](session-log-2026-07-04-opus-c2-signoff.md)
**Companion decision (repo-side):** D-033 in [`pipeline/DECISIONS.md`](../../pipeline/DECISIONS.md) — loader-path lock

---

## What this session decides

Four architectural surfaces locked for C3 execution:

1. **Audio pipeline** — transcode target formats + sizes, same-origin Netlify hosting (per D-032), `audio.json.tracks[]` roster-ready schema populated with Jahna's real URLs, Web Audio manager with crossfade loop, `visibilitychange` pause, persistent-volume localStorage, diegetic volume control placement.
2. **Guest book pedestal** — diegetic rotunda pedestal at `rotunda-guest-book` waypoint, localStorage with defensive wrappers per D-030, "Not {name}? Sign the book anew" shared-computer fallback, "scratch your name out" removal affordance, wording held for JR.
3. **Real-content ship bar audit protocol** — Jahna track streaming end-to-end from Netlify, real placard copy on every visible cabinet (JR content pass), real GLB art for rotunda + Classics hall (asset swap into placeholder locations from C2). No lorem, no `<<HELD>>` literals visible.
4. **Loader-path resolution (PD-C)** — Option 3 vendored bundle `three-with-loaders-r160.min.js` at `museum/assets/vendor/`, with an unpkg-reality-check as C-Build's first C3 step to confirm (or fall back to Option 1 if legacy `examples/js/` unexpectedly still ships at r160).

Sonnet is unblocked for C3 execution upon my kickoff dispatch. Three ship gates remain (initial payload ≤ 2.5 MB · real-content ship bar · JR sign-off); all three clear at C3 close.

## Substrate consumed

- Chief C3 pre-lift-off ([`DD-032-Opus-CH-c3-arch.md`](../../../../C%20Roles/Strategies/kickoffs/DD-032-Opus-CH-c3-arch.md)) — five pre-decisions (PD-A merge posture + Netlify hosting; PD-B audio anchor + roster schema + loop-point recommendation; PD-C loader-path evaluation ask; PD-D axe-core DevTools path; PD-E stale-state protocol adoption)
- D-032 (Chief-landed 2026-07-05) — hosting on Netlify; audio same-origin; museum ships as `/museum` sub-path
- DD-032 §When done ship gates (all three remaining exercised at C3)
- DD-032 §Handoff decisions items 1, 3 (tile blurb, guest book wording — JR-gated) + item 3 dual-voice architecture (still `audioUrl: null` at v1 per Chief C1 Chain 2026-07-04)
- Fable Implementation Strategy §1.2 item 6 (Jahna track, audio opt-in), §1.2 item 7 (guest book, warm-not-generic-fallback), §1.6 items 5-6 (real-content ship bar, human-review gate)
- C1 arch §1.4 `audio.json` schema (owner LOFI_SANCT; `cleared_status: "owner-delivered"`) — C3 amends the `tracks[]` shape per PD-B
- C2 signoff §Meta-honesty pattern (CDN paths + contrast math get reality-verification before publish)
- D-030 (runtime pattern) + D-031 (dynamically-injected modules = plain JS)

## Fable §3 planner-critic dialogue disagreements

**None at this reading.** Dialogue 5 synthesis (opt-in via threshold, single track, `visibilitychange` pause, LOFI_SANCT owns `audio.json`) is the exact architectural spine C3 encodes with the Chief's PD-B roster-ready refinement layered in. Dialogue 7 synthesis (guest book diegetic, `localStorage`, "Not {name}?" fallback, "scratch out" removal) drives C3 §2 verbatim.

---

## §1 — Audio pipeline

### §1.1 Transcode targets (offline, JR/Opus-side, not C-Build-side)

**Source:** `Terminal/Central Hub/SOD MUSEUM/audio/jahna-cat-walking-around-the-house-RAW.wav` (delivered 2026-07-03, Jahna's own composition, `cleared_status: "owner-delivered"`).

**Output formats:**

| Format | Codec | Bitrate | Target size | Browser coverage |
|---|---|---|---|---|
| `.aac` | AAC-LC | ~192 kbps | ~2.5 MB | Safari (mandatory), all evergreen browsers |
| `.opus` | Opus in WebM container | ~128 kbps | ~2.0 MB | Chrome/Edge/Firefox (preferred), fallback to AAC |

**Volume normalization at transcode time:** peak-normalize to -1 dB (headroom for browser gain), LUFS target -16 (streaming platform convention). No JR level work.

**Transcode command reference** (documented for C-Build to run, or JR/Opus-side pre-C-Build if the CDN swap gets bundled with the same offline pass):

```
ffmpeg -i jahna-cat-walking-around-the-house-RAW.wav \
  -c:a aac -b:a 192k -af "loudnorm=I=-16:TP=-1:LRA=11" \
  jahna-cat-walking-around-the-house.aac

ffmpeg -i jahna-cat-walking-around-the-house-RAW.wav \
  -c:a libopus -b:a 128k -af "loudnorm=I=-16:TP=-1:LRA=11" \
  jahna-cat-walking-around-the-house.opus
```

### §1.2 Hosting (per D-032)

Netlify same-origin under `quick-front-end/shade-of-design-landing/museum/audio/`. Transcoded files committed to the branch (`.aac` and `.opus` in the same directory). Netlify serves them as static assets alongside the rest of the museum sub-path. No CORS work; no third-party CDN dependency.

**Audio manifest URL shape:** relative paths (`audio/jahna-cat-walking-around-the-house.aac`, `.opus`) so local static-server preview + Netlify deploy resolve identically.

### §1.3 `audio.json` schema — roster-ready refinement (PD-B)

Amends the C1 schema to array-of-tracks with per-track voice_id and multi-format URLs:

```json
{
  "$schema_version": "1.1.0",
  "owner": "LOFI_SANCT",
  "consumers": ["sod-museum"],
  "tracks": [
    {
      "id": "cat-walking-around-the-house",
      "voice_id": "jahna",
      "title": "cat walking around the house",
      "artist": "Jahna",
      "credit": "Composed and performed by Jahna",
      "cleared_status": "owner-delivered",
      "raw_source_path": "SOD MUSEUM/audio/jahna-cat-walking-around-the-house-RAW.wav",
      "urls": {
        "aac": "audio/jahna-cat-walking-around-the-house.aac",
        "opus": "audio/jahna-cat-walking-around-the-house.opus"
      },
      "duration_seconds": null,
      "loop_point_seconds": null,
      "crossfade_seconds": 0.35,
      "assigned_to_hall_ids": ["classics"],
      "assigned_to_rotunda": true
    }
  ]
}
```

**Schema version bumped to `1.1.0`** — additive fields (`voice_id`, `credit`, `urls` object replacing `hosted_url_aac`/`hosted_url_opus`, `crossfade_seconds`). C-Build's schema-lint update covers the shape change without breaking prior tooling.

**`duration_seconds` and `loop_point_seconds` populate at transcode time** — `ffprobe -show_format` reads the transcoded output; values baked into `audio.json` post-transcode.

**Roster expansion (future):** additional tracks are `tracks[N]` appends. No manifest migration. Sonnet's schema-lint (below) accepts N ≥ 1.

### §1.4 Loop-point mechanism — crossfade (PD-B option 1)

**Locked: crossfade at loop tail via dual `AudioBufferSourceNode` + `GainNode` fade.**

Rationale:
- Zero JR asset pre-processing required (Chief-recommended default; JR pre-processing posture confirmed as "no").
- Musical bleed at boundary is acceptable for lo-fi ambient register — the track is atmospheric, not punchy-bar structured. A ~350ms crossfade is well below the perceptual threshold for ambient loops.
- Web Audio pattern is standard and lint-friendly.

**Implementation shape (Web Audio manager):**

```
1. Decode AAC/Opus buffer once at "Enter with sound" → cache as AudioBuffer.
2. Start Source A at t=0.
3. At (duration - crossfade_seconds), start Source B at t=0 with GainNode fading in over crossfade_seconds.
4. Source A's GainNode fades out over the same window.
5. When A ends, B becomes the primary; schedule the next Source C at (duration - crossfade_seconds) from B's start.
6. Continue rotation. Silent under `Enter quietly` — no Source instances created.
```

Bar-boundary hard-cut (Option 2) reserved for future higher-fidelity tracks. Long-tail natural fade (Option 3) recommended-against per Chief.

### §1.5 Web Audio manager module (`museum/audio/audio-manager.js`)

Plain JS per D-031 (dynamically-injected module = no JSX). Exposes:

- `AudioManager.init(trackConfig)` — decodes buffer, sets up GainNode, does not start playback
- `AudioManager.play()` — starts crossfade loop; called from threshold's "Enter with sound" branch
- `AudioManager.setVolume(value 0..1)` — persistent-volume via `localStorage.sod_audio_volume`
- `AudioManager.pause()` — suspends `AudioContext`; called from `visibilitychange` and by explicit user action
- `AudioManager.resume()` — reverses pause

**Autoplay policy:** the "Enter with sound" click already IS the unlock gesture (Fable Dialogue 1 synthesis) — `AudioContext.resume()` inside the click handler is the standard cross-browser pattern.

**Codec pick logic:** `HTMLAudioElement.canPlayType('audio/webm; codecs=opus')` → prefer `.opus`; else `.aac`. Populated at `AudioManager.init`.

**Persistent volume:** `localStorage.sod_audio_volume` written on setVolume; read on init; defaults to 0.65 if absent. Defensive wrappers per D-030 (quota + privacy-mode throws caught silently, treated as default).

### §1.6 Diegetic volume control UI

**Placement:** top-right corner of the museum viewport, subtle strip. Not a rotunda-diegetic pedestal (that pattern is reserved for the guest book — one diegetic UI beat per surface protects the register). Visible at all waypoints and in the 2D fallback. Hidden during cabinet zoom overlay (returns on close).

**Shape:** small speaker glyph (Marcellus/JetBrains Mono kind of typography — a UI moment, not a placard moment) with a horizontal slider. Slate border, Paper thumb, Ember on hover/focus. All within `--museum-*` palette. Keyboard-accessible (arrow keys change value on focus).

**Muted state:** double-tap toggle → `.sod_audio_muted` localStorage key. Also toggled from the threshold's "Enter quietly" branch (implicit mute) — the volume control shows a muted icon when the visitor entered quietly.

---

## §2 — Guest book pedestal

### §2.1 Diegetic placement

**Rotunda waypoint `rotunda-guest-book`** (already declared in `halls.json` at C1). Pedestal is a small mesh in the 3D scene (Ember-glow marble/obsidian block, waist-height) that becomes interactive on waypoint approach. 2D fallback: rotunda card grid gains a "Guest book" card that opens the same UI as the 3D pedestal zoom.

**Interaction:**
- Focus/approach → pedestal glows softly, cursor becomes a quill
- Click / Enter → modal overlay (same visual language as cabinet zoom overlay) opens with a Paper page (`--museum-paper` scarce moment #2, per Fable §1.4)
- Page shows current signed name (if any) + input field + "Sign the book" button + "Not {name}? Sign the book anew" link (only if signed) + "Scratch your name out" affordance (only if signed)
- Escape / close → returns to rotunda-guest-book waypoint (3D) or `#/rotunda` (2D)

### §2.2 localStorage discipline

- Key: `sod_visitor_name` (already spec'd at C1 for greeting substitution)
- Defensive wrappers per D-030: privacy-mode + quota-exceeded throws caught silently
- Set on "Sign the book" submission (trim whitespace, cap at 40 chars, sanitize control chars)
- Cleared on "Scratch your name out"
- Read at threshold render for greeting variant selection (already wired at C1)

**One-line plaque near the pedestal** (JetBrains Mono, `--museum-slate` decorative-only — non-text WCAG threshold, meets 3:1): "Nothing leaves the device." Fable §Dialogue 7 synthesis, verbatim.

### §2.3 Wording — held for JR

Per DD-032 §Decisions that remain JR's item 3: guest book wording is JR's. The C3 impl ships placeholder-clearly-marked strings until JR delivers:

- Pedestal invitation line (currently `<<HELD FOR JR — Fable proposed "Sign the book if you like. Or don't. The museum stays.">>`)
- "Sign the book" button label
- Removal affordance label (currently `<<HELD FOR JR — "Scratch your name out">>` suggested by Fable)
- Shared-computer fallback line (currently `<<HELD FOR JR — "Not {name}? Sign the book anew.">>` suggested by Fable)

**Real-content ship bar treatment:** Sonnet's ship-gate lint fails on `<<HELD FOR JR>>` string presence in any manifest or rendered component. C3 impl session ends with these strings still present; JR content pass replaces them before close-out. Same discipline as tile 05 blurb copy from C1.

### §2.4 Shared-computer + returning-visitor fallback

- Signed visitor sees "Welcome home, {name}." at threshold (existing C1 behavior)
- Signed visitor at rotunda-guest-book sees pedestal state with their name, "Scratch your name out" + "Not {name}? Sign the book anew" affordances
- Unsigned visitor sees "Welcome, traveler." (existing) + pedestal invites signing on approach

---

## §3 — Real-content ship bar audit protocol

### §3.1 Placard copy audit

**Every visible cabinet placard must carry real content — no `<<HELD>>`, no lorem, no filler.**

Three cabinets in Classics (`classics-mazechase`, `classics-dk-tribute`, `classics-mario-tribute`). C1/C2 placeholder copy (Fable-shape) is present in `cabinets.json[*].placard_copy_md` and `narration.json`. JR content pass required — his voice + register on the placards is the museum's actual editorial substrate.

**Timing:** JR content pass happens between C3 impl close and JR sign-off. Sonnet's ship-gate lint flags any placard containing `<<HELD>>` (from a possible C-Build placeholder marker) but not any content that JR has decided reads well; the discipline is on the marker, not the register.

**Sealed-hall plaque copy** — already real content per C1/C2 (`"In formation."` — literally the landing site's status vocabulary). No JR pass required unless JR wants to revise.

### §3.2 Real GLB art

**Locations reserved from C2:** `museum/assets/models/rotunda.glb` and `museum/assets/models/classics-hall.glb`. Placeholder procedural geometry ships there today (per C2 arch §2.4 pattern).

**C3 posture:** real GLBs land as **asset swap** — no scene code change, only the `.glb` file replacement. This preserves the C2 scene architecture and validates the "data + assets, not code" spine.

**Author source:** GLB authoring is out of DD-032 scope. Options for who produces the real GLBs — flagged forward to Chief/JR for coordination:
- JR authors via Blender/similar (highest fidelity to the intended vision)
- Ms. G authors as creative-side deliverable (matches her Tier-1 role)
- Fable authors via a Blender-tool-call pass (if Fable-window compatible)
- Programmatic scene expansion (upgrade the C2 placeholder from box-rooms to obsidian-textured rooms with cabinet-shape meshes and Ember accents; not "authored" but visually more resolved)

**Sonnet's C3 impl posture:** ship the C2 placeholder unchanged. GLB delivery is a JR/Chief coordination gate. C-Build's C3 impl close names this as the terminal-gate for JR sign-off.

**3D chunk payload re-measurement:** when real GLBs land, verify total 3D chunk stays ≤ 8 MB (C2 measured 665 KB with placeholder + no loaders; real GLBs at target ~1.8 MB rotunda + ~2.5 MB Classics + ~230 KB Draco decoder + ~750 KB KTX2 decoder = ~5.9 MB total — comfortable).

### §3.3 Audio ship bar

Real Jahna AAC/Opus streaming from Netlify same-origin. Manifest URLs non-null. Web Audio manager successfully initializes, plays on "Enter with sound", crossfades cleanly at loop point, pauses on tab background, persists volume across reloads.

Ship-gate lint constraint 10 (new): `audio.json.tracks[]` has at least one entry with `cleared_status ∈ {"owner-delivered", "cleared"}` AND non-null `urls.aac` AND non-null `urls.opus`.

### §3.4 Overall ship-bar audit — Sonnet lint script

Extend `museum/lint/lint-manifests.js` with constraint 10 (audio ship-bar) and a scan for `<<HELD` string tokens across all `.json` manifests and `.jsx`/`.js`/`.css` museum files. Fails on any match.

**One legitimate `<<HELD FOR JR>>` remains** — the tile 05 blurb in `landing.jsx`. Ship-gate lint scan is scoped to `museum/**` only; `landing.jsx` is landing-scope. Tile blurb JR gate closes when JR delivers copy, separate from museum internal ship bar.

---

## §4 — Loader-path resolution (PD-C)

### §4.1 Reality-check pre-publish

**My meta-honesty rule from C2 signoff:** CDN paths are one of the two categories where my arch cannot be trusted without a live-reality pass. C3 arch drafting *is* running the analysis; C-Build's C3 impl **runs the actual unpkg reachability test** as first step and confirms the recommendation (or falls back if reality diverges).

**Analysis (not empirical this session; C-Build verifies at C3 impl start):**

| Option | Cost | Risk profile | Runtime pattern impact |
|---|---|---|---|
| 1. Legacy `examples/js/loaders/*.js` at r160 | Zero if it works | High — three.js deprecated classic loaders around r148; likely a 404 at r160 | None if works; fallback to Option 3 otherwise |
| 2. Import maps + native ES modules | Low code cost | Medium — requires D-030 amendment; scene.js becomes ES module; Babel-standalone edge cases at scene load | Real expansion — new D-NNN |
| 3. Vendored pre-bundled `three-with-loaders-r160.min.js` | One-time offline bundler pass (esbuild) | Low — bit-perfect version pin, zero CDN drift risk, no runtime pattern expansion | None — extends offline-pipeline pattern (already established for GLB compression via `gltf-transform`) |

### §4.2 Recommendation: Option 3

**Locked as D-033 default. Vendored bundle at `museum/assets/vendor/three-with-loaders-r160.min.js`.**

Rationale:
- **Lowest risk profile against my calibration record.** My CDN-path arch has been wrong twice (C2 PD1: r170 UMD path never existed; C2 PD1-second-flag: `examples/jsm/` are ES-module-only across every version). A vendored bundle removes CDN paths from the equation entirely for the 3D chunk.
- **Consistent with the offline-pipeline discipline.** GLB compression (`gltf-transform`) already runs offline. Adding a one-time `esbuild` pass for `three@0.160.0 + GLTFLoader + DRACOLoader + KTX2Loader` matches that pattern.
- **Bit-perfect version pin.** Bundle contains exactly what we tested against. Version bumps require re-running the bundler — a deliberate, auditable step.
- **Same-origin loading.** Netlify serves the vendored bundle from the same domain as the rest of the museum. No third-party CDN latency, no CDN outage risk during ship verification.

### §4.3 Bundler command (Sonnet runs at C3 impl start)

```
npx esbuild \
  --bundle \
  --minify \
  --format=iife \
  --global-name=THREE_BUNDLE \
  --outfile=museum/assets/vendor/three-with-loaders-r160.min.js \
  bundle-entry.js
```

Where `bundle-entry.js` is a small entry that imports `three@0.160.0` + `GLTFLoader` + `DRACOLoader` + `KTX2Loader` and re-exports as globals: `window.THREE`, `window.THREE.GLTFLoader`, etc.

**One-time cost.** Committed output; no runtime bundler dep.

### §4.4 Fallback path (if reality-check surfaces Option 1)

If C-Build's unpkg check confirms `three@0.160.0/examples/js/loaders/*.js` unexpectedly still ships as classic scripts, Option 1 becomes the simpler landing — three script tags in sequence, matching D-030's existing CDN pattern with no offline bundler step.

**C-Build's first C3 impl action:** curl the three URLs. If all three return 200 with `Content-Type: application/javascript`, adopt Option 1 and note in impl log (still logs as D-033 outcome). If any 404, adopt Option 3 as spec'd.

### §4.5 What D-033 locks

Full D-033 entry in [`pipeline/DECISIONS.md`](../../pipeline/DECISIONS.md) — companion decision to this arch artifact. Records the option matrix, the recommendation with reality-check reservation, the bundler command, and the ripple to D-030 (offline-pipeline pattern extended, runtime pattern unchanged).

---

## §5 — Sonnet unlocks after C3 sign-off

### C-Build unlocks (per §Work items in C3 kickoff, executed under Opus@CH review):

1. **Loader-path reality-check + resolution** — first step. Curl r160's `examples/js/loaders/*.js` URLs. Adopt Option 1 if all 200; Option 3 (vendored bundle via esbuild) otherwise. Log outcome in D-033.
2. **Audio transcode** (`.wav` → `.aac` + `.opus`) — offline `ffmpeg` pass with LUFS normalization. Populate `audio.json` `duration_seconds`, `loop_point_seconds` (from `ffprobe`). Commit transcoded files to `museum/audio/`.
3. **`audio.json` schema update to v1.1.0** — array-of-tracks shape with `voice_id`, `credit`, `urls`, `crossfade_seconds`. Constraint-10 ship-bar lint added to `lint-manifests.js`.
4. **Web Audio manager** — `museum/audio/audio-manager.js` plain JS module. Crossfade loop, `visibilitychange` pause, persistent-volume localStorage with defensive wrappers.
5. **Diegetic volume control UI** — top-right corner strip, keyboard-accessible, hidden during cabinet zoom.
6. **Guest book pedestal (3D)** — mesh at `rotunda-guest-book` waypoint, click/Enter opens modal.
7. **Guest book pedestal (2D fallback)** — card in rotunda grid, opens same modal.
8. **Guest book modal shared component** — input, "Sign the book" submit, "Not {name}?" fallback, "Scratch your name out", defensive localStorage.
9. **Ship-bar lint additions** — constraint 10 (audio); `<<HELD` string scan across `museum/**` files.
10. **Production-CDN swap** — React + ReactDOM to `.production.min.js`; optional pre-transpile of `.jsx` to drop Babel-standalone if payload budget requires it. Re-measure initial payload against ≤ 2.5 MB gate.
11. **Verification protocol** — Playwright script or Preview-driven equivalent: full walkthrough with audio; Tab-order fuzz; stale-state stress pass (retained localStorage + retained URL fragment); payload re-measurement (initial ≤ 2.5 MB; 3D chunk ≤ 8 MB with real or placeholder GLBs).

### JR-side unlocks (parallel to C-Build's C3 impl, or after):

- **Tile 05 blurb copy** (DD-032 §Handoff decisions item 1) — held since C1.
- **Guest book wording** (item 3) — held since C3 arch.
- **Placard copy pass** — JR voice on the three Classics cabinet placards + entry narration.
- **Hall opening order after Classics** (item 4) — informational only for v2+, no C3 impact.
- **Real GLB delivery** — per §3.2 above, coordination with Chief.
- **Full axe DevTools pass** — per PD-D, JR runs the extension across all DOM states.

### Not unlocked at C3 (C3 is terminal):

- v2+ halls (Racing next per Fable recommendation; JR calls).
- Additional playable mini-games (one per release cadence).
- Voice narration `audioUrl` values (DD-015a arc, Chief bridges).
- Roster expansion for second audio track (JR_DD007 seed, future cycle).

---

## §6 — Ship gate rulings at C3

| Gate | Ruling |
|---|---|
| WCAG-AA contrast audit clean | **CLEARS at C3** — C2 contrast portion clean; JR runs DevTools axe pass for ARIA/focus/semantic |
| Keyboard-complete traversal | **CLEARS at C3** — C2 core path clean; Tab-order fuzz protocol executed at C3 close |
| Mobile 2D content-equal | Already CLEAR at C2 (unchanged) |
| Initial payload ≤ 2.5 MB | **CLEARS at C3** — production-CDN swap + optional pre-transpile; re-measured against gate |
| 3D chunk ≤ 8 MB | **CLEARS at C3** — real GLBs (or programmatic upgrade) + Draco/KTX2 decoders re-measured against gate |
| Brand-token lint clean | Already CLEAR at C2 (unchanged; enforcement stays blocking) |
| Real-content ship bar | **CLEARS at C3** — real Jahna streaming from Netlify; real placard copy on every cabinet; real (or upgraded) GLB art; no `<<HELD>>` strings in `museum/**` at close |
| JR sign-off | **CLEARS at C3 close** — terminal; ship goes to `main` merge + Netlify deploy |

**All eight gates clear at C3 close.** Museum ships to `main` on JR sign-off; Netlify auto-deploys; JR's first felt walk-in experiences the finished museum per Chief's direction.

---

## §7 — Verification protocol at C3

Extends the C1/C2 baseline (browser-driven via Claude Preview) with:

1. **Audio end-to-end walkthrough** — "Enter with sound" → transcode-URL loads → crossfade loop verified across at least one full track cycle → tab-background pause verified → tab-foreground resume verified → volume slider adjustment verified persisting across reload.
2. **Guest book cold flow** — unsigned visitor signs → returning-visit greeting substitutes name → "Scratch your name out" clears → "Not {name}?" flow on shared-computer state.
3. **Full axe DevTools pass** — JR runs the extension on threshold, rotunda, classics, cabinet zoom, guest book modal, sealed-plaque focus, 2D fallback rotunda, 2D fallback cabinet detail. Zero critical violations for ship.
4. **Tab-order fuzz** — cycle Tab through every focusable element in every route. Confirm order matches visual/reading order and no dead-ends.
5. **Stale-state stress pass** (PD-E adopted) — retained localStorage (`sod_visitor_name`, `sod_audio_optin`, `sod_audio_volume`) + retained URL fragment (`#/rotunda`, `#/classics/classics-mazechase`) from prior session → cold reload → every route resolves correctly, no permanent-Loading dead-ends, no crash on missing state.
6. **Payload re-measurement** — initial payload against ≤ 2.5 MB; 3D chunk (vendored bundle OR three CDN scripts + real GLBs) against ≤ 8 MB. Dev-tools Network tab under throttled connection.
7. **Real-content ship-bar scan** — `node museum/lint/lint-manifests.js` clean (constraint 10 passes); `<<HELD` scan across `museum/**` returns zero matches.
8. **Brand-token lint clean** across any new files (`audio-manager.js`, guest book components, vendored bundle if Option 3).

---

## §8 — What triggers the next session log

**Two session logs feed into JR sign-off:**

1. **C-Build C3 impl log** — filename `session-log-YYYY-MM-DD-sonnet-c3-impl.md`. Signal to fire: C-Build completes all 11 items in §5 and stops for Opus@CH review before touching any deferred item.
2. **Opus@CH C3 sign-off** — filename `session-log-YYYY-MM-DD-opus-c3-signoff.md`. Signal to fire: after I review C-Build's impl log against §5 items + §6 ship-gate table.

**Then JR sign-off (terminal).** Museum merges to `main`; Netlify deploys; JR's felt-first walk-in experience begins.

**Contingency signal:** if C-Build's C3 execution surfaces new pattern-deviations from this artifact, same C1/C2 discipline holds — flag in impl log, precedent-anchor, escalate at sign-off. The pattern-deviation rule is the load-bearing surface for calibration compounding across the loop.

---

## Cross-references

- **DD-032:** [`References/Designs/DD-032 SoD Museum — rotunda plus Classics hall.md`](../../../../References/Designs/DD-032%20SoD%20Museum%20—%20rotunda%20plus%20Classics%20hall.md)
- **Kickoff + Chain history (top-level):** [`C Roles/Strategies/kickoffs/DD-032-Opus-CH-arch-review.md`](../../../../C%20Roles/Strategies/kickoffs/DD-032-Opus-CH-arch-review.md)
- **Chief C3 pre-lift-off:** [`C Roles/Strategies/kickoffs/DD-032-Opus-CH-c3-arch.md`](../../../../C%20Roles/Strategies/kickoffs/DD-032-Opus-CH-c3-arch.md)
- **C3 impl kickoff to C-Build:** [`C Roles/Strategies/kickoffs/DD-032-C-Build-c3-shipbar.md`](../../../../C%20Roles/Strategies/kickoffs/DD-032-C-Build-c3-shipbar.md)
- **Companion decision D-033:** [`pipeline/DECISIONS.md`](../../pipeline/DECISIONS.md)
- **D-032 (hosting = Netlify), D-031 (dynamic modules = plain JS), D-030 (runtime pattern), D-029 (manifest schemas):** [`pipeline/DECISIONS.md`](../../pipeline/DECISIONS.md)

---

*Locked — Opus@CH, 2026-07-05*
*C3 kickoff to C-Build drafts next; C-Build's forge warms up in the next working session.*
