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

**Role:** Single pass over NAICS-matched small businesses. Finds them and enriches each record with contact and identity data in one run. Separate post-scrape enrichment passes add award history (USAspending.gov), website design-quality signals, and ownership flags from SBA profile PDFs. (Merged from original SPOTTER + Prospect — see DECISIONS.md.)

**Pipeline mode v5** (D-015 + D-020 + D-021 + D-023): candidates JSONL now includes CAGE code, business website, email, contact name, SAM profile URL, a PDF snapshot, award history, design-quality classification, and ownership flags.

- **Inputs:** NAICS code list from HZ config; SBA cert search (Playwright-driven React SPA).
- **Outputs (find + enrich pass):** Enriched candidate record per business (one JSON per line):
  ```
  {
    name, naics, url,                    ← v1 fields (stable)
    cage_code,                           ← CAGE code from SBA profile (null if not on page)
    business_website,                    ← company website (null if not on page)
    email,                               ← POC email (null if not on page)
    contact_name,                        ← POC name (null if not on page)
    sam_profile_url,                     ← SAM.gov entity link via UEI extraction (D-015 Phase 2)
    profile_pdf                          ← relative path to PDF snapshot, e.g.
                                           "research/data/candidates/_pdfs/9AZM9.pdf"
                                           null if --no-pdf or capture failed (D-020)
  }
  ```
  Written to `research/data/candidates/spotter_<YYYY-MM-DD>.jsonl`.
  PDF snapshots written to `research/data/candidates/_pdfs/<cage_code>.pdf`.
- **Outputs (awards enrichment pass — D-021):** Sidecar JSONL with all fields from the base record plus:
  ```
  {
    ...base fields...,
    award_status,       ← "has_awards" | "no_federal_awards_found" | "lookup_failed"
    first_award,        ← {date, amount, agency, description, contract_type, award_id} or null
    latest_award,       ← same shape, or null
    total_awards_count  ← integer (0 when no awards)
  }
  ```
  Written to `research/data/candidates/spotter_<YYYY-MM-DD>_awards.jsonl` (sidecar —
  original JSONL is never modified). `"no_federal_awards_found"` is the ground-floor
  signal: certified but no federal contract yet = high receptivity to outreach.
- **Outputs (classify + ownership passes — D-023):** Unified `_enriched.jsonl` sidecar,
  extending whichever file is the best available input. Fields added:
  ```
  {
    ...prior fields...,
    what_they_do,                 ← 1-2 sentence plain-language summary of the business
    design_quality,               ← "clean" | "dated" | "broken" | "no-site"
    geographic_scope,             ← "local" | "regional" | "national" | "unknown"
    tech_signals,                 ← {generator, has_ssl, has_viewport, framework_hint}
    ownership,                    ← {woman_owned, veteran_owned, service_disabled_veteran_owned,
                                     minority_owned, hubzone, "8a", raw_phrases}
                                     or null if PDF missing/unreadable
  }
  ```
  Written to `research/data/candidates/spotter_<YYYY-MM-DD>_enriched.jsonl`.
  Classify and ownership can run in either order; each merges into the same file without
  overwriting fields from the other pass.
- **Owned scripts:**
  - `scripts/spotter_find.py` — find + enrich + PDF in one run (Playwright)
  - `scripts/spotter_awards.py` — post-scrape awards enrichment via USAspending.gov (httpx, no key)
  - `scripts/spotter_classify.py` — website fetch + design-quality classification (D-023)
  - `scripts/spotter_ownership.py` — ownership flag extraction from SBA profile PDFs (D-023)
  - `scripts/spotter_package.py` — review package assembly (prefers _enriched.jsonl if present)
- **Review packages** (D-015 + D-020 + D-021 + D-023): after enrichment, `scripts/spotter_package.py --date <YYYY-MM-DD>` assembles two review files in `research/data/candidates/_packages/`:
  - `spotter_review_<date>.html` — brand-themed, accordion grouped by NAICS code. Each card includes: null fields dimmed, PDF link, Award History panel (D-021), and **Site & Identity panel** (D-022): design_quality badge (clean=green/dated=amber/broken=red/no-site=gray), what_they_do one-liner, geographic_scope tag, ownership chips. Panel omitted when no D-022 fields present (backwards-compatible).
  - `spotter_review_<date>.csv` — clean tabular CSV, UTF-8-BOM, QUOTE_ALL. New column order: `name, naics_matched, cage_code, business_website, design_quality, what_they_do, geographic_scope, woman_owned, veteran_owned, service_disabled_veteran_owned, minority_owned, hubzone, is_8a, email, contact_name, pdf_path, award_status, first_award_date, first_award_amount, first_award_agency, latest_award_date, latest_award_amount, latest_award_agency, total_awards_count, sba_profile_url, sam_profile_url, jr_status, jr_notes, jr_priority`.
  - **Annotation preservation (D-021):** before writing the CSV, the packager reads any existing CSV at the output path and carries forward `jr_status`/`jr_notes`/`jr_priority` keyed on `cage_code`. Packager is idempotent: JR can re-run after editing the CSV in Excel without losing annotations.
  - **Cascade behavior (D-022):** packager prefers `_enriched.jsonl` → `_awards.jsonl` → `.jsonl`. Running packager before any enrichment still works.
- **Typical run sequence:**
  ```
  # Step 1 — find + enrich + PDF (Playwright, ~5 min for 50 businesses)
  backend/.venv/Scripts/python.exe scripts/spotter_find.py

  # Step 2 — award history enrichment (USAspending.gov, ~40s for 50 businesses at 0.75s delay)
  backend/.venv/Scripts/python.exe scripts/spotter_awards.py

  # Step 3 — design quality + site summary (httpx, 1.5s/site, ~75s for 50 businesses)
  backend/.venv/Scripts/python.exe scripts/spotter_classify.py --date <YYYY-MM-DD>

  # Step 4 — ownership flags from PDFs (local pypdf, fast)
  backend/.venv/Scripts/python.exe scripts/spotter_ownership.py --date <YYYY-MM-DD>

  # Step 5 — package for review (picks up _enriched.jsonl automatically)
  backend/.venv/Scripts/python.exe scripts/spotter_package.py --date <YYYY-MM-DD>
  ```
  Steps 3 and 4 can run in either order. Steps 3+4 each read the best available
  input (cascade) and write to `_enriched.jsonl` with merge semantics.
- **Two operating modes for find** (see D-010):
  - **Pipeline mode** (no `--ad-hoc` flag): writes to `research/data/candidates/spotter_<YYYY-MM-DD>.jsonl` and logs timing via `log_run`.
  - **Ad-hoc mode** (`--ad-hoc` flag): prints formatted results to stdout only. No file writes, no log entry. Used for one-off research.
- **CLI flags (spotter_find.py):** `--limit-per-naics N` · `--headed` · `--delay-seconds` · `--profile-delay-seconds` · `--ad-hoc` · `--no-pdf`
- **CLI flags (spotter_awards.py):** `--date YYYY-MM-DD` (default today) · `--delay-seconds F` (default 0.75) · `--limit N` (default all)
- **CLI flags (spotter_classify.py):** `--date YYYY-MM-DD` (default today) · `--delay-seconds F` (default 1.5) · `--limit N` (default all)
- **CLI flags (spotter_ownership.py):** `--date YYYY-MM-DD` (default today) · `--limit N` (default all)
- **Politeness:** Find: 1.5s between NAICS code searches, 1.5s between profile dives. Awards: 0.75s between USAspending queries (configurable). Classify: 1.5s between website fetches (configurable). Ownership: no delay (local PDF reads).
- **Fail-soft enrichment:** any field missing on a profile is set to null and a gap warning is logged. Per-business failures in any enrichment pass log errors but never abort a record or the run.
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

## C-Legal — legal data (CourtListener)

**Role:** Pull federal administrative-law opinions from the CourtListener API and normalize them to a locked JSON + Markdown schema. Cache-first design: fetch and normalize are decoupled scripts so neither re-runs the other.

**Court scope** (DD-021 MVP): SCOTUS + D.C. Circuit (`scotus`, `cadc`). Configurable via `--courts` CLI flag.

- **Inputs:** CourtListener v4 opinions API (auth via `secrets/keys.txt` `### Court Listener` section); raw opinion cache at `research/data/legal/cache/<case_id>.json`.
- **Outputs:**
  - `research/data/legal/cache/<case_id>.json` — raw API response per opinion (fetch script)
  - `research/data/legal/normalized/<case_id>.json` — locked DD-021 schema: `{case_id, citation, court, date_filed, area_of_law, jurisdiction, opinion_text_md, summary_md, source_url}`. Null for any field not available in the opinion-level cache record — never empty string or placeholder.
  - `research/data/legal/normalized/<case_id>.md` — companion Markdown with YAML frontmatter, `## Summary`, `## Opinion` sections
- **Owned scripts:** `pipeline/legal/legal_fetch.py` (fetch + cache write) · `pipeline/legal/legal_normalize.py` (normalize + companion write)
- **CLI flags (legal_fetch.py):** `--courts SLUGS` (default `scotus,cadc`) · `--limit N` (default 50) · `--rate-seconds F` (default 1.0) · `--cache-dir PATH`
- **CLI flags (legal_normalize.py):** `--cache-dir PATH` · `--output-dir PATH` · `--area-of-law STR` (default `federal_administrative_law`) · `--self-test`
- **Opinion cascade:** `plain_text` → `html` (BeautifulSoup strip) → `html_lawbox` (BeautifulSoup) → `xml_harvard` (BeautifulSoup) → skip (log stderr, no .md written). Mirrors C-Transit D-008 fail-soft pattern.
- **Downstream contract:** The normalized JSON schema is locked per DD-021 Mr.C review. DD-022's SR landing zone depends on it. Do not change field names or types without a D-NNN entry and Opus@CH review.
- **`--self-test` mode:** Creates a synthetic CourtListener fixture in a temp dir, runs the normalizer, asserts schema completeness and field correctness, prints PASS/FAIL. No live API call; no real-directory side effects.
- **Politeness:** 1.0 s between requests (D-021 pre-decision #4). Mirrors C-Transit defaults. Adjust via `--rate-seconds` after observing EDU-tier behavior.
- **Escalates when:** All cases skipped after cascade (no usable text in any format field) — end-of-run stderr shows `Normalized: 0 / Skipped: N`. Surface to JR; CourtListener API may have changed response format.

---

## Universal rules

- **No agent posts publicly.** Publishing is a manual step JR runs after approving the packet.
- **All tokens in `.env`** at the project root, never committed.
- **One source of truth for the NAICS list** — read from HZ config, do not duplicate.
- **Log to `hz/*/research/data/_logs/<agent>_<date>.jsonl`** for every run; review weekly.
