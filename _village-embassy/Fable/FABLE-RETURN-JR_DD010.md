---
title: Fable Return — JR_DD010 Cycle 7 opening review pass
author: Fable (visiting village)
for: JR, relayed to Mr.C
date: 2026-07-11
responds_to: THE-PACKET-JR_DD010.md
sections: [Track 1 — ORGANIZATION, Track 2 — RHYTHM, Cross-cutting — brand extension]
---

# Fable Return — JR_DD010 (Cycle 7 opening)

Three sections, as asked. Where I can't see enough, I say so and stop. The short version up front:

1. **Track 1:** Pinned lobby, not embedded widget. Nav is always static links; only status surfaces get dataviewjs. Hard cap the lobby at ~9 entries that point to hubs, never leaves.
2. **Track 2:** Solve the register problem by *layer*, not by blend — expressive browse chrome, austere reading surface. The refactor is right-sized **if** you add the one joint it's missing: a vault→manifest export seam (the pattern DD-032 already proved). FCs stay vault-canonical; NBLM gets export copies.
3. **Brand:** Yes to regal — but as an accent-axis derivation of SoD dark under an `--sr-*` namespace, not a sibling palette. The rule: **regal follows the war chest.** Gold is light, never surface.

---

## Track 1 — ORGANIZATION

### The pattern: pinned lobby with a thin breadcrumb, not a widget

**Recommend: hybrid, weighted heavily toward a single pinned dashboard-of-dashboards ("the lobby"), with the widget form reduced to a one-line breadcrumb that appears only on terminal surfaces (dashboards and project roots) — never in every note.**

Why not the widget-in-every-note form:

- Embedded nav multiplies your maintenance surface by your note count. Every nav change becomes a template migration; templates rot; old notes carry stale nav forever. This is the bloat you asked me to save you from — it isn't a risk of the widget pattern, it's the destination.
- On mobile, a nav callout at the top of every note is exactly the screen real estate you don't have. The reading surface pays a tax so the nav can exist.
- Your vault already has a pull rhythm (JR opens `_Dashboard` and `ShadingDesigns` deliberately, daily). A pinned lobby *matches* the existing muscle memory; a widget fights it.

The one widget worth keeping: a single-line `[!nav]` breadcrumb on **hub notes only** (`_Dashboard`, `ShadingDesigns`, each project `CLAUDE.md`, the LR archive README) pointing back to the lobby. That's ~6 notes carrying nav, not six hundred.

### The push/pull rule you're missing

You named the stuck point precisely: no pattern for when an entry is JR-authored (pull) vs dataviewjs-rendered (push). Here's the joint:

> **Navigation is always static. Status is the only thing that renders itself.**

- The lobby is 100% hand-authored plain-markdown links. Zero dataviewjs. This is not a compromise — it's the design. A nav layer that depends on a desktop-only plugin fails on mobile at exactly the moment wayfinding matters most (JR on the go, trying to find a file). Static links work everywhere, forever, including in five years when dataviewjs has been superseded twice.
- Dataviewjs stays on the surfaces the lobby *points to* — `ShadingDesigns` and friends — where "what changed?" is the question. Those surfaces should each grow a small static "core links" block at top so mobile gets a graceful floor.
- Test for any future entry: if the entry answers "where is X?" → static link. If it answers "what state is X in?" → rendered, and it lives one click deep, not on the lobby.

### What belongs on it

The lobby earns entries by **frequency of opening, not importance**. Important-but-rarely-opened files belong one hop away, behind a hub. Proposed shape — hard cap at 9 top-level entries, grouped:

- **Daily** — `_Dashboard` · `ShadingDesigns` (the HUD)
- **Projects** — one link per active project root/`CLAUDE.md` (Central Hub, and whatever Cycle 7 activates)
- **SR** — the legal archive README (which itself links cases/FCs/war chest) · the play-space once DD-β ships
- **Reference** — `pipeline/DECISIONS.md` · comms README

### How to keep it from bloating

1. **Hubs, not leaves.** The lobby links to `ShadingDesigns`, never to an individual DD; to the archive README, never to a case file. Two clicks to anything; one click only for daily surfaces. The moment a leaf appears on the lobby, the cap is meaningless.
2. **One-in-one-out** above the cap. Adding an entry requires naming the entry it replaces.
3. **Prune at cycle close.** You already have the cycle rhythm — attach a 5-minute lobby review to it rather than inventing a new ritual. Any entry JR didn't open this cycle is a removal candidate.
4. **The lobby is a map, not a mirror.** If an entry needs its own upkeep (counts, statuses, dates), it has drifted into being a dashboard. Cut it back to a link.

---

## Track 2 — RHYTHM

### The interface register: expressive building, quiet reading room

The middle path you're looking for doesn't come from blending the two registers — every blend fails toward one pole, as you've observed. It comes from **assigning the registers to different layers**:

- **Browse/threshold/navigation layers are the play space.** The shelf, the war-chest index, the entry moment, the gallery — this is where regal palette, motion, hero banners, and delight live. Arriving at the play-space should *feel* like crossing a threshold (you already built this move in DD-032 — the museum threshold is the proof it works in your hands).
- **The document layer is reference-austere.** Once a Field Clerk or case.md is open, typography carries everything: generous measure, strong hierarchy, no ornament competing with the reasoning. Think reading room inside an expressive museum — the building has drama, the desk has light and quiet.

The Cook Field Clerk is why I'm confident in this split: **the content already has the expressive register in prose.** "Two words. Two centuries of common-law weight." That voice *is* the play. An interface that adds a second expressive voice on top produces noise-on-noise; an austere frame makes the prose voice the loudest thing on the page, which is where you want the reader's attention during high-stakes reading.

**One expressive element allowed inside documents:** the structural jewels — "Carry this forward" pull-quotes, named war-chest doctrine callouts, the Play Set checklist. These mark *structure and stakes*. The rule in one line: **expression marks structure, never decorates prose.**

Patterns worth stealing / avoiding:

- **Steal:** your own DD-032 placard pattern (zoom-to-placard = expressive browse, austere read — the play-space is the same move with documents instead of cabinets). Reference-doc sites that survive daily use (MDN, Stripe) all converge on expressive nav + austere doc. For the war chest specifically: an index-card / specimen-drawer presentation — doctrines as collectible named objects — gives play-space energy to exactly the layer that can afford it.
- **Avoid:** dashboard-ification of reading surfaces (stat chips and metadata badges on case pages); gamification tokens (progress bars, streaks — SR is doctrinal weight, not Duolingo); hover-dependent affordances (mobile is load-bearing).

**Diary blog vs. design gallery:** differentiate by **layout grammar, not palette**. Shelf = horizontal/temporal (last-3 hero banners, "resume where you left off" — a *bookmark* metaphor); gallery = grid/spatial (browse, no order). Shared header, footer, and tokens keep them one roof. Do not mint a third register for the blog — two layout grammars under one palette reads as one house with two rooms, which is exactly right.

### Refactor scope (DD-021 → DD-029): right-sized, with one missing joint

Honest bound first: DD-025 I've read in full; DD-026/027/029 I see only by reference in the packet, and DD-029 not at all. I can't audit their internals. What I *can* call is the structural shape, and there's one joint I don't see named anywhere in the packet:

> **The vault→site export seam.** The refactor as described ("backend refactor to auto-synch source data into it") has two failure modes: coupling the site directly to vault file layout (fragile — the vault reorganizes freely, and Track 1 is literally about to reorganize it), or re-implementing markdown parsing per surface (the site, the vault-native variant, NBLM each reading raw files their own way).

The joint: **a single export step that compiles vault markdown + frontmatter into validated JSON manifests, and a site that renders only manifests.** `cases.json`, `field-clerks.json`, `warchest.json`, `digests.json`. This is not a new idea for you — it's DD-032's spine ("adding a hall is data, not code") applied to the legal corpus. The vault-native variant reads the markdown directly (Obsidian is already the renderer); the public surface never touches vault paths. DD-γ's judge dossiers later become one more manifest, not one more integration.

With that seam named, the scope reads:

- **Right-sized** if the refactor stops at the seam: upstream DDs (25/26/27) keep writing vault artifacts exactly as they do now and stay *ignorant of the site's existence*. The archive shouldn't know the play-space exists.
- **Over-built** if any upstream DD gets modified to be site-aware, or if sync becomes real-time plumbing (see cadence, below).
- **Under-built** if the export step doesn't validate schema loudly. A malformed frontmatter field should fail the export with a named error, not silently render a broken card. Your DD-032 calibration record ("external formats assumed instead of verified" — five spec errors) argues for this being a blocking gate, not a nice-to-have.

**Sync cadence:** the corpus grows by human curation — a few documents per week, in bursts. Hourly sync buys nothing; on-commit is over-engineering for this rhythm. **Daily scheduled + on-demand skill trigger** ("SYNC SR," matching your existing FETCH LEGAL pattern) matches the actual data pulse. If JR ships an FC and wants it live, he fires the skill; otherwise the morning run catches it.

**DD-031 disposition (FCs → NBLM migration): don't migrate.** The Cook FC is dense with vault-local wiki-links (`[[24-1990]]`, `[[24-2242]]`, the cross-stitch to Jacobson and Erdemir) — that link graph *is* the war-chest mechanism, and it only resolves vault-side. Moving FCs breaks the thing they're for. Portability is an export problem, not a residency problem: **vault stays canonical; NBLM receives copies via the same export seam** — which is exactly the pattern JR already proved when he hand-carried the five DD-025 case files into NotebookLM and got the 47-minute audio. Formalize that motion; don't relocate the source.

---

## Cross-cutting — brand extension (the regal variant)

### The call: yes — as a derivation, not a sibling

A second register is the right move here, for a reason specific to this vault: **SR is a different mode of JR, not just a different content type.** High-stakes doctrinal reading benefits from a felt threshold — the palette shift is a cognitive mode-switch cue, the same move as the museum's "Enter with sound / Enter quietly" doorway. Typography alone can whisper a register change; it can't announce a threshold.

But the yes comes with a structural condition that does most of the anti-drift work:

**Regal is an accent-axis variant of SoD dark, not a second palette.** Same Ink base. Same Paper. Same type stack (Marcellus / Inter / JetBrains Mono). Same spacing and layout grammar. What changes: the accent axis only — purple-blue takes the primary-accent seat (where Ocean sits today), gold/amber enters as the scarce metal, Ember demotes to secondary. Token-wise this is an `--sr-*` namespace overriding accent tokens — the exact precedent `--museum-*` set in DD-032, which is why I trust your shop to hold it.

**The tripwire:** the moment the regal variant wants its own background color, its own typeface, or its own spacing scale, it has stopped being a register and started being a second brand. That's the line where you stop and come back to this question.

### The rule for when a surface uplifts

> **Regal follows the war chest.** A surface uplifts to regal if and only if its primary content flows from the legal-research corpus (cases, Field Clerks, war chest, digests, dossiers) and the user is there to read or study it. Everything operational — Diary, ShadingDesigns, kickoffs, pipeline, the landing page — stays SoD dark.

Corollaries that make the rule survive contact:

1. **Thresholds stay dark; interiors go regal.** The play-space's tile on shadeofdesign.net is SoD dark like its siblings — the landing page is one voice. The regal shift happens *on entry*, as a felt transition. (Museum precedent, again.)
2. **Content quotes don't drag palette.** A diary post referencing Trump v. Cook stays in diary register; an SR page citing a DD stays regal. The surface's *home*, not its citations, sets the register.
3. **Hard cap at two.** The next surface that "feels like it needs its own palette" gets answered with typography and layout, not tokens. Two registers is a house with a study; three is drift with a color wheel.
4. **Gold is light, never surface.** Steal your own Ember law from DD-032 ("emissive only — light sources, never surfaces") and apply it verbatim to gold: rules, seals, active states, doctrine-name glints. Gold surfaces go gaudy at speed; gold light stays judicial. This single sentence protects the entire variant — hand it to Ms.G as a constraint, not a suggestion.

One closing observation on drift, since the packet names it as the risk: **Ember never drifted in the museum because DD-032 wrote its law in one sentence before anyone touched CSS.** Palette proliferation isn't caused by palette count — it's caused by variants shipping without their laws. Write the regal laws (the rule + four corollaries above, or your amended version) into DD-β *before* Ms.G authors tokens, and two registers will hold as easily as one.

---

## Flagged, not answered

- **DD-029 internals** — not staged; my refactor read is structural, not line-level. If DD-029 already contains an export/manifest layer, my "missing joint" is a confirmation, not a gap.
- **Verb pair** for this lane (`FABLE READS / MR C NAMES`) — Chief's proposal reads true to the register from where I sit, but that's JR's to ratify, not mine to weigh in on.

Read the shape; named what I could; bounded what I couldn't. Good hunting in Cycle 7.

— Fable
