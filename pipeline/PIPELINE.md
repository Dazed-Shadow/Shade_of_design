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
- **One Notion review queue.** C-Comms writes there; JR approves there.
- **Tokens in `.env` per project**, not shared. Mirrors HZ + LOFI canonical pattern.
- **Scripts over MCPs** for every platform integration — see PLATFORMS.md for why.

## Related docs

- [AGENTS.md](AGENTS.md) — per-agent contracts, scripts, escalation rules
- [PLATFORMS.md](PLATFORMS.md) — API/auth matrix per platform
- [DECISIONS.md](DECISIONS.md) — why the plan looks like this (ADR-lite log)
