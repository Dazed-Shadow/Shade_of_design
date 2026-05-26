"""Normalize a Claude Design bundle so it can be merged into shade-of-design-landing.

Claude Design ships bundles with long-form filenames like
`Shade of Design — Landing.html`. The live repo uses short, host-friendly
names (`index.html`, `brand-system.html`, `weekly.html`). This script renames
the bundle's HTML files and rewrites every internal reference to match,
producing a merge-ready copy without touching the original bundle.

Run:
    python scripts/port-design-bundle.py <bundle-dir>
    python scripts/port-design-bundle.py <bundle-dir> --out <dest>
    python scripts/port-design-bundle.py <bundle-dir> --in-place
    python scripts/port-design-bundle.py <bundle-dir> --dry-run

Defaults to writing a sibling directory named `<bundle-dir>-normalized`.
"""

from __future__ import annotations

import argparse
import re
import shutil
import sys
from pathlib import Path
from urllib.parse import quote

# Long-form name (em-dash) -> short name. Both em-dash (U+2014) and the
# regular hyphen variant the repo currently uses on disk are handled.
RENAMES = {
    "Shade of Design — Landing.html":      "index.html",
    "Shade of Design — Brand System.html": "brand-system.html",
    "Shade of Design — Weekly.html":       "weekly.html",
    "Shade of Design - Landing.html":           "index.html",
    "Shade of Design - Brand System.html":      "brand-system.html",
    "Shade of Design - Weekly.html":            "weekly.html",
}

# File extensions to scan for internal references.
TEXT_EXTS = {".html", ".jsx", ".js", ".css", ".md", ".json"}


def build_replacements() -> list[tuple[str, str]]:
    """All literal substrings to replace, longest first to avoid partial overlaps."""
    pairs: list[tuple[str, str]] = []
    for old, new in RENAMES.items():
        pairs.append((old, new))
        # URL-encoded form (what shows up in _redirects and some hrefs).
        pairs.append((quote(old), new))
    # Sort by length desc so longer literals match before any shorter prefix could.
    pairs.sort(key=lambda p: -len(p[0]))
    # Drop exact duplicates while preserving order.
    seen: set[tuple[str, str]] = set()
    unique: list[tuple[str, str]] = []
    for p in pairs:
        if p not in seen:
            seen.add(p)
            unique.append(p)
    return unique


REPLACEMENTS = build_replacements()


def rewrite_text(content: str) -> tuple[str, int]:
    """Apply all known renames to text content. Returns (new_content, hit_count)."""
    hits = 0
    for old, new in REPLACEMENTS:
        if old in content:
            hits += content.count(old)
            content = content.replace(old, new)
    return content, hits


def resolve_target_name(name: str) -> str:
    """Return the renamed filename if the input matches a known long-form name."""
    return RENAMES.get(name, name)


def copy_bundle(src: Path, dst: Path) -> None:
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)


def normalize(src: Path, dst: Path, dry_run: bool) -> None:
    if dry_run:
        print(f"[dry-run] would copy {src} -> {dst}")
    else:
        copy_bundle(src, dst)
        print(f"copied {src.name} -> {dst.name}")

    # Walk the destination, rewriting text and renaming files.
    renamed: list[tuple[str, str]] = []
    rewritten: list[tuple[str, int]] = []

    for path in sorted(dst.rglob("*")) if not dry_run else sorted(src.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(dst if not dry_run else src)

        # Rewrite text content for known extensions.
        if path.suffix.lower() in TEXT_EXTS:
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            new_text, hits = rewrite_text(text)
            if hits:
                rewritten.append((str(rel), hits))
                if not dry_run:
                    path.write_text(new_text, encoding="utf-8")

        # Rename the file itself if it's one of the known long-form names.
        new_name = resolve_target_name(path.name)
        if new_name != path.name:
            new_path = path.with_name(new_name)
            renamed.append((path.name, new_name))
            if not dry_run:
                path.rename(new_path)

    # Report.
    print()
    if renamed:
        print("Renamed files:")
        for old, new in renamed:
            print(f"  {old}  ->  {new}")
    else:
        print("No files to rename.")

    print()
    if rewritten:
        print("Rewrote references in:")
        for rel, hits in rewritten:
            print(f"  {rel}  ({hits} occurrence{'s' if hits != 1 else ''})")
    else:
        print("No references rewritten.")

    print()
    if dry_run:
        print("Dry run only. Re-run without --dry-run to apply.")
    else:
        print(f"Done. Normalized bundle at: {dst}")


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("bundle", type=Path, help="Path to the Claude Design bundle folder")
    parser.add_argument("--out", type=Path, default=None,
                        help="Destination dir (default: <bundle>-normalized as sibling)")
    parser.add_argument("--in-place", action="store_true",
                        help="Mutate the bundle in place instead of copying")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would change without writing")
    args = parser.parse_args(argv)

    src: Path = args.bundle.resolve()
    if not src.is_dir():
        print(f"error: {src} is not a directory", file=sys.stderr)
        return 2

    if args.in_place and args.out:
        print("error: --in-place and --out are mutually exclusive", file=sys.stderr)
        return 2

    if args.in_place:
        dst = src
    elif args.out:
        dst = args.out.resolve()
    else:
        dst = src.with_name(src.name + "-normalized")

    if dst == src and not args.in_place:
        print("error: destination equals source; pass --in-place if intentional", file=sys.stderr)
        return 2

    if args.in_place and args.dry_run:
        # Dry-run in-place reads from src and shows hits without mutating.
        pass

    normalize(src, dst if not args.in_place else src, args.dry_run)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
