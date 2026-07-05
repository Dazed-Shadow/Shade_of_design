# Shade of Direction Museum — Implementation Strategy & Opus Skill Set
**Author:** Fable 5 (Mr. C Prime) · **Date:** 2026-07-03 · **Status:** Planning artifact — nothing here is built
**Inputs:** `Shade of Direction - Museum to remember to move forward- intro.md`, Fable prompt brief, live `shade-of-design-site/landing.jsx` + `landing.css`, Central Hub `CLAUDE.md`

**Pattern:** Function over form. Every choice below names the function first; the form is what serves it.

> **Ground truth (corrected by JR 2026-07-03):** the true site lives at `quick-front-end/shade-of-design-landing/` — the `shade-of-design-site/` and `-normalized/` folders are Claude Design workflow artifacts and must not be treated as source. The true `landing.jsx` has **4** tiles (Jahna, Horizon Search, Lofi Sanctuary — live at lfsjbeats.netlify.app — and Pit Stop & The Paint / Unite Passion, accent `sport`), and `.tiles` is already `repeat(auto-fill, minmax(260px, 1fr))`. The museum is tile **05**, and the grid needs **no CSS change at all** (see Dialogue 6, amended). Opus works in `quick-front-end/shade-of-design-landing/` only.
>
> **Also corrected:** Notion is no longer maintained — **Obsidian (Chief of Staff Diary vault) is the source of truth** for shared memory, session logs, and decisions. All Notion references in the original draft are amended below.

---

## Section 1 — Implementation Strategy (for Opus)

### 1.1 What this is

A first-person museum experience — obsidian halls, ember volcanic accents, arcade cabinets as exhibits, Jahna's lo-fi catalog as ambient — reachable as a project tile on shadeofdesign.net. The function of the whole site is **warmth that earns a second visit**: a place a returning visitor is greeted by name, as if brought back home after a journey away. Every scope decision below protects that function; everything that doesn't serve it waits.

### 1.2 MVP scope (v1 — what ships)

1. **Threshold (entry screen).** A single DOM/CSS screen, no WebGL. This is the one Paper-dominant (`#FAFAF7`) moment in the whole experience — warm light spilling from museum doors set in Ink (`#0B1726`). Greeting text: "Welcome home, {name}." for returning visitors, "Welcome, traveler." for first visits. Two entry choices: **Enter with sound / Enter quietly** (this doubles as the audio opt-in gate — see 1.4). Door-opening transition is a CSS transform, fully suppressed under `prefers-reduced-motion`.
2. **One hall plus rotunda.** A central rotunda with five doorways. **Classics** hall is open at launch (broadest recognition, most family-first). The other four doorways are sealed with hall plaques reading "In formation" — deliberately reusing the landing page's status vocabulary so the brand voice is continuous.
3. **Guided-dolly movement, not free-walk.** First-person camera in Three.js that moves between fixed waypoints on click / Enter / arrow key. No WASD free movement, no collision detection, no navmesh. Each waypoint has a matching focusable DOM overlay, which is what makes the 3D experience keyboard-traversable and screen-reader-narratable (each stop announces where you are and what's near). Optional mouse-drag look-around at each waypoint, off by default under reduced-motion.
4. **2D fallback as a first-class equal.** Mobile, no-WebGL, and reduced-motion visitors get a 2D hall view: same rotunda structure, same cabinets, same placards, same audio, rendered as a styled DOM gallery. It is generated from the same hall manifest (1.5), so content parity is structural, not manual.
5. **Cabinets: 1 playable, rest display.** Every cabinet in Classics hall zooms to a close-up with museum placard (era, influences, design notes — the "legend"). Exactly **one** cabinet is playable in v1: an original maze-chase mini-game in Canvas 2D, original characters, in the visual language of the era. No ROM emulation anywhere, ever. Non-playable cabinets show attract-mode art loops (CSS/video, cheap).
6. **Ambient audio, opt-in only.** One Jahna track looping in v1, gated behind the threshold choice, faded in over ~2s, paused on tab blur, volume control persistent. **The v1 track is in hand:** *"cat walking around the house"* — raw WAV delivered by Jahna 2026-07-03, stored at `SOD MUSEUM/audio/jahna-cat-walking-around-the-house-RAW.wav` (24 MB source). Video-game feel and BPM fit the halls. Remaining audio work is production, not sourcing: transcode to web delivery (AAC/Opus, ~2–4 MB), set a clean loop point, host, and reference from `audio.json`. **Real-content ship bar applies:** v1 signs off with this real track streaming end-to-end from real hosting — which is now fully within our control.
7. **Guest book personalization.** Name is asked *inside* the museum via a diegetic guest-book pedestal in the rotunda — never a gate, never a form at the door. localStorage only. "Scratch your name out" affordance for removal.
8. **Landing tile.** 5th entry in `PROJECTS` (`n: "05"`) in the true site's `quick-front-end/shade-of-design-landing/landing.jsx`, new `ink` accent variant (precedent: `sport` was added for tile 04), status "soon" until launch, flipped to "live" at ship. The grid is already `repeat(auto-fill, minmax(260px, 1fr))` — it absorbs tile 05 with **zero CSS change**.

### 1.3 Progressive-enhancement scope (v2+)

- Remaining four halls, one at a time, Racing first (strongest visual identity: horizon lines, ember light trails).
- Per-hall track assignment with crossfade on hall transitions.
- Additional playable cabinets — each is its own scoped mini-project, added only when the previous one is polished.
- Free-look and optional free-walk on desktop for visitors who opt into it.
- **Voice greeting hook (DD-015 dependent, not a launch dependency):** the greeting component reads from a manifest entry `greeting: { text, audioUrl | null }`. Text always renders; any MP3 URL dropped into the manifest speaks — behind the same sound opt-in, provider-agnostic, zero code change at swap time. **Interim path confirmed by JR:** he may record the greeting himself as placeholder voice; the hook accepts that today, and DD-015a's locked candidate replaces it later by editing one manifest field. A family voice as the first "welcome home" is on-thesis, not a compromise.
- Self-Selected hall's on-rails experience is explicitly v3+; it is a different genre of build.

### 1.4 Architecture at the module level

```
quick-front-end/shade-of-design-landing/museum/   (or /museum route in the site app — JR decision, see Section 4)
  manifest/
    halls.json          # hall id, theme, doorway state, track id, cabinet list
    cabinets.json       # cabinet id, hall, art assets, placard copy, playable: bool, gameModule: str|null
    greeting.json       # greeting text variants + audioUrl (null until DD-015a)
    audio.json          # track id, title, hosted URL — OWNED BY LOFI_SANCT, consumed here
  threshold/            # entry screen, audio opt-in, reduced-motion gate  (DOM/CSS only)
  scene/                # Three.js: dolly path, waypoints, GLB halls, KTX2 textures (lazy chunk)
  fallback2d/           # DOM gallery renderer, driven by the same manifests
  cabinets/             # zoom view, placard renderer, games/ (canvas mini-game modules)
  audio/                # Web Audio manager: opt-in state, fade, tab-blur pause, volume persistence
  persona/              # guest book: localStorage name, greeting variants, removal
  tokens.css            # imported from brand system — the only source of color
```

**The manifests are the spine.** 3D scene, 2D fallback, placards, and audio all read the same JSON. This is what makes content parity, testing, and future halls cheap: adding a hall is data + assets, not new code paths.

**Rendering split:** everything before "Enter" is plain DOM. The Three.js scene is a lazy-loaded chunk requested only after the visitor enters on a WebGL-capable, motion-tolerant desktop. Initial payload budget: **≤ 2.5 MB** before the 3D chunk; 3D chunk ≤ 8 MB for rotunda + Classics.

**Palette composition (no new tokens):** Ink is the obsidian mass — walls, floor, ceiling. Ember is emissive only: cracks in the obsidian, cabinet marquee glow, doorway seals — light sources, never surfaces. Slate is the shadow mid-tone that keeps halls readable (pure Ink-on-Ink fails contrast and reads as void). Ocean is the depth register — the darkened far ends of halls, the "pressure of the earth." Paper appears exactly twice: the threshold, and the guest-book page. Its scarcity is what makes it feel like warmth.

### 1.5 Integration points with existing SoD infrastructure

- **Brand system:** import tokens from `Shade of Design - Brand System.html` values; a lint script fails the build if any hex outside the token set appears in museum CSS/JS.
- **Landing page:** one `PROJECTS` entry + one new `TileArt` motif (cabinet-glow: Ink field, Ember marquee lines) + `tile-ink` accent class, all in `quick-front-end/shade-of-design-landing/`. No grid CSS change — `auto-fill` already handles tile 05. That is the entire landing delta.
- **LOFI_SANCT:** the museum consumes `audio.json`; LOFI_SANCT owns it (track titles, cleared status, hosted URLs). The museum never hardcodes a track. v1's entry is *"cat walking around the house"* (raw source in `SOD MUSEUM/audio/`). Anonymity rule holds: artist surfaces as "Jahna" only — no family details on any public surface.
- **DD-015 voice arc:** `greeting.json.audioUrl` is the entire coupling surface.
- **Design Content / port-design-bundle:** if any assets arrive via Claude Design bundles, run them through `scripts/port-design-bundle.py` and diff `landing.jsx` after copy, per standing Central Hub practice.
- **Agent rhythm (amended):** Opus plans/reviews → Sonnet implements → **Obsidian (Chief of Staff Diary vault) is shared memory** — Notion is retired. Decisions still land in `pipeline/DECISIONS.md` with D-NNN ids (repo-side log unchanged); session logs and cross-project state live in the vault.

### 1.6 Explicit constraints Opus must respect

1. **Palette is closed.** Ink `#0B1726`, Ember `#C97B4A`, Slate `#5D809D`, Ocean `#1A3E62`, Paper `#FAFAF7`. Marcellus headings, Inter body, JetBrains Mono for UI/code text. No new colors, no new faces.
2. **No ROM emulation, no copyrighted game assets, no licensed music.** Tribute aesthetics and original mini-games only. Audio is Jahna catalog exclusively.
3. **Accessibility floor is a ship gate, not a backlog item:** WCAG-AA contrast, full keyboard traversal of all content (including the 3D path via waypoint overlays), screen-reader labels on every exhibit, `prefers-reduced-motion` honored everywhere, audio strictly opt-in.
4. **The 2D fallback is not a lesser experience.** It ships the same content the same day. If a feature can't exist in both, it waits.
5. **Real-content ship bar:** launch requires a real Jahna track streaming from real hosting and real placard copy on every visible cabinet. Self-test with placeholder assets does not qualify for sign-off.
6. **Human-review gate:** nothing publishes without JR sign-off, per Central Hub convention.

---

## Section 2 — Skill Set for Opus

**Frontend framework: React + Vite**, matching the existing site (`landing.jsx` et al.). No framework migration; the museum is a route/sub-app in the same brand household. Opus needs solid React composition and code-splitting (`React.lazy` for the 3D chunk).

**3D toolkit: plain Three.js**, not react-three-fiber. The 3D surface is one scene with a scripted dolly path — a single mounted component with an explicit boundary keeps the 2D fallback primary and avoids R3F version churn. Required competencies: `CatmullRomCurve3` camera paths and eased tweening between waypoints; GLTF/GLB loading with **Draco/meshopt** compression (`gltf-transform` CLI); **KTX2/Basis** texture pipeline; emissive materials + baked lighting (no realtime shadow budget); WebGL capability detection that routes to the 2D fallback without a flash of broken content.

**2D game craft:** one Canvas 2D game loop (fixed timestep, keyboard + touch input, pause on blur). The maze-chase mini-game is deliberately buildable with no game engine — no Phaser dependency for one game.

**Audio:** Web Audio API — gesture-unlocked `AudioContext`, gain-node fades, `visibilitychange` pause, volume persistence. Must know mobile autoplay policies cold: the threshold choice *is* the unlock gesture.

**Personalization tech:** localStorage with defensive wrappers (quota, privacy mode throwing on write), no server, no cookies, no analytics coupling. Graceful degradation to "traveler" greeting.

**Asset pipeline:** `sharp`/Squoosh for WebP/AVIF cabinet art, `gltf-transform` for GLB, font subsetting for Marcellus/Inter/JetBrains Mono (already served by the brand system — reuse, don't re-host).

**Test / verify strategy:**
- Playwright: threshold → rotunda → cabinet zoom → guest book, run in both renderer modes (WebGL flag on/off) and at 375px width.
- axe-core pass on every DOM state, including waypoint overlays and placards.
- Manifest schema validation (halls/cabinets/audio/greeting JSON) in CI — the manifests are the spine, so they get the strictest checks.
- Brand-token lint: build fails on any non-token hex.
- Manual gate: keyboard-only full traversal, VoiceOver/NVDA spot-check, one real Jahna track streamed from production hosting.

**Ship gates (all blocking):** WCAG-AA audit clean · keyboard-complete · mobile 2D experience content-equal · initial payload ≤ 2.5 MB / 3D chunk ≤ 8 MB · brand-lint clean · real-content bar met · JR sign-off.

**Working rhythm:** Opus is orchestrator and reviewer; Sonnet implements under these contracts; **the Obsidian vault carries session logs and shared state** (Notion retired), with D-NNN decisions in `pipeline/DECISIONS.md`. Any change to manifest schemas or the accessibility gates goes back through Opus.

**Audio production (added to skill set):** transcode Jahna's raw WAV to web delivery — `ffmpeg` to AAC (broad support) and/or Opus, loudness-normalized, with a clean loop point. Source WAV stays in the repo folder; only the compressed derivative ships.

---

## Section 3 — Planner-Critic Dialogue Log  `#reasoning-archive`

### Dialogue 1 — Entry experience

**Planner:** The threshold is the emotional thesis. Full-viewport Ink, museum doors center, Paper light leaking through the seam, Marcellus greeting rendered as if lit by that light. Returning users see their name. Doors swing open on click with a slow warm transition; camera passes through into the rotunda. Maybe ambient sound swells as the doors part.

**Critic:** You've built a splash screen, and splash screens are bounce machines. Every second before content costs visitors. The door animation is a motion-accessibility hazard and a mobile GPU tax. And "greeted by name" on a *first* visit means you asked for a name before offering anything — that's a form at a door, which is the opposite of warmth. Autoplaying swelling audio is blocked by every modern browser anyway.

**Planner:** The greeting isn't decoration here — the intro names it as the point: "welcome home after a journey away." Cutting the threshold cuts the thesis.

**Critic:** Then make it cheap and make it honest. DOM and CSS only, one interaction, and let the *choice* the visitor makes there do double duty.

**Synthesis (MVP):** Threshold ships as a single DOM/CSS screen — the one Paper-dominant moment in the site. First visit: "Welcome, traveler." Returning: "Welcome home, {name}." Two buttons: **Enter with sound / Enter quietly** — the warmth choice is also the browser-mandated audio unlock gesture, so a legal constraint becomes a hospitality gesture. Door transition is a CSS transform, suppressed under reduced-motion. Name capture happens *inside* (Dialogue 7). v2: subtle Ember particle drift, voice greeting when DD-015a lands.

### Dialogue 2 — Walking simulator vs. 2D navigation

**Planner:** The intro asks for first-person walking. Three.js, WASD + mouse-look, collision walls, obsidian PBR materials, Ember emissive veins. This is the centerpiece; don't water it down.

**Critic:** Free-walk first-person is the single largest scope and risk item in this project. Mobile has no WASD and touch-look is miserable. Free mouse-look causes motion sickness. Keyboard-only users can technically walk but screen-reader users get *nothing* — a 3D canvas is a black hole to assistive tech, which violates the family-first accessibility floor outright. Collision detection and navmesh work is weeks of effort that produces zero content. And load: PBR halls at launch will blow any sane payload budget.

**Planner:** So we abandon first-person? The intro is explicit about it.

**Critic:** No — interrogate what *function* first-person serves: presence, pacing, being *inside* the obsidian. None of that requires free movement. A museum visitor follows a route anyway.

**Synthesis (MVP):** **Guided dolly, not free walk.** Fixed camera path between waypoints; advance on click/Enter/arrow. Still first-person, still inside the obsidian, but: no collision system, no navmesh, controlled motion (sickness-safe), and — decisive — every waypoint pairs with a focusable DOM overlay, so keyboard and screen-reader users traverse the *same* museum. Mobile, no-WebGL, and reduced-motion get the 2D manifest-driven gallery with identical content, same day. Desktop free-look at waypoints is v2, opt-in. Free-walk is v2+ and only if visitors ask for it.

### Dialogue 3 — Arcade machine hall themes

**Planner:** Five halls off a central rotunda — Racing, Shooters, Fighting, Classics, Self-Selected — each with its own light temperature within the palette and 4–6 cabinets. The rotunda is the "king of the pressure of the earth" moment.

**Critic:** Five halls at launch is five times the art, placard copy, cabinet models, and QA — for a v1 nobody has visited yet. This is how museums (and indie games) die: breadth before excellence. Also the Self-Selected hall contains an on-rails experience, which is a *different genre of software* hiding inside a bullet point.

**Planner:** But one hall isn't a museum, it's a room.

**Critic:** A rotunda with five doorways *is* a museum — four of them just aren't open yet. Sealed doors with plaques create anticipation and give returning visitors a reason to return, which serves the warmth thesis better than five thin halls.

**Synthesis (MVP):** Rotunda + **Classics** hall open at launch (Pac-Man/DK/Mario-era tributes: broadest recognition, most family-first, cheapest art language). Four sealed doorways with hall plaques reading "In formation" — the landing page's own status vocabulary. **Racing** is v2's first opening (strongest visual identity: horizons and Ember light trails). Self-Selected is last, explicitly v3+.

### Dialogue 4 — Arcade machine interactivity

**Planner:** Zoom-to-play per the intro: approach a cabinet, zoom locks you behind the sticks, the game takes focus. Each Classics cabinet gets an original playable mini-game in period visual language.

**Critic:** "Each cabinet playable" means shipping N complete games — design, input, difficulty, mobile controls, QA — inside a museum project. Legal already rules out ROMs, so every game is an original build. A mediocre Pac-Man homage damages the brand more than a gorgeous non-playable cabinet honors it. Museums are full of exhibits you don't touch; nobody calls the Louvre unfinished.

**Planner:** But zero playable cabinets breaks the intro's promise and the zoom mechanic has no payoff.

**Synthesis (MVP):** The **zoom is universal, the play is singular.** Every cabinet zooms to close-up with a museum placard — era, influences, design notes (the legend). Non-playable cabinets run attract-mode art loops. Exactly **one** cabinet is playable at launch: an original maze-chase in Canvas 2D, original characters, keyboard + touch. Playable cabinets are added one per release, each polished before the next begins. "Coming soon" states on cabinets slated for playability.

### Dialogue 5 — Music playback + LOFI_SANCT hooks

**Planner:** Per-hall ambient from Jahna's catalog: rotunda theme, hall themes, Web Audio crossfades on transitions, volume slider, the whole soundscape.

**Critic:** Four problems. Autoplay: blocked without a gesture — your soundscape is silent until the visitor acts. Mobile: AudioContext needs unlock and backgrounding suspends it. Focus: audio bleeding from a background tab is hostile. Catalog readiness: Lofi Sanctuary's own tile says "Hosting soon" — are cleared, hosted track URLs real today? The real-content ship bar says no placeholder audio at sign-off, so the museum's launch date is coupled to LOFI_SANCT's hosting state.

**Planner:** The threshold choice from Dialogue 1 already solves the gesture problem — "Enter with sound" is the unlock.

**Critic:** Agreed, that's clean. Then cut scope to match catalog reality: one track, one loop, and let LOFI_SANCT own the manifest so the museum never blocks on it structurally.

**Synthesis (MVP):** Opt-in only via threshold. **One** Jahna track at launch, 2s gain-fade in, pause on `visibilitychange`, persistent volume control. `audio.json` (track id, title, hosted URL) is **owned by LOFI_SANCT** and consumed by the museum — the integration point is one file. Per-hall assignment + crossfade is v2, unlocked when the catalog manifest has ≥5 entries. Ship gate: one real track streaming from real hosting end-to-end. Flag to COS: confirm catalog hosting timeline *now*, since it sits on the museum's critical path.

> **Amended 2026-07-03:** the critic's catalog-readiness attack is resolved — JR delivered the v1 track directly: *"cat walking around the house"*, raw WAV from Jahna, now at `SOD MUSEUM/audio/jahna-cat-walking-around-the-house-RAW.wav`. Sourcing risk is closed; what remains is production (transcode, loop point, hosting). Lofi Sanctuary also now has a live URL (lfsjbeats.netlify.app) in the true landing.jsx.

### Dialogue 6 — 5th-tile landing-page integration

**Planner:** Per the brief: 4 tiles going to 5, so restructure to a 2×3 grid with an open slot, resize tiles, new entry aesthetic.

**Critic:** Stop — the brief's premise is wrong. I read the shipped code: `PROJECTS` has **three** entries (Jahna, Horizon Search, Lofi Sanctuary) in `repeat(3, 1fr)`, collapsing to one column under 920px. The museum is the **4th** coded tile. Restructuring a landing page around tiles that don't exist in code is planning against fiction. And any big grid rework risks the existing balance for zero function.

**Planner:** Then the real question is: what's the minimum delta that seats tile 4 *and* won't need rework when a 5th (Central Hub or Unite Passion surfacing as tiles) arrives?

**Synthesis (MVP):** Minimum delta, three changes: **(1)** one `PROJECTS` entry — `n: "04"`, kicker `Experience · Museum`, title `Shade of Direction`, blurb in house voice (e.g. "The doors are heavy. Come in anyway."), `status: "soon"` → live at launch, new `accent: "ink"`. **(2)** grid becomes `repeat(auto-fit, minmax(280px, 1fr))` capped at 3 columns — 4 tiles seat as 3+1 today, a future 5th seats without touching CSS again. **(3)** one `TileArt` motif for `ink`: Ink field, Ember marquee-glow lines — the cabinet seen from across a dark room. Escalate to JR: whether Central Hub / Unite Passion tiles are queued (that answer decides if 2×2 balance is worth pursuing instead) — flagged per the pattern-deviation rule.

> **Amended 2026-07-03 — both voices were arguing from the wrong file.** JR confirmed the true site is `quick-front-end/shade-of-design-landing/`; the folders I read were Claude Design workflow artifacts. The true `landing.jsx` already has 4 tiles — tile 04 is *Pit Stop & The Paint* (Unite Passion, accent `sport`) — and `.tiles` is already `repeat(auto-fill, minmax(260px, 1fr))`. So the synthesis collapses to its own minimum: museum is `n: "05"`, and change (2) is **deleted entirely** — the shipped grid absorbs a 5th tile as-is. The `sport` accent also sets precedent for adding the `ink` accent variant. The escalation is resolved.

### Dialogue 7 — Returning-user personalization

**Planner:** localStorage `sod_visitor_name`; threshold asks for a name on first visit so the *next* visit can say "welcome home."

**Critic:** A name field at the door is exactly the cold pattern the warmth thesis rejects — and it smells like data collection even when it's local-only. Privacy optics matter for a family-first site. Then the edge cases: incognito throws on write or silently forgets; cross-device visitors are "new" on every device; shared family computers greet the wrong person by name, which is *anti*-warmth; localStorage can be cleared by the browser at any time.

**Planner:** So make giving your name a museum act instead of a form. A guest book in the rotunda — a pedestal, Paper page, Marcellus script. Signing it is diegetic, optional, and discovered rather than demanded.

**Critic:** Better. Now degrade honestly: no name is not a failure state, it's the default state, and it needs language as warm as the named path.

**Synthesis (MVP):** **Guest-book pedestal in the rotunda**, never a gate. Unsigned visitors get "Welcome, traveler." — written to be warm, not generic-fallback. Signed visitors get "Welcome home, {name}." on subsequent visits. localStorage with defensive wrappers (privacy-mode write failures caught silently, treated as unsigned). Shared-computer fix: the greeting includes a quiet "Not {name}? Sign the book anew." Removal affordance: "scratch your name out." Nothing leaves the device — a one-line plaque near the book says exactly that, in JetBrains Mono, like a museum conservation note. Cross-device persistence is explicitly *not* pursued (would require accounts — wrong project). Voice hook (v2): greeting component reads `greeting.json.audioUrl`; text always renders, MP3 plays when DD-015a delivers, behind the sound opt-in.

---

## Section 4 — Handoff to COS

Mr. C — updated after JR's corrections of 2026-07-03. Two of the original four asks are already resolved; here is what actually remains.

**Resolved before you even received this:**
- ~~Tile-count discrepancy~~ — the true site is `quick-front-end/shade-of-design-landing/`; it has 4 tiles and an auto-fill grid. Museum is tile 05, zero CSS change. Point Opus at that path *only*; the `shade-of-design-site*` folders are Claude Design artifacts.
- ~~Catalog readiness~~ — JR hand-delivered the v1 track (*"cat walking around the house"*, raw WAV from Jahna, in `SOD MUSEUM/audio/`). Critical path item is now just transcode + host + `audio.json` entry.

**Still from you (COS) before Opus starts:**
1. **Route decision input:** museum as a route within the landing app vs. sub-app under `quick-front-end/`. Cheap either way now; expensive to switch later.
2. **Obsidian wiring, not Notion.** Notion is retired; the vault is source of truth. Set up the museum's session-log + decision surface in the vault, with D-NNN ids still landing in `pipeline/DECISIONS.md` repo-side.
3. **Voice placeholder logistics:** JR may record the greeting himself pre-DD-015a. The `greeting.json.audioUrl` hook takes his MP3 today and swaps to the locked candidate later with a one-field edit — just get the recording captured when he's ready.

**Decisions that remain JR's:** the museum's tile copy and blurb voice; which single mini-game ships first (I recommend the maze-chase); guest-book wording (his warmth, his words); hall-opening order after Classics (I recommend Racing).

**LIFT-to-DD candidacy:** the DD shape is crisp — *rotunda + Classics hall + universal zoom + one playable original + opt-in audio with "cat walking around the house" streaming end-to-end + guest book + tile 05 live.* Every element is verifiable against the real-content bar, and with the track in hand, nothing in it is placeholder-shaped or blocked on another project's timeline.

One note worth keeping: the family thread now runs through the whole build — Jahna's track in the halls, possibly JR's own voice at the door. That *is* the warmth thesis, delivered literally. Protect it in review.

The doors are heavy. Worth opening.

— Fable
