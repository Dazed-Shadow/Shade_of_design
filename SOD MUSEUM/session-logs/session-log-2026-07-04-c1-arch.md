---
session_date: 2026-07-04
session_type: opus-review
participants: [Opus@CH, Opus@COS]
dd_touched: [DD-032]
checkpoint: 1
ship_gate_cleared: null
next_session_signal: Sonnet dispatch after Chief signoff on C1 artifact + working-tree path resolution
tags: [sod-museum, dd-032, checkpoint-1, manifest-schema, rendering-split, route-wiring, opus-ch]
---

# Session Log — Checkpoint 1: Manifest schema + rendering split + route wiring

**Author:** Opus@CH
**Date:** 2026-07-04
**DD:** [DD-032 — SoD Museum rotunda plus Classics hall](../../../../References/Designs/DD-032%20SoD%20Museum%20—%20rotunda%20plus%20Classics%20hall.md)
**Kickoff origin:** [`C Roles/Strategies/kickoffs/DD-032-Opus-CH-arch-review.md`](../../../../C%20Roles/Strategies/kickoffs/DD-032-Opus-CH-arch-review.md)
**Companion decision (repo-side):** D-029 in [`pipeline/DECISIONS.md`](../../pipeline/DECISIONS.md)

---

## What this session decided

Five manifest schemas finalized. Rendering split confirmed. Route wiring specified. Sonnet unlocks named. No Fable §3 disagreements at this reading.

Sonnet is unblocked for landing tile 05 + threshold DOM + `/museum` route wiring + manifest scaffolding.

## Substrate consumed

- DD-032 spec (all sections, including `Consumed by → Voice arc extension` — dual-voice tour-guide framing)
- Fable Implementation Strategy §§1–4 (planner-critic dialogue §3 read in full)
- JR intro file — warmth thesis + family-first accessibility floor
- session-logs/README.md — schema for this artifact
- RM-002 §Weight per surface — five named registers (SoN, diary, DD signoff, SR-context, tag-in)
- RM-001 — voice arc long-shape; museum is Surface 1's first cross-medium consumer
- Central Hub CLAUDE.md — Opus/Sonnet rhythm, Notion retired, vault as shared memory
- Chief's Chain resolution 2026-07-04 (see kickoff §Chain) — cleared_status field + narration multi-voice shape

## Fable §3 planner-critic dialogue disagreements

**None at this reading.** Every synthesis in dialogues 1–7 earns its scope compression on the record:

- Dialogue 1 (threshold): the CSS-only door + audio-opt-in-as-hospitality-gesture is the correct pattern-compression.
- Dialogue 2 (guided dolly): decisive on accessibility grounds alone. Confirmed.
- Dialogue 3 (one hall + rotunda + sealed doors): the rotunda-with-five-doorways framing IS a museum. Confirmed.
- Dialogue 4 (zoom universal, play singular): the discipline of one-polished-game-per-release protects the brand more than N-mediocre-cabinets. Confirmed.
- Dialogue 5 (audio opt-in): threshold gesture as audio unlock is elegant; single-track ship gate is honest given catalog state.
- Dialogue 6 (tile 5, auto-fill grid, zero CSS change): the amended synthesis (grid absorbs tile 05 with no CSS delta) is what C1 encodes.
- Dialogue 7 (guest book, not gate): the diegetic pedestal + "scratch your name out" affordance is the correct warmth-vs-form resolution.

If a disagreement surfaces during C2 or C3 execution, I'll name it there.

---

## §1 — Manifest schemas

The five manifests are the spine of the museum. 3D scene, 2D fallback, placards, greetings, narration, and audio all read the same JSON. Adding a hall is data + assets, not new code paths (Fable §1.4, held).

All schemas carry `$schema_version` as a top-level field for forward compatibility. v1 is `"1.0.0"`. Schema changes bump semver per standard rules; Sonnet does not silently mutate schemas without an Opus review round.

### §1.1 `halls.json`

**Purpose:** Hall inventory. Drives both 3D scene hall placement and 2D fallback gallery groups.

**Location:** `<museum-root>/manifest/halls.json`

```json
{
  "$schema_version": "1.0.0",
  "halls": [
    {
      "id": "rotunda",
      "name": "Rotunda",
      "type": "hub",
      "doorway_state": null,
      "track_id": "cat-walking-around-the-house",
      "cabinet_ids": [],
      "waypoint_ids": ["rotunda-center", "rotunda-guest-book"],
      "placard_narration_id": null,
      "entry_narration_id": null
    },
    {
      "id": "classics",
      "name": "Classics",
      "type": "hall",
      "doorway_state": "open",
      "track_id": "cat-walking-around-the-house",
      "cabinet_ids": ["classics-mazechase", "classics-dk-tribute", "classics-mario-tribute"],
      "waypoint_ids": ["classics-entry", "classics-mid", "classics-back"],
      "placard_narration_id": null,
      "entry_narration_id": "classics-entry-tour-guide-open"
    },
    {
      "id": "racing",
      "name": "Racing",
      "type": "hall",
      "doorway_state": "sealed",
      "track_id": null,
      "cabinet_ids": [],
      "waypoint_ids": [],
      "placard_narration_id": null,
      "entry_narration_id": null,
      "sealed_plaque_text": "In formation."
    },
    {
      "id": "shooters",
      "name": "Shooters",
      "type": "hall",
      "doorway_state": "sealed",
      "track_id": null,
      "cabinet_ids": [],
      "waypoint_ids": [],
      "placard_narration_id": null,
      "entry_narration_id": null,
      "sealed_plaque_text": "In formation."
    },
    {
      "id": "fighting",
      "name": "Fighting",
      "type": "hall",
      "doorway_state": "sealed",
      "track_id": null,
      "cabinet_ids": [],
      "waypoint_ids": [],
      "placard_narration_id": null,
      "entry_narration_id": null,
      "sealed_plaque_text": "In formation."
    },
    {
      "id": "self-selected",
      "name": "Self-Selected",
      "type": "hall",
      "doorway_state": "sealed",
      "track_id": null,
      "cabinet_ids": [],
      "waypoint_ids": [],
      "placard_narration_id": null,
      "entry_narration_id": null,
      "sealed_plaque_text": "In formation."
    }
  ]
}
```

**Field notes:**
- `type`: `"hub"` (rotunda only, single entry) | `"hall"` (all others).
- `doorway_state`: `"open"` | `"sealed"` | `null` (rotunda is not itself a doorway). Sealed halls render the plaque text; open halls render as traversable.
- `track_id`: FK to `audio.json → tracks[].id`. Nullable so sealed halls carry no track binding.
- `sealed_plaque_text`: Only present on sealed halls. Uses the landing page's "In formation" status vocabulary per Fable Dialogue 3.
- `entry_narration_id`: FK to `narration.json → narrations{}` key. Optional — nullable per hall.

### §1.2 `cabinets.json`

**Purpose:** Cabinet inventory across all halls. Drives the zoom close-up + placard render + attract-mode-vs-playable branching.

**Location:** `<museum-root>/manifest/cabinets.json`

```json
{
  "$schema_version": "1.0.0",
  "cabinets": [
    {
      "id": "classics-mazechase",
      "hall_id": "classics",
      "title": "Maze Chase",
      "era": "1980s",
      "influences": ["Pac-Man", "Ms. Pac-Man"],
      "design_notes": "Original characters, tribute aesthetics. Canvas 2D. Keyboard + touch.",
      "art": {
        "attract_loop_url": null,
        "marquee_url": null,
        "cabinet_render_url": null,
        "placeholder_alt": "Maze-chase cabinet with ember marquee glow"
      },
      "placard_copy_md": "**Maze Chase** — a tribute to the maze-and-ghost format that defined an arcade generation. The route always closes; the only choice is whether you make it interesting.",
      "placard_narration_id": "classics-mazechase-placard",
      "playable": true,
      "game_module": "maze-chase",
      "waypoint_id": "classics-mazechase-position"
    },
    {
      "id": "classics-dk-tribute",
      "hall_id": "classics",
      "title": "Ape Climb",
      "era": "1980s",
      "influences": ["Donkey Kong"],
      "design_notes": "Attract loop only in v1. Playable slot reserved for v2+.",
      "art": {
        "attract_loop_url": null,
        "marquee_url": null,
        "cabinet_render_url": null,
        "placeholder_alt": "Ape-climb cabinet, attract mode"
      },
      "placard_copy_md": "**Ape Climb** — the game that taught the industry a barrel could be a story beat.",
      "placard_narration_id": "classics-dk-tribute-placard",
      "playable": false,
      "game_module": null,
      "waypoint_id": "classics-dk-position"
    },
    {
      "id": "classics-mario-tribute",
      "hall_id": "classics",
      "title": "Plumber's Rise",
      "era": "1980s",
      "influences": ["Mario Bros.", "Super Mario Bros."],
      "design_notes": "Attract loop only in v1.",
      "art": {
        "attract_loop_url": null,
        "marquee_url": null,
        "cabinet_render_url": null,
        "placeholder_alt": "Plumber's-rise cabinet, attract mode"
      },
      "placard_copy_md": "**Plumber's Rise** — a side-scroll grammar that outlived its own decade.",
      "placard_narration_id": "classics-mario-tribute-placard",
      "playable": false,
      "game_module": null,
      "waypoint_id": "classics-mario-position"
    }
  ]
}
```

**Field notes:**
- `hall_id`: FK to `halls.json → halls[].id`.
- `art.*_url`: All nullable at v1 manifest scaffold; populated during C2 asset pipeline pass. `placeholder_alt` is required and provides screen-reader text before real art lands.
- `placard_copy_md`: Markdown. Always required — it's the ship-bar accessibility floor. Screen-reader users get this text regardless of any audio narration.
- `placard_narration_id`: FK to `narration.json → narrations{}` key. Nullable — a cabinet without narration is valid; the placard text still renders.
- `playable: true` requires `game_module` be non-null. `playable: false` requires `game_module` be null. Sonnet schema-validates this pairing.
- `waypoint_id`: The 3D waypoint the dolly camera stops at for this cabinet. The 2D fallback ignores waypoints; it renders cabinets as gallery cards.
- **v1 constraint (per Fable Dialogue 4):** exactly one cabinet across the entire manifest may have `playable: true`. Rest are attract-mode. Schema does not enforce this — Sonnet enforces via ship-gate lint.

### §1.3 `greeting.json`

**Purpose:** Threshold greeting text + optional voice narration per voice_id. First entry point for the visitor after tile-05 click.

**Location:** `<museum-root>/manifest/greeting.json`

Per Chief's Chain resolution 2026-07-04: multi-voice keys; per-voice `audioUrl` nullable; `text` always required.

```json
{
  "$schema_version": "1.0.0",
  "greeting_variants": {
    "first_visit": {
      "text": "Welcome, traveler.",
      "voices": {
        "jr": { "audioUrl": null },
        "mr-c": { "audioUrl": null }
      }
    },
    "returning": {
      "text": "Welcome home, {name}.",
      "voices": {
        "jr": { "audioUrl": null },
        "mr-c": { "audioUrl": null }
      }
    }
  }
}
```

**Field notes:**
- `{name}` template variable substituted at runtime from `localStorage.sod_visitor_name` (guest-book localStorage key — set at C3, spec'd here for downstream reference). If the name is present but the token is missing (e.g. writing quota fails), fall back to first_visit text.
- `voices` is an object keyed by `voice_id`. v1 populates `"jr"` and `"mr-c"` slots with `audioUrl: null`. When DD-015a locks Mr. C's voice, a data-only edit populates `voices["mr-c"].audioUrl`. When JR records placeholder greeting, `voices["jr"].audioUrl` populates.
- Text renders in both variants regardless of `audioUrl` state. Museum ships silent-narrated as fully valid v1 state.
- No `register:` field per Chief's resolution — character metadata joins later (v-arc registry, when the surface earns it).

### §1.4 `audio.json` (owned by LOFI_SANCT; museum consumes)

**Purpose:** Track catalog. Owned by LOFI_SANCT per Fable §1.5 + Central Hub project namespace discipline. Museum consumes.

**Location:** `<museum-root>/manifest/audio.json` (mirror; upstream owner is LOFI_SANCT's project — see §4 §Cross-project ownership).

Per Chief's Chain resolution 2026-07-04: includes `cleared_status` field for v2+ catalog governance.

```json
{
  "$schema_version": "1.0.0",
  "owner": "LOFI_SANCT",
  "consumers": ["sod-museum"],
  "tracks": [
    {
      "id": "cat-walking-around-the-house",
      "title": "cat walking around the house",
      "artist": "Jahna",
      "cleared_status": "owner-delivered",
      "raw_source_path": "SOD MUSEUM/audio/jahna-cat-walking-around-the-house-RAW.wav",
      "hosted_url_aac": null,
      "hosted_url_opus": null,
      "duration_seconds": null,
      "loop_point_seconds": null,
      "assigned_to_hall_ids": ["classics"],
      "assigned_to_rotunda": true
    }
  ]
}
```

**Field notes:**
- `cleared_status`: `"owner-delivered"` (Jahna's own composition, JR-delivered direct — no clearance needed) | `"cleared"` (LOFI_SANCT catalog track with clearance metadata attached) | `"pending"` (in-flight clearance). The museum consumer refuses to bind a track whose `cleared_status` is `"pending"`.
- `raw_source_path`: The delivered raw WAV. Preserved for reference; not shipped to the browser.
- `hosted_url_aac` and `hosted_url_opus`: Populated at C3. Player picks based on `AudioContext` capability sniff. v2+ can add `hosted_url_webm` etc.
- `duration_seconds` + `loop_point_seconds`: Populated at C3 after transcode. `loop_point_seconds` marks a bar boundary for gapless loop.
- `assigned_to_hall_ids`: Which halls play this track. v1: `["classics"]`.
- `assigned_to_rotunda`: Boolean. v1: `true` (same track plays in the rotunda). v2+ can add a `rotunda_track_id` at the top level for a distinct rotunda theme.
- **Anonymity rule (Fable §1.5):** `artist` surfaces as `"Jahna"` only; no family details anywhere. Sonnet ship-gate lint should grep for common family identifiers if any surface (spec deferred to C3).

### §1.5 `narration.json`

**Purpose:** Per-surface narration text + optional per-voice audio. Consumed by the greeting renderer, hall entry announcements, cabinet placards (when audio narration is desired), and rotunda transitions.

**Location:** `<museum-root>/manifest/narration.json`

Per Chief's Chain resolution 2026-07-04: same multi-voice shape as `greeting.json`.

```json
{
  "$schema_version": "1.0.0",
  "narrations": {
    "classics-entry-tour-guide-open": {
      "text": "Welcome to Classics. The oldest games are the ones that taught the industry to imagine.",
      "surface": "hall-entry",
      "hall_id": "classics",
      "cabinet_id": null,
      "waypoint_id": "classics-entry",
      "voices": {
        "jr": { "audioUrl": null },
        "mr-c": { "audioUrl": null }
      }
    },
    "classics-mazechase-placard": {
      "text": "Maze Chase — a tribute to the maze-and-ghost format that defined an arcade generation. The route always closes; the only choice is whether you make it interesting.",
      "surface": "cabinet-placard",
      "hall_id": "classics",
      "cabinet_id": "classics-mazechase",
      "waypoint_id": "classics-mazechase-position",
      "voices": {
        "jr": { "audioUrl": null },
        "mr-c": { "audioUrl": null }
      }
    },
    "classics-dk-tribute-placard": {
      "text": "Ape Climb — the game that taught the industry a barrel could be a story beat.",
      "surface": "cabinet-placard",
      "hall_id": "classics",
      "cabinet_id": "classics-dk-tribute",
      "waypoint_id": "classics-dk-position",
      "voices": {
        "jr": { "audioUrl": null },
        "mr-c": { "audioUrl": null }
      }
    },
    "classics-mario-tribute-placard": {
      "text": "Plumber's Rise — a side-scroll grammar that outlived its own decade.",
      "surface": "cabinet-placard",
      "hall_id": "classics",
      "cabinet_id": "classics-mario-tribute",
      "waypoint_id": "classics-mario-position",
      "voices": {
        "jr": { "audioUrl": null },
        "mr-c": { "audioUrl": null }
      }
    },
    "rotunda-guest-book-approach": {
      "text": "A pedestal, a page. Sign the book if you like. Or don't. The museum stays.",
      "surface": "rotunda-transition",
      "hall_id": "rotunda",
      "cabinet_id": null,
      "waypoint_id": "rotunda-guest-book",
      "voices": {
        "jr": { "audioUrl": null },
        "mr-c": { "audioUrl": null }
      }
    }
  }
}
```

**Field notes:**
- `narrations` is a keyed dict (not an array). Lookup by narration_id is O(1). Referenced from `halls.json`, `cabinets.json`, and future surfaces by key.
- `surface`: Semantic type. Enum: `"hall-entry"` | `"hall-exit"` | `"cabinet-placard"` | `"rotunda-transition"`. Extensible in future versions.
- `hall_id`, `cabinet_id`, `waypoint_id`: Cross-refs. Each nullable independently — a rotunda-transition narration binds to `hall_id: "rotunda"` but has `cabinet_id: null`.
- **Placard text is authoritative in `cabinets.json` (`placard_copy_md`); `narration.json` carries the *narrated* version of that placard when audio narration is desired.** Sonnet reads placard_copy_md as the visible text; narration.json is layered on top when an audioUrl is populated for the current voice_id. The two texts SHOULD match at v1 (Sonnet spec'd lint check); a future v2+ pattern could split them (narration prose flexibility vs. placard density).
- No `register:` field per Chief's resolution.

### §1.6 Schema-level constraints Sonnet must enforce

Cross-manifest referential integrity is Sonnet's ship-gate lint responsibility:

1. Every `halls[].cabinet_ids[]` entry must resolve to a `cabinets[].id`.
2. Every `cabinets[].hall_id` must resolve to a `halls[].id`.
3. Every `halls[].track_id` (when non-null) must resolve to a `tracks[].id` with `cleared_status ∈ {"owner-delivered", "cleared"}`.
4. Every `*_narration_id` (when non-null) must resolve to a `narrations{}` key.
5. Exactly one cabinet across `cabinets[]` has `playable: true` at v1.
6. Every non-sealed hall has a non-empty `waypoint_ids[]`.
7. Every `narrations{}` entry has non-empty `text` regardless of any `audioUrl` state.

Ship-bar (C3) adds:
- Every visible placard has real (non-lorem) `placard_copy_md`.
- Track `hosted_url_aac` or `hosted_url_opus` (at least one) is non-null and reachable.

---

## §2 — Rendering split confirmation

Confirmed as specified in Fable §1.4.

**Split point:** DOM/CSS threshold ships in the initial bundle. Three.js scene ships as a `React.lazy`-loaded chunk requested only after the visitor's threshold action (Enter with sound / Enter quietly).

**Capability check fires BEFORE the chunk request:** WebGL availability (`WebGLRenderingContext`), `prefers-reduced-motion`, and mobile viewport. If any fails, route to 2D fallback and never request the 3D chunk.

**Payload budgets (both blocking ship gates per DD-032 §When done):**

| Bundle | Ceiling | Contents |
|---|---|---|
| **Initial payload** | **≤ 2.5 MB** | React runtime + landing app + tile 05 art + threshold DOM/CSS + all 5 manifests + capability check + 2D fallback renderer |
| **3D chunk (lazy)** | **≤ 8 MB** | Three.js runtime + Draco decoder + KTX2 loader + rotunda GLB + Classics GLB + KTX2 textures |

**Manifest scaffolding sits inside the initial payload** because both the 3D renderer AND the 2D fallback read from it. Manifests are small text — total budget impact ~50 KB uncompressed for the five files.

**GLB pipeline (spec'd at C1, executed at C2):**
- `gltf-transform` CLI for Draco/meshopt compression
- KTX2/Basis for textures
- Emissive materials + baked lighting (no realtime shadow budget)
- Two GLB files at v1: `rotunda.glb`, `classics-hall.glb`

**Manifest fetching:** Manifests are static JSON, served from the museum's public dir. No CDN split — they're colocated with the app. All five load in the initial bundle so the 2D fallback path has complete data without additional round-trips.

---

## §3 — Route wiring

Per JR sign-off 2026-07-04 (DD-032 Handoff decisions §1): museum ships as a route within the landing app.

**Public entrypoint:** `/museum` — the threshold DOM/CSS screen.

**Internal routing (post-threshold, museum sub-router):**
```
/museum                        → Threshold (Welcome / choice buttons)
/museum/rotunda                → Rotunda hub (5 doorways, guest book pedestal)
/museum/classics               → Classics hall entry
/museum/classics/:cabinet-id   → Cabinet zoom close-up (placard + attract or playable)
```

**Implementation notes for Sonnet:**
- The landing app's current router (likely React Router in `landing.jsx` — Sonnet confirms on first-touch) receives a new `/museum/*` route.
- Museum's sub-router is a nested component; the landing app does not need to know internal museum routes.
- Landing tile 05 links to `/museum` (threshold entry).
- Threshold action buttons transition to `/museum/rotunda` via `history.push` or equivalent — no full page reload.
- Deep links (e.g. someone shares `/museum/classics/classics-mazechase`) should render correctly on cold load: threshold is shown-then-auto-passed if the visitor has already opted into sound (localStorage key `sod_audio_optin: "sound" | "quiet"`), else threshold requires action first. Sonnet confirms behavior at C2.

**Landing tile 05 spec (per Fable §1.2 item 8, amended §Dialogue 6):**
- Add one `PROJECTS` entry to `landing.jsx`:
  ```
  {
    n: "05",
    kicker: "Experience · Museum",
    title: "Shade of Direction",
    blurb: <<held for JR — Fable proposed "The doors are heavy. Come in anyway.">>,
    status: "soon",   // flip to "live" at ship
    accent: "ink",    // new variant, precedent: `sport` for tile 04
    href: "/museum"
  }
  ```
- Add one `TileArt` motif for `ink`: Ink field, Ember marquee-glow lines. Fable calls this "the cabinet seen from across a dark room."
- Add `.tile-ink` accent class to landing CSS — patterns after `.tile-sport`.
- Grid CSS: **no change.** `.tiles` is already `repeat(auto-fill, minmax(260px, 1fr))` per Fable's amended read.
- Tile blurb copy is held for JR per DD-032 §Decisions that remain JR's item 1.

---

## §4 — Cross-project ownership + working-tree flag

### `audio.json` ownership boundary

Per Fable §1.5 and Chief's Chain resolution 2026-07-04:

- **Owner:** LOFI_SANCT.
- **Consumer:** SoD Museum (this DD-032 surface).
- **v1 posture:** Museum-side Sonnet scaffolds `<museum-root>/manifest/audio.json` with the schema in §1.4 and the single Jahna track entry. The `raw_source_path` points into `SOD MUSEUM/audio/` (in-vault at `Terminal/Central Hub/SOD MUSEUM/audio/`, per DD-032 §Handoff decisions resolved item). No upstream LOFI_SANCT-side write needed at v1 — this is JR-delivered content, `cleared_status: "owner-delivered"`.
- **v2+ posture:** When LOFI_SANCT catalog opens per-hall assignment, `audio.json` becomes an upstream artifact LOFI_SANCT owns and the museum consumes as a copy or fetch. Coordination surface for that transition is Opus@LFS ↔ Opus@CH; not in DD-032 scope.

### Working-tree path — non-blocking flag surfaced to Chief

The vault mirror at `Terminal/Central Hub/quick-front-end/` carries `BACKLOG.md` only. Fable §Ground truth names `quick-front-end/shade-of-design-landing/` as the true site. This subfolder does not appear in the vault mirror.

**C1 posture:** All specs above are precedent-anchored to Fable's substrate description of tile format + grid CSS + `PROJECTS` array. Sonnet must confirm working-tree path with Mr. C at COS before first implementation touch. If the true site lives only in the real-repo working tree (post-migration OneDrive location), Sonnet writes there directly per Central Hub convention. Structural specs above hold regardless of path.

Flagged in kickoff §Chain 2026-07-04 Opus@CH entry. Awaiting Chief resolution.

---

## §5 — Sonnet unlocks (C1 gate)

Sonnet is unblocked for the following work under Opus@CH review:

1. **Landing tile 05 delta** — one `PROJECTS` entry, one `TileArt` motif for `ink`, one `.tile-ink` accent class. Zero grid CSS change. Held on blurb copy per JR gate.
2. **Threshold DOM + CSS** — Paper-dominant screen, Marcellus greeting, two buttons (Enter with sound / Enter quietly), CSS door transform, `prefers-reduced-motion` suppression path. Reads `greeting.json` for text; reads `localStorage.sod_visitor_name` for the returning-visitor branch (guest-book localStorage key established at C3 — Sonnet uses defensive reads at C1).
3. **`/museum` route wiring** — nested route in landing app router, museum sub-router shell.
4. **Manifest scaffolding** — create the five JSON files at `<museum-root>/manifest/` with the schemas + v1 content in §1.
5. **Capability check module** — WebGL + reduced-motion + viewport check for the 2D-fallback fork. Runs on threshold action.
6. **Cross-manifest ship-gate lint** — schema-level constraints in §1.6, run in CI.
7. **Brand-token lint scaffold** — build-time check that no non-token hex appears in museum CSS/JS. Sonnet may use whatever grep/AST approach is convention-adjacent to existing Central Hub lint patterns.

**Not unlocked at C1** (require C2 or C3 sign-off):
- Three.js scene, dolly path, waypoints, GLB assets
- 2D fallback renderer implementation (spec exists; execution waits for C2)
- Cabinets (zoom, placards render, playable mini-game)
- Audio pipeline (Web Audio manager, `visibilitychange` pause, volume persistence)
- Guest book pedestal
- Real placard copy per cabinet (JR content pass)

---

## §6 — Ship gate status at C1

| Gate | Status | Notes |
|---|---|---|
| WCAG-AA contrast audit clean | Not applicable at C1 | Enters at C2 (waypoint overlays) + C3 (final audit) |
| Keyboard-complete traversal | Not applicable at C1 | Enters at C2 |
| Mobile 2D content-equal | Not applicable at C1 | Enters at C2 (2D fallback impl) |
| Initial payload ≤ 2.5 MB | Spec locked | Sonnet monitors during tile 05 + threshold ship |
| 3D chunk ≤ 8 MB | Spec locked | Enters at C2 (GLB pipeline) |
| Brand-token lint clean | Scaffold at C1 | Enforcement at C2/C3 |
| Real-content ship bar | Not applicable at C1 | C3 gate |
| JR sign-off | Not applicable at C1 | C3 terminal gate |

No ship gate clears at C1. Two are spec-locked (payload budgets). One has scaffolding (brand-token lint). Five wait for later checkpoints.

---

## §7 — What triggers the next session log

**Next session log:** Sonnet impl session summary — first-touch results on tile 05 + threshold + route wiring + manifest scaffolding. Filename convention: `session-log-YYYY-MM-DD-sonnet-c1-impl.md`.

**Signal to fire:** Sonnet completes items 1–5 in §5 and stops for Opus@CH review before moving toward C2 unlocks. Ship-gate lint (item 6) is a working-tree convention that can land alongside without a review gate.

**Contingency signal:** working-tree path question (§4 flag) resolves in Chief's Chain — that resolution may need to land before Sonnet's first-touch depending on which reading is correct.

---

## Cross-references

- **DD-032:** [`References/Designs/DD-032 SoD Museum — rotunda plus Classics hall.md`](../../../../References/Designs/DD-032%20SoD%20Museum%20—%20rotunda%20plus%20Classics%20hall.md)
- **Kickoff + Chain history:** [`C Roles/Strategies/kickoffs/DD-032-Opus-CH-arch-review.md`](../../../../C%20Roles/Strategies/kickoffs/DD-032-Opus-CH-arch-review.md)
- **Fable implementation strategy:** [`Terminal/Central Hub/SOD MUSEUM/Shade of Direction - Museum - Fable Implementation Strategy.md`](../Shade%20of%20Direction%20-%20Museum%20-%20Fable%20Implementation%20Strategy.md)
- **Companion decision D-029:** [`pipeline/DECISIONS.md`](../../pipeline/DECISIONS.md)
- **RM-002 Voice Character Brief:** [`References/Roadmaps/voice-character-brief.md`](../../../../References/Roadmaps/voice-character-brief.md)
- **RM-001 Voice Arc:** [`References/Roadmaps/voice-arc.md`](../../../../References/Roadmaps/voice-arc.md)
- **Central Hub agent guide:** [`Terminal/Central Hub/CLAUDE.md`](../../CLAUDE.md)

---

*Signed off — Opus@CH, 2026-07-04*
*Checkpoint 1 gate: cleared. Sonnet unlocked per §5.*
