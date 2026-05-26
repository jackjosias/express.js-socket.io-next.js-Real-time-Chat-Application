# Development Guidelines - Algoway Front

## 🎯 Principe Fondamental : DRY (Don't Repeat Yourself)

> **⚠️ RÈGLE ABSOLUE : Avant de créer QUOI QUE CE SOIT de nouveau, vérifiez TOUJOURS si cela existe déjà quelque part dans le codebase !**

Cette règle s'applique à **TOUT** :
- Composants UI (boutons, modals, cartes, tableaux...)
- Hooks personnalisés
- Fonctions utilitaires
- Services et classes
- Styles et thèmes
- Constantes et configurations
- Types et interfaces
- Logique métier
- API calls et data fetching
- Validations et schemas
- **Tout autre élément de code**

---

## 📋 Processus Obligatoire AVANT Toute Implémentation

### ÉTAPE 1 : RECHERCHER DANS TOUT LE CODEBASE 🔍

```bash
# Recherche par nom de fonction/composant/classe
grep -r "NomRecherché" src/

# Recherche par fonctionnalité (ex: rate limit, modal, table, auth...)
grep -ri "motclé" src/

# Rechercher des fichiers par nom
find src/ -iname "*nompartiel*"

# Rechercher par type de fichier
find src/ -name "*.tsx" -exec grep -l "PatternRecherché" {} \;
```

### ÉTAPE 2 : EXPLORER TOUTES LES COUCHES �

Vérifiez **TOUTES** ces zones, sans exception :

| Couche | Chemin | Que chercher |
|--------|--------|--------------|
| **Présentation** | `src/core/presentation/` | Composants UI, pages, layouts |
| **Design System** | `src/core/presentation/components/design-system/` | Composants réutilisables |
| **Hooks** | `src/core/presentation/hooks/` | Hooks personnalisés |
| **Infrastructure** | `src/core/infrastructure/` | Services, API, stores |
| **Domain** | `src/core/domain/` | Entités, types, schemas |
| **Application** | `src/core/application/` | Use cases, logique métier |
| **Shared/Utils** | `src/shared/` | Utilitaires partagés |
| **Lib** | `src/core/presentation/lib/` | Helpers et fonctions |

### ÉTAPE 3 : DÉCISION

**SI ça existe déjà :**
1. ✅ **Réutiliser** tel quel
2. ✅ **Étendre** si besoin de fonctionnalités supplémentaires
3. ✅ **Refactoriser** pour le rendre plus flexible si nécessaire
4. ❌ **NE JAMAIS dupliquer** le code

**SI ça n'existe pas :**
1. Créer à un emplacement **centralisé et réutilisable**
2. Documenter avec des commentaires clairs
3. Penser à la réutilisabilité future

---

## ✅ Checklist Avant Commit

- [ ] J'ai cherché dans **TOUT** le codebase (pas seulement dans mon dossier)
- [ ] J'ai vérifié les composants du design system
- [ ] J'ai vérifié les hooks existants
- [ ] J'ai vérifié les utilitaires et helpers
- [ ] J'ai vérifié les services et modules d'infrastructure
- [ ] Si du code similaire existe, je l'ai **réutilisé ou étendu**
- [ ] Mon nouveau code est placé dans un **emplacement réutilisable**

---

## ⚠️ Anti-Patterns à Éviter

### ❌ MAUVAIS : Créer du code sans chercher d'abord

```typescript
// ❌ Créer un nouveau composant Button alors qu'il existe déjà
const MyButton = () => <button className="btn">...</button>

// ❌ Créer un nouveau hook useAuth alors qu'il existe déjà
const useMyAuth = () => { ... }

// ❌ Créer une fonction de formatage alors qu'elle existe dans utils
const formatDate = (date) => { ... }

// ❌ Créer un service de rate limiting alors qu'il existe déjà
class MyRateLimiter { ... }
```

### ✅ BON : Toujours importer l'existant

```typescript
// ✅ Importer le composant existant
import { Button } from '@/core/presentation/components/design-system/commons';

// ✅ Utiliser le hook existant
import { useAuthUseCase } from '@/core/presentation/hooks';

// ✅ Utiliser l'utilitaire existant
import { formatDate } from '@/shared/utils';

// ✅ Utiliser le service existant
import { checkRateLimit } from '@/core/infrastructure/security/rate/redis-rate-limiter';
```

---

## 🔧 Commandes de Recherche Utiles

```bash
# Trouver TOUS les composants qui font X
grep -rn "onClick" src/core/presentation/

# Trouver TOUS les hooks
find src/ -name "use*.ts" -o -name "use*.tsx"

# Trouver TOUTES les fonctions d'un type
grep -rn "export const" src/shared/utils/

# Trouver les imports d'un module
grep -rn "from '@/module'" src/

# Analyser les plus gros fichiers (possibles duplications)
find src/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20
```

---

## 📖 Règle d'Or

> **"Chercher d'abord, coder ensuite"**
>
> Passez 5 minutes à chercher du code existant plutôt que 30 minutes à le réécrire et créer de la dette technique.

---

## 🎓 Rappel Important

Cette directive s'applique à **TOUTES les situations** :
- Nouveau composant UI → Vérifier le design system
- Nouveau hook → Vérifier les hooks existants
- Nouvelle fonction → Vérifier utils/helpers
- Nouveau service → Vérifier infrastructure
- Nouvelle validation → Vérifier schemas existants
- Nouveau type → Vérifier types/interfaces existants
- **Etc.** pour tout autre élément de code

**Le but** : Avoir une seule source de vérité pour chaque fonctionnalité.

---

## 📝 Conventions de Commit Git (Standard FINFORM)

Pour assurer une traçabilité totale et la clarté dans notre filet de sécurité SRE, nous utilisons la convention **FINFORM / Conventional Commits** de manière restrictive et détaillée.

### 🧬 Structure Obligatoire

```text
type(nom_du_fichier_principal): description courte et descriptive en anglais

Accomplishments:

- Action isolée et à forte valeur ajoutée (mentionner le PAT-XXX ou SCAR-XXX si lié).
- Explication du "Pourquoi" pour les décisions complexes ou les refactors.
- Impact UI/UX ou correctif lié aux performances abordé.
- Liste de la couverture de test ou méthode de vérification (ex: Verified all 41 tools).
```

### 🏷️ Types Valides (Les 10 Commandements FINFORM)

1. **feat** : Commits ajoutant ou supprimant une nouvelle fonctionnalité (si un initial commit contient du code utile, c'est un `feat`).
2. **fix** : Commits corrigeant un bug.
3. **refactor** : Commits réécrivant ou restructurant le code, sans modifier le comportement de l'API/Système.
4. **perf** : Commits de refactoring spéciaux, améliorant expressément les performances.
5. **style** : Commits n'affectant pas le sens du code (espaces, formatage, points-virgules manquants, linting).
6. **test** : Commits ajoutant des tests manquants ou corrigeant des tests existants.
7. **docs** : Commits affectant uniquement la documentation.
8. **build** : Commits affectant les composants de construction (outil de build, pipeline CI, dépendances, version).
9. **ops** : Commits affectant les composants opérationnels (infra, déploiement, sauvegarde, etc.).
10. **chore** : Commits divers (ex: gitignore, tâches annexes non liées à des comportements). (Note : un "Initial commit" posant juste le dépôt sans feature est un `chore`).

### 🌟 Exemple de Commit de Production

```text
feat(TechnicalAnalysis): complete architectural migration and 41-tool drawing fidelity restoration

Accomplishments:

- Migrated legacy DrawingRendererOld to a modular, strategy-based architecture (PAT-031).
- Restored 100% visual parity for 41 tools, including complex Fibonacci donut fills.
- Overhauled hit-testing logic: centralized delegation to strategies, fixing handle index corruption.
- Centralized geometric math into TechnicalAnalysisUtils and math/geometry.ts for robust reuse.
- Verified all 41 tools across 8 categories.
```

---

## 🧠 Mini-Cours SRE Frontend 2026 : Memoization, Lazy Loading, Code Splitting

### Pourquoi cette section existe

L’objectif n’est pas de “faire plus intelligent”. L’objectif est de **réduire le coût réel en production** :
- moins de JavaScript initial
- moins de re-renders inutiles
- moins de CPU au runtime
- moins de régressions visuelles
- plus de clarté architecturale

La règle d’or :

> **Optimiser seulement quand on peut nommer précisément le coût qu’on retire.**

---

## 1. Memoization : définition simple

La memoization consiste à **réutiliser un résultat déjà calculé** au lieu de le recalculer ou de rerendre inutilement.

En React, cela prend plusieurs formes :
- `React.memo` : évite le rerender d’un composant si ses props n’ont pas changé
- `useMemo` : évite de recalculer une valeur coûteuse
- `useCallback` : stabilise l’identité d’une fonction quand cela a un impact réel

### Quand utiliser `React.memo`

Utiliser `React.memo` si :
- le composant reçoit souvent les mêmes props
- le composant est coûteux à rerendre
- il est rendu dans une zone chaude de l’interface
- ses parents rerendent fréquemment

Exemples typiques :
- overlays
- listes riches
- cartes complexes
- panneaux de configuration
- HUD graphiques

### Quand NE PAS utiliser `React.memo`

Ne pas l’utiliser si :
- le composant est trivial
- les props changent à chaque rendu
- cela ajoute plus de complexité que de valeur

### Quand utiliser `useMemo`

Utiliser `useMemo` pour :
- calculs coûteux
- filtrages lourds
- transformations de données non triviales
- objets dérivés dont l’identité stable évite des rerenders en cascade

Ne pas l’utiliser juste “par réflexe”.

### Quand utiliser `useCallback`

Utiliser `useCallback` uniquement si :
- une fonction est passée à un enfant `memo`
- une dépendance de hook doit rester stable pour éviter un effet inutile
- une identité instable casse une optimisation existante

Ne pas l’utiliser pour toutes les fonctions locales.

### Règle Algoway

Dans ce repo, on préfère :
- `React.memo` quand le composant a un vrai coût
- `useMemo` pour les calculs lisibles et justifiés
- `useCallback` seulement quand il protège un contrat d’identité

Si tu ne peux pas expliquer **quel coût précis** tu réduis, tu n’optimises pas, tu compliques.

---

## 2. Lazy Loading / Dynamic Import : définition simple

Le lazy loading consiste à **ne charger un module que lorsqu’il devient nécessaire**.

En Next.js, on l’applique avec :

```tsx
const HeavyModal = dynamic(() => import("./HeavyModal"), {
  ssr: false,
  loading: () => null,
});
```

### Quand utiliser le lazy loading

Utiliser le lazy loading pour :
- modales rarement ouvertes
- panneaux secondaires
- outils admin
- interfaces de configuration lourdes
- composants riches montés hors écran au chargement initial
- sous-systèmes optionnels

Exemples déjà pertinents dans ce projet :
- `BrokerModal`
- modales de `ModalOrchestrator`
- `TickerSelectorModal`

### Quand NE PAS utiliser le lazy loading

Ne pas l’utiliser pour :
- UI critique above-the-fold
- composants toujours visibles immédiatement
- petits composants sans poids réel
- composants dont le coût réseau supplémentaire serait pire que le gain

Exemples généralement mauvais candidats :
- header principal
- toolbar principale visible dès l’ouverture
- sidebar centrale si elle est toujours affichée

---

## 3. Code Splitting : ce que ça veut vraiment dire

Le code splitting n’est pas juste “mettre dans un autre fichier”.

### Important

**Extraction physique** ≠ **Code splitting**

Extraire un composant dans un autre fichier :
- améliore la lisibilité
- réduit le caractère monolithique
- facilite les tests

Mais cela **ne garantit pas** qu’il sera chargé plus tard.

Pour avoir un vrai gain de bundle initial, il faut souvent :
- extraction physique
- puis `dynamic()`

### Règle pratique

Si le but est :
- **lisibilité** → extraction physique suffit parfois
- **poids initial / lazy loading** → il faut `dynamic()`

---

## 4. SSR, `ssr: false` et composants client

Utiliser `ssr: false` quand le composant :
- dépend du DOM
- utilise `window`, `document`, `createPortal`
- repose sur des APIs strictement client
- ouvre une modal/portal qui n’a aucune valeur serveur

Exemples typiques :
- modales portalisées
- pickers
- popups
- composants ECharts

### Attention

Ne mets pas `ssr: false` sans raison.
Si un composant est utile côté serveur, garde le SSR.

---

## 5. CSP et styles inline

Les blocs `<style>{...}</style>` injectés dans un composant :
- compliquent la maintenance
- masquent la source réelle des styles
- violent souvent les CSP strictes sans `unsafe-inline`

### Règle

Préférer :
- `style.module.css`
- classes CSS explicites
- `:global(...)` seulement si un contrat DOM global est nécessaire

Le inline style dynamique reste acceptable pour :
- positionnement calculé runtime
- dimensions issues du DOM
- styles ultra-locaux impossibles à exprimer proprement autrement

Mais un **bloc CSS complet** ne doit pas vivre dans un composant React.

---

## 6. Matrice de décision rapide

### Cas 1 : composant lourd, rarement ouvert

Action :
- extraire dans son propre fichier
- charger avec `dynamic()`

Exemple :
- modal broker
- modal de recherche ticker

### Cas 2 : composant coûteux mais toujours visible

Action :
- garder en import normal
- optimiser avec `React.memo` si utile
- optimiser les props et calculs

Exemple :
- panneau principal visible
- toolbar critique

### Cas 3 : calcul coûteux dans un composant

Action :
- `useMemo` si le calcul est réellement cher
- sinon laisser simple

### Cas 4 : fonction passée à un enfant memo

Action :
- `useCallback` si cela évite un rerender réel

### Cas 5 : CSS global embarqué dans un composant

Action :
- déplacer vers le module CSS
- ne garder en inline que le runtime strictement nécessaire

---

## 7. Anti-patterns à éviter

### ❌ Mauvais

- Ajouter `useMemo` partout “pour optimiser”
- Ajouter `useCallback` à toutes les fonctions
- Extraire un composant puis croire que cela fait automatiquement du code splitting
- Mettre `dynamic()` sur un composant toujours visible
- Laisser un gros bloc `<style>` dans un composant
- Utiliser le lazy loading sans penser UX de chargement

### ✅ Bon

- mesurer ou identifier une zone chaude
- choisir l’outil minimal
- documenter la raison de l’optimisation
- garder la lisibilité
- éviter toute optimisation décorative

---

## 8. Checklist avant optimisation

- [ ] Quel coût exact est-ce que je réduis ?
- [ ] Le composant est-il toujours visible ou rarement utilisé ?
- [ ] L’optimisation réduit-elle vraiment le bundle initial ou seulement la taille du fichier ?
- [ ] Ai-je gardé le comportement inchangé ?
- [ ] L’optimisation complique-t-elle inutilement le code ?
- [ ] Puis-je expliquer en une phrase pourquoi cette optimisation existe ?

Si une optimisation ne passe pas cette checklist, elle n’est probablement pas mature.

---

## 9. Formulation de référence pour PR / commit

Quand vous optimisez, documentez toujours le pourquoi :

```text
refactor(TechnicalAnalysis): split modal loading paths and reduce initial widget payload

Accomplishments:

- Extracted physically rare UI branches into dedicated files for lower cognitive load.
- Switched modal branches to next/dynamic with ssr:false to reduce initial client payload.
- Preserved runtime behavior and Redux orchestration contracts.
- Verified structural wiring manually; bounded lint execution may still need a full local pass.
```

---

## 10. Résumé à retenir

> **Memoization** sert à éviter du travail inutile au runtime.
> **Lazy loading** sert à éviter de charger trop tôt du code inutile.
> **Code splitting réel** demande souvent `dynamic()`, pas juste une extraction de fichier.
> **Le bon choix dépend toujours de la fréquence d’usage, du poids, et du coût réel.**

---

## 11. Retour d’Expérience Projet : pièges concrets à éviter

Cette section documente des erreurs réelles rencontrées dans ce projet.
Le but n’est pas théorique. Le but est d’éviter qu’un futur LLM ou développeur reproduise exactement les mêmes fautes.

### Piège 1 : extraction physique sans vrai gain de chargement

Extraire un composant dans un fichier dédié améliore :
- la lisibilité
- la maintenance
- la testabilité

Mais cela ne réduit pas automatiquement le poids du bundle initial.

### Règle

Si le composant est :
- rare
- lourd
- conditionnel
- ouvert via une action utilisateur

alors la bonne stratégie est souvent :
1. extraction physique
2. puis `dynamic()`

### Exemples projet

- `BrokerModal`
- `TickerSelectorModal`
- les branches rares de `ModalOrchestrator`
- `DividendHistoryModal`

---

## 12. Portals : pattern sûr et erreurs classiques

Les composants qui utilisent `createPortal` doivent être traités comme des composants client dépendants du DOM.

### Règle d’import absolue

Toujours faire :

```tsx
import React from "react";
import { createPortal } from "react-dom";
```

Ne jamais faire :

```tsx
import React, { createPortal } from "react-dom";
```

### Pourquoi

Parce que :
- `React.FC` vient de `react`
- `createPortal` vient de `react-dom`
- mélanger les deux casse le typage TypeScript
- l’erreur peut ensuite contaminer les props destructurées et produire une cascade de `implicit any`

### Checklist portal

- [ ] Le fichier est-il en `"use client"` si nécessaire ?
- [ ] `React` vient-il bien de `react` ?
- [ ] `createPortal` vient-il bien de `react-dom` ?
- [ ] Le composant protège-t-il `document` côté client ?
- [ ] Si la branche est rare, est-elle chargée via `dynamic(..., { ssr: false })` ?

---

## 13. Hiérarchie de vérité : API d’abord, fallback ensuite

Un fallback n’est pas une source de vérité.
Un fallback est une stratégie de dégradation contrôlée.

### Règle

Quand une donnée vient normalement d’une API :
- l’API est la source de vérité
- le fallback local sert uniquement à éviter une panne UX totale
- l’interface ne doit jamais laisser croire qu’un fallback statique vaut une donnée live

### Cas projet : conversion de devise

Dans ce projet :
- le hook de conversion interroge l’API de taux
- les constantes locales comme `FALLBACK_RATES` ne doivent servir qu’en secours

### Ce qu’il faut retenir

- ne jamais bâtir une logique métier entière sur un fallback
- nommer explicitement le statut si possible : `api`, `fallback`, `same-currency`, `unavailable`
- en cas d’ambiguïté, préférer afficher une dégradation honnête plutôt qu’une précision fictive

---

## 14. Vérification honnête : un timeout n’est pas un succès

En refactor SRE, une des fautes les plus dangereuses consiste à confondre :
- “je pense que c’est bon”
- “j’ai effectivement vérifié”

### Règle

Ne jamais écrire :
- `Vérifié`
- `Confirmé`
- `Lint OK`
- `Tests passés`

si la commande :
- n’a pas été exécutée
- a timeout
- a été bloquée par le sandbox
- a échoué avant la fin

### Formulation correcte

Dire explicitement :
- `lint non confirmé`
- `commande expirée après 20s`
- `non vérifié dans cet environnement`
- `inférence, pas confirmation`

### Pourquoi c’est critique

Parce qu’un faux sentiment de validation crée plus de dégâts qu’une absence de validation clairement signalée.

---

## 15. Quand NE PAS lazy-loader

Le lazy loading n’est pas une médaille.
C’est un outil de réduction de coût initial.

### Ne pas lazy-loader un composant si

- il est visible immédiatement au premier rendu
- il structure l’interface principale
- il est léger
- le coût d’un chunk réseau supplémentaire est pire que le gain attendu
- il est essentiel à la perception de vitesse de l’écran

### Bon réflexe

Pour un composant toujours visible :
- garder l’import normal
- réduire ses rerenders
- simplifier ses props
- extraire ses branches rares plutôt que lazy-loader tout le panneau

### Exemple de raisonnement correct

- `CurrencySelector` visible en permanence : import normal
- `BrokerModal` ouverte à la demande : `dynamic()`
- modal d’historique de dividendes : extraction + `dynamic()`

---

## 16. Playbook de refactor frontend fiable

Quand un LLM touche une grosse UI existante, il doit suivre cet ordre :

1. Remonter le flux réel avant de modifier
2. Identifier ce qui est toujours visible et ce qui est rare
3. Sortir le CSS structurel des composants React
4. Extraire physiquement les branches lourdes conditionnelles
5. Ajouter `dynamic()` seulement sur les branches rares
6. Préserver les contrats de props et d’orchestration
7. Vérifier honnêtement ce qui a été réellement exécuté

### Objectif

Obtenir simultanément :
- moins de dette monolithique
- moins de risque CSP
- moins de poids initial
- zéro régression fonctionnelle visible

---

## 17. Règles courtes à transmettre à tout autre LLM

Si tu n’as le temps de transmettre que l’essentiel, transmets ceci :

- Extraire un fichier n’est pas du code splitting.
- Un fallback n’est pas une source de vérité.
- Un timeout de lint n’est pas un lint réussi.
- `React` vient de `react`, `createPortal` vient de `react-dom`.
- Lazy-load seulement les branches rares, pas l’ossature visible.
- Déplace les gros blocs CSS hors des composants React.
- Toute optimisation doit pouvoir nommer le coût exact qu’elle retire.
