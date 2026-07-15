# Content & Data Pipeline (P1)

**Project:** Shade_of_design (Central Hub) — content arm of HZ
**Status:** v1 plan, draft-only output (no autonomous posting)
**Last reviewed:** 2026-05-25

## Purpose

Pair the HZ contract-search backend with a content + outreach surface that:
1. Publishes a steady cadence of original blog / social content (creative arm).
2. Surfaces qualified small-business prospects under rotating NAICS codes (outreach arm).
3. Routes everything through a single human-review gate (JR) before any public action.

## The five agents

```
       ┌──────────────┐
       │  C-Transit   │  intake only — RSS, article fetch, raw sources
       └──────┬───────┘
              │ articles
              ▼
       ┌──────────────┐
       │   C-Phile    │  synthesis + templating (one voice owner)
       └──────┬───────┘
              │ draft posts (blog HTML, social, Tumblr)
              │
              │                ┌────────────────┐
              │                │  C-SPOTTER     │  NAICS targets → social + financial
              │                └──────┬─────────┘  enrichment in a single pass
              │                       │
              │                ┌──────▼─────────┐
              │                │  C-MainLiner   │  past awards + contracts ending
              │                └──────┬─────────┘  in next 4 weeks (NAICS-matched)
              │                       │
              ▼                       ▼
       ┌──────────────────────────────────┐
       │           C-Comms                │  assembles review packet:
       │  (review packet → JR → publish)  │  candidates, rationale, drafts
       └──────────────────────────────────┘
                       │
                       ▼
                    JR review
                       │
                       ▼
            manual publish scripts
            (one per platform, run by JR)
```

## NAICS rotation (current set)

`561110, 561990, 561320, 541611, 493110`

Rotate monthly until traction is locked. C-MainLiner and C-SPOTTER both read this list from a single source of truth in HZ's `research/` config.

## Outputs

| Channel | Format | Source agent |
|---|---|---|
| Blog | Claude-Design HTML on Cloudflare site | C-Phile (synthesis from C-Transit feed) |
| Twitter / FB / Reddit / Tumblr | Short posts from templates | C-Phile + C-MainLiner data |
| Outreach email (small business) | Personalized | C-Comms, data from C-SPOTTER |

**Itch.io is out of scope here** — it belongs to LOFI_SANCTUARY, where the creator-community fit is real.

## V1 guardrails

- **No autonomous posting.** All publishing is manual after JR review.
- **One review queue in the vault.** C-Comms writes review packets to the vault; JR approves there. (Notion retired portfolio-wide per DD-033, 2026-07-04.)
- **Tokens in `.env` per project**, not shared. Mirrors HZ + LOFI canonical pattern.
- **Scripts over MCPs** for every platform integration — see PLATFORMS.md for why.

## The standing chain (legal research)

DD-037 Phase 5 documents this as convention now that DD-026 has passed its
live real-content smoke test (2026-07-11, 26 opinions pulled, Gmail send
verified). Documentation only -- zero new code, zero coupling.

```
DD-026 fetch          CourtListener SEARCH API -> raw opinion PDFs +
                       per-fetch summary + email alert (JR-triggered,
                       deterministic plumbing only, no synthesis)
     |
     v
DD-029 synthesis       JR triggers "LR Chain [docket,...]" -> Mr.C reads
                       the named PDF in the active session, writes
                       research/data/legal/cases/<docket>.md (Mr.C-only,
                       no subprocess, no API delegation)
     |
     v
corpus                 case.md / Field Clerk files land in
                       research/data/legal/{cases,field-clerks}/. JR marks
                       each file's visibility (Public | Private, defaults
                       Private -- DD-037 Standing Rule #6)
     |
     v
DD-037 export           pipeline/legal/sync_sr.py -> export_manifests.
                       run_export() reads the corpus directory, emits
                       validated JSON manifests + the vault-native
                       _SR-INDEX.md. Regenerates the working tree; commits
                       nothing.
     |
     v
JR merge                JR reviews the regenerated manifests, commits,
                       merges to main -- the human-review gate, and the
                       only step that publishes.
     |
     v
deployed                Netlify builds main; shadeofdesign.net/sr-playspace/
                       serves the merged manifests.
```

**The exporter never depends on DD-026 being live.** It reads
`research/data/legal/{cases,field-clerks}/` regardless of how a document
arrived there -- by the auto-fetch + LR Chain path above, by a manual
`LR Chain` invocation against a hand-placed PDF, or by JR authoring a
case.md directly. Documenting the chain is not wiring it: a DD-026 outage
never blocks a sync run.

## Related docs

- [AGENTS.md](AGENTS.md) — per-agent contracts, scripts, escalation rules
- [PLATFORMS.md](PLATFORMS.md) — API/auth matrix per platform
- [DECISIONS.md](DECISIONS.md) — why the plan looks like this (ADR-lite log)
