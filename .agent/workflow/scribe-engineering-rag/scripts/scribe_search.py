from __future__ import annotations

import re
import unicodedata
from collections import Counter
from difflib import SequenceMatcher
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
    "fiabilite": {"reliability", "reliable", "robustesse", "robust", "surete", "resilience"},
    "friction": {"ritual", "rituel", "overhead", "lenteur", "lent", "surcout", "temps"},
    "graph": {"graphe", "graphify", "structure", "structural"},
    "memoire": {"memory", "scribe", "causal", "causale", "historique"},
    "perf": {"performance", "speed", "latency", "rapide", "temps"},
    "performance": {"perf", "speed", "latency", "rapide"},
    "query": {"search", "recherche", "retrieval", "rag"},
    "regression": {"breakage", "rollback", "risk", "risque", "casse", "perte"},
    "securite": {"security", "auth", "abuse", "attack"},
    "tooling": {"bundle", "adapter", "install", "shim"},
}
MIN_RELEVANCE_SCORE = 6
FUZZY_MIN_TOKEN_LENGTH = 5
FUZZY_MATCH_RATIO = 0.86
FUZZY_MATCH_SCORE = 6
FUZZY_MAX_EDIT_DISTANCE = 2
TOKEN_SUFFIXES = (
    "ements",
    "ement",
    "ations",
    "ation",
    "iques",
    "ique",
    "ites",
    "ite",
    "ale",
    "aux",
    "es",
    "s",
)


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


def token_root(token: str) -> str:
    if token.endswith("aux") and len(token) > 5:
        return token[:-3] + "al"
    if token.endswith("ale") and len(token) > 5:
        return token[:-1]
    for suffix in TOKEN_SUFFIXES:
        if token.endswith(suffix) and len(token) - len(suffix) >= 4:
            return token[: -len(suffix)]
    return token


def fuzzy_token_matches(query_tokens: set[str], doc_tokens: set[str]) -> set[str]:
    matches: set[str] = set()
    for query_token in query_tokens - doc_tokens:
        if not is_fuzzy_candidate(query_token):
            continue
        query_root = token_root(query_token)
        for doc_token in doc_tokens:
            if not is_fuzzy_candidate(doc_token):
                continue
            if abs(len(query_token) - len(doc_token)) > max(2, len(query_token) // 3):
                continue
            if tokens_are_fuzzy_match(query_root, token_root(doc_token), query_token, doc_token):
                matches.add(query_token)
                break
    return matches


def tokens_are_fuzzy_match(query_root: str, doc_root: str, query_token: str, doc_token: str) -> bool:
    if query_root == doc_root:
        return True
    if SequenceMatcher(None, query_token, doc_token).ratio() >= FUZZY_MATCH_RATIO:
        return True
    return edit_distance_at_most(query_token, doc_token, FUZZY_MAX_EDIT_DISTANCE)


def edit_distance_at_most(left: str, right: str, maximum: int) -> bool:
    previous = list(range(len(right) + 1))
    for left_index, left_char in enumerate(left, start=1):
        current = [left_index]
        row_minimum = current[0]
        for right_index, right_char in enumerate(right, start=1):
            cost = 0 if left_char == right_char else 1
            current.append(min(previous[right_index] + 1, current[-1] + 1, previous[right_index - 1] + cost))
            row_minimum = min(row_minimum, current[-1])
        if row_minimum > maximum:
            return False
        previous = current
    return previous[-1] <= maximum


def is_fuzzy_candidate(token: str) -> bool:
    return len(token) >= FUZZY_MIN_TOKEN_LENGTH and not any(char in token for char in "./-_0123456789")


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
    fuzzy_overlap = fuzzy_token_matches(query_tokens, doc.tokens) if query_tokens else set()
    score += sum(min(doc.token_counts.get(token, 0), 3) for token in overlap) * 3
    score += min(len(fuzzy_overlap), 3) * FUZZY_MATCH_SCORE
    if (overlap or fuzzy_overlap) and str(doc.entity.value.get("tier", "")).lower() == "hot":
        score += 2
    return score if score >= MIN_RELEVANCE_SCORE else 0
