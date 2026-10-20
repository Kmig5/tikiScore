# AGENTS.md — TikiScore Frontend

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

## Composants existants

Les composants nécessaires à la V1 sont déjà présents dans le projet. Avant toute génération :

1. rechercher le composant existant et lire son API ;
2. le réutiliser ou l'étendre sans casser ses usages actuels ;
3. ne créer un nouveau composant que si aucun composant existant ne couvre le besoin ;
4. éviter les doublons de composants, de styles, de types et de logique métier ;
5. conserver l'organisation réelle du dépôt et les exports existants.

Ne pas recréer un composant sauf demande explicite. Les composants connus incluent notamment `Button`, `Input`, `InputPassword`, `TextArea`, `Card`, `Badge`, `Toast` et `ToastContext`.

## Périmètre fonctionnel de la V1

La V1 gère un seul championnat de vacances. Ne pas afficher de sélecteur de championnat ni d'entrée de navigation « Championnats ». Le modèle backend peut néanmoins conserver l'entité `Championnat` et ses relations afin de permettre une évolution future vers plusieurs compétitions.

L'application doit permettre de :

- présenter l'accueil public du championnat ;
- afficher le calendrier, les matchs à venir et les résultats ;
- suivre un match en direct ;
- publier immédiatement les événements saisis par un gestionnaire de match ;
- afficher les classements des équipes par poule ;
- afficher les classements des buteurs, passeurs et cartons ;
- afficher les statistiques générales fiables ;
- publier des annonces et des communiqués officiels ;
- notifier les utilisateurs des matchs futurs, changements de programme et informations importantes ;
- proposer un forum du championnat ;
- générer et partager un lien public et un QR code d'accès au championnat.

## Rôles et autorisations

Les capacités visibles dépendent des rôles, mais les écrans publics restent communs. Masquer une action dans l'interface ne remplace jamais le contrôle d'autorisation effectué par Spring Boot.

### Visiteur

Le visiteur non connecté peut consulter l'accueil, les matchs, le direct, les résultats, les classements, les statistiques, les communiqués et, selon la configuration, le forum en lecture seule.

### Utilisateur connecté

L'utilisateur connecté peut en plus gérer son profil, suivre une équipe, régler ses préférences de notification, participer au forum et signaler un message.

### Gestionnaire de match

Le gestionnaire ne peut administrer que les matchs qui lui sont attribués. Sa console doit lui permettre d'enregistrer et de corriger :

- début, pause, reprise, mi-temps et fin du match ;
- buts et score ;
- buteur et passeur éventuel ;
- cartons jaunes et rouges ;
- remplacements ;
- temps de jeu et événements chronologiques pertinents.

La saisie doit être optimisée pour le terrain : gros boutons tactiles, confirmation avant les actions critiques, retour visuel immédiat, prévention des doubles soumissions et possibilité de corriger ou annuler un événement selon les droits.

### Administrateur de la compétition

Le créateur ou administrateur dispose d'un centre de gestion pour les équipes, joueurs, poules, calendrier, affectations des gestionnaires, communiqués, notifications, modération, partage par QR code et paramètres du championnat.

### Modérateur du forum

Le modérateur peut traiter les signalements, masquer un message, fermer ou épingler une discussion et appliquer les actions de modération prévues. Il ne peut pas modifier les scores, équipes ou données sportives sans rôle supplémentaire.

Un utilisateur peut posséder plusieurs rôles. Construire les gardes et menus à partir de permissions explicites plutôt que d'une égalité sur un rôle unique.

## Navigation responsive

### Téléphone

La navigation principale est une barre d'onglets inférieure fixe contenant au maximum cinq destinations :

1. `Accueil`
2. `Matchs`
3. `Classements`
4. `Communauté`
5. `Profil`

La barre doit respecter `env(safe-area-inset-bottom)`. Le contenu principal doit réserver sa hauteur pour ne jamais être masqué. Les notifications sont accessibles depuis une cloche dans le header avec un badge non lu, et non comme sixième onglet.

Les fonctions contextuelles ne doivent pas encombrer la barre principale :

- le gestionnaire ouvre la console depuis un match qui lui est attribué ;
- l'administrateur ouvre le centre de gestion depuis son profil ou une action dédiée ;
- un raccourci contextuel peut apparaître lorsqu'un match attribué est en cours.

### Ordinateur

À partir d'environ `1024px`, masquer la barre inférieure et afficher une sidebar latérale. La sidebar reprend les destinations publiques et peut séparer :

- navigation publique : Accueil, Matchs, Classements, Statistiques, Communauté ;
- espace personnel : Notifications, Profil ;
- gestion conditionnelle : Administration, Gestion des matchs, Annonces, Modération, Paramètres ;
- action de partage : lien public et QR code.

Utiliser une source de configuration unique pour alimenter la barre mobile et la sidebar. Les éléments sont filtrés par permission afin d'éviter la duplication et les divergences.

## Écrans et routes de référence

Les routes de référence sont :

```text
/                           Accueil du championnat
/matchs                     Calendrier et résultats
/matchs/:matchId            Détail et direct du match
/classements                Classements par poules
/classements/buteurs        Classement des buteurs
/classements/passeurs       Classement des passeurs
/statistiques               Statistiques générales
/communaute                 Forum
/communaute/:discussionId   Discussion
/communiques                Communiqués officiels
/notifications              Centre de notifications
/profil                     Profil et préférences
/gestion                    Centre de gestion
/gestion/matchs             Matchs attribués ou administrés
/gestion/matchs/:id/live    Console du gestionnaire
/gestion/equipes            Équipes et joueurs
/gestion/calendrier         Programmation
/gestion/annonces           Annonces et communiqués
/gestion/forum              Modération
/gestion/partage            Lien public et QR code
/gestion/parametres         Paramètres
```

Adapter ces chemins au routeur déjà présent au lieu de créer une seconde convention concurrente.

## Accueil du championnat

L'accueil représente directement l'unique championnat. Prioriser dans cet ordre :

1. match actuellement en direct ;
2. prochains matchs ;
3. communiqué important ;
4. aperçu des classements par poule ;
5. meilleurs buteurs ;
6. discussions populaires ;
7. partage du championnat.

Chaque carte doit conduire à un écran détaillé. En l'absence de données, afficher un état vide utile plutôt qu'une valeur inventée.

## Match en direct et cohérence des données

Les événements validés par le gestionnaire doivent être visibles rapidement par tous les utilisateurs. Utiliser le mécanisme temps réel déjà prévu dans le projet, par exemple WebSocket ou Server-Sent Events, sans ajouter une technologie concurrente sans nécessité.

Le frontend doit :

- afficher l'état de connexion au direct ;
- dédupliquer les événements ;
- ordonner les événements avec leur identifiant et leur horodatage serveur ;
- gérer reconnexion, reprise et resynchronisation ;
- ne pas considérer une mise à jour optimiste comme définitivement validée avant confirmation du backend ;
- annoncer les changements de score de façon accessible sans perturber excessivement les lecteurs d'écran.

Le backend reste la source de vérité pour le score, les événements, les classements et les statistiques.

## Classements et statistiques

Sur mobile, l'écran `Classements` peut utiliser les sous-onglets `Équipes`, `Buteurs`, `Passeurs`, `Cartons` et `Stats`.

Pour les équipes, permettre le choix de la poule et afficher en priorité la position, l'équipe, les matchs joués, la différence de buts et les points. Rendre les autres données accessibles dans le détail sans imposer un tableau horizontal illisible.

Ne jamais inventer une statistique. Une statistique ne doit être affichée que si les données permettant son calcul sont réellement enregistrées et renvoyées par l'API.

## Communauté, forum et communiqués

L'espace `Communauté` regroupe le forum et les communiqués, avec des sous-onglets si nécessaire.

Les communiqués sont des publications officielles clairement identifiées. Une information critique peut être publiée dans les communiqués, remontée sur l'accueil et envoyée en notification.

Le forum doit prendre en charge au minimum les discussions, réponses, catégories, signalements, contenus épinglés, fermeture et modération. Prévoir des états de chargement, vide, erreur, discussion fermée et contenu masqué. Ne pas confondre une publication d'utilisateur avec un communiqué officiel.

## Notifications

Prévoir des notifications pour :

- rappel d'un futur match ;
- début et fin d'un match suivi ;
- buts en direct si l'utilisateur les active ;
- changement d'horaire, report ou annulation ;
- communiqué officiel ;
- réponse dans une discussion suivie.

Les préférences doivent être configurables. Par défaut, éviter les notifications trop fréquentes. La cloche du header ouvre le centre de notifications et affiche le nombre non lu de manière accessible.

## Partage, lien public et QR code

Le championnat doit disposer d'un lien public stable ouvrant directement son accueil sans exiger une authentification pour les contenus publics. Le frontend doit permettre de :

- copier le lien ;
- utiliser l'API de partage native lorsqu'elle est disponible ;
- afficher le QR code ;
- télécharger ou imprimer le QR code pour un panneau d'affichage ;
- afficher également une URL courte lisible sous le QR code.

Un QR code public contient uniquement une URL publique. Ne jamais y incorporer mot de passe, JWT, donnée personnelle ou secret. Les invitations privilégiées utilisent un jeton temporaire, révocable et contrôlé par le backend.

Pour l'impression, conserver un contraste élevé, une marge blanche autour du QR code et une taille minimale pratique d'environ 3 à 4 cm pour un scan à courte distance. Tester le rendu imprimé sur plusieurs téléphones.

## Gestion des états d'interface

Chaque écran connecté à l'API doit prévoir explicitement :

- chargement initial et rechargement ;
- état vide ;
- erreur récupérable avec action de réessai ;
- absence de connexion ;
- permissions insuffisantes ;
- session expirée ;
- succès ou échec d'une mutation ;
- contenu obsolète pendant une reconnexion au direct.

Ne jamais masquer une erreur métier derrière un simple message générique si l'API fournit une explication exploitable.

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
