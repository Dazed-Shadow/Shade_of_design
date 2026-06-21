"""
C-Legal (fetch) -- CourtListener API client.
Fetches opinions by court filter, writes raw JSON responses to local cache.
One file per opinion: research/data/legal/cache/<case_id>.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path

import httpx

_OPINIONS_URL = "https://www.courtlistener.com/api/rest/v4/opinions/"

# parents[4] = vault root from pipeline/legal/legal_fetch.py
# (parents[0]=legal, [1]=pipeline, [2]=Central Hub, [3]=Terminal, [4]=Chief of Staff Diary)
# NOTE: DD-021 pre-decision wrote parents[2] -- that lands at CH root, not vault root.
# Corrected to parents[4] so the path resolves to the actual secrets/keys.txt location.
_VAULT_ROOT = Path(__file__).resolve().parents[4]


def load_courtlistener_token(secrets_path: Path) -> str:
    content = secrets_path.read_text(encoding="utf-8")
    # ASCII-only regex per cycle-3 DD-005 encoding calibration
    match = re.search(r"###\s+Court\s+Listener\s*\n>\s*(\S+)", content)
    if not match:
        raise RuntimeError(f"CourtListener token not found in {secrets_path}")
    return match.group(1).strip()


def _request_page(
    client: httpx.Client,
    headers: dict,
    params: dict,
) -> dict | None:
    """Fetch one page with one retry on error. Returns parsed JSON or None to skip."""
    try:
        resp = client.get(_OPINIONS_URL, headers=headers, params=params)
        if resp.status_code == 429:
            print("[WARN] 429 rate limit -- sleeping 60s before retry.", file=sys.stderr)
            time.sleep(60.0)
            resp = client.get(_OPINIONS_URL, headers=headers, params=params)
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        print(f"[ERROR] Page request failed: {exc} -- sleeping 5s, retrying once.", file=sys.stderr)
        time.sleep(5.0)
        try:
            resp = client.get(_OPINIONS_URL, headers=headers, params=params)
            resp.raise_for_status()
            return resp.json()
        except Exception as exc2:
            print(f"[ERROR] Retry failed: {exc2} -- skipping page.", file=sys.stderr)
            return None


def run_fetch(
    token: str,
    courts: list[str],
    limit: int,
    rate_seconds: float,
    cache_dir: Path,
) -> tuple[int, int]:
    """Paginate CourtListener opinions, write raw JSON to cache_dir. Returns (fetched, skipped)."""
    headers = {
        "Authorization": f"Token {token}",
        # Identify this client per CourtListener crawling etiquette
        "User-Agent": "CentralHub-CLegal/1.0 (educational; the.riveraj@gmail.com)",
    }
    fetched = 0
    skipped = 0
    page = 1
    # Safety ceiling: opinions endpoint returns ~20/page, 200 pages = 4000 opinions max
    _PAGE_CEILING = 200

    with httpx.Client(timeout=30.0) as client:
        while fetched < limit and page <= _PAGE_CEILING:
            # Filter by court using CourtListener ORM-style query parameter.
            # Slug values: scotus (Supreme Court), cadc (D.C. Circuit).
            # Verify parameter name against https://www.courtlistener.com/api/rest/v4/opinions/
            # if the first smoke run returns unfiltered results.
            params = {
                "cluster__docket__court__pk__in": ",".join(courts),
                "format": "json",
                "page": page,
            }

            data = _request_page(client, headers, params)
            if data is None:
                skipped += 1
                page += 1
                continue

            results = data.get("results", [])
            if not results:
                break

            for opinion in results:
                if fetched >= limit:
                    break
                case_id = opinion.get("id")
                if case_id is None:
                    print("[WARN] Opinion missing id field -- skipping.", file=sys.stderr)
                    skipped += 1
                    continue

                out_path = cache_dir / f"{case_id}.json"
                raw = json.dumps(opinion, ensure_ascii=True, indent=2)
                try:
                    out_path.write_text(raw, encoding="utf-8")
                    fetched += 1
                except Exception as exc:
                    print(
                        f"[ERROR] Write failed for {case_id}: {exc} -- sleeping 5s, retrying.",
                        file=sys.stderr,
                    )
                    time.sleep(5.0)
                    try:
                        out_path.write_text(raw, encoding="utf-8")
                        fetched += 1
                    except Exception as exc2:
                        print(
                            f"[ERROR] Retry write failed for {case_id}: {exc2} -- skipping.",
                            file=sys.stderr,
                        )
                        skipped += 1
                        continue

                time.sleep(rate_seconds)

            if not data.get("next"):
                break
            page += 1

    return fetched, skipped


def main() -> None:
    parser = argparse.ArgumentParser(
        description="C-Legal: fetch CourtListener opinions to local cache.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--courts",
        default="scotus,cadc",
        help="Comma-separated CourtListener court slugs",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=50,
        help="Max opinions to write to cache",
    )
    parser.add_argument(
        "--rate-seconds",
        type=float,
        default=1.0,
        help="Seconds between successful case writes",
    )
    parser.add_argument(
        "--cache-dir",
        default=None,
        help="Override cache directory (default: <CH root>/research/data/legal/cache)",
    )
    args = parser.parse_args()

    courts = [c.strip() for c in args.courts.split(",") if c.strip()]
    if not courts:
        print("[FATAL] --courts produced an empty list.", file=sys.stderr)
        sys.exit(1)

    # CH root is parents[2]; cache default follows research/data/<type>/ convention
    ch_root = Path(__file__).resolve().parents[2]
    cache_dir = Path(args.cache_dir).resolve() if args.cache_dir else ch_root / "research" / "data" / "legal" / "cache"
    cache_dir.mkdir(parents=True, exist_ok=True)

    secrets_path = _VAULT_ROOT / "secrets" / "keys.txt"

    print(f"[CONFIG] courts        = {','.join(courts)}", file=sys.stderr)
    print(f"[CONFIG] limit         = {args.limit}", file=sys.stderr)
    print(f"[CONFIG] rate_seconds  = {args.rate_seconds}", file=sys.stderr)
    print(f"[CONFIG] cache_dir     = {cache_dir}", file=sys.stderr)
    print(f"[CONFIG] secrets       = {secrets_path}", file=sys.stderr)

    try:
        token = load_courtlistener_token(secrets_path)
    except Exception as exc:
        print(f"[FATAL] Token load failed: {exc}", file=sys.stderr)
        sys.exit(1)

    fetched, skipped = run_fetch(
        token=token,
        courts=courts,
        limit=args.limit,
        rate_seconds=args.rate_seconds,
        cache_dir=cache_dir,
    )

    print(
        f"Fetched: {fetched} / Skipped: {skipped} / Cache dir: {cache_dir}",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
