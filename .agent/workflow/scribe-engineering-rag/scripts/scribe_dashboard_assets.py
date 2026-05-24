from __future__ import annotations


DASHBOARD_CSS = """
:root {
  color-scheme: light;
  --ink: #172033;
  --muted: #617089;
  --soft: #eef2f6;
  --line: #d9e0ea;
  --paper: #f7f8fa;
  --panel: #ffffff;
  --panel-2: #fbfcfe;
  --teal: #167386;
  --green: #16815d;
  --amber: #9d6500;
  --red: #b3261e;
  --violet: #6851a8;
  --shadow: 0 18px 48px rgba(23, 32, 51, 0.08);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background:
    linear-gradient(180deg, #f3f6f8 0, var(--paper) 320px);
  color: var(--ink);
  font: 14px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
button, input, select { font: inherit; }
.shell { width: min(1280px, calc(100vw - 32px)); margin: 0 auto; padding: 28px 0 44px; }
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 18px;
  align-items: stretch;
  margin-bottom: 16px;
}
.hero-main, .health-card, .panel, .metric {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
}
.hero-main { padding: 24px; }
.eyebrow {
  margin: 0 0 8px;
  color: var(--teal);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}
h1 { margin: 0; font-size: clamp(28px, 4vw, 48px); line-height: 1.02; letter-spacing: 0; }
.lede { max-width: 760px; margin: 14px 0 0; color: var(--muted); font-size: 16px; }
.source-line { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
.pill {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 3px 10px;
  background: var(--panel-2);
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}
.health-card { padding: 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 16px; }
.health-card strong { display: block; font-size: 24px; line-height: 1.1; }
.health-card span { color: var(--muted); }
.health-card.ok strong { color: var(--green); }
.health-card.warn strong { color: var(--amber); }
.health-card.bad strong { color: var(--red); }
.overview {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
  margin-bottom: 12px;
}
.ops-panel, .chart-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: none;
}
.ops-panel { padding: 18px; }
.ops-panel h2 { margin-bottom: 16px; font-size: 22px; }
.ops-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.ops-metric { min-height: 92px; border: 1px solid var(--line); border-radius: 8px; padding: 12px; background: linear-gradient(180deg, #ffffff, #f8fafc); }
.ops-metric span, .ops-lines span { display: block; color: var(--muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
.ops-metric strong { display: block; margin-top: 5px; font-size: 30px; line-height: 1; }
.ops-metric small { display: block; margin-top: 8px; color: var(--muted); }
.ops-lines { display: grid; gap: 8px; margin-top: 14px; }
.ops-lines div { display: flex; justify-content: space-between; gap: 12px; border-top: 1px solid var(--line); padding-top: 9px; }
.ops-lines strong { color: var(--ink); }
.chart-zone { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.chart-zone, .chart-card { min-width: 0; }
.chart-card { min-height: 248px; padding: 16px 16px 10px; overflow: hidden; }
.chart { width: 100%; height: 166px; margin-top: 8px; }
.panel { padding: 16px; box-shadow: none; }
.panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
h2 { margin: 0; font-size: 18px; line-height: 1.2; }
.panel-note { margin: 5px 0 0; color: var(--muted); font-size: 13px; }
.workspace { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 12px; align-items: start; }
.sidebar { display: grid; gap: 12px; position: sticky; top: 12px; }
.controls {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) repeat(4, minmax(120px, 160px)) auto;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}
.control, .reset-button {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  color: var(--ink);
}
.control { padding: 0 11px; }
.reset-button { cursor: pointer; font-weight: 800; color: var(--teal); }
.reset-button:hover { background: var(--soft); }
.counter { color: var(--muted); font-weight: 700; white-space: nowrap; }
.distribution { display: grid; gap: 10px; }
.dist-row { display: grid; grid-template-columns: 74px 1fr auto; gap: 10px; align-items: center; }
.dist-row strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar { height: 8px; border-radius: 999px; background: var(--soft); overflow: hidden; }
.bar span { display: block; width: 0; height: 100%; border-radius: inherit; background: var(--teal); }
.entity-grid { display: grid; gap: 10px; }
.entity-card { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); padding: 14px; transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease; }
.entity-card:hover { border-color: rgba(22, 115, 134, 0.55); box-shadow: var(--shadow); transform: translateY(-1px); }
.entity-top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.entity-title { min-width: 0; }
.entity-title h3 { margin: 0; font-size: 16px; line-height: 1.25; }
.entity-title code { display: inline-block; margin-top: 5px; color: var(--teal); font-weight: 800; }
.entity-card p { margin: 10px 0 0; color: #2c3749; }
.meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.tag { border: 1px solid var(--line); border-radius: 999px; padding: 3px 9px; background: var(--panel-2); color: var(--muted); font-size: 12px; font-weight: 700; }
.tag.hot { color: var(--red); border-color: rgba(179, 38, 30, 0.26); }
.tag.warm { color: var(--amber); border-color: rgba(157, 101, 0, 0.26); }
.tag.cold { color: var(--violet); border-color: rgba(104, 81, 168, 0.26); }
.tag.active { color: var(--green); border-color: rgba(22, 129, 93, 0.26); }
.degree { color: var(--muted); font-weight: 800; white-space: nowrap; }
.empty-state { display: none; padding: 24px; text-align: center; color: var(--muted); border: 1px dashed var(--line); border-radius: 8px; }
.empty-state.visible { display: block; }
@media (max-width: 1040px) {
  .hero, .overview, .workspace { grid-template-columns: 1fr; }
  .chart-zone { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sidebar { position: static; }
  .controls { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .counter { grid-column: 1 / -1; }
}
@media (max-width: 680px) {
  .shell { width: min(100vw - 20px, 1280px); padding-top: 14px; }
  .hero-main { padding: 18px; }
  .ops-grid, .chart-zone, .controls { grid-template-columns: 1fr; }
  .ops-lines div { display: grid; grid-template-columns: 1fr; }
  .ops-lines strong { overflow-wrap: anywhere; }
  .chart-card { min-height: 236px; }
  .entity-top { display: block; }
  .degree { display: inline-block; margin-top: 8px; }
}
"""


DASHBOARD_JS = """
const state = { query: "", tier: "", collection: "", status: "", sort: "degree" };
const cards = Array.from(document.querySelectorAll("[data-entity-card]"));
const grid = document.querySelector("[data-entity-grid]");
const empty = document.querySelector("[data-empty-state]");
const visibleCount = document.querySelector("[data-visible-count]");
const payload = JSON.parse(document.getElementById("scribe-data").textContent || "{}");
const chartInstances = [];
const tierLabels = { hot: "chaud", warm: "tiède", cold: "froid", "-": "-" };
const collectionLabels = {
  debts: "dettes",
  ghosts: "fantômes",
  invariants: "invariants",
  journal: "journal",
  patterns: "patterns",
  vaccins: "vaccins",
};

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function matches(card) {
  const query = normalize(state.query);
  return (!query || normalize(card.dataset.search).includes(query))
    && (!state.tier || normalize(card.dataset.tier) === state.tier)
    && (!state.collection || normalize(card.dataset.collection) === state.collection)
    && (!state.status || normalize(card.dataset.status) === state.status);
}

function sortCards(visibleCards) {
  const sorted = visibleCards.slice();
  sorted.sort((a, b) => {
    if (state.sort === "title") return normalize(a.dataset.title).localeCompare(normalize(b.dataset.title));
    if (state.sort === "tier") return normalize(a.dataset.tier).localeCompare(normalize(b.dataset.tier));
    if (state.sort === "collection") return normalize(a.dataset.collection).localeCompare(normalize(b.dataset.collection));
    return Number(b.dataset.degree || 0) - Number(a.dataset.degree || 0);
  });
  return sorted;
}

function render() {
  const visibleCards = cards.filter(matches);
  cards.forEach((card) => { card.hidden = true; });
  sortCards(visibleCards).forEach((card) => {
    card.hidden = false;
    grid.appendChild(card);
  });
  visibleCount.textContent = `${visibleCards.length} visibles / ${cards.length} au total`;
  empty.classList.toggle("visible", visibleCards.length === 0);
}

function initBars() {
  document.querySelectorAll("[data-bar-width]").forEach((bar) => {
    const value = Number(bar.dataset.barWidth || 0);
    bar.style.width = `${Math.max(0, Math.min(100, value))}%`;
  });
}

document.querySelectorAll("[data-filter]").forEach((control) => {
  control.addEventListener("input", () => {
    state[control.dataset.filter] = normalize(control.value);
    render();
  });
});

document.querySelector("[data-reset]").addEventListener("click", () => {
  Object.keys(state).forEach((key) => { state[key] = key === "sort" ? "degree" : ""; });
  document.querySelectorAll("[data-filter]").forEach((control) => {
    control.value = control.dataset.filter === "sort" ? "degree" : "";
  });
  render();
});

function safeEntities() {
  return Array.isArray(payload.entities) ? payload.entities : [];
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const name = String(item[key] || "-");
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
}

function tierChartData() {
  const tiers = payload.tiers || {};
  return ["hot", "warm", "cold"].map((name) => ({
    name: tierLabels[name] || name,
    value: Array.isArray(tiers[name]) ? tiers[name].length : 0,
  }));
}

function riskChartData() {
  const entities = safeEntities();
  const activeDebt = entities.filter((item) => item.collection === "debts" && item.status === "ACTIVE").length;
  const cold = Array.isArray(payload.tiers?.cold) ? payload.tiers.cold.length : 0;
  const summary = payload.summary || {};
  return [
    { name: "Avertissements", value: Number(summary.doctor_warnings || 0) },
    { name: "Erreurs", value: Number(summary.doctor_errors || 0) },
    { name: "Dette", value: activeDebt },
    { name: "Froid", value: cold },
  ];
}

function renderChart(name, option) {
  const element = document.querySelector(`[data-chart="${name}"]`);
  if (!element || !window.echarts) return;
  const chart = echarts.init(element, null, { renderer: "svg" });
  chart.setOption(option);
  chartInstances.push(chart);
}

function initCharts() {
  if (!window.echarts) return;
  const collections = Object.entries(countBy(safeEntities(), "collection"))
    .sort((left, right) => right[1] - left[1]);
  renderChart("tiers", {
    color: ["#b3261e", "#9d6500", "#16815d"],
    tooltip: { trigger: "item" },
    legend: { bottom: 0, icon: "circle" },
    series: [{ type: "pie", radius: ["54%", "76%"], center: ["50%", "43%"], avoidLabelOverlap: true, data: tierChartData() }],
  });
  renderChart("collections", {
    color: ["#167386"],
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { top: 10, right: 12, bottom: 24, left: 74 },
    xAxis: { type: "value", splitLine: { lineStyle: { color: "#eef2f6" } } },
    yAxis: { type: "category", data: collections.map((item) => collectionLabels[item[0]] || item[0]), axisTick: { show: false } },
    series: [{ type: "bar", barWidth: 12, data: collections.map((item) => item[1]), itemStyle: { borderRadius: [0, 6, 6, 0] } }],
  });
  renderChart("risk", {
    color: ["#9d6500", "#b3261e", "#6851a8", "#16815d"],
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { top: 12, right: 12, bottom: 26, left: 42 },
    xAxis: { type: "category", data: riskChartData().map((item) => item.name), axisTick: { show: false } },
    yAxis: { type: "value", splitLine: { lineStyle: { color: "#eef2f6" } } },
    series: [{ type: "bar", barWidth: 18, data: riskChartData().map((item) => item.value), itemStyle: { borderRadius: [6, 6, 0, 0] } }],
  });
  window.addEventListener("resize", () => chartInstances.forEach((chart) => chart.resize()));
}

initBars();
render();
initCharts();
"""
