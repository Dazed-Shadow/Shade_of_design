---
title: SoD Museum — Fable 5 prompt brief (Saturday-morning test substrate)
maintained_by: Mr. C (Chief of Staff)
purpose: Enhanced prompt substrate for JR's Saturday-morning Fable 5 test. Consumes the "intro.md" file JR authored; adds planner-plus-critic scaffold, function-over-form scoping, brand-palette anchoring, LOFI_SANCT integration, and skill-set spec for the receiving Opus instance. Written to maximize the value of the free-window prompt fires (Fable 5 paid-plan 50% weekly usage available through 2026-07-07).
authored_by: Mr. C
first_captured: 2026-07-03
tags: [sod-museum, foc, fable-5, central-hub-extension, project-planning, dual-thinking]
foc_note: This is a project FOC JR flagged 2026-07-03 as "not in usual location" (i.e., not yet LIFTed into Off_COS_PLANNING.md or captured as a DD). If the Fable test surfaces a shape worth committing to, LIFT candidacy activates.
---

# SoD Museum — Fable 5 Prompt Brief

## What this document is

This is the prompt substrate for JR's Saturday-morning Fable 5 test on the SoD Museum project. It takes the intro file JR wrote (`Shade of Direction - Museum to remember to move forward- intro.md`) and adds four things Fable needs to produce a useful implementation strategy:

1. **Planner-plus-critic scaffold** — makes the "let the fight of thoughts find the truth" directive concrete
2. **Function-over-form scoping** — turns the FOF rule into an MVP-vs-full-scope frame Fable can operate on
3. **Brand + palette anchoring** — connects the museum aesthetic to Shade of Design's existing palette (Ink / Ember / Slate / Paper) so the museum reads as extension, not standalone
4. **LOFI_SANCT + landing-page + voice-arc integration** — names the three existing surfaces the museum plugs into so Fable doesn't propose duplicate infrastructure

## The window (why Saturday morning matters)

Fable 5 redeployed 2026-07-01 after the June export-control window. **Paid plans get up to 50% of weekly usage limits on Fable 5 through 2026-07-07**; usage credits are required after. Today is 2026-07-03; JR's Saturday-morning test lands on 2026-07-04 — right in the middle of the free-window arc. **Four days of Fable at half-cost is the arc for this prompt-test → refine loop.** After July 7, iteration continues on credits or shifts to Opus.

**Plan for the four days:**
- **Fri 07-03:** first Fable fire using this brief. Fable outputs implementation strategy + skill set for receiving Opus.
- **Sat 07-04:** JR reviews Fable's output; Mr. C helps sharpen the strongest thread + kills the weakest.
- **Sun 07-05 / Mon 07-06:** second Fable fire on the refined thread. Produces the handoff document that comes back to COS.
- **Post-07-07:** COS captures the handoff as a JR_DD (Dream Catcher entry) or direct DD depending on shape; LIFT skill can promote if scope warrants.

## The full prompt substrate for Fable

*This is what JR pastes into Fable Saturday morning. Everything below the line is the prompt.*

---

**You are Fable 5, invoked to plan the Shade of Direction Museum — a 5th-project extension of shadeofdesign.net.**

I am providing you with a project intro document (attached separately) and this prompt brief. Your task is defined by two rules from the intro file, restated here for emphasis:

1. **ONLY WRITE THE IMPLEMENTATION STRATEGY AND SKILL SET WE SHOULD PROVIDE TO AN OPUS INSTANCE.** You are not building the museum; you are planning what to give to Opus so Opus can build it.
2. **THINK IN PARALLEL, AS A PLANNER AND AS A CRITIC.** Let the fight of thoughts find the truth. Do not produce a single strategy — produce a planner-critic dialogue that surfaces trade-offs.
3. **FUNCTION OVER FORM IS THE PATTERN.** In every design choice, name the function first; the form is what serves it.

### Constraints Fable must respect

**Brand alignment:** The museum is an extension of Shade of Design. It inherits the SoD palette:
- **Ink** (`#0B1726`) — this is literally the obsidian aesthetic the intro requests
- **Ember** (`#C97B4A`) — this is the volcanic-gold accent
- **Slate** (`#5D809D`) — shadow tones inside halls
- **Ocean** (`#1A3E62`) — depth tones for the "pressure of the earth" register
- **Paper** (`#FAFAF7`) — reserved for warm light-source moments (welcome greeting)
- **Marcellus** — heading typeface
- **Inter** — body typeface
- **JetBrains Mono** — for any code/UI text

Do not propose alternative palettes. Propose how these existing tokens compose into the museum's obsidian-and-gold hall aesthetic.

**LOFI_SANCT integration:** JR's music project (LOFI_SANCT / "Jahna" / "Mad Bunni") already has a catalog. The museum's music should draw from that catalog for hall ambient. Do not propose licensing other 80s/90s music — inspired-by tribute aesthetic only.

**Landing-page integration:** shadeofdesign.net currently has 4 project tiles (HZ, LOFI_SANCT, Central Hub, Unite Passion). The museum is the 5th. Propose the tile treatment + how the landing layout accommodates a 5-tile grid (does it become a 2x3 with one open slot? Do tiles resize? What does the entry-point aesthetic look like from the tile).

**Voice-arc integration (optional but flagged):** DD-015 is in flight — Mr. C is auditioning a voice this cycle. If the museum's "welcome home, [name]" greeting could later use Mr. C's voice, propose the architectural hook (audio-tag with runtime-loaded MP3, provider-agnostic) but do NOT make voice a launch dependency. The museum ships without voice; voice arrives when DD-015a locks a candidate.

**Legal constraints:** No arcade-ROM emulation. Arcade experiences are stylistic tributes / original mini-games in the visual language of the era. No copyrighted music beyond Jahna's own catalog. Family-first accessibility (keyboard navigation, screen reader labels, WCAG-AA color contrast).

### The planner-critic dialogue you must produce

For each of the following design decisions, produce a **Planner voice** proposing an approach and a **Critic voice** attacking it. Then produce a **Synthesis** that reconciles or picks a winner.

1. **Entry experience — warmth + returning-user greeting**
   - Planner: propose the visual + interaction shape of the entry screen
   - Critic: attack scope, complexity, accessibility risk, mobile fit
   - Synthesis: what actually ships in MVP vs. what waits for v2

2. **Walking simulator vs. 2D navigation**
   - Planner: propose the movement model (first-person WebGL walking simulator, per the intro)
   - Critic: attack WebGL complexity, mobile compatibility, load time, accessibility, licensing of any 3D asset libraries
   - Synthesis: does MVP ship as first-person walking, or as progressive-enhancement (2D on mobile, WebGL on desktop)?

3. **Arcade machine hall themes**
   - Planner: propose hall layout for Racing / Shooters / Fighting / Classics / Self-Selected
   - Critic: attack scope of five halls at launch; propose which halls MVP ships with
   - Synthesis: MVP hall count + which theme leads

4. **Arcade machine interactivity**
   - Planner: propose the zoom-in-to-play mechanic per the intro
   - Critic: attack the scope of building N playable mini-games; propose alternative (screenshot-cabinet with legend + "coming soon" states)
   - Synthesis: how many playable, how many display-only, in MVP

5. **Music playback + LOFI_SANCT hooks**
   - Planner: propose ambient audio system, per-hall track assignment, volume/fade behavior
   - Critic: attack autoplay, mobile audio-context, browser-tab focus behavior, JR's catalog readiness
   - Synthesis: opt-in-only ambient, respect prefers-reduced-motion, catalog integration point

6. **5th-tile landing-page integration**
   - Planner: propose the tile treatment on shadeofdesign.net (visual, copy, CTA)
   - Critic: attack landing-page layout change risk, potential for breaking existing 4-tile balance
   - Synthesis: minimum landing-page delta to accommodate the 5th tile

7. **Returning-user personalization**
   - Planner: propose localStorage-based name persistence + greeting variant
   - Critic: attack privacy, first-visit UX, data-persistence edge cases (incognito, cross-device)
   - Synthesis: how personalization degrades gracefully

### The output shape Fable should produce

**Section 1 — Implementation Strategy (for Opus).** ~1500 words. Structured as:
- MVP scope (what ships in v1)
- Progressive-enhancement scope (what v2 adds)
- Architecture at the module level (frontend, asset pipeline, audio, personalization)
- Integration points with existing SoD infrastructure
- Explicit constraints Opus must respect (brand palette, LOFI_SANCT catalog, no ROM emulation, accessibility floor)

**Section 2 — Skill Set for Opus.** ~500 words. What capabilities the Opus instance building this needs:
- Frontend framework choice + rationale
- 3D vs. 2D toolkit recommendation
- Asset pipeline (image, audio, font)
- Personalization tech
- Test / verify strategy
- Ship gates (accessibility, mobile, brand-compliance)

**Section 3 — Planner-Critic Dialogue Log.** Preserve the seven dialogues from above as a #reasoning-archive.

**Section 4 — Handoff to COS.** ~300 words. Written directly to me (Mr. C at COS). What Opus needs from me at handoff, what decisions remain JR's, what the LIFT-to-DD candidacy looks like.

---

*End of Fable prompt substrate. JR: paste everything from the horizontal rule after "The full prompt substrate for Fable" through the horizontal rule above this line, along with the intro.md file, into Fable Saturday morning.*

## What Mr. C is doing in parallel this weekend

DD-015a voice auditions run on JR's timeline (ElevenLabs account creation + Round 1 firings). The museum project runs on Fable's timeline. These are genuinely independent — no shared dependencies that block either.

**Shared point of convergence (later, not now):** if DD-015a locks a voice AND the museum needs a "welcome home, [name]" greeting, Mr. C's voice can supply the greeting narration. That's a Phase-2 voice-arc consumer, not a launch dependency. Flagged in the Fable brief above.

## FOC capture note

JR flagged 2026-07-03 that this project is a **FOC not in the usual location** — meaning it's not yet in `Off_COS_PLANNING.md` (JR Extension Dream Catcher) or captured as a DD. This is fine for now:

- Fable-test surfaces shape first
- Handoff document from Fable comes back to COS
- If shape is worth committing to, Mr. C LIFTs it — either JR authors a `JR_DD` entry in Off_COS_PLANNING.md for me to LIFT via Skill 2, or JR gives me a "shared stamp of accepted" like DD-015a and I capture directly as a DD in the accepted state

Either path works. No pressure to formalize before the shape is known.

## Cross-references

- **`Terminal/Central Hub/SOD MUSEUM/Shade of Direction - Museum to remember to move forward- intro.md`** — JR's original intro file (the substrate this brief consumes)
- **`Terminal/Central Hub/CLAUDE.md`** — Central Hub agent guide (museum is Central Hub extension)
- **`MR_C_BOOTSTRAP.md`** §1 — brand palette + typography anchors used in the Fable brief
- **`References/Designs/DD-015a Voice audition against Character Brief.md`** — parallel voice-arc work; museum welcome-greeting is a Phase-2 consumer
- **`Diary Reports/morning-brief-2026-07-03.md`** — today's SoN carries the Fable 5 redeployment context in the Outside section

## Changelog

- **2026-07-03 — Fable prep brief authored by Mr. C.** Written to maximize value of the Fable 5 free-window (through 2026-07-07). Planner-plus-critic scaffold, function-over-form scoping, brand-palette anchoring, LOFI_SANCT + landing-page + voice-arc integration constraints. Ready for JR's Saturday-morning fire.
