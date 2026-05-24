from __future__ import annotations

import argparse
import json
from html import escape
from pathlib import Path
from typing import Any

from scribe_dashboard_assets import DASHBOARD_CSS, DASHBOARD_JS
from scribe_memory_admin import export_payload, json_default
from scribe_store import load_scribe


DEFAULT_DASHBOARD_PATH = Path("scribe-out") / "scribe-dashboard.html"
DEFAULT_DASHBOARD_DATA_PATH = Path("scribe-out") / "scribe-dashboard-data.json"
ECHARTS_PATH = Path(__file__).resolve().parents[1] / "vendor" / "echarts" / "echarts.min.js"
TIER_LABELS = {"hot": "chaud", "warm": "tiède", "cold": "froid", "-": "-"}
COLLECTION_LABELS = {
    "debts": "dettes",
    "ghosts": "fantômes",
    "invariants": "invariants",
    "journal": "journal",
    "patterns": "patterns",
    "vaccins": "vaccins",
}
STATUS_LABELS = {"ACTIVE": "actif", "active": "actif", "-": "-"}


def cmd_dashboard(args: argparse.Namespace) -> int:
    store = load_scribe(Path(args.scribe))
    payload = export_payload(store, include_values=args.include_values)
    html = render_dashboard(payload)

    output_path = Path(args.output)
    data_path = Path(args.data_output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(html, encoding="utf-8")

    if not args.no_data:
        data_path.parent.mkdir(parents=True, exist_ok=True)
        data_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True, default=json_default) + "\n", encoding="utf-8")

    print("SCRIBE DASHBOARD")
    print(f"  html: {output_path}")
    if not args.no_data:
        print(f"  data: {data_path}")
    print(f"  entities: {payload['summary']['entities']}")
    print(f"  doctor: {payload['summary']['doctor_errors']} error(s), {payload['summary']['doctor_warnings']} warning(s)")
    return 0


def render_dashboard(payload: dict[str, Any]) -> str:
    summary = payload.get("summary", {})
    entities = sorted(as_entities(payload.get("entities")), key=entity_priority)
    tiers = payload.get("tiers", {}) if isinstance(payload.get("tiers"), dict) else {}
    tier_counts = {tier: len(as_string_list(tiers.get(tier))) for tier in ("hot", "warm", "cold")}
    collections = count_by_key(entities, "collection")
    statuses = count_by_key(entities, "status")
    payload_json = json.dumps(payload, ensure_ascii=False, sort_keys=True, default=json_default).replace("</", "<\\/")
    echarts_source = ECHARTS_PATH.read_text(encoding="utf-8").replace("</", "<\\/").replace("https://", "https:\\/\\/")
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Tableau de bord SCRIBE</title>
  <style>{DASHBOARD_CSS}</style>
</head>
<body>
  <main class="shell">
    <header class="hero">
      <section class="hero-main">
        <p class="eyebrow">Mémoire SCRIBE/TENOR</p>
        <h1>Tableau de bord SCRIBE</h1>
        <p class="lede">Vue opérationnelle de la mémoire causale : santé, niveaux, pression de dette et entrées consultables depuis l’export SCRIBE déterministe.</p>
        <div class="source-line">
          <span class="pill">Source : {escape(str(payload.get("source") or "-"))}</span>
          <span class="pill">Schéma : {escape(str(payload.get("schema_version") or "-"))}</span>
        </div>
      </section>
      {health_card(summary)}
    </header>
    <section class="overview">
      <article class="ops-panel">
        <p class="eyebrow">Synthèse opérationnelle</p>
        <h2>Contrôle mémoire</h2>
        <div class="ops-grid">
          {ops_metric("Entrées", summary.get("entities", 0), "indexées")}
          {ops_metric("Liens", summary.get("causal_edges", 0), "causaux")}
          {ops_metric("Chaud", tier_counts["hot"], "lecture prioritaire")}
          {ops_metric("Dette", active_debt_count(entities), "active")}
        </div>
        <div class="ops-lines">
          <div><span>Diagnostic</span><strong>{escape(health_label(summary))}</strong></div>
          <div><span>Densité</span><strong>{escape(density_label(summary))}</strong></div>
        </div>
      </article>
      <section class="chart-zone">
        {chart_card("Répartition des niveaux", "pression de récupération chaud / tiède / froid", "tiers")}
        {chart_card("Collections", "volume mémoire par collection", "collections")}
        {chart_card("Risque", "avertissements, dette active, backlog froid", "risk")}
      </section>
    </section>
    <section class="workspace">
      <aside class="sidebar" aria-label="Distributions de la mémoire SCRIBE">
        <article class="panel">
          <div class="panel-head">
            <div>
              <h2>Niveaux mémoire</h2>
              <p class="panel-note">Pression de récupération par température.</p>
            </div>
          </div>
          <div class="distribution">{distribution_rows(tier_counts, TIER_LABELS)}</div>
        </article>
        <article class="panel">
          <div class="panel-head">
            <div>
              <h2>Collections</h2>
              <p class="panel-note">Répartition du signal mémoire.</p>
            </div>
          </div>
          <div class="distribution">{distribution_rows(collections, COLLECTION_LABELS)}</div>
        </article>
        <article class="panel">
          <div class="panel-head">
            <div>
              <h2>Statuts</h2>
              <p class="panel-note">État opérationnel des entrées.</p>
            </div>
          </div>
          <div class="distribution">{distribution_rows(statuses, STATUS_LABELS)}</div>
        </article>
      </aside>
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Explorateur mémoire</h2>
            <p class="panel-note">Recherche et filtrage sans serveur ; toutes les données sont intégrées dans ce fichier.</p>
          </div>
          <span class="counter" data-visible-count>{len(entities)} visibles / {len(entities)} au total</span>
        </div>
        <div class="controls">
          <input class="control" data-filter="query" type="search" placeholder="Rechercher ID, titre, résumé...">
          {select_control("tier", "Tous les niveaux", sorted(tier_counts), TIER_LABELS)}
          {select_control("collection", "Toutes les collections", sorted(collections), COLLECTION_LABELS)}
          {select_control("status", "Tous les statuts", sorted(statuses), STATUS_LABELS)}
          {sort_control()}
          <button class="reset-button" type="button" data-reset>Réinitialiser</button>
        </div>
        <div class="entity-grid" data-entity-grid>{entity_rows(entities)}</div>
        <div class="empty-state" data-empty-state>Aucune mémoire ne correspond aux filtres actuels.</div>
      </section>
    </section>
  </main>
  <script type="application/json" id="scribe-data">{payload_json}</script>
  <script>{echarts_source}</script>
  <script>{DASHBOARD_JS}</script>
</body>
</html>
"""


def ops_metric(label: str, value: Any, detail: str) -> str:
    return (
        '<div class="ops-metric">'
        f'<span>{escape(label)}</span><strong>{escape(str(value))}</strong><small>{escape(detail)}</small>'
        "</div>"
    )


def health_card(summary: dict[str, Any]) -> str:
    return (
        f'<aside class="health-card {health_class(summary)}" aria-label="Santé du diagnostic SCRIBE">'
        '<div><p class="eyebrow">Santé doctor</p>'
        f'<strong>{escape(health_label(summary))}</strong></div>'
        f'<span>{escape(health_detail(summary))}</span>'
        "</aside>"
    )


def chart_card(title: str, note: str, chart_name: str) -> str:
    return (
        '<article class="chart-card">'
        f'<div><h2>{escape(title)}</h2><p class="panel-note">{escape(note)}</p></div>'
        f'<div class="chart" data-chart="{escape(chart_name)}"></div></article>'
    )


def select_control(name: str, label: str, options: list[str], labels: dict[str, str]) -> str:
    rendered = [f'<option value="">{escape(label)}</option>']
    rendered.extend(f'<option value="{escape(option.lower())}">{escape(display_label(option, labels))}</option>' for option in options)
    return f'<select class="control" data-filter="{escape(name)}">{"".join(rendered)}</select>'


def sort_control() -> str:
    options = [
        ("degree", "Trier par degré"),
        ("title", "Trier par titre"),
        ("tier", "Trier par niveau"),
        ("collection", "Trier par collection"),
    ]
    rendered = "".join(f'<option value="{value}">{label}</option>' for value, label in options)
    return f'<select class="control" data-filter="sort">{rendered}</select>'


def distribution_rows(counts: dict[str, int], labels: dict[str, str]) -> str:
    maximum = max(counts.values(), default=1)
    rows = []
    for name, count in sorted(counts.items()):
        width = max(4, round((count / maximum) * 100)) if maximum else 0
        rows.append(
            '<div class="dist-row">'
            f'<strong>{escape(display_label(name, labels))}</strong>'
            f'<div class="bar" aria-hidden="true"><span data-bar-width="{width}"></span></div>'
            f'<span>{count}</span>'
            '</div>'
        )
    return "".join(rows) or '<p class="panel-note">Aucune donnée.</p>'


def entity_rows(entities: list[dict[str, Any]]) -> str:
    return "".join(entity_row(entity) for entity in entities)


def entity_row(entity: dict[str, Any]) -> str:
    entity_id = str(entity.get("id") or "-")
    collection = str(entity.get("collection") or "-")
    title = str(entity.get("title") or entity_id)
    abstract = str(entity.get("abstract") or "")
    tier = str(entity.get("tier") or "-")
    status = str(entity.get("status") or "-")
    score = connection_score(entity)
    search = " ".join([entity_id, collection, title, abstract, tier, status])
    return (
        '<article class="entity-card" data-entity-card '
        f'data-id="{escape(entity_id)}" data-title="{escape(title)}" '
        f'data-collection="{escape(collection.lower())}" data-tier="{escape(tier.lower())}" '
        f'data-status="{escape(status.lower())}" data-degree="{score}" data-search="{escape(search)}">'
        '<div class="entity-top"><div class="entity-title">'
        f'<h3>{escape(title)}</h3><code>{escape(entity_id)}</code></div>'
        f'<span class="degree">degré {score}</span></div>'
        f'<p>{escape(abstract)}</p>'
        '<div class="meta">'
        f'<span class="tag">{escape(display_label(collection, COLLECTION_LABELS))}</span>'
        f'<span class="tag {escape(tier.lower())}">niveau {escape(display_label(tier, TIER_LABELS))}</span>'
        f'<span class="tag {escape(status.lower())}">{escape(display_label(status, STATUS_LABELS))}</span>'
        f'<span class="tag">sortants {len(as_string_list(entity.get("outgoing")))}</span>'
        f'<span class="tag">entrants {len(as_string_list(entity.get("incoming")))}</span>'
        '</div></article>'
    )

def display_label(value: str, labels: dict[str, str]) -> str:
    return labels.get(value, labels.get(value.lower(), value or "-"))


def count_by_key(entities: list[dict[str, Any]], key: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for entity in entities:
        name = str(entity.get(key) or "-")
        counts[name] = counts.get(name, 0) + 1
    return counts

def connection_score(entity: dict[str, Any]) -> int:
    outgoing = entity.get("outgoing")
    incoming = entity.get("incoming")
    return len(outgoing if isinstance(outgoing, list) else []) + len(incoming if isinstance(incoming, list) else [])

def health_class(summary: dict[str, Any]) -> str:
    if int(summary.get("doctor_errors", 0) or 0) > 0:
        return "bad"
    if int(summary.get("doctor_warnings", 0) or 0) > 0:
        return "warn"
    return "ok"

def health_label(summary: dict[str, Any]) -> str:
    errors = int(summary.get("doctor_errors", 0) or 0)
    warnings = int(summary.get("doctor_warnings", 0) or 0)
    return f"{errors} erreur(s), {warnings} avertissement(s)"

def health_detail(summary: dict[str, Any]) -> str:
    if int(summary.get("doctor_errors", 0) or 0) > 0:
        return "Arrêter et corriger la corruption mémoire bloquante avant d’utiliser ce tableau."
    if int(summary.get("doctor_warnings", 0) or 0) > 0:
        return "Utilisable avec avertissements historiques ; garder le doctor à zéro erreur."
    return "La mémoire est structurellement saine."

def active_debt_count(entities: list[dict[str, Any]]) -> int:
    return sum(1 for entity in entities if entity.get("collection") == "debts" and entity.get("status") == "ACTIVE")

def density_label(summary: dict[str, Any]) -> str:
    entities = int(summary.get("entities", 0) or 0)
    edges = int(summary.get("causal_edges", 0) or 0)
    if entities == 0:
        return "0 lien/entrée"
    return f"{edges / entities:.1f} liens/entrée"

def entity_priority(entity: dict[str, Any]) -> tuple[int, int, str]:
    tier_weight = {"hot": 0, "warm": 1, "cold": 2}.get(str(entity.get("tier") or "").lower(), 3)
    debt_weight = 0 if entity.get("collection") == "debts" and entity.get("status") == "ACTIVE" else 1
    return (debt_weight, tier_weight, -connection_score(entity), str(entity.get("id") or ""))

def as_entities(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [entity for entity in value if isinstance(entity, dict)]

def as_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item) for item in value]
