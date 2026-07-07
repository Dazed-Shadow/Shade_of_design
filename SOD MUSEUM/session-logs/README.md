---
title: SoD Museum — session logs
purpose: Vault surface for the museum project's session logs. Per Fable's implementation strategy §1.5 (amended 2026-07-03), Notion is retired; the Chief of Staff Diary vault is the source of truth for shared memory. This directory carries per-session logs from Opus reviews + Sonnet implementation passes. D-NNN architectural decisions still land repo-side in `pipeline/DECISIONS.md` per Central Hub convention; strategic + calibration state lives here.
maintained_by: Mr. C
first_captured: 2026-07-04
tags: [sod-museum, dd-032, session-logs, vault-anchor, notion-retirement]
---

# SoD Museum — Session Logs

## What lives here

This directory is the vault-side memory surface for the SoD Museum project (DD-032). It replaces the Notion-based session log pattern that other Central Hub projects previously used (per the vault-wide Notion retirement noted in Fable's implementation strategy §1.5).

**What goes in a session log:**

- Opus review sessions (architecture decisions, manifest-schema calls, accessibility gate calls)
- Sonnet implementation session summaries (what shipped, what deferred, what to review next)
- JR sign-off gates (which ship condition cleared, JR's calibration notes)
- Cross-project touchpoints (LOFI_SANCT catalog updates that flow into `audio.json`; DD-015a voice locks that flow into `greeting.json.audioUrl`)

**What stays elsewhere:**

- Architectural decisions with D-NNN ids → `pipeline/DECISIONS.md` (repo-side, Central Hub convention)
- The DD itself (state, chain blocks, ship gates) → `References/Designs/DD-032 SoD Museum — rotunda plus Classics hall.md`
- Implementation code and manifests → `quick-front-end/shade-of-design-landing/museum/` (the true site path)
- The Jahna track raw source → `Terminal/Central Hub/SOD MUSEUM/audio/`
- Fable's original planning artifact → `Terminal/Central Hub/SOD MUSEUM/Shade of Direction - Museum - Fable Implementation Strategy.md`

## File naming

```
session-log-YYYY-MM-DD-<slug>.md
```

Examples:
- `session-log-2026-07-05-opus-arch-review.md`
- `session-log-2026-07-08-sonnet-threshold-ship.md`
- `session-log-2026-07-12-jr-audio-signoff.md`

## Standard session log frontmatter

```yaml
---
session_date: YYYY-MM-DD
session_type: opus-review | sonnet-impl | jr-signoff | cross-project
participants: [Opus, Sonnet, JR, Mr.C, Ms.G]
dd_touched: [DD-032, ...]
ship_gate_cleared: <ship-gate-name-if-applicable>
next_session_signal: <what triggers the next log entry>
tags: [sod-museum, ...]
---
```

## Cross-references

- **DD-032:** `References/Designs/DD-032 SoD Museum — rotunda plus Classics hall.md`
- **Fable implementation strategy:** `Terminal/Central Hub/SOD MUSEUM/Shade of Direction - Museum - Fable Implementation Strategy.md`
- **Fable prompt brief (Mr. C-authored substrate):** `Terminal/Central Hub/SOD MUSEUM/Shade of Direction - Museum - Fable prompt brief.md`
- **JR intro file:** `Terminal/Central Hub/SOD MUSEUM/Shade of Direction - Museum to remember to move forward- intro.md`
- **Central Hub agent guide:** `Terminal/Central Hub/CLAUDE.md`

## Changelog

- **2026-07-04** — Session-log directory established per Fable strategy handoff Section 4 ask #2. First session log lands when Opus review kicks off (post-JR route-decision sign-off).
