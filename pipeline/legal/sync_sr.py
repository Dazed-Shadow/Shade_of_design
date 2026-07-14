"""
SYNC SR -- DD-037 Phase 5 (cadence + vault-native variant).

ONE wrapper, ONE exporter, TWO invocations. Both the on-demand "SYNC SR"
trigger and the daily scheduled task (see sync_sr_task.md) run exactly:

    python pipeline/legal/sync_sr.py

No second export code path, no flags that fork behavior -- this script
calls export_manifests.run_export() and nothing else. It reports whether
the run actually changed any output byte (idempotency signal for a
no-change day) and appends one line to sync_sr.log.

NO GIT OPERATIONS, EVER. This script regenerates manifests + the
vault-native index in the working tree and stops. Publish stays a human
act: JR's commit + merge to main is what deploys (DD-037 standing rule,
the human-review gate).

CLI:
  python pipeline/legal/sync_sr.py
"""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

from export_manifests import (
    ManifestValidationError,
    _DEFAULT_CORPUS_DIR,
    _DEFAULT_OUT_DIR,
    _SR_INDEX_FILENAME,
    run_export,
)

_LOG_PATH = Path(__file__).resolve().parent / "sync_sr.log"


def _tracked_files(corpus_dir: Path, out_dir: Path) -> list[Path]:
    """Every byte-emitting artifact a run_export() call can touch -- the six
    site manifests plus the vault-native index -- snapshotted before and
    after so one compare pass answers "did this run change anything."
    """
    return [
        out_dir / "cases.json",
        out_dir / "cases.js",
        out_dir / "field-clerks.json",
        out_dir / "field-clerks.js",
        out_dir / "warchest.json",
        out_dir / "warchest.js",
        corpus_dir / _SR_INDEX_FILENAME,
    ]


def _snapshot(paths: list[Path]) -> dict:
    return {p: (p.read_bytes() if p.exists() else None) for p in paths}


def _append_log(line: str) -> None:
    with _LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def main() -> None:
    corpus_dir = _DEFAULT_CORPUS_DIR
    out_dir = _DEFAULT_OUT_DIR
    tracked = _tracked_files(corpus_dir, out_dir)
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    before = _snapshot(tracked)

    try:
        counts = run_export(corpus_dir, out_dir)
    except ManifestValidationError as exc:
        line = f"[SYNC SR] {ts} FAILED -- {exc}"
        print(line, file=sys.stderr)
        _append_log(line)
        sys.exit(1)

    after = _snapshot(tracked)
    changed = any(before[p] != after[p] for p in tracked)

    line = (
        f"[SYNC SR] {ts} OK "
        f"cases={counts['cases']} field_clerks={counts['field_clerks']} "
        f"warchest={counts['warchest']} index_entries={counts['index_entries']} "
        f"changed={'yes' if changed else 'no'}"
    )
    print(line)
    _append_log(line)


if __name__ == "__main__":
    main()
