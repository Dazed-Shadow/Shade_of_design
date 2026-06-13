---
code: CENTRAL_HUB
name: Central Hub (Shade_of_design)
stage: Active build
purpose: Content + outreach arm of HZ — five-agent pipeline (C-Transit, C-Phile, C-SPOTTER, C-MainLiner, C-Comms) that drafts blog/social content and surfaces NAICS-matched prospects, all routed through Jon's human-review gate.
owner: JR
collaborators: [Claude (Opus + Sonnet), Notion]
notion: —
last_synced: 2026-06-02
related: [HZ, PROJECT_UNITY, ALL_HEALTH]
sub_components: [PROJECT_UNITY]
---

## Why it exists

Central Hub is the portfolio's structural anchor: it pairs HZ's contract-search backend with a content arm so Jon has a steady creative + outreach surface around the same audience HZ serves (veteran-owned LLCs, small business). Every other project in MR_C either feeds Central Hub or references its brand system.

## Current state

- Branch `main`, multiple dirty files (active development on the Unity merge from 2026-05-31).
- Five-agent pipeline architecture documented in `pipeline/PIPELINE.md`; decisions logged in `pipeline/DECISIONS.md`.
- React landing/weekly pages live in `shade-of-design-site/` and `shade-of-design-site-normalized/`.
- PROJECT_UNITY (Unite Passion dashboard) was merged in as an extension page on 2026-05-31.

## Next 3 moves

1. Commit and ship the in-flight changes from the Unity merge so working tree is clean.
2. Confirm Unity's surface area inside Central Hub is documented in `pipeline/PLATFORMS.md` (or similar).
3. Ensure the human-review gate (C-Comms → JR) is still the only path to any public surface after the merge — no autonomous flags introduced.

## Cross-project hooks

- **Pulls from HZ:** contract opportunities, NAICS data → C-SPOTTER and C-MainLiner.
- **Hosts PROJECT_UNITY** as an extension page (sub-component).
- **Shares brand language** with ALL_HEALTH's "evergreen" palette (see `MR-C-COMMAND-CENTER-BREAKDOWN.md` in MAINTAIN HEALTH).

## Mr. C notes

- This is the keystone. Decisions about portfolio structure should land here first.
- 18 dirty files on 2026-05-31 — risk of context loss if a long-running session ends before a commit. Worth nudging Jon to commit early.
- Project Unity was a peer in Jon's mental model until 2026-06-01; confirmed as extension. Future references should reflect that hierarchy.
