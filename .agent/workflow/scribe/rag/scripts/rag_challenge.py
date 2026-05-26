from __future__ import annotations

from typing import Any

from rag_compact import entity_label
from rag_scoring import FAILURE_WORDS, retrieve
from rag_text import compact, tokenize


def challenge(plan: str, index: dict[str, Any], *, limit: int = 5) -> tuple[str, list[str]]:
    results = retrieve(plan, index, top_k=limit, mode="challenge")
    negative = []
    for result in results:
        for match in result.negative_matches:
            negative.append((result, match))
    if negative:
        lines = [f"SCRIBE-RAG CHALLENGE: {plan}", f"VERDICT: STOP"]
        for result, match in negative[:3]:
            lines.append(f"BLOCK {entity_label(result.entity)} — `{compact(str(match.get('term')), 56)}` rejeté")
        return "STOP", lines
    review = [result for result in results if result.reasons.get("failure", 0.0) >= 0.5 and result.score >= 0.45]
    approved = [result for result in results if result.entity.get("approved") and result.score >= 0.45]
    literal_failure_terms = set(tokenize(plan)) & FAILURE_WORDS
    if review and approved and not literal_failure_terms:
        lines = [f"SCRIBE-RAG CHALLENGE: {plan}", "VERDICT: PROCEED"]
        lines.append("INFO pratique approuvée, warnings de contexte non bloquants:")
        for result in approved[:3]:
            lines.append(f"INFO {entity_label(result.entity)} — {compact(result.entity.get('abstract') or '', 82)}")
        return "PROCEED", lines
    if review:
        lines = [f"SCRIBE-RAG CHALLENGE: {plan}", "VERDICT: REVIEW"]
        for result in review[:5]:
            lines.append(f"WARN {entity_label(result.entity)} — {compact(result.entity.get('abstract') or '', 82)}")
        return "REVIEW", lines
    lines = [f"SCRIBE-RAG CHALLENGE: {plan}", "VERDICT: PROCEED"]
    if results:
        lines.append("INFO mémoire pertinente non bloquante:")
        for result in results[:3]:
            lines.append(f"INFO {entity_label(result.entity)} — {compact(result.entity.get('abstract') or '', 82)}")
    else:
        lines.append("INFO aucune mémoire bloquante trouvée.")
    return "PROCEED", lines
