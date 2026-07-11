---
id: DD-025
title: Legal Research Archive — manual PDF pipeline (supersedes DD-021's live-API path)
status: shipped
surface: central-hub
project: CENTRAL_HUB
owner: Mr.C
effort: M
priority: H
proposed_date: 2026-06-21
proposed_by: JR
triaged_on: 2026-06-21
lead_opus: (Mr.C self-execution)
sonnet_count: 0
assigned_on: 2026-06-21
shipped_on: 2026-06-21
ship_verified_by: JR
depends_on: []
supersedes_data_path_of: DD-021
unblocks: [DD-022]
tags: [research, legal, archive, central-hub, pipeline, manual-intake, type/sdd, origin/JR_DD005]
---

**Origin:** Promoted from `JR_DD005` (Alternative Legal Research Database) in `Shade of Design/JR Extension/Off_COS_PLANNING.md` via the `LIFT JR_DD005` skill on 2026-06-21. High-level architecture lives in `Shade of Design/JR Extension/LR_alt_pipeline_HighLevel.md`.

**Direction shift context:** This DD is the response to a 4-week CH pattern of API-based ingestion paths shipping infrastructure that never landed real data. DD-021's live CourtListener API approach hit a 400 wall on every filter variant attempted; JR denied sign-off under the new "real content ship bar" (a.k.a. "doll without a soul") rule. This DD pivots to **manual PDF intake** as the durable data path — guaranteeing real content crosses the wire because JR finds the PDFs by hand. DD-021's infrastructure (schema lock, normalizer cascade, self-test, three pipeline docs) is preserved as parked-superseded artifacts that may pair with a future bulk-archive source if one materializes; they are not deleted.

## What

A manual-intake legal research archive in Central Hub. Three deliverable layers:

1. **PDF intake** — JR-curated PDFs from CourtListener web search land at `ResearchForced/LegalOpinions/PDFS/` (vault root, JR work area). Sample corpus: 10 Federal Circuit opinions from June 2026 already present.
2. **CH extraction + synthesis** — A pipeline component reads each PDF and produces three structured artifacts per case (TA index row, TB citation rows, TC authority rows) PLUS Mr.C-authored synthesis for the "Please provide" fields (opinion summaries, Issue/Rule/Reasoning shape that mirrors DD-022's Field Clerk template).
3. **Dual storage format in CH** — Per-case Markdown with frontmatter at `Terminal/Central Hub/research/data/legal/cases/<docket>.md` (Obsidian-browseable, mirrors DD-021's locked schema fields so DD-022's Field Clerk template ingests cleanly) **AND** a master `Terminal/Central Hub/research/data/legal/index.csv` aggregating TA fields for tabular queries (JR manual or Mr.C/Ms.G programmatic). TB + TC follow the same MD+CSV pair pattern.

## Why

JR's signal — captured 2026-06-21, after DD-021 sign-off was denied:

> "I have to say Chief, I Am going to deny forcing this shipment when there really is no content to sign off on. We have a script, and works in theory at the moment, I don't want to take in a 'doll without a soul' or a 'broken toy off the assembly line'."

Three structural reasons this approach is right:

1. **Real content guaranteed.** JR finds the PDFs manually → cases definitely exist. No API-flakiness intermediates.
2. **Synthesis pushed to the front.** The "Please provide" cells in JR's TA spec ARE Mr.C's value-add. The DD can't ship a "doll" because synthesis IS the deliverable.
3. **Resilient to CourtListener API changes.** PDFs are stable artifacts; whatever CourtListener does to their REST API, downloaded PDFs keep working.

Bonus: this single pivot **unblocks DD-022** (SR landing zone) without forcing it onto synthetic data. The Field Clerk template's `## 1. The Issue` / `## 2. Rule Mapping` / `## 3. Synthesis` sections map directly to the Issue/Rule/Reasoning synthesis fields here. Same shape, two surfaces.

## How (sketch — Phase 1)

**Storage layout (proposed, JR confirms on first ship):**

```
Vault root/
  ResearchForced/LegalOpinions/PDFS/        # JR's manual download area (already populated, 10 sample PDFs)
  
Terminal/Central Hub/research/data/legal/
  cases/<docket>.md                          # TA per-case Markdown with frontmatter
  index.csv                                  # TA master tabular index
  relations/<docket>.md                      # TB per-case citation listing
  relations.csv                              # TB master citation graph
  authorities/<docket>.md                    # TC per-case table-of-authorities
  authorities.csv                            # TC master authority graph
```

**TA per-case Markdown frontmatter (locked schema, mirrors DD-021's lock + extends with JR's TA fields):**

```yaml
docket_number: 24-2088
document_id: 53
filing_date: 2026/05/16             # YYYY/MM/DD per JR convention
decision_date: 2026/05/16
scope: Federal
court: United States Court of Appeals for the Federal Circuit
plaintiff: IRONBURG INVENTIONS LTD.
defendant: VALVE CORPORATION
case_header: "Appeal from the United States District Court for the Western District of Washington in No. 2:17-cv-01182-TSZ, Senior Judge Thomas S. Zilly."
judge_main: Judge Hughes
judge_concurring: Judge Stark
judge_dissenting: null
area_of_law: [Patent, Torts]        # multi-tag allowed
grouping: null                       # placeholder per JR — emerges from corpus over time
source_url: https://www.courtlistener.com/opinion/10877005/ironburg-inventions-ltd-v-valve-corporation/
authorities_url: https://www.courtlistener.com/opinion/10877005/ironburg-inventions-ltd-v-valve-corporation/authorities/
pdf_path: ResearchForced/LegalOpinions/PDFS/24-2088.OPINION.6-18-2026_2711717.pdf
```

**TA per-case Markdown body — Mr.C synthesis (mirrors Field Clerk template):**

```markdown
# <case_name>, <citation>

## 1. The Issue
<one-paragraph specific legal tension>

## 2. Rule Mapping
<controlling law / doctrine / statute>

## 3. Synthesis: The "Why" and "So What"
**The Why:** <court's rationale>
**The So What:** <broader implication>

## Main Opinion Summary
<Mr.C-authored summary, Issue/Holding/Reasoning shape>

## Concurring Opinion Summary
<if applicable, else "Not applicable for this case.">

## Dissenting Opinion Summary
<if applicable, else "Not applicable for this case.">

## Statutes and Case Law Referenced
<linked to TB rows for navigability>
```

**TB / TC tables — minimal markdown + CSV mirror.** Each `relations/<docket>.md` is a small markdown table of "citation | citation_type" rows. Authorities follow the same pattern with the seven-field TC shape. CSV mirrors at the root for tabular use.

**Phase 1 ship target — FIVE real cases end-to-end.** JR's calibration intent (2026-06-21): a single showcase risks cherry-picking; five cases stress-test tone consistency, synthesis accuracy, and inference fidelity across genuinely different opinions. Each gets the full treatment: TA row + TB rows + TC rows + Mr.C synthesis for all "Please provide" fields. Proves the format, validates the schema across variety, and gives JR a real calibration surface — does Mr.C's tone drift between cases? Do inferences miss their mark on the harder ones? Five is the sample size for that read.

## When done (Phase 1)

- `Terminal/Central Hub/research/data/legal/` directory tree exists with cases/ + relations/ + authorities/ subfolders and three CSV index files (each with five rows after Phase 1)
- **Five cases** fully landed (selection in `## Phase 1 case picks` below):
  - `cases/<docket>.md` per case with full frontmatter + Mr.C synthesis filling every "Please provide" field
  - `relations/<docket>.md` per case with all citations extracted from the opinion's reasoning
  - `authorities/<docket>.md` per case with the table-of-authorities extracted from the docket header
  - Corresponding row in each of the three CSV index files
- A short `Terminal/Central Hub/research/data/legal/README.md` documents the format, storage layout, and intake workflow (JR's manual PDF curation + Mr.C synthesis pass)
- `OBSIDIAN_SETUP.md` (vault root) gets a brief "Legal Research Archive" section pointing at the storage layout and intake workflow (sister to the existing "Legal data" section from DD-021's parked work)
- DD-022's Field Clerk Session template lands at `Sharpen Reason/Legal/_field-clerk-template.md` (or wherever DD-022 lands it) with at least one case's TA synthesis populated as the first Field Clerk Session draft — proves the cross-vault feed end-to-end
- **Calibration note in the ship block** — Mr.C's read on synthesis-tone consistency across the 5 cases, plus JR's own calibration feedback after reading. This becomes the durable signal for whether the synthesis bar is set right or needs adjustment in Phase 2

## Phase 1 case picks (proposed, JR confirms or substitutes)

Storage has 10 PDFs (all Federal Circuit, June 2026 filings). Proposed 5 chosen for diversity:

| Docket | Type | Filing date | Why this one |
|---|---|---|---|
| **24-2088** | OPINION | 2026-06-18 | JR's named baseline (Ironburg v. Valve) — anchors the calibration with a known reference |
| **24-1600** | OPINION | 2026-06-05 | Earliest of the 24-xxxx dockets — date diversity |
| **24-2316** | OPINION | 2026-06-05 | Same filing day as 24-1600 — tests within-day tone consistency |
| **25-1045** | OPINION | 2026-06-04 | Different docket year (2025) — tests across-year format consistency |
| **26-1575** | **ORDER** | 2026-06-17 | The single ORDER (not OPINION) in storage — measures format-adaptability (a different document type with different sections) |

This spread isolates four calibration variables: baseline tone (24-2088), date variety (24-1600 / 25-1045), within-day consistency (24-1600 + 24-2316), and document-type adaptability (26-1575 ORDER vs the OPINION default). JR can swap any pick before synthesis runs — these are proposals, not locks.

## JR rough notes (verbatim, from JR_DD005 + LR_alt_pipeline_HighLevel)

JR's CourtListener search URL pattern (manual workflow, future fetch-routine input):

```
https://www.courtlistener.com/?type=o&q=&type=o&order_by=dateFiled%20desc&stat_Published=on&filed_after=06%2F01%2F2026&court=cafc
```

Decoded: type=opinions, sorted by filing date desc, published only, filed after 2026/06/01, court = Federal Circuit (cafc). 10 sample PDFs already pulled with this pattern.

JR's TA / TB / TC table definitions are preserved in `LR_alt_pipeline_HighLevel.md` and translated into this DD's storage schema above.

## Triage (Mr.C, after-the-fact) — 2026-06-21

- Recommend ACCEPT — clean scope (manual intake + Phase 1 single-case soul demo), durable downstream value (DD-022 consumes directly), no external API dependency, the new ship bar is met by design (synthesis IS the deliverable)
- **Cycle slot:** cycle 5 mid-cycle insertion. Replaces DD-021's data-path role; DD-022's effective dependency shifts to this DD's normalized output
- **Owner = Mr.C** because Phase 1 is heavily synthesis-shaped (the soul demo). Future phases (batch processing across all 10 PDFs, auto-fetch routine, Notion view) earn their own scope and may shift owner to Sonnet
- **Boundary discipline carries forward:** writes within CH for processed artifacts; reads from vault-root `ResearchForced/` for source PDFs; future write into SR vault (`Sharpen Reason/Legal/`) via DD-022's surface

## Phase 2+ (future DDs, NOT this ship)

These are explicitly out of scope for Phase 1. Each earns its own scope when JR is ready. **Re-prioritized 2026-06-21 post-JR-sign-off** to incorporate the three forward asks.

### Near-term (cycle 5 close or cycle 6 candidates)

1. **Lock three CourtListener search queries** + propose the registry format (TOML, modeled on existing `pipeline/research/feeds.toml`). The existing CAFC query is locked-in #1; #2 and #3 to be proposed by Mr.C (SCOTUS recent + D.C. Circuit admin-law are the lean) and JR-confirmed.
2. **Auto-fetch routine** (likely DD-026 candidate). Reads the locked-queries registry, runs each query against CourtListener's web search, parses returned opinion links, downloads PDFs to `ResearchForced/LegalOpinions/PDFS/`. Dedupes against `_fetch_log.csv` (docket_number + document_id keyed) to prevent re-downloads of already-reviewed cases. Cadence: 48-72 hr scheduled run, or skill-triggered on demand (e.g., "FETCH LEGAL" trigger).
3. **JR Digest learning-loop template** — **PROMOTED to DD-027** on 2026-06-21 from JR's source spec at `Shade of Design/JR Extension/LR_alt_pipeline_PostReview.md`. Closes the loop on the LR cycle: DD-025 ships case synthesis substrate, DD-026 keeps fresh content flowing, DD-027 gives JR a structure to make sense of what he's consuming + drive SR sessions + route Ms.G's next-direction back into the next fetch. Paradigm-shift artifact for the cycle. See [[DD-027 JR Digest learning-loop template|DD-027]].
4. **`_order-template.md` design** — **DEFERRED to DD-028 (parked)** as of 2026-06-21. Distinct field set: parties, panel composition, procedural posture, schedule, amicus roster, document type (per curiam, costs order, en banc grant, etc.). No Issue/Rule/Synthesis sections — orders typically lack rationale. **Until this template lands, the intake pipeline skips ORDER-type documents.** The 26-1575 case .md ships as a one-off transition artifact (with calibration notes); future ORDER intakes hold pending the template. DD-028 is parked until ORDER-intake demand justifies it.

### Mid-term (post-template-lock)

4. **Batch processing remaining PDFs** — apply Phase 1 format to the other 5 PDFs already in storage (24-1730, 24-1759, 24-1990, 24-2044, 24-2242), all CAFC OPINIONs. Validates pattern at next scale.
5. **`_LR-ARCHIVE` Obsidian view** — Vault-native browsing surface. **Obsidian-resident, NOT Notion** (JR phasing away from Notion entirely). Modeled on `_Dashboard.md`'s dataviewjs pattern with visuals tuned to legal-document content: case cards, court-level grouping, area-of-law filtering, citation-graph navigability between TA → TB → TC. JR's signal: "expect much better visuals matching the source data and easy accessibility of archive data — likely a whole design session to get this up, okay with minimum functionality once ready to ground this idea." Pairs naturally with Ms.G design-session pass for the visual layer.

### Long-term

6. **Cross-court expansion** — extend beyond Federal Circuit to SCOTUS, D.C. Circuit, etc., driven by the locked-queries set (point 1).
7. **Authorities-URL enrichment script** — populate TC `times_cited`, `authority_filing_date`, `authority_court` fields by fetching `authorities_url` pages from CourtListener. Small script in `pipeline/legal/`.
8. **Synthesis versioning** — per JR-validated strategic read (NotebookLM-confirmed), the structured corpus + synthesis hybrid is durably valuable; synthesis is iterable interpretation, not ground truth. Introduce `synthesis_version` frontmatter field or filename suffix (`<docket>-v2.md`) when synthesis is re-generated to capture corpus drift / Mr.C calibration evolution.
9. **Ms.G cross-stitch** — brand-aware presentation templates for legal-research surfaces (DD-022's mentor-session experience, the `_LR-ARCHIVE` visual layer). Surfaces through Mr.C bridge per the Ms.G-comms convention (bidirectional per JR_DD004's pending lift).
10. **NotebookLM downstream pattern** — formalize the case-md → NBLM workflow as a recurring use case. JR's 47-min audio with SR-principles cross-stitch is the proof-of-concept; future SR mentor-session prep could routinely include an NBLM-generated audio companion.

## Status of DD-021 (the superseded sibling)

DD-021's status moves to **parked-superseded**. The infrastructure (schema lock, normalizer cascade, self-test, three pipeline docs at AGENTS.md / DECISIONS.md / OBSIDIAN_SETUP.md) is preserved and remains useful artifacts. If CourtListener's API filter issue is later resolved (or a bulk-archive download path emerges), the existing normalizer can be retargeted at minimal cost. The DD card body documents this superseding relationship; no rework or deletion.

---

## Scope decision (Mr.C self-execution) — 2026-06-21

- Sonnet count: 0
- Reason: Phase 1 is heavily synthesis-shaped — the core deliverable IS Mr.C's authored synthesis (the "Please provide" cells in JR's TA spec). No external implementer can produce that surface. Mr.C self-execution variant applies (5 prior datapoints: DD-016, DD-017, DD-019, DD-024-capture, DD-021 review/closeout).
- Decided: 2026-06-21

## Ship (Mr.C self-execution — Phase 1) — 2026-06-21

**What landed:** Five Federal Circuit cases fully synthesized end-to-end across calibration-diversity dimensions, with full structured extraction into TA/TB/TC artifacts and a DD-022 Field Clerk Session draft staged for cross-vault move. Phase 1 ships consumable content (real cases, real synthesis), satisfying the "real content ship bar" per [[../../.claude/projects/C--Users-theri/memory/feedback_real_content_ship_bar|memory rule landed 2026-06-21]].

### When done (Phase 1) — checklist

- [x] `Terminal/Central Hub/research/data/legal/` directory tree exists with cases/ + relations/ + authorities/ + field-clerk-drafts/ subfolders
- [x] Five cases fully landed: 24-2088 (Ironburg v. Valve), 24-1600 (Hafeman v. Google), 24-2316 (IRAdvocates v. Mullin), 25-1045 (Ollnova v. ecobee), 26-1575 (Jackler v. DOJ ORDER)
  - Each `cases/<docket>.md` has full frontmatter (TA field set), Field Clerk-aligned synthesis sections, and per-opinion summaries
- [x] `index.csv` (TA), `relations.csv` (TB), `authorities.csv` (TC) — all five rows in TA; full citation graph in TB; authorities listing with Phase 1 metadata in TC
- [x] `README.md` documents the format, schema, intake workflow, document-type adaptability finding, and Phase 2+ enhancements
- [x] vault-root `OBSIDIAN_SETUP.md` carries a new "Legal Research Archive (DD-025 — current active path)" section after the parked "Legal data" section from DD-021
- [x] DD-022 Field Clerk Session draft for Ironburg case landed at `field-clerk-drafts/24-2088-field-clerk-session.md` — staged for SR cross-vault move pending JR review

### Files created or modified

```
Terminal/Central Hub/research/data/legal/
  README.md                                                 (new)
  index.csv                                                  (new — 5 rows)
  relations.csv                                              (new — full citation graph)
  authorities.csv                                            (new — Phase 1 metadata)
  cases/24-2088.md                                           (new — Ironburg synthesis)
  cases/24-1600.md                                           (new — Hafeman synthesis)
  cases/24-2316.md                                           (new — IRAdvocates synthesis)
  cases/25-1045.md                                           (new — Ollnova synthesis)
  cases/26-1575.md                                           (new — Jackler ORDER synthesis)
  field-clerk-drafts/24-2088-field-clerk-session.md          (new — DD-022 staging)
  cases/, relations/, authorities/, field-clerk-drafts/      (directories created)

C:\Users\theri\Chief of Staff Diary\
  OBSIDIAN_SETUP.md                                          (modified — new "Legal Research Archive" section)
```

### Calibration findings (the JR-requested calibration read)

**On synthesis-tone consistency across the 5 cases:**
- Tone held stable across all 4 substantive OPINIONs (24-2088, 24-1600, 24-2316, 25-1045). Each Issue/Rule/Synthesis/Flaws/Follow-ups block uses the same register: academic-but-personable, pin-cited where useful, willing to identify doctrinal tensions the court avoided. Length scales naturally with case complexity (Ironburg longest — most-substantive 23-page opinion with concurrence; IRAdvocates shortest — single dispositive standing issue).
- LSAT-angle framing in Follow-ups consistently lands but with case-shape variation: analytical reasoning (Ironburg), conditional/statutory-bar analysis (Hafeman), three-element standing logic (IRAdvocates), multi-issue dispositional structure (Ollnova). For 26-1575 ORDER, honestly noted that "procedural orders are less rich for LSAT reasoning practice than substantive opinions" — refused to manufacture LSAT content where the document doesn't naturally support it.

**On inference accuracy and "missing the mark" risk:**
- Each Logical Flaws section reaches for secondary observations beyond the holding (Stark concurrence's findability/discoverability framework in Ironburg; USPTO Director intervention pattern in Hafeman; the *Havens* vs *Hippocratic Medicine* doctrinal arc in IRAdvocates; Chen's footnote 7 procedural-warning in Ollnova). These are interpretive — JR's judgment should drive whether they land or feel forced.
- Potential miss: the "borderline frivolous" characterization in Hafeman (and the court's three-step Thryv → Federal Express → Ethanol Boosting progression) was flagged. Worth JR checking whether the doctrinal narrative I built matches his read.

**On document-type adaptability (the format-finding from the 26-1575 ORDER):**
- The 5-section Field Clerk template **does not** cleanly fit procedural ORDERs. For 26-1575 I added a calibration note at the top of the file and used "Not extractable from this document type" honestly in sections 3-5 where no rationale was given. This is the right move — forcing synthesis on a doc without rationale would violate the real-content ship bar by producing hallucinated content.
- **Phase 2 candidate:** Introduce a separate `_order-template.md` for procedural dispositions (per curiam orders, costs orders, en banc grants without rationale, etc.). Different field set: parties, panel composition, procedural posture, schedule, amicus roster. No synthesis sections.

**On the pointable-corpus vs pre-inscribed-synthesis question (your stated strategic read):**
- **My observation after running the pass:** Hybrid is probably right. The structured layers — frontmatter fields (court, judges, dates, disposition, area_of_law), the TA/TB/TC tables, the statutes-and-case-law reference graph — are durably valuable as a pointable corpus regardless of who consumes them. A chat model can query them deterministically. The synthesis layer (Issue/Rule/Synthesis/Flaws/Follow-ups) is interpretive and stales differently: useful for breakfast-table reading and as a "what did Mr.C see in this case" snapshot, but a chat model could re-derive it on demand from the PDF. The LSAT Follow-ups are uniquely synthesis-shaped — they require knowing JR's learning goals and existing SR session context — so those are the part of the corpus that genuinely *only* Mr.C (or someone with JR's context) can produce.
- **Recommendation for evolution:** Keep the structured data + reference graphs as the pointable layer (these are pure value). Allow the synthesis layer to be regenerated/updated as JR's needs evolve — versioning per case via filename suffix (`24-2088-v2.md`) or a frontmatter `synthesis_version` field. Treat synthesis as iterable interpretation rather than ground truth.

**On the TC partial-metadata gap:**
- `times_cited`, `authority_filing_date`, `authority_court` fields in `authorities.csv` are null in Phase 1 because they come from CourtListener's authorities-tab page, not extractable from the opinion PDF alone. This is honest data-state, not a bug. Phase 2 candidate: small enrichment script in `pipeline/legal/` that fetches and parses `authorities_url` pages to populate.

**Cross-cycle calibration:**
- This is the **first ship to satisfy the "real content ship bar" memory rule** that landed this same day (2026-06-21). The synthesis content IS the consumable — there's no doll-without-soul risk because there's nothing here except soul (real cases, real interpretation, real follow-ups). Validates that the rule works as a forcing function on DD shape.
- **Mr.C self-execution variant** reaches 5 datapoints (DD-016, DD-017, DD-019, DD-024-capture, DD-025). Stable enough for cycle-5 close to formalize in `Routines.md`.

### JR sign-off path

1. Read at least 2 of the 5 case files at the breakfast table (recommend starting with 24-2088 Ironburg — your named baseline — then 26-1575 to see the format-adaptability honesty)
2. Spot-check `index.csv` opens cleanly in your tool of choice (Excel: Data → From Text → delimiter = pipe; pandas: `pd.read_csv(..., sep='|')`)
3. Verify the Field Clerk draft at `field-clerk-drafts/24-2088-field-clerk-session.md` reads correctly; confirm SR vault target path
4. Calibrate: does tone drift between cases? do inferences land or miss the mark? does the strategic read (pointable-corpus vs pre-inscribed-synthesis) match your sense?

On sign-off: stamp `shipped_on: 2026-06-21`, `ship_verified_by: JR`, flip `status: shipped` on frontmatter. Optionally add a brief calibration-feedback note appended below this ship block.

**JR sign-off confirmed — 2026-06-21.** `shipped_on: 2026-06-21` and `ship_verified_by: JR` stamped.

### JR calibration feedback (post-consumption — 2026-06-21)

JR consumed 4 of 5 case .md files and validated the synthesis layer in two ways:

1. **Direct read confirmation:** Tone and depth held; the format worked at the breakfast-table reading level.
2. **NotebookLM cross-validation:** JR brought the 5 case .md files into NotebookLM, which generated a **47-minute audio version** breaking down the cases with explicit cross-reference to SR principles being taught. This is a significant signal — the synthesis layer (Issue/Rule/Synthesis/Flaws/Follow-ups structure) is portable, durable, and consumable by downstream AI tooling beyond Mr.C-curated reading. The structured-corpus + pre-inscribed-synthesis hybrid is validated; the synthesis is not redundant overhead, it's the substrate that downstream tools (NotebookLM, Gemini, future SR-session chat) can build richer experiences on top of.

### Three forward asks captured from JR sign-off

These shape Phase 2 priorities (see updated Phase 2+ section above):

1. **Lock three CourtListener search queries** for routine use. The existing CAFC query is one; suggest the format and propose the other two.
2. **Build the auto-fetch routine** (script/skill) that runs all three locked queries, downloads PDFs to `ResearchForced/LegalOpinions/PDFS/`, and dedupes against a docket+document log to prevent re-downloads of already-reviewed cases.
3. **Order template design** — Mr.C confirmed: orders are taken OUT of the case-md framework. A separate `_order-template.md` will be designed before any future orders are processed. Until that template lands, the intake pipeline skips ORDER-type documents.

These three asks become candidate DDs (see Phase 2+ section).
