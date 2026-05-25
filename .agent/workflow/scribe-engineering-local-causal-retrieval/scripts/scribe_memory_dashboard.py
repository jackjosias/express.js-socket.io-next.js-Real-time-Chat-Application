from __future__ import annotations

import argparse
import json
from html import escape
from pathlib import Path
from typing import Any

from scribe_dashboard_assets import DASHBOARD_CSS
from scribe_dashboard_assets_js import DASHBOARD_JS
import scribe_dashboard_view as view
from scribe_index import ensure_quick_index
from scribe_memory_admin import export_payload, json_default
from scribe_store import load_scribe


DEFAULT_DASHBOARD_PATH = Path("scribe-out") / "scribe-dashboard.html"
DEFAULT_DASHBOARD_DATA_PATH = Path("scribe-out") / "scribe-dashboard-data.json"
ECHARTS_PATH = Path(__file__).resolve().parents[1] / "vendor" / "echarts" / "echarts.min.js"


def cmd_dashboard(args: argparse.Namespace) -> int:
    if args.include_values:
        store = load_scribe(Path(args.scribe))
        payload = export_payload(store, include_values=True)
    else:
        payload = slim_dashboard_payload(ensure_quick_index(Path(args.scribe)).payload)
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


def slim_dashboard_payload(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "source": payload.get("source"),
        "schema_version": payload.get("schema_version"),
        "summary": payload.get("summary", {}),
        "tiers": payload.get("tiers", {}),
        "collections": payload.get("collections", {}),
        "statuses": payload.get("statuses", {}),
        "doctor_findings": payload.get("doctor_findings", []),
        "retrieval_quality": payload.get("retrieval_quality", {}),
        "recommendations": payload.get("recommendations", []),
        "entities": [slim_entity(entity) for entity in view.as_entities(payload.get("entities"))],
    }


def slim_entity(entity: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": entity.get("id"),
        "collection": entity.get("collection"),
        "tier": entity.get("tier"),
        "status": entity.get("status"),
        "title": entity.get("title"),
        "abstract": entity.get("abstract"),
        "outgoing": entity.get("outgoing", []),
        "incoming": entity.get("incoming", []),
    }


def render_dashboard(payload: dict[str, Any]) -> str:
    summary = payload.get("summary", {})
    entities = sorted(view.as_entities(payload.get("entities")), key=view.entity_priority)
    tiers = payload.get("tiers", {}) if isinstance(payload.get("tiers"), dict) else {}
    tier_counts = {tier: len(view.as_string_list(tiers.get(tier))) for tier in ("hot", "warm", "cold")}
    collections = view.count_by_key(entities, "collection")
    statuses = view.count_by_key(entities, "status")
    edge_counts = view.edge_counts(summary)
    payload_json = json.dumps(payload, ensure_ascii=False, sort_keys=True, default=json_default).replace("</", "<\\/")
    echarts_source = ECHARTS_PATH.read_text(encoding="utf-8").replace("</", "<\\/").replace("https://", "https:\\/\\/")
    return f"""<!DOCTYPE html>
<html lang="fr" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Tableau de bord SCRIBE</title>
  <script>
    try {{
      const storedTheme = localStorage.getItem("scribe-dashboard-theme");
      document.documentElement.dataset.theme = storedTheme === "light" ? "light" : "dark";
    }} catch (error) {{
      document.documentElement.dataset.theme = "dark";
    }}
  </script>
  <style>{DASHBOARD_CSS}</style>
</head>
<body>
  <canvas class="particle-field" data-particle-field aria-hidden="true"></canvas>
  <main class="shell">
    <header class="hero">
      <section class="hero-main">
        <div class="hero-top">
          <p class="eyebrow">Mémoire SCRIBE/TENOR</p>
          <div class="theme-toggle" role="group" aria-label="Thème du tableau de bord">
            <button type="button" data-theme-option="dark" aria-pressed="true">Sombre</button>
            <button type="button" data-theme-option="light" aria-pressed="false">Clair</button>
          </div>
        </div>
        <h1>Tableau de bord SCRIBE</h1>
        <p class="lede">Vue opérationnelle de la mémoire causale : santé, niveaux, pression de dette et entrées consultables depuis l’export SCRIBE déterministe.</p>
        <div class="source-line">
          <span class="pill">Source : {escape(str(payload.get("source") or "-"))}</span>
          <span class="pill">Schéma : {escape(str(payload.get("schema_version") or "-"))}</span>
        </div>
      </section>
      {view.health_card(summary)}
    </header>
    <section class="overview">
      <article class="ops-panel">
        <p class="eyebrow">Synthèse opérationnelle</p>
        <h2>Contrôle mémoire</h2>
        <div class="ops-grid">
          {view.ops_metric("Entrées", summary.get("entities", 0), "indexées")}
          {view.ops_metric("Causal", edge_counts["causal"], "douleur → règle")}
          {view.ops_metric("Evidence", edge_counts["evidence"], "preuve réelle")}
          {view.ops_metric("Consultation", edge_counts["consultation"], "mémoire lue")}
          {view.ops_metric("Journal", edge_counts["journal"], "session → delta")}
          {view.ops_metric("Chaud", tier_counts["hot"], "lecture prioritaire")}
          {view.ops_metric("Qualité", view.retrieval_quality_label(payload), view.retrieval_quality_detail(payload))}
        </div>
        <div class="ops-lines">
          <div><span>Diagnostic</span><strong>{escape(view.health_label(summary))}</strong></div>
          <div><span>Densité</span><strong>{escape(view.density_label(summary))}</strong></div>
          <div><span>Dette active</span><strong>{view.active_debt_count(entities)}</strong></div>
        </div>
      </article>
      <section class="chart-zone">
        {view.chart_card("Liens par type", "causalité, preuve, consultation, journal", "edges")}
        {view.chart_card("Répartition des niveaux", "pression de récupération chaud / tiède / froid", "tiers")}
        {view.chart_card("Collections", "volume mémoire par collection", "collections")}
        {view.chart_card("Risque", "avertissements, dette active, backlog froid", "risk")}
        {view.chart_card("Statuts", "entrées actives, héritées ou résolues", "statuses")}
        {view.chart_card("Qualité retrieval", "smoke eval par surface SCRIBE", "quality")}
      </section>
    </section>
    <section class="panel action-panel">
      <div class="panel-head">
        <div>
          <h2>Actions recommandées</h2>
          <p class="panel-note">Priorités calculées depuis doctor, eval, dettes et audit causal.</p>
        </div>
      </div>
      <div class="action-grid">{view.recommendation_cards(payload.get("recommendations"))}</div>
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
          <div class="distribution">{view.distribution_rows(tier_counts, view.TIER_LABELS)}</div>
        </article>
        <article class="panel">
          <div class="panel-head">
            <div>
              <h2>Collections</h2>
              <p class="panel-note">Répartition du signal mémoire.</p>
            </div>
          </div>
          <div class="distribution">{view.distribution_rows(collections, view.COLLECTION_LABELS)}</div>
        </article>
        <article class="panel">
          <div class="panel-head">
            <div>
              <h2>Statuts</h2>
              <p class="panel-note">État opérationnel des entrées.</p>
            </div>
          </div>
          <div class="distribution">{view.distribution_rows(statuses, view.STATUS_LABELS)}</div>
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
          {view.select_control("tier", "Tous les niveaux", sorted(tier_counts), view.TIER_LABELS)}
          {view.select_control("collection", "Toutes les collections", sorted(collections), view.COLLECTION_LABELS)}
          {view.select_control("status", "Tous les statuts", sorted(statuses), view.STATUS_LABELS)}
          {view.sort_control()}
          <button class="reset-button" type="button" data-reset>Réinitialiser</button>
        </div>
        <div class="entity-grid" data-entity-grid>{view.entity_rows(entities)}</div>
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
