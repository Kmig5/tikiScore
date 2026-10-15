# AGENT.md — TikiScore Frontend

## Mission

Tu interviens sur le frontend de **TikiScore**, une application web mobile-first destinée à la gestion et au suivi en direct de championnats de vacances.

Ton rôle est de produire du code React + TypeScript propre, complet, accessible, responsive et immédiatement utilisable dans le projet.

## Contexte technique

- Framework UI : React
- Langage : TypeScript
- Build tool : Vite
- Styles : CSS Modules
- Icônes : `lucide-react`
- Backend : Java Spring Boot
- Architecture CSS : un fichier CSS Module autonome par composant
- Thèmes : clair et sombre via l’attribut `data-theme` sur l’élément racine
- Cible principale : smartphones
- Cible secondaire : tablettes et ordinateurs

## Arborescence des composants

Tous les composants UI doivent suivre cette structure :

```text
src/
└── composants/
    └── ui/
        └── NomComposant/
            ├── NomComposant.tsx
            ├── NomComposant.module.css
            └── index.ts
```

Exemple :

```text
src/composants/ui/Select/
├── Select.tsx
├── Select.module.css
└── index.ts
```

## Composants déjà disponibles

Ne pas recréer ces composants sauf demande explicite :

- `Button`
- `Input`
- `InputPassword`
- `TextArea`
- `Card`
- `Badge`
- `Toast`
- `ToastContext`

## Composants à créer en priorité

1. `Select`
2. `Checkbox`
3. `RadioGroup`
4. `Switch`
5. `Modal`
6. `ConfirmDialog`
7. `Loader`
8. `ThemeToggle`

Puis, si nécessaire :

- `Table`
- `Pagination`
- `SearchInput`
- `Tabs`
- `EmptyState`
- `Avatar`
- `Tooltip`
- `DropdownMenu`
- `Skeleton`
- `DateInput`
- `TimeInput`

## Règles obligatoires de génération

### 1. Livrer des fichiers complets

Pour chaque composant demandé, produire systématiquement :

1. le fichier `NomComposant.tsx` complet ;
2. le fichier `NomComposant.module.css` complet ;
3. le fichier `index.ts` complet ;
4. un exemple minimal d’utilisation uniquement s’il est utile à la validation.

Ne jamais fournir un fragment interrompu, une règle CSS inachevée ou un bloc terminé au milieu d’une propriété.

### 2. Aucun HTML parasite dans le code

Ne jamais insérer dans les fichiers TypeScript ou CSS :

```html
<br>
<br><br>
```

Ne jamais ajouter de texte explicatif brut à l’intérieur d’un fichier CSS ou TypeScript. Les explications dans le code doivent être écrites sous forme de commentaires valides.

### 3. Convention de nommage

- Dossier : `PascalCase`
- Composant : `PascalCase`
- Fichier TSX : `PascalCase.tsx`
- Fichier CSS : `PascalCase.module.css`
- Fichier d’export : toujours `index.ts` avec un `i` minuscule
- Props : `NomComposantProps`
- Types publics : `NomComposantVariant`, `NomComposantSize`, etc.
- Classes CSS Modules : `camelCase`

Ne jamais créer simultanément `Index.ts` et `index.ts`.

### 4. TypeScript strict

- Ne pas utiliser `any`.
- Étendre les attributs HTML natifs appropriés lorsque cela est pertinent.
- Utiliser `forwardRef` pour les champs de formulaire et les composants qui doivent exposer leur élément DOM.
- Exporter les types publics dans `index.ts`.
- Définir des unions littérales pour les variantes et tailles.
- Fournir des valeurs par défaut explicites.
- Transmettre les attributs HTML natifs avec `...props`.

### 5. CSS autonome

Chaque composant doit fonctionner avec son propre fichier `*.module.css`.

Le composant ne doit pas dépendre de variables CSS globales pour son apparence essentielle. Utiliser des valeurs locales explicites pour :

- couleurs ;
- arrière-plans ;
- bordures ;
- espacements ;
- rayons ;
- tailles ;
- ombres ;
- transitions.

Les fichiers globaux peuvent gérer le `body`, la police générale et l’attribut de thème, mais un composant doit rester visuellement exploitable si les design tokens globaux ne sont pas chargés.

### 6. Mobile-first

TikiScore est principalement destiné aux téléphones.

Chaque composant doit :

- fonctionner dès `320px` de largeur ;
- éviter tout débordement horizontal ;
- utiliser des cibles tactiles d’au moins `44px × 44px` pour les actions ;
- utiliser `font-size: 16px` sur les champs mobiles pour éviter le zoom automatique ;
- prendre en charge `touch-action: manipulation` lorsque pertinent ;
- neutraliser les effets `hover` persistants sur les appareils tactiles ;
- adapter les espacements avec des media queries ;
- employer `env(safe-area-inset-*)` pour les éléments flottants proches des bords du téléphone.

### 7. Mode sombre

Chaque composant doit gérer le mode sombre avec CSS Modules :

```css
:global([data-theme="dark"]) .nomClasse {
  /* styles sombres */
}
```

Vérifier en mode sombre :

- contraste du texte ;
- placeholder ;
- bordures ;
- focus ;
- erreurs ;
- états `disabled` et `readOnly` ;
- fond des éléments interactifs ;
- icônes.

### 8. Icônes

Utiliser `lucide-react` pour les icônes d’interface.

Règles :

- importer uniquement les icônes nécessaires ;
- ajouter `aria-hidden="true"` aux icônes décoratives ;
- ne jamais utiliser une icône seule sans `aria-label` sur un bouton ;
- ne pas recréer manuellement une icône SVG si une icône Lucide adaptée existe ;
- conserver une taille et une épaisseur cohérentes.

### 9. Accessibilité

Chaque composant doit respecter au minimum :

- association `label` / champ avec `htmlFor` et `id` ;
- `aria-invalid` pour les erreurs ;
- `aria-describedby` pour les erreurs et textes d’aide ;
- `aria-label` pour les boutons uniquement représentés par une icône ;
- navigation clavier ;
- focus visible ;
- `role` et `aria-live` appropriés pour les notifications ;
- prise en charge de `prefers-reduced-motion` ;
- aucun clic uniquement disponible à la souris.

### 10. Respect des données personnelles

TikiScore suit une approche de minimisation des données.

Dans les composants et exemples :

- ne pas demander de CNI, adresse personnelle, biométrie ou donnée médicale ;
- éviter toute donnée personnelle non indispensable ;
- ne jamais exposer de secret, token ou mot de passe dans les logs ;
- utiliser des exemples métier non sensibles ;
- ne pas afficher publiquement le téléphone ou l’e-mail d’un responsable.

## Palette de référence

### Thème clair

- primaire : `#0d844b`
- primaire hover : `#0c693f`
- primaire active : `#0c5435`
- texte principal : `#18231d`
- texte secondaire : `#5d6a63`
- surface : `#ffffff`
- fond secondaire : `#f5f7f6`
- bordure : `#dce4df`
- danger : `#d33145`
- avertissement : `#d68600`
- information : `#2563d8`

### Thème sombre

- fond : `#0b110e`
- surface : `#131c17` ou `#18231d`
- texte principal : `#edf4ef`
- texte secondaire : `#b9c8bf`
- bordure : `#34443a`
- primaire : `#41bf7b`
- danger : `#fb7185`
- avertissement : `#f7b94c`
- information : `#60a5fa`

## Contrôle qualité avant livraison

Avant de terminer un composant, vérifier :

- [ ] Les trois fichiers requis sont présents.
- [ ] `index.ts` utilise un `i` minuscule.
- [ ] Tous les blocs CSS sont fermés.
- [ ] Aucun `<br>` n’existe dans le code.
- [ ] Le composant compile en TypeScript strict.
- [ ] Le composant fonctionne à `320px` de largeur.
- [ ] Le mode sombre est complet.
- [ ] Le clavier et le focus fonctionnent.
- [ ] Les états `hover`, `active`, `focus`, `disabled` et erreur sont couverts si pertinents.
- [ ] Les animations respectent `prefers-reduced-motion`.
- [ ] Les icônes proviennent de `lucide-react`.
- [ ] Les attributs natifs sont transmis.
- [ ] Le composant ne collecte ni n’expose de donnée inutile.

## Format de réponse attendu

Lorsqu’un composant est demandé, répondre dans cet ordre :

1. rôle du composant en une ou deux phrases ;
2. arborescence ;
3. fichier TSX complet ;
4. fichier CSS Module complet ;
5. fichier `index.ts` complet ;
6. exemple court de test ;
7. points de vérification mobile et sombre.

Ne pas demander de confirmation entre ces étapes.
