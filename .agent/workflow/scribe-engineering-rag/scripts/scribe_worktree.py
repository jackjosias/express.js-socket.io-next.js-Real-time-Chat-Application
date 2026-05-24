#!/usr/bin/env python3
from __future__ import annotations

import argparse
import subprocess
from dataclasses import dataclass
from pathlib import Path


GENERATED_PREFIXES = (
    ".next/",
    "dist/",
    "build/",
    "coverage/",
    "graphify-out/",
    ".agent/workflow/scribe-engineering-rag/graphify-out/",
    "scribe-out/",
    "node_modules/",
    "jjk-messenger/backend/dist/",
    "jjk-messenger/backend/node_modules/",
    "jjk-messenger/frontend/.next/",
    "jjk-messenger/frontend/node_modules/",
)
GENERATED_SUFFIXES = (".pyc", ".pyo", ".tsbuildinfo")
SOURCE_HINT_SUFFIXES = (".py", ".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".yml", ".yaml", ".toml", ".prisma")


@dataclass(frozen=True)
class StatusItem:
    code: str
    path: str

    @property
    def tracked(self) -> bool:
        return self.code != "??"


def git_status() -> list[StatusItem]:
    result = subprocess.run(["git", "status", "--short", "--untracked-files=all"], check=False, text=True, stdout=subprocess.PIPE)
    if result.returncode != 0:
        raise RuntimeError("git status failed")
    return [parse_status_line(line) for line in result.stdout.splitlines() if line.strip()]


def parse_status_line(line: str) -> StatusItem:
    code = line[:2]
    path = line[3:]
    if " -> " in path:
        path = path.split(" -> ", 1)[1]
    return StatusItem(code=code, path=path)


def is_generated(path: str) -> bool:
    normalized = path.lstrip("/")
    return normalized.endswith(GENERATED_SUFFIXES) or any(normalized.startswith(prefix) for prefix in GENERATED_PREFIXES)


def is_source_candidate(path: str) -> bool:
    return Path(path).suffix in SOURCE_HINT_SUFFIXES or "/" not in path


def classify(items: list[StatusItem]) -> tuple[list[StatusItem], list[StatusItem], list[StatusItem], list[StatusItem]]:
    tracked = [item for item in items if item.tracked]
    generated = [item for item in items if not item.tracked and is_generated(item.path)]
    untracked_source = [
        item for item in items if not item.tracked and not is_generated(item.path) and is_source_candidate(item.path)
    ]
    other = [
        item for item in items if not item.tracked and not is_generated(item.path) and not is_source_candidate(item.path)
    ]
    return tracked, untracked_source, generated, other


def print_group(title: str, items: list[StatusItem], limit: int) -> None:
    print(f"{title}: {len(items)}")
    for item in items[:limit]:
        print(f"  {item.code} {item.path}")
    if len(items) > limit:
        print(f"  ... {len(items) - limit} more")


def main() -> int:
    parser = argparse.ArgumentParser(prog="scribe worktree", description="Classify Git worktree changes for agents.")
    parser.add_argument("--strict", action="store_true", help="Fail when tracked or untracked source changes exist.")
    parser.add_argument("--limit", type=int, default=40, help="Maximum rows per group.")
    args = parser.parse_args()

    items = git_status()
    tracked, untracked_source, generated, other = classify(items)

    print("SCRIBE WORKTREE")
    print_group("  tracked_changes", tracked, args.limit)
    print_group("  untracked_source_candidates", untracked_source, args.limit)
    print_group("  generated_noise", generated, args.limit)
    print_group("  other_untracked", other, args.limit)

    if args.strict and (tracked or untracked_source):
        print("  verdict: DIRTY")
        return 1
    print("  verdict: REVIEW" if tracked or untracked_source else "  verdict: CLEAN")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
