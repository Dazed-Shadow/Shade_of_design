"""
C-Legal (auto-fetch queries) -- CourtListener SEARCH API routine for DD-026.

Reads pipeline/legal/queries.toml, fetches new opinion PDFs via the CourtListener
SEARCH API, dedupes against _fetch_log.csv, fast-extracts deterministic fields
(parties, court, docket, dates, panel, disposition, holding, citations) from each
new PDF, writes a per-fetch summary file, and sends an email alert to JR.

CRITICAL RULE (JR direction 2026-06-23):
  This script does ONLY deterministic plumbing (HTTP, file I/O, regex extraction, SMTP).
  NO synthesis, NO LLM calls, NO judgment-shaped work.
  Synthesis is reserved for Mr.C via Skill 4 LR-CHAIN (DD-029).

CLI:
  python pipeline/legal/legal_fetch_queries.py [--queries-file PATH]
      [--log-file PATH] [--pdf-dir PATH] [--summary-dir PATH]
      [--rate-seconds F] [--dry-run] [--no-email]
"""

from __future__ import annotations

import argparse
import csv
import re
import smtplib
import sys
import time
import tomllib
from datetime import date, datetime, timedelta
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

import httpx

# pdfplumber preferred; pypdf installed fallback (per DD-026 ship note)
try:
    import pdfplumber  # type: ignore[import]
    _PDF_BACKEND = "pdfplumber"
except ImportError:
    pdfplumber = None
    try:
        import pypdf  # type: ignore[import]
        _PDF_BACKEND = "pypdf"
    except ImportError:
        pypdf = None
        _PDF_BACKEND = None

# Reuse token loader from DD-021 parked artifact -- do NOT refactor or duplicate
from legal_fetch import load_courtlistener_token  # noqa: E402 (same-directory import)

_SEARCH_URL = "https://www.courtlistener.com/api/rest/v4/search/"
_COURTLISTENER_BASE = "https://www.courtlistener.com"

# parents[2] = CH root; parents[4] = vault root
_CH_ROOT = Path(__file__).resolve().parents[2]
_VAULT_ROOT = Path(__file__).resolve().parents[4]

_EXTRACTION_FAILED = "[extraction failed]"
_LOG_HEADER = ["query_id", "docket_number", "document_id", "fetched_on", "pdf_filename", "source_url"]

JR_EMAIL = "the.riveraj@gmail.com"
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587

# Opinion type code -> filename TYPE segment (matches JR's existing PDF naming)
_TYPE_MAP = {
    "010combined": "OPINION",
    "020lead": "LEAD",
    "025plurality": "PLURALITY",
    "030concur": "CONCUR",
    "035concurjudgment": "CONCURJGMT",
    "040dissent": "DISSENT",
    "050addendum": "ADDENDUM",
    "060remittitur": "REMITTITUR",
    "070rehearing": "REHEARING",
    "080onthemerits": "MERITS",
    "090onmotiontostrike": "MOTIONSTRIKE",
}


# ---------------------------------------------------------------------------
# Auth loaders
# ---------------------------------------------------------------------------

def load_gmail_app_password(secrets_path: Path) -> str:
    """
    Load Gmail SMTP app password from secrets/keys.txt.
    Parallel to load_courtlistener_token() -- same path, same pattern.
    Expected section in secrets/keys.txt:
        ### Gmail SMTP App Password
        > <16-char-password>
    Google formats app passwords with spaces in the UI ("abcd efgh ijkl mnop");
    the actual credential is pure alphanumeric. Strip all whitespace from the
    captured value to handle either copy-paste form.
    ASCII-only regex per cycle-3 DD-005 encoding calibration.
    """
    content = secrets_path.read_text(encoding="utf-8")
    # Capture rest of line (not just first non-whitespace token) to handle
    # Google's space-formatted display form. Strip ALL whitespace afterward.
    match = re.search(r"###\s+Gmail\s+SMTP\s+App\s+Password\s*\n>\s*(.+)", content)
    if not match:
        raise RuntimeError(f"Gmail SMTP app password not found in {secrets_path}")
    return re.sub(r"\s+", "", match.group(1))


# ---------------------------------------------------------------------------
# Queries + log
# ---------------------------------------------------------------------------

def _load_queries(queries_file: Path) -> tuple[list[dict], dict]:
    """Return (query_list, defaults_dict). Raises on missing or bad TOML."""
    with open(queries_file, "rb") as f:
        data = tomllib.load(f)
    queries = data.get("query", [])
    defaults = data.get("defaults", {})
    if not queries:
        raise RuntimeError(f"queries.toml has no [[query]] entries: {queries_file}")
    return queries, defaults


def _load_seen_pairs(log_file: Path) -> set[tuple[str, str]]:
    """Return set of (docket_number, document_id) already in _fetch_log.csv."""
    seen: set[tuple[str, str]] = set()
    if not log_file.exists():
        return seen
    with open(log_file, encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f, delimiter="|"):
            dn = (row.get("docket_number") or "").strip()
            did = (row.get("document_id") or "").strip()
            if dn and did:
                seen.add((dn, did))
    return seen


def _max_fetched_on(log_file: Path, query_id: str) -> date | None:
    if not log_file.exists():
        return None
    best: date | None = None
    with open(log_file, encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f, delimiter="|"):
            if (row.get("query_id") or "").strip() != query_id:
                continue
            raw = (row.get("fetched_on") or "").strip()
            if not raw:
                continue
            try:
                d = date.fromisoformat(raw[:10])
                if best is None or d > best:
                    best = d
            except ValueError:
                continue
    return best


def _compute_filed_after(log_file: Path, query_id: str) -> str:
    """
    Return filed_after as M/D/YYYY string.
    Strategy: max(fetched_on) for this query_id minus 1 day (overlap safety).
    Fallback: today - 30 days if no prior entries.
    Uses explicit f-string to avoid Windows/Linux strftime padding differences.
    """
    max_d = _max_fetched_on(log_file, query_id)
    ref = (max_d - timedelta(days=1)) if max_d else (date.today() - timedelta(days=30))
    return f"{ref.month}/{ref.day}/{ref.year}"


def _ensure_log_header(log_file: Path) -> None:
    """Write header row if log is absent or empty."""
    log_file.parent.mkdir(parents=True, exist_ok=True)
    if not log_file.exists() or log_file.stat().st_size == 0:
        with open(log_file, "w", encoding="utf-8", newline="") as f:
            csv.DictWriter(f, fieldnames=_LOG_HEADER, delimiter="|").writeheader()


def _append_log_rows(log_file: Path, rows: list[dict]) -> None:
    with open(log_file, "a", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=_LOG_HEADER, delimiter="|")
        for row in rows:
            writer.writerow(row)


# ---------------------------------------------------------------------------
# PDF filename
# ---------------------------------------------------------------------------

def _make_pdf_filename(result: dict) -> str:
    """
    Construct filename per JR convention: <docket>.<TYPE>.<M-D-YYYY>_<id>.pdf
    Matches existing PDF names like 24-1600.OPINION.6-5-2026_2705463.pdf.
    Falls back to constructing from result fields if download_url has no filename.

    SEARCH API nests download_url, id, and type under opinions[0]; top-level
    lookups are kept as fallback for OPINIONS API compatibility.
    """
    opinions = result.get("opinions") or []
    first_op = opinions[0] if opinions else {}

    dl_url = (first_op.get("download_url") or result.get("download_url") or "").strip()
    if dl_url:
        candidate = dl_url.rstrip("/").rsplit("/", 1)[-1]
        if candidate.lower().endswith(".pdf") and len(candidate) > 4:
            return candidate

    docket = re.sub(r"[^\w\-]", "_", (result.get("docketNumber") or "UNKNOWN").strip())
    type_code = (first_op.get("type") or result.get("type") or "").lower()
    type_str = _TYPE_MAP.get(type_code, "OPINION")

    filed = (result.get("dateFiled") or "").strip()
    if filed and re.match(r"\d{4}-\d{2}-\d{2}", filed):
        y, m, d_s = filed[:10].split("-")
        date_str = f"{int(m)}-{int(d_s)}-{y}"
    else:
        date_str = "0-0-0000"

    op_id = str(result.get("cluster_id") or first_op.get("id") or result.get("id") or "0")
    return f"{docket}.{type_str}.{date_str}_{op_id}.pdf"


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def _get_json(
    client: httpx.Client,
    url: str,
    headers: dict,
    params: dict,
) -> dict | None:
    """GET JSON with one retry on transient error. Returns None to skip."""
    try:
        resp = client.get(url, headers=headers, params=params)
        if resp.status_code == 429:
            print("[WARN] 429 rate limit -- sleeping 60s before retry.", file=sys.stderr)
            time.sleep(60.0)
            resp = client.get(url, headers=headers, params=params)
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        print(f"[ERROR] GET {url} failed: {exc}", file=sys.stderr)
        time.sleep(5.0)
        try:
            resp = client.get(url, headers=headers, params=params)
            resp.raise_for_status()
            return resp.json()
        except Exception as exc2:
            print(f"[ERROR] Retry failed: {exc2}", file=sys.stderr)
            return None


def _download_pdf(
    client: httpx.Client,
    result: dict,
    pdf_dir: Path,
    headers: dict,
) -> Path | None:
    """Download PDF to pdf_dir. Returns local path or None on failure."""
    filename = _make_pdf_filename(result)
    out_path = pdf_dir / filename

    # SEARCH API nests download_url under opinions[0]; fall back to top-level
    # download_url, then absolute_url (cluster page, may redirect to PDF).
    opinions = result.get("opinions") or []
    first_op = opinions[0] if opinions else {}
    dl_url = (first_op.get("download_url") or result.get("download_url") or "").strip()
    if not dl_url:
        abs_url = (result.get("absolute_url") or "").strip()
        if abs_url:
            dl_url = (abs_url if abs_url.startswith("http") else _COURTLISTENER_BASE + abs_url)
        else:
            print(f"[WARN] No download URL for opinion {result.get('cluster_id') or result.get('id')} -- skipping.", file=sys.stderr)
            return None

    try:
        resp = client.get(dl_url, headers=headers, follow_redirects=True, timeout=60.0)
        resp.raise_for_status()
        out_path.write_bytes(resp.content)
        return out_path
    except Exception as exc:
        # SSL cert chain issues on *.uscourts.gov endpoints (federal court servers
        # with intermediate certs not in Python's default trust store). Retry
        # with verification disabled — safe trade-off since these are public
        # government PDF documents, not credentials.
        err_str = str(exc).upper()
        if "SSL" in err_str or "CERTIFICATE" in err_str:
            print(f"[WARN] SSL verify failed for {dl_url}, retrying without verification.", file=sys.stderr)
            try:
                with httpx.Client(verify=False, timeout=60.0) as fb:
                    resp = fb.get(dl_url, headers=headers, follow_redirects=True)
                    resp.raise_for_status()
                    out_path.write_bytes(resp.content)
                    return out_path
            except Exception as exc2:
                print(f"[ERROR] PDF download failed even with SSL bypass ({dl_url}): {exc2}", file=sys.stderr)
                return None
        print(f"[ERROR] PDF download failed ({dl_url}): {exc}", file=sys.stderr)
        return None


# ---------------------------------------------------------------------------
# Fast-extract (deterministic regex only -- NO LLM, NO synthesis)
# ---------------------------------------------------------------------------

def _extract_pdf_text(pdf_path: Path) -> str | None:
    """Extract raw text from PDF. Returns None on total failure."""
    if _PDF_BACKEND == "pdfplumber":
        try:
            with pdfplumber.open(pdf_path) as pdf:
                return "\n".join(p.extract_text() or "" for p in pdf.pages)
        except Exception as exc:
            print(f"[WARN] pdfplumber failed on {pdf_path.name}: {exc}", file=sys.stderr)

    if _PDF_BACKEND == "pypdf" or (pdfplumber is None and pypdf is not None):
        try:
            reader = pypdf.PdfReader(pdf_path)
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:
            print(f"[WARN] pypdf failed on {pdf_path.name}: {exc}", file=sys.stderr)

    return None


def _re_get(pattern: str, text: str, group: int = 1, flags: int = re.IGNORECASE) -> str:
    """Regex extract with fail-soft -- returns _EXTRACTION_FAILED if no match."""
    try:
        m = re.search(pattern, text, flags)
        if m:
            return m.group(group).strip()
    except Exception:
        pass
    return _EXTRACTION_FAILED


def fast_extract(pdf_path: Path, result: dict) -> dict:
    """
    Deterministic regex extraction from PDF text.
    NO synthesis, NO LLM, NO judgment-shaped work.
    Fields that can't be regex-matched are set to [extraction failed].
    """
    text = _extract_pdf_text(pdf_path)

    if text is None:
        return {k: _EXTRACTION_FAILED for k in (
            "parties", "court", "docket", "document_id",
            "filing_date", "decision_date", "panel",
            "disposition", "opening_holding",
        )} | {"citations": [], "_pdf_text_failed": True}

    # --- Parties ---
    # Caption lines: "PARTY A, Appellant, v. PARTY B, Appellee."
    # Try first v. pattern on first few lines
    parties = _EXTRACTION_FAILED
    first_block = text[:2000]
    pm = re.search(r"([A-Z][^\n]{2,60}?)\s*[Vv]\.\s*([A-Z][^\n]{2,60}?)(?:\n|,)", first_block)
    if pm:
        parties = f"{pm.group(1).strip()} v. {pm.group(2).strip()}"

    # --- Court ---
    court = (result.get("court") or "").strip()
    if not court:
        court = _re_get(r"UNITED STATES COURT OF APPEALS.*?FOR THE (.+?)$", text, flags=re.IGNORECASE | re.MULTILINE)

    # --- Docket ---
    docket = _re_get(r"(?:Case|No\.)\s+(\d{2}-\d+)", text)
    if docket == _EXTRACTION_FAILED:
        docket = (result.get("docketNumber") or _EXTRACTION_FAILED).strip()

    # --- Document ID (CourtListener opinion ID) ---
    document_id = str(result.get("id") or _EXTRACTION_FAILED)

    # --- Filing date ---
    filing_date = _re_get(r"(?:Filed|Argued):\s*(\w+\.?\s+\d+,\s*\d{4})", text)
    if filing_date == _EXTRACTION_FAILED:
        filing_date = (result.get("dateFiled") or _EXTRACTION_FAILED).strip()

    # --- Decision date ---
    decision_date = _re_get(r"(?:Decided|Issued|Entered):\s*(\w+\.?\s+\d+,\s*\d{4})", text)

    # --- Panel ---
    panel = _re_get(r"Before\s+(.{10,120}?(?:Circuit\s+Judge|Justice|Chief\s+Judge)s?\.?)", text)

    # --- Disposition (all-caps terminal keyword) ---
    disposition = _re_get(
        r"\b(AFFIRMED(?:\s+AND\s+REMANDED)?|REVERSED(?:\s+AND\s+REMANDED)?|REMANDED"
        r"|VACATED(?:\s+AND\s+REMANDED)?|DISMISSED|AFFIRMED\s+IN\s+PART|REVERSED\s+IN\s+PART)\b",
        text,
    )

    # --- Opening holding (first substantive paragraph after a section heading) ---
    opening_holding = _re_get(
        r"(?:^I\.\s*\n+|^BACKGROUND\s*\n+|^OPINION\s*\n+)(.{50,400}?)(?:\n\n|\Z)",
        text,
        flags=re.IGNORECASE | re.MULTILINE | re.DOTALL,
    )
    if opening_holding == _EXTRACTION_FAILED:
        # Fallback: first sentence >50 chars following a blank line
        opening_holding = _re_get(r"\n\n([A-Z].{50,400}?\.)", text, flags=re.DOTALL)

    # --- Citations (first 6-10 case + statute cites) ---
    # Federal case: NN F.Nd NN / NN U.S. NN / NN S.Ct. NN
    # Statute: NN U.S.C. SS NN
    case_pat = r"\d+\s+(?:U\.S\.|F\.\d[a-z]*|S\.Ct\.|F\.Supp\.(?:\d[a-z]*)?)\s+\d+"
    stat_pat = r"\d+\s+U\.S\.C\.\s+[Ss]\S*\s*\d+"
    seen_c: set[str] = set()
    citations: list[str] = []
    for raw in re.findall(case_pat, text, re.IGNORECASE) + re.findall(stat_pat, text, re.IGNORECASE):
        norm = re.sub(r"\s+", " ", raw.strip())
        if norm not in seen_c:
            seen_c.add(norm)
            citations.append(norm)
        if len(citations) >= 10:
            break

    return {
        "parties": parties,
        "court": court,
        "docket": docket,
        "document_id": document_id,
        "filing_date": filing_date,
        "decision_date": decision_date,
        "panel": panel,
        "disposition": disposition,
        "opening_holding": opening_holding,
        "citations": citations,
        "_pdf_text_failed": False,
    }


# ---------------------------------------------------------------------------
# Summary file
# ---------------------------------------------------------------------------

def _write_summary_file(
    summary_dir: Path,
    new_cases: list[dict],
    run_ts: datetime,
) -> Path:
    summary_dir.mkdir(parents=True, exist_ok=True)
    ts_label = run_ts.strftime("%Y-%m-%d-%H%M")
    out_path = summary_dir / f"{ts_label}.md"

    n = len(new_cases)
    date_str = run_ts.strftime("%Y-%m-%d")
    time_str = run_ts.strftime("%H:%M")
    query_ids = sorted({c["query_id"] for c in new_cases})

    lines = [
        "---",
        f"fetch_date: {date_str}",
        f"fetch_time: {time_str}",
        f"total_new: {n}",
        f"queries: {', '.join(query_ids)}",
        "---",
        "",
        f"# Legal Research Fetch Summary -- {date_str} {time_str}",
        "",
        f"Total new cases this run: {n}",
        "",
    ]

    for case in new_cases:
        ex = case.get("extract", {})
        docket_label = ex.get("docket") or case.get("docket_number") or "UNKNOWN"
        lines += [
            f"## {docket_label}",
            "",
            f"- **Query:** {case.get('query_id', '')}",
            f"- **Court:** {ex.get('court', _EXTRACTION_FAILED)}",
            f"- **Parties:** {ex.get('parties', _EXTRACTION_FAILED)}",
            f"- **Filing date:** {ex.get('filing_date', _EXTRACTION_FAILED)}",
            f"- **Decision date:** {ex.get('decision_date', _EXTRACTION_FAILED)}",
            f"- **Panel:** {ex.get('panel', _EXTRACTION_FAILED)}",
            f"- **Disposition:** {ex.get('disposition', _EXTRACTION_FAILED)}",
            f"- **Opening holding:** {ex.get('opening_holding', _EXTRACTION_FAILED)}",
            f"- **Citations ({len(ex.get('citations', []))}):** {', '.join(ex.get('citations', [])) or _EXTRACTION_FAILED}",
            f"- **PDF:** {case.get('pdf_path', '')}",
            f"- **Source:** {case.get('source_url', '')}",
            "",
        ]

    out_path.write_text("\n".join(lines), encoding="utf-8")
    return out_path


# ---------------------------------------------------------------------------
# Email
# ---------------------------------------------------------------------------

def _build_email_body(
    new_cases: list[dict],
    summary_path: Path,
    run_ts: datetime,
    last_fetch_ts: str | None,
) -> str:
    n = len(new_cases)
    date_str = run_ts.strftime("%Y-%m-%d")
    lines: list[str] = []

    if n == 0:
        info = f"last fetch: {last_fetch_ts}" if last_fetch_ts else "no prior fetch recorded"
        lines += [
            f"No new cases since last fetch ({info}).",
            "",
            f"Summary file: {summary_path}",
        ]
        return "\n".join(lines)

    lines += [
        f"Legal Research Fetch -- {date_str}",
        f"{n} new opinion(s) downloaded across {len({c['query_id'] for c in new_cases})} query/queries.",
        "",
    ]

    # Sort by pdf_size_bytes descending; featured = largest; rest by docket asc
    sorted_by_size = sorted(new_cases, key=lambda c: c.get("pdf_size_bytes", 0), reverse=True)
    featured = sorted_by_size[0]
    rest = sorted(sorted_by_size[1:], key=lambda c: c.get("docket_number") or "")

    def _case_block(case: dict, is_featured: bool = False) -> list[str]:
        ex = case.get("extract", {})
        docket = ex.get("docket") or case.get("docket_number") or "UNKNOWN"
        block: list[str] = []
        if is_featured:
            block.append("> Featured (largest PDF):")
        block += [
            f"Case:      {docket}",
            f"  Court:     {ex.get('court', _EXTRACTION_FAILED)}",
            f"  Parties:   {ex.get('parties', _EXTRACTION_FAILED)}",
            f"  Filed:     {ex.get('filing_date', _EXTRACTION_FAILED)}",
            f"  Decided:   {ex.get('decision_date', _EXTRACTION_FAILED)}",
            f"  Panel:     {ex.get('panel', _EXTRACTION_FAILED)}",
            f"  Disp.:     {ex.get('disposition', _EXTRACTION_FAILED)}",
            f"  Holding:   {ex.get('opening_holding', _EXTRACTION_FAILED)}",
            f"  Citations: {', '.join(ex.get('citations', [])) or _EXTRACTION_FAILED}",
            f"  PDF:       {case.get('pdf_path', '')}",
            f"  Source:    {case.get('source_url', '')}",
        ]
        return block

    lines += _case_block(featured, is_featured=True)
    for case in rest:
        lines.append("")
        lines += _case_block(case)

    docket_list = ",".join(
        (c.get("extract", {}).get("docket") or c.get("docket_number") or "UNKNOWN")
        for c in sorted_by_size
    )
    lines += [
        "",
        "---",
        f"Summary file: {summary_path}",
        "",
        f'To synthesize selected cases, trigger: LR Chain [{docket_list}]',
        "(Skill 4 LR-CHAIN -- Mr.C synthesizes in active session, no automation)",
    ]
    return "\n".join(lines)


def _send_email(
    gmail_password: str,
    subject: str,
    body: str,
    attachment_path: Path | None,
    dry_run: bool,
) -> bool:
    if dry_run:
        print(f"[DRY-RUN] Would send email: {subject}", file=sys.stderr)
        return True

    try:
        msg = MIMEMultipart()
        msg["From"] = JR_EMAIL
        msg["To"] = JR_EMAIL
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain", "utf-8"))

        if attachment_path and attachment_path.exists():
            with open(attachment_path, "rb") as f:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(f.read())
                encoders.encode_base64(part)
                part.add_header("Content-Disposition", f'attachment; filename="{attachment_path.name}"')
                msg.attach(part)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(JR_EMAIL, gmail_password)
            server.sendmail(JR_EMAIL, JR_EMAIL, msg.as_string())
        return True
    except Exception as exc:
        print(f"[ERROR] SMTP send failed: {exc}", file=sys.stderr)
        return False


# ---------------------------------------------------------------------------
# Main fetch loop
# ---------------------------------------------------------------------------

def run_fetch_queries(
    cl_token: str,
    gmail_password: str | None,
    queries: list[dict],
    defaults: dict,
    log_file: Path,
    pdf_dir: Path,
    summary_dir: Path,
    rate_seconds: float,
    dry_run: bool,
    no_email: bool,
) -> None:
    run_ts = datetime.now()
    today_iso = date.today().isoformat()

    pdf_dir.mkdir(parents=True, exist_ok=True)
    summary_dir.mkdir(parents=True, exist_ok=True)

    if not dry_run:
        _ensure_log_header(log_file)

    seen_pairs = _load_seen_pairs(log_file) if not dry_run else set()

    headers = {
        "Authorization": f"Token {cl_token}",
        "User-Agent": "CentralHub-CLegal/1.0 (educational; the.riveraj@gmail.com)",
    }

    new_cases: list[dict] = []
    query_summaries: list[str] = []

    with httpx.Client(timeout=60.0) as client:
        for q in queries:
            qid = q.get("id") or ""
            court = q.get("court") or ""
            desc = q.get("description") or qid
            print(f"[QUERY] {qid} ({desc})", file=sys.stderr)

            filed_after = _compute_filed_after(log_file, qid)
            print(f"[QUERY] filed_after={filed_after}", file=sys.stderr)

            params = {
                "type": defaults.get("type", "o"),
                "court": court,
                "stat_Published": defaults.get("stat_Published", "on"),
                "order_by": defaults.get("order_by", "dateFiled desc"),
                "filed_after": filed_after,
                "format": "json",
            }
            q_text = (defaults.get("q") or q.get("q") or "").strip()
            if q_text:
                params["q"] = q_text

            data = _get_json(client, _SEARCH_URL, headers, params)
            if data is None:
                print(f"[ERROR] Query {qid}: search request failed -- skipping query.", file=sys.stderr)
                query_summaries.append(f"{qid}: search failed (skipped)")
                continue

            if data.get("detail"):
                print(f"[ERROR] Query {qid}: API error response: {data['detail']} -- skipping.", file=sys.stderr)
                query_summaries.append(f"{qid}: API error (skipped)")
                continue

            results = data.get("results", [])
            print(f"[QUERY] {qid}: {len(results)} results returned.", file=sys.stderr)

            q_new = 0
            q_skipped = 0
            log_rows: list[dict] = []

            for result in results:
                # SEARCH API: case identity = cluster_id (stable per opinion-cluster).
                # Top-level "id" doesn't exist in SEARCH; was present in OPINIONS API.
                op_id = str(result.get("cluster_id") or "")
                docket = (result.get("docketNumber") or "").strip()

                if not op_id or not docket:
                    print(f"[WARN] {qid}: result missing id or docketNumber -- skipping.", file=sys.stderr)
                    q_skipped += 1
                    continue

                pair = (docket, op_id)
                if pair in seen_pairs:
                    q_skipped += 1
                    continue

                abs_url = (result.get("absolute_url") or "").strip()
                source_url = (abs_url if abs_url.startswith("http") else _COURTLISTENER_BASE + abs_url) if abs_url else ""

                if dry_run:
                    print(f"[DRY-RUN] Would download: {docket} / opinion {op_id} / {source_url}", file=sys.stderr)
                    q_new += 1
                    continue

                pdf_path = _download_pdf(client, result, pdf_dir, headers)
                if pdf_path is None:
                    q_skipped += 1
                    continue

                pdf_size = pdf_path.stat().st_size if pdf_path.exists() else 0
                ex = fast_extract(pdf_path, result)

                log_rows.append({
                    "query_id": qid,
                    "docket_number": docket,
                    "document_id": op_id,
                    "fetched_on": today_iso,
                    "pdf_filename": pdf_path.name,
                    "source_url": source_url,
                })

                new_cases.append({
                    "query_id": qid,
                    "docket_number": docket,
                    "pdf_path": str(pdf_path),
                    "pdf_size_bytes": pdf_size,
                    "source_url": source_url,
                    "extract": ex,
                })
                seen_pairs.add(pair)
                q_new += 1

                time.sleep(rate_seconds)

            if not dry_run and log_rows:
                _append_log_rows(log_file, log_rows)

            query_summaries.append(f"{qid}: {q_new} new, {q_skipped} skipped")
            print(f"[QUERY] {qid}: {q_new} new, {q_skipped} skipped.", file=sys.stderr)
            time.sleep(rate_seconds)

    # --- Summary file ---
    summary_path: Path | None = None
    if not dry_run:
        summary_path = _write_summary_file(summary_dir, new_cases, run_ts)
        print(f"[SUMMARY] {summary_path}", file=sys.stderr)
    else:
        summary_path = summary_dir / f"{run_ts.strftime('%Y-%m-%d-%H%M')}-dry-run.md"
        print(f"[DRY-RUN] Summary would be written to {summary_path}", file=sys.stderr)

    # --- Email ---
    email_status = "skipped (dry-run or --no-email)"
    if not no_email and not dry_run:
        if gmail_password is None:
            print("[WARN] Gmail app password not loaded -- email skipped.", file=sys.stderr)
            email_status = "skipped (no password)"
        else:
            n = len(new_cases)
            date_str = run_ts.strftime("%Y-%m-%d")
            subject = f"[LR FETCH] {n} new cases -- {date_str}"
            # em dash in subject via char code to avoid non-ASCII literal
            subject = subject.replace(" -- ", " " + chr(0x2014) + " ")

            # Determine last fetch timestamp across all queries
            last_ts: str | None = None
            for q in queries:
                mx = _max_fetched_on(log_file, q.get("id") or "")
                if mx:
                    s = mx.isoformat()
                    if last_ts is None or s > last_ts:
                        last_ts = s

            body = _build_email_body(new_cases, summary_path, run_ts, last_ts)

            # Attachment: largest PDF from new cases (if any)
            attachment: Path | None = None
            if new_cases:
                biggest = max(new_cases, key=lambda c: c.get("pdf_size_bytes", 0))
                ap = Path(biggest["pdf_path"])
                if ap.exists():
                    attachment = ap

            sent = _send_email(gmail_password, subject, body, attachment, dry_run=False)
            email_status = "sent" if sent else "FAILED (see stderr)"

    # --- Final stdout summary ---
    print("\n=== FETCH-LEGAL SUMMARY ===", file=sys.stderr)
    for s in query_summaries:
        print(f"  {s}", file=sys.stderr)
    print(f"  Summary file: {summary_path}", file=sys.stderr)
    print(f"  Email: {email_status}", file=sys.stderr)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="C-Legal auto-fetch: CourtListener SEARCH API -> PDF download -> fast-extract -> summary + email.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--queries-file",
        default=None,
        help="Path to queries.toml (default: pipeline/legal/queries.toml)",
    )
    parser.add_argument(
        "--log-file",
        default=None,
        help="Path to _fetch_log.csv (default: <vault-root>/ResearchForced/LegalOpinions/PDFS/_fetch_log.csv)",
    )
    parser.add_argument(
        "--pdf-dir",
        default=None,
        help="Directory for downloaded PDFs (default: <vault-root>/ResearchForced/LegalOpinions/PDFS)",
    )
    parser.add_argument(
        "--summary-dir",
        default=None,
        help="Directory for per-fetch summary .md files (default: <CH-root>/research/data/legal/_fetch_summaries)",
    )
    parser.add_argument(
        "--rate-seconds",
        type=float,
        default=1.0,
        help="Seconds between requests",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview fetches without downloading, writing log, or sending email",
    )
    parser.add_argument(
        "--no-email",
        action="store_true",
        help="Skip SMTP email step (summary file is still written)",
    )
    args = parser.parse_args()

    # Resolve paths
    _this_dir = Path(__file__).resolve().parent
    queries_file = Path(args.queries_file).resolve() if args.queries_file else (_this_dir / "queries.toml")
    pdf_dir = Path(args.pdf_dir).resolve() if args.pdf_dir else (_VAULT_ROOT / "ResearchForced" / "LegalOpinions" / "PDFS")
    log_file = Path(args.log_file).resolve() if args.log_file else (pdf_dir / "_fetch_log.csv")
    summary_dir = Path(args.summary_dir).resolve() if args.summary_dir else (_CH_ROOT / "research" / "data" / "legal" / "_fetch_summaries")

    print(f"[CONFIG] queries_file  = {queries_file}", file=sys.stderr)
    print(f"[CONFIG] log_file      = {log_file}", file=sys.stderr)
    print(f"[CONFIG] pdf_dir       = {pdf_dir}", file=sys.stderr)
    print(f"[CONFIG] summary_dir   = {summary_dir}", file=sys.stderr)
    print(f"[CONFIG] rate_seconds  = {args.rate_seconds}", file=sys.stderr)
    print(f"[CONFIG] dry_run       = {args.dry_run}", file=sys.stderr)
    print(f"[CONFIG] no_email      = {args.no_email}", file=sys.stderr)
    print(f"[CONFIG] pdf_backend   = {_PDF_BACKEND or 'NONE (install pdfplumber or pypdf)'}", file=sys.stderr)

    # Load TOML (whole-run failure if absent or broken)
    try:
        queries, defaults = _load_queries(queries_file)
    except Exception as exc:
        print(f"[FATAL] Could not load queries.toml: {exc}", file=sys.stderr)
        sys.exit(1)

    # Load CourtListener token
    secrets_path = _VAULT_ROOT / "secrets" / "keys.txt"
    try:
        cl_token = load_courtlistener_token(secrets_path)
    except Exception as exc:
        print(f"[FATAL] CourtListener token load failed: {exc}", file=sys.stderr)
        sys.exit(1)

    # Load Gmail password (fail-soft: only needed for email; skip if --no-email or --dry-run)
    gmail_password: str | None = None
    if not args.no_email and not args.dry_run:
        try:
            gmail_password = load_gmail_app_password(secrets_path)
        except Exception as exc:
            print(f"[WARN] Gmail password load failed: {exc} -- email will be skipped.", file=sys.stderr)

    run_fetch_queries(
        cl_token=cl_token,
        gmail_password=gmail_password,
        queries=queries,
        defaults=defaults,
        log_file=log_file,
        pdf_dir=pdf_dir,
        summary_dir=summary_dir,
        rate_seconds=args.rate_seconds,
        dry_run=args.dry_run,
        no_email=args.no_email,
    )


if __name__ == "__main__":
    main()
