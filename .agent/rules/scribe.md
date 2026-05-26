---
trigger: always_on
---

# RÈGLES SCRIBE — VERSION FINALE V4

## Architecture mémorielle

- SEL = moteur interne. Ne pas l'appeler pour le retrieval agent.
- scribe-rag = seule interface agent pour lecture, contexte, query, explain et challenge.
- SCRIBE = source de vérité causale append-only.
- Graphify = source de vérité structurelle du code.

## Règle d'or

Avant toute implémentation significative :

```bash
.agent/workflow/scribe-rag/scribe-rag challenge "<plan>"
```

- `STOP` = ne pas faire.
- `REVIEW` = lire puis décider explicitement.
- `PROCEED` = faire.

## Ce que le SCRIBE documente

À écrire dans SCRIBE :
- Pourquoi on a choisi X plutôt que Y.
- Ce bug arrive quand on oublie Z.
- Cette approche a échoué parce que W.
- Ne jamais reproposer cette option.

À ne pas écrire dans SCRIBE :
- Le fichier X importe Y; Graphify le sait.
- La fonction Z fait A; Graphify le sait.
- La lib X est en version Y; le package manager le sait.

## Signal Hybrid

Si `scribe-rag eval --force` retourne moins de `7/8` :

```bash
pip install sentence-transformers --break-system-packages
.agent/workflow/scribe-rag/scribe-rag build --with-embeddings --force
```

BM25 reste canonique tant que l'eval reste `>= 7/8`.

## Multi-agent

- 1 surface = 1 agent maximum.
- Lock SEL avant toute écriture SCRIBE.
- `scribe sync` avant tout travail et après toute réparation mémoire.
- `scribe worktree --strict` avant livraison.
- Les agents ne lisent jamais le `.scribe` directement; ils utilisent scribe-rag.

## Commandes interdites pour retrieval agent

- `.agent/workflow/scribe-engineering-local-causal-retrieval/scribe context`
- `.agent/workflow/scribe-engineering-local-causal-retrieval/scribe query`
- `.agent/workflow/scribe-engineering-local-causal-retrieval/scribe explain`
- SEL direct challenge
- Archiver SEL tant que scribe-rag l'utilise
