# Agent Contracts

One section per agent. Each contract has: **inputs · outputs · owned scripts · escalates when**.

---

## C-Transit — intake

**Role:** Bring raw source material into the pipeline. No interpretation, no templating.

**Multi-source mode** (D-011): C-Transit reads from `research/feeds.toml`, a TOML registry of enabled feeds. Each feed produces its own dated JSONL in `inbox/` (`<slug>_<YYYY-MM-DD>.jsonl`). Disabled entries are skipped without error.

**Current feed categories:** `smallbiz` · `policy` · `tech` · `ai` · `health` · `world`

- **Inputs:** Feed registry (`research/feeds.toml`); each enabled entry is fetched in order.
- **Outputs:** Normalized article records — `{title, url, body, source, source_name, category, fetched_at}` — written to `hz/*/research/data/inbox/`, one file per feed per day.
- **Owned scripts:** `scripts/transit_fetch_feeds.py`, `scripts/transit_fetch_url.py`
- **CLI flags:** `--limit N` (per feed), `--no-body`, `--body-delay`, `--max-body-chars`, `--feeds-config PATH`
- **Logging:** Per-feed entry counts to stdout; aggregate `record_count` in `log_run`.
- **Escalates when:** Source returns paywall, 403, or content < N chars (flag for JR, don't synthesize).

## C-Phile — synthesis + templating

**Role:** Owns the voice. Turns raw articles into blog HTML and social drafts. Templating lives here so voice and structure don't drift apart.

**Split into prep + consume** (see D-006). The Python script prepares self-contained synthesis bundles; a Claude Code session (scheduled or ad-hoc) is the consumer that produces the actual drafts. No metered Anthropic API key required.

- **Inputs:** Normalized articles from C-Transit; voice reference doc (`Weaving I am Content.docx`).
- **Outputs (prep stage):** One markdown bundle per article at `research/data/drafts/_pending/phile_<ts>_<NN>.md`. Bundle contains voice excerpt + article + task + output protocol. `<NN>` is a zero-padded 2-digit sequence within the batch (see D-009).
- **Outputs (consume stage — per article):** Three files per article in `research/data/drafts/_done/`:
  - `phile_<ts>_<NN>_social.txt` — plain text social post (≤280 chars)
  - `phile_<ts>_<NN>_blog.html` — HTML blog draft (`<h1>` + 2–3 `<p>` paragraphs)
  - `phile_<ts>_<NN>_visual.md` — visual direction file (GEM template: writing / visual direction / brand integration / suggested image prompt). The image prompt is ready-to-paste into Gemini Image / Midjourney / DALL-E.
  Bundle moved to `research/data/drafts/_consumed/`.
- **Outputs (consume stage — batch packages):** After all articles in a batch are consumed, `scripts/phile_package.py --batch <ts>` assembles two consolidated review documents in `research/data/drafts/_packages/`:
  - `phile_batch_<ts>.html` — brand-themed (Deep Ocean Blue #0B2C4D / Slate Grey-Blue #5A7795), sticky TOC, card layout with social char-count badge, blog rendered inline, visual direction styled, image prompt in copy-ready code block.
  - `phile_batch_<ts>.md` — portable; renders cleanly in Notion / Obsidian / GitHub / Tumblr. Social in code block, blog as readable text, visual direction raw markdown, image prompt in code block.
  Per-article files are kept for audit and grab-one workflows (see D-013).
- **Owned scripts:** `scripts/phile_synthesize.py` (prep), `scripts/phile_package.py` (batch package assembly), `scripts/phile_catalog.py` (article catalog). Future: `scripts/phile_render_template.py` for per-channel variants.
- **Batch mode:** `--count N` flag produces N bundles in one invocation. Default is 1. Single-run filenames use `_01` suffix (uniform scheme — see D-009). Batch selection round-robins across categories — reads all today's inbox JSONLs (one per feed), dedupes by URL, then picks one article per category per round until `count` is reached. If a category runs dry it is skipped. See D-011 for algorithm details.
- **Cross-batch dedupe** (D-017): before selecting articles, `pick_articles` scans `research/data/drafts/_consumed/*.md` and builds a set of previously-synthesized URLs. Any inbox article whose URL is already in that set is excluded from the picker pool. Log line: `[INFO] Excluded N already-consumed URL(s) from picker pool.` Use `--allow-duplicates` to skip dedupe (e.g. re-synthesizing a thin-body article after the body extractor was fixed).
- **Consumers:**
  - **Option A (default automation):** scheduled Claude Code agent watches `_pending/` and processes bundles.
  - **Option B (standard on-call):** `/synth-batch [N]` slash command. Runs prep + synthesis end-to-end in one Claude Code session. Defaults to N=5 if no argument given. Writes `_social.txt`, `_blog.html`, and `_visual.md` to `_done/`, moves bundles to `_consumed/`, runs `phile_package.py` to assemble the two batch review packages, runs `phile_catalog.py` to refresh the article catalog, and prints a summary packet with package and catalog paths.
- **Article catalog** (D-017): `scripts/phile_catalog.py` rebuilds three files in `research/data/drafts/_catalog/` from the current `_consumed/` state:
  - `articles.jsonl` — machine-readable, one JSON object per consumed article, sorted newest first.
  - `index.html` — brand-themed sortable table; click column headers to re-sort by Consumed / Source / Category / Title / Batch.
  - `summary.md` — counts by source, counts by category, 14-day activity timeline.
  Fully idempotent; no state to manage.
- **Escalates when:** Source article is opinion-loaded, politically charged, or makes a claim the consumer can't verify against ≥2 sources. Bundle stays in `_pending/`, JR is notified.

## C-SPOTTER — target enrichment (merged)

**Role:** Single pass over NAICS-matched small businesses. Finds them and enriches each record with contact and identity data in one run. (Merged from original SPOTTER + Prospect — see DECISIONS.md.)

**Pipeline mode v2** (D-015): candidates JSONL now includes CAGE code, business website, email, contact name, and SAM profile URL where available. Enrichment runs inline in `spotter_find.py` — no separate script required.

- **Inputs:** NAICS code list from HZ config; SBA cert search (Playwright-driven React SPA).
- **Outputs:** Enriched candidate record per business (one JSON per line):
  ```
  {
    name, naics, url,                    ← v1 fields (stable)
    cage_code,                           ← CAGE code from SBA profile (null if not on page)
    business_website,                    ← company website (null if not on page)
    email,                               ← POC email (null if not on page)
    contact_name,                        ← POC name (null if not on page)
    sam_profile_url                      ← SAM.gov entity link (always null for now — SBA doesn't link out; Phase 2)
  }
  ```
  Written to `hz/*/research/data/candidates/spotter_<YYYY-MM-DD>.jsonl`.
- **Owned scripts:** `scripts/spotter_find.py` (find + enrich in one run), `scripts/spotter_package.py` (review package assembly)
- **Review packages** (D-015): after the enrichment run, `scripts/spotter_package.py --date <YYYY-MM-DD>` assembles two review files in `research/data/candidates/_packages/`:
  - `spotter_review_<date>.html` — brand-themed (Deep Ocean Blue #0B2C4D / Slate Grey-Blue #5A7795), accordion grouped by NAICS code, one business card per record, null fields shown as dimmed "not on profile" placeholders, all links open `target="_blank"`.
  - `spotter_review_<date>.csv` — clean tabular CSV, UTF-8-BOM, QUOTE_ALL. Columns: `name, naics_matched, cage_code, business_website, email, contact_name, sba_profile_url, sam_profile_url, jr_status, jr_notes, jr_priority`. Last three columns blank — JR annotation space.
- **Two operating modes** (see D-010):
  - **Pipeline mode** (no `--ad-hoc` flag): writes to `research/data/candidates/spotter_<YYYY-MM-DD>.jsonl` and logs timing via `log_run`. Used for all scheduled/prototype runs.
    ```
    # All 5 pipeline NAICS codes:
    backend/.venv/Scripts/python.exe scripts/spotter_find.py

    # Specific pipeline codes:
    backend/.venv/Scripts/python.exe scripts/spotter_find.py 561110 561990

    # With custom profile delay:
    backend/.venv/Scripts/python.exe scripts/spotter_find.py --profile-delay-seconds 2.0
    ```
  - **Ad-hoc mode** (`--ad-hoc` flag): prints a formatted results table to stdout only. No file writes, no log entry. Used for one-off research and exploring codes outside the pipeline set.
    ```
    backend/.venv/Scripts/python.exe scripts/spotter_find.py --ad-hoc 561110
    backend/.venv/Scripts/python.exe scripts/spotter_find.py --ad-hoc --limit-per-naics 5 541611 493110
    ```
  - **Package generation** (after a pipeline run):
    ```
    backend/.venv/Scripts/python.exe scripts/spotter_package.py --date 2026-05-28
    ```
- **Politeness:** `--delay-seconds` (default 1.5s) between NAICS code searches; `--profile-delay-seconds` (default 1.5s) between individual profile page dives. Enrichment adds N additional page loads (one per business) on top of the NAICS search.
- **Fail-soft enrichment:** any field missing on a profile is set to null and a gap warning is logged. One missing field never aborts the record or the run.
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
