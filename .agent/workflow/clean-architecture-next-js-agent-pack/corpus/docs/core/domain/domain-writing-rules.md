# Regles Canoniques D'Ecriture Du Domaine

Derniere verification: 2026-05-21.

Ce document definit comment ecrire les fichiers sous `src/core/domain`. Il complete `docs/core/domain/README.md` et doit etre applique avant toute creation ou modification de:

- `entities/*`
- `schemas/*`
- `types/*`
- `repositories/*`
- `enums/*`

## Principe Central

Le domaine est la loi metier stable. Il ne connait pas React, Next.js, Redux Toolkit, RTK Query, NextAuth, le proxy HTTP, ni les composants UI.

```text
Autorise:
  domain -> domain
  domain -> zod

Interdit:
  domain -> presentation
  domain -> infrastructure
  domain -> app
  domain -> react
  domain -> next
  domain -> @reduxjs/toolkit
  domain -> next-auth
```

## Structure Attendue

```text
src/core/domain/
├── entities/       objets metier stables
├── schemas/        validation Zod des payloads et responses
├── types/          types derives des schemas et types transverses
├── repositories/   contrats abstraits consommes par les use cases
└── enums/          vocabulaires metier fermes
```

## `entities/*`

Une entite represente un concept metier stable. Elle doit rester proche du langage metier et loin des details API.

### Autorise

- `interface` ou `type` TypeScript.
- types primitifs (`string`, `number`, `boolean`, `null`).
- enums du domaine.
- objets imbriques si ce sont de vrais concepts metier.

### Interdit

- types RTK Query;
- `FetchBaseQueryError`;
- hooks;
- `URL` si le backend renvoie une string URL;
- noms lies a un formulaire UI;
- champs qui contredisent le schema Zod actif.

### Regle D'Alignement

Si une entite et un schema modelisent la meme reponse API, leurs nullabilites et types doivent correspondre.

Exemple de divergence a corriger:

```text
User.phone dans entity: number
User.phone dans schema: string
```

Le domaine doit choisir une seule verite. Pour un telephone, `string` est generalement preferable car les indicatifs, zeros initiaux et formats internationaux ne sont pas des nombres.

## `schemas/*`

Les schemas Zod valident les donnees entrant ou sortant du systeme.

### Responsabilite

- payloads de creation;
- payloads de mise a jour;
- params de requete;
- responses API si elles sont validees;
- contraintes metier basiques.

### Regles

- Les schemas doivent rester dans le vocabulaire metier ou API, pas dans le vocabulaire UI.
- Les messages d'erreur peuvent etre en francais si le schema est directement utilise pour des formulaires.
- Les schemas de formulaire fortement UI doivent etre separes clairement des schemas API.
- Les `partial()` doivent etre reserves aux PATCH ou aux etapes partielles explicites.
- Un champ nullable dans l'API doit etre encode avec `.nullable()`.
- Un champ optionnel absent du payload doit etre encode avec `.optional()`.

## `types/*`

Les types doivent etre derives des schemas quand un schema existe.

Pattern attendu:

```typescript
export type CommandType = z.infer<typeof commandSchema>;
export type CreateCommandType = z.infer<typeof createCommandSchema>;
export type UpdateCommandType = z.infer<typeof updateCommandSchema>;
```

### Regles

- Ne pas dupliquer manuellement un type deja derivable d'un schema.
- Les types de pagination utilisent `PaginatedResponse<T>`.
- Les DTOs API doivent etre nommes selon leur role: `CreateXPayload`, `UpdateXPayload`, `XListRequestParams`.
- Les types de formulaire peuvent exister ici seulement si le formulaire est un contrat metier durable. Sinon, les garder cote presentation.

## `repositories/*`

Un repository du domaine est un contrat abstrait. Il dit ce que l'application peut faire, pas comment l'infrastructure le fait.

### Autorise

- methodes metier abstraites;
- `Promise<T>`;
- types du domaine;
- etats generiques si le contrat est volontairement oriente UI.

### Interdit

- `import('@reduxjs/toolkit/query').FetchBaseQueryError`;
- `SerializedError` depuis Redux Toolkit;
- hooks RTK Query;
- types `QueryDefinition`, `MutationDefinition`, `BaseQueryFn`;
- references au proxy ou a `/api/proxy`;
- details de cache RTK Query.

### Erreurs

Le domaine doit exposer un type d'erreur neutre.

Pattern recommande:

```typescript
export type DomainRepositoryError = {
  status?: number | string;
  message?: string;
  code?: string;
  details?: unknown;
};
```

Les repositories peuvent ensuite exposer:

```typescript
error?: DomainRepositoryError;
mutationError?: DomainRepositoryError;
```

L'adaptation depuis `FetchBaseQueryError` vers `DomainRepositoryError` doit etre faite dans `src/core/infrastructure`, pas dans `src/core/domain`.

## `enums/*`

Les enums representent un vocabulaire metier ferme.

Regles:

- garder les noms stables;
- eviter les libelles UI;
- eviter de dupliquer une union Zod sans raison;
- documenter la source si l'enum vient d'une API externe.

## Flux De Creation D'Une Nouvelle Famille Domaine

Ordre recommande:

1. Creer ou mettre a jour les enums.
2. Ecrire le schema Zod canonique.
3. Deriver les types depuis le schema.
4. Ecrire l'entite seulement si elle ajoute une notion metier stable.
5. Ecrire l'interface repository avec uniquement des types domaine.
6. Implementer l'infrastructure ensuite.
7. Ajouter les use cases application.
8. Brancher la presentation.

## Checklist Avant Merge

- Le domaine n'importe pas `react`, `next`, `@reduxjs/toolkit`, `next-auth`, `src/app`, `core/presentation`, `core/infrastructure`.
- Les repositories n'exposent pas de types RTK Query.
- Les entites et schemas ne se contredisent pas sur `string` vs `number`, nullable vs required.
- Les types sont derives de Zod quand possible.
- Les schemas UI sont separes des schemas API quand leurs champs divergent.
- Les erreurs infrastructure sont adaptees avant d'entrer dans le domaine.

## Ecarts Actifs A Corriger

Ces ecarts sont connus au 2026-05-21.

| ID | Zone | Probleme | Correction attendue |
| --- | --- | --- | --- |
| DOMAIN-GAP-001 | `repositories/*` | Les contrats exposent `FetchBaseQueryError` et `SerializedError` depuis Redux Toolkit | Introduire un `DomainRepositoryError` neutre et mapper les erreurs dans l'infrastructure |
| DOMAIN-GAP-002 | `user.entity.ts` / `user.schema.ts` | `phone` est `number` dans l'entite mais `string` dans le schema | Unifier en `string` si l'API et les formulaires manipulent des numeros de telephone |
| DOMAIN-GAP-003 | `user.entity.ts` / `user.schema.ts` | `profile.file` obligatoire dans l'entite mais nullable dans le schema | Aligner l'entite sur la reponse API reelle ou creer deux types distincts |
| DOMAIN-GAP-004 | `company.entity.ts` / `company.schema.ts` | `institution` optionnelle/null cote entite mais requise cote schema | Separer `CompanyDraft`/payload formulaire et `Company` persistante, ou aligner la nullabilite |
| DOMAIN-GAP-005 | `company.schema.ts` | `signupSchema` melange contrat API company et champs de formulaire UI francises | Isoler les schemas de formulaire dans la presentation si ce n'est pas un contrat metier durable |
