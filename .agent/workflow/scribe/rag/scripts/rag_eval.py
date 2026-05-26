from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from rag_challenge import challenge
from rag_compact import format_results
from rag_context import context
from rag_scoring import retrieve

@dataclass(frozen=True)
class EvalResult:
    name: str
    passed: bool
    detail: str


def run_eval(index: dict[str, Any]) -> list[EvalResult]:
    checks: list[EvalResult] = []
    ids = lambda results: [str(result.entity.get("id")) for result in results]
    token_results = retrieve("stocker token côté client", index, top_k=5)
    checks.append(EvalResult("semantic-token-client", "GHOST-005" in ids(token_results) or "DEBT-003" in ids(token_results), ", ".join(ids(token_results))))
    refresh_results = retrieve("bug concurrent refresh", index, top_k=5)
    checks.append(EvalResult("semantic-refresh-race", "SCAR-003" in ids(refresh_results), ", ".join(ids(refresh_results))))
    local_results = retrieve("ne jamais utiliser localStorage", index, top_k=5)
    checks.append(EvalResult("negative-localstorage-query", "GHOST-005" in ids(local_results) or "DEBT-003" in ids(local_results), ", ".join(ids(local_results))))
    cookie_results = retrieve("auth cookies HttpOnly", index, top_k=5)
    checks.append(EvalResult("semantic-cookie-auth", "GHOST-005" in ids(cookie_results), ", ".join(ids(cookie_results))))
    verdict, _ = challenge("mettre JWT en localStorage", index)
    checks.append(EvalResult("challenge-localstorage-stop", verdict == "STOP", verdict))
    verdict, _ = challenge("mettre JWT en cookie HttpOnly", index)
    checks.append(EvalResult("challenge-cookie-proceed", verdict == "PROCEED", verdict))
    query_lines = len(format_results('SCRIBE-RAG QUERY: auth jwt', retrieve('auth jwt', index, top_k=5)).splitlines())
    checks.append(EvalResult("query-compact-lines", query_lines <= 15, str(query_lines)))
    context_lines = len(context(index).splitlines())
    checks.append(EvalResult("context-compact-lines", context_lines <= 35, str(context_lines)))
    return checks


def format_eval(checks: list[EvalResult]) -> str:
    passed = sum(1 for check in checks if check.passed)
    lines = [f"SCRIBE-RAG EVAL: {passed}/{len(checks)}"]
    for check in checks:
        lines.append(f"{'PASS' if check.passed else 'FAIL'} {check.name}: {check.detail}")
    lines.append("PHASE_9: skip" if passed == len(checks) else "PHASE_9: required")
    return "\n".join(lines)
