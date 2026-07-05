---
session_date: 2026-07-04
session_type: sonnet-impl
participants: [Opus@CH, C-Build]
dd_touched: [DD-032]
ship_gate_cleared: null
next_session_signal: Opus@CH reviews this log, confirms/amends the five pattern-deviations below, then unlocks C2 (3D scene + 2D fallback + accessibility path)
tags: [sod-museum, dd-032, checkpoint-1, sonnet-impl, c-build, pattern-deviation]
---

# Session Log — Sonnet C1 implementation

**Author:** C-Build
**Date:** 2026-07-04
**DD:** [DD-032 — SoD Museum rotunda plus Classics hall](../../../../References/Designs/DD-032%20SoD%20Museum%20—%20rotunda%20plus%20Classics%20hall.md)
**Kickoff:** [`C Roles/Strategies/kickoffs/DD-032-C-Build-c1-impl.md`](../../../../C%20Roles/Strategies/kickoffs/DD-032-C-Build-c1-impl.md)
**Opus@CH C1 artifact:** [`session-log-2026-07-04-c1-arch.md`](session-log-2026-07-04-c1-arch.md)

---

## What shipped

Items 1–7 from the kickoff's §Work items, all executed. Working tree: `Terminal/Central Hub/quick-front-end/shade-of-design-landing/` (confirmed correct per CLAUDE.md and the JR-corrected Chain entry — the "vault IS the working tree" resolution).

| Item | Status |
|---|---|
| 1. Landing tile 05 delta | Shipped — `landing.jsx` PROJECTS array + `TileArt` `ink` branch |
| 2. Threshold DOM + CSS | Shipped — `museum/museum.jsx` `Threshold` component + `museum/museum.css` |
| 3. `/museum` route wiring | Shipped as hash sub-router (see Pattern-deviation 2) |
| 4. Manifest scaffolding | Shipped — five JSON files, schemas copied verbatim from Opus@CH §1 |
| 5. Capability check module | Shipped — `checkCapabilities()` in `museum.jsx` |
| 6. Cross-manifest ship-gate lint | Shipped — `museum/lint/lint-manifests.js`, 7 constraints + 1 extra, verified clean |
| 7. Brand-token lint scaffold | Shipped — `museum/lint/lint-brand-tokens.js`, verified clean (caught and fixed one real violation of my own — see below) |

**Files created:**
- `quick-front-end/shade-of-design-landing/museum/index.html`
- `quick-front-end/shade-of-design-landing/museum/museum.css`
- `quick-front-end/shade-of-design-landing/museum/museum.jsx`
- `quick-front-end/shade-of-design-landing/museum/manifest/{halls,cabinets,greeting,audio,narration}.json`
- `quick-front-end/shade-of-design-landing/museum/lint/lint-manifests.js`
- `quick-front-end/shade-of-design-landing/museum/lint/lint-brand-tokens.js`
- `.claude/launch.json` (vault root) — static-server preview config for local testing, not shipping code

**Files modified:**
- `quick-front-end/shade-of-design-landing/landing.jsx` — tile 05 entry + `TileArt` `ink` motif

**Not touched:** `pipeline/AGENTS.md`, `pipeline/DECISIONS.md`, `OBSIDIAN_SETUP.md`, `quick-front-end/BACKLOG.md`, `shade-of-design-site/`, `shade-of-design-site-normalized/`. No git operations performed.

---

## Pattern-deviations flagged for Opus@CH review

Per the kickoff's own discipline ("name the precedent and flag... do not silently override"), five real mismatches surfaced between Opus@CH's C1 artifact and the actual repo state. I proceeded on defensible, precedent-anchored calls rather than stalling, but none of these should be read as quietly decided — they need your confirm/amend before C2.

**1. No bundler, no npm, no React Router exists anywhere in this repo.**
The real site (`index.html`) loads React 18 + ReactDOM via UMD `<script>` CDN tags, with `@babel/standalone` doing in-browser JSX transpilation of `.jsx` files loaded as `type="text/babel"` scripts. There is no `package.json`, no Vite, no ES module graph. This contradicts Fable §2 ("Frontend framework: React + Vite") and your §3 assumption ("the landing app's current router — likely React Router — receives a new `/museum/*` route"). Neither exists. Confirmed by reading `index.html`, `landing.jsx`, `tweaks-panel.jsx` directly — this is the actual, current shipping mechanism, not a stale mirror artifact.

**2. `/museum` ships as a separate static entry page, not a nested client route.**
Given finding 1, I implemented the museum as its own page — `museum/index.html` — the same pattern already used for `weekly.html` and for tile 04's own href (`unite-passion/nascar-basketball.html`, a relative static-file link, not a client route). Tile 05's `href` is `museum/index.html`, following that exact existing precedent. Internal navigation (`/museum/rotunda`, `/museum/classics`, `/museum/classics/:cabinet-id`) is implemented as an **in-page hash sub-router** (`#/rotunda`, `#/classics`, `#/classics/classics-mazechase`) rather than History-API path segments, because no server rewrite config (`_redirects`, `netlify.toml`, `wrangler.toml`) exists anywhere in this repo to confirm a hard refresh on a path-based deep link would resolve correctly on whatever host JR uses. Hash routes always resolve to the same physical file regardless of hosting, so this is the safe default until hosting config is known. **Ask:** confirm hosting provider + rewrite rules so C2 can decide whether to convert to path-based routing.

**3. Museum-scoped CSS variables, not the landing site's `--ink`/`--ocean`/`--slate`/`--ember`.**
`styles.css` already defines `--ink`, `--ocean`, `--slate`, `--ember` as **theme-adaptive text-color tokens** that flip value between light/dark themes (e.g. `--ink` is `#F3F4F6` in dark theme, `#0B1726` in light theme). DD-032's "Ink #0B1726" is a **fixed brand-palette color** (obsidian wall mass) that must never flip with theme. Reusing the site's variable names would silently break the museum's palette under a theme toggle. I defined new, museum-scoped variables (`--museum-ink`, `--museum-ember`, `--museum-ember-soft`, `--museum-slate`, `--museum-ocean`, `--museum-paper`) with the exact fixed hex values from Fable §1.6. Same colors, different variable names, to avoid the collision. Brand-token lint (item 7) validates against the fixed hex set directly, independent of variable naming.

**4. No `.tile-sport` CSS precedent exists to "pattern after."**
The kickoff's Item 1 spec says add a `.tile-ink` accent class "patterns after `.tile-sport`" — but no accent-specific CSS rule exists for `sport`, `ocean`, `slate`, or `ember` in `landing.css`. All per-accent visual distinction lives entirely inside the `TileArt()` component (different SVG per accent), not in CSS. I added the `ink` branch to `TileArt()` only; the `tile-ink` class is applied to the DOM node (consistent with how every other accent's class is applied — present, but currently unused by CSS) with no new CSS rule, matching actual precedent rather than the kickoff's stated-but-nonexistent one.

**5. No CI pipeline exists in this repo.**
No `.github/workflows`, no CI config of any kind, and no git repository at all was found at the vault root (`git rev-parse --is-inside-work-tree` fails). Items 6 and 7 ask for "CI-enforced checks." I built both lint scripts as zero-dependency Node.js scripts (no `npm install` needed, matching this repo's total absence of JS tooling) that exit non-zero on violation and are ready to wire into CI whenever one exists — but nothing currently invokes them automatically. **Ask:** if/when JR sets up a git repo + CI for this site, wire `node museum/lint/lint-manifests.js` and `node museum/lint/lint-brand-tokens.js` in on any commit touching `museum/manifest/*` or `museum/**/*.{css,jsx}`.

**Bonus, non-blocking:** Fable §2 claims Marcellus/Inter are "already served by the brand system — reuse, don't re-host." They are not — `index.html` loads only Space Grotesk + JetBrains Mono. Since Item 2 requires "Marcellus greeting text," I added a Google Fonts link for Marcellus in `museum/index.html` only (not the main landing page, which keeps the main initial-payload budget untouched). Inter is not yet used anywhere in the museum; not added since nothing currently calls for it.

---

## Verification performed

Ran the local static-file preview (`.claude/launch.json`, Python `http.server` on port 8177 serving the site root) and drove it through Claude Preview:

- Landing page: tile count now "05," tile 05 renders inert (`status: soon` → no href wired, `<div>` not `<a>`, matches existing `tile-soon` behavior), blurb shows literal `<<HELD FOR JR>>` — confirmed no invented copy.
- Threshold, first visit: renders "Welcome, traveler." + both buttons.
- Threshold, returning visitor: with `localStorage.sod_visitor_name = "Jon"`, renders "Welcome home, Jon." — `{name}` substitution confirmed.
- "Enter with sound" click → `sod_audio_optin` written, hash navigates to `#/rotunda`, capability check runs, desktop/WebGL-capable browser routes to the "3D scene" stub.
- Deep-link cold load: reloading with `sod_audio_optin` already set skips the threshold entirely and re-runs the capability check — confirmed per your §3 deep-link spec.
- Mobile viewport (375px): capability check correctly forces the "2D fallback" stub instead of the 3D stub.
- `#/classics/classics-mazechase` deep link renders the correct per-cabinet stub label.
- `node museum/lint/lint-manifests.js` → clean, 0 violations (6 halls, 3 cabinets, 5 narrations).
- `node museum/lint/lint-brand-tokens.js` → initially caught 1 real violation (I'd used an off-palette `#14202F` for door-panel depth shading); fixed by switching to an rgba overlay on the token color instead of a new hex. Re-ran clean.
- Console: no errors. Network: no failed requests.

---

## What's deferred (per kickoff §Not unlocked at C1)

Three.js scene, dolly path, waypoints, GLB assets; real 2D fallback renderer; cabinet zoom/placards/playable game; audio pipeline; guest book; real placard copy. All correctly stubbed with "ships at Checkpoint 2" messaging, not silently faked.

---

## Ship gates status (unchanged from your §6 table)

No gate clears at C1. Payload budget not measured this session (museum bundle is currently trivial — two small JS files, no 3D/audio assets yet); will report against the 2.5 MB ceiling once C2 starts adding real weight.

---

## What triggers the next session log

Per your §7: this log is the trigger. Standing by for your review of the five pattern-deviations above before touching C2 work (3D scene + 2D fallback + accessibility path).

— C-Build, 2026-07-04
