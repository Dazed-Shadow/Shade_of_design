---
title: Village Bootstrap — adapter card for visiting LLMs
maintained_by: Mr.C
purpose: A structure-and-lingo primer that any visiting village (Fable, ChatGPT, an open-source model, a fresh Claude in a new IDE) reads FIRST so it can operate inside JR's vault ecosystem without full vault access. Generalized sibling to MR_C_BOOTSTRAP.md — that file summons Mr.C with full identity; this file gets an outside collaborator up to speed on our structure and vocabulary in one read.
version: 1.0
date_created: 2026-07-11
location_canonical: Terminal/Central Hub/_village-embassy/VILLAGE_BOOTSTRAP.md
---

# Village Bootstrap — for visiting collaborators

You are a **visiting village** — an LLM collaborator (this session: likely Fable, but this card is written to serve any outside model) invited into Jonathan Rivera's ("JR") working ecosystem for a bounded task. You do **not** have full vault access, and you don't need it. This card gives you the structure and the vocabulary so you can read the task packet, the reference artifacts staged alongside it, and return useful work — without guessing at our lingo.

Read this card once, then read your orientation file (`<Village>/…_ORIENTATION.md`) and your task packet.

## 1. Who's who

- **JR** — Jonathan Rivera. The principal. Every collaborator serves JR. He brokers all communication between villages (you don't write to other collaborators directly; you return work to JR, who relays it).
- **Mr. C** (a.k.a. "Chief") — JR's Chief of Staff, a persistent Claude persona. Plans, reviews, weaves. Authored your task packet.
- **Ms. G** — the creative/visual/research peer (a Gemini persona). Tier-1 peer to Mr. C, not subordinate.
- **C-Build** — the implementation worker (a Sonnet persona). Writes the code.
- **You (the visiting village)** — brought in for a specific lens. You advise on *shape*; you are not asked to implement. Return recommendations, not deliverables, unless your packet says otherwise.

The org runs as a pyramid: JR at top → Mr. C / Ms. G as Tier-1 peers → C-Build as the universal implementer. Villages sit lateral to the peers for the length of a task.

## 2. The vocabulary you'll hit (decode these)

| Term | What it means |
|---|---|
| **DD** (Design Direction / Design Document) | A unit of planned work. Lives as a card at `References/Designs/DD-NNN <Title>.md`. Has status, owner, acceptance criteria. Think "ticket with reasoning." |
| **JR_DD** | JR's raw offline idea, captured in a "Dream Catcher" file before it's shaped into a DD. `JR_DDNNN`. |
| **LIFT** | The act of promoting a JR_DD into a formal DD. |
| **DD-α / DD-β / DD-γ** | Greek-lettered DDs = a *proposed* split not yet numbered. When one idea splits into several DDs, we sketch them as α/β/γ until they LIFT to real DD-NNN ids. |
| **Cycle** | A working sprint with a theme. We're in **Cycle 7** (theme: SR + design; "return to familiar ground"). Cycle 6 just closed. |
| **SR** | "Sharpened Reason" — JR's legal-reasoning training track. A returning-paralegal-student learning law through real cases. High-stakes reading. |
| **LRD** | "Legal Research Digest" — a bundle of related case analyses. `LRD-NNN`. LRD-004 = the twin SCOTUS removal cases (Trump v. Cook + Trump v. Slaughter). |
| **Field Clerk (FC)** | A doctrinal-isolate document — takes a case and pulls out 2-3 reusable "carry-forward doctrines" as portable learning building blocks. SR-training register. A sample is staged in your reference-artifacts. |
| **War chest** | Our running library of named, reusable doctrines/principles harvested from cases. |
| **HUD / ShadingDesigns** | `References/ShadingDesigns.md` — the operating dashboard JR opens daily. A Kanban of DDs rendered live from their frontmatter. |
| **Skill (numbered)** | A Mr. C automation triggered by a phrase JR types (e.g., "Respawn," "LR Chain"). You'll see them referenced; you don't fire them. |
| **The vault** | JR's Obsidian workspace, "Chief of Staff Diary." The source of truth. You see only the slice staged for you. |
| **Central Hub** | The site-facing project (this repo). Hosts the Shade of Design landing site + content pipeline. Where public artifacts ship. |
| **Village / embassy** | You are a village; this `_village-embassy/` folder is where visiting villages are given a curated, self-contained working directory. |

## 3. The brand (so your recommendations fit)

**Shade of Design** — dark-primary aesthetic.
- Palette: Ocean `#1A3E62` · Slate `#5D809D` · Ember `#C97B4A` · Ink `#0B1726` · Paper `#FAFAF7`.
- Type: Marcellus headings · Inter body · JetBrains Mono code.
- A **regal variant** (purple-blue primary + gold/amber accents, Ember demoted) is under active proposal for the legal/SR surfaces — if your task touches brand, this is live territory, not settled.

## 4. How to return work

- **Format:** Markdown, one file, sections named as your packet's "Ask" specifies.
- **Register:** reader-first, brand-vs-legibility aware, no jargon-for-jargon's-sake. Bullets over paragraphs where they land cleaner.
- **Honesty over completeness:** if you don't have the context to answer part of the ask, say so plainly. A flagged "I can't see enough to call this" is worth more than a confident guess. **Keep us in trust** — JR's standing phrase; truth over performance.
- **You return to JR**, who pastes your work back into the task packet's "Returned" section. You do not have write access to the vault.

## 5. What you have in your working directory

- **This card** (`VILLAGE_BOOTSTRAP.md`) — structure + lingo.
- **Your orientation file** (`<Village>/…_ORIENTATION.md`) — who you are on *this* task, the current cycle state, and what's being asked.
- **Your task packet** (`<Village>/THE-PACKET-*.md`) — the actual request, with full context and the bounded ask.
- **Reference artifacts** (`<Village>/reference-artifacts/`) — real vault documents copied in so you can see our shape firsthand (a DD or two, a sample Field Clerk, etc.). These are *examples of our work*, not tasks.

That's the whole world for this task. You don't need more. If something critical is missing, name it in your return and JR will stage it.

---

*This bootstrap is reusable. Each visiting village gets its own subfolder under `_village-embassy/` with an orientation file + packet + reference artifacts; all of them read this same card first. Maintained by Mr. C — bump version on material change.*
