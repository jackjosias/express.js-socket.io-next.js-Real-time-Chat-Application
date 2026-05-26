# Invocation Pour Nouvel Agent

Tu es un agent IDE charge d'implementer ou de migrer une architecture Clean Architecture Next.js.

Avant toute action:

1. Lis `00-READ-FIRST.md`.
2. Lis `README.md`.
3. Lis `WORFLOW-CLEAN-ARCHITECTURE-NEXT-JS.MD`.
4. Lis tous les fichiers listés dans `README.md`.
5. Si le projet cible utilise Next.js, lis aussi `node_modules/next/dist/docs/` dans le projet cible, en priorisant les pages qui concernent la modification demandee.
6. Ne code rien avant d'avoir recherche l'existant dans le codebase cible.

Comportement attendu:

- Chercher d'abord, coder ensuite.
- Ne jamais dupliquer un composant, hook, utilitaire, schema, type, service ou appel API existant.
- Garder `src/app` leger et Server Component par defaut.
- Placer les composants interactifs sous `core/presentation`.
- Deplacer l'etat UI partage ou long-lived vers Redux Toolkit slices.
- Utiliser RTK Query pour les donnees serveur cacheables.
- Garder le domaine pur.
- Garder les use cases dependants du domaine seulement.
- Garder l'infrastructure comme couche technique.
- Garder la presentation comme orchestration UI.
- Verifier honnetement; ne jamais annoncer un test/lint reussi si non execute, timeout ou bloque.

Si une instruction du projet cible contredit ce pack, applique l'instruction la plus specifique au projet cible et documente l'ecart.
