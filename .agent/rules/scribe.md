---
trigger: always_on
---

# SCRIBE — REGLE ALWAYS-ON

Ce fichier est une regle courte pour les LLM hotes. Il ne remplace pas le
protocole complet.

## Source canonique

- CLI canonique: `.agent/workflow/scribe-engineering-local-causal-retrieval/scribe`
- Protocole canonique: `.agent/workflow/scribe-engineering-local-causal-retrieval/docs/scribe.md`
- Regles locales: `.agent/workflow/scribe-engineering-local-causal-retrieval/docs/AGENTS.md`
- Installation multi-agent: `.agent/workflow/scribe-engineering-local-causal-retrieval/docs/multi-agent-installation.md`

Ne jamais utiliser `.agent/workflows/scribe.md` ni
`docs/archive/scribe.v3.1.md.old` comme source active. Ce sont des chemins
historiques ou archives.

## Reflexe de demarrage

Depuis la racine du projet:

```bash
.agent/workflow/scribe-engineering-local-causal-retrieval/scribe bootstrap
.agent/workflow/scribe-engineering-local-causal-retrieval/scribe sync --agent <name> --type <extension|cli|api|unknown>
.agent/workflow/scribe-engineering-local-causal-retrieval/scribe context --mode quick
```

`bootstrap` est idempotent. Il initialise seulement ce qui manque:
`AGENT-MEMOIRE_PROJECT_STATUS.scribe`, `scribe-out/`, `state.json`,
`.graphifyignore` et le bloc gere de `AGENTS.md`.

## Reflexe avant mutation SCRIBE

Avant toute commande qui modifie la memoire:

```bash
.agent/workflow/scribe-engineering-local-causal-retrieval/scribe doctor --suggest-fix
.agent/workflow/scribe-engineering-local-causal-retrieval/scribe lock acquire --agent <name> --type <extension|cli|api|unknown> --session <JOURNAL-ID>
```

Apres validation:

```bash
.agent/workflow/scribe-engineering-local-causal-retrieval/scribe doctor --suggest-fix
.agent/workflow/scribe-engineering-local-causal-retrieval/scribe sync --repair --agent <name> --type <extension|cli|api|unknown> --session <JOURNAL-ID>
.agent/workflow/scribe-engineering-local-causal-retrieval/scribe lock release --agent <name>
```

Les commandes read-only (`context`, `query`, `explain`, `related`, `stats`,
`doctor`) ne doivent pas etre bloquees par le lock.

## Separation Graphify / SCRIBE

- Graphify = structure du code: quoi, ou, comment.
- SCRIBE = causalite: pourquoi, douleur, decision, cicatrice.

Ne pas ecrire dans SCRIBE ce que Graphify peut deduire du code. Ecrire un
SCAR ou un GHOST seulement si l'information evitera une vraie souffrance au
prochain agent.

## Intention finale obligatoire

Avant de fermer une vraie session de coding, poser cette question:

> "Qu'est-ce qui fera souffrir le prochain LLM si je ne le documente pas ?"

Si la reponse est une douleur concrete, la graver en SCAR ou GHOST. Sinon, le
JOURNAL suffit.
