from __future__ import annotations

from typing import Any

from rag_index import build_negative_memory_index, normalize_entity


RAW_AUTH_ENTITIES: list[dict[str, Any]] = [
    {
        "id": "GHOST-005",
        "collection": "ghosts",
        "tier": "hot",
        "status": "ACTIVE",
        "title": "Cookie-only browser auth",
        "abstract": "Browser JWT secrets must stay in HttpOnly cookies; never store tokens in localStorage or browser storage.",
        "incoming": ["JOURNAL-058"],
        "outgoing": ["PAT-027"],
        "value": {
            "date": "2026-05-26",
            "scope": "auth security",
            "l0_abstract": "Access and refresh tokens for browser clients belong in HttpOnly SameSite cookies, not localStorage, sessionStorage, Redux, or any JavaScript-readable browser store.",
            "l2_details": "The approved browser pattern is cookie-only with CSRF protection. Storing JWT client-side makes XSS credential theft permanent.",
            "ne_pas_reproposer": [
                "mettre JWT en localStorage",
                "stocker token côté client",
                "utiliser sessionStorage pour les tokens",
            ],
            "alternatives_rejetees": [
                {"nom": "localStorage JWT", "raison_rejet": "JavaScript-readable token theft under XSS."}
            ],
            "evidence": {"type": "OBSERVED", "source": "JOURNAL-058"},
        },
    },
    {
        "id": "SCAR-003",
        "collection": "scars",
        "tier": "hot",
        "status": "ACTIVE",
        "title": "Refresh rotation race",
        "abstract": "Concurrent refresh requests can race; one token family must be revoked and the second request must fail cleanly.",
        "incoming": ["JOURNAL-063"],
        "outgoing": ["VAC-009"],
        "value": {
            "date": "2026-05-26",
            "scope": "auth runtime",
            "l0_abstract": "A concurrent refresh race must be handled atomically so only one refresh succeeds and reuse detection revokes the family.",
            "l2_details": "The bug appears when two refresh requests use the same current token. The repository/use case must map the loser to RefreshTokenRotationConflictError.",
            "evidence": {"type": "OBSERVED", "source": "JOURNAL-063"},
        },
    },
    {
        "id": "PAT-027",
        "collection": "patterns",
        "tier": "hot",
        "status": "ACTIVE",
        "title": "Approved HttpOnly refresh rotation",
        "abstract": "Cookies HttpOnly plus refresh rotation plus CSRF protection is an approved browser security pattern.",
        "incoming": ["GHOST-005"],
        "outgoing": [],
        "value": {
            "date": "2026-05-26",
            "scope": "auth security",
            "approved": True,
            "l0_abstract": "Cookies HttpOnly with refresh rotation and CSRF validation are approved for browser auth.",
            "l2_details": "This approval applies to the storage and transport pattern, not to ignoring refresh-race handling.",
            "evidence": {"type": "OBSERVED", "source": "JOURNAL-074"},
        },
    },
]


def build_auth_test_index() -> dict[str, Any]:
    entities = [normalize_entity(entity, position) for position, entity in enumerate(RAW_AUTH_ENTITIES)]
    negative_index = build_negative_memory_index(RAW_AUTH_ENTITIES)
    return {
        "version": 2,
        "mode": "bm25",
        "source": "rag-test-fixture",
        "entities": entities,
        "negative_memory_index": negative_index,
        "stats": {"entities": len(entities), "negative_terms": len(negative_index)},
    }
