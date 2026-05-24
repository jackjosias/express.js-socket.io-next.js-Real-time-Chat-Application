#!/usr/bin/env python3
from __future__ import annotations

import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path


BUNDLE_ROOT = Path(__file__).resolve().parents[1]
BUNDLE_GRAPH_DIR = BUNDLE_ROOT / "graphify-out"
DEFAULT_BUDGET = 1200


def copy_bundle_without_graph(target: Path) -> None:
    ignore = shutil.ignore_patterns("graphify-out", "__pycache__", ".pytest_cache", "*.pyc", "*.pyo")
    shutil.copytree(BUNDLE_ROOT, target, ignore=ignore)


def run_graphify_update(target: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["graphify", "update", str(target)],
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )


def build_graph() -> int:
    with tempfile.TemporaryDirectory(prefix="scribe-bundle-graph-") as tmp:
        mirror = Path(tmp) / "bundle"
        copy_bundle_without_graph(mirror)
        result = run_graphify_update(mirror)
        if result.returncode != 0:
            print(result.stdout.rstrip())
            return result.returncode
        source_graph = mirror / "graphify-out"
        if not source_graph.exists():
            print("SCRIBE GRAPH: Graphify produced no graphify-out directory.")
            return 1
        if BUNDLE_GRAPH_DIR.exists():
            shutil.rmtree(BUNDLE_GRAPH_DIR)
        shutil.copytree(source_graph, BUNDLE_GRAPH_DIR)
    print(f"SCRIBE GRAPH: built {BUNDLE_GRAPH_DIR}")
    return 0


def query_graph(text: str, budget: int) -> int:
    graph_path = BUNDLE_GRAPH_DIR / "graph.json"
    if not graph_path.exists():
        print("SCRIBE GRAPH: missing bundle graph; run `./scribe graph --build` first.")
        return 2
    result = subprocess.run(
        ["graphify", "query", text, "--budget", str(budget), "--graph", str(graph_path)],
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    print(result.stdout.rstrip())
    return result.returncode


def main() -> int:
    parser = argparse.ArgumentParser(prog="scribe graph", description="Build or query the SCRIBE bundle graph.")
    parser.add_argument("--build", action="store_true", help="Build a separate Graphify graph for the SCRIBE bundle.")
    parser.add_argument("--query", help="Query the bundle graph.")
    parser.add_argument("--budget", type=int, default=DEFAULT_BUDGET, help="Approximate token budget for query output.")
    args = parser.parse_args()

    if args.build:
        status = build_graph()
        if status != 0 or not args.query:
            return status
    if args.query:
        return query_graph(args.query, args.budget)

    parser.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
