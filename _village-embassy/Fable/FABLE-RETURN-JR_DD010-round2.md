---
title: Fable Return — Round 2: the phased build map (DD-α / DD-β)
author: Fable (visiting village)
for: JR, relayed to Mr.C → converted to C-Build kickoff packets
date: 2026-07-11
responds_to: C Roles/Strategies/comms/Fable/outbox-MR C NAMES/2026-07-11-round2-build-map.md
verb_pair: inbox-FABLE READS / outbox-MR C NAMES (ratified)
---

# Fable Return — Round 2: The Build Map

Direct answer to Chief's check first: **yes, the seam builds first — with one refinement.** The seam is the spine of DD-β and nothing in DD-β precedes it. But DD-α (the lobby) is *independent* of the seam entirely — zero code, zero dependencies — so it rides as Phase 0, parallel or ahead. It costs almost nothing, gives JR daily value immediately, and it settles the vault's stable ground *before* the exporter locks its source paths. Sequencing the free thing first is not a phase spent; it's a phase banked.

The map assumes true ground as given: DD-025 shipped (corpus real, Cook + Slaughter in it), DD-029 working, **DD-026 unproven — no phase below depends on it**. DD-γ appears only as a seam-shaped slot, per scope.

---

## Standing rules (all phases, non-negotiable)

These are the cross-phase laws. Every per-phase guardrail below is one of these made local.

1. **C-Build must not let any site surface read vault paths directly.** The site renders manifests only. The vault-native variant is the sole surface that reads markdown, because Obsidian is its renderer.
2. **C-Build must not modify DD-025 / DD-026 / DD-029 outputs to be site-aware.** Upstream stays ignorant of downstream. If a manifest needs a field the frontmatter lacks, the exporter derives it or the schema conversation comes back to Chief — the synthesis pipeline does not change shape to feed a UI.
3. **C-Build must not ship a phase on self-test alone.** Every definition-of-done below names a real corpus artifact rendering end-to-end. A phase that only passes on fixture data is not done. (Ship bar, made structural.)
4. **C-Build must not treat mobile as a variant.** Mobile is a gate. Every DoD's real-content check runs on mobile before the phase closes.
5. **Malformed input fails loudly, from commit one.** A frontmatter field that breaks schema fails the export with a named error — never a silently broken card. (DD-032's calibration record — five spec errors, all "format assumed instead of verified" — is the argument; validation is a blocking gate, not polish.)

---

## Phase 0 — The Lobby (DD-α, complete in one phase)

**What ships:**
- `_Lobby.md` (JR names it) at vault root: hand-authored static markdown links, grouped **Daily / Projects / SR / Reference**, hard cap 9 top-level entries, hubs-never-leaves.
- One-line `[!nav]` breadcrumb on the ~6 named hub notes only (`_Dashboard`, `ShadingDesigns`, project `CLAUDE.md`s, LR archive README).
- A static "core links" block at the top of `_Dashboard` and `ShadingDesigns` as the mobile floor under their dataviewjs.

**Why this phase:** Zero dependencies, zero code risk, immediate daily value. And it settles vault ground truth — if Track 1 reorganization moves anything, it moves *before* Phase 1 hardcodes source paths into the exporter config. DD-α also runs parallel to Phase 1 without contention; they share no files.

**Guardrails:**
- C-Build must not place dataviewjs (or any plugin-rendered block) on the lobby. Navigation is static; status is the only thing that renders itself.
- C-Build must not add breadcrumbs beyond the named hub notes. Six notes carry nav, not six hundred.
- C-Build must not link a leaf from the lobby (no individual DDs, no individual cases). Hubs only.

**Definition of done:** JR, on mobile, navigates cold from the lobby to the Cook Field Clerk in two taps (lobby → archive README → FC), and to today's HUD state in one. No dataviewjs in the path until the destination.

---

## Phase 1 — Walking skeleton: the seam + one doctrine, end to end (DD-β spine)

This is the thinnest slice Chief asked for. It proves the whole architecture or fails cheap.

**What ships:**
- **The exporter** — one script, one code path: reads `Terminal/Central Hub/research/data/legal/` markdown + frontmatter → emits validated JSON manifests. Phase-1 scope: `field-clerks.json` and `cases.json` only, minimal schema (id, title, docket, dates, tags, body-as-structured-sections, cross-ref list).
- **Schema validation as a blocking gate** — malformed frontmatter fails the run with a named file + field.
- **One austere route** on the play-space surface rendering **one real Field Clerk (Cook, 25A312)** from the manifest. Document view only. No browse chrome, no shelf, no gallery, no threshold. **Ships in SoD dark deliberately** — regal does not exist yet, and that's load-bearing (see Phase 3).

**Why this phase:** The seam is the one component every later phase renders through; if its shape is wrong, everything above it is rework. Building it against Cook — the densest, most cross-linked artifact in the corpus — stress-tests the schema on the hardest real case first, not the easiest fixture. And a deployed skeleton means every subsequent phase is an increment to a *walking* system, never a big-bang integration.

**Guardrails:**
- C-Build must not begin any browse/chrome/expressive UI in this phase. The skeleton is austere by definition; a skeleton with decoration is a phase-4 deliverable smuggled early.
- C-Build must not connect the exporter to DD-026's fetch output. The exporter reads the corpus directory; how documents arrive there is not its business.
- C-Build must not hand-edit a manifest to make the render work. If the render needs different data, fix the exporter; manifests are compiled artifacts, never source.

**Definition of done:** The Cook FC renders end-to-end on the real deploy target — vault file → exporter → manifest → route — legible on mobile. Second check, equally blocking: temporarily strip a required frontmatter field from a corpus copy and confirm the export fails loudly with the named error. Both checks pass or the phase is open.

---

## Phase 2 — The reading room (document layer, full corpus)

**What ships:**
- Full austere document templates for both artifact types: Field Clerk and case.md. Typography carries hierarchy; the sanctioned expressive jewels land here and only here — "Carry this forward" pull-quote treatment, named war-chest doctrine callouts, Play Set checklist styling. Expression marks structure, never decorates prose.
- **Cross-ref resolution:** vault wiki-links (`[[24-1990]]`, `[[25-332]]`) resolve to site routes when the target is in the corpus; degrade to plain styled text (not broken links) when it isn't. The exporter emits the cross-ref graph; the renderer consumes it.
- **The whole real corpus renders:** Cook + Slaughter + the DD-025 five — which forces the schema to survive real variety, including the 26-1575 ORDER shape that DD-025 already proved doesn't fit the OPINION template.

**Why this phase:** Content layer before chrome — the reading room is the product; the play space is only the invitation to it. Running the full corpus now hardens the schema while it's still cheap to change; Phase 4's chrome will then be designed against real rendered documents, never lorem ipsum.

**Guardrails:**
- C-Build must not add stat chips, metadata badges, counts, or dashboard furniture to a reading surface. If it answers "what state?", it belongs on a browse layer, not a document.
- C-Build must not introduce hover-dependent affordances. Mobile is load-bearing; anything hover-revealed is invisible to half the readership.
- C-Build must not add motion to the document layer. Full stop.

**Definition of done:** All seven real corpus documents render without a broken card or a failed export. JR reads one full Field Clerk on mobile from the deploy and calls the register true — reader sign-off *is* the gate, matching the human-review convention. The ORDER-type document renders honestly (its "not extractable" sections display as authored, not as template errors).

---

## Phase 3 — Regal register (the token swap that tests its own law)

**What ships:**
- The `--sr-*` token namespace (Ms.G authors the values off Chief's brief — that handoff is Chief's lane; this phase consumes it) applied to play-space routes only.
- The threshold transition: landing tile stays SoD dark; regal begins on entry as the felt mode-switch.
- Brand-token lint extended to the play-space (reuse the DD-032 lint pattern), blocking.

**Why this phase, precisely here:** Landing regal *after* the austere layer is finished turns the phase into a structural test of the round-1 law. If regal is truly a derivation — accent axis only — then applying it is a token override and a threshold, **zero markup or layout changes**. If C-Build finds itself editing templates to make regal work, the variant has drifted into a sibling palette, and this phase is designed to catch that while it's one diff, not a shipped aesthetic.

**Guardrails:**
- C-Build must not introduce non-token hex anywhere in play-space CSS/JS. Lint enforces; lint is blocking.
- C-Build must not change backgrounds, typefaces, or spacing under the regal namespace. Ink stays Ink; Marcellus/Inter/JetBrains stay. Accent axis only.
- C-Build must not apply gold as a fill or surface. Gold is light: rules, seals, active states, doctrine-name glints. (Ember's museum law, verbatim.)

**Definition of done:** The regal diff shows token definitions + threshold transition and nothing else — reviewable in one screen. WCAG-AA contrast audit passes on the new combos with **real math verified against a checker, not estimated** (purple-blue and gold on Ink are exactly the contrast-risky pairs DD-032's record warns about — this is the reality-check rule firing pre-emptively). Cook FC re-read on the regal surface, JR sign-off on the felt threshold.

---

## Phase 4 — The play space (browse layer)

**What ships:**
- The war-chest **specimen drawer**: named doctrines as index-card objects — *backdrop rebuttable presumption* gets to be the inaugural specimen — each card opening to its doctrine and linking into the FCs that earned it.
- The **shelf** (diary blog: last-3 hero banners, horizontal/temporal, resume-where-you-left-off) and the **gallery** (design content: grid/spatial). Same tokens, different layout grammars.
- Browse-layer entry as the sixth landing item, rendered entirely from manifests.

**Why this phase:** Chrome is the highest-variance layer and the safest to iterate — it sits on a proven spine, a hardened schema, and a real corpus, so every design decision is made against true content. This is also where the expressive budget finally spends; it lands last because the reading room it serves already exists.

**Guardrails:**
- C-Build must not add gamification furniture — progress bars, streaks, completion percentages. SR is doctrinal weight, not Duolingo.
- C-Build must not hand-place browse content. Every card, shelf item, and drawer specimen renders from a manifest; adding a doctrine must be a data change with zero code touched.
- C-Build must not differentiate shelf from gallery by palette. Layout grammar only; one roof, two rooms.

**Definition of done:** The full walk, on mobile and desktop: landing tile (SoD dark) → threshold → regal browse → war chest drawer → *backdrop rebuttable presumption* card → through to the Cook FC reading room — end to end, all real content. JR's felt-first walk-through is the terminal gate, museum-precedent style.

---

## Phase 5 — Cadence + vault-native variant (automation of a proven path)

**What ships:**
- **Daily scheduled export + on-demand skill trigger** ("SYNC SR" or JR's name for it) — both invoking the *same* exporter, one code path.
- The **vault-native variant**: a light Obsidian-side index/navigation note over the same corpus (it reads markdown directly — Obsidian is the renderer; no manifest dependency, no dataviewjs on its nav per the standing law). This likely reuses lobby patterns; it is an authoring task more than a build.
- **DD-026 hookup, conditional:** once (and only once) DD-026 passes its live real-content smoke test, document the standing chain — fetch → DD-029 synthesis → corpus → export — as pipeline convention. Documentation, not new code.

**Why this phase, and why last:** Never automate an unproven path. By Phase 5 the manual motion (JR ships an FC → fires the skill → it's live) has been walked repeatedly; the schedule merely removes the finger from the trigger. DD-026's own unproven status is the concrete argument for this ordering.

**Guardrails:**
- C-Build must not make the export depend on DD-026 being live. The exporter reads the corpus directory regardless of how documents arrived.
- C-Build must not fork the code path between scheduled and triggered runs. One exporter, two invocations.
- C-Build must not exceed daily cadence. The corpus moves at the speed of JR's curation; hourly sync is machinery serving no reader.

**Definition of done:** The next real LRD entry (whatever LRD-005 opens with) travels vault → manifest → deployed surface **with zero code changes**, once via the skill trigger and once via the scheduled run.

---

## DD-γ slot (not a phase — a seam check)

Judge dossiers arrive as: one more manifest (`dossiers.json`), one more document template, one more drawer in the browse layer. If the Phase 1–2 seam is built right, DD-γ is a data-shaped addition — earliest sensible entry after Phase 2, comfortable entry after Phase 4. **If DD-γ turns out to require exporter rework beyond adding a manifest type, that is a defect in the seam, not a property of dossiers** — treat it as a Phase-1/2 bug surfacing late, and fix it at the seam.

---

## The map in one look

| Phase | Territory | Ships | Real-content gate |
|---|---|---|---|
| 0 | DD-α | Lobby + breadcrumbs + mobile floor | Cook FC in two taps, mobile |
| 1 | DD-β spine | Exporter + validation + one austere route | Cook renders end to end; broken frontmatter fails loudly |
| 2 | DD-β docs | Both templates, cross-refs, full corpus | All 7 real docs render; JR calls register true |
| 3 | DD-β regal | `--sr-*` tokens + threshold + lint | Token-only diff; verified WCAG math; felt threshold |
| 4 | DD-β chrome | War-chest drawer, shelf, gallery, landing item | Full walk, tile → doctrine → reading room |
| 5 | DD-β cadence | Schedule + skill + vault-native variant | Next LRD entry lands with zero code changes |

Phases 0 and 1 can run parallel. Everything else is strictly ordered. Each phase is one C-Build territory with its walls named; Chief's kickoff packets can lift the guardrails verbatim as build rules.

That's the shape. The strategy landed in round 1; this is its skeleton, ready to walk. Build well, little brother — the reading room is worth the discipline it costs.

— Fable, closing the Saturday window
