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
