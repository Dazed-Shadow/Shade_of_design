"""
C-Legal manifest exporter -- DD-037 Phase 1 (the vault->manifest seam),
extended in Phase 2 (the reading room), Phase 4 (the play space), and
Phase 5 (cadence + vault-native variant). Still one code path, one schema.

Reads research/data/legal/cases/*.md and research/data/legal/field-clerks/*.md,
parses YAML frontmatter, splits the markdown body into sections by H2 (## )
headings, and emits validated JSON manifests: cases.json, field-clerks.json,
and warchest.json.

ONE code path. No per-surface parsing anywhere else, ever -- every site
surface renders these manifests, never vault paths directly.

Phase 4 additions:
  - `source_slug` (the source file's stem, e.g. "trump_v_slaughter") is now
    on every entry. Some corpus files are named by docket number (its slug
    equals its id, a harmless redundancy); the Trump v. Cook / Trump v.
    Slaughter case files are named by a descriptive slug instead, and the
    corpus's own cross-refs use that slug ([[trump_v_cook|...]]), which the
    id-only lookup in Phase 2's renderer could never resolve. Exporting the
    slug lets the renderer alias it to the entry's canonical id.
  - `updated_at`, derived per Standing Rule #2 (missing UI-shaped field ->
    exporter derives it, corpus doesn't grow a new key): field-clerk
    frontmatter carries `sr_review_date`; case frontmatter carries
    `decision_date`. The browse-layer shelf needs one temporal field to sort
    both kinds together, so this picks whichever the doc's own frontmatter
    already has.
  - `warchest.json`: aggregates every Public field-clerk's
    `war_chest_candidates` array into named specimens (kebab name, the FC ids
    that named it, a count). No corpus file changes -- read-only aggregation
    over the same visibility-filtered set Phase 1 already established.

Phase 5 additions (DD-037 Phase 5, cadence + vault-native variant):
  - `source_url` (already on the page per Standing Rule #2 -- case frontmatter
    carries it today) is now on every manifest entry, passed through
    unchanged. Field-clerk frontmatter has no `source_url` key, so FC entries
    simply carry `null` -- the case template is the only renderer that reads
    it (FCs are internal work product, no source line). A case missing the
    field also renders `null` -- graceful absence, not a validation error.
  - `_SR-INDEX.md`: one Obsidian-side navigation note written to the corpus
    root (never the site data dir, never a site manifest), listing EVERY
    corpus doc -- Public AND Private, the boundary governs the site export
    only -- grouped Cases / Field Clerks, each a `[[wikilink]]` with docket,
    title, and its Public/Private marker. Regenerated whole-file on every
    run; never hand-edited. This is a navigation aid, not a manifest, so it
    does not share the Public-only schema-validation gate below: a sparse or
    malformed Private file still gets a best-effort line (title/docket fall
    back to the filename) rather than aborting the sync over a note nobody
    is publishing.

CRITICAL RULE (DD-037 Standing Rule #6 -- visibility boundary, privacy):
  Only files with `visibility: Public` in frontmatter are emitted. A missing
  or absent visibility field means Private -- excluded, fail-safe, and this
  is NOT a validation error (most of the corpus is expected to be excluded
  this way).

Schema validation is a blocking gate, but only for files already marked
visibility: Public -- a Public file missing docket_number or a title (its H1
heading) aborts the WHOLE export with the file path and missing field named.
Never a partial or silently broken manifest.

Per DD-037 Standing Rule #2 ("upstream stays downstream-ignorant"): `id` and
`title` are not separate frontmatter fields in the corpus today, so this
exporter derives them (id <- docket_number, title <- the body's H1 heading)
rather than asking the corpus to grow UI-shaped fields. If a Public file
lacks the source data for a derivation, that IS a validation failure (see
above) -- the derivation doesn't paper over missing required data, it just
avoids inventing a new frontmatter key for something already on the page.

Phase 2 addition: content between a doc's H1 title and its first H2 heading
(a real construct in 26-1575.md's calibration blockquote) is now kept as an
unheaded lead section (heading: "") instead of being silently dropped. No
schema change -- "heading" was always a string; this just stops discarding
real content that happened to precede the first H2.

CLI:
  python pipeline/legal/export_manifests.py [--corpus-dir PATH] [--out-dir PATH]

Emits cases.json, field-clerks.json, warchest.json (+ .js siblings of all
three) under out_dir, and _SR-INDEX.md at the corpus root (vault-native,
never a site artifact).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import yaml

# parents[0]=legal, [1]=pipeline, [2]=Central Hub root
_CH_ROOT = Path(__file__).resolve().parents[2]
_DEFAULT_CORPUS_DIR = _CH_ROOT / "research" / "data" / "legal"
_DEFAULT_OUT_DIR = (
    _CH_ROOT / "quick-front-end" / "shade-of-design-landing" / "sr-playspace" / "data"
)
# Vault-native index lands at the corpus root, deliberately NOT under
# _DEFAULT_OUT_DIR -- it is never a site artifact (DD-037 Phase 5).
_SR_INDEX_FILENAME = "_SR-INDEX.md"

_FRONTMATTER_RE = re.compile(r"\A---\r?\n(.*?)\r?\n---\r?\n?", re.DOTALL)
_H1_RE = re.compile(r"^#[ \t]+(.+?)[ \t]*$", re.MULTILINE)
_H2_RE = re.compile(r"^##[ \t]+(.+?)[ \t]*$", re.MULTILINE)
_WIKILINK_RE = re.compile(r"\[\[([^\]|]+)(?:\|[^\]]*)?\]\]")


class ManifestValidationError(Exception):
    """Raised on a blocking schema-validation failure for a Public file."""


def _parse_frontmatter(text: str, path: Path) -> tuple[dict, str]:
    m = _FRONTMATTER_RE.match(text)
    if not m:
        raise ManifestValidationError(f"{path}: no YAML frontmatter block found")
    body = text[m.end():]
    try:
        fm = yaml.safe_load(m.group(1))
    except yaml.YAMLError as exc:
        raise ManifestValidationError(f"{path}: frontmatter -- unparsable YAML ({exc})")
    if not isinstance(fm, dict):
        raise ManifestValidationError(f"{path}: frontmatter did not parse to a mapping")
    return fm, body


def _extract_title(body: str, path: Path) -> str:
    m = _H1_RE.search(body)
    if not m:
        raise ManifestValidationError(f"{path}: missing required field 'title' (no H1 '# ' heading found in body)")
    return m.group(1).strip()


def _split_sections(body: str) -> list[dict]:
    h1 = _H1_RE.search(body)
    rest = body[h1.end():] if h1 else body

    headings = list(_H2_RE.finditer(rest))
    sections = []

    # Preamble: content between the H1 title and the first H2 (e.g. 26-1575's
    # calibration blockquote). Phase 1 silently dropped this; Phase 2 keeps it
    # as an unheaded lead section rather than losing real corpus content.
    preamble_end = headings[0].start() if headings else len(rest)
    preamble = rest[:preamble_end].strip("\n")
    if preamble:
        sections.append({"heading": "", "content_markdown": preamble})

    for i, m in enumerate(headings):
        start = m.end()
        end = headings[i + 1].start() if i + 1 < len(headings) else len(rest)
        sections.append({
            "heading": m.group(1).strip(),
            "content_markdown": rest[start:end].strip("\n"),
        })
    return sections


def _extract_cross_refs(body: str) -> list[str]:
    refs: list[str] = []
    for m in _WIKILINK_RE.finditer(body):
        ref = m.group(1).strip()
        if ref and ref not in refs:
            refs.append(ref)
    return refs


_CATEGORY_SUFFIX_RE = re.compile(r"(?i)-category$")


def _kebab_name(raw: str) -> str:
    name = _CATEGORY_SUFFIX_RE.sub("", raw.strip())
    return name.lower()


def _iter_public(source_dir: Path):
    """Yield (path, fm, body) for every visibility: Public file in source_dir.

    Single shared scan so _export_dir and _export_warchest apply the exact
    same fail-safe visibility filter -- no second, drifting implementation.
    """
    if not source_dir.is_dir():
        return
    for path in sorted(source_dir.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        fm, body = _parse_frontmatter(text, path)
        if fm.get("visibility") != "Public":
            continue  # Private or absent -- fail-safe exclusion, not an error.
        yield path, fm, body


def _build_entry(path: Path, fm: dict, body: str) -> dict:
    docket_number = fm.get("docket_number")
    if not docket_number:
        raise ManifestValidationError(f"{path}: missing required field 'docket_number'")

    title = _extract_title(body, path)

    tags = fm.get("tags")
    if tags is None:
        tags = fm.get("area_of_law") or []

    # sr_review_date is written unquoted (2026-07-11) in FC frontmatter, so
    # YAML parses it as a date object; decision_date is written slash-style
    # ("2026/06/29") and stays a plain string. str() normalizes either shape
    # to the same manifest type without touching the corpus.
    updated_at_raw = fm.get("sr_review_date") or fm.get("decision_date")
    updated_at = str(updated_at_raw) if updated_at_raw is not None else None

    return {
        "id": str(docket_number),
        "docket_number": str(docket_number),
        "source_slug": path.stem,
        "title": title,
        "court": fm.get("court"),
        "decision_date": fm.get("decision_date"),
        "updated_at": updated_at,
        "tags": tags,
        "visibility": fm.get("visibility"),
        "source_url": fm.get("source_url"),
        "cross_refs": _extract_cross_refs(body),
        "sections": _split_sections(body),
    }


def _export_dir(source_dir: Path) -> list[dict]:
    return [_build_entry(path, fm, body) for path, fm, body in _iter_public(source_dir)]


def _export_warchest(field_clerks_dir: Path) -> list[dict]:
    buckets: dict[str, list[str]] = {}
    for path, fm, _body in _iter_public(field_clerks_dir):
        docket_number = fm.get("docket_number")
        if not docket_number:
            raise ManifestValidationError(f"{path}: missing required field 'docket_number'")
        fc_id = str(docket_number)
        for raw in fm.get("war_chest_candidates") or []:
            name = _kebab_name(str(raw))
            if not name:
                continue
            from_fcs = buckets.setdefault(name, [])
            if fc_id not in from_fcs:
                from_fcs.append(fc_id)
    return [
        {"name": name, "from_fcs": from_fcs, "count": len(from_fcs)}
        for name, from_fcs in sorted(buckets.items())
    ]


def _index_entry(path: Path, folder_prefix: str) -> dict:
    """Best-effort scan for the vault-native index -- lists EVERY corpus doc
    regardless of visibility, so it deliberately does NOT reuse _iter_public
    or _build_entry's Public-only validation gate. A sparse or malformed
    Private file still gets a navigation line; title/docket fall back to the
    filename stem rather than aborting the whole sync run over a note nobody
    is publishing (the blocking schema gate stays scoped to Public site
    manifests, per the module-level CRITICAL RULE).

    link_target is folder-qualified (e.g. "cases/21-1729"), not a bare
    stem: a docket-named case and its paired Field Clerk can share an exact
    filename (21-1729.md exists in both cases/ and field-clerks/ today), and
    a bare [[21-1729]] wikilink is ambiguous in Obsidian across two files
    with the same basename. The folder prefix disambiguates.
    """
    text = path.read_text(encoding="utf-8")
    try:
        fm, body = _parse_frontmatter(text, path)
    except ManifestValidationError:
        fm, body = {}, text

    docket = fm.get("docket_number")
    docket = str(docket) if docket else path.stem

    try:
        title = _extract_title(body, path)
    except ManifestValidationError:
        title = docket

    visibility = "Public" if fm.get("visibility") == "Public" else "Private"

    return {
        "link_target": f"{folder_prefix}/{path.stem}",
        "docket": docket,
        "title": title,
        "visibility": visibility,
    }


def _index_group(source_dir: Path, folder_prefix: str) -> list[dict]:
    if not source_dir.is_dir():
        return []
    return [_index_entry(path, folder_prefix) for path in sorted(source_dir.glob("*.md"))]


def _index_lines(entries: list[dict]) -> list[str]:
    if not entries:
        return ["*(none yet)*"]
    return [
        f"- [[{e['link_target']}|{e['title']}]] -- {e['docket']} -- **{e['visibility']}**"
        for e in entries
    ]


def _render_sr_index(cases: list[dict], field_clerks: list[dict]) -> str:
    lines = [
        "---",
        "cssclasses:",
        "  - sod-room",
        "  - sod-records",
        "title: SR Index",
        "---",
        "",
        "> Auto-generated by `pipeline/legal/sync_sr.py` on every sync run --"
        " do not hand-edit, edits are overwritten on the next sync. Lists"
        " every corpus doc, Private and Public; the marker on each line"
        " mirrors that doc's own `visibility` frontmatter field (missing or"
        " absent means Private, fail-safe, same rule the site export uses).",
        "",
        "# SR Index",
        "",
        "## Cases",
        "",
    ]
    lines.extend(_index_lines(cases))
    lines.append("")
    lines.append("## Field Clerks")
    lines.append("")
    lines.extend(_index_lines(field_clerks))
    lines.append("")
    return "\n".join(lines)


def _write_sr_index(corpus_dir: Path) -> int:
    """Writes _SR-INDEX.md to the corpus root. Returns entry count. Plain
    markdown links ONLY -- no dataview/dataviewjs on nav, per standing law.
    """
    index_cases = _index_group(corpus_dir / "cases", "cases")
    index_field_clerks = _index_group(corpus_dir / "field-clerks", "field-clerks")
    sr_index_md = _render_sr_index(index_cases, index_field_clerks)
    (corpus_dir / _SR_INDEX_FILENAME).write_text(sr_index_md, encoding="utf-8")
    return len(index_cases) + len(index_field_clerks)


def run_export(corpus_dir: Path, out_dir: Path) -> dict:
    cases = _export_dir(corpus_dir / "cases")
    field_clerks = _export_dir(corpus_dir / "field-clerks")
    warchest = _export_warchest(corpus_dir / "field-clerks")

    out_dir.mkdir(parents=True, exist_ok=True)
    cases_json = json.dumps({"$schema_version": "1.0.0", "cases": cases}, indent=2, ensure_ascii=True)
    fc_json = json.dumps({"$schema_version": "1.0.0", "field_clerks": field_clerks}, indent=2, ensure_ascii=True)
    warchest_json = json.dumps({"$schema_version": "1.0.0", "warchest": warchest}, indent=2, ensure_ascii=True)

    (out_dir / "cases.json").write_text(cases_json + "\n", encoding="utf-8")
    (out_dir / "field-clerks.json").write_text(fc_json + "\n", encoding="utf-8")
    (out_dir / "warchest.json").write_text(warchest_json + "\n", encoding="utf-8")

    # .js siblings of the same payloads, for file:// viewing (JR double-clicks
    # index.html to verify locally; browsers block fetch() on file:// but load
    # <script src> fine). Same compiled artifact, second wrapper -- never edit
    # by hand; the render route prefers fetch and falls back to these globals.
    (out_dir / "cases.js").write_text(
        "window.SOD_MANIFEST_CASES = " + cases_json + ";\n", encoding="utf-8",
    )
    (out_dir / "field-clerks.js").write_text(
        "window.SOD_MANIFEST_FIELD_CLERKS = " + fc_json + ";\n", encoding="utf-8",
    )
    (out_dir / "warchest.js").write_text(
        "window.SOD_MANIFEST_WARCHEST = " + warchest_json + ";\n", encoding="utf-8",
    )

    # Vault-native index: corpus root, never the site data dir, never a
    # site manifest (DD-037 Phase 5).
    index_entries = _write_sr_index(corpus_dir)

    return {
        "cases": len(cases),
        "field_clerks": len(field_clerks),
        "warchest": len(warchest),
        "index_entries": index_entries,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="DD-037 manifest exporter -- vault markdown -> validated JSON manifests (cases.json, field-clerks.json).",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--corpus-dir",
        default=None,
        help=f"Corpus root containing cases/ and field-clerks/ (default: {_DEFAULT_CORPUS_DIR})",
    )
    parser.add_argument(
        "--out-dir",
        default=None,
        help=f"Manifest output directory (default: {_DEFAULT_OUT_DIR})",
    )
    args = parser.parse_args()

    corpus_dir = Path(args.corpus_dir).resolve() if args.corpus_dir else _DEFAULT_CORPUS_DIR
    out_dir = Path(args.out_dir).resolve() if args.out_dir else _DEFAULT_OUT_DIR

    print(f"[CONFIG] corpus_dir = {corpus_dir}", file=sys.stderr)
    print(f"[CONFIG] out_dir    = {out_dir}", file=sys.stderr)

    try:
        counts = run_export(corpus_dir, out_dir)
    except ManifestValidationError as exc:
        print(f"[FATAL] {exc}", file=sys.stderr)
        sys.exit(1)

    print(f"[OK] cases.json: {counts['cases']} entries", file=sys.stderr)
    print(f"[OK] field-clerks.json: {counts['field_clerks']} entries", file=sys.stderr)
    print(f"[OK] warchest.json: {counts['warchest']} specimens", file=sys.stderr)
    print(f"[OK] written to {out_dir}", file=sys.stderr)
    print(f"[OK] {_SR_INDEX_FILENAME}: {counts['index_entries']} entries (vault-native, {corpus_dir})", file=sys.stderr)


if __name__ == "__main__":
    main()
