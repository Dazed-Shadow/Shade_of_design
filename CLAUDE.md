# Central Hub (Shade_of_design) — Agent Guide

Central Hub is the **content arm of HZ** — a five-agent pipeline that pairs HZ's contract-search backend with a content + outreach surface. It publishes original blog/social content under the "Shade_of_design" brand, surfaces qualified small-business prospects under rotating NAICS codes, and routes every output through a single human-review gate (Jon) before publishing.

This repo also hosts **Project Unity (Unite Passion)** as an extension page (merged 2026-05-31), and serves as the portfolio's structural anchor: other projects link *to* Central Hub, not the reverse.

## Stack

| Layer | Tech |
|---|---|
| Pipeline runtime | Python scripts in `pipeline/` + Claude Code sessions (no metered API key) |
| Frontend | React + JSX (Shade of Design landing + weekly + brand system pages) |
| Content surfaces | Blog HTML, Tumblr, social drafts (all draft-only — no autonomous posting) |
| Sibling backend | HZ (`GIT PROJS/HZ`) — contracts data feeds C-SPOTTER and C-MainLiner |

## Repo layout

```
pipeline/                   # The five-agent system
  PIPELINE.md               # Architecture (authoritative)
  AGENTS.md                 # Per-agent contracts: inputs · outputs · scripts · escalations
  DECISIONS.md              # Decision log
  PLATFORMS.md
quick-front-end/            # Landing pages, weekly publish surfaces
shade-of-design-site/       # Brand system + landing site (React)
  app.jsx, landing.jsx, weekly.jsx, sections.jsx, tweaks-panel.jsx
  Shade of Design - Brand System.html
  weeks/                    # Per-week generated artifacts
shade-of-design-site-normalized/   # Cleaned/canonical version
internal assets/            # Brand assets, image stock
scripts/                    # Repo-wide tooling
```

## The five agents (see `pipeline/PIPELINE.md` and `pipeline/AGENTS.md` for full contracts)

| Agent | Role |
|---|---|
| **C-Transit** | Intake only — fetches feeds (TOML registry in `research/feeds.toml`), normalizes articles to JSONL, no interpretation |
| **C-Phile** | Voice owner — turns articles into blog HTML + social drafts. Split into a prep script + a Claude Code consume session (D-006) so no metered API key is needed |
| **C-SPOTTER** | NAICS targets → social + financial enrichment in a single pass |
| **C-MainLiner** | Past awards + contracts ending in next 4 weeks, NAICS-matched |
| **C-Comms** | Assembles review packets (candidates, rationale, drafts) for Jon to approve before any public action |

## Conventions

- **Human-review gate is non-negotiable.** Every output reaches Jon for sign-off before anything goes public. Draft-only mode by default.
- **One voice owner.** All templating and voice decisions live in C-Phile — no parallel templating elsewhere.
- **Decisions get logged.** Every architectural choice is appended to `pipeline/DECISIONS.md` with a D-NNN id. Reference these ids in commit messages.
- **HZ is upstream.** Don't duplicate contract logic here — call HZ.

## Cross-references

- See `MR_C_INDEX.md` for portfolio context (one-page summary, related projects, Mr. C notes).
- **Sub-components:** PROJECT_UNITY (extension page, merged 2026-05-31).
- **Upstream sibling:** HZ (backend data source).
- **Brand system reference:** ALL_HEALTH's `MR-C-COMMAND-CENTER-BREAKDOWN.md` uses the same evergreen palette.

## Agent workflow (Opus + Sonnet + Notion)

Same pattern as HZ and LOFI_SANCTUARY:

| Agent | Role |
|---|---|
| **Opus** | Orchestrator — pipeline architecture changes, new agent contracts, cross-project tradeoffs |
| **Sonnet** | Implementer — writes scripts and tests under Opus guidance |
| **Notion** | Shared memory — decisions, backlog, session logs |

**When to invoke Opus:** any change touching agent contracts in `pipeline/AGENTS.md`, any new agent, any change to the human-review gate. Trivial fixes (typos, single-file patches) skip Opus.

## Session start checklist

1. Read this file and `MR_C_INDEX.md` first.
2. Skim `pipeline/PIPELINE.md` for current pipeline state and `pipeline/DECISIONS.md` for the latest D-NNN entry.
3. Check git status — Central Hub frequently has uncommitted work-in-progress from the Unity merge.
4. Confirm no autonomous-publish flags have been flipped on by accident.
