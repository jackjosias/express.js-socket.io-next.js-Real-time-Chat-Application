---
trigger: always_on
---

# SCRIBE — REGLE ALWAYS-ON

Ce fichier est une regle courte pour les LLM hotes. Il ne remplace pas le
protocole complet.

## Source canonique

- Racine portable unique: `.agent/workflow/scribe/`
- CLI maintenance interne: `.agent/workflow/scribe/scribe`
- CLI lecture agent: `.agent/workflow/scribe/scribe-rag`
- Protocole complet: `.agent/workflow/scribe/sel/docs/scribe.md`
- Regles locales: `.agent/workflow/scribe/sel/docs/AGENTS.md`
- Installation multi-agent: `.agent/workflow/scribe/sel/docs/multi-agent-installation.md`

Tout chemin SCRIBE hors de `.agent/workflow/scribe/` est non canonique. Ne pas
creer de dossier de compatibilite visible; corriger les anciens appels vers les
commandes ci-dessus.

## Reflexe de demarrage

Depuis la racine du projet:

```bash
.agent/workflow/scribe/scribe bootstrap
.agent/workflow/scribe/scribe sync --agent <name> --type <extension|cli|api|unknown>
.agent/workflow/scribe/scribe-rag build
.agent/workflow/scribe/scribe-rag context
```

`bootstrap` est idempotent. Il initialise seulement ce qui manque:
`AGENT-MEMOIRE_PROJECT_STATUS.scribe`, `scribe-out/`, `state.json`,
`.graphifyignore` et le bloc gere de `AGENTS.md`. Il ne lance aucun daemon.

## Dashboard SCRIBE

```bash
.agent/workflow/scribe/scribe dashboard
.agent/workflow/scribe/scribe dashboard --serve --host 127.0.0.1 --port 8765
```

`dashboard` genere un HTML statique dans `scribe-out/`. `dashboard --serve`
lance a la demande un serveur HTTP local leger (`ThreadingHTTPServer`) pour vue
live/reload; ce processus s'arrete avec Ctrl+C et n'est jamais demarre par
`bootstrap`.

## Reflexe avant mutation SCRIBE

Avant toute commande qui modifie la memoire:

```bash
.agent/workflow/scribe/scribe doctor --suggest-fix
.agent/workflow/scribe/scribe lock acquire --agent <name> --type <extension|cli|api|unknown> --session <JOURNAL-ID>
```

Apres validation:

```bash
.agent/workflow/scribe/scribe doctor --suggest-fix
.agent/workflow/scribe/scribe sync --repair --agent <name> --type <extension|cli|api|unknown> --session <JOURNAL-ID>
.agent/workflow/scribe/scribe lock release --agent <name>
```

Les commandes SEL read-only de maintenance (`explain`, `related`, `stats`, `doctor`)
ne doivent pas etre bloquees par le lock. Pour le retrieval agent, ne pas appeler
`scribe context` ni `scribe query` directement; utiliser `scribe-rag`.

## Separation Graphify / SCRIBE

- Graphify = structure du code: quoi, ou, comment.
- SCRIBE = causalite: pourquoi, douleur, decision, cicatrice.

Ne pas ecrire dans SCRIBE ce que Graphify peut deduire du code. Ecrire un
SCAR ou un GHOST seulement si l'information evitera une vraie souffrance au
prochain agent.

## Hygiene Git / push

- Scope par defaut: le code produit du projet hote.
- `AGENT-MEMOIRE_PROJECT_STATUS.scribe`: a versionner seulement si l'equipe
  veut partager la memoire causale entre agents et humains.
- `graphify-out/`: ne pas versionner par defaut; c'est un graphe genere,
  reconstructible avec `graphify update .`.
- `scribe-out/`: ne pas versionner par defaut; c'est de l'etat runtime local
  (index, locks, rapports, dashboards, exports, sync metadata).
- `.agent/`: a versionner seulement quand l'equipe maintient volontairement
  l'outillage agentique; sinon le garder hors des commits produit.

Avant livraison, utiliser `.agent/workflow/scribe/scribe worktree` pour separer source
reelle, memoire causale validee, tooling volontaire et bruit genere.

## Intention finale obligatoire

Avant de fermer une vraie session de coding, poser cette question:

> "Qu'est-ce qui fera souffrir le prochain LLM si je ne le documente pas ?"

Si la reponse est une douleur concrete, la graver en SCAR ou GHOST. Sinon, le
JOURNAL suffit.
