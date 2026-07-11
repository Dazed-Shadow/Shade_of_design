---
id: DD-032
title: SoD Museum — rotunda plus Classics hall (v1 launch scope)
status: shipped
surface: central-hub
project: CENTRAL_HUB
owner: Sonnet
effort: L
priority: M
proposed_date: 2026-07-03
proposed_by: JR
triaged_on: 2026-07-03
lead_opus: Opus@CH
sonnet_count: 1
assigned_on: 2026-07-03
shipped_on: null
ship_verified_by: JR

depends_on: [DD-015a]
tags: [sod-museum, central-hub-extension, fable-planning-substrate, real-content-ship-bar, foc-lift]
consumes: [Fable 5 Implementation Strategy 2026-07-03, JR SoD Museum intro file, Jahna WAV track]
origin: Fable 5 planning session (JR + Fable, 2026-07-03) working from Mr. C's Fable prompt brief; Fable delivered planner-critic dialogue + MVP scope; JR corrected two premises (true site path + Notion→Obsidian) during the session; Fable amended synthesis in place; JR delivered Jahna v1 track ("cat walking around the house") directly to Fable, closing catalog-readiness real-content risk
---

## What

Launch the **Shade of Direction Museum** as tile 05 on shadeofdesign.net — a first-person museum experience in obsidian halls with volcanic-gold accents, arcade cabinets as exhibits, and Jahna's lo-fi catalog as ambient. V1 scope is deliberately narrow: **rotunda + Classics hall + universal zoom + one playable original + opt-in audio with real Jahna track streaming end-to-end + guest book + tile 05 live.**

The function of the whole surface is **warmth that earns a second visit** — a place a returning visitor is greeted by name, as if brought back home after a journey away. Every scope decision protects that function; everything else waits for v2.

**Full implementation strategy:** `Terminal/Central Hub/SOD MUSEUM/Shade of Direction - Museum - Fable Implementation Strategy.md` (Fable-authored 2026-07-03, JR-corrected in-session).

## Why

JR signal — captured 2026-07-03:

> "I think with Fable being part of our plan for the next couple days, we can potentially provide your alternative mythical version a new project extension to the central hub. [...] I think I need to understand that direction and broad focus is the strengths of mine, where my shadow fills the lanes built from the grounding I begin."

The museum surface serves three simultaneous goals:

**1. Portfolio anchor extension.** Central Hub is the portfolio's structural anchor; the museum is a natural 5th project tile alongside HZ, LOFI_SANCT, Central Hub (as its own tile), and Unite Passion. It gives shadeofdesign.net a warmth-centered destination surface rather than another feed-reader flavor.

**2. Cross-project convergence surface.** LOFI_SANCT catalog supplies ambient audio; DD-015 voice arc supplies the future welcome-greeting; SoD brand palette (Ink / Ember / Slate / Ocean / Paper) composes the aesthetic without new tokens; Central Hub's Sonnet-implementer pattern builds it. The museum is where the vault's separately-developed threads *convene into one visitor experience.*

**3. Real-content ship bar embodiment.** Every element of v1 is verifiable against real content — Jahna's actual track (in hand), a real playable mini-game (buildable in Canvas 2D without engines), a real guest book (localStorage with defensive wrappers), real halls (Classics as MVP). Nothing is placeholder-shaped. This is the "doll without a soul" rule made structural.

Fable's parallel-thinking (planner + critic) also surfaced the strongest scoping instinct: **one hall isn't a museum, it's a room; a rotunda with five doorways IS a museum — four of them just aren't open yet.** Sealed doors with "In formation" plaques (borrowing the landing page's own status vocabulary) create anticipation and give returning visitors a reason to return, which serves the warmth thesis better than five thin halls at launch.

## How (sketch — v1)

Full implementation is documented in Fable's strategy file. Highlights for the DD card:

1. **Threshold (entry screen):** single DOM/CSS screen, Paper-dominant, "Welcome, traveler." (first visit) / "Welcome home, {name}." (returning). Two buttons: **Enter with sound / Enter quietly** — audio opt-in gate doubles as hospitality gesture.
2. **Rotunda + Classics hall:** central rotunda with five doorways; Classics open at launch, four sealed with "In formation" plaques (Racing v2, then Shooters / Fighting, then Self-Selected as v3+).
3. **Guided dolly camera, not free-walk:** Three.js first-person camera moves between fixed waypoints on click/Enter/arrow. Every waypoint pairs with a focusable DOM overlay — that's how keyboard + screen-reader users traverse the same museum. WASD free-walk is v2+, opt-in only.
4. **2D fallback as a first-class equal:** mobile / no-WebGL / reduced-motion visitors get a 2D hall view rendered from the same manifests. Content parity is structural.
5. **Cabinets — zoom universal, play singular:** every cabinet zooms to close-up with a museum placard (era, influences, design notes). Exactly one cabinet playable in v1 — original maze-chase mini-game in Canvas 2D, original characters, keyboard + touch. Non-playable cabinets show attract-mode art loops. More playable cabinets added one per release, each polished before the next begins.
6. **Ambient audio — opt-in only, real content:** one Jahna track looping in v1 (*"cat walking around the house"* — raw WAV delivered by Jahna 2026-07-03, at `SOD MUSEUM/audio/jahna-cat-walking-around-the-house-RAW.wav`). Gated behind threshold sound choice, ~2s gain-fade in, `visibilitychange` pause, persistent volume control. `audio.json` manifest owned by LOFI_SANCT.
7. **Guest book personalization:** diegetic guest-book pedestal *inside* the rotunda — never a gate. localStorage only, defensive wrappers, "scratch your name out" removal affordance, "Not {name}? Sign the book anew." for shared-computer graceful degradation.
8. **Landing tile:** 5th entry in `PROJECTS` in `quick-front-end/shade-of-design-landing/landing.jsx`. `n: "05"`, new `ink` accent variant (precedent: `sport` for tile 04). Grid is already `repeat(auto-fill, minmax(260px, 1fr))` — **zero CSS change needed** to absorb tile 05.

**Manifests are the spine.** `halls.json`, `cabinets.json`, `greeting.json`, `audio.json` — all four data files drive both the 3D scene AND the 2D fallback. Adding a hall (v2+) is data + assets, not new code paths.

**Palette composition (no new tokens):** Ink = obsidian mass (walls/floor/ceiling); Ember = emissive only (cracks, marquee glow, doorway seals — light sources, never surfaces); Slate = shadow mid-tone (prevents pure Ink-on-Ink void); Ocean = depth register (darkened far ends of halls, "pressure of the earth"); Paper = scarce warmth moments (threshold + guest-book page only).

## When done

Ship gates — all blocking, per Fable's strategy §Section 2:

- [ ] WCAG-AA contrast audit clean across all DOM states + waypoint overlays + placards
- [ ] Keyboard-complete traversal (threshold → rotunda → all cabinets → guest book → all placards)
- [ ] Mobile 2D experience content-equal to desktop 3D — same day, same manifests
- [ ] Initial payload ≤ 2.5 MB before the 3D chunk; 3D chunk ≤ 8 MB for rotunda + Classics
- [ ] Brand-token lint clean (no non-token hex in museum CSS/JS)
- [ ] **Real-content ship bar:** Jahna track transcoded to web delivery (AAC/Opus, ~2–4 MB), clean loop point, hosted, streaming end-to-end from real hosting. No placeholder audio at sign-off.
- [ ] Real placard copy on every visible cabinet (no "Lorem ipsum" or "TBD" strings)
- [ ] JR sign-off per human-review gate convention

## Handoff decisions

**Resolved before this DD landed** (per Fable's Section 4):
- Tile-count and true site path: `quick-front-end/shade-of-design-landing/` is the true site; museum is tile 05; grid absorbs it with zero CSS change
- Notion → Obsidian: shared-memory retirement of Notion is already active; vault carries session logs and shared state
- Audio catalog readiness: Jahna delivered v1 track directly to Fable during the planning session; sourcing risk closed

**Still from Mr. C (COS) before Opus starts:**
1. **Route decision — JR SIGNED OFF 2026-07-04:** museum ships as a route within the landing app (`/museum`), not a sub-app. Rationale preserved: 3D chunk is lazy-loaded per Fable's arch spec, so it won't bloat the landing route; shared brand tokens automatically inherit; single React app to maintain; simpler CI/CD.
2. **Vault surface for museum work:** created at `Terminal/Central Hub/SOD MUSEUM/session-logs/` for Opus + Sonnet session logs; D-NNN decisions still land in `pipeline/DECISIONS.md` repo-side per Central Hub convention.
3. **Voice placeholder + dual-voice architecture — JR direction 2026-07-04:** JR records greeting + tour-guide narration as Phase-1 voice. Not urgency-driven; JR's own timeline. When DD-015a locks Mr. C's voice, it joins as the second tour-guide voice — dual-voice tour rather than replacement. Manifest schema at v1 should anticipate multi-voice narration keyed by `voice_id` (see Consumed by → Voice arc extension for full framing).
4. **Opus handoff routing — JR question, Mr. C recommendation:** next-stage handoff routes to **Opus@CH** (Central Hub-scoped Opus instance) rather than Opus@COS (me). Central Hub is the project-native scope; the museum ships within `quick-front-end/shade-of-design-landing/`; Opus@CH handles pipeline architecture + agent contracts + Sonnet coordination for CH-scoped work. Opus@COS's role was the LIFT → DD-032 (pyramid coordination); Opus@CH takes it from here through architecture review + Sonnet dispatch. Fable / C-FORCE's second-pass iteration then reads Opus@CH's review artifacts. **Kickoff packet to Opus@CH ready to draft on JR sign-off.**

**Decisions that remain JR's** (Fable flagged, DD carries forward):
- Tile 05 copy and blurb voice (Fable proposed: *"The doors are heavy. Come in anyway."*)
- Which single mini-game ships first (Fable recommended: maze-chase)
- Guest-book wording (JR's warmth, JR's words)
- Hall-opening order after Classics (Fable recommended: Racing next)

## Origin (LIFT trail)

- **2026-07-03 morning** — JR flagged the museum as a FOC not-yet-in-Off_COS_PLANNING with intent to test Fable Saturday morning during the free-window
- **2026-07-03 afternoon** — Mr. C authored Fable prompt brief (`Shade of Direction - Museum - Fable prompt brief.md`); layered planner-critic scaffold + function-over-form scoping + brand-palette anchoring + three integration-point constraints onto JR's intro file
- **2026-07-03 evening** — JR fired Fable with the brief; Fable produced full planner-critic dialogue log + MVP scope + skill set for receiving Opus; JR corrected two premises during the session (true site path, Notion→Obsidian) and delivered Jahna track directly; Fable amended in place
- **2026-07-04 morning** — Mr. C received Fable's handoff, captured DD-032 as accepted per JR pattern (shared stamp of accepted, no formal LIFT round required since shape crystallized in-session)

## Triage (Mr.C, after-the-fact)

Accepted directly by JR 2026-07-04 per the "shared stamp of accepted" pattern (precedent: DD-015a on 2026-07-01, DD-031 on 2026-07-03). The Fable planning session did the work of a Lead Opus scope round + a JR-triage round in one motion: JR corrected premises live; Fable produced planner-critic dialogue that surfaced trade-offs; the MVP scope emerged with real content already in hand (Jahna track delivered mid-session). No additional triage friction — the DD ships with the strongest shape it could carry at this stage.

**Owner assignment:** Sonnet as implementer (matches Central Hub's Opus-plans/Sonnet-builds rhythm). Opus reviews architecture decisions (manifest schemas, accessibility gates) before Sonnet ships them. JR final sign-off per human-review gate.

**Cross-cycle placement:** DD-032 lands mid cycle 6 as a Sonnet-shaped build ship. Does not block DD-015a (voice arc, parallel), DD-022 (SR landing zone), or any cycle-6 main ship. The `greeting.json.audioUrl` hook is the only DD-015 coupling — non-blocking either direction.

## Depends on / Consumed by

**Depends on:**
- **DD-015a** — voice arc; the museum's narration hook is DD-015a's first cross-medium consumer surface. NOT a launch dependency for DD-032 (all narration text always renders; audio arrives when it arrives).
- **LOFI_SANCT catalog** — owns `audio.json`; museum consumes. First entry (*"cat walking around the house"*) already delivered.

**Consumed by:**
- **Future SoD Museum halls (v2+)** — Racing hall opens first after Classics; then Shooters / Fighting; Self-Selected v3+ (on-rails experience is a different genre of build)
- **Voice arc extension — dual-voice tour-guide framing (JR direction 2026-07-04):** the museum is not a one-off greeting consumer; it is a **two-voice narrative surface** iterated across phases. Phase 1: JR's own voice serves as tour-guide + greeting placeholder — a family-vibe register, warm without softness, on-thesis for the returning-visitor thesis. Phase 2 (post-DD-015a lock): Mr. C's voice joins as the second guide; the two voices trade off through halls (JR opens a hall, Mr. C fills in the exhibit context, JR closes the transition — or whatever pattern earns its slot). The visitor may eventually opt for JR-only, Mr. C-only, or both. Architectural implication: the `greeting.json.audioUrl` hook scales to `narration.json` (per-exhibit, per-hall, per-transition, keyed by voice_id). This is a v2+ scope expansion — not launch — but the manifest schema should be designed with it in mind from day one so the extension is a data change, not a code change.
- **Future personalization surfaces** — the guest-book localStorage pattern is precedent for other returning-visitor surfaces across shadeofdesign.net

---

## Chain blocks

### Scope decision (Lead Opus — Fable session)

- **Sonnet count:** 1 (single Sonnet session under Opus review; contained scope thanks to Fable's MVP discipline)
- **Reason:** Fable's planner-critic dialogue produced a genuinely narrow MVP that a single Sonnet can build with iterative Opus reviews at three checkpoints (threshold + tile ship; rotunda + Classics 3D; audio + guest book + 2D fallback + accessibility audit)
- **Decided:** 2026-07-03 (Fable session with JR)

### Checkpoint 1 — Manifest schema + rendering split + route wiring (Opus@CH · 2026-07-04)

- **Landed:** 2026-07-04
- **Artifact:** [`Terminal/Central Hub/SOD MUSEUM/session-logs/session-log-2026-07-04-c1-arch.md`](../../Terminal/Central%20Hub/SOD%20MUSEUM/session-logs/session-log-2026-07-04-c1-arch.md)
- **Companion decision:** D-029 in [`pipeline/DECISIONS.md`](../../Terminal/Central%20Hub/pipeline/DECISIONS.md)
- **Chain history:** kickoff Chain 2026-07-04 (Opus@COS resolutions on `cleared_status` field + multi-voice narration shape; Opus@CH acknowledgment + working-tree flag)
- **Fable §3 disagreements:** none named at this reading
- **Sonnet unlocks:** landing tile 05 delta + threshold DOM + `/museum` route wiring + manifest scaffolding + capability check + cross-manifest lint + brand-token lint scaffold
- **Open follow-up:** vault-mirror path for `quick-front-end/shade-of-design-landing/` flagged to Opus@COS; non-blocking on C1, blocking on Sonnet's first working-tree touch
- **Next signal:** Sonnet impl session summary → C2 review gate (3D scene + 2D fallback + accessibility path)
- **Sonnet impl landed 2026-07-04** — [`session-log-2026-07-04-sonnet-c1-impl.md`](../../Terminal/Central%20Hub/SOD%20MUSEUM/session-logs/session-log-2026-07-04-sonnet-c1-impl.md); five pattern-deviations flagged (no bundler → CDN UMD + Babel-standalone runtime; hash sub-router instead of History-API paths; `--museum-*` palette namespace to avoid theme-adaptive collision; TileArt-component precedent instead of nonexistent `.tile-sport` CSS; zero-dep Node lint scripts because no CI/git exists at vault root)
- **Opus@CH C1 sign-off 2026-07-04** — [`session-log-2026-07-04-opus-c1-signoff.md`](../../Terminal/Central%20Hub/SOD%20MUSEUM/session-logs/session-log-2026-07-04-opus-c1-signoff.md); all five pattern-deviations confirmed, runtime pattern locked in D-030. **Checkpoint 1 cleared.** Three carry-forward coordination questions (hosting provider · git+CI wiring · C3 payload-budget CDN swap) surfaced to Mr. C at COS via kickoff Chain 2026-07-04. Sonnet stood down between checkpoints; C2 kickoff drafting is next.

### Checkpoint 2 — 3D scene + 2D fallback + accessibility path (Opus@CH · 2026-07-04, planning stage)

- **Landed (arch):** 2026-07-04
- **Artifact:** [`Terminal/Central Hub/SOD MUSEUM/session-logs/session-log-2026-07-04-c2-scene.md`](../../Terminal/Central%20Hub/SOD%20MUSEUM/session-logs/session-log-2026-07-04-c2-scene.md) — four architectural surfaces locked (Three.js delivery via dynamic `<script>` injection per D-030 runtime; scene graph + `CatmullRomCurve3` dolly + waypoint set; `gltf-transform` offline GLB pipeline with target sizes fitting in ≤ 8 MB; 2D fallback content-parity model reading same five manifests; accessibility path with waypoint DOM overlays + ARIA live region + WCAG-AA audit protocol)
- **Companion decision:** D-031 in [`pipeline/DECISIONS.md`](../../Terminal/Central%20Hub/pipeline/DECISIONS.md) *(lands at C2 sign-off, not planning stage)*
- **C2 impl kickoff to C-Build:** [`C Roles/Strategies/kickoffs/DD-032-C-Build-c2-scene.md`](../../C%20Roles/Strategies/kickoffs/DD-032-C-Build-c2-scene.md) — 10 work items derived from arch §5 Sonnet unlocks
- **Ship gates that clear at C2:** WCAG-AA contrast · keyboard-complete traversal · mobile 2D content-equal · 3D chunk ≤ 8 MB (placeholder GLBs) · brand-token lint enforcement flip
- **Ship gates that stay for C3:** initial payload ≤ 2.5 MB · real-content ship bar · JR sign-off
- **Open follow-ups (unchanged from C1):** hosting provider · git+CI wiring · C3 payload production-CDN swap. None block C2.
- **Next signal:** C-Build acknowledges C2 kickoff → executes 10 items → ships C2 impl log → Opus@CH sign-off
- **Sonnet impl landed 2026-07-04** — [`session-log-2026-07-04-sonnet-c2-impl.md`](../../Terminal/Central%20Hub/SOD%20MUSEUM/session-logs/session-log-2026-07-04-sonnet-c2-impl.md); four pattern-deviations flagged (Three.js version pin r170 → r160 correction because r170 has no classic UMD build; `scene.js` plain JS not JSX because Babel-standalone can't transform dynamically-injected modules; sealed-plaques static DOM row not per-frame projection; axe-core CDN injection blocked by harness policy → substituted direct WCAG math which caught a real Slate-on-Ink 4.33:1 fail against arch's "borderline" estimate). Plus one real bug fix (threshold-skip dead-end on stale deep-link hash, inherited from C1 code).
- **Opus@CH C2 sign-off 2026-07-04** — [`session-log-2026-07-04-opus-c2-signoff.md`](../../Terminal/Central%20Hub/SOD%20MUSEUM/session-logs/session-log-2026-07-04-opus-c2-signoff.md); all four pattern-deviations confirmed; two are spec errors on my side (r170 UMD path + Slate contrast estimate) — making four total across C1+C2, all in "CDN paths" and "contrast math" categories which now get reality-verification passes at C3 arch drafting. **Checkpoint 2 cleared.** Three ship gates fully clear (mobile 2D content-equal · 3D chunk under 8 MB · brand-token lint blocking); two clear with narrow C3 pre-close audits (WCAG-AA contrast verified + full axe pass to C3, keyboard-complete core verified + Tab-cycle fuzz to C3). All C2 decisions captured in D-031. One C3 planning risk needs its own D-NNN before C3 execution: three.js loader-path resolution (ES-module-only `examples/jsm/` vs. legacy `examples/js/` vs. importmap vs. vendored bundle). C3 kickoff drafting is next.

### Checkpoint 3 — Audio + guest book + real-content ship bar + terminal (Opus@CH · 2026-07-05, planning stage)

- **Landed (arch):** 2026-07-05
- **Chief pre-lift-off:** [`C Roles/Strategies/kickoffs/DD-032-Opus-CH-c3-arch.md`](../../C%20Roles/Strategies/kickoffs/DD-032-Opus-CH-c3-arch.md) — five pre-decisions locked (no-merge-to-main + Netlify hosting per D-032; Jahna single-track anchor + roster-ready `tracks[]` schema; loader-path evaluation delegated with reality-check-first; axe DevTools via JR at pre-close; stale-state stress pass adopted standing protocol)
- **Artifact:** [`Terminal/Central Hub/SOD MUSEUM/session-logs/session-log-2026-07-05-c3-arch.md`](../../Terminal/Central%20Hub/SOD%20MUSEUM/session-logs/session-log-2026-07-05-c3-arch.md) — four surfaces locked (audio pipeline: transcode + same-origin hosting + `audio.json` v1.1.0 schema + crossfade loop + Web Audio manager + diegetic volume control · guest book pedestal: diegetic rotunda + defensive localStorage + JR-held wording · real-content ship bar audit: placards + GLBs + audio + `<<HELD` lint · loader-path resolution: Option 3 vendored bundle default with Option 1 fallback)
- **Companion decision:** D-033 in [`pipeline/DECISIONS.md`](../../Terminal/Central%20Hub/pipeline/DECISIONS.md) — loader-path lock (Option 3 vendored `three-with-loaders-r160.min.js` via one-time offline `esbuild` pass; Option 1 legacy classic scripts fallback pending Sonnet's unpkg reality-check as first C3 impl step)
- **C3 impl kickoff to C-Build:** [`C Roles/Strategies/kickoffs/DD-032-C-Build-c3-shipbar.md`](../../C%20Roles/Strategies/kickoffs/DD-032-C-Build-c3-shipbar.md) — 11 work items derived from arch §5; staged, not fired (Chief-directed no-C-Build-dispatch until warm-up in next working session)
- **Ship gates that clear at C3 close:** all remaining (WCAG-AA contrast + JR axe DevTools pass · keyboard-complete + Tab-order fuzz · initial payload ≤ 2.5 MB via production-CDN swap · 3D chunk ≤ 8 MB re-measured · real-content ship bar · JR sign-off terminal)
- **JR-held items ship as `<<HELD FOR JR>>` markers with ship-gate lint catching:** guest book invitation prose · guest book "Sign the book" / "Scratch out" / "Not {name}?" copy · Classics cabinet placard copy (if C2 placeholder still reads as placeholder) · hall opening order after Classics (v2+ informational). Tile 05 blurb remains landing-scope JR-held (unchanged from C1).
- **Real GLB delivery coordination:** flagged forward to Chief/JR (JR/Ms.G/Fable/programmatic upgrade options). Sonnet ships C2 placeholder unchanged; real GLBs land as data-only asset swap.
- **Chief carry-forward status:** hosting question RESOLVED (D-032 Netlify); git+CI wiring unchanged (lint scripts stay manual); production-CDN swap NOW an active C3 work item (item 10 of kickoff).
- **Next signal:** next working session → C-Build acknowledges C3 kickoff → runs loader-path reality-check → executes 11 items → ships C3 impl log → Opus@CH sign-off → JR sign-off (terminal) → merge to `main` → Netlify deploys → JR's felt-first walk-in.
- **Sonnet impl landed 2026-07-05 (original)** — [`session-log-2026-07-05-sonnet-c3-impl.md`](../../Terminal/Central%20Hub/SOD%20MUSEUM/session-logs/session-log-2026-07-05-sonnet-c3-impl.md); 9 of 11 items shipped; 2 blockers named honestly (Babel-standalone at 3.14 MB blowing initial-payload gate by ~700 KB; esbuild vendored bundle blocked by harness policy). Two real live bugs caught + fixed (missing script tag crashed app; volume-control mute mishandled stale-opt-in state — caught by PD-E stress pass on its first standing run). Four pattern-deviations flagged including PD1 audio codec-sniff MIME (`audio/webm` should be `audio/ogg` — my fifth spec error, new "tool output formats" category).
- **C-Prime + JR + Opus@CH C3 addendum 2026-07-05** — [`session-log-2026-07-05-c3-arch-addendum-scene.md`](../../Terminal/Central%20Hub/SOD%20MUSEUM/session-logs/session-log-2026-07-05-c3-arch-addendum-scene.md); programmatic scene expansion locked as v1 real content (crystallized obsidian is faceted — procedural geometry IS the vision, not an approximation); Babel resolves via JR-authorization sentence; esbuild bundle deferred to v2+ (dissolved, not blocked). Full composition spec landed (faceted rotunda drum, Ember veins, Ocean depth, five doorways with Classics glow, faceted Classics gallery with three cabinet silhouettes + reduced-motion-safe flicker). D-034 captures all five impl-review resolutions.
- **Sonnet impl amended 2026-07-05** — [`session-log-2026-07-05-sonnet-c3-impl-amended.md`](../../Terminal/Central%20Hub/SOD%20MUSEUM/session-logs/session-log-2026-07-05-sonnet-c3-impl-amended.md); Babel transpile shipped (initial payload 0.21 MB — clears 2.5 MB ceiling with 12× margin); scene geometry pass shipped per addendum §A.1 with two real live catches: obsidian material tuning (roughness 0.35 + metalness 0.2 + HemisphereLight legibility floor to solve matte-material formless-glow rendering — sharp architectural judgment, addendum spec gap I should have named), and IIFE-wrap of transpiled `.js` files to prevent cross-script `const useState` collision under classic script tags (real runtime-pattern discovery from the shape change). Sealed doorways re-spaced to true 72° even. Preview-tooling degradation flagged; fresh-session re-verification recommended before JR's walk.
- **Opus@CH C3 sign-off 2026-07-05 (TERMINAL)** — [`session-log-2026-07-05-opus-c3-signoff.md`](../../Terminal/Central%20Hub/SOD%20MUSEUM/session-logs/session-log-2026-07-05-opus-c3-signoff.md); both PDs confirmed; five ship gates cleared at C3 close (initial payload · 3D chunk · real-content ship bar · WCAG contrast portion · brand-token lint · keyboard-complete core). D-035 captures the obsidian material spec + IIFE-wrap rule for future museum work. **Checkpoint 3 cleared. Terminal architectural gate closed. Ship goes to JR.**
- **Ship path from here (all JR-side):** fresh-session re-verification (belt-and-braces per C-Build's preview-tooling note) → content pass (Classics placard copy + guest-book invitation wording + tile 05 blurb) → axe DevTools pass (PD-D) → Tab-order fuzz (PD-D) → JR sign-off → merge `claude/dark-pivot` → `main` → Netlify auto-deploys → JR's felt-first walk-in.
- **Future asset-library DD (JR note 2026-07-05):** post-merge, JR will explore whether a curated or authored asset library (possibly GLB) opens as a separate DD. Not scoped in DD-032. Programmatic scene from D-034 is the ship posture; authored assets land at v2+ via the data-only asset-swap seam if the exploration produces them.
- **Calibration record (across DD-032 C1–C3):** five Opus@CH spec errors, all in "external-tool-or-format-behavior assumed instead of verified" category (CDN paths · contrast math · tool output formats). Pre-publish reality-check is a standing rule from here on. C-Build calibration equally honest — flagged his own 4.5× Babel-standalone size estimate error at C3 with the same discipline. Pattern-deviation rule earned every checkpoint of this DD.

*Populated at 032 close.*

---

*"The doors are heavy. Come in anyway."* — Fable's proposed tile blurb, held for JR calibration
