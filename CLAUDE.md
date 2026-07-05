# Central Hub (Shade_of_design) — Agent Guide

Central Hub is the **content arm of HZ** and the portfolio's structural anchor — a five-agent content + outreach pipeline (C-Transit · C-Phile · C-SPOTTER · C-MainLiner · C-Comms) plus the Shade of Design landing site and its project extensions (Unite Passion; SoD Museum). Other projects link *to* Central Hub, not the reverse.

## Agent rhythm

Opus plans/reviews → Sonnet implements → **the Obsidian vault (Chief of Staff Diary) is source of truth** for shared memory, session logs, and decisions. Architectural decisions land in `pipeline/DECISIONS.md` with a `D-NNN` id (reference the id in commit messages).

**Invoke Opus** for: agent-contract changes (`pipeline/AGENTS.md`), new agents, or any change to the human-review gate. Trivial fixes skip Opus.

## Non-negotiables

- **Human-review gate.** Every public-facing output reaches JR for sign-off first. Draft-only by default; no autonomous posting.
- **One voice owner.** Templating + voice decisions live in C-Phile — no parallel templating elsewhere.
- **HZ is upstream.** Don't duplicate contract logic here — call HZ.

## Cross-references

- `MR_C_INDEX.md` — portfolio context + related projects
- `pipeline/PIPELINE.md` — pipeline architecture (authoritative) · `pipeline/AGENTS.md` — per-agent contracts · `pipeline/DECISIONS.md` — decision log
- Shipping site: `quick-front-end/shade-of-design-landing/` (the true working tree). The `shade-of-design-site/` + `-normalized/` folders are frozen port-bundle artifacts — do not touch.
