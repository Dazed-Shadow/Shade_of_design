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
