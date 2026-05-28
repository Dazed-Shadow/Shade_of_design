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

### Bug 2 — KFF Health News body extractor returns wrong content

**Where:** `scripts/transit_fetch_feeds.py` generic BS4 body extractor
**Observed in:** Every `kff_health_news_*.jsonl` record produced so far. Bodies come back as `"Rx For Clarity: Calif. Considers Bilingual Drug Labels / By April Dembosky, KQED / July 30, 2014"` regardless of which 2026 article was requested. KFF's article pages use a wrapper template that the generic extractor latches onto for the wrong DOM element.
**Impact:** Any health-category article from KFF synthesizes from title only. Bundle 02 in the demo batch is the visible case.
**Workaround until fixed:** Either add a KFF-specific extractor (mirror of the Federal Register specific path Sonnet built for D-008), or swap KFF for STAT News (already in the fallback list in `feeds.toml`).
**Fix scope estimate:** ~30 LOC for a KFF-specific selector, OR a one-line feed swap to STAT News.

**Pairing rationale:** Both bugs surface during the same workflow (read the package → notice missing prompts → notice thin synthesis). Fixing them together gives the next `/synth-batch` demo a clean visible upgrade rather than two separate small wins.

**D-014.1 status:** RESOLVED (shipped in same session).
**D-014.2 status:** Open — explicitly deprioritized below SPOTTER Phase 2 narrative work (see D-015). KFF body extractor is a known issue; workaround is to swap the KFF feed for STAT News in `feeds.toml`.

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
| SAM.gov entity profile outbound link | Investigated 2026-05-28: SBA cert profile pages do not include an outbound link to sam.gov entity pages. `sam_profile_url` will always be null until SBA adds this link or a separate SAM.gov lookup is added (Phase 2). |
