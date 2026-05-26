# Regles Canoniques D'Ecriture Des Use Cases

Derniere verification: 2026-05-21.

Ce document definit comment ecrire les fichiers sous `src/core/application/useCases`. Il complete `docs/core/application/README.md` et doit etre applique avant toute creation ou modification de use case.

## Principe Central

La couche `application` orchestre une intention metier. Elle depend du domaine, pas des details techniques.

```text
Autorise:
  application -> core/domain/repositories
  application -> core/domain/types
  application -> core/domain/schemas
  application -> core/domain/enums

Interdit:
  application -> core/infrastructure
  application -> core/presentation
  application -> app
  application -> react
  application -> next
  application -> @reduxjs/toolkit
  application -> fetch / axios
```

Un use case ne sait pas si la donnee vient de RTK Query, d'un mock, d'un proxy Next.js, d'une API Django ou d'un cache. Il connait seulement un contrat repository du domaine.

## Pattern Actif

Le pattern actif dans ce projet est une factory function qui recoit un repository abstrait et retourne un objet avec `execute`.

```typescript
export const createCommandUseCase = (
  commandRepository: ICommandRepository
) => ({
  execute: async (payload: CreateCommandType): Promise<CommandType> => {
    const validationResult = createCommandSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new Error("Les donnees fournies sont invalides.");
    }

    return commandRepository.createCommand(validationResult.data);
  }
});
```

Ce pattern permet:

- injection de dependance depuis la presentation;
- test unitaire avec repository fake;
- absence d'import infrastructure;
- validation centralisee par schema domaine;
- API simple pour les hooks de presentation.

## Responsabilites D'Un Use Case

Un use case peut:

- valider les payloads avec un schema Zod du domaine;
- normaliser une intention metier simple;
- appeler une ou plusieurs methodes du repository injecte;
- transformer une erreur technique en erreur metier generique;
- retourner une promesse ou declencher une action de chargement selon le contrat actuel.

Un use case ne doit pas:

- construire une URL;
- appeler `/api/proxy`;
- utiliser `fetch`, `axios`, RTK Query ou Redux Toolkit;
- lire `process.env`;
- manipuler le store Redux;
- utiliser un hook React;
- connaitre `baseApi`, `baseQuery`, `createApi`, `useQuery`, `useMutation`;
- contenir de logique UI, toast, modal, routing ou traduction d'ecran.

## Validation

Tout payload entrant doit etre valide avec le schema domaine correspondant.

Pattern attendu:

```typescript
const validationResult = schema.safeParse(payload);

if (!validationResult.success) {
  throw new Error("Message metier generique.");
}

return repository.action(validationResult.data);
```

Regles:

- utiliser `validationResult.data`, pas le payload brut;
- ne pas propager les details Zod au client par defaut;
- garder les messages d'erreur generiques si les details contiennent des donnees sensibles;
- ne pas dupliquer les regles de validation deja presentes dans le schema.

## Erreurs

Le use case transforme les erreurs en langage metier. Il ne doit pas exposer une erreur infrastructure brute.

### Autorise

```typescript
throw new Error("Les donnees fournies sont invalides.");
```

### A eviter

```typescript
throw validationResult.error;
throw new Error(JSON.stringify(validationResult.error.flatten()));
```

Les details de validation peuvent etre logs en developpement si necessaire, mais le contrat public du use case doit rester stable et non verbeux.

## Logging

Le code actuel contient des `console.error` et `console.info` dans plusieurs use cases. C'est acceptable comme etat historique, mais ce n'est pas le standard cible.

Standard cible:

- pas de logging obligatoire dans le use case;
- si logging necessaire, injecter une abstraction de logger ou logger dans la couche appelante;
- ne jamais logger de secret, token, mot de passe ou payload sensible complet;
- privilegier un message generique cote erreur propagee.

## Queries Vs Mutations

Les mutations retournent generalement une `Promise<T>`.

Exemples:

```text
createCommand -> Promise<CommandType>
updateCompany -> Promise<CompanyType>
login -> Promise<AuthResponse>
```

Les queries de chargement sont actuellement modelisees comme des triggers synchrones dans certains repositories:

```text
loadCommands(params): void
loadCurrentUser(): void
loadAllCompanies(params): void
```

Cette forme existe car l'infrastructure active repose sur des hooks RTK Query. Elle est toleree, mais elle rend le contrat repository plus proche de la presentation que d'une application pure.

Standard cible long terme:

```text
getCommands(params): Promise<PaginatedCommandsResponse>
getCurrentUser(): Promise<MinimalUserResponse>
```

ou alors documenter explicitement que le repository expose un mode "reactive query trigger" pour les hooks UI.

## Nommage

### Fichiers

Deux styles existent aujourd'hui:

```text
create-command.use-case.ts
createCompany.use-case.ts
```

Standard recommande pour les nouveaux fichiers:

```text
verb-entity.use-case.ts
```

Exemples:

```text
create-command.use-case.ts
get-company-by-id.use-case.ts
request-password-reset.use-case.ts
```

Ne pas renommer l'existant sans refactor dedie, pour eviter du churn.

### Exports

Pattern attendu:

```typescript
export const createCommandUseCase = (...)
```

Le fichier `index.ts` de chaque famille doit uniquement re-exporter les use cases.

## Ordre Interne D'Un Use Case

1. Imports domaine.
2. Factory function recevant le repository.
3. Methode `execute`.
4. Validation Zod si payload ou params.
5. Appel repository.
6. Retour typé.

## Tests

Un use case doit pouvoir etre teste sans:

- React;
- Redux store;
- RTK Query;
- Next.js;
- reseau;
- variables d'environnement.

Test minimal attendu:

- payload valide -> appelle le repository avec `validationResult.data`;
- payload invalide -> leve une erreur generique;
- repository fake -> permet de verifier le retour.

## Checklist Avant Merge

- Le use case n'importe que le domaine.
- Le repository est injecte, jamais instancie.
- Le payload est valide par Zod quand un schema existe.
- Le use case appelle le repository avec les donnees validees.
- L'erreur propagee est stable et non sensible.
- Aucun `fetch`, `axios`, hook React, RTK Query ou Redux Toolkit.
- Le fichier exporte une factory `...UseCase`.
- Le barrel `index.ts` exporte le use case si la famille utilise un barrel.

## Ecarts Actifs A Corriger

Ces ecarts sont connus au 2026-05-21.

| ID | Zone | Probleme | Correction attendue |
| --- | --- | --- | --- |
| APP-GAP-001 | `useCases/*` | Plusieurs use cases loggent directement via `console.error` / `console.info` | Centraliser le logging dans la couche appelante ou injecter une abstraction |
| APP-GAP-002 | `get*UseCase` | Certains use cases de lecture retournent `void` et declenchent un repository reactif | Decider explicitement entre contrat query pur `Promise<T>` et trigger reactif documente |
| APP-GAP-003 | `company/*` vs `command/*` | Nommage fichier mixte camelCase et kebab-case | Standardiser les nouveaux fichiers en `verb-entity.use-case.ts` sans renommer l'existant hors refactor dedie |
| APP-GAP-004 | `repositories` consommes par application | Les contrats domaine exposent encore des formes proches de RTK Query | Corriger d'abord le domaine avec `DomainRepositoryError` et contrats plus neutres |
