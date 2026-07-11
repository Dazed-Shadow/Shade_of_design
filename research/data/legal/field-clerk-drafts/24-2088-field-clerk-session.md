---
case_id: 24-2088
session_date: 2026-06-21
focus_area: Patent Law — IPR Estoppel
case_reference: Ironburg Inventions Ltd. v. Valve Corporation, No. 24-2088 (Fed. Cir. June 18, 2026)
case_citation_pending: TBD (slip opinion at time of session)
source_url: https://www.courtlistener.com/opinion/10877005/ironburg-inventions-ltd-v-valve-corporation/
ch_case_md: ../cases/24-2088.md
status: draft (Mr.C-populated from DD-025 synthesis; awaiting JR mentor-session completion)
sr_target_path: Sharpen Reason/Legal/2026-06-21-Ironburg-v-Valve.md
sr_status: pending-cross-vault-move
---

# Field Clerk Session: 2026-06-21

- **Focus Area:** Patent Law — IPR Estoppel / "Skilled Searcher" doctrine
- **Case Reference:** Ironburg Inventions Ltd. v. Valve Corporation, No. 24-2088 (Fed. Cir. June 18, 2026) — [CourtListener](https://www.courtlistener.com/opinion/10877005/ironburg-inventions-ltd-v-valve-corporation/)

## 1. The Issue

Whether the district court correctly applied the "skilled searcher" standard of 35 U.S.C. § 315(e)(2) when it estopped Valve from raising two invalidity grounds at trial — specifically, (a) whether mere accessibility of prior art through a classification search returning thousands of references constitutes "discovery" by a skilled searcher, and (b) whether post-IPR-petition searches that used forward-and-backward citation queries (capturing later-arising references) can constitute probative evidence of pre-petition discoverability.

## 2. Rule Mapping

**Controlling statute:** 35 U.S.C. § 315(e)(2) estops an IPR petitioner that received a final written decision from later asserting in civil litigation "any ground that the petitioner raised or reasonably could have raised during . . . inter partes review."

**Governing test (Ironburg I, 64 F.4th 1274):** The patent owner bears the burden of proving that the asserted invalidity grounds were ones a "skilled searcher conducting a diligent search reasonably could have been expected to discover" at the time of the IPR petition.

**Refinements adopted in this opinion:**
- Evidence shedding light on what a skilled searcher would have discovered only *after* the IPR petition is likely irrelevant.
- A classification search returning an unreviewably large set of references (26,333 here) does NOT, standing alone, establish discovery; "something more" — keyword narrowing, manual review, citation-based filtering — is required.
- A § 315(e)(2) "ground" is not the prior art reference itself; the patentee must prove discoverability of the *ground*, not just the references (Ingenico, 136 F.4th 1354 (Fed. Cir. 2025)).

## 3. Synthesis: The "Why" and "So What"

- **The Why:** Classification-search inclusion alone is insufficient evidence of discovery when the search returns 26,333 references; the district court treated that as the endpoint of analysis, which is error. Cardinal IP's 2023 forensic searches were tainted by hindsight bias from an early citation-based search (string #3) that captured later-arising references citing the disputed prior art. Late-applied date filters to a different search (string #34) were "too little, too late."
- **The So What:** Going forward, classification-search numerosity matters; forensic searches conducted years post-petition will be scrutinized for hindsight infection from their earliest steps; patent owners can no longer rely on the simple narrative "the reference is in a classification the petitioner searched, therefore estopped." For petitioners, the holding revives both invalidity grounds on remand with significant downstream impact on the underlying $4M+ jury verdict.

## 4. Logical Flaws & Observations

- The court explicitly leaves open (1) standard of review (de novo vs clear-error) for the skilled-searcher inquiry, and (2) what "discovery" requires beyond reference-location. Both deferred under the rationale "Kotkin was not discoverable under any conception" — preserves flexibility but leaves uncertainty.
- The hindsight-bias analysis has subtle internal tension: citation-based searching is acknowledged as legitimate, but Greenia's search #3 (a citation search) is held to have infected all downstream iterative searches. The line between "conventional iterative methodology" and "hindsight-tainted methodology" depends almost entirely on whether the searcher knew the target references in advance — fact-bound, resists clean rule-formation.
- The Stark concurrence is doing significant doctrinal work that reads like a roadmap. Stark distinguishes "findability" (locating a reference) from "discoverability" (recognizing the invalidity ground based on the reference) — suggesting where an invalidity ground is "so apparent on the face of the prior art reference," findability collapses into discoverability. Willner (cited on the face of asserted patent) = findability satisfied; Kotkin = counterexample.

## 5. Follow-ups for Mr. C

**LSAT reasoning angle:** This opinion is a near-perfect specimen of LSAT analytical reasoning. The court (i) identifies a statutory standard, (ii) interprets a key term ("discover") narrowly, (iii) demonstrates the lower court applied an under-inclusive version, (iv) shows the only available evidence cannot satisfy the corrected standard, (v) reverses. The "evidence cannot satisfy the standard under any conception" move is a form of disjunctive elimination — name the variants of the standard, then show each fails. Practice exercise: identify the formal structure when the court holds something works "under either standard of review" while declining to choose between them.

**Watch threads:**
- The Stark two-step framework (findability → discoverability) is the next doctrinal frontier; first case to brief it carefully has high leverage.
- The deferred standard-of-review question (de novo vs clear-error) needs resolution; until then, district courts will continue to operate without firm guidance.
- Footnote 5 logic — Raymond and Koji are part of one combined invalidity ground, so failure of one element kills the ground (Ingenico). This is a "weakest link" doctrine for invalidity combinations worth knowing in detail.

**Bridge to SR theoretical training:**
- Doctrinal interpretation when statutory text uses adverbs ("reasonably") is a recurring theme in administrative-law and patent law. How does "reasonably could have raised" differ from "could have raised"? The court's answer narrows the universe, but the line is necessarily judgment-based — what tools do you bring to that judgment?
- Standard-of-review choice — when an appellate court declines to choose between de novo and clear-error because the outcome is the same, what does that tell you about the strength of the underlying evidence? Often it's a signal that the case is clearer than it looks.

---

*[JR to complete during mentor session: sections may be expanded; questions may be added; the "Follow-ups for Mr. C" section is the bridge back to the next SR session — capture any new questions that arise.]*

## DD-025 → DD-022 cross-vault note

This Field Clerk Session draft is staged at `Terminal/Central Hub/research/data/legal/field-clerk-drafts/24-2088-field-clerk-session.md` (CH-side staging). On JR review + sign-off, move to SR vault at `Sharpen Reason/Legal/2026-06-21-Ironburg-v-Valve.md` (path subject to JR confirmation per DD-022).

Cross-vault discipline check: this is the **first artifact** produced by the Mr.C loop that's *intended* to land in the SR vault. Per DD-021's parked-state calibration findings, cross-vault writes need named justification on the kickoff packet; for DD-025 → DD-022, that justification is the explicit pairing of these two DDs (DD-022 owns SR-side consumption format, DD-025 ships the source data).
