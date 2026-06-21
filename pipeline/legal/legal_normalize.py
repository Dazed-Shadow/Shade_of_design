"""
C-Legal (normalize) -- CourtListener opinion normalizer.
Reads raw JSON cache files written by legal_fetch.py.
Writes locked DD-021 schema JSON + companion Markdown per opinion.
Output: research/data/legal/normalized/<case_id>.json + <case_id>.md

Opinion format cascade (DD-021 Opus@CH spec):
  plain_text -> html (BS4) -> html_lawbox (BS4) -> xml_harvard (BS4) -> skip (log stderr)

Fail-soft: per-case errors logged to stderr, pipeline continues. End-of-run summary line.

CLI:
  python pipeline/legal/legal_normalize.py [--cache-dir PATH] [--output-dir PATH]
                                            [--area-of-law STR] [--self-test]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import tempfile
from pathlib import Path

try:
    from bs4 import BeautifulSoup
    _BS4_AVAILABLE = True
except ImportError:
    _BS4_AVAILABLE = False

_COURTLISTENER_BASE = "https://www.courtlistener.com"
_SUMMARY_MAX_CHARS = 800
_OPINION_MAX_CHARS = 200_000

_SCHEMA_KEYS = [
    "case_id", "citation", "court", "date_filed",
    "area_of_law", "jurisdiction", "opinion_text_md",
    "summary_md", "source_url",
]


def _strip_html(markup: str, parser: str = "html.parser") -> str:
    if not _BS4_AVAILABLE:
        return ""
    try:
        soup = BeautifulSoup(markup, parser)
        return soup.get_text(separator="\n", strip=True)
    except Exception:
        return ""


def _get_opinion_text(record: dict) -> str | None:
    """
    Cascade: plain_text -> html -> html_lawbox -> xml_harvard -> None.
    Returns clean text or None; caller logs stderr and skips.
    """
    pt = (record.get("plain_text") or "").strip()
    if pt:
        return pt

    html = (record.get("html") or "").strip()
    if html:
        text = _strip_html(html)
        if text:
            return text

    html_lb = (record.get("html_lawbox") or "").strip()
    if html_lb:
        text = _strip_html(html_lb)
        if text:
            return text

    xml_h = (record.get("xml_harvard") or "").strip()
    if xml_h:
        # lxml-xml preferred for well-formed XML; fall back to html.parser
        text = _strip_html(xml_h, "lxml-xml") or _strip_html(xml_h, "html.parser")
        if text:
            return text

    return None


def _make_summary(text: str) -> str:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if not lines:
        return ""
    para = lines[0]
    for line in lines[1:]:
        if len(para) >= _SUMMARY_MAX_CHARS:
            break
        para = para + " " + line
    return para[:_SUMMARY_MAX_CHARS].strip()


def _get_source_url(record: dict) -> str:
    url = (record.get("absolute_url") or "").strip()
    if url.startswith("http"):
        return url
    if url:
        return _COURTLISTENER_BASE + url
    ref_id = record.get("cluster_id") or record.get("id")
    return f"{_COURTLISTENER_BASE}/opinion/{ref_id}/"


def _get_citation(record: dict) -> str | None:
    for key in ("citations", "citation"):
        val = record.get(key)
        if isinstance(val, list) and val:
            return str(val[0])
        if isinstance(val, str) and val.strip():
            return val.strip()
    cluster = record.get("cluster")
    if isinstance(cluster, dict):
        for key in ("citations", "citation"):
            val = cluster.get(key)
            if isinstance(val, list) and val:
                return str(val[0])
            if isinstance(val, str) and val.strip():
                return val.strip()
    return None


def _get_date_filed(record: dict) -> str | None:
    val = record.get("date_filed")
    if val and re.match(r"^\d{4}-\d{2}-\d{2}", str(val)):
        return str(val)[:10]
    cluster = record.get("cluster")
    if isinstance(cluster, dict):
        val = cluster.get("date_filed")
        if val and re.match(r"^\d{4}-\d{2}-\d{2}", str(val)):
            return str(val)[:10]
    return None


def _get_court(record: dict) -> str | None:
    cluster = record.get("cluster")
    if isinstance(cluster, dict):
        for key in ("court_name", "court_full_name"):
            val = cluster.get(key)
            if isinstance(val, str) and val.strip():
                return val.strip()
    return None


def _get_jurisdiction(record: dict) -> str | None:
    cluster = record.get("cluster")
    if isinstance(cluster, dict):
        for key in ("court_id", "court_slug"):
            val = cluster.get(key)
            if isinstance(val, str) and val.strip():
                return val.strip()
        # Extract from court URL: .../courts/scotus/
        court_url = str(cluster.get("court") or "")
        m = re.search(r"/courts/([^/]+)/?$", court_url)
        if m:
            return m.group(1)
    docket = record.get("docket")
    if isinstance(docket, dict):
        val = docket.get("court_id") or docket.get("court")
        if isinstance(val, str) and val.strip():
            return val.strip()
    return None


def normalize_one(record: dict, area_of_law: str) -> dict | None:
    """
    Normalize one raw CourtListener opinion record to the locked DD-021 schema.
    Returns dict or None if no usable opinion text (caller logs and skips).
    Null is used for any field that can't be populated -- never empty string or 'N/A'.
    """
    case_id = str(record.get("id", "")).strip()
    if not case_id:
        print("[WARN] Record missing id field -- skipping.", file=sys.stderr)
        return None

    opinion_text = _get_opinion_text(record)
    if opinion_text is None:
        print(
            f"[WARN] case {case_id}: no usable opinion text in plain_text/html/html_lawbox/xml_harvard -- skipping.",
            file=sys.stderr,
        )
        return None

    opinion_text = opinion_text[:_OPINION_MAX_CHARS]

    return {
        "case_id": case_id,
        "citation": _get_citation(record),
        "court": _get_court(record),
        "date_filed": _get_date_filed(record),
        "area_of_law": area_of_law,
        "jurisdiction": _get_jurisdiction(record),
        "opinion_text_md": opinion_text,
        "summary_md": _make_summary(opinion_text),
        "source_url": _get_source_url(record),
    }


def _write_outputs(normalized: dict, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    case_id = normalized["case_id"]
    title = normalized["citation"] or case_id

    json_path = output_dir / f"{case_id}.json"
    json_path.write_text(
        json.dumps(normalized, ensure_ascii=True, indent=2),
        encoding="utf-8",
    )

    def _fmt(v: object) -> str:
        return str(v) if v is not None else ""

    md_lines = [
        "---",
        f"case_id: {_fmt(normalized['case_id'])}",
        f"citation: {_fmt(normalized['citation'])}",
        f"court: {_fmt(normalized['court'])}",
        f"date_filed: {_fmt(normalized['date_filed'])}",
        f"area_of_law: {_fmt(normalized['area_of_law'])}",
        f"jurisdiction: {_fmt(normalized['jurisdiction'])}",
        f"source_url: {_fmt(normalized['source_url'])}",
        "---",
        "",
        f"# {title}",
        "",
        "## Summary",
        "",
        normalized["summary_md"] or "_No summary available._",
        "",
        "## Opinion",
        "",
        normalized["opinion_text_md"],
    ]
    md_path = output_dir / f"{case_id}.md"
    md_path.write_text("\n".join(md_lines), encoding="utf-8")


def run_normalize(
    cache_dir: Path,
    output_dir: Path,
    area_of_law: str,
) -> tuple[int, int]:
    """Normalize all .json files in cache_dir. Returns (normalized, skipped)."""
    normalized_count = 0
    skipped_count = 0
    errors: list[str] = []

    cache_files = sorted(cache_dir.glob("*.json"))
    if not cache_files:
        print(f"[WARN] No .json files found in {cache_dir}", file=sys.stderr)
        return 0, 0

    for cache_file in cache_files:
        try:
            record = json.loads(cache_file.read_text(encoding="utf-8"))
        except Exception as exc:
            msg = f"[ERROR] {cache_file.name}: JSON parse failed: {exc}"
            print(msg, file=sys.stderr)
            errors.append(msg)
            skipped_count += 1
            continue

        try:
            result = normalize_one(record, area_of_law)
        except Exception as exc:
            msg = f"[ERROR] {cache_file.name}: normalize error: {exc}"
            print(msg, file=sys.stderr)
            errors.append(msg)
            skipped_count += 1
            continue

        if result is None:
            skipped_count += 1
            continue

        try:
            _write_outputs(result, output_dir)
            normalized_count += 1
        except Exception as exc:
            msg = f"[ERROR] {cache_file.name}: write error: {exc}"
            print(msg, file=sys.stderr)
            errors.append(msg)
            skipped_count += 1
            continue

    # End-of-run summary line -- fail-soft pattern D-008
    print(
        f"Normalized: {normalized_count} / Skipped: {skipped_count} "
        f"/ Errors: {len(errors)} / Output: {output_dir}",
        file=sys.stderr,
    )
    return normalized_count, skipped_count


def _run_self_test() -> None:
    """
    Create a synthetic CourtListener opinion fixture, run the normalizer,
    assert the locked DD-021 schema is satisfied. No live API call.
    Exits 0 on PASS, 1 on FAIL.
    """
    print("[SELF-TEST] Building synthetic CourtListener fixture...", file=sys.stderr)

    synthetic_record = {
        "id": 9999999,
        "absolute_url": "https://www.courtlistener.com/opinion/9999999/test-v-united-states/",
        "cluster_id": 8888888,
        "cluster": {
            "citations": ["999 U.S. 1"],
            "court_id": "scotus",
            "court_name": "Supreme Court of the United States",
            "date_filed": "2024-01-15",
        },
        "plain_text": (
            "JUSTICE SMITH delivered the opinion of the Court.\n\n"
            "This synthetic opinion tests the C-Legal normalizer for DD-021. "
            "The case concerns federal administrative law principles under the APA. "
            "We hold that the agency acted within its statutory authority.\n\n"
            "I. Background\n\n"
            "The petitioner challenges the agency's final rule on procedural grounds.\n\n"
            "II. Analysis\n\n"
            "Applying the two-step framework, we find the statute ambiguous and the "
            "agency's reading reasonable. The judgment of the D.C. Circuit is affirmed."
        ),
        "html": "",
        "html_lawbox": "",
        "xml_harvard": "",
    }

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        cache_dir = tmp / "cache"
        output_dir = tmp / "normalized"
        cache_dir.mkdir()

        (cache_dir / "9999999.json").write_text(
            json.dumps(synthetic_record, indent=2), encoding="utf-8"
        )

        n, s = run_normalize(cache_dir, output_dir, "federal_administrative_law")

        failures: list[str] = []

        if n != 1:
            failures.append(f"Expected normalized=1, got {n}")
        if s != 0:
            failures.append(f"Expected skipped=0, got {s}")

        json_out = output_dir / "9999999.json"
        md_out = output_dir / "9999999.md"

        if not json_out.exists():
            failures.append("JSON output missing")
        if not md_out.exists():
            failures.append("Markdown output missing")

        if json_out.exists():
            data = json.loads(json_out.read_text(encoding="utf-8"))
            for k in _SCHEMA_KEYS:
                if k not in data:
                    failures.append(f"Schema key missing: {k}")
            checks = [
                (data.get("case_id"), "9999999", "case_id"),
                (data.get("citation"), "999 U.S. 1", "citation"),
                (data.get("jurisdiction"), "scotus", "jurisdiction"),
                (data.get("area_of_law"), "federal_administrative_law", "area_of_law"),
                (data.get("date_filed"), "2024-01-15", "date_filed"),
            ]
            for got, want, field in checks:
                if got != want:
                    failures.append(f"{field}: expected {want!r}, got {got!r}")
            if not data.get("opinion_text_md"):
                failures.append("opinion_text_md is empty")
            if not data.get("summary_md"):
                failures.append("summary_md is empty")
            if "courtlistener.com" not in (data.get("source_url") or ""):
                failures.append(f"source_url missing courtlistener.com: {data.get('source_url')!r}")

        if md_out.exists():
            md_content = md_out.read_text(encoding="utf-8")
            for marker in ("case_id:", "## Summary", "## Opinion"):
                if marker not in md_content:
                    failures.append(f"Markdown missing '{marker}'")

    if failures:
        print(f"FAIL -- {len(failures)} assertion(s):", file=sys.stderr)
        for f in failures:
            print(f"  * {f}", file=sys.stderr)
        sys.exit(1)

    print("PASS", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="C-Legal: normalize CourtListener opinion cache to locked DD-021 schema.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--cache-dir",
        default=None,
        help="Override cache directory (default: <CH root>/research/data/legal/cache)",
    )
    parser.add_argument(
        "--output-dir",
        default=None,
        help="Override output directory (default: <CH root>/research/data/legal/normalized)",
    )
    parser.add_argument(
        "--area-of-law",
        default="federal_administrative_law",
        help="Area of law label written to each normalized record",
    )
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Run synthetic fixture test; exit 0 on PASS, 1 on FAIL. No real dirs touched.",
    )
    args = parser.parse_args()

    if args.self_test:
        _run_self_test()
        return

    ch_root = Path(__file__).resolve().parents[2]
    cache_dir = (
        Path(args.cache_dir).resolve()
        if args.cache_dir
        else ch_root / "research" / "data" / "legal" / "cache"
    )
    output_dir = (
        Path(args.output_dir).resolve()
        if args.output_dir
        else ch_root / "research" / "data" / "legal" / "normalized"
    )

    print(f"[CONFIG] cache_dir   = {cache_dir}", file=sys.stderr)
    print(f"[CONFIG] output_dir  = {output_dir}", file=sys.stderr)
    print(f"[CONFIG] area_of_law = {args.area_of_law}", file=sys.stderr)

    run_normalize(cache_dir, output_dir, args.area_of_law)


if __name__ == "__main__":
    main()
