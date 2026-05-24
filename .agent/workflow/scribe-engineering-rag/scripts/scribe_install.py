#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import shutil
import stat
import sys
from pathlib import Path

from scribe_install_templates import (
    AGENTS_END,
    AGENTS_START,
    GRAPHIFY_END,
    GRAPHIFY_START,
    render_agents_block,
    render_graphify_block,
    render_module_shim,
    render_scribe_adapter,
    render_scripts_init,
    render_shim_helper,
)


BUNDLE_RELATIVE_PATH = Path(".agent") / "workflow" / "scribe-engineering-rag"
SKIPPED_DIRS = {"__pycache__", ".pytest_cache", ".mypy_cache", "graphify-out"}
SKIPPED_SUFFIXES = {".pyc", ".pyo"}

SHIM_MODULES = (
    "scribe_bundle_graph",
    "scribe_doctor",
    "scribe_guard",
    "scribe_install",
    "scribe_install_templates",
    "scribe_memory",
    "scribe_memory_admin",
    "scribe_memory_archive",
    "scribe_memory_dashboard",
    "scribe_worktree",
    "scribe_search",
    "scribe_store",
    "scribe_doctor_checks",
    "scribe_doctor_lib",
    "scribe_doctor_model",
    "scribe_doctor_report",
    "scribe_dashboard_assets",
    "scribe_dashboard_view",
)
CLI_SHIM_MODULES = {"scribe_bundle_graph", "scribe_doctor", "scribe_guard", "scribe_install", "scribe_memory", "scribe_worktree"}
MEMORY_COMMANDS = {"hot", "stats", "explain", "related", "query", "challenge", "compact", "promote", "export", "archive", "dashboard"}


def should_skip(path: Path) -> bool:
    return any(part in SKIPPED_DIRS for part in path.parts) or path.suffix in SKIPPED_SUFFIXES


def same_content(path: Path, content: bytes) -> bool:
    return path.exists() and path.is_file() and path.read_bytes() == content


def relative_to(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def replace_managed_block(existing: str, start: str, end: str, block: str) -> str:
    start_index = existing.find(start)
    end_index = existing.find(end)
    if start_index != -1 and end_index != -1 and end_index > start_index:
        end_index += len(end)
        parts = []
        prefix = existing[:start_index].rstrip()
        suffix = existing[end_index:].lstrip()
        if prefix:
            parts.append(prefix)
        parts.append(block.rstrip())
        if suffix:
            parts.append(suffix)
        return "\n\n".join(parts) + "\n"
    if existing.strip():
        return existing.rstrip() + "\n\n" + block
    return block


class Installer:
    def __init__(self, source_bundle: Path, target_root: Path, force: bool, dry_run: bool) -> None:
        self.source_bundle = source_bundle.resolve()
        self.target_root = target_root.resolve()
        self.force = force
        self.dry_run = dry_run
        self.conflicts: list[str] = []
        self.actions: list[str] = []

    @property
    def target_bundle(self) -> Path:
        return self.target_root / BUNDLE_RELATIVE_PATH

    def plan(self) -> None:
        if not self.source_bundle.exists():
            self.conflicts.append(f"Source bundle missing: {self.source_bundle}")
            return
        if self.target_root.exists() and not self.target_root.is_dir():
            self.conflicts.append(f"Target is not a directory: {self.target_root}")
            return

        for source in sorted(self.source_bundle.rglob("*")):
            if source.is_dir() or should_skip(source.relative_to(self.source_bundle)):
                continue
            relative = source.relative_to(self.source_bundle)
            destination = self.target_bundle / relative
            self.plan_copy(source, destination)

        self.plan_write(self.target_root / "scribe", render_scribe_adapter().encode("utf-8"), executable=True)
        self.plan_write(self.target_root / "scripts" / "_bundle_shim.py", render_shim_helper().encode("utf-8"))
        self.plan_write(self.target_root / "scripts" / "__init__.py", render_scripts_init().encode("utf-8"))
        for module_name in SHIM_MODULES:
            self.plan_write(
                self.target_root / "scripts" / f"{module_name}.py",
                render_module_shim(module_name, CLI_SHIM_MODULES).encode("utf-8"),
                executable=module_name in CLI_SHIM_MODULES,
            )
        self.plan_managed_text(self.target_root / "AGENTS.md", AGENTS_START, AGENTS_END, render_agents_block())
        self.plan_managed_text(self.target_root / ".graphifyignore", GRAPHIFY_START, GRAPHIFY_END, render_graphify_block())

    def plan_copy(self, source: Path, destination: Path) -> None:
        if source.resolve() == destination.resolve():
            return
        content = source.read_bytes()
        self.plan_write(destination, content, executable=os.access(source, os.X_OK), label=f"copy {source.name}")

    def plan_write(self, destination: Path, content: bytes, executable: bool = False, label: str = "write") -> None:
        if destination.exists() and destination.is_dir():
            self.conflicts.append(f"Cannot write file over directory: {destination}")
            return
        if same_content(destination, content):
            if executable and not os.access(destination, os.X_OK):
                self.actions.append(f"chmod +x {relative_to(destination, self.target_root)}")
                if not self.dry_run:
                    mode = destination.stat().st_mode
                    destination.chmod(mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
                return
            self.actions.append(f"unchanged {relative_to(destination, self.target_root)}")
            return
        if destination.exists() and not self.force:
            self.conflicts.append(f"Refusing to overwrite existing file without --force: {destination}")
            return
        self.actions.append(f"{label} {relative_to(destination, self.target_root)}")
        if self.dry_run:
            return
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(content)
        if executable:
            mode = destination.stat().st_mode
            destination.chmod(mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)

    def plan_managed_text(self, destination: Path, start: str, end: str, block: str) -> None:
        if destination.exists() and destination.is_dir():
            self.conflicts.append(f"Cannot update text file over directory: {destination}")
            return
        existing = destination.read_text(encoding="utf-8") if destination.exists() else ""
        updated = replace_managed_block(existing, start, end, block).encode("utf-8")
        if same_content(destination, updated):
            self.actions.append(f"unchanged {relative_to(destination, self.target_root)}")
            return
        self.actions.append(f"update {relative_to(destination, self.target_root)}")
        if self.dry_run:
            return
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(updated)

    def run(self) -> int:
        self.plan()
        if self.conflicts:
            print("scribe install: conflicts detected", file=sys.stderr)
            for conflict in self.conflicts:
                print(f"  - {conflict}", file=sys.stderr)
            print("Re-run with --force to overwrite generated files.", file=sys.stderr)
            return 2

        for action in self.actions:
            print(f"  {action}")
        if self.dry_run:
            print("scribe install: dry run complete")
        else:
            print(f"scribe install: installed bundle into {self.target_root}")
        return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="scribe install",
        description="Install the reusable SCRIBE/TENOR engineering bundle into a project.",
    )
    parser.add_argument(
        "target_path",
        nargs="?",
        default=".",
        help="Project root to install into. Defaults to current directory.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite generated files when they differ.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show planned changes without writing files.",
    )
    args = parser.parse_args()

    source_bundle = Path(__file__).resolve().parents[1]
    target_root = Path(args.target_path)
    installer = Installer(source_bundle, target_root, force=args.force, dry_run=args.dry_run)
    return installer.run()


if __name__ == "__main__":
    raise SystemExit(main())
