# Instructions de création des composants TikiScore

## Objectif

Créer les composants UI manquants de TikiScore en respectant l’architecture et la qualité des composants existants.

## Technologie

```text
React
TypeScript
Vite
CSS Modules
lucide-react
```

## Emplacement

Tous les composants doivent être créés dans :

```text
src/composants/ui/
```

Chaque composant possède son propre dossier :

```text
NomComposant/
├── NomComposant.tsx
├── NomComposant.module.css
└── index.ts
```

## Composants à produire

Créer les composants dans cet ordre :

1. `Select`
2. `Checkbox`
3. `RadioGroup`
4. `Switch`
5. `Modal`
6. `ConfirmDialog`
7. `Loader`
8. `ThemeToggle`

## Exigences communes

### Fichiers complets

Chaque livraison doit inclure le contenu intégral des trois fichiers. Ne jamais renvoyer une portion de CSS ou de TypeScript coupée.

### CSS Modules autonomes

Les styles essentiels doivent être définis dans le fichier du composant. Ne pas dépendre de variables comme `var(--color-primary)` pour le fonctionnement visuel principal.

Les composants doivent gérer eux-mêmes :

- thème clair ;
- thème sombre ;
- responsive mobile ;
- focus clavier ;
- état désactivé ;
- réduction des animations.

### Thème sombre

Utiliser :

```css
:global([data-theme="dark"]) .classe {
  /* styles sombres */
}
```

### Mobile-first

- Cible minimale : `320px`.
- Boutons et contrôles tactiles : minimum `44px × 44px`.
- Champs de formulaire mobiles : `font-size: 16px`.
- Aucun débordement horizontal.
- Les éléments flottants doivent respecter les safe areas.
- Ajouter les media queries nécessaires pour `600px` et `360px`.
- Gérer les appareils tactiles avec :

```css
@media (hover: none) and (pointer: coarse) {
  /* comportement tactile */
}
```

### Icônes

Utiliser `lucide-react`.

Exemple :

```tsx
import { ChevronDown } from "lucide-react";
```

Une icône décorative doit avoir :

```tsx
aria-hidden="true"
```

Un bouton composé uniquement d’une icône doit avoir un `aria-label` explicite.

### Attributs HTML

Les composants doivent préserver les attributs natifs pertinents :

```tsx
name
id
value
defaultValue
onChange
disabled
required
readOnly
className
aria-*
data-*
```

### Accessibilité

- Associer les labels aux champs.
- Fournir un focus visible.
- Permettre l’utilisation au clavier.
- Utiliser `aria-invalid` et `aria-describedby` pour les erreurs.
- Respecter `prefers-reduced-motion`.
- Ne pas transformer un `div` en bouton si un élément HTML natif existe.

## Spécification de chaque composant

### Select

Doit gérer :

- label ;
- placeholder ;
- options ;
- valeur contrôlée et non contrôlée ;
- champ obligatoire ;
- erreur ;
- texte d’aide ;
- `disabled` ;
- tailles `small`, `medium`, `large` ;
- chevron `lucide-react` ;
- largeur complète ;
- mobile et sombre.

Utiliser l’élément HTML natif `select` pour la première version.

### Checkbox

Doit gérer :

- label ;
- description facultative ;
- état contrôlé et non contrôlé ;
- `disabled` ;
- `required` ;
- état d’erreur ;
- icône `Check` ;
- cible tactile de `44px` ;
- mobile et sombre.

Conserver un véritable `input type="checkbox"` accessible.

### RadioGroup

Doit gérer :

- titre de groupe ;
- liste d’options ;
- orientation verticale ou horizontale ;
- valeur sélectionnée ;
- `disabled` global ou par option ;
- erreur et texte d’aide ;
- navigation clavier native ;
- mobile et sombre.

Utiliser `fieldset`, `legend` et des `input type="radio"`.

### Switch

Doit gérer :

- libellé ;
- description ;
- état activé ou désactivé ;
- valeur contrôlée et non contrôlée ;
- `disabled` ;
- focus clavier ;
- cible tactile de `44px` ;
- mobile et sombre.

Utiliser un `button` avec `role="switch"` et `aria-checked`.

### Modal

Doit gérer :

- ouverture et fermeture ;
- titre ;
- description facultative ;
- contenu ;
- footer ;
- icône de fermeture `X` ;
- fermeture par `Escape` ;
- fermeture au clic sur l’overlay configurable ;
- blocage du scroll du body ;
- focus initial et retour du focus ;
- rendu avec `createPortal` ;
- largeur responsive ;
- safe areas mobiles ;
- thème sombre.

Ne pas fermer lorsqu’un clic se produit dans le contenu de la modale.

### ConfirmDialog

Doit être basé sur `Modal` et utiliser le composant `Button` existant.

Doit gérer :

- titre ;
- message ;
- confirmation ;
- annulation ;
- variante `danger` ou `default` ;
- état de chargement ;
- icône `TriangleAlert` pour une suppression ;
- libellés configurables ;
- focus par défaut sur l’action la moins destructive.

### Loader

Doit gérer :

- variantes `spinner`, `dots`, `page` ;
- tailles `small`, `medium`, `large` ;
- texte accessible ;
- affichage inline ou plein écran ;
- thème sombre ;
- `prefers-reduced-motion`.

Utiliser `LoaderCircle` de `lucide-react` lorsque pertinent.

### ThemeToggle

Doit gérer :

- thèmes `light`, `dark`, `system` ;
- stockage dans `localStorage` avec la clé `tikiscore-theme` ;
- détection de `prefers-color-scheme` ;
- mise à jour de `document.documentElement.dataset.theme` ;
- icônes `Sun`, `Moon`, `Monitor` ;
- libellé accessible ;
- cible tactile de `44px` ;
- synchronisation avec les changements du thème système.

Si un `ThemeContext` existe déjà, le composant doit l’utiliser au lieu de dupliquer la logique.

## Palette cohérente

```text
Vert principal       #0d844b
Vert hover           #0c693f
Vert sombre          #0c5435
Fond clair           #ffffff
Fond page clair      #f5f7f6
Texte clair          #18231d
Bordure claire       #dce4df
Danger               #d33145
Avertissement        #d68600
Information          #2563d8
Fond sombre          #0b110e
Surface sombre       #131c17
Surface sombre 2     #18231d
Texte sombre         #edf4ef
Bordure sombre       #34443a
Vert sombre thème    #41bf7b
```

## Interdictions

- Ne pas utiliser `any`.
- Ne pas créer `Index.ts`.
- Ne pas insérer de balises `<br>` dans le code.
- Ne pas produire de CSS tronqué.
- Ne pas installer une nouvelle bibliothèque sans nécessité.
- Ne pas remplacer les éléments natifs accessibles par des `div` cliquables.
- Ne pas utiliser de données personnelles sensibles dans les exemples.
- Ne pas modifier les composants existants sans nécessité explicite.

## Validation finale

Pour chaque composant :

```text
[ ] TypeScript compile
[ ] CSS complet
[ ] index.ts en minuscules
[ ] rendu à 320px
[ ] thème sombre
[ ] navigation clavier
[ ] focus visible
[ ] disabled
[ ] responsive
[ ] reduced motion
[ ] icônes Lucide
[ ] aucun <br>
```
