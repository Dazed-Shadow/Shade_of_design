# Pipeline Decisions Log

ADR-lite. One entry per non-obvious choice, so we know *why* later.

---

## D-001 · 2026-05-25 · Five agents, not six

**Decision:** Merge the original C-SPOTTER (social presence) and C-Prospect (financial info) into a single C-SPOTTER that does both in one enrichment pass.

**Context:** Original plan had A3 walking the NAICS-matched business list to capture social handles, then A4 walking the same list again for financial signals.

**Why:**
- Two passes over the same target set = two Notion syncs, two error surfaces, two chances for the lists to drift apart.
- The enrichment is naturally one record per business; splitting it across agents is an org chart, not a data model.

**Trade-off accepted:** C-SPOTTER's job is now bigger. If it grows again (adding e.g. principal-contact lookup, news-mention scraping), revisit splitting along *enrichment-type* lines, not original SPOTTER/Prospect lines.

---

## D-002 · 2026-05-25 · Templating lives with C-Phile, not C-Transit

**Decision:** C-Transit does intake only. C-Phile owns both synthesis and templating.

**Context:** Original plan had A2 (Transit) both fetching articles AND placing text into per-channel templates.

**Why:**
- Voice and structure must stay coupled. Templating beside synthesis means one agent owns "how a post sounds" end-to-end.
- Templating beside scraping invites drift — Transit would start making editorial decisions ("this article needs the long template") that belong to the voice owner.

**Trade-off accepted:** C-Phile carries more responsibility. If voice quality stays high but throughput dips, consider splitting *Phile-synthesize* from *Phile-render* as sub-stages of the same agent, not as separate agents.

---

## D-003 · 2026-05-25 · Itch.io belongs to LOFI, not HZ

**Decision:** Drop Itch.io from the HZ outreach platform set. Keep it as a LOFI_SANCTUARY channel only.

**Context:** Original post-its listed Itch.io alongside Twitter/FB/Reddit/Tumblr as part of the HZ content pipeline.

**Why:**
- Itch.io is a creator-community platform. The HZ audience (small businesses under specific NAICS codes) is not on Itch.
- LOFI's audience (cozy-game devs, music-for-games crowd) is exactly who's on Itch. The fit is real there.

**Trade-off accepted:** None — this is a scope correction.

---

## D-004 · 2026-05-25 · No autonomous posting in v1; scripts over MCPs

**Decision:** Every published artifact is manually posted by JR after approving a C-Comms review packet. Per-platform integration is a Python script in `scripts/`, not an MCP server.

**Context:** Decision could have gone the other way — wire up community MCPs for Twitter/Reddit/Tumblr/FB and let agents post directly.

**Why:**
- Platform-ban risk on autonomous posting is real and asymmetric (a single bad post can cost an account permanently).
- No Anthropic-blessed MCP exists for any of these platforms; community MCPs are maintenance debt.
- Scripts give finer control over rate limits and request shapes than a wrapping MCP would.
- Matches the canonical "Notion via scripts" pattern already used by HZ and LOFI.

**Trade-off accepted:** JR is the throughput bottleneck. Acceptable in v1 because the bottleneck is also the quality gate. Revisit only after two clean cycles ship without packet rework (see PLATFORMS.md "What unlocks an upgrade past v1").

---

## D-005 · 2026-05-25 · Prototype first — instrument both tracks, defer C-Comms

**Decision:** Before building C-Comms assembly, run a prototype that exercises both tracks end-to-end (Transit → Phile on the creative side; SPOTTER + MainLiner on the prospect side) with timing instrumentation. Review limitations, refactor, *then* wire up C-Comms.

**Context:** Skipping prototype and building all five agents straight through would commit us to interfaces that haven't been pressure-tested. The unknowns are extraction latency and synthesis cost — both observable only by running, not by design.

**Why:**
- Two tracks have different bottleneck shapes. Creative track is bounded by source-article quality and synthesis cost. Prospect track is bounded by NAICS-match yield and enrichment-API rate limits. Need real numbers per track before deciding what C-Comms aggregates and how often.
- C-Comms's contract depends on what the upstream agents *actually* produce — building it now risks rework once the prototype reveals real outputs.
- Cheap to gate: each agent writes a `_logs/<agent>_<date>.jsonl` entry per run (already in AGENTS.md universal rules); just need `started_at` / `finished_at` / `record_count` fields populated.

**Trade-off accepted:** No human review packet during the prototype phase. JR reads the raw logs and sampled outputs directly until C-Comms is built. Acceptable because the prototype is explicitly a measurement run, not a publishing run.

**Exit criteria (move to C-Comms build):**
1. Both tracks have completed ≥3 end-to-end runs without script-level errors.
2. Per-track p50 and p95 timings are recorded for: extraction, synthesis/enrichment, total.
3. JR has reviewed sampled output from each agent and signed off on the data shape C-Comms will consume.

---

## D-006 · 2026-05-26 · C-Phile synthesis runs on Claude Code, not the metered API

**Decision:** C-Phile is split into a **prep** script (Python, writes a self-contained synthesis bundle to `_pending/`) and a **consume** stage (a Claude Code session, scheduled or interactive). No `ANTHROPIC_API_KEY` is required. Synthesis runs on JR's existing Claude Code subscription.

**Context:** Original implementation called `claude-sonnet-4-6` via the `anthropic` Python SDK from inside the script. That path is metered (pay-per-token credits), separate from the Claude Code plan JR already pays for. JR explicitly does not want to take the metered-credit route.

**Why:**
- JR already pays for Claude Code with Opus + Sonnet on tap. Routing synthesis through that subscription is zero marginal cost.
- The split (prep produces a portable bundle; consumer is any Claude Code session) is more flexible than tying synthesis to a single SDK call — Option B (ad-hoc, JR opens the bundle interactively) becomes trivially available.
- Matches the same Opus/Sonnet pattern already in use everywhere else — Sonnet does the synthesis from inside Claude Code instead of from inside a `.py` script.
- Bundle format is self-documenting: any Claude session that opens a `_pending/*.md` file sees the voice, the article, the task, and the output protocol. No external docs required.

**Trade-off accepted:**
- Synthesis is no longer headless. A human (or scheduled agent) has to consume the bundle. Acceptable because the consumer is cheap to set up and JR is the quality gate anyway in v1.
- Timing measurement for the synthesis stage now happens at the consumer, not in the prep script. Prep timing is fast (file I/O only) and uninteresting; real timing is "how long does Claude Code take to consume a bundle." Captured separately in the consumer logs.

**Cleanup performed:**
- Reverted `ANTHROPIC_API_KEY` placeholder from `backend/.env.example`.
- Removed `anthropic==0.104.1` from `backend/requirements.txt`.
- Rewrote `scripts/phile_synthesize.py` as prep-only (writes bundles to `research/data/drafts/_pending/`).
- Updated `AGENTS.md` C-Phile section to reflect the prep/consume split.

**Open follow-up:** The Option A scheduled consumer is not yet built. Defer until JR has reviewed a few bundles by hand (Option B) and confirmed the bundle format works. Then wire up via the `schedule` skill or a `/loop` recipe.

---

## D-007 · 2026-05-26 · C-Transit source: Federal Register SBA documents, not the SBA blog

**Decision:** C-Transit pulls from `https://www.federalregister.gov/api/v1/documents.rss?conditions[agencies][]=small-business-administration` instead of the originally-specced `https://www.sba.gov/blog/feed`.

**Context:** The SBA blog RSS endpoint returns 404. Discovered during the first C-Transit smoke run.

**Why Federal Register instead:**
- Returns 200, valid RSS, reliable upstream (federalregister.gov is government-operated).
- Documents-by-agency is *more* on-theme for HZ than blog posts — these are the actual regulatory/policy documents small businesses need to track. Better source material for C-Phile's synthesis than blog posts would have been.
- Single feed, no auth, easy to swap if needed.

**Trade-off accepted:** Voice of source material shifts from "informal SBA blog" to "Federal Register notices." C-Phile's voice doc is already the editorial anchor, so the source-material voice doesn't propagate to output. Acceptable.

**If we want SBA blog content back:** SBA's main site offers no RSS, but `https://www.sba.gov/about-sba/sba-newsroom/press-releases` could be scraped (HTML, not RSS). Not worth it in v1.

---

## D-008 · 2026-05-26 · C-Transit body extraction: FR JSON API + generic HTML fallback

**Decision:** C-Transit now fetches full article bodies using a two-path dispatch:
1. **Federal Register documents** (`federalregister.gov` URLs): call the FR JSON API (`/api/v1/documents/{doc_number}.json`) to get `raw_text_url`, fetch the pre-formatted text, strip boilerplate lines via regex, return cleaned plain text.
2. **All other URLs** (future non-FR feeds): generic HTML extraction via BeautifulSoup — tries `<article>`, `<main>`, `.entry-content`, `.post-content`, `.article-body` in order, falls back to `<body>`.

Bodies are capped at **8,000 characters** and a **1.0-second polite delay** is inserted between per-article fetches.

**Context:** C-Transit was writing `body: ""` for all Federal Register records — the RSS feed carries only a one-sentence summary for these documents, and most of the actual content is at the linked URL. C-Phile's synthesis pass was therefore extrapolating from titles alone, making prototype output reviews meaningless.

**Why this approach:**
- FR's JSON API is clean, documented, and returns a `raw_text_url` pointing to the pre-formatted ASCII text of the full document. One API call per article gets a URL to the real content — no scraping ambiguity.
- The raw-text endpoint returns `<html><pre>...</pre></html>` with a consistent boilerplate header/footer. BeautifulSoup + a simple regex strip produces clean plain text in one pass.
- Generic HTML fallback is there for when non-FR sources are added; it costs nothing to ship now and avoids a second `transit_fetch_feeds.py` rewrite later.
- All three deps (httpx, feedparser, beautifulsoup4) were already installed. Zero new dependencies.

**Truncation policy:** 8,000 characters (~1,400 words). FR documents in the SBA feed average 500–3,000 chars after stripping. 8k gives plenty of headroom for longer notices without writing multi-page legal documents into the JSONL. Configurable via `--max-body-chars N` if JR wants to tune per-run.

**CLI flags added:**
- `--no-body` — skip body fetching entirely (metadata-only fast mode, for testing the RSS layer)
- `--body-delay SECONDS` — polite delay between article fetches (default 1.0s)
- `--max-body-chars N` — body truncation cap (default 8000)
- `--limit N` — pre-existed; kept

**Ruled out:**
- Fetching `body_html_url` instead of `raw_text_url`: the HTML version is richer but requires more aggressive scraping and injects layout markup into the body text. Plain text is cleaner for synthesis input.
- Per-source registry keyed on domain: overkill for two paths. Simple `if "federalregister.gov" in url` dispatch is readable and adequate for v1.
- Async fetching (httpx AsyncClient): would complicate the script without meaningful benefit at 5–20 articles per run with intentional delay.

**Fail-soft behavior:** If a body fetch fails (any status != 200, JSON parse error, missing `raw_text_url`), the record is written with `body=""` and a `body_error` field set to the error string. The run continues. Errors are accumulated and forwarded to `log_run`.

**Observed timing (smoke run, limit=5, 1.0s delay, FR source):**
- Per-article body fetch: 61–94 ms
- Total run duration: ~5.4 s (dominated by polite delays between fetches, not network time)
- Previous metadata-only runs: ~1.5 s
- Body sizes: 1,570–3,023 chars (all well under the 8k cap for these FR notices)

**Trade-off accepted:** Each run now takes ~N seconds longer (N = article count × delay). At the default limit of 20 articles with 1.0s delay, that's ~20s overhead. Acceptable for a pipeline that runs on a schedule, not interactively. Use `--no-body` for fast feed-validation runs.

---

## D-009 · 2026-05-27 · C-Phile batch synthesis + uniform `_NN` suffix

**Decision:** `phile_synthesize.py` gains a `--count N` flag (default 1). Every invocation — including single-bundle runs — writes files named `phile_<timestamp>_<NN>.md` where `NN` is a zero-padded 2-digit sequence (`_01`..).

**Context:** The pipeline needs to consume multiple articles per session without running the prep script N times. The naming scheme had to handle N=1 and N>1 without a special-case branch anywhere downstream.

**Why uniform `_NN` even for N=1:**
- Downstream consumers (scheduled Option A agent, `/synth-batch`, any future assembler) pattern-match on filenames. A scheme that sometimes produces `phile_<ts>.md` and sometimes `phile_<ts>_01.md` forces every consumer to handle two shapes.
- Uniform suffix means glob pattern `phile_*_??.md` always matches everything in `_pending/`. No conditional logic anywhere.
- One-file batches are the common case during prototype; paying a two-digit suffix for that case is zero cost.

**Filename scheme:** `phile_<YYYYMMDD_HHMMSS>_<NN>.md`. Timestamp is shared across the batch (set once at invocation start). NN is 1-indexed within the batch.

**What's deferred (v0.1):**
- No dedupe against previously-consumed articles. Two consecutive runs on the same inbox will produce duplicate bundles. Defer until the inbox grows large enough that duplication is noticeable (milestone: 3 clean prototype cycles).
- Article selection is first-N from the most recent JSONL. No scoring, no staleness filter.

**`log_run` behavior:** One entry per invocation with `record_count=N_actual_bundles_written`. Thin-inbox warning is appended to errors if N_requested > N_available.

---

## D-010 · 2026-05-27 · C-SPOTTER pipeline-vs-ad-hoc split via `--ad-hoc` flag

**Decision:** `spotter_find.py` gains an `--ad-hoc` flag. When set, results go to stdout only (formatted table); no candidate file is written; no `log_run` entry is made. Without the flag, current pipeline behavior is unchanged.

**Context:** JR needs to spot-check arbitrary NAICS codes during research sessions — codes outside the 5-code pipeline set. Running pipeline mode for those codes pollutes `candidates/` with non-pipeline data and adds false timing entries to `_logs/`.

**Why a flag instead of a separate script:**
- The scraping engine is identical. Two scripts would be two maintenance surfaces for the same Playwright logic.
- Flag-based dispatch is the same pattern used by `transit_fetch_feeds.py --no-body` (fast mode vs. full mode). Consistent.
- The divergence is purely I/O: ad-hoc skips `write_candidates()` and `log_run()`. No scraping logic changes.

**What ad-hoc mode skips:**
- Writing to `research/data/candidates/`
- Calling `log_run` (no timing entry in `research/data/_logs/`)

**What ad-hoc mode keeps:**
- Full Playwright scraping engine
- Anti-bot detection and graceful degradation
- Per-NAICS limit (`--limit-per-naics`)
- Headless/headed toggle

**Positional NAICS args:** Both modes accept positional NAICS codes (same idiom as `fetch_expiring.py`). If none provided, pipeline mode uses the 5 hardcoded codes; ad-hoc mode with no codes also falls back to all 5 (though the typical ad-hoc invocation names specific codes).

**When each is used:**
- Pipeline mode (no flag): scheduled C-SPOTTER runs, prototype cycles, any run that populates `candidates/`.
- Ad-hoc mode (`--ad-hoc`): one-off research, JR exploring a new NAICS, pre-pipeline feasibility checks.

---

## D-011 · 2026-05-27 · C-Transit multi-source mode + C-Phile round-robin batch

**Decision:** C-Transit now pulls from a TOML feed registry (`research/feeds.toml`) covering six categories; one `<slug>_<YYYY-MM-DD>.jsonl` is written per feed. C-Phile's `pick_articles` reads all today's inbox files and round-robins across categories when filling a batch.

### Why TOML over YAML / JSON

stdlib `tomllib` (Python 3.11+) requires zero new dependencies. TOML's array-of-tables syntax (`[[feeds]]`) makes a human-edited feed list easier to scan and comment than JSON. YAML would need `pyyaml`, which is not in the existing venv. TOML matches the "no new pip deps" rule established for this script family.

### Category taxonomy (v1)

Six categories chosen to span the source-material diversity C-Phile needs without overlapping editorially:

| category | feed | note |
|---|---|---|
| `smallbiz` | Federal Register SBA | existing FR feed, now tagged |
| `policy` | Federal Register All Agencies | all-agency FR, broader regulatory |
| `tech` | Ars Technica | general tech news |
| `ai` | MIT Technology Review | AI/emerging-tech focus |
| `health` | KFF Health News | US health policy / journalism |
| `world` | BBC World News | international current events |

### URL validation results (2026-05-27)

All primary URLs tested with real GET requests before inclusion:

| category | outcome | detail |
|---|---|---|
| smallbiz | **primary used** | FR SBA RSS — 200, valid RSS |
| policy | **primary used** | FR all-agencies RSS — 200, valid RSS (200 entries) |
| tech | **primary used** | Ars Technica RSS — 200, valid RSS |
| ai | **fallback fired** | `anthropic.com/news/rss` returned 404; MIT Technology Review (`technologyreview.com/feed/`) used instead |
| health | **primary used** | KFF Health News — 200, valid RSS |
| world | **primary used** | BBC World News RSS — 200, valid RSS |

The Verge and STAT News fallbacks were not needed and are not in `feeds.toml`; they can be added if primary sources degrade.

### Round-robin algorithm

`pick_articles(count)` in `phile_synthesize.py`:
1. Globs `inbox/*_<YYYY-MM-DD>.jsonl` for today; falls back to files modified in the last 24h; last resort is the single most-recent file.
2. Builds `{category: [articles...]}` dict, deduping by URL across all files.
3. Categories sorted alphabetically for stability (`ai`, `health`, `policy`, `smallbiz`, `tech`, `world`).
4. Round-robins: one article per category per round, cycling until `count` is reached or all categories are exhausted.
5. If a category runs dry mid-round it is skipped silently. If all categories exhaust before `count`, returns what it has with the existing "inbox thin" warning.

### What gets logged

- **stdout (per-feed):** feed name, entry count in feed, entry count fetched, per-article body-fetch status + elapsed ms.
- **`log_run` (aggregate):** one entry per C-Transit invocation with `record_count = sum of records across all feeds`. Per-feed breakdowns are stdout-only.

### What is deferred

- **Weighted sampling** — categories with more entries don't get proportionally more slots; each gets at most one per round.
- **Per-category CLI filter** — e.g. `--categories ai,health` on C-Phile's `/synth-batch`. Needed once JR has enough articles to want targeted batches.
- **Source-quality scoring** — no per-feed reliability or editorial-quality signal yet. JR is the filter.
- **Feed health monitoring** — no alerting if a feed goes quiet. Log review is the current signal.
- **`--ad-hoc` mode for Transit** — spot-checking a single feed without writing to inbox. Low priority; `--feeds-config` pointing to a temp file accomplishes the same thing.

---

## D-012 · 2026-05-27 · Visual direction artifact added to C-Phile bundle

**Decision:** Each C-Phile bundle now tasks the consumer with producing a third output file per article: `phile_<ts>_<NN>_visual.md` — a visual direction document using JR's GEM template (writing / visual direction / brand integration / suggested image prompt).

**Why the consumer produces the first pass:**
The synthesis consumer (Claude Code) is the "hottest hand" in the pipeline — it has just written the blog draft and social post, so it holds the article's meaning and imagery most vividly. Having it fill the GEM template immediately after synthesis produces a more coherent first-pass visual direction than any downstream script could generate from the finished HTML alone. JR then reviews and adjusts before handing off to an image generation tool.

**Template structure (locked — field names are used downstream by `phile_package.py`):**

```
### 🖋️ Writing
- Title / Core Theme/Hook / Key Excerpt

### 🎨 Visual Direction
- Concept Idea / Mood/Vibe / Color Temperature

### 📐 Brand Integration
- Logo Placement / Logo Style / Text Overlays

### 🖼️ Suggested Image Prompt
(code block — single ready-to-paste prompt for Gemini Image / Midjourney / DALL-E)
```

**The Suggested Image Prompt** is written by the consumer to be pasted directly into an image generation tool. It includes subject, style, mood, color palette, and composition in 1–3 sentences. JR can use it verbatim or trim it.

**Trade-off accepted:** Every bundle now produces three files instead of two. The per-article overhead at consume time is low (the consumer already has full context). Legacy batches (pre-D-012) have no `_visual.md` files; `phile_package.py` handles this gracefully with a fallback notice.

---

## D-013 · 2026-05-27 · Batch package generation added to C-Phile workflow

**Decision:** After a batch is consumed, `scripts/phile_package.py --batch <ts>` assembles all N articles into two standalone review documents in `research/data/drafts/_packages/`:

- `phile_batch_<ts>.html` — brand-themed visual review (sticky TOC, card layout, social char-count badge, blog rendered inline, visual direction styled, image prompt in copy-ready block)
- `phile_batch_<ts>.md` — portable review (renders in Notion / Obsidian / GitHub / Tumblr; social in code block, blog as readable text, visual direction raw markdown)

**Why two formats:**
- **HTML** is the primary review surface. It renders brand colors, layout hierarchy, and the image prompt as a copy-ready block — JR sees the batch the way a reader will see the eventual posts. Best for review and approval.
- **MD** is for portability. Paste-into-Notion, commit-to-repo, open-in-Obsidian, or publish directly on Tumblr — all work without modification. Not dependent on a browser.

**`_packages/` directory rationale:** Keeping packages separate from `_done/` avoids polluting the per-article artifact directory with batch-level aggregates. `_done/` remains the canonical location for individual article files.

**Naming convention:** `phile_batch_<ts>.{html,md}`. Timestamp matches the batch, making the connection to the per-article files unambiguous.

**Why per-article files are kept:** Two reasons — (1) audit: JR can trace any individual piece back to its source bundle in `_consumed/`; (2) grab-one workflow: if only one article from a batch is approved, JR can grab just that article's files without unwrapping a package.

**Graceful fallback on missing `_visual.md`:** The packager checks for the visual file and renders `"Visual direction not yet produced for this article."` (HTML) or `"_Visual direction not yet produced for this article._"` (MD) when the file is absent. This means packaging works on all legacy batches produced before D-012 without modification.

**Brand hex codes used:** Deep Ocean Blue `#0B2C4D` (headers, card backgrounds, TOC) · Slate Grey-Blue `#5A7795` (labels, accents) · Accent link `#2E6DA4`. No external CSS assets — all styles are embedded in a single `<style>` block.

**Implementation note — no jinja2:** jinja2 is not installed in the HZ backend venv. All HTML and markdown assembly uses Python f-strings. Output is equivalent and the script has zero new pip dependencies (stdlib only).

**Known issue flagged — KFF Health body extractor broken:** The KFF Health News feed is returning wrong article content (body text does not match the article title/URL). This is a separate issue in `transit_fetch_feeds.py` body extraction, not part of this change set. Flag as next C-Transit priority.

---

## D-014 · 2026-05-28 · Deferred bug punch list (paired fix)

**Decision:** Two production bugs surfaced during the D-012/D-013 demo run are explicitly deferred to the next session as a paired fix. Captured here so they don't go missing. Both are low-risk to ship a workaround for in the meantime.

### Bug 1 — `phile_package.py` drops the Suggested Image Prompt section — **RESOLVED (D-014.1)**

**Where:** `scripts/phile_package.py` section parser
**Observed in:** `phile_batch_20260528_001916.{html,md}` — the per-article `_visual.md` files include the `### 🖼️ Suggested Image Prompt` block with a fenced code block, but the assembled package outputs end the visual direction render at `📐 Brand Integration` and silently drop the fourth section.
**Root cause:** Regex `r"### 🖼️ Suggested Image Prompt\n```"` required the fence to immediately follow the header. The actual `_visual.md` files have a blank line between the header and the fence, causing the regex to never match.
**Fix shipped:** Changed to `r"### 🖼️ Suggested Image Prompt\s*\n```"` — `\s*` absorbs the optional blank line. Also fixed the sibling cosmetic truncation: `🎨 Visual` → `🎨 Visual Direction` in the HTML section heading.
**Verified:** Re-ran `phile_package.py --batch 20260528_001916`; image prompt now renders in both `.html` and `.md`.

### Bug 2 — KFF Health News body extractor returns wrong content — **RESOLVED (D-014.2)**

**Where:** `scripts/transit_fetch_feeds.py` generic BS4 body extractor (`_extract_body_generic`)
**Observed in:** Every `kff_health_news_*.jsonl` record produced so far. Bodies came back as `"Rx For Clarity: Calif. Considers Bilingual Drug Labels / By April Dembosky, KQED / July 30, 2014"` regardless of which 2026 article was requested. KFF's article pages use a wrapper template that the generic extractor latched onto for the wrong DOM element.
**Impact:** Any health-category article from KFF synthesized from title only. Bundle 02 in the demo batch was the visible case.

**Root cause:** KFF wraps its "related articles" footer cards in `<article>` tags (class `article-pre-footer__post`) and puts the real article body in `<main>` (specifically `div.wp-block-kff-news-modern-news-content-container`). The generic extractor's preference order — `article → main → entry-content → …` — caused `soup.find("article")` to return the **first** related-post card on the page rather than the real article. The body of that card (a recommendation tile pointing to a 2014 KQED piece) is what landed in every KFF JSONL record.

**Fix shipped:** Two complementary changes to `_extract_body_generic`, keeping the FR-vs-generic two-path design from D-008 intact:
1. Added a class-name strip pass: any element whose class matches `(related|recommended|pre-footer|sidebar|share|comments?|newsletter|promo|subscribe)` is `decompose()`'d before container selection. Also added `aside` and `form` to the structural-noise tag list. This removes the related-posts wrapper entirely on KFF pages.
2. Changed `<article>` selection from "first match" to "largest by text length" via `max(soup.find_all("article"), key=len_of_text)`. Defensive against any other site that nests boilerplate `<article>` tags around the real one.

**Verified:** Ran `_extract_body_generic` against three KFF URLs (Nurse / Montana Medicaid / Letters to Editor) and three regression sources (Ars Technica, BBC World, MIT Tech Review). KFF bodies now match their titles; the other three sources are unchanged.

**Pairing rationale:** Both bugs surface during the same workflow (read the package → notice missing prompts → notice thin synthesis). Fixing them together gives the next `/synth-batch` demo a clean visible upgrade rather than two separate small wins.

**D-014.1 status:** RESOLVED (shipped in same session).
**D-014.2 status:** RESOLVED (2026-05-28, branch `claude/military-contract-search-tool-9hm2D`, not yet pushed).

---

## D-015 · 2026-05-28 · SPOTTER Phase 1 enrichment + two-format review package

### Enrichment inline in `spotter_find.py` (not a separate script)

**Decision:** CAGE code, business website, email, contact name, and SAM profile URL are scraped in a second pass inside the same `spotter_find.py` run (after collecting all business URLs from the NAICS search). No separate `spotter_enrich.py` script.

**Why inline:**
- The SBA cert profile page is already the navigation target of the existing scraper — `url` in each record IS the profile URL. A separate enrichment script would re-navigate every URL that `spotter_find.py` already visited.
- Keeping enrichment in one run means one Playwright browser session, one log entry, one output file, and one place to diagnose failures. Splitting would double the state surface for no architectural gain.
- The enriched fields are stable attributes of the record (not computed or aggregated). They belong in the base record, not in a second-pass file.

**Why not a dedicated `spotter_enrich.py`:**
- Would create a two-step workflow (find → enrich) where the enrichment step is required before the review package is usable. A single run that produces a complete record is simpler for JR.
- Backwards compatibility: old consumers reading `{name, naics, url}` are unaffected — new fields are additive. There's no schema migration to manage.

### Two-format review package (`spotter_package.py`)

**Decision:** `scripts/spotter_package.py` produces an HTML visual review and a CSV annotation sheet per date.

**Rationale for two formats (parallel to D-013 for C-Phile):**
- **HTML** (`spotter_review_<date>.html`): fast visual scan grouped by NAICS, click-out links to SBA profile and business website, null fields visually dimmed ("not on profile"). Purpose: JR rapidly assesses which businesses are worth pursuing without opening individual profiles.
- **CSV** (`spotter_review_<date>.csv`): clean tabular data with three blank annotation columns (`jr_status`, `jr_notes`, `jr_priority`). UTF-8-BOM + QUOTE_ALL so Excel and Google Sheets open it without configuration. Purpose: JR's working annotation surface — mark status, add notes, rank by priority.

The two formats are complementary, not redundant. HTML is read-only and optimized for scanning; CSV is writable and optimized for annotation.

### Phase 2 deferred items (explicit out-of-scope for Phase 1)

The following are known desired capabilities not shipped in this session:

| Item | Reason deferred |
|---|---|
| Per-business C-Comms narrative ("why this business now") | Requires C-Comms agent and JR-approved outreach voice. Blocked on D-005 exit criteria. |
| PDF download of the review package | Low urgency; HTML prints to PDF natively. Revisit when JR requests offline-first distribution. |
| Website fetch + classification (what does the business actually do) | Additional Playwright load per business; content classification needs its own quality gate. Phase 2 enrichment pass. |
| Award history cross-reference (SAM.gov FPDS lookup) | SAM.gov award data requires the HZ API key and a separate query path. C-MainLiner owns this data; wire up in the C-Comms assembly stage. |
| SAM.gov entity profile outbound link | Investigated 2026-05-28: SBA cert profile pages do not include an outbound link to sam.gov entity pages. `sam_profile_url` will always be null until SBA adds this link or a separate SAM.gov lookup is added (Phase 2). **RESOLVED in D-015 Phase 2 below.** |

---

## D-015 Phase 2 · 2026-05-28 · `sam_profile_url` via UEI extraction, not Entity API

### Decision

`_enrich_profile()` in `scripts/spotter_find.py` now populates `sam_profile_url` by:

1. First scanning the SBA cert profile DOM for any outbound `sam.gov` entity link (defensive — currently SBA emits none, but if they ever add one we want the real link).
2. Falling back to a regex (`UEI[:\s]+([A-Z0-9]{12})`) over the profile page body text to extract the UEI, then constructing the canonical URL: `https://sam.gov/entity/{UEI}/coreData?status=Active`.

No SAM.gov Entity API (`api.sam.gov/entity-information/v3/entities`) call is made.

### Why not the Entity API

HZ already holds a `SAM_GOV_API_KEY` for the Opportunities v2 endpoint, so the Entity API call would have been technically straightforward. We rejected it on principle:

> **"Let the site be the eater of our API limits, not the data pipeline."** — JR, 2026-05-28

The HZ frontend and any user-driven action is the legitimate consumer of the SAM.gov daily quota — that's where each call has direct human value. Pipeline enrichment over N candidates per day would silently consume the quota for records no human may ever look at. Worse, exhausting the quota in the pipeline would degrade the live site.

The Entity API would only add value if we needed to *verify* the entity exists before linking. For a click-out URL on a review surface, "construct and let the user 404" is acceptable — and far cheaper.

### Why UEI extraction is safe to construct from

- The UEI is part of the rendered profile page (`UEI: H26KNRBSEX89`), placed there by SBA itself. If it's on the page, it's a registered SAM identifier.
- `https://sam.gov/entity/{UEI}/coreData?status=Active` is the URL SAM.gov's own frontend produces for entity profile views — it's not a guess, it's the canonical pattern.
- Failure mode (entity recently delisted): the link 404s. The review package handles null + invalid gracefully; this is a known acceptable degradation.

### Generalized rule for the pipeline (applies to all agents)

When a pipeline agent considers calling a metered third-party API to enrich a record, prefer in this order:

1. Extract from a page already in flight (free).
2. Construct a deterministic canonical URL from a known ID (free).
3. Only call the metered API if neither path yields the answer.

This rule is binding on C-MainLiner's planned FPDS award-history work — investigate scraping or canonical-URL approaches before consuming the HZ SAM.gov key inside the pipeline. C-Comms inherits the same constraint when assembling outreach context.

### Files touched
- `HZ/scripts/spotter_find.py` — added `re` import, `UEI_RE`, `SAM_ENTITY_URL_TEMPLATE`, and updated `_enrich_profile()` sam_profile_url block with link-first / UEI-fallback strategy.

---

## D-017 · 2026-05-28 · C-Phile cross-batch dedupe + article catalog

### Problem

`pick_articles` deduped only within a single batch. The same article (e.g. the Brightwood Capital SBIC Section 312 notice) appeared in three consecutive `/synth-batch` runs because nothing checked "have we already synthesized this URL." JR was re-reviewing the same content.

### Cross-batch dedupe (URL-only, v1)

**Decision:** Before picking new articles, `pick_articles` scans `research/data/drafts/_consumed/*.md` for all previously-synthesized URLs (parsed from the `## Source article` section of each bundle). Any matching URL is excluded from the candidate pool.

**Why URL-only, not title normalization or content hashing:**
- URL is the natural primary key for the article — it's what the feed emits, what the bundle stores, and what JR would compare manually.
- Title normalization is fragile: the same story can have slightly different titles across syndication sources. Content hashing requires full body presence, which is absent in early thin bundles.
- URL-only is correct 95% of the time. Edge cases are acceptable for v1:
  - Same story republished at a new URL → re-synthesized. Acceptable: new URL = new editorial cut.
  - Same story from two different sources (e.g. KFF + STAT) → both synthesized. Acceptable: different voice/framing, cross-source synthesis is a feature, not a bug.

**Why `_consumed/` is the source of truth (not a separate state file):**
- `_consumed/` is append-only by nature — bundles land there when consumed and are never deleted in normal operation.
- A separate state file (e.g. a `seen_urls.txt`) would be a second place that needs to stay in sync with `_consumed/`. When they drift (crash, manual file move), the dedupe silently breaks. The bundle itself is the canonical record.
- Scanning `_consumed/*.md` at pick time is cheap: regex over ~N small files, dominated by file I/O. At 100 consumed bundles, scanning takes < 100ms.

**`--allow-duplicates` escape hatch:**
- Skips the `_consumed/` scan entirely.
- When to use: re-synthesizing an article whose first bundle was thin (e.g. the KFF nurse story before the KFF body extractor was fixed — D-014.2). The escape hatch lets JR produce a better synthesis without deleting the original consumed bundle.
- Invocation: `python scripts/phile_synthesize.py --count 1 --allow-duplicates`

**Log line emitted:** `[INFO] Excluded N already-consumed URL(s) from picker pool.`

### Article catalog (`scripts/phile_catalog.py`)

**Three output files in `research/data/drafts/_catalog/`:**

| File | Purpose |
|------|---------|
| `articles.jsonl` | Machine-readable. One JSON object per line: `{url, title, source, source_name, category, batch_ts, bundle_slug, consumed_at}`. Sorted by `consumed_at` descending. Deduplicated (first occurrence wins on duplicate URL). |
| `index.html` | Brand-themed (Deep Ocean Blue #0B2C4D / Slate Grey-Blue #5A7795) sortable table. Vanilla JS sort helper (~30 LOC) on `<table>` headers — no external assets. Columns: Consumed · Source · Category · Title (linked) · Batch. |
| `summary.md` | Human summary: (1) counts by source, (2) counts by category, (3) recent activity timeline — bullet list of last 14 days grouped by date. |

**Category derivation:**
Category is not stored in the bundle directly. `phile_catalog.py` loads `research/feeds.toml` and matches the bundle's `source` slug against feed names and URL domain fragments. Unmatched sources → `"uncategorized"`.

**Idempotent:** Re-running always rebuilds all three files from current `_consumed/` state. No append-only flavor; no state to manage.

**No new dependencies:** `tomllib` is stdlib (Python 3.11+). Everything else in the script is stdlib + nothing.

### `/synth-batch` update

Step 6 (new): after `phile_package.py`, run `phile_catalog.py` to refresh the catalog. Catalog path included in the summary packet.

### Documented edge cases

- **Same story, new URL:** Re-synthesized. Intentional — new URL = new editorial context.
- **Same story, two sources (e.g. KFF + STAT):** Both synthesized. Intentional — cross-source synthesis is a feature.
- **Bundle without a URL in `## Source article`:** Excluded from catalog (no dedupe key). Rare: only pre-D-009 single-article bundles without a `--NN` suffix have this shape.

---

## D-020 · 2026-05-29 · Per-business PDF capture in C-SPOTTER

### Decision

After `_enrich_profile()` completes each SBA cert profile, `spotter_find.py` captures the rendered page as a PDF using Playwright's `page.pdf()`. PDFs land in `research/data/candidates/_pdfs/<cage_code>.pdf`. A new `profile_pdf` field (relative path or null) is written into each JSONL record. `spotter_package.py` surfaces the PDF as a `📎 Profile PDF` `file://` link on the HTML card and as a `pdf_path` column in the CSV.

### Why `page.pdf()` over a click-the-SBA-download-button approach

The SBA certifications portal exposes no download affordance — there is no "export" or "print as PDF" button on profile pages. The page is a React SPA; the only reliable way to capture the rendered profile is via Playwright's `page.pdf()`, which renders Chromium's print output directly. No third-party tool, no additional network call, no user interaction required.

### Why CAGE code as filename

CAGE is a five-character government-issued identifier: deterministic, unique per entity, never changes across profile updates, and is the same identifier JR uses everywhere else for cross-reference (CSV, JSONL, SAM.gov lookup). A business-name slug would be fragile (name changes, non-ASCII, duplicates in long runs). CAGE wins on all four criteria.

Fallback: `_unknown_<slug>.pdf` for the rare case where CAGE is null (shouldn't happen but is defensive per D-015's fail-soft pattern).

### Why default-ON capture

Storage is cheap (~10–25 MB per 50-business run at ~200–500 KB/PDF). The asset is genuine research value — a timestamped snapshot of the profile as it existed at scrape time, useful for JR's offline review and as an audit artifact. JR has `--no-pdf` if he needs to skip (faster runs, no disk writes).

### Storage estimate

Observed PDF sizes: 200–500 KB per profile on the SBA cert React SPA. At 50 businesses per pipeline run: ~10–25 MB per run. `research/data/candidates/_pdfs/` is inside `research/data/` which is already gitignored via untracked directory convention — no repo bloat.

### Failure mode

PDF errors are wrapped in try/except inside `_capture_pdf()`. A failure logs a per-record warning to stdout and appends to `all_errors` (which flows into `log_run`), but does not abort the record or the run. `profile_pdf` is set to null for that record. The enrichment run continues normally.

### Files touched

- `HZ/scripts/spotter_find.py` — added `PDFS_DIR`, `_slugify()`, `_capture_pdf()`, `--no-pdf` argparse flag, PDF call in enrichment loop, `profile_pdf` field on each record.
- `HZ/scripts/spotter_package.py` — added `pdf_path` CSV column (between `contact_name` and `sba_profile_url`), `📎 Profile PDF` `file://` link / dimmed "no PDF" placeholder in HTML card header.
- `Central Hub/pipeline/AGENTS.md` — updated C-SPOTTER outputs schema, `_pdfs/` directory note, `--no-pdf` CLI flag.

---

## D-021 · 2026-05-30 · C-SPOTTER award history enrichment via USAspending.gov

### Decision

Add a post-scrape award enrichment pass (`scripts/spotter_awards.py`) that queries
USAspending.gov for each candidate's federal contract history and writes a sidecar
JSONL. `spotter_package.py` prefers the sidecar when it exists and renders the award
data in the HTML card and the CSV.

### Why USAspending, not SAM.gov Opportunities/FPDS

JR's standing API-budget rule (D-015 Phase 2): reserve the HZ `SAM_GOV_API_KEY` for
user-facing flows. Every pipeline call to the SAM.gov metered endpoint consumes quota
that belongs to the live site. USAspending is a separate government API
(`api.usaspending.gov`) with no authentication requirement, generous rate limits, and
full FPDS coverage indexed by recipient UEI — the same identifier we already carry in
`sam_profile_url`.

Rule generalized: pipeline enrichment that could be satisfied by a free API must prefer
the free API. SAM.gov key is the last resort, not the first reach.

### Sidecar file pattern (`spotter_<date>_awards.jsonl`)

The enrichment output is written to a **sidecar** alongside the raw scrape rather than
overwriting it. Rationale:

- **Preserves the canonical raw scrape.** `spotter_find.py` and `spotter_awards.py` are
  independently re-runnable. Re-enriching after a USAspending outage or a API change
  requires only re-running the awards script, not re-running Playwright.
- **Allows partial enrichment.** `--limit N` on `spotter_awards.py` writes partial
  sidecar files. The packager uses whatever sidecar exists; running the packager before
  enrichment finishes (or before it runs at all) still works — it falls back to the raw
  scrape and renders no award data.
- **Packager preference order:** `spotter_<date>_awards.jsonl` if present →
  `spotter_<date>.jsonl` otherwise. Transparent to downstream consumers.

### Three `award_status` values and downstream meaning

| Value | Meaning | HTML rendering | CSV cells |
|---|---|---|---|
| `"has_awards"` | At least one prime contract found | First + latest award grid with count badge | Date/amount/agency fields populated |
| `"no_federal_awards_found"` | Query succeeded, zero contract results | "No federal awards found yet — ground-floor candidate." | All award cells blank, status recorded |
| `"lookup_failed"` | Network/parse error on USAspending call | "Lookup unavailable." | Status recorded, all others blank |

`"no_federal_awards_found"` is the most strategically interesting signal: a certified
small business with zero federal award history is a **ground-floor candidate** —
they've completed the bureaucratic certification work but haven't yet landed a contract.
As JR put it: "Started from zero, help those who want to help." These businesses are
easier to displace competitors against and more receptive to outreach that offers
practical contract-winning guidance.

### Annotation preservation in `spotter_package.py` (CRITICAL)

Before writing a new CSV, `spotter_package.py` checks if a CSV already exists at the
output path. If one exists, it reads `jr_status`, `jr_notes`, and `jr_priority` and
builds a `{cage_code → annotations}` map. When writing the new CSV, it looks up each
row's CAGE code against that map and carries forward any non-blank annotation values.

**Why CAGE-keyed (not name-keyed):** CAGE is a government-issued five-character
identifier, unique and stable. Business names can contain special characters, change
over time, or differ slightly across sources. CAGE is the correct primary key for
cross-run carry-forward.

**Idempotency guarantee:** Running `spotter_package.py` N times on the same date
preserves all annotations JR has entered via Excel. Re-running after a new
`spotter_awards.py` pass will add award data to the CSV without disturbing any
existing `jr_status`/`jr_notes`/`jr_priority` values.

**Rows with null cage_code** cannot be matched and receive blank annotations on
re-run — safe degradation, consistent with the fail-soft pattern established in D-015.

### Files touched

- `HZ/scripts/spotter_awards.py` — new script. USAspending enrichment pass. Reads
  `spotter_<date>.jsonl`, queries `POST /api/v2/search/spending_by_award/` per UEI,
  writes `spotter_<date>_awards.jsonl`. No new pip deps (httpx already installed).
- `HZ/scripts/spotter_package.py` — extended with: B1 awards sidecar preference,
  B2 Award History HTML panel, B3 new CSV columns (award_status, first/latest award
  date/amount/agency, total_awards_count), B4 annotation preservation logic.
- `Central Hub/pipeline/AGENTS.md` — C-SPOTTER section updated with awards enrichment
  step, sidecar convention, and annotation preservation note.

---

## D-022 · 2026-05-31 · Unite Passion — sport-immersive visual identity within brand

**Decision:** Enhance the Unite Passion dashboard with sport-specific visual treatments that remain within the Shade of Design token system. Add ESPN-sourced news headlines and direct links to official driver/team stat pages.

**Context:** Initial build used minimal backgrounds (horizontal speed lines, soft ember fade). Panels lacked visual energy to honor each sport's identity, and had no outbound links or live editorial content — making off-day visits feel thin even after the backlog items were built.

**Why — Visual:**
- Ocean/Slate maps naturally to NASCAR (track depth, speed); Ember/amber maps to basketball hardwood warmth. Using the existing tokens at higher contrast expresses the brand system rather than breaking it.
- Diagonal speed lines (−15°) in the NASCAR panel convey velocity without imagery. Horizontal hardwood lines in the basketball panel echo court grain without a photo. Both are CSS `repeating-linear-gradient` — zero new assets.
- On This Day cards get sport-tinted backgrounds (low opacity) and larger year typography for editorial weight.

**Why — Links and News:**
- Driver and team cards without links are dead ends. Official sources (NASCAR.com for drivers, NBA.com for teams) are the correct destination.
- ESPN's public news API (same CDN already in use, no key) provides top 3 current headlines per sport, turning the off-day panel from a static snapshot into a living editorial feed. News renders below live event data so race/game content always reads first.

**Trade-off accepted:**
- CSS background layering in pseudo-elements adds minor rendering cost on low-end devices. Acceptable for a personal passion project.
- ESPN news links out to ESPN, not the official league sites. Sufficient for v1; a future pass could cross-reference league RSS feeds.
- NASCAR.com driver URL slugs assumed from name. Retired driver pages may resolve differently; the link is additive so any 404 only affects the anchor, not the card render.

**Files touched:**
- `unite-passion/nascar-basketball.jsx` — FEATURED_DRIVERS gains `url`/`statsUrl`; NY_TEAM_INFO constant; NewsStrip component; news state + fetches; driver and team record cards become anchor links.
- `unite-passion/nascar-basketball.css` — Diagonal speed lines (NASCAR), hardwood lines (hoops), On This Day tinted cards + larger year type, news strip styles, link hover states.

---

## D-023 · 2026-06-07 · SPOTTER Phase 2 Pass A — design-quality + ownership enrichment

### Why this pass exists

JR's manual annotation pass on 50 SPOTTER candidates revealed his real outreach thesis:
he filters by **design-quality opportunity** — "their site needs design attention" /
"no public website I can find — good entry point." The existing pipeline gives him
names, contacts, and award history but NOT the design-quality signal he actually uses.
Pass A surfaces that signal automatically so he can skim 50 rows instead of doing
30+ manual website visits.

### A1 — `spotter_classify.py`: website fetch + classify

Reads the best available input sidecar (cascade: `_enriched.jsonl` → `_awards.jsonl` →
`.jsonl`), fetches each `business_website` with httpx (10s timeout, Chrome UA, 1.5s
default delay), and writes four new fields per record:

| Field | Type | Description |
|---|---|---|
| `what_they_do` | string | 1-2 sentence plain-language summary: `<meta description>` → `<h1>` + first prominent `<p>` → first prominent `<p>` → `<title>` |
| `design_quality` | string | `clean` / `dated` / `broken` / `no-site` |
| `geographic_scope` | string | `local` / `regional` / `national` / `unknown` |
| `tech_signals` | dict | `{generator, has_ssl, has_viewport, framework_hint}` |

#### `design_quality` four-bucket rubric

| Bucket | Condition |
|---|---|
| `no-site` | `business_website` null OR HTTP fails to connect |
| `broken` | HTTP 4xx/5xx, OR 200 but body < 200 chars |
| `clean` | has `<meta name="viewport">` AND https AND ≥1 external CSS link AND no legacy generator signal (FrontPage, GoLive, etc.) |
| `dated` | default fallback — loaded but not clearly clean |

**Why this rubric:** The three clean signals are the minimum stack of a modernly-maintained
site. `<meta viewport>` = mobile awareness. https = basic ops hygiene. External CSS =
not a bare HTML page with `<style>` inline. Absence of any one signal is a JR-actionable
hook. Legacy generator signals (FrontPage, GoLive) are a hard upgrade opportunity regardless
of other signals, so they trump to `dated` before the clean test runs.

#### `geographic_scope` heuristic

1. Scan for "nationwide" / "across the country" / "all 50 states" → `national`
2. Scan for regional keywords (Tri-State, Northeast, Pacific Northwest, Midwest, etc.) → `regional`
3. Count distinct US state name mentions: 0 → `unknown`, 1 → `local`, 2-4 → `local`,
   5+ → `regional` (national signals already handled above)

**Interpretation note:** State-abbreviation matching fires on `\b[A-Z]{2}\b`, which can
false-positive on non-state two-letter codes (e.g. "IT", "HR", "DC"). DC is not in the
abbreviation set. False positives are conservative (they can only elevate scope from
`unknown` to `local`, never to `regional` or `national`).

### A2 — `spotter_ownership.py`: SBA PDF ownership extraction

Reads profile PDFs captured by `spotter_find.py` (via `pypdf`, pure-Python, no native
deps). Regex-scans extracted text for six ownership flags. Output per record:

```json
{
  "woman_owned": false,
  "veteran_owned": false,
  "service_disabled_veteran_owned": false,
  "minority_owned": false,
  "hubzone": false,
  "8a": false,
  "raw_phrases": []
}
```

**Why pypdf over pdfplumber:** pdfplumber wraps pdfminer.six, which adds native-extension
exposure and a heavier footprint. pypdf is pure Python (~80 KB wheel), has no native deps,
and text extraction from the SBA cert React SPA print PDFs is straightforward — no need
for pdfplumber's table extraction or coordinate-aware layout engine. Matches the "no new
heavy deps" pattern established across the pipeline.

**Veteran-owned suppression:** The `veteran_owned` pattern fires on "veteran-owned" but
is suppressed when that match sits inside a "service-disabled veteran" phrase (60-char
lookahead window). This prevents double-flagging service-disabled veteran-owned businesses.

**Fail-soft:** corrupt file, missing file, or parse error → `ownership = null`, error
logged per record, run continues.

### A3 — Unified `_enriched.jsonl` sidecar + cascade pattern

Both classify and ownership write to `spotter_<date>_enriched.jsonl`. The second pass
to run reads the first pass's output and adds to it (merge semantics: existing fields
are preserved, missing fields are added). This means running classify then ownership,
or ownership then classify, or either alone, all produce a valid enriched file. No
pass is required before the other.

**Cascade order in `spotter_package.py` (D-022 extension of D-021):**
```
spotter_<date>_enriched.jsonl  ← preferred (classify + ownership + awards)
spotter_<date>_awards.jsonl    ← fallback (awards only)
spotter_<date>.jsonl           ← last resort (raw scrape)
```

### A4 — `spotter_package.py` extensions

- `load_records()` extended to prefer `_enriched.jsonl` over `_awards.jsonl`
- HTML: new "Site & Identity" panel on each business card:
  - `design_quality` as a colored badge (clean=green, dated=amber, broken=red, no-site=gray)
  - `what_they_do` as a one-liner under the panel header
  - `geographic_scope` as a small rounded tag
  - Ownership flags as chips (only rendered when present)
  - Panel is omitted entirely when no D-022 fields are present (backwards-compatible with
    awards-only or raw-scrape inputs)
- CSV: new columns added after `business_website`, before `email`:
  `design_quality`, `what_they_do`, `geographic_scope`, `woman_owned`, `veteran_owned`,
  `service_disabled_veteran_owned`, `minority_owned`, `hubzone`, `is_8a`
  (`"8a"` key renamed `is_8a` for CSV header friendliness — "8a" starts with a digit)
- Annotation preservation (CAGE-keyed carry-forward, D-021) still works — new columns
  don't affect the annotation-keying logic

### What is deferred (Pass B)

| Item | Reason deferred |
|---|---|
| `/spotter-narrate` slash command | Requires C-Comms agent and JR-approved outreach voice. Separate session. |
| Refined `geographic_scope` heuristic for multi-state businesses | Current heuristic is good enough for a visual skim; precision tuning deferred until JR has reviewed the first full 50-row run. |
| Anti-bot detection for classify (captcha / JS-only pages) | httpx fetches only static HTML. JS-heavy SPAs may return empty bodies and classify as `broken` instead of `dated`/`clean`. Known limitation; Playwright fallback deferred to Pass B if prevalence warrants it. |

### Files touched

- `HZ/scripts/spotter_classify.py` — new script (D-022 A1)
- `HZ/scripts/spotter_ownership.py` — new script (D-022 A2)
- `HZ/scripts/spotter_package.py` — extended (cascade, Site & Identity panel, CSV columns)
- `HZ/backend/requirements.txt` — added `pypdf==5.1.0`
- `Central Hub/pipeline/AGENTS.md` — C-SPOTTER section updated

**Note:** Originally drafted as D-022 but renumbered to D-023 after merge with a concurrent D-022 (Unite Passion visual identity). HZ commit `2010574` and the script docstrings reference the original "D-022" number; the canonical entry lives here under D-023. Future references should cite D-023 for SPOTTER Pass A.

---

## D-024 · 2026-06-14 · Unite Passion as a Central Hub landing component

**Decision:** Treat Unite Passion as a landing-page component owned by Central Hub, not a standalone project. Its canonical home is `quick-front-end/shade-of-design-landing/unite-passion/`. The original `conversations/2026-03_stock-dashboard-project/` folder remains as historical reference only; no new work lands there.

**Context:** The 2026-05-31 merge ("Merge Unite Passion dashboard into main") brought Unity's surface area into Central Hub, but the parent/child relationship between the two had been treated ambiguously across project notes. Jon confirmed the architectural relationship on 2026-06-01: Unity is an extension page of Central Hub, not a peer project.

**Why:**
- Lets the Shade of Design system (evergreen palette, typography, brand kit) apply to Unity uniformly without forking a second design language.
- Avoids dependency drift between two near-duplicate repos that would otherwise need cross-sync.
- The single human-review gate (C-Comms → JR) automatically covers any Unity-surfaced content.
- Simplifies portfolio cognition: ten active projects is honest; eleven (with Unity as a peer) was misleading.

**Trade-off accepted:** The "Project Unity" name persists in some older docs and the workspace shortcut. Renaming everywhere would be churn; instead, every new reference (CLAUDE.md, MR_C_INDEX.md, this DECISIONS.md) clarifies "Unite Passion is a Central Hub component."

**Complements:** D-022 (Unite Passion visual identity). D-022 decided how Unity should look inside the brand; D-024 decides where Unity lives architecturally.

**Files / surfaces touched:**
- `Central Hub/MR_C_INDEX.md` — `related` includes PROJECT_UNITY as sub-component (already done 2026-06-02).
- `conversations/2026-03_stock-dashboard-project/MR_C_INDEX.md` — declares parent: CENTRAL_HUB.
- Workspace shortcut `MR_C-PROJECT_UNITY.code-workspace` kept for now; can be retired when Unity's surfaces are stable.

---

## D-025 · 2026-06-14 · "Coming Soon" treatment for unbuilt landing surfaces

**Decision:** Pages that exist in `quick-front-end/shade-of-design-landing/` navigation but don't have a real implementation yet show a deliberate **"Coming Soon"** placeholder rather than a 404, a "lorem ipsum" stub, or being hidden from nav.

**Context:** The Shade of Design landing is the public face of Central Hub. Jon's directional aim is a more "alive" iterative site (see Pitt/Paint design strategy — separate memory). That iterative process requires real surfaces to push concepts against, but most concept surfaces aren't shippable in their first state.

**Why:**
- Empty nav slots or broken links read as abandoned; a designed placeholder reads as roadmap.
- Placeholder pages give Jon a no-friction surface to test design intent (Pitt/Paint iteration) before committing to a full build.
- Visitors form a mental model of "this brand is shipping" rather than "this brand stalled."

**Rules:**
- Every "Coming Soon" page must share enough design language (palette, typography, motif) with shipped pages that it doesn't break the visitor's mental model. Use the evergreen palette and serif typography by default.
- A simple status table at the top of `quick-front-end/shade-of-design-landing/README.md` tracks which routes are placeholders vs. shipped. Update on the same commit that promotes a placeholder to a real page.
- When a placeholder ships for real, the changeover is a single commit — design-system-compliant from the start because the placeholder already was.

**Trade-off accepted:** Placeholder pages still need design work to feel intentional rather than empty. The cost is small (10-20 min per page) and is part of the design process itself, not separate from it.

**Complements:** D-024 (Unite Passion as Central Hub landing component) — any Unity sub-pages follow this convention — and the Pitt/Paint design strategy reference held in Mr. C's memory.

---

## D-026 · 2026-06-21 · C-Legal opinion normalization — cascade order and null contract

**Decision:** Normalization cascade is `plain_text` → `html` → `html_lawbox` → `xml_harvard` → skip (log stderr, no .md written). Fields that require cluster-level data (`citation`, `court`, `date_filed`, `jurisdiction`) are set to `null` when absent from the opinion-level cache record — never empty string, never `"N/A"`. `area_of_law` is a CLI parameter (default `federal_administrative_law`). `jurisdiction` is derived from embedded cluster metadata when present.

**Context:** CourtListener v4's opinions endpoint returns opinion-level JSON only. Citation, court name, date_filed, and court slug live in the cluster object (a separate endpoint). Sonnet A (`legal_fetch.py`) caches one opinion JSON per file. The normalizer must handle the common case where cluster fields are absent from the cache record.

**Why this cascade:**
- `plain_text` is always preferred — it's what the API guarantees for indexed opinions and maps directly to Markdown with no parsing.
- `html` is the next best: well-formed HTML for most older opinions that lack plain text. BeautifulSoup strips it cleanly.
- `html_lawbox` and `xml_harvard` are format-specific variants on a minority of records. BeautifulSoup handles both; lxml-xml is tried first for the XML variant, with html.parser as fallback.
- If none of the four fields yield text, the case is logged to stderr and skipped with no output written. Same fail-soft principle as C-Transit D-008.

**Why null over empty string:**
Per DD-021 Mr.C review pre-decision #6: any field that can't be populated from CourtListener is `null`. This is a downstream contract for DD-022's SR landing zone — the consumer can test `if record["citation"]` cleanly; empty strings would force extra strip/falsiness checks and obscure whether data was missing vs. blank.

**Downstream contract lock (DD-022 dependency):**
Schema `{case_id, citation, court, date_filed, area_of_law, jurisdiction, opinion_text_md, summary_md, source_url}` is locked at this ship. Do not add, remove, or rename fields without a new D-NNN entry and Opus@CH review. DD-022's C-Build spawn must not start until DD-021 ships and the schema is confirmed in normalized output.

**Trade-off accepted:** `citation`, `court`, `date_filed`, `jurisdiction` will be null in the initial 50-case MVP cache if CourtListener v4 does not inline cluster data in opinion responses (which is the typical v4 behavior). DD-022's landing zone handles null gracefully. A future enrichment pass (separate DD) can add a cluster-fetch step to backfill these fields without modifying the locked schema — new fields would be additive.

---

## D-027 · 2026-06-24 · CourtListener SEARCH API over OPINIONS endpoint

**Decision:** The DD-026 auto-fetch routine (`legal_fetch_queries.py`) calls the CourtListener SEARCH API (`/api/rest/v4/search/?type=o&court=<slug>&stat_Published=on&order_by=dateFiled%20desc&filed_after=<M/D/YYYY>`) rather than the OPINIONS endpoint used in the parked DD-021 Sonnet A artifact.

**Context:** DD-021's `legal_fetch.py` targeted `/api/rest/v4/opinions/?cluster__docket__court__pk__in=<slug>` and received 400 on every filter variant tested. The SEARCH API is the CourtListener-documented discovery path for filtering by court, status, date, and sort order.

**Why SEARCH API:**
- `/api/rest/v4/search/` is the documented way to query across the full CourtListener index with the `type=o`, `court=`, `stat_Published=on`, and `filed_after=` filters needed for the Phase 1 locked queries.
- Returns a standard paginated JSON response with `results[]` containing opinion-level objects including `id`, `caseName`, `docketNumber`, `court`, `dateFiled`, `download_url`, and `absolute_url` — all fields needed for PDF download, fast-extract, and log entry.
- The OPINIONS endpoint (`/api/rest/v4/opinions/`) is for retrieving a known opinion by ID. It is not designed for date-range or court-filtered discovery.

**Trade-off accepted:** SEARCH API returns up to 20 results per page (v1 fetches one page per query). For daily cadence with a `filed_after` window, this is sufficient. Pagination is deferred to a future pass if high-volume courts require it.

---

## D-028 · 2026-06-24 · Plumbing-only fast-extract rule (no synthesis in C-Legal auto-fetch)

**Decision:** `legal_fetch_queries.py`'s fast-extract pass is strictly deterministic pattern matching. Every extracted field uses regex against the PDF text. Any field that cannot be regex-matched is set to `[extraction failed]`. No inference, no LLM call, no judgment-shaped work is performed.

**Context:** JR direction 2026-06-23: "This script does ONLY deterministic plumbing (HTTP, file I/O, deterministic PDF text extraction, SMTP). NO synthesis, NO LLM calls, NO judgment-shaped work. I would only want you to perform this summary and analysis." Synthesis is reserved for Mr.C in DD-029 (Skill 4 LR-CHAIN).

**Fields extracted (deterministic regex, fail-soft per field):**
- `parties` — regex on first v. caption block in PDF text
- `court` — from CourtListener `result["court"]` field; fallback to regex header in PDF
- `docket` — regex `Case No. NN-NNNN`; fallback to `result["docketNumber"]`
- `document_id` — `result["id"]` (CourtListener opinion ID, integer)
- `filing_date` — regex `Filed: <date>`; fallback to `result["dateFiled"]`
- `decision_date` — regex `Decided: <date>`
- `panel` — regex `Before <judge list>`
- `disposition` — regex AFFIRMED / REVERSED / REMANDED / VACATED / DISMISSED keyword
- `opening_holding` — first substantive paragraph after a section heading (regex)
- `citations` (first 6-10) — federal case citations (`NN F.Nd NN`, `NN U.S. NN`, `NN S.Ct. NN`) and statutes (`NN U.S.C. SS NN`)

**Why [extraction failed] and not null:**
The email and summary-file consumers expect a renderable string per field (not a Python `None`). `[extraction failed]` is human-readable, clearly signals absence, and is grep-stable. The downstream contract (DD-029 synthesis, Skill 4) is Mr.C reading the summary file in a live session — `[extraction failed]` is more communicative than blank or null.

**Trade-off accepted:** Regex-only extraction will miss fields in opinions with non-standard caption or disposition formats (e.g., per curiam orders, unusual docket numbering). This is an acceptable MVP limitation. Mr.C synthesis (Skill 4) is the authoritative read; fast-extract is JR's triaging signal, not the final record.

---

## D-029 · 2026-07-04 · SoD Museum manifest schemas + rendering split + `/museum` route wiring (DD-032 Checkpoint 1)

**Decision:** Five manifest schemas locked at v1 (`halls.json`, `cabinets.json`, `greeting.json`, `audio.json`, `narration.json`) with `$schema_version` semver on every file. Rendering split confirmed: DOM/CSS threshold in initial payload (≤ 2.5 MB), Three.js scene as `React.lazy` chunk (≤ 8 MB) requested only after capability check + threshold action. Route wiring: `/museum` nested route inside the landing app, museum sub-router owns internal routes.

**Context:** DD-032 SoD Museum architecture review, Checkpoint 1. Kickoff from Opus@COS 2026-07-04 (Chief of Staff Diary vault at `C Roles/Strategies/kickoffs/DD-032-Opus-CH-arch-review.md`). Full C1 artifact at `Terminal/Central Hub/SOD MUSEUM/session-logs/session-log-2026-07-04-c1-arch.md`. Chief's Chain resolution 2026-07-04 pre-cleared two flagged ambiguities (`audio.json` `cleared_status` field + `narration.json`/`greeting.json` multi-voice shape).

**Why the multi-voice shape (`greeting.json` + `narration.json`):**
- `voice_id`-keyed dict (`"jr"`, `"mr-c"`, extensible) with per-voice `audioUrl: nullable` and `text: required` decouples voice arc progress from museum ship gate. DD-015a's Round-1 audition runs on its own timeline; museum ships silent-narrated (music yes, voice no) as fully valid v1 state; voice locks land later as data-only edits to the manifest (no code change, no rework, no checkpoint reopening).
- No `register:` field at v1 per Opus@COS resolution — character metadata joins later when the voice-arc surface earns a formal registry, likely a future RM-002 amendment surface. Schema versioning preserves extensibility.

**Why `audio.json` includes `cleared_status`:**
- v1 entry is `"owner-delivered"` — Jahna's own composition, JR-delivered direct on 2026-07-03. No third-party rights clearance pending.
- v2+ catalog governance: LOFI_SANCT owns the manifest; future entries route through `"cleared"` (LOFI_SANCT clearance metadata attached) or `"pending"` (in-flight). Museum consumer refuses to bind a `"pending"` track. Fable §1.5's LOFI_SANCT ownership model is preserved without blocking v1 on LOFI_SANCT project state.

**Why lazy 3D chunk with pre-fetch capability check:**
- Family-first accessibility floor (DD-032 constraint) requires 2D fallback content-parity same-day. If capability check fails (no WebGL, reduced-motion set, mobile viewport), the 3D chunk is never requested — visitor routes to 2D directly. This protects the ≤ 2.5 MB initial payload budget for the accessibility-floor user cohort.
- Deferring the 3D chunk to post-threshold-action also lines up with the audio unlock gesture (Fable Dialogue 1 + 5 synthesis): browser autoplay policy requires an interaction; the same interaction gates the 3D chunk request.

**Why `/museum` route inside the landing app (not sub-app):**
- JR sign-off 2026-07-04 (DD-032 §Handoff decisions item 1): 3D chunk is lazy per this arch spec so it doesn't bloat the landing route; shared brand tokens automatically inherit; single React app to maintain; simpler CI/CD.

**Cross-manifest referential integrity constraints (ship-gate lint, Sonnet enforces):**
1. Every `halls[].cabinet_ids[]` resolves to a `cabinets[].id`.
2. Every `cabinets[].hall_id` resolves to a `halls[].id`.
3. Every `halls[].track_id` (non-null) resolves to a `tracks[].id` with `cleared_status ∈ {"owner-delivered", "cleared"}`.
4. Every `*_narration_id` (non-null) resolves to a `narrations{}` key.
5. Exactly one cabinet across `cabinets[]` has `playable: true` at v1 (Fable Dialogue 4 discipline).
6. Every non-sealed hall has non-empty `waypoint_ids[]`.
7. Every `narrations{}` entry has non-empty `text` regardless of any `audioUrl` state.

**Trade-off accepted:**
- `narration.json` carries placard *narration* text separately from `cabinets.json` `placard_copy_md` (the *visible* placard text). At v1 the two SHOULD match (Sonnet lint check); flexibility for narration prose vs. placard density is a v2+ pattern deferred here. Cost: one extra field per cabinet in narration.json.
- No `register:` schema field means C-Build can't auto-derive voice tempo/pause behavior from the manifest. Acceptable at v1 because DD-015a's TTS candidate (when locked) handles register via voice_id → provider pairing outside the manifest. Museum stays a data consumer, not a voice-arc governance surface.

**Sonnet unlocks at C1:**
1. Landing tile 05 delta (one PROJECTS entry, one TileArt motif, one `.tile-ink` accent class — zero grid CSS change).
2. Threshold DOM + CSS (Paper-dominant screen, two buttons, reduced-motion suppression).
3. `/museum` route wiring in landing app router; museum sub-router shell.
4. Manifest scaffolding — five JSON files at `<museum-root>/manifest/`.
5. Capability check module (WebGL + reduced-motion + viewport).
6. Cross-manifest ship-gate lint per constraints above.
7. Brand-token lint scaffold.

**Deferred to C2/C3:**
- Three.js scene, dolly path, waypoints, GLB pipeline (C2)
- 2D fallback renderer impl (C2)
- Cabinet zoom, placards render, playable mini-game (C2)
- Audio pipeline: transcode, hosting, Web Audio manager, `visibilitychange` pause (C3)
- Guest book pedestal (C3)
- Real placard copy per cabinet — JR content pass (C3)
- JR sign-off gate (C3 terminal)

**Files touched (this D-NNN):**
- `Terminal/Central Hub/SOD MUSEUM/session-logs/session-log-2026-07-04-c1-arch.md` — full C1 artifact
- `References/Designs/DD-032 SoD Museum — rotunda plus Classics hall.md` — Chain block updated with C1-landed marker
- `C Roles/Strategies/kickoffs/DD-032-Opus-CH-arch-review.md` — Chain acknowledgment from Opus@CH
- `Terminal/Central Hub/pipeline/DECISIONS.md` — this D-029 entry

**Open follow-up:** Vault-mirror path discrepancy for `quick-front-end/shade-of-design-landing/` flagged to Opus@COS in kickoff Chain 2026-07-04. Non-blocking on C1 landing; blocking on Sonnet's first working-tree touch. Awaiting Chief resolution.

---

## D-030 · 2026-07-04 · SoD Museum runtime pattern — CDN UMD + Babel-standalone + hash sub-router + `--museum-*` palette namespace (DD-032 Checkpoint 1 close)

**Decision:** The SoD Museum ships as a static entry page (`museum/index.html`) alongside the landing app, following the existing `weekly.html` + `unite-passion/nascar-basketball.html` precedent — not as a nested client route inside the landing app's SPA. Runtime is React 18 UMD + `@babel/standalone` in-browser JSX transpilation, matching the landing app's actual shipping mechanism (there is no `package.json`, no bundler, no ES module graph in this repo). Internal museum navigation uses an in-page hash sub-router (`#/rotunda`, `#/classics`, `#/classics/:cabinet-id`), not History-API paths. Museum CSS variables are namespaced as `--museum-ink`, `--museum-ember`, `--museum-ember-soft`, `--museum-slate`, `--museum-ocean`, `--museum-paper` — deliberately NOT reusing the site's `--ink`/`--ocean`/`--slate`/`--ember` variables.

**Context:** DD-032 Checkpoint 1 close. Full impl and sign-off logs at `Terminal/Central Hub/SOD MUSEUM/session-logs/session-log-2026-07-04-sonnet-c1-impl.md` and `session-log-2026-07-04-opus-c1-signoff.md`. C-Build surfaced five pattern-deviations from Fable's implementation strategy §2 and from Opus@CH's C1 artifact — all five confirmed by Opus@CH after live-repo verification.

**Why CDN UMD + Babel-standalone (not React + Vite):**
- Fable's implementation strategy §2 named "React + Vite" as the framework. The real repo does not have that — `index.html` loads React 18 + ReactDOM via UMD `<script>` CDN tags with `@babel/standalone` doing in-browser JSX transpilation of `.jsx` files loaded as `type="text/babel"` scripts. There is no `package.json` at the vault root or in the site directory, no Vite config, no ES module graph.
- The museum matches this reality rather than introduce a bundler for one sub-page. Zero new tooling; identical shipping mechanism to `landing.jsx` + `weekly.jsx`.
- **Ship-time payload note for C3:** the dev builds (`react.development.js`, `@babel/standalone/babel.min.js` ~700 KB) will need to swap to `.production.min.js` variants. A pre-transpile-at-ship-time approach would drop Babel-standalone entirely from the museum sub-page bundle; that pattern likely wants to spread to the main landing page later (Central Hub-wide payload win) but is out of DD-032 scope.

**Why hash sub-router (not History-API paths):**
- Hash routes always resolve to the same physical file regardless of hosting. No server rewrite config (`_redirects`, `netlify.toml`, `wrangler.toml`) exists anywhere in this repo to confirm path-based deep links would resolve correctly on a hard refresh.
- The precedent — `weekly.html`, `unite-passion/nascar-basketball.html` — is exactly this pattern: separate static entry pages accessed by relative href from the landing app, with any internal navigation happening within that page.
- Coordination question surfaced to Chief: which host serves shadeofdesign.net? Answer determines whether C2 can migrate to path-based routing safely.

**Why `--museum-*` palette namespace (critical architectural upgrade):**
- The landing site's `styles.css` defines `--ink`, `--ocean`, `--slate`, `--ember` as **theme-adaptive text-color tokens** — they flip value between light and dark themes (e.g. `--ink` becomes `#F3F4F6` in dark mode).
- DD-032's palette is a **closed brand palette with fixed hex values** — Ink `#0B1726` is the obsidian wall mass and must never flip with theme. Naive variable-name reuse would silently break the museum's palette under any theme toggle.
- Solution: museum-scoped variables (`--museum-ink` etc.) hold the fixed hex values from Fable §1.6 exactly. Brand-token lint enforces on **values**, not variable names — the `ALLOWED_HEX` set in `lint-brand-tokens.js` checks against `#0B1726 / #C97B4A / #E4A57E / #5D809D / #1A3E62 / #FAFAF7`, independent of any variable naming.
- **Pattern generalized:** future museum extensions (v2+ halls, cabinets, mini-games) inherit `--museum-*` namespace. Any future Central Hub React surface that needs a fixed brand palette (as distinct from theme-adaptive tokens) follows the same namespacing rule. Reusing site-wide theme variables in a fixed-palette context is a bug.

**Ship-gate lint scripts (Sonnet-owned, zero-dep Node):**
- `museum/lint/lint-manifests.js` — enforces the seven cross-manifest referential-integrity constraints from D-029 §1.6 + one bonus playable/game_module pairing check. Exits non-zero on violation.
- `museum/lint/lint-brand-tokens.js` — walks `museum/**/*.{css,jsx}`, flags any hex literal not in the six-value palette + one documented soft variant (`#E4A57E` — Ember-soft, precedent in landing.jsx TileArt). Scaffold mode at C1 (warn only); flips to enforce (exit non-zero) at C2/C3 per Opus@CH §6.
- Both run manually today. No CI pipeline exists at the vault root (no `.github/workflows`, no git repo at vault root — `git rev-parse --is-inside-work-tree` fails). When CI is established, wire these on any commit touching `museum/manifest/*` or `museum/**/*.{css,jsx}`.

**Font-loading scope discipline:**
- Fable §2 claim that Marcellus/Inter are "already served by the brand system" does not hold — the real `index.html` loads Space Grotesk + JetBrains Mono only.
- Marcellus is museum-only: added to `museum/index.html` via Google Fonts CDN link, not to the main landing page. This preserves the main landing's initial-payload budget while satisfying DD-032's "Marcellus greeting" spec. Payload impact ~30–50 KB on the museum sub-page.

**Trade-off accepted:**
- The runtime pattern (in-browser JSX transpilation via Babel-standalone) is not what a bundled React app would ship. Dev-build CDNs carry non-trivial payload. C3 swap-to-production + optional pre-transpile pattern are named risks, not yet resolved.
- Hash routing means deep-link URLs look like `museum/#/classics/classics-mazechase` rather than `museum/classics/classics-mazechase`. Cosmetic difference; content-parity and cold-load behavior are identical.
- Palette namespacing means museum CSS cannot benefit from any theme-token improvements the site makes later. Acceptable — the museum's palette IS the brand covenant here, not a themeable surface.

**Files touched (this D-NNN):**
- `Terminal/Central Hub/quick-front-end/shade-of-design-landing/landing.jsx` — tile 05 PROJECTS entry + `TileArt` `ink` motif branch
- `Terminal/Central Hub/quick-front-end/shade-of-design-landing/museum/index.html` — new static entry page
- `Terminal/Central Hub/quick-front-end/shade-of-design-landing/museum/museum.jsx` — new: threshold + hash sub-router + capability check + manifest loader
- `Terminal/Central Hub/quick-front-end/shade-of-design-landing/museum/museum.css` — new: `--museum-*` palette + threshold styles + stub styles
- `Terminal/Central Hub/quick-front-end/shade-of-design-landing/museum/manifest/{halls,cabinets,greeting,audio,narration}.json` — five schemas per D-029
- `Terminal/Central Hub/quick-front-end/shade-of-design-landing/museum/lint/lint-manifests.js` — new
- `Terminal/Central Hub/quick-front-end/shade-of-design-landing/museum/lint/lint-brand-tokens.js` — new
- `Terminal/Central Hub/SOD MUSEUM/session-logs/session-log-2026-07-04-sonnet-c1-impl.md` — C-Build impl log
- `Terminal/Central Hub/SOD MUSEUM/session-logs/session-log-2026-07-04-opus-c1-signoff.md` — Opus@CH sign-off log
- `References/Designs/DD-032 SoD Museum — rotunda plus Classics hall.md` — Chain block updated with C1-cleared marker

**Open follow-ups (surfaced to Mr. C at COS via kickoff Chain 2026-07-04):**
1. **Hosting-provider question** — which host serves shadeofdesign.net? Determines whether C2 can migrate to path-based routing.
2. **CI wiring** — if/when git + CI land at vault root, wire both lint scripts on manifest/museum-code commits.
3. **C3 payload-budget swap** — production React CDNs + optional pre-transpile-at-ship-time to drop Babel-standalone.

**Related decisions:**
- **D-029** — SoD Museum manifest schemas + rendering split + `/museum` route wiring (Checkpoint 1 planning artifact)
- **D-024** — Unite Passion as a Central Hub landing component (precedent for the sub-page pattern: `unite-passion/nascar-basketball.html` linked from tile 04)
- **D-025** — "Coming Soon" treatment for unbuilt landing surfaces (precedent for the sealed-hall "In formation" plaques)

---

## D-031 · 2026-07-04 · SoD Museum C2 close — Three.js r160 pin · plain-JS dynamic modules · Slate-on-Ink fail + fix · sealed-plaque static-DOM pattern (DD-032 Checkpoint 2)

**Decision:** Locks four architectural sub-decisions surfaced at DD-032 Checkpoint 2 sign-off. Extends the D-030 runtime pattern with three new invariants: (1) three.js version pin at r160 for the classic UMD build, (2) any dynamically-injected script module must be plain JS (not JSX), (3) WCAG-AA contrast is verified by direct relative-luminance math when automated tooling is unavailable, and estimates without measurement are prohibited. Also captures the sealed-door static-DOM pattern as the reference implementation for future museum halls.

**Context:** DD-032 Checkpoint 2 close. Full C2 arch artifact at `Terminal/Central Hub/SOD MUSEUM/session-logs/session-log-2026-07-04-c2-scene.md`; C-Build impl log at `session-log-2026-07-04-sonnet-c2-impl.md`; Opus@CH sign-off at `session-log-2026-07-04-opus-c2-signoff.md`. Four pattern-deviations flagged by C-Build, all confirmed after live-reality verification; two are spec errors on Opus@CH's side (r170 UMD path never existed; Slate contrast was estimated instead of computed).

**Sub-decision 1 — Three.js version pin at r160 (classic UMD boundary).**
- Three.js stopped shipping classic UMD `build/three.min.js` at r161. r170 (Opus@CH's arch spec pin) publishes only ES modules + CJS + WebGPU variants.
- The museum's runtime pattern (D-030: no bundler, no ES module graph, CDN `<script src>` injection with `window.THREE` global) requires the classic UMD build.
- **Pin: `three@0.160.0`.** Rationale: last version publishing the classic UMD build. Bumping past r160 requires a runtime-pattern expansion — a new named decision, not a silent upgrade.
- C3 forward risk: three.js loaders (`GLTFLoader`, `DRACOLoader`, `KTX2Loader`) live at `examples/jsm/loaders/*.js` — ES-module-only by folder convention across every three.js version. Loading real GLBs at C3 will require one of: (a) test whether `examples/js/loaders/*.js` (no "m") still ships at r160 or earlier; (b) expand D-030 runtime pattern to include `<script type="importmap">` + native ES-module scene entry (real architectural expansion, deserves its own D-NNN); (c) vendor a pre-bundled three-loaders build into `museum/assets/vendor/`. Opus@CH evaluates + names decision in C3 kickoff drafting.

**Sub-decision 2 — Dynamically-injected script modules must be plain JS, not JSX (D-030 runtime amendment).**
- Babel-standalone only auto-transforms `<script type="text/babel">` tags **present at initial page load**. A dynamically-injected `.jsx` module — which any lazy-loaded chunk necessarily is — never gets the Babel scan.
- Workaround alternatives (`Babel.transform()` + `eval()` on fetched source, or pre-transpiling at ship time) are both riskier and both diverge from the D-030 script-loading discipline.
- **Rule (extends D-030):** any script injected after initial page load — scene modules, game modules, future lazy-loaded features — must be plain JS with imperative code. JSX is available only for `.jsx` files present in `<script type="text/babel">` tags at initial HTML load.
- Applied at C2: `museum/scene/scene.js` is plain JS. Applied prospectively at C3: any lazy-loaded audio manager, guest-book module, or future hall extensions inherit this rule.
- Escape hatch: if a future feature requires JSX in a lazy-loaded module, the correct move is a D-NNN expansion of the runtime pattern (e.g., ship-time pre-transpile → drop Babel-standalone entirely) — not a per-file workaround.

**Sub-decision 3 — WCAG-AA contrast verified by direct math when automated tooling unavailable; estimates without measurement are prohibited.**
- C2 arch §4.2 estimated Slate-on-Ink (`#5D809D` on `#0B1726`) at "~4.6:1, borderline." Direct relative-luminance computation: **4.33:1 — an actual fail against the 4.5:1 body-text threshold.**
- C-Build attempted axe-core CDN injection per C2 verification protocol; harness auto-mode correctly denied unilateral external-script injection. Substituted direct WCAG relative-luminance math for every foreground/background pair in `museum.css`.
- **Rule:** for future museum contrast decisions (v2+ halls, C3 real-content pass), contrast is computed against the standard relative-luminance formula, not estimated. If estimate hedging appears in an arch spec (e.g., "borderline," "approximately"), it must be replaced with the computed number before the spec is dispatched to Sonnet.
- Fixes ratified at C2 impl:
  - `.threshold-btn-quiet:hover/:focus-visible` background: Slate → Paper (4.33:1 fail → 17.24:1 clear)
  - `.sealed-plaque-name` foreground: Slate → Paper (also 4.33:1 fail; the arch's "large-text exemption" claim was doubly wrong — 15px/600 doesn't meet WCAG large-text bar of 18.66px+bold or 24px+regular)
- **Slate retained only as decorative** — border colors, non-text glow — where WCAG's 3:1 non-text threshold applies (4.33:1 clears that comfortably).
- **C3 pre-close audit:** full axe-core pass still required to catch non-contrast issues (ARIA labeling, focus traps, semantic HTML, form associations). Path: JR runs axe DevTools browser extension, OR user explicitly pre-approves scoped axe-core CDN injection at C3 opening.

**Sub-decision 4 — Sealed-door plaques as static DOM row, not per-frame 3D-to-screen projection (arch §1.5 selection ratified).**
- C2 arch §1.5 explicitly left this to Sonnet's judgment ("both are viable"). C-Build chose static row shown only at `waypointId === "rotunda-center"`, hidden otherwise.
- Rationale: the camera only ever sees all four sealed doors from `rotunda-center` in v1 (sealed halls have empty `waypoint_ids[]` in `halls.json`, so no other camera position renders them in-frame). Per-frame `Vector3.project(camera)` recalculation would couple the DOM overlay layer to the render loop for zero visitor-observable benefit.
- **Reference pattern for v2+ hall openings:** when Racing (or any future hall) opens, its own `waypoint_ids[]` populate; sealed doors of *newer* halls behind it are rendered by the same static-DOM row pattern at the rotunda entry — no per-hall projection code needed.
- 2D fallback treatment: sealed hall cards render `sealed_plaque_text` directly (same content, container-appropriate rendering).

**Threshold-skip dead-end bug (fixed at C2, retroactively applies to C1 code):**
- Original: `showThreshold = !audioOptIn && (route === "/" || route === "")`
- With stale `#/rotunda` hash + no `sod_audio_optin` → threshold never rendered → `renderMode` stayed `null` → permanent "Loading…" stub
- Fix: `showThreshold = !audioOptIn` — gate on opt-in state alone
- **Lesson for verification protocol:** stale-state stress pass (retained localStorage + retained URL fragments from prior session) becomes a standard step at C3 and onward.

**Ship-gate lint additions locked:**
- `lint-manifests.js` constraint 8: every `cabinets[]` entry with `playable: false` has non-null `placard_copy_md` and non-null `placeholder_alt`
- `lint-manifests.js` constraint 9: every `cabinets[]` entry with `playable: true` has non-null `game_module` AND `museum/games/{game_module}.js` exists on disk
- `lint-brand-tokens.js` enforcement flipped to blocking; scan extended to `.js` files + Three.js-style `0x`-prefixed hex literals (not only CSS `#hex` strings)

**Trade-off accepted:**
- Pinning to r160 means the museum is one major version behind current three.js. WebGPU features, latest loader improvements, and any post-r160 API changes are unavailable until D-NNN loader-path decision resolves. Acceptable for v1 static scene needs.
- Plain-JS scene module means the imperative Three.js code doesn't benefit from React's declarative reconciliation. Acceptable — Three.js scene graph is imperative by nature; JSX earns nothing here.
- Slate is now a decorative-only color in the museum palette (border, glow, non-text). If future halls need Slate-typed text on Ink, a different foreground or background must be selected (Paper on Ink; Slate on Paper is 5.86:1 which clears). Palette remains closed (D-030); usage discipline is a lint policy, not a token change.

**Files touched (this D-NNN):**
- `Terminal/Central Hub/quick-front-end/shade-of-design-landing/museum/museum.jsx` — dynamic 3D injection, route dispatch, waypoint overlay, sealed-door row, threshold-dead-end fix
- `Terminal/Central Hub/quick-front-end/shade-of-design-landing/museum/museum.css` — scene mount, waypoint overlay, sealed plaques, cabinet detail, attract animation, gallery grids, game canvas, two WCAG contrast fixes
- `Terminal/Central Hub/quick-front-end/shade-of-design-landing/museum/index.html` — script tags for `games/maze-chase.js`, `cabinets/zoom-overlay.jsx`, `fallback/gallery.jsx` (load order before `museum.jsx`)
- `Terminal/Central Hub/quick-front-end/shade-of-design-landing/museum/scene/scene.js` — new, plain JS (not JSX per sub-decision 2)
- `Terminal/Central Hub/quick-front-end/shade-of-design-landing/museum/fallback/gallery.jsx` — new
- `Terminal/Central Hub/quick-front-end/shade-of-design-landing/museum/cabinets/zoom-overlay.jsx` — new
- `Terminal/Central Hub/quick-front-end/shade-of-design-landing/museum/games/maze-chase.js` — new
- `Terminal/Central Hub/quick-front-end/shade-of-design-landing/museum/lint/lint-manifests.js` — constraints 8+9
- `Terminal/Central Hub/quick-front-end/shade-of-design-landing/museum/lint/lint-brand-tokens.js` — enforcement blocking, scan extended
- `Terminal/Central Hub/SOD MUSEUM/session-logs/session-log-2026-07-04-sonnet-c2-impl.md` — C-Build impl log
- `Terminal/Central Hub/SOD MUSEUM/session-logs/session-log-2026-07-04-opus-c2-signoff.md` — Opus@CH sign-off log
- `References/Designs/DD-032 SoD Museum — rotunda plus Classics hall.md` — Chain block updated with C2-cleared marker

**Open follow-ups (surfaced to Mr. C at COS via kickoff Chain 2026-07-04):**
1. **Loader-path decision needs its own D-NNN before C3 execution** (three options above)
2. **Full axe-core pass** — JR runs DevTools extension OR user pre-approves scoped CDN injection at C3
3. **Exhaustive Tab-order fuzz** — extend C2 verification protocol at C3 close
4. **Stale-state stress pass** — standard step at C3
5. **3D chunk re-measurement** with real GLBs + Draco/KTX2 decoders (estimated ~230 KB + ~750 KB overhead + GLB assets)
6. **Production-CDN swap + optional pre-transpile** (unchanged from C1)
7. **Hosting provider question** (unchanged from C1)
8. **Git + CI wiring** (unchanged from C1)

**Related decisions:**
- **D-030** — SoD Museum runtime pattern (this decision extends it with three new invariants)
- **D-029** — SoD Museum manifest schemas (unchanged; C2 consumes without modifying)
- **D-024** — Unite Passion as Central Hub landing component (sub-page precedent for `museum/index.html`)
- **D-025** — "Coming Soon" pattern for unbuilt landing surfaces (precedent for sealed-hall "In formation" plaques)

---

## D-033 · 2026-07-05 · SoD Museum three.js loader-path = vendored pre-bundled build (DD-032 Checkpoint 3 planning)

**Decision:** Ship `museum/assets/vendor/three-with-loaders-r160.min.js` — a one-time offline `esbuild` pass bundles `three@0.160.0` + `GLTFLoader` + `DRACOLoader` + `KTX2Loader` into a single IIFE that exposes `window.THREE` and its loader properties. C-Build's C3 impl first step: reality-check r160's `examples/js/loaders/*.js` availability against unpkg; adopt Option 1 (three CDN script tags) if all three URLs return 200 classic JS, else adopt this vendored pattern.

**Context:** DD-032 Checkpoint 3 planning. Full C3 arch artifact at `Terminal/Central Hub/SOD MUSEUM/session-logs/session-log-2026-07-05-c3-arch.md` §4. Chief C3 pre-lift-off (`kickoffs/DD-032-Opus-CH-c3-arch.md` §PD-C) delegated the loader-path evaluation to Opus@CH with a reality-check-first requirement. Three options were on the table:

1. Legacy `examples/js/loaders/*.js` at r160 (classic script build, no ES modules)
2. Import maps + native ES modules (real D-030 runtime pattern expansion)
3. Vendored pre-bundled build via offline `esbuild` pass

**Why Option 3 as the locked default:**
- **Lowest risk against Opus@CH's calibration record on CDN paths.** C2 PD1 caught the r170 UMD path never existing; C2 PD1 second flag confirmed `examples/jsm/` are ES-module-only across every three.js version. A vendored bundle removes CDN paths from the equation entirely for the 3D chunk.
- **Consistent with the offline-pipeline discipline.** GLB compression (`gltf-transform`) already runs offline in Central Hub's museum pipeline (per C2 arch §2.1). Adding a one-time `esbuild` pass for the three.js stack matches that pattern — same category of tooling, same "commit the compressed artifact, not the toolchain" discipline.
- **Bit-perfect version pin.** The bundle contains exactly what was tested against — no CDN drift, no unpkg outage risk during ship verification.
- **Same-origin loading via Netlify** (per D-032). No third-party CDN latency on the 3D-chunk critical path.

**Why Option 1 stays as a fallback (not the default):**
Opus@CH's C3 arch (§4.4) named this as C-Build's first C3 impl action. If `curl` against `https://unpkg.com/three@0.160.0/examples/js/loaders/GLTFLoader.js` (and the DRACO + KTX2 sibling paths) returns 200 with `Content-Type: application/javascript` for all three, C-Build adopts Option 1 — three CDN script tags in sequence, matching D-030's existing pattern with no offline bundler step. Historical note: three.js deprecated the `examples/js/` classic-loader tree around r148 (2023), so reality expectation is 404 across all three URLs — but the reality-check runs regardless per Opus@CH's own meta-honesty rule from C2 signoff (CDN paths get live-verified before the pattern is locked).

**Why not Option 2 (import maps + native ES modules):**
- Would require D-030 runtime pattern expansion — a new D-NNN in its own right (import maps + ES-module script types + JSX-to-plain-JS boundary redefined).
- Scene.js becomes an ES module, which changes the Babel-standalone interaction shape from D-031 (currently plain JS, imperative). Manageable but non-trivial to test.
- No decisive advantage over Option 3 for the museum's single-page-of-content use case. Import maps shine when many modules need coordinated version resolution — museum has one three.js stack, one scene.

**Bundler command (Sonnet runs at C3 impl start, if Option 3 lands):**

```
# entry file at museum/assets/vendor/bundle-entry.js
# imports three@0.160.0 + GLTFLoader + DRACOLoader + KTX2Loader
# re-exports as window.THREE.* globals

npx esbuild \
  --bundle \
  --minify \
  --format=iife \
  --global-name=THREE_BUNDLE \
  --outfile=museum/assets/vendor/three-with-loaders-r160.min.js \
  museum/assets/vendor/bundle-entry.js
```

The `THREE_BUNDLE` IIFE global is unwrapped inside `bundle-entry.js` to expose the more idiomatic `window.THREE` + loader properties, matching the API shape scene.js already consumes.

**Payload impact estimate:**
Vendored bundle: ~1.8-2.2 MB (three.js core ~640 KB + GLTFLoader ~90 KB + DRACOLoader ~230 KB + KTX2Loader ~750 KB, minified + dedup'd). Well under the 8 MB 3D-chunk ceiling; leaves comfortable headroom for real rotunda + Classics GLBs at ~1.8-2.5 MB each.

**Runtime pattern impact (extends D-030):**
- Runtime pattern **unchanged.** Museum still runs CDN UMD + Babel-standalone for React + landing scripts.
- Offline-pipeline discipline **extended.** The pipeline now bundles the 3D-chunk vendor artifact in addition to compressing GLBs. Both are one-time offline steps, both produce committed static assets, neither requires a runtime bundler dependency.
- Version-bump discipline: any future three.js version change re-runs `esbuild` against the updated pin, re-tests, re-commits the vendored artifact. Deliberate, auditable, version-controlled.

**Trade-off accepted:**
- One-time `esbuild` toolchain requirement at C3 impl start. Node CLI invoked via `npx` — no `package.json`, no local `node_modules` retained (npx caches globally). Consistent with the `gltf-transform` CLI pattern already in the museum pipeline.
- Bundle size (~2 MB) is fixed even if a future feature only needs three.js core without loaders. Acceptable at v1 given the 8 MB chunk ceiling has ~6 MB headroom.
- If reality-check shows Option 1 works, this D-033 records the fallback landing as authoritative — the option matrix stays on the record as the reasoning archive, even though only one branch ships.

**Files touched (this D-NNN):**
- `Terminal/Central Hub/SOD MUSEUM/session-logs/session-log-2026-07-05-c3-arch.md` — C3 arch artifact §4 (loader-path analysis + Option 3 lock + Option 1 fallback protocol)
- `Terminal/Central Hub/pipeline/DECISIONS.md` — this entry
- (C3 impl-side; not yet touched at planning stage): `museum/assets/vendor/bundle-entry.js`, `museum/assets/vendor/three-with-loaders-r160.min.js`, `museum/index.html` (script tag for vendored bundle in place of any three CDN references), `museum/scene/scene.js` (unchanged; still consumes `window.THREE.*` API)

**Open follow-up:** C-Build's C3 impl first step is the reality-check + Option 1-vs-Option 3 branch resolution. Outcome logged in C-Build's C3 impl session log; if Option 1 unexpectedly wins, D-033 gets a follow-up entry noting the branch selection (no reversal of this decision — just documentation of the fallback landing).

**Related decisions:**
- **D-032** — Hosting on Netlify (2026-07-05); enables same-origin loading of the vendored bundle
- **D-031** — Dynamically-injected modules must be plain JS (2026-07-04); scene.js unchanged by this decision
- **D-030** — SoD Museum runtime pattern (2026-07-04); offline-pipeline discipline extended by this decision; runtime pattern unchanged
- **D-029** — SoD Museum manifest schemas (2026-07-04); unchanged

---

## D-034 · 2026-07-05 · SoD Museum C3 impl-review resolutions — programmatic scene as v1 real content · Babel pre-transpile via JR authorization · vendored bundle deferred to v2 · audio codec + duration corrections (DD-032)

**Decision:** Five resolutions from the C3 impl review (C-Build's log at `SOD MUSEUM/session-logs/session-log-2026-07-05-sonnet-c3-impl.md`, Opus@CH + C-Prime review, JR direction 2026-07-05):

**1. Programmatic scene expansion ships v1; authored GLBs move to v2+.**
JR's intro file names the vision as a "crystalized structure of Obsidian" — faceted, flat-shaded procedural geometry IS that vision, not an approximation of it. `scene.js` v1 geometry is reclassified as authored procedural art held to the real-content bar (authorship is what the doll-without-a-soul rule gates on, not asset provenance). Full composition spec at `SOD MUSEUM/session-logs/session-log-2026-07-05-c3-arch-addendum-scene.md` §A.1: faceted rotunda drum with Ember vein seams, Ocean-darkened height, five doorway arches (Classics open with light spill, four sealed with perimeter glow), faceted Classics gallery with depth fog and three cabinet silhouettes (emissive marquee + flickering screen planes, playable cabinet findable by brighter light). No textures introduced → no GLTFLoader/DRACOLoader/KTX2Loader needed at v1. Authored GLBs land at v2+ as data-only asset swap.

**2. Babel pre-transpile resolves via JR in-session authorization, not a local toolchain run.**
C-Build's C3 session measured `@babel/standalone` at 3.14 MB (his own C2 estimate of ~700 KB was 4.5× low — flagged by C-Build against himself, same discipline as flagging Opus errors) — alone exceeding the entire 2.5 MB initial-payload ceiling. Harness policy correctly denied unilateral transpile-tool execution. Resolution: JR pastes a verbatim scoped authorization at C-Build's next session start (text in addendum §A.2) covering `npx` + @babel/cli/@babel/core/@babel/preset-react for the four museum `.jsx` files + the `index.html` script-tag swap. Projected payload after: ≈ 0.2 MB (from 3.19 MB). **Ripple to D-031:** once museum `.jsx` are pre-transpiled, the "dynamically-injected modules must be plain JS" rule is moot for the museum but stays authoritative for Babel-standalone surfaces (landing page). Transpile joins the museum offline pipeline: edit `.jsx` → re-transpile → commit both.

**3. Vendored Three.js bundle (D-033) deferred to v2 — dissolved, not blocked.**
The bundle's only job is carrying GLB loaders; resolution 1 means v1 has no GLBs and no textures. Three.js r160 core continues via the existing CDN UMD path. At v2 GLB arrival, JR grants a scoped esbuild authorization (same sentence pattern as resolution 2) and D-033's Option 3 builds then. **D-033 follow-up recorded here:** C-Build's reality-check confirmed Option 1 dead — `three@0.160.0/examples/js/loaders/{GLTFLoader,DRACOLoader,KTX2Loader}.js` all 404. Option 3 is the only path when the moment comes.

**4. Audio codec-sniff MIME corrected: `audio/ogg; codecs="opus"`, not `audio/webm; codecs=opus`.**
Opus@CH's C3 arch §1.5 specified the WebM probe; `ffmpeg -c:a libopus` with `.opus` extension produces an **Ogg** container (verified via `ffprobe format_name`). The WebM probe checks the wrong container entirely. C-Build corrected and live-verified (browser chose + fetched `.opus` via network log). **Opus@CH calibration record: fifth spec error, new category — external-tool output formats assumed instead of verified.** Pre-publish reality-check rule now covers three categories: CDN paths · contrast math · tool output formats.

**5. Duration reads from decoded `AudioBuffer.duration` at runtime, never the manifest field.**
AAC encoder priming-sample padding inflates `ffprobe` duration on the `.aac` (140.45s vs. the true 137.84s on source WAV + `.opus`). C-Build's audio manager reads `buffer.duration` from the actually-decoded buffer for crossfade scheduling — structurally sidestepping the encoder-discrepancy class rather than trusting either encoder's number. `audio.json.duration_seconds` carries the true source value as documentation, not as a scheduling input. **Pattern generalizable:** runtime-decoded truth over static manifest metadata wherever both exist.

**Bugs fixed at C3 impl (recorded for the verification-protocol archive):**
- Missing `<script>` tag for `guest-book-modal.jsx` crashed the app on first "Enter with sound" (React error #130). Caught live, fixed, re-verified. Lesson: new-file checklist includes the HTML wiring, not just the file.
- Volume-control mute toggle mishandled the "stale sound opt-in, no live AudioContext" state (would have tried to mute a nonexistent session). Fixed: toggle checks `window.AudioManager` existence before state logic, lazy-starts if absent. Found by the PD-E stale-state stress pass — the protocol adopted at C2 close caught a real bug in its first standing run.

**Ship-gate trajectory after these resolutions:** initial payload clears at C-Build's next session (§A.2 transpile); real-content ship bar clears on geometry (§A.1) with only the always-planned JR content pass remaining (placards, guest-book wording, tile blurb); axe DevTools + Tab-fuzz remain JR's pre-close pass (PD-D). **No tool blockers remain in the ship path.**

**Files touched (this D-NNN):**
- `Terminal/Central Hub/SOD MUSEUM/session-logs/session-log-2026-07-05-c3-arch-addendum-scene.md` — scene spec + blocker resolutions (new)
- `Terminal/Central Hub/SOD MUSEUM/session-logs/session-log-2026-07-05-sonnet-c3-impl.md` — C-Build impl log (referenced)
- `C Roles/Strategies/kickoffs/DD-032-C-Build-c3-shipbar.md` — Chain entry staging C-Build's next session
- `Terminal/Central Hub/pipeline/DECISIONS.md` — this entry

**Related decisions:**
- **D-033** — loader-path (Option 1 confirmed dead here; Option 3 deferred to v2)
- **D-032** — Netlify hosting (unchanged)
- **D-031** — plain-JS rule (scoped down to Babel-standalone surfaces once museum transpiles)
- **D-030** — runtime pattern (offline pipeline gains the transpile step)

---

## D-035 · 2026-07-05 · SoD Museum C3 terminal close — obsidian material spec + IIFE-wrap rule for pre-transpiled modules (DD-032)

**Decision:** Two live-verification discoveries from C-Build's C3 amended pass are captured as forward-facing patterns for future museum work and any Central Hub React surface that follows the museum's runtime path:

**1. Obsidian material spec — roughness 0.35, metalness 0.2, plus a HemisphereLight legibility floor — is the correct material vocabulary for faceted-obsidian rendering under sparse-PointLight budgets.**
D-034 addendum §A.1 named "facet seams are the crystal structure" but did not specify the material response that lets sparse point lighting *reveal* those seams. C-Build's first pass used matte `roughness: 0.9`; result was a formless soft glow that contradicted the crystal reading. Root cause: obsidian is volcanic *glass*, not matte stone; a highly diffuse material cannot carry specular facet-edge contrast under sparse point lighting no matter how the geometry is built.

**Locked material spec for future museum halls using the faceted-obsidian language:**
- Wall + ceiling `MeshStandardMaterial` with `flatShading: true`, `roughness: 0.35`, `metalness: 0.2`
- One `THREE.HemisphereLight` intensity 0.5 as a legibility floor (does NOT count against the PointLight budget — HemisphereLight is a separate light type)
- PointLight budget from D-034 addendum §A.1 (≤ 6) remains authoritative
- Ambient intensity stays low; **do not brighten the room to solve legibility.** Palette-albedo ceiling is the moody register; C-Build's interim ambient-2.2 test confirmed this and was reverted before ship. Future work inherits: legibility issues are material-response problems first, lighting-budget problems second, ambient-brightness problems never.

**2. IIFE-wrap rule — any pre-transpiled museum module (post-JSX `.js`) must be wrapped in an IIFE to preserve top-level scope isolation.**
Under `<script type="text/babel">` + Babel-standalone (C1/C2 pattern), each script gets its own evaluation wrapper — top-level `const { useState, useEffect } = React;` destructures across multiple files never collide. Under classic `<script src>` tags (C3 post-transpile pattern), all files share the single global lexical scope per HTML spec — second and third files' `const useState` redeclare the first's, producing a parse-time `SyntaxError` that aborts the entire script (mimicking C2's Bug 1 symptom shape, with a completely different root cause).

**Locked rule:** every `.js` file emitted from the museum's Babel pre-transpile pass is post-processed to wrap the entire body in `(function () { "use strict"; ...; })();`. Explicit `window.X = ...` global exports each file already performs at its top level continue to work; only closure-scoped declarations (`const`/`let`/`function`) are isolated. Applies to all four current museum `.js` files (`museum.js`, `fallback/gallery.js`, `cabinets/zoom-overlay.js`, `rotunda/guest-book-modal.js`) and any future museum surface that adds a new `.jsx` source consuming top-level React destructures.

**Extends D-031:** D-031 said "dynamically-injected modules must be plain JS, not JSX." D-035 says "*initial-load* modules that were transpiled from JSX must also be IIFE-wrapped when they share a page." Combined: the museum runtime pattern now has two shape-preservation rules for React-destructured code, both in the same spirit — don't let two different loading mechanisms collide at the global scope layer.

**Transpile config (also locked):**
- `babel.config.json` uses `{"runtime": "classic"}` — automatic runtime defaults to `import ... from "react/jsx-dev-runtime"` which is incompatible with the no-bundler + global-`React` CDN pattern
- Config file is created for the transpile pass and deleted after — not committed to the museum tree (tooling config stays out of the shipped codebase per D-030 discipline)
- `NODE_PATH` may need to point at the npx cache's `node_modules` under Node 24 to resolve preset/CLI packages — mechanical resolution fix, not a scope change

**Additional C3 close observations (non-decisional, recorded for the archive):**
- Sealed-doorway `angleDeg` values re-spaced to true 72° even (72/144/216/288) from prior uneven cluster (90/162/198/270). Internal-only; no external contract reads these angles. Confirms `manifest/halls.json` remains the sole external contract for hall identity/state.
- Preview-tooling degradation across long-lived preview tab recommended a fresh-session re-verification before JR's walk. Not a ship-gate blocker; carried forward as the first item in JR's pre-close corridor.

**Calibration record final state (across DD-032 C1–C3):**
Five spec errors on Opus@CH's side, all in the "external-tool-or-format-behavior assumed instead of verified" category (CDN paths · contrast math · tool output formats). Pre-publish reality-check discipline is a standing rule from C3 close onward. C-Build's calibration was equally honest — his own C2 Babel-standalone size estimate (~700 KB) was 4.5× low; he flagged that on the C3 impl log with the same discipline he flagged Opus errors. Pattern-deviation rule earned its keep at every checkpoint of this DD.

**Files touched (this D-NNN):**
- `Terminal/Central Hub/SOD MUSEUM/session-logs/session-log-2026-07-05-sonnet-c3-impl-amended.md` — C-Build amended impl log (referenced)
- `Terminal/Central Hub/SOD MUSEUM/session-logs/session-log-2026-07-05-opus-c3-signoff.md` — Opus@CH terminal sign-off (this D-NNN's context)
- `Terminal/Central Hub/quick-front-end/shade-of-design-landing/museum/scene/scene.js` — geometry pass + material tuning
- `Terminal/Central Hub/quick-front-end/shade-of-design-landing/museum/*.js` — 4 IIFE-wrapped transpiled outputs (from `museum.jsx`, `fallback/gallery.jsx`, `cabinets/zoom-overlay.jsx`, `rotunda/guest-book-modal.jsx`)
- `Terminal/Central Hub/quick-front-end/shade-of-design-landing/museum/index.html` — script tag swap: 4 `.jsx` + Babel-standalone → 4 `.js`
- `Terminal/Central Hub/pipeline/DECISIONS.md` — this entry

**Related decisions:**
- **D-034** — C3 impl-review resolutions (programmatic scene decision this D-035 completes)
- **D-031** — Plain-JS rule (extended by D-035's IIFE-wrap rule)
- **D-030** — Runtime pattern (offline pipeline now includes transpile + IIFE-wrap steps)
- **D-029** — Manifest schemas (unchanged)

**Future asset-library DD (JR note 2026-07-05):** JR has flagged exploration of a curated or authored asset library (potentially GLB, potentially other formats) as a separate DD to open post-merge. Not scoped in DD-032; the programmatic-scene v1 posture from D-034 is the ship posture. Authored GLBs remain the v2+ upgrade path through the same data-only asset-swap seam if that future exploration lands them.

---

## D-032 · 2026-07-05 · SoD hosting provider — Netlify for `shadeofdesign.net` (DD-032 pre-C3, resolves C1 signoff follow-up #7)

**Decision:** `shadeofdesign.net` hosts on **Netlify**. Museum route (`/museum`) ships as a sub-path of the landing app on the same domain, no separate deploy target. JR direction 2026-07-05.

**Context:** Hosting provider was named as an open Chief-side follow-up in Opus@CH's C1 signoff (item #7) and re-flagged in the C2 signoff carry-forward. Blocking-adjacent for C3 audio pipeline work — real `audio.json` URLs need a resolved host to point at (transcoded AAC/Opus files served from the same origin as the site, or from a Netlify-hosted asset path).

**Implications for C3:**
- **Audio hosting path:** transcoded audio files (Jahna WAV → AAC + Opus per C3 audio pipeline unlock) land under `quick-front-end/shade-of-design-landing/museum/audio/` (or a Netlify-configured asset path) and are served same-origin. No third-party CDN dependency for audio at v1. Same-origin also sidesteps CORS friction for the Web Audio manager.
- **Deploy target:** Netlify auto-deploy from `main` branch (per JR's earlier landing-site convention). No changes to CI wiring required for the museum route itself — it's part of the same Vite/HTML bundle the rest of the landing already ships.
- **Merge posture unchanged:** museum stays on `claude/dark-pivot` until C3 close + JR sign-off. Netlify only sees `main`; no accidental preview exposure of C2 placeholder state.
- **Loader-path decision (open D-NNN):** unchanged by hosting choice. `three@0.160.0` still injected from `unpkg` CDN per D-030 runtime pattern; hosting decision is orthogonal to that D-NNN.

**Open follow-ups closed by this decision:**
- ✅ C1 signoff follow-up #7 — "Hosting provider for `shadeofdesign.net`" — resolved
- ✅ C2 signoff carry-forward — hosting-provider unblocker for C3 audio pipeline — resolved

**Related decisions:**
- **D-030** — SoD Museum runtime pattern (Netlify hosts the same static assets D-030 describes)
- **D-029** — SoD Museum manifest schemas (audio.json.tracks[].url now has a real host to point at)
- **D-024** — Unite Passion as Central Hub landing component (same landing app, same deploy target)

---

## D-036 · 2026-07-11 · DD-037 Phase 1 seam — manifest-only rendering, visibility default-Private, id/title derivation

**Decision:** `pipeline/legal/export_manifests.py` is the sole reader of `research/data/legal/{cases,field-clerks}/*.md`. It parses YAML frontmatter, splits the body into sections on H2 (`## `) headings, and writes `cases.json` + `field-clerks.json` to `quick-front-end/shade-of-design-landing/sr-playspace/data/`. The `sr-playspace/index.html` route reads those two JSON files only — it never opens a vault markdown path. One code path; no per-surface parsing anywhere else.

**Context:** DD-037 Phase 1 (the walking skeleton) locks this as the spine every later SR play-space phase renders through. Full spec: [[References/Designs/DD-037 SR legal play-space and manifest seam]] and `_village-embassy/Fable/FABLE-RETURN-JR_DD010-round2.md` (Phase 1 section, Standing Rules).

### Visibility boundary — missing field is Private, not an error

Per Standing Rule #6: each corpus file's frontmatter carries `visibility: Private | Public`. The exporter emits a file to the manifest **only** if `visibility: Public`. A missing or absent field is **Private** — silently excluded, fail-safe. This is the expected outcome for nearly the whole corpus, not a validation failure.

This phase, `visibility: Public` was added to exactly two files (JR-authorized skeleton artifacts, public-domain-derived): `research/data/legal/cases/trump_v_cook.md` and `research/data/legal/field-clerks/25A312.md`. No other corpus file was touched — leaving them unmarked is what proves the boundary, by excluding them.

### Blocking validation applies only to files already marked Public

The schema's required fields are `id`, `docket_number`, `title`, `visibility`. A file that is Private (or unmarked) is excluded before validation ever runs on it — that's not a failure. A file that **is** marked `visibility: Public` and is then missing `docket_number` or has no H1 (`# `) heading to derive a title from aborts the **entire export**, naming the file path and the missing field, and no manifest is written. Verified: stripping `docket_number:` from a copy of `trump_v_cook.md` exits non-zero with `<path>: missing required field 'docket_number'`; the real corpus file and the last-good manifests were untouched.

### `id` and `title` are derived, not new frontmatter fields

The corpus has no `id:` or `title:` frontmatter key today — `docket_number` and the body's H1 heading already carry that information. Per Standing Rule #2 ("upstream stays downstream-ignorant... the synthesis pipeline never changes shape to feed a UI"), the exporter derives `id <- docket_number` and `title <- H1 heading text` rather than asking C-Legal's synthesis output to grow UI-shaped fields. If the source data for a derivation is missing on a Public file, that's still the same blocking validation failure named above — derivation doesn't create a silent fallback, it just avoids inventing a redundant frontmatter key for something already on the page.

**Trade-off accepted:** `court` and `decision_date` are `null` for field-clerk entries (that frontmatter shape doesn't carry them) — expected, not an error; case.md entries have both. `tags` falls back to `area_of_law` when a file has no `tags` field (case.md uses `area_of_law`; field-clerk files use `tags` directly) — a derivation, not a corpus edit.

**Cross-refs (Phase 1 scope):** `cross_refs[]` is the raw `[[wikilink]]` target list from the body, unresolved and unnormalized (some targets are docket numbers, some are filename slugs like `trump_v_slaughter`). Resolving these to site routes is explicitly Phase 2's job (`FABLE-RETURN-JR_DD010-round2.md`); Phase 1's renderer displays a wikilink as plain styled text (`.pw-xref`), never a broken link.

**Verified end-to-end (DD-037 Phase 1 DoD):** Cook (25A312) renders on the real path — vault `.md` → `export_manifests.py` → `field-clerks.json` → `sr-playspace/index.html` — legible at 375px mobile width, no horizontal scroll, no broken sections. Manifest boundary check: exactly 2 total entries (1 case + 1 field-clerk) across the whole corpus, matching the two Public-marked files.

**Files touched:**
- `pipeline/legal/export_manifests.py` (new)
- `quick-front-end/shade-of-design-landing/sr-playspace/index.html`, `playspace.css`, `playspace.js` (new)
- `quick-front-end/shade-of-design-landing/sr-playspace/data/cases.json`, `field-clerks.json` (generated, not hand-edited)
- `research/data/legal/cases/trump_v_cook.md` — added `visibility: Public`
- `research/data/legal/field-clerks/25A312.md` — added `visibility: Public`

**Not built (Phase 1 guardrails, deliberately):** no browse/shelf/gallery chrome, no `--sr-*` regal tokens (SoD dark only — Ink `#0B1726` / Paper `#FAFAF7` / Marcellus headings / Inter body / JetBrains Mono), no cross-ref resolution, no stat/metadata chips on the document view, no connection to DD-026's fetch output. Deferred to Phase 2+ per `FABLE-RETURN-JR_DD010-round2.md`.

---

## D-037 · 2026-07-12 · DD-037 Phase 2 reading room — hash routing, id-only cross-ref resolution, preamble-capture parser fix, nested-emphasis renderer fix

**Decision:** `sr-playspace/index.html` becomes a single-page hash router (`#/fc/<id>`, `#/case/<id>`, default = plain Cases/Field Clerks index) rendering the full `visibility: Public` corpus through two templates sharing one family (Field Clerk / Case Synthesis, distinguished by a kind-label under the docket line). Cross-ref resolution, the three sanctioned expressive jewels, and two real parser bugs found against real content are all in this ship.

**Context:** DD-037 Phase 2 (`C Roles/Strategies/kickoffs/DD-037-CBuild-phase2.md`). JR hand-marked the Phase-2 corpus `visibility: Public` before dispatch (Standing Rule #6 — not C-Build's to touch): 3 cases (`trump_v_cook`, `trump_v_slaughter`, `26-1575` the ORDER exemplar) + 5 field-clerks (`21-1729`, `24-1990`, `24-2242`, `25-332`, `25A312`). C-Build did not add or change any `visibility:` field — whatever was Public at build time is what's reflected below.

### Cross-ref resolution matches on manifest `id` only — no schema change

Per pre-decision 2, the renderer resolves a `[[wikilink]]` by checking whether its target matches an `id` already present in the loaded `cases.json` / `field-clerks.json` — the exporter's `cross_refs[]` stays raw wikilink targets, untouched. When an id exists in both manifests, the Field Clerk wins (the SR-reading surface; the FC's own paired-case link carries the rest) — implemented by building the id->kind lookup from cases first, then letting field-clerks overwrite.

**This is a literal match, not a slug match.** The real corpus uses two different wikilink conventions: field-clerk files cross-reference by docket number (`[[24-1990]]`, `[[25-332|Slaughter]]`) — these resolve, because manifest `id` **is** `docket_number`. Case.md files cross-reference each other by **filename slug** (`[[trump_v_slaughter|Trump v. Slaughter]]`) — these do **not** resolve, because no manifest entry has `id: "trump_v_slaughter"` (Slaughter's id is `25-332`). This was verified as the intended design, not a gap: pre-decision 2 explicitly states "no schema change," and the packet's own DoD gate C example (Cook FC -> Slaughter FC) is a docket-style link, not a slug-style one — the packet author anticipated exactly this mechanism.

**Verified live in real content, no fixtures:** `fc/25A312` (Cook) -> `[[25-332|Slaughter]]` resolves to `#/fc/25-332` and navigates in-page correctly (clicked, confirmed via `location.hash` + rendered title). `fc/24-2242` (Erdemir) -> `[[25-1807]]` (not in JR's Public set) degrades to the Phase-1 styled span, not a broken link. Case-side slug links degrade the same way for the same reason (target doesn't match any manifest id) — not a bug, the direct consequence of "no schema change."

### Parser fix 1 — preamble between H1 and first H2 was silently dropped

`export_manifests.py`'s `_split_sections` discarded any content between the body's H1 title and its first H2 heading. Phase 1's fixture files happened to have none; `26-1575.md` (the ORDER exemplar, read for Phase 2) has a calibration blockquote there ("This is the ORDER in the corpus...") that was being silently lost. Fixed by capturing that span as a `heading: ""` lead section when non-empty, instead of dropping it. No schema change — `heading` was always a string. Renderer skips the `<h2>` element when `heading` is falsy, so the unheaded section reads as plain body text, not an error state.

### Parser fix 2 — nested/asymmetric emphasis, found against real content, not anticipated in the kickoff

The corpus uses markdown-emphasis patterns a naive sequential-regex approach cannot render correctly, both found live while testing the actual Public set (not caught by inspection — the DOM had to be checked for stray asterisks to surface them):

1. **Asymmetric triple-asterisk callouts**, e.g. `***Humphrey's Executor*, 295 U.S. 602 (1935) -- OVERRULED TODAY:**` — opens bold+italic together but closes the italic after just the case name (single `*`), then closes the bold later (`**`). This is NOT a symmetric `***text***`; a first attempt treating it as one produced garbled output (stray literal asterisks, an `<em>` spanning several unrelated sentences). Fixed with a dedicated pattern matched before the plain bold/italic passes: `\*\*\*([^*]+?)\*([^*]*?)\*\*` -> `<strong><em>$1</em>$2</strong>`, with a true-symmetric `***text***` kept as a fallback pass.
2. **Bold spans containing a nested italic case name**, e.g. `**whether *Humphrey's Executor v. United States*, 295 U.S. 602 (1935)**` — a plain `\*\*([^*]+)\*\*` bold regex can't match across the inner single-star pair (`[^*]+` forbids any asterisk), so the whole span fell through both passes as literal asterisks. Fixed by widening the bold pattern to `\*\*((?:[^*]|\*[^*]+\*)+)\*\*` (non-star runs OR a nested `*italic*` span) and rendering the inner italic before wrapping in `<strong>`.

**Verified:** scripted a check across all 8 rendered documents' `document.body.innerText` for any remaining `*` character after the fix — zero stray asterisks corpus-wide, versus multiple hits before the fix (found by the same script, which is what surfaced the bug in the first place — this was not caught by code review, only by checking real rendered output).

### Sanctioned jewels (the only three expressive elements, per Fable round-1)

1. **"Carry this forward" pull-quote** — the renderer detects a section whose heading equals "Carry this forward" (case-insensitive) and adds a `.pw-pullquote` class to its `<blockquote>` element after rendering (no new parser state). **Shipped a CSS specificity bug and fixed it in the same pass:** `.pw-pullquote` alone (specificity 0-1-0) was losing to the generic `.pw-section blockquote` rule (0-1-1, class + element beats class alone) — the pull-quote silently rendered with the plain blockquote's 2px/dim/italic styling instead of its own 3px/full-paper/non-italic treatment. Caught by checking `getComputedStyle` against the intended values, not by visual inspection. Fixed by qualifying the selector to `.pw-section blockquote.pw-pullquote` (and the matching desktop media-query override), which out-specifies the generic rule.
2. **Play Set checklists as real, read-only checkboxes** — Phase 1's inline unicode glyphs (`☑`/`☐`) replaced with actual `<input type="checkbox" disabled>` elements, CSS-drawn check mark (rotated border, no unicode glyph, ASCII-safe source).
3. **Bold stays plain bold** — `<strong>`, no badge/chip wrapping. No change needed; the existing renderer already did this.

### Routing + templates

Hash-based, single page, no new HTML files, no build step: `#/fc/<id>` and `#/case/<id>`; default route renders a plain text-link index grouped Cases / Field Clerks (no cards, no grid, no imagery — an index, not browse chrome, per pre-decision 1). One shared template function (`renderDocument`) handles both kinds; a kind-label ("FIELD CLERK" / "CASE SYNTHESIS") under the docket line is the only visual differentiator, plus an optional court/decision_date byline that only cases populate (field-clerk frontmatter doesn't carry those fields — expected, per D-036).

**file:// fallback preserved and extended:** Phase 1's `.js`-sibling pattern (`window.SOD_MANIFEST_FIELD_CLERKS`) now also covers `cases.json` -> `data/cases.js` / `window.SOD_MANIFEST_CASES`, following the identical mechanism. This session's browser-preview tool could not navigate a `file://` URL directly (sandboxed environment limitation), so the fallback was verified by (a) confirming both `data/*.js` script tags load and populate their globals correctly on the shipped page, and (b) simulating the exact fetch-rejection code path against those live globals — both succeeded. JR's own double-click of `index.html` remains the final proof, same as the Phase-1 hotfix.

**Trade-off accepted:** the document-list index has no "kind of doc" visual grouping beyond its two `<h2>` sections (Cases / Field Clerks) — deliberately plain per pre-decision 1 and Mr.C's note that Phase 4's browse chrome replaces this route entirely; over-designing it now would give Phase 3's "token-only diff" self-test something extra to account for.

**Files touched:**
- `pipeline/legal/export_manifests.py` — preamble-capture fix in `_split_sections`; no schema change
- `quick-front-end/shade-of-design-landing/sr-playspace/index.html` — title/description updated for the reading room; added `data/cases.js` fallback script tag
- `quick-front-end/shade-of-design-landing/sr-playspace/playspace.js` — hash router, both templates, cross-ref resolution, nested-emphasis fixes, checkbox/pull-quote jewels
- `quick-front-end/shade-of-design-landing/sr-playspace/playspace.css` — kind-label, byline, pull-quote (+ specificity fix), checkbox, back-link, index-list styles
- `quick-front-end/shade-of-design-landing/sr-playspace/data/{cases,field-clerks}.json` + `.js` siblings — regenerated, not hand-edited
- No corpus files touched — `visibility:` marking was JR's hand, done before this session started
