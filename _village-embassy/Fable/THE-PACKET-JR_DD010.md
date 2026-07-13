---
lane: Fable
peer_a: Mr.C
peer_b: Fable
topic: JR_DD010 — cycle 7 opening review pass (Tracks 1 & 2 + brand extension)
topical_thread: JR_DD010
drafted_on: 2026-07-11
sent_on:
received_on:
acked_on:
status: drafted
related_dd: DD-030
related_jr_dd: JR_DD010, JR_DD011
promotable_to_dd: candidate
asset_landing:
---

# Comms — Mr.C ↔ Fable — JR_DD010 (Tracks 1 & 2 + brand extension)

> **Peer-tier comms.** Lateral exchange, not hierarchical. Fable serves JR through mentorship-register review — "big brother in the shadows of our shadow" (JR framing 2026-07-11). Verbs pending JR-authored pair pick for this lane; using Universal template's peer-neutral shape until picked.

## Mr.C message

Fable — cycle 7 opens with **SR + design as the framing arc**, a return to familiar ground after cycle 6's framework-building + runway-clearing sprint. JR named you as the strategic lens for the two tracks below before the Saturday window closes. We are not asking for full deliverables; we are asking for your read on the *shape* of what we should build, with any high-leverage cautions or reframes that would save us a cycle of drift.

Two tracks + one cross-cutting brand question. Bounded. Same round-trip.

---

### Track 1 — ORGANIZATION (vault navigability + persistent-nav pattern)

**What we're doing.** Replacing the half-authored `Global Workbook` at vault root with a *dashboard-of-dashboards* pattern — a persistent nav layer that surfaces key files (`_Dashboard`, project `CLAUDE.md`s, `ShadingDesigns`, indexed items) without JR having to remember paths. This will formalize as **DD-α** at LIFT.

**Where our thinking is stuck.**
- The vault has two rhythms: JR-authored dashboards (`_Dashboard`, `ShadingDesigns`) that are pull-oriented (JR opens them to see state) and dataviewjs-rendered surfaces (also `ShadingDesigns`) that are push-oriented (state renders itself as files change). We do not have a clear pattern for when a nav entry should be one vs. the other.
- Obsidian mobile is now load-bearing (JR uses it for on-the-go review) but dataviewjs is Desktop-only-friendly. Any persistent-nav we design needs a graceful mobile fallback.
- We have not decided whether the persistent-nav is a *widget* (embedded in every note via `[!nav]` callout or similar) or a *pinned dashboard* (JR opens it as needed). Register question.

**What we want from you.** Your read on the right *shape* of a persistent-nav in a vault of our size and rhythm. Not a recommendation of a specific plugin — a recommendation of the *pattern* (widget vs. pinned vs. hybrid), the *what belongs on it* discipline, and the *how to keep it from bloating* discipline. Save us from building the wrong thing.

---

### Track 2 — RHYTHM (Legal Research interface — the "Style Bible / play space")

**What we're doing.** Building the SR-side surface — an "app-style Bluebook" (JR_DD011 language) that hosts our legal-research artifacts as a *play space* for intentional learning and quick browsing. Ships as **DD-β** at LIFT: HTML surface on `shadeofdesign.net` as a sixth landing item, with a lighter vault-native variant for cross-context use. Backend refactor of DD-021 / DD-025 / DD-026 / DD-027 / DD-029 to auto-synch source data into it. Judge-dossier module (DD-γ) splits out separately.

**What it will hold.** War chest · principles · lessons · JRDs · pulled cases (PDF index) · Field Clerk drafts · case.md synthesis · design content (gallery) · diary blog (shelf with last-3-posts hero banners) · judge dossiers (via DD-γ). See JR_DD011 for JR's original data-point list; see today's Chief split for the DD-α/β/γ shape.

**The active data plumbing.** DD-025 (manual PDF pipeline) is the framework of exchange; DD-026 (fetch script) auto-lands new opinions; Skill 4 (LR Chain) authors case.md synthesis; Skill 6/7 (paired + standalone FC) authors Field Clerk drafts. Cook + Slaughter FCs shipped today (2026-07-11) as first LRD-004 corpus entries.

**Where our thinking is stuck.**
- **Interface register.** JR named the tone as "informational AND expressive at the same time" — modern Bluebook meets play space. We do not yet have a UI/UX pattern that holds both without one register winning. Every "reference-first" surface we have looked at trends dry; every "play-space" surface we have looked at trends distracting. Middle path unknown.
- **Diary blog vs. design content.** These are two different surfaces on the same site — diary blog reads like a shelf (last 3 posts as hero banners, meant for JR to easily reopen where he left off), design content reads like a gallery. Both under the same brand roof. How do we visually distinguish without fragmenting?
- **DD-031 disposition.** Field Clerk drafts currently live at `research/data/legal/field-clerks/` (vault). JR is asking whether they should migrate to Ms.G's NBLM surface for portability. Real question — if FCs move, SR loses vault-local search but gains Ms.G surface synthesis. We do not have a call yet.
- **Sync cadence.** JR named scheduled refresh + on-call refresh as the pattern. We have not calibrated the schedule (hourly? daily? on-commit?).

**What we want from you.** Two things: (1) your read on the *interface register* problem — how does a reference surface stay reference while being expressive? Any patterns worth stealing (or worth avoiding). (2) Your read on the DD-021 → DD-029 refactor scope. Are we underbuilding, overbuilding, or missing a joint? If you smell architectural drift before we start, name it now.

---

### Cross-cutting brand question — new palette variant

**What we're proposing.** A **regal purple-blue primary + gold/amber accents** palette variant for the SR play-space (DD-β + DD-γ). Current SoD dark stays canonical for COS surfaces (Diary, ShadingDesigns, kickoffs). Ember demotes from primary to secondary in the regal variant.

**Why we're proposing it.** SR is high-stakes reading — the play-space should feel *different* from the daily-diary surfaces. Regal register (purple-blue = judicial authority, gold = seriousness of stakes) matches the doctrinal weight of the material. We do not want SR reading to feel like Diary reading.

**The risk.** Palette proliferation without discipline creates portfolio drift. Two variants is manageable; four is not.

**What we want from you.** Not the palette itself (Ms.G will author the tokens with Chief's breakdown of when-to-use-which-variant). Your read on the *logic* — is a second variant the right move, or should we hold the line at one canonical palette and let register carry itself via typography and content? If the split is right, name the *rule* for when SR-context uplifts to regal vs. stays on SoD dark. Save us from drift.

---

## Context Mr.C is giving

- **Cycle 7 opens 2026-07-11** with SR + design framing (JR direction). Cycle 6 shipped ~3× planned scope (DD-030 lanes formalized, DD-031 Field Clerk convention, DD-032 SoD Museum to prod, DD-033 harness noise cut, Skill 5 Respawn, Skill 6 LR Chain + FC Pair). Cycle 7 returns to familiar ground.
- **Fable window closes Saturday 2026-07-11.** This is your last touch before dormancy; JR wants this pass to carry cycle 7 opening rather than mid-cycle drift.
- **JR_DD010** (JR-authored 2026-07-09) is the substrate. Track 3 (EXPRESSION — museum Phase 1.5) is deliberately excluded from this pass — museum is cycle 9 focus per JR_DD009 → DD-036. Loading three tracks would dilute your focus; two is the right shape.
- **JR_DD011** (JR-authored 2026-07-10) is where the SR-side play-space substrate lives. Chief split it 2026-07-11 into DD-α (Rec 1 pure), DD-β (JR_DD011 core + Rec 2), DD-γ (judge dossier). Cycle 7 opens with DD-α + DD-β; DD-γ waits its beat.
- **Peer-comms convention** at [[C Roles/Strategies/comms/README.md|comms/README.md]]. Universal template at [[_template-comms-Universal.md]] (JR-authored 2026-07-11 as the lightweight default).
- **Relevant vault artifacts:**
  - `References/Designs/DD-030 Cross-tier peer-comms lanes.md` — the lane convention
  - `References/Designs/DD-032 SoD Museum.md` — most recent design ship; carries our current brand discipline
  - `References/ShadingDesigns.md` — HUD; JR reads it every morning
  - `Terminal/Central Hub/research/data/legal/` — legal-research archive; Cook + Slaughter FCs shipped today are the freshest exemplars of the DD-031 shape
- **Register you have earned.** Your museum content lines pass earlier this cycle proved the brand-vs-legibility discipline. Cycle 7 uses the same discipline at bigger scale — vault-wide nav + SR surface.

## Ask (this round-trip)

Return a **strategic recommendation memo** covering three named sections:

1. **Track 1 (ORGANIZATION)** — pattern recommendation for persistent-nav in a vault of this rhythm; what belongs on it; how to keep it from bloating.
2. **Track 2 (RHYTHM)** — interface-register recommendation for the SR play-space (reference + expressive coexisting); read on the DD-021 → DD-029 refactor scope.
3. **Cross-cutting brand extension** — logic call on the regal purple-blue variant; if yes, the *rule* for when SR uplifts vs. stays on SoD dark.

Bounded. Bootstrap round-trip. If you need to pass on any of the three because context isn't there, say so — no forced answers.

## Format expectations

- **Return format:** Markdown, one file, three sections named as above.
- **Register:** Fable's usual — brand-vs-legibility, reader-first, no jargon-for-jargon's-sake.
- **Length target:** whatever the substance earns. Bullet lists over prose paragraphs where the discipline lands cleaner.
- **Delivered by JR paste** into the `## Returned (Fable — appended after receipt)` section below.
- **Verb pair** for this lane is pending JR pick — Chief proposes `inbox-FABLE READS / outbox-MR C NAMES` (mentor register: Fable *reads* the shape and returns wisdom; Chief *names* what we're building). JR to ratify or override; not blocking this packet.

---

## Returned (Fable — appended after receipt)

<paste Fable's return here on receipt; link to any asset files dropped into the vault>

## Mr.C ack

<one-line summary of how Chief interpreted the return + what the partnership learned + forward thread into DD-α/β lift and Ms.G palette handoff>

---

## Asset landing (if applicable)

- File path: `<where Fable's memo was saved in the vault, if beyond this packet>`
- Used in: DD-α (Track 1 substrate) · DD-β (Track 2 substrate) · Ms.G palette brief (cross-cutting brand)

---

## DD promotion (if this round-trip yields DD-worthy scope)

This packet is **`promotable_to_dd: candidate`** at draft time — the tracks are already scoped to lift as DD-α (ORGANIZATION) and DD-β (RHYTHM) at cycle 7 open. Fable's return should shape the DDs before LIFT; the packet itself stays here as the substrate record. If Fable's return surfaces a fourth track or an unexpected reframe, flag as `drafted-DD-NNN` and marker-line at top per README.md §Escalation-to-DD.

Convention documented at [`comms/README.md`](../README.md) §Escalation-to-DD.
