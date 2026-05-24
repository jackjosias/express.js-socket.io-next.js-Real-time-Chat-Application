from __future__ import annotations

import re
import unicodedata
from collections import Counter
from dataclasses import dataclass
from typing import Any

from scribe_doctor_model import Entity


SEARCH_FIELDS = (
    "id",
    "titre",
    "title",
    "l0_abstract",
    "pourquoi",
    "virus",
    "antidote",
    "contexte",
    "l2_details",
    "plan_remboursement",
    "scope",
    "status",
    "tier",
)
SYNONYMS = {
    "archive": {"archival", "archiver", "retention", "cold"},
    "dashboard": {"tableau", "visualisation", "ui", "html"},
    "fiabilite": {"reliability", "reliable", "robustesse", "robust"},
    "friction": {"ritual", "rituel", "overhead", "lenteur", "temps"},
    "graph": {"graphe", "graphify", "structure", "structural"},
    "memoire": {"memory", "scribe", "causal", "causale"},
    "perf": {"performance", "speed", "latency", "rapide", "temps"},
    "performance": {"perf", "speed", "latency", "rapide"},
    "query": {"search", "recherche", "retrieval", "rag"},
    "regression": {"breakage", "rollback", "risk", "risque"},
    "securite": {"security", "auth", "abuse", "attack"},
    "tooling": {"bundle", "adapter", "install", "shim"},
}
MIN_RELEVANCE_SCORE = 6


@dataclass(frozen=True)
class SearchDoc:
    entity: Entity
    text: str
    title: str
    abstract: str
    tokens: set[str]
    token_counts: dict[str, int]


def build_search_doc(entity: Entity, title: str, abstract: str) -> SearchDoc:
    text = entity_text(entity)
    tokens = expand_tokens(tokenize(text))
    return SearchDoc(entity, text, title, abstract, tokens, dict(Counter(tokens)))


def entity_text(entity: Entity) -> str:
    parts = [entity.id or "", entity.collection]
    for field in SEARCH_FIELDS:
        parts.extend(flatten_strings(entity.value.get(field)))
    evidence = entity.value.get("evidence")
    if isinstance(evidence, dict):
        parts.extend(flatten_strings(evidence.get("observable")))
    return " ".join(part for part in parts if part)


def flatten_strings(value: Any) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        items: list[str] = []
        for child in value:
            items.extend(flatten_strings(child))
        return items
    if isinstance(value, dict):
        items: list[str] = []
        for child in value.values():
            items.extend(flatten_strings(child))
        return items
    return []


def normalize_text(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text.lower())
    return "".join(char for char in decomposed if not unicodedata.combining(char))


def tokenize(text: str) -> set[str]:
    normalized = normalize_text(text)
    tokens: set[str] = set()
    for raw in re.findall(r"[a-z0-9_./-]{3,}", normalized):
        token = raw.strip("./,;:!?()[]{}")
        if len(token) >= 3:
            tokens.add(token)
    return tokens


def expand_tokens(tokens: set[str]) -> set[str]:
    expanded = set(tokens)
    for token in list(tokens):
        expanded.update(SYNONYMS.get(token, set()))
        for key, values in SYNONYMS.items():
            if token in values:
                expanded.add(key)
    return expanded


def score_doc(doc: SearchDoc, query: str, query_tokens: set[str]) -> int:
    normalized_query = normalize_text(query)
    entity_id = normalize_text(doc.entity.id or "")
    haystack = normalize_text(doc.text)
    title = normalize_text(doc.title)
    abstract = normalize_text(doc.abstract)
    score = 0
    if normalized_query == entity_id:
        score += 120
    if normalized_query and normalized_query in title:
        score += 35
    if normalized_query and normalized_query in abstract:
        score += 18
    if normalized_query and normalized_query in haystack:
        score += 10
    overlap = query_tokens & doc.tokens
    score += sum(min(doc.token_counts.get(token, 0), 3) for token in overlap) * 3
    if overlap and str(doc.entity.value.get("tier", "")).lower() == "hot":
        score += 2
    return score if score >= MIN_RELEVANCE_SCORE else 0
