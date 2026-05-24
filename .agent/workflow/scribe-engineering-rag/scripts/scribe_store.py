from __future__ import annotations

import re
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from scribe_doctor_model import (
    Entity,
    Finding,
    as_refs,
    canonical_status,
    collect_entities,
    collect_registry,
    parse_yaml,
    read_text,
)
from scribe_search import SearchDoc, build_search_doc, expand_tokens, score_doc, tokenize


DEFAULT_SCRIBE_PATH = Path("AGENT-MEMOIRE_PROJECT_STATUS.scribe")
COLLECTION_ORDER = {
    "scars": 0,
    "vaccins": 1,
    "patterns": 2,
    "ghosts": 3,
    "hypotheses": 4,
    "debts": 5,
    "dettes": 5,
    "journal": 6,
}


@dataclass(frozen=True)
class ScribeIndex:
    id_index: dict[str, Entity]
    tier_index: dict[str, list[Entity]]
    text_index: list[SearchDoc]
    causal_edges: dict[str, set[str]]
    reverse_edges: dict[str, set[str]]


@dataclass(frozen=True)
class ScribeStore:
    path: Path
    raw: str
    data: dict[str, Any]
    findings: list[Finding]
    entities: list[Entity]
    registry: dict[str, list[str]]
    index: ScribeIndex

    def by_id(self, entity_id: str) -> Entity | None:
        return self.index.id_index.get(entity_id)

    def hot_entities(self) -> list[Entity]:
        hot_ids = as_refs(self.data.get("tiers", {}).get("hot") if isinstance(self.data.get("tiers"), dict) else [])
        seen: set[str] = set()
        entities: list[Entity] = []
        for entity_id in hot_ids:
            entity = self.by_id(entity_id)
            if entity is not None:
                entities.append(entity)
                seen.add(entity_id)
        for entity in self.index.tier_index.get("hot", []):
            if entity.id and entity.id not in seen:
                entities.append(entity)
                seen.add(entity.id)
        return entities

    def related(self, entity_id: str) -> tuple[list[Entity], list[Entity]]:
        outgoing = sorted_entities(
            self.index.id_index[target]
            for target in self.index.causal_edges.get(entity_id, set())
            if target in self.index.id_index
        )
        incoming = sorted_entities(
            self.index.id_index[source]
            for source in self.index.reverse_edges.get(entity_id, set())
            if source in self.index.id_index
        )
        return outgoing, incoming

    def search(self, query: str, limit: int = 8, collections: set[str] | None = None) -> list[tuple[int, SearchDoc]]:
        query_tokens = expand_tokens(tokenize(query))
        if not query_tokens:
            return []
        scored: list[tuple[int, SearchDoc]] = []
        for doc in self.index.text_index:
            if collections is not None and doc.entity.collection not in collections:
                continue
            score = score_doc(doc, query, query_tokens)
            if score > 0:
                scored.append((score, doc))
        scored.sort(key=lambda item: (-item[0], sort_key(item[1].entity)))
        return scored[:limit]


def load_scribe(path: Path = DEFAULT_SCRIBE_PATH) -> ScribeStore:
    raw = read_text(path)
    data, findings = parse_yaml(raw, path)
    if data is None:
        data = {}
    entities = collect_entities(data)
    registry = collect_registry(data)
    index = build_index(entities, registry)
    return ScribeStore(path, raw, data, findings, entities, registry, index)


def build_index(entities: list[Entity], registry: dict[str, list[str]]) -> ScribeIndex:
    with ThreadPoolExecutor(max_workers=3) as executor:
        text_future = executor.submit(build_text_index, entities)
        tier_future = executor.submit(build_tier_index, entities)
        edges_future = executor.submit(build_causal_edges, entities, set(registry))
        text_index = text_future.result()
        tier_index = tier_future.result()
        causal_edges = edges_future.result()
    reverse_edges = reverse_index(causal_edges)
    id_index = {entity.id: entity for entity in entities if entity.id}
    return ScribeIndex(id_index, tier_index, text_index, causal_edges, reverse_edges)


def build_text_index(entities: list[Entity]) -> list[SearchDoc]:
    return [build_search_doc(entity, entity_title(entity), entity_abstract(entity)) for entity in entities]


def build_tier_index(entities: list[Entity]) -> dict[str, list[Entity]]:
    tiers: dict[str, list[Entity]] = {}
    for entity in entities:
        tier = str(entity.value.get("tier", "")).lower()
        if tier:
            tiers.setdefault(tier, []).append(entity)
    for tier, items in tiers.items():
        tiers[tier] = sorted_entities(items)
    return tiers


def build_causal_edges(entities: list[Entity], known_ids: set[str]) -> dict[str, set[str]]:
    edges: dict[str, set[str]] = {}
    for entity in entities:
        if not entity.id:
            continue
        targets = edge_targets(entity.value, known_ids)
        if targets:
            edges[entity.id] = targets
    return edges


def reverse_index(edges: dict[str, set[str]]) -> dict[str, set[str]]:
    reverse: dict[str, set[str]] = {}
    for source, targets in edges.items():
        for target in targets:
            reverse.setdefault(target, set()).add(source)
    return reverse


def edge_targets(value: dict[str, Any], known_ids: set[str]) -> set[str]:
    candidates: set[str] = set()
    for field in ("superseded_by", "hot_entries_consulted", "scribe_delta"):
        candidates.update(split_refs(value.get(field)))
    causal = value.get("liens_causaux")
    if isinstance(causal, dict):
        for child in causal.values():
            candidates.update(split_refs(child))
    evidence = value.get("evidence")
    if isinstance(evidence, dict):
        candidates.update(split_refs(evidence.get("source")))
    candidates.update(split_refs(value.get("validated_by_session")))
    candidates.update(split_refs(value.get("ne_pas_reproposer")))
    return {target for target in candidates if target in known_ids}


def split_refs(value: Any) -> set[str]:
    if isinstance(value, str):
        return {part.strip() for part in re.split(r"[|,\s]+", value) if part.strip()}
    if isinstance(value, list):
        refs: set[str] = set()
        for item in value:
            refs.update(split_refs(item))
        return refs
    if isinstance(value, dict):
        return {str(value["session"])} if isinstance(value.get("session"), str) else set()
    return set()


def entity_title(entity: Entity) -> str:
    title = entity.value.get("titre", entity.value.get("title", ""))
    if isinstance(title, str) and title:
        return title
    return entity.id or entity.path


def entity_abstract(entity: Entity) -> str:
    abstract = entity.value.get("l0_abstract", "")
    return abstract if isinstance(abstract, str) else ""


def sorted_entities(entities: Any) -> list[Entity]:
    return sorted(list(entities), key=sort_key)


def sort_key(entity: Entity) -> tuple[int, str]:
    return (COLLECTION_ORDER.get(entity.collection, 99), entity.id or entity.path)


def compact_entity(entity: Entity) -> str:
    tier = entity.value.get("tier", "-")
    status = canonical_status(entity.value) or "-"
    return f"{entity.id or entity.path} [{entity.collection}] tier={tier} status={status}"
