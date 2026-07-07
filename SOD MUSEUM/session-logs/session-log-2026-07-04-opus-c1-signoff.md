---
session_date: 2026-07-04
session_type: opus-review
participants: [Opus@CH, C-Build]
dd_touched: [DD-032]
checkpoint: 1
ship_gate_cleared: null
next_session_signal: Opus@CH drafts C2 kickoff to C-Build; C2 kickoff awaits Mr. C's Chain response on the Checkpoint 1 close + any pre-decisions for C2 (3D scene + 2D fallback + accessibility path)
tags: [sod-museum, dd-032, checkpoint-1, opus-signoff, pattern-deviation-review, opus-ch]
---

# Session Log — Opus@CH Checkpoint 1 sign-off review

**Author:** Opus@CH
**Date:** 2026-07-04
**DD:** [DD-032 — SoD Museum rotunda plus Classics hall](../../../../References/Designs/DD-032%20SoD%20Museum%20—%20rotunda%20plus%20Classics%20hall.md)
**Reviews:** [`session-log-2026-07-04-sonnet-c1-impl.md`](session-log-2026-07-04-sonnet-c1-impl.md) (C-Build's impl log)
**Companion decision (repo-side):** D-030 in [`pipeline/DECISIONS.md`](../../pipeline/DECISIONS.md)

---

## Verdict

**Checkpoint 1 cleared. Sign-off granted.** All five pattern-deviations confirmed — three faithful to reality against Fable-strategy claims, two arch-correct upgrades over my own C1 spec. Manifests are byte-for-byte match to §1. Structural code holds §2 rendering split and §3 route wiring at spec intent. Real-content ship bar respected (no invented tile copy, no fake placards, correct C1/C2/C3 line).

Sonnet is unlocked for C2 pending my kickoff drafting + Mr. C's Chain response absorbing this close.

---

## Fidelity map — spec vs. ship

| C1 spec item | Sonnet result | Verdict |
|---|---|---|
| §1.1 `halls.json` schema | 1:1 match — 6 halls, hub + open + 4 sealed, all fields | ✅ |
| §1.2 `cabinets.json` schema | 1:1 match — 3 cabinets, one playable, playable/game_module pairing correct | ✅ |
| §1.3 `greeting.json` schema | 1:1 match — multi-voice keys, `{name}` template preserved | ✅ |
| §1.4 `audio.json` schema | 1:1 match — `cleared_status: owner-delivered` on the Jahna track | ✅ |
| §1.5 `narration.json` schema | 1:1 match — 5 narrations, keyed dict lookup, all `voices` slots present | ✅ |
| §1.6 seven ship-gate lint rules | All 7 encoded + 1 bonus playable/game_module pairing check | ✅ Exceeds spec |
| §2 rendering split (DOM/CSS threshold + capability check pre-3D-chunk) | Threshold in initial payload; capability check fires before any 3D branch (stub at C1) | ✅ |
| §2 payload budgets (≤ 2.5 MB / ≤ 8 MB) | Not measured this session (payload trivial at C1); C3 risk flagged below | ✅ Spec preserved; C3 risk noted |
| §3 route wiring (`/museum` public entry + sub-router for internal routes) | Static entry page + hash sub-router — precedent-anchored deviation (see PD1/PD2 below) | ✅ Faithful to real repo, not to Fable §2 |
| §5 Sonnet unlocks 1–7 | All 7 shipped; work verified via preview_snapshot + lint runs | ✅ |
| Not-yet-unlocked discipline (C2/C3 items untouched) | Held — Three.js, 2D renderer impl, cabinets, audio, guest book, real placard copy all deferred | ✅ Line held |

---

## Pattern-deviation adjudication

C-Build flagged five deviations from my C1 artifact + Fable strategy substrate. Each named with precedent, none silently overridden. My rulings:

### PD1 — No bundler / no npm / no React Router (CDN UMD + Babel standalone)

**Ruling: CONFIRMED. Faithful to real repo. Fable §2 was wrong; my C1 §3 hedged correctly.**

Fable §2 named "React + Vite" as the framework. The real repo loads React 18 + ReactDOM via UMD `<script>` CDN tags with `@babel/standalone` doing in-browser JSX transpilation. No `package.json`, no ES module graph, no Vite. My C1 §3 hedged with *"the landing app's current router — likely React Router — receives a new `/museum/*` route"* + *"Sonnet confirms on inspection."* The hedge saved us; C-Build's verification made the truth visible.

**Impact on my downstream spec:** My original C2 anticipation assumed `React.lazy` for the Three.js chunk. `React.lazy` requires a dynamic `import()` module graph that doesn't exist here. C2 spec must name an alternative pattern (dynamic `<script src>` injection on threshold action, or native browser `import()` if the target browser matrix supports it). I'll encode this in the C2 kickoff.

### PD2 — Hash sub-router (`#/rotunda`, etc.) not History-API path routes

**Ruling: CONFIRMED. Correct default. Coordination question stands.**

Given PD1, the `weekly.html` + `unite-passion/nascar-basketball.html` precedent (both are separate static entry pages accessed by relative href from `landing.jsx`) is the right analog. Hash routing resolves to the same file under any host — no `_redirects`, `netlify.toml`, or `wrangler.toml` needed. My C1 §3 spec of `/museum` + internal `/rotunda` etc. holds structurally at the URL-shape layer; the implementation swaps path-segments for hash-segments (`#/rotunda`). Deep-link cold load behavior C-Build verified matches my §3 spec intent.

**Coordination question for JR/Chief:** which host serves `shadeofdesign.net`? If it's Cloudflare Pages / Netlify / Vercel, rewrite rules can enable path-based routing later. Not blocking; C2 can decide whether to migrate. Surfacing in kickoff Chain.

### PD3 — Museum-scoped CSS variables (`--museum-ink` etc.) instead of reusing site `--ink`/`--ocean`/`--slate`/`--ember`

**Ruling: CONFIRMED. Sharp architectural upgrade. My C1 spec did not name this hazard; C-Build's move is the correct pattern.**

The site's `styles.css` defines `--ink`, `--ocean`, `--slate`, `--ember` as *theme-adaptive text-color tokens* that flip value between light/dark themes (e.g. `--ink` becomes `#F3F4F6` in dark mode). Fable §1.6 says "palette is closed" — DD-032's Ink `#0B1726` is a *fixed brand-palette color* (obsidian wall mass) that must never flip. Naive variable-name reuse would silently break the museum's palette under any theme toggle. C-Build's namespace (`--museum-*`) preserves Fable's closed-palette covenant while avoiding the collision.

**Brand-token lint enforcement is on values, not variable names** — the `ALLOWED_HEX` set in `lint-brand-tokens.js` checks against the six fixed hex codes. Right layer.

**This gets promoted to a formal pattern in D-030:** future museum extensions (v2+ halls, cabinets, mini-games) inherit `--museum-*` namespace; future Central Hub React surfaces that need fixed brand palette (vs. theme-adaptive tokens) follow the same rule.

### PD4 — No `.tile-sport` CSS precedent existed to pattern after

**Ruling: CONFIRMED. Spec error on my side, corrected by C-Build's read.**

My C1 §3 said *"Add `.tile-sport` accent class to landing CSS — patterns after `.tile-sport`."* C-Build read `landing.css`, found no such rule, and identified the actual precedent: all per-accent visual distinction lives in the `TileArt()` component (different SVG per accent), not in CSS. He added the `ink` branch to `TileArt()`, applied `tile-ink` class per convention (consistent with `tile-sport`/`tile-ocean`/etc. present but unused by CSS), and did not invent a fake `.tile-ink { }` rule to match my mistaken precedent claim.

Correct move. My spec inherited Fable's Dialogue 6 language uncritically. C-Build corrected it against the actual code.

### PD5 — No CI pipeline exists

**Ruling: CONFIRMED. Correct posture. Lint scripts ready-to-wire.**

No `.github/workflows`, no git repo at vault root (`git rev-parse` fails). My C1 §5 item 6 called for "CI-enforced" cross-manifest lint; C-Build built both lint scripts as zero-dep Node scripts (matching this repo's total absence of JS tooling), exit-non-zero on violation, ready to wire when CI exists. Right posture — don't fake infrastructure.

**Coordination question for JR:** if/when git + CI are established at the vault root, wire `node museum/lint/lint-manifests.js` and `node museum/lint/lint-brand-tokens.js` on any commit touching `museum/manifest/*` or `museum/**/*.{css,jsx}`. Surfacing in kickoff Chain.

### Bonus item — Marcellus not served by brand system

**Ruling: CONFIRMED. Correct scope-boundary discipline.**

Fable §2 claim ("Marcellus/Inter are already served by the brand system — reuse, don't re-host") does not hold against the real `index.html`, which loads Space Grotesk + JetBrains Mono only. C-Build added the Google Fonts Marcellus link to `museum/index.html` only, not the main landing page. Protects the main landing's initial-payload budget while satisfying my "Marcellus greeting" spec. Payload impact ~30–50 KB on the museum sub-page, well within budget.

---

## Verification quality

C-Build drove the actual DOM via `.claude/launch.json` static-file preview + Claude Preview:

- Tile 05 renders with `<<HELD FOR JR>>` blurb literal — **no invented copy**.
- First-visit threshold: "Welcome, traveler." + both buttons render.
- Returning-visit threshold (localStorage `sod_visitor_name = "Jon"`): "Welcome home, Jon." — `{name}` substitution live.
- Deep-link cold load (`sod_audio_optin` pre-set): threshold skipped, capability check runs, correct branch selected. Matches my §3 deep-link spec.
- Mobile viewport (375px): capability check forces 2D-fallback stub. Correct.
- `node museum/lint/lint-manifests.js` → CLEAN.
- `node museum/lint/lint-brand-tokens.js` → **initially caught 1 real violation of an off-palette `#14202F` C-Build had used himself; forced him to fix it before shipping.** Calibration doing its job — the safety net caught its author.

This is real DOM-driven verification, not "written but untested."

---

## Risks to name now (deferred to C3, flagged here)

### C3 payload-budget risk — dev-build CDN scripts

`museum/index.html` loads `react.development.js` + `react-dom.development.js` + `@babel/standalone/babel.min.js`. For C1 verification these are fine, but the dev builds carry ~50 KB verbose warnings each, and `@babel/standalone` is ~700 KB minified — meaningful fraction of the ≤ 2.5 MB initial budget.

**For C3 ship:**
1. Swap React CDNs to `.production.min.js` variants.
2. Consider pre-transpiling `.jsx` files to `.js` at ship time (a one-off Node script) to drop `@babel/standalone` entirely from the museum sub-page bundle. Would move ~700 KB out of the critical path. If this pattern lands, it likely wants to spread to the main landing page too (Central Hub-wide payload win) — but that's not DD-032 scope, just a note.
3. Payload budget audit at C3 with dev-tools Network tab under throttled connection.

None of this blocks C2. Naming now so it doesn't surface as a payload-budget failure at ship time.

### Hosting-provider coordination question (from PD2)

Which host serves `shadeofdesign.net`? Answer determines whether path-based routing is enable-able at C2. Non-blocking; hash routing is safe default.

### CI wiring question (from PD5)

If/when git + CI land at the vault root, `lint-manifests.js` and `lint-brand-tokens.js` want to run on manifest/museum-code changes. Currently manual invocation only. Non-blocking for museum ship; matters for regression prevention.

---

## Ship gates status (unchanged from C1 spec §6)

No gate clears at C1. Two remain spec-locked (payload budgets). One has scaffolding + one validated run (brand-token lint — clean). Five wait for later checkpoints.

---

## Sonnet unlocks after this sign-off

None new until my C2 kickoff artifact lands. C-Build stands down between checkpoints — the pyramid mailbox convention holds (delivery → response → chain per checkpoint, no autonomous progression across gates).

C2 unlock target per kickoff §Checkpoint 2:
- Three.js dolly path + waypoints + GLB rotunda + Classics hall (with the `React.lazy` alternative pattern named per PD1 impact above)
- 2D fallback content parity (real renderer replacing the stubs)
- Accessibility path — every waypoint has a matching focusable DOM overlay; keyboard-complete traversal verified

---

## Cross-references

- **C-Build C1 impl log:** [`session-log-2026-07-04-sonnet-c1-impl.md`](session-log-2026-07-04-sonnet-c1-impl.md)
- **Opus@CH C1 artifact (planning):** [`session-log-2026-07-04-c1-arch.md`](session-log-2026-07-04-c1-arch.md)
- **DD-032:** [`References/Designs/DD-032 SoD Museum — rotunda plus Classics hall.md`](../../../../References/Designs/DD-032%20SoD%20Museum%20—%20rotunda%20plus%20Classics%20hall.md)
- **Kickoff + Chain history:** [`C Roles/Strategies/kickoffs/DD-032-Opus-CH-arch-review.md`](../../../../C%20Roles/Strategies/kickoffs/DD-032-Opus-CH-arch-review.md)
- **Companion decision D-030:** [`pipeline/DECISIONS.md`](../../pipeline/DECISIONS.md)

---

*Signed off — Opus@CH, 2026-07-04*
*Checkpoint 1: cleared. Forge stood warm.*
