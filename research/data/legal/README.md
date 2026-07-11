# Legal Research Archive — Format & Layout

This directory is the Central Hub-side landing zone for JR's legal research corpus. PDFs originate at vault root (`ResearchForced/LegalOpinions/PDFS/`), curated by hand from CourtListener. Per-case synthesis and structured extraction live here.

Origin DD: [[../../../../../References/Designs/DD-025 Legal Research Archive manual PDF pipeline]] (supersedes parked DD-021's live-API approach per the "real content ship bar" calibration on 2026-06-21).

## Directory layout

```
Terminal/Central Hub/research/data/legal/
  cases/<docket>.md          # TA — per-case full synthesis + structured frontmatter
  index.csv                  # TA master tabular index (pipe-delimited)
  relations/                 # TB per-case citation listings (placeholder — Phase 2)
  relations.csv              # TB master citation graph (pipe-delimited)
  authorities/               # TC per-case table-of-authorities (placeholder — Phase 2)
  authorities.csv            # TC master authority graph (pipe-delimited)
  field-clerk-drafts/        # DD-022 staging — Field Clerk Session drafts pending SR cross-vault move
  cache/, normalized/        # legacy from parked DD-021 live-API approach; preserved but unused
```

Source PDFs stay at vault root (`ResearchForced/LegalOpinions/PDFS/`) — JR's manual curation area. CH processes references the source path via the `pdf_path` frontmatter field in each `cases/<docket>.md`.

## TA — per-case file structure (`cases/<docket>.md`)

YAML frontmatter (locked field set per DD-025 Phase 1):

| Field | Source | Notes |
|---|---|---|
| `docket_number` | PDF caption | Federal Circuit format `YY-NNNN`. |
| `document_id` | PDF header | Sequence number from "Document: NN" line. |
| `filing_date` | PDF header | YYYY/MM/DD per JR convention. |
| `decision_date` | PDF body | YYYY/MM/DD. For OPINIONs, "Decided: <date>". For ORDERs, the order date. |
| `scope` | inferred | "Federal" / state. |
| `court` | PDF caption | Full court name. |
| `plaintiff` / `defendant` | PDF caption | Use appeal-level styling (Appellant / Appellee). For procedural orders, Petitioner / Respondent. |
| `intervenor` | optional | If applicable (e.g., USPTO Director). |
| `case_header` | PDF body | Quoted "Appeal from..." block. |
| `judge_main` / `judge_concurring` / `judge_dissenting` | PDF body | Judge surnames only. `null` if absent. |
| `panel` | PDF body | Full panel listing (judges deciding). |
| `non_participating` | optional | Judges who did not participate (e.g., Newman). |
| `disposition` | PDF body | "AFFIRMED" / "REVERSED" / etc. block at end. |
| `area_of_law` | inferred | List, multi-tag allowed. Examples: `[Patent, IPR Estoppel]`, `[Administrative Law, Standing]`. |
| `grouping` | `null` | Placeholder per JR — emerges from corpus over time. |
| `source_url` | CourtListener | Canonical CourtListener opinion URL. |
| `authorities_url` | CourtListener | Authorities-tab URL (used for Phase 2 enrichment). |
| `pdf_path` | local | Relative path to source PDF from vault root. |
| `document_type` | inferred | `OPINION` / `ORDER` / `PER CURIAM`. |

Body sections (Field Clerk template alignment from JR_DD003 / DD-022):

1. **The Issue** — specific legal tension(s); for procedural orders, the procedural question.
2. **Rule Mapping** — controlling law / doctrine / statute; for orders, the relevant procedural rule.
3. **Synthesis: The "Why" and "So What"** — court's rationale + broader implication.
4. **Logical Flaws & Observations** — Mr.C's read on doctrinal tensions, unspoken work, hindsight risks.
5. **Follow-ups for Mr. C** — bridge to SR/LSAT training + watch threads + cross-stitch with other cases in the corpus.

Then per-opinion summaries:
- **Main Opinion Summary** — substantive recap of holding + reasoning.
- **Concurring Opinion Summary** — if applicable.
- **Dissenting Opinion Summary** — if applicable.

Closing:
- **Statutes and Case Law Referenced** — narrative list with pin-citations.
- **Authorities (Table of Authorities)** — link to per-case TC file (Phase 2) and master `authorities.csv`.

### Document-type adaptability (calibration finding from Phase 1)

The 5-section Field Clerk template maps cleanly to substantive OPINIONs but **does not** extract meaningful content from procedural ORDERs (see `cases/26-1575.md` for the exemplar). For ORDERs, sections 3-5 should honestly note "Not extractable from this document type" or be re-templated. Phase 2 candidate: a separate `_order-template.md` for procedural dispositions.

## TA — `index.csv` (master tabular index)

**Delimiter:** `|` (pipe). Field values containing literal `|` are not currently quoted — flag if this becomes an issue. UTF-8 encoded.

**Header row** matches the frontmatter field set above, plus a `case_md_path` column pointing at the per-case `cases/<docket>.md` for synthesis access.

**One row per case.** Multi-value fields (`area_of_law`, `panel`) are semicolon-separated within their pipe-delimited cell.

For tabular querying (Excel, pandas, dataview), import with `sep='|'`. For Obsidian dataview queries, prefer the per-case frontmatter (more reliable than CSV parsing).

## TB — `relations.csv` (citation graph)

**Schema:** `docket_number | citation | citation_type | pin_cite | context`

`citation_type` values: `Case decision` | `US Code` | `CFR` | `Constitution` | `Federal Rule` | `Treatise` | `Internal Board decision` | `Foreign patent` | `Patent application`.

`pin_cite` and `context` are optional Phase 1 enrichments — not always filled. The `context` field is a brief note on what the cited reference was used FOR in the opinion (e.g., "burden of proof foundation"; "distinguished").

Phase 2 candidate: link `citation` values to canonical references where available; produce a back-link graph (cases citing this case).

## TC — `authorities.csv` (table of authorities — partial)

**Schema:** `authority | docket_number | link_to_authority | times_cited | authority_filing_date | authority_court | authority_citation`

**Phase 1 limitation:** `times_cited`, `authority_filing_date`, and `authority_court` come from CourtListener's authorities page (per `authorities_url` frontmatter), not extractable from the PDF alone. These fields are `null` in Phase 1 entries and will be populated in Phase 2 if/when an authorities-URL fetch routine is built (likely as a small enrichment script in `pipeline/legal/`).

In Phase 1, this CSV captures only the authorities visible IN the opinion text itself (cited cases, statutes), with limited metadata.

## Intake workflow (manual, Phase 1)

1. **JR pulls PDFs from CourtListener** using search URL pattern (or browsing). Example query for Federal Circuit (CAFC) recent opinions: `https://www.courtlistener.com/?type=o&q=&type=o&order_by=dateFiled%20desc&stat_Published=on&filed_after=06%2F01%2F2026&court=cafc`. Downloads land at `ResearchForced/LegalOpinions/PDFS/`.
2. **Mr.C synthesis pass:** read PDF; produce `cases/<docket>.md` with full Field Clerk-aligned synthesis; append rows to `index.csv` / `relations.csv` / `authorities.csv`.
3. **Optional: DD-022 Field Clerk Session draft** for selected cases — staged at `field-clerk-drafts/<docket>-field-clerk-session.md`, moved to SR vault (`Sharpen Reason/Legal/`) by JR after review.
4. **JR review:** synthesis tone, inference accuracy, follow-up relevance. Calibration feedback shapes future passes.

## JR Digests — learning loop (DD-027)

The `JR Digests/` subfolder holds **digest files** that thread multiple case .md files into a themed learning unit with paired audio (NotebookLM-generated) + image (Ms.G-generated) + JR's post-consumption notes + Mr.C's SR-review feedback + Ms.G's next-direction signal. This is the forcing function that makes the DD-025 + DD-026 + DD-022 + DD-027 quadrant cohere into a closed learning loop.

### Storage layout

```
Terminal/Central Hub/research/data/legal/JR Digests/
  _template-jr-digest.md                                # template (copy to instantiate)
  LRD-NNN.md                                            # one per digest
  Content refs/
    <theme-name>-LRD-NNN-audio.mp3                      # NotebookLM podcast
    <theme-name>-LRD-NNN-image.png                      # Ms.G paired image
```

### Filename convention (audio/image)

Frontload the human-readable theme name; suffix with `LRD-NNN-audio` / `LRD-NNN-image`. Example: `Stoic Logic in Federal Circuit Litigation-LRD-001-audio.mp3`. Theme-name segment can include spaces; avoid filesystem-reserved characters (`/ \ : * ? " < > |`).

Rationale: theme-name first surfaces the digest in alphabetical file listings (human handle); `LRD-NNN` suffix is the index-stable primary key.

### Frontmatter shape

| Key | Value | Notes |
|---|---|---|
| `id` | `JR_DigestNN` | Sequential per JR convention |
| `group_id` | `LRD-NNN` | Primary key + filename suffix |
| `theme` | string | JR-naming theme, human-readable |
| `podcast_name` | string | NotebookLM-generated podcast title |
| `docket_numbers` | list | Cases included in this digest |
| `linked_cases` | list | Obsidian wikilinks to case files (navigation-friendly mirror of `docket_numbers`) |
| `image_path` | string | Relative path under `Content refs/` |
| `audio_path` | string | Relative path under `Content refs/` |
| `date_created` | YYYY-MM-DD | |
| `status` | enum | `drafted` / `in-loop` / `closed` |

**No denormalization into `index.csv`** — dataview/SQL joins handle "which digests is this case in?" on demand.

### Status enum

- `drafted` — frontmatter exists, body sections unpopulated
- `in-loop` — any body section has real content
- `closed` — loop complete, feeds the next digest

Granular state inferred from which sections are populated; the enum keeps high-level visibility cheap.

### The loop (workflow)

```
1. JR fetches PDFs (DD-026 auto-fetch when ready; manual until then)
2. Mr.C synthesizes case .md files (DD-025)
3. JR reads case synthesis, selects cases for a digest theme
4. JR copies _template-jr-digest.md → LRD-NNN.md; fills frontmatter
5. JR sends selected case .md files to Ms.G via NotebookLM
6. Ms.G generates podcast + image; JR saves to Content refs/ with locked filename convention
7. JR consumes audio, populates ## JR Section (Post podcast review)
8. SR session with Mr.C — Mr.C populates ## Mr. C Section based on dry-run feedback
9. JR populates ## JR Post Review Section reflecting on the session
10. Ms.G provides next-direction signal in ## Ms. G Section; JR uses to seed next fetch + next digest theme
11. Status flips to closed; LRD-(N+1) begins
```

Steps 5 and 10 are Ms.G touchpoints. Until JR_DD004 (Ms.G inverse-comms inbox/outbox) lifts, those run via JR-relay (the current manual flow). When JR_DD004 ships, Ms.G outputs route through `C Roles/Strategies/comms/ms-g/inbox/` first.

### Body section structure

Six sections + footnotes. Preserved from JR's source spec at `Shade of Design/JR Extension/LR_alt_pipeline_PostReview.md`:

1. `## JR Section (Post podcast review)` — four H3 subsections: Rough Notes, Points to Expand, Definitions/Direction Questions, Recommendation for How to Test
2. `## Mr. C Section (SR Review)` — dry-run feedback
3. `## JR Post Review Section` — post-SR reflection
4. `## Ms. G Section (Post SR Review)` — next-direction + related cases
5. `## Footnotes` — uses `=+=` separators (JR personal convention) for Further Research / Global / Views groups

## Phase 2+ enhancements (out of scope for Phase 1)

Tracked in DD-025 + DD-027 bodies:
- **`_LR-ARCHIVE` Obsidian dataviewjs view** — vault-native browseable surface with case-cards, court-grouping, area-of-law filtering, TA↔TB↔TC navigation, and digest cross-stitch. NOT Notion (JR phasing away from Notion).
- **Batch processing remaining 5 PDFs** in storage (24-1730, 24-1759, 24-1990, 24-2044, 24-2242).
- **DD-026 Auto-fetch routine** — three locked queries (CAFC + SCOTUS + CADC); reads `pipeline/legal/queries.toml`; dedupes against `_fetch_log.csv`.
- **Authorities-URL enrichment script** — populate TC metadata fields from CourtListener's authorities page.
- **Cross-court expansion** beyond Federal Circuit (driven by locked-queries set).
- **DD-028 `_order-template.md`** — parked. Designed for procedural ORDERs (per curiam, costs, en banc grants). Held until ORDER intakes become a real need.
- **JR_DD004 LIFT (Ms.G inverse-comms)** — soft prerequisite for clean Ms.G touchpoints in the JR Digest workflow.
- **Ms.G cross-stitch** — brand-aware presentation templates for the LR-ARCHIVE visual layer + digest image pairing.

## Format reference

- Origin DD: [[../../../../../References/Designs/DD-025 Legal Research Archive manual PDF pipeline]]
- Downstream consumer: [[../../../../../References/Designs/DD-022 SR legal research landing zone]]
- JR's high-level plan: `Shade of Design/JR Extension/LR_alt_pipeline_HighLevel.md`
- Parked DD (live-API approach): [[../../../../../References/Designs/DD-021 Legal data pipeline CourtListener]]
