#!/usr/bin/env python3
from __future__ import annotations

import argparse
from collections import Counter
from pathlib import Path

from scribe_doctor_checks import check_all
from scribe_doctor_report import has_errors
from scribe_memory_admin import VALID_TIERS, cmd_compact, cmd_export, cmd_promote
from scribe_memory_archive import DEFAULT_ARCHIVE_PATH, cmd_archive
from scribe_memory_context import cmd_context, ranked_hot_entities
from scribe_memory_dashboard import DEFAULT_DASHBOARD_DATA_PATH, DEFAULT_DASHBOARD_PATH, cmd_dashboard
from scribe_store import ScribeStore, compact_entity, entity_abstract, entity_title, load_scribe


DEFAULT_LIMIT = 8
DEFAULT_HOT_LIMIT = 8
CHALLENGE_COLLECTIONS = {"scars", "vaccins", "patterns", "ghosts", "hypotheses", "debts", "dettes"}


def add_common_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--scribe",
        default="AGENT-MEMOIRE_PROJECT_STATUS.scribe",
        help="Path to the SCRIBE YAML file.",
    )


def print_entity(entity, verbose: bool = False) -> None:
    print(compact_entity(entity))
    title = entity_title(entity)
    abstract = entity_abstract(entity)
    if title:
        print(f"  titre: {title}")
    if abstract:
        print(f"  l0: {abstract}")
    for field in ("pourquoi", "virus", "antidote", "contexte", "plan_remboursement"):
        value = entity.value.get(field)
        if isinstance(value, str) and value:
            print(f"  {field}: {value}")
    if verbose:
        causal = entity.value.get("liens_causaux")
        if causal:
            print(f"  liens_causaux: {causal}")


def cmd_hot(args: argparse.Namespace) -> int:
    store = load_scribe(Path(args.scribe))
    hot_entities = ranked_hot_entities(store, args.topic)
    hot = hot_entities[: args.limit]
    suffix = "" if not args.topic else f" topic={args.topic}"
    print(f"SCRIBE HOT: {len(hot)}/{len(hot_entities)} entrées affichées{suffix}")
    for entity in hot:
        print()
        print_entity(entity)
    return 0


def cmd_stats(args: argparse.Namespace) -> int:
    store = load_scribe(Path(args.scribe))
    findings = store.findings[:]
    if store.data:
        findings.extend(check_all(store.data, store.raw, store.entities, store.registry))
    errors = sum(1 for item in findings if item.severity == "ERROR")
    warnings = sum(1 for item in findings if item.severity == "WARNING")
    by_collection = Counter(entity.collection for entity in store.entities)
    tiers = store.data.get("tiers", {}) if isinstance(store.data.get("tiers"), dict) else {}

    print("SCRIBE STATS")
    print(f"  file: {store.path}")
    print(f"  entities: {len(store.entities)}")
    print(f"  ids: {len(store.index.id_index)}")
    print(f"  doctor: {errors} error(s), {warnings} warning(s)")
    print(f"  graph: {sum(len(v) for v in store.index.causal_edges.values())} causal edge(s)")
    for tier in ("hot", "warm", "cold"):
        print(f"  tier.{tier}: {len(tiers.get(tier, [])) if isinstance(tiers.get(tier, []), list) else 0}")
    print("  collections:")
    for collection, count in sorted(by_collection.items()):
        print(f"    - {collection}: {count}")
    return 1 if has_errors(findings) else 0


def cmd_explain(args: argparse.Namespace) -> int:
    store = load_scribe(Path(args.scribe))
    entity = store.by_id(args.entity_id)
    if entity is None:
        return print_missing(store, args.entity_id)
    print_entity(entity, verbose=True)
    outgoing, incoming = store.related(args.entity_id)
    print_related_summary(outgoing, incoming)
    return 0


def cmd_related(args: argparse.Namespace) -> int:
    store = load_scribe(Path(args.scribe))
    if store.by_id(args.entity_id) is None:
        return print_missing(store, args.entity_id)
    outgoing, incoming = store.related(args.entity_id)
    print(f"SCRIBE RELATED: {args.entity_id}")
    print_related_list("outgoing", outgoing)
    print_related_list("incoming", incoming)
    return 0


def cmd_query(args: argparse.Namespace) -> int:
    store = load_scribe(Path(args.scribe))
    results = store.search(args.text, limit=args.limit)
    print(f"SCRIBE QUERY: {args.text}")
    if not results:
        print("  Aucun résultat causal local.")
        return 0
    for score, doc in results:
        print()
        print(f"score={score} {compact_entity(doc.entity)}")
        if doc.title:
            print(f"  titre: {doc.title}")
        if doc.abstract:
            print(f"  l0: {doc.abstract}")
    return 0


def cmd_challenge(args: argparse.Namespace) -> int:
    store = load_scribe(Path(args.scribe))
    results = store.search(args.plan, limit=args.limit, collections=CHALLENGE_COLLECTIONS)
    print("SCRIBE CHALLENGE")
    print(f"  plan: {args.plan}")
    if not results:
        print("  verdict: PASS")
        print("  mémoire: aucun vaccin/scar/pattern/dette pertinent trouvé.")
        return 0

    severity = challenge_severity(results)
    print(f"  verdict: {severity}")
    print("  mémoire pertinente:")
    for score, doc in results:
        print(f"    - score={score} {compact_entity(doc.entity)}")
        if doc.abstract:
            print(f"      {doc.abstract}")
    print("  décision:")
    if severity == "BLOCK":
        print("    Corriger le plan avant exécution: au moins une mémoire causale active contredit ou bloque l'approche.")
    elif severity == "WARN":
        print("    Exécutable, mais appliquer les vaccins/patterns listés et surveiller les dettes.")
    else:
        print("    Exécutable: les mémoires trouvées sont informatives, pas bloquantes.")
    return 0


def challenge_severity(results) -> str:
    for _, doc in results:
        value = doc.entity.value
        if doc.entity.collection == "scars" and str(value.get("severite", "")).upper() in {"CRITICAL", "HIGH"}:
            return "BLOCK"
        if doc.entity.collection in {"debts", "dettes"} and str(value.get("severite", "")).upper() in {"CRITICAL", "HIGH"}:
            return "WARN"
        if doc.entity.collection == "vaccins" and str(value.get("tier", "")).lower() == "hot":
            return "WARN"
    return "PASS"


def print_missing(store: ScribeStore, entity_id: str) -> int:
    print(f"ID introuvable: {entity_id}")
    alternatives = store.search(entity_id, limit=5)
    if alternatives:
        print("Suggestions:")
        for score, doc in alternatives:
            print(f"  - score={score} {compact_entity(doc.entity)}")
    return 2


def print_related_summary(outgoing, incoming) -> None:
    if outgoing or incoming:
        print(f"  related: {len(outgoing)} outgoing, {len(incoming)} incoming")


def print_related_list(label: str, entities) -> None:
    print(f"  {label}: {len(entities)}")
    for entity in entities:
        print(f"    - {compact_entity(entity)}")
        abstract = entity_abstract(entity)
        if abstract:
            print(f"      {abstract}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="scribe", description="Query the causal SCRIBE memory.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    hot = subparsers.add_parser("hot", help="Print hot memory entries for immediate agent grounding.")
    add_common_args(hot)
    hot.add_argument("--limit", type=int, default=DEFAULT_HOT_LIMIT)
    hot.add_argument("--topic", help="Rank hot memories by relevance to this topic before recency.")
    hot.set_defaults(func=cmd_hot)

    context = subparsers.add_parser("context", help="Print a low-friction SCRIBE context pack for agents.")
    add_common_args(context)
    context.add_argument("--mode", default="quick", choices=("quick", "standard"))
    context.add_argument("--topic", help="Optional focus query for relevant causal memory.")
    context.add_argument("--limit", type=int, help="Override the hot memory limit for this context run.")
    context.add_argument("--topic-limit", type=int, help="Override the focused topic result limit.")
    context.set_defaults(func=cmd_context)

    stats = subparsers.add_parser("stats", help="Print SCRIBE health and memory statistics.")
    add_common_args(stats)
    stats.set_defaults(func=cmd_stats)

    explain = subparsers.add_parser("explain", help="Explain one SCRIBE entity by ID.")
    add_common_args(explain)
    explain.add_argument("entity_id")
    explain.set_defaults(func=cmd_explain)

    related = subparsers.add_parser("related", help="Show causal neighbors for one SCRIBE entity.")
    add_common_args(related)
    related.add_argument("entity_id")
    related.set_defaults(func=cmd_related)

    query = subparsers.add_parser("query", help="Search the causal SCRIBE memory locally.")
    add_common_args(query)
    query.add_argument("text")
    query.add_argument("--limit", type=int, default=DEFAULT_LIMIT)
    query.set_defaults(func=cmd_query)

    challenge = subparsers.add_parser("challenge", help="Challenge a plan against SCRIBE memory.")
    add_common_args(challenge)
    challenge.add_argument("plan")
    challenge.add_argument("--limit", type=int, default=DEFAULT_LIMIT)
    challenge.set_defaults(func=cmd_challenge)

    compact = subparsers.add_parser("compact", help="Report or apply safe SCRIBE tier registry compaction.")
    add_common_args(compact)
    compact.add_argument("--apply", action="store_true", help="Rewrite only the root tiers registry when compaction is available.")
    compact.set_defaults(func=cmd_compact)

    promote = subparsers.add_parser("promote", help="Move one SCRIBE entity to hot, warm, or cold.")
    add_common_args(promote)
    promote.add_argument("entity_id")
    promote.add_argument("--tier", required=True, choices=VALID_TIERS)
    promote.add_argument("--dry-run", action="store_true", help="Preview the promotion without writing the SCRIBE.")
    promote.set_defaults(func=cmd_promote)

    export = subparsers.add_parser("export", help="Export indexed SCRIBE memory for external tools.")
    add_common_args(export)
    export.add_argument("--format", default="json", choices=("json",))
    export.add_argument("--output", help="Write export to this file instead of stdout.")
    export.add_argument("--include-values", action="store_true", help="Include full entity YAML values in the export.")
    export.set_defaults(func=cmd_export)

    archive = subparsers.add_parser("archive", help="Archive cold SCRIBE entries into AGENT-MEMOIRE_ARCHIVE.yaml.")
    add_common_args(archive)
    archive.add_argument("--apply", action="store_true", help="Write the archive and prune archived entries from the active SCRIBE.")
    archive.add_argument("--output", default=str(DEFAULT_ARCHIVE_PATH), help="Archive YAML output path.")
    archive.add_argument("--tier", default="cold", choices=VALID_TIERS, help="Tier to archive. Defaults to cold.")
    archive.add_argument("--limit", type=int, default=20, help="Maximum candidate rows to print.")
    archive.set_defaults(func=cmd_archive)

    dashboard = subparsers.add_parser("dashboard", help="Generate a static HTML dashboard from the indexed SCRIBE memory.")
    add_common_args(dashboard)
    dashboard.add_argument("--output", default=str(DEFAULT_DASHBOARD_PATH), help="Dashboard HTML output path.")
    dashboard.add_argument("--data-output", default=str(DEFAULT_DASHBOARD_DATA_PATH), help="Dashboard JSON data output path.")
    dashboard.add_argument("--no-data", action="store_true", help="Do not write a separate JSON data file.")
    dashboard.add_argument("--include-values", action="store_true", help="Include full entity YAML values in the dashboard data payload.")
    dashboard.set_defaults(func=cmd_dashboard)
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
