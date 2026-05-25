# Agent Contracts

One section per agent. Each contract has: **inputs · outputs · owned scripts · escalates when**.

---

## C-Transit — intake

**Role:** Bring raw source material into the pipeline. No interpretation, no templating.

- **Inputs:** RSS feeds, article URLs, manually-flagged links from JR.
- **Outputs:** Normalized article records (title, url, body text, source, fetched_at) written to `hz/*/research/data/inbox/`.
- **Owned scripts:** `scripts/transit_fetch_feeds.py`, `scripts/transit_fetch_url.py`
- **Escalates when:** Source returns paywall, 403, or content < N chars (flag for JR, don't synthesize).

## C-Phile — synthesis + templating

**Role:** Owns the voice. Turns raw articles into blog HTML and social drafts. Templating lives here so voice and structure don't drift apart.

- **Inputs:** Normalized articles from C-Transit; voice reference doc (`Weaving I am Content.docx`); templates per channel.
- **Outputs:** Draft blog HTML + per-channel social drafts, written to a Notion "Drafts" queue.
- **Owned scripts:** `scripts/phile_synthesize.py`, `scripts/phile_render_template.py`
- **Escalates when:** Source article is opinion-loaded, politically charged, or makes a claim Phile can't verify against ≥2 sources. Drops to JR queue with reason.

## C-SPOTTER — target enrichment (merged)

**Role:** Single pass over NAICS-matched small businesses. Finds them, captures social presence AND public financial signals in one record. (Merged from original SPOTTER + Prospect — see DECISIONS.md.)

- **Inputs:** NAICS code list from HZ config; SBA cert search; public business registries.
- **Outputs:** Enriched candidate record per business: `{name, naics, location, social_handles{}, public_financials{}, gov_award_history_flag}`. Written to `hz/*/research/data/candidates/`.
- **Owned scripts:** `scripts/spotter_find.py`, `scripts/spotter_enrich.py`
- **Escalates when:** Business has no public footprint (no website, no social, no filings) — skip silently with a "thin-signal" log entry, do not waste a JR review slot.

## C-MainLiner — contract & award data

**Role:** Rides on the existing HZ SAM.gov pipeline. Pulls past awards plus contracts expiring in the next 4 weeks under the active NAICS set.

- **Inputs:** NAICS list; `research/fetch_awards.py` output.
- **Outputs:** Two datasets per cycle: `awards_history.json`, `expiring_contracts.json`. Both written to `hz/*/research/data/contracts/`.
- **Owned scripts:** Extends `research/fetch_awards.py`; new `research/fetch_expiring.py`.
- **Escalates when:** API returns < expected volume (possible SAM.gov outage) — log and surface in next C-Comms packet.

## C-Comms — review packet assembly

**Role:** Final stop before JR. Bundles candidates + contract context + drafts into a single Notion page per cycle, with a recommendation per candidate.

- **Inputs:** Candidate records (SPOTTER), contract data (MainLiner), drafts (Phile).
- **Outputs:** One Notion page per review cycle: candidates ranked, rationale ("why this business now"), draft outreach email per candidate, draft social posts ready to publish.
- **Owned scripts:** `scripts/comms_assemble_packet.py`, `scripts/comms_publish_to_notion.py`
- **Escalates when:** Always. C-Comms is the human gate — every cycle ends in JR review. Nothing posts without explicit JR action.

---

## Universal rules

- **No agent posts publicly.** Publishing is a manual step JR runs after approving the packet.
- **All tokens in `.env`** at the project root, never committed.
- **One source of truth for the NAICS list** — read from HZ config, do not duplicate.
- **Log to `hz/*/research/data/_logs/<agent>_<date>.jsonl`** for every run; review weekly.
