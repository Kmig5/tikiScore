# Instruction d'implémentation complète du frontend TikiScore

## Objectif

Implémente directement et intégralement le frontend de **TikiScore V1** dans ce dépôt, en respectant toutes les règles du fichier `AGENTS.md` situé à la racine du projet.

Ne te limite pas à proposer une architecture, des exemples, une liste de tâches ou des extraits. Crée et modifie réellement tous les fichiers nécessaires pour obtenir un frontend complet, cohérent, navigable, responsive et compilable.

## Mode d'exécution obligatoire

1. Commence par lire entièrement `AGENTS.md`, `package.json`, l'arborescence de `src`, la configuration TypeScript, le routeur, les services API, les types et tous les composants existants.
2. Fais un inventaire interne des éléments réutilisables. Ne recrée aucun composant déjà présent.
3. Respecte l'organisation réelle du dépôt. Si elle diffère des exemples de `AGENTS.md`, conserve la structure existante et reste cohérent avec celle-ci.
4. Implémente le projet par étapes, mais poursuis automatiquement jusqu'à la fin sans demander de confirmation entre les étapes.
5. Utilise les dépendances déjà installées. N'ajoute une dépendance que si elle est indispensable et qu'aucune solution existante ne couvre le besoin.
6. Ne modifie pas le backend Spring Boot dans cette tâche. Adapte le frontend aux contrats d'API existants lorsqu'ils sont disponibles.
7. Si une API n'existe pas encore, crée une couche de service clairement isolée avec des types stricts, des fonctions explicites et des données de démonstration centralisées. N'intègre aucune donnée fictive directement dans les composants.
8. Ne simule jamais une authentification ou une autorisation comme si elle était sécurisée. Les protections frontend servent à l'expérience utilisateur, le backend demeure la source de vérité.
9. Après chaque groupe de modifications, corrige les erreurs TypeScript, ESLint et de compilation avant de poursuivre.
10. Termine uniquement lorsque l'application compile et que toutes les routes principales sont fonctionnelles.

## Périmètre de la V1

La V1 gère un seul championnat de vacances. Il ne faut donc ni page de sélection des championnats ni entrée de navigation `Championnats`.

Le frontend doit couvrir :

- accueil public du championnat ;
- calendrier des matchs ;
- résultats ;
- détail d'un match ;
- suivi des matchs en direct ;
- classements des équipes par poule ;
- classements des buteurs, passeurs et cartons ;
- statistiques générales ;
- annonces et communiqués officiels ;
- centre de notifications ;
- préférences de notifications ;
- forum du championnat ;
- profil utilisateur ;
- console du gestionnaire de match ;
- centre d'administration ;
- modération du forum ;
- partage du championnat par lien public et QR code.

## Utilisateurs et permissions

Prends en charge des permissions cumulables pour les profils suivants :

- visiteur non connecté ;
- utilisateur connecté ;
- gestionnaire de match ;
- administrateur de la compétition ;
- modérateur du forum.

Un utilisateur peut avoir plusieurs rôles. Les menus et actions doivent être filtrés à partir de permissions explicites et non à partir d'une égalité avec un rôle unique.

### Visiteur

Le visiteur peut consulter les contenus publics : accueil, matchs, direct, résultats, classements, statistiques, communiqués et forum en lecture seule si la configuration le permet.

### Utilisateur connecté

Il peut gérer son profil, suivre une équipe, régler ses notifications, participer au forum et signaler un contenu.

### Gestionnaire de match

Il ne peut gérer que les matchs qui lui sont attribués. Il peut enregistrer :

- début, pause, reprise, mi-temps et fin du match ;
- but et évolution du score ;
- buteur ;
- passeur éventuel ;
- carton jaune ou rouge ;
- remplacement ;
- correction ou annulation d'un événement selon ses droits.

### Administrateur

Il peut gérer les équipes, joueurs, poules, calendrier, matchs, affectations des gestionnaires, annonces, communiqués, notifications, modération, partage et paramètres.

### Modérateur

Il peut traiter les signalements, masquer un message, fermer ou épingler une discussion. Il ne peut pas modifier les données sportives sans permission supplémentaire.

## Navigation mobile-first

### Téléphone

Crée une barre de navigation inférieure fixe avec exactement cinq destinations principales :

1. Accueil
2. Matchs
3. Classements
4. Communauté
5. Profil

Contraintes :

- respecter `env(safe-area-inset-bottom)` ;
- réserver dans le contenu la hauteur de la barre ;
- afficher clairement l'onglet actif ;
- fournir des cibles tactiles d'au moins 44 × 44 px ;
- utiliser `lucide-react` ;
- conserver une navigation clavier accessible ;
- ne pas ajouter les notifications comme sixième onglet.

Le header mobile contient le nom ou logo TikiScore et une cloche de notifications avec badge non lu.

### Desktop

À partir d'environ `1024px`, masque la barre inférieure et affiche une sidebar latérale avec :

- Accueil ;
- Matchs ;
- Classements ;
- Statistiques ;
- Communauté ;
- Notifications ;
- Profil ;
- les entrées de gestion autorisées ;
- une action permettant de partager le championnat.

La barre mobile et la sidebar doivent utiliser une configuration de navigation commune, filtrée selon les permissions.

## Routes attendues

Adapte ces routes au routeur existant sans créer un deuxième système concurrent :

```text
/                           Accueil
/matchs                     Calendrier et résultats
/matchs/:matchId            Détail et direct
/classements                Classements par poules
/classements/buteurs        Buteurs
/classements/passeurs       Passeurs
/statistiques               Statistiques générales
/communaute                 Forum et communiqués
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

Ajoute une route 404 cohérente avec le design de l'application.

## Accueil

L'accueil représente directement le championnat unique et présente, dans cet ordre :

1. match actuellement en direct ;
2. prochains matchs ;
3. communiqué prioritaire ;
4. aperçu des classements par poule ;
5. meilleurs buteurs ;
6. discussions populaires ;
7. action de partage.

Chaque section doit mener vers l'écran détaillé correspondant. Fournis des états vides propres lorsqu'aucune donnée n'est disponible.

## Matchs et direct

Crée les écrans calendrier, résultats, détail et direct.

Le direct doit afficher :

- équipes et logos si disponibles ;
- score ;
- statut et chronomètre ;
- chronologie des événements ;
- buteurs et passeurs ;
- cartons ;
- remplacements ;
- état de connexion au flux en direct ;
- possibilité de resynchronisation après reconnexion.

Utilise le mécanisme temps réel déjà présent. À défaut, isole une interface de transport compatible avec WebSocket ou Server-Sent Events. Déduplique et ordonne les événements avec leur identifiant et leur horodatage serveur. Le backend reste la source de vérité.

## Console du gestionnaire de match

Crée une interface mobile prioritaire, utilisable au bord du terrain :

- score et temps visibles en permanence ;
- gros boutons pour ajouter un but, un carton ou un remplacement ;
- sélection de l'équipe, du joueur et du passeur éventuel ;
- confirmation des actions critiques ;
- prévention des doubles soumissions ;
- historique récent ;
- correction ou annulation selon les permissions ;
- messages de réussite ou d'erreur accessibles ;
- fonctionnement acceptable en cas de connexion instable.

## Classements et statistiques

Sur mobile, utilise des sous-onglets pour :

- Équipes ;
- Buteurs ;
- Passeurs ;
- Cartons ;
- Stats.

Permets de sélectionner une poule. Sur petit écran, privilégie position, équipe, matchs joués, différence de buts et points. Ne crée pas de tableau provoquant un débordement horizontal.

N'affiche jamais une statistique qui ne peut pas être calculée à partir des données réellement disponibles.

## Communauté et communiqués

L'espace Communauté contient :

- forum ;
- communiqués officiels clairement identifiés.

Le forum doit couvrir :

- catégories ;
- liste des discussions ;
- recherche ou filtrage si le composant existe ;
- création d'une discussion pour les utilisateurs autorisés ;
- réponses ;
- discussions épinglées ou fermées ;
- signalement ;
- modération ;
- états vide, chargement, erreur et contenu masqué.

Un message utilisateur ne doit jamais être présenté comme un communiqué officiel.

## Notifications

Crée un centre de notifications et des préférences pour :

- rappel de match futur ;
- début et fin d'un match suivi ;
- buts en direct, sur activation ;
- changement d'horaire ;
- report ou annulation ;
- communiqué officiel ;
- réponse dans une discussion suivie.

La cloche du header affiche le nombre non lu de manière accessible. Évite d'activer par défaut les notifications à fréquence élevée.

## Lien public et QR code

Crée un écran de partage permettant de :

- afficher le lien public stable du championnat ;
- copier le lien ;
- utiliser `navigator.share` lorsqu'il est disponible ;
- afficher un QR code ;
- télécharger le QR code ;
- proposer un rendu imprimable pour un panneau d'affichage ;
- afficher une URL lisible sous le QR code.

Le QR code public ne doit contenir qu'une URL publique. N'y mets aucun mot de passe, JWT, secret ni donnée personnelle. Si une bibliothèque de QR code est déjà installée, réutilise-la. Sinon, ajoute une bibliothèque légère et maintenue uniquement si nécessaire.

Le rendu imprimable doit conserver un fort contraste, une marge blanche et une taille minimale d'environ 3 à 4 cm pour un scan proche.

## Données et services

- Utilise TypeScript strict et n'emploie jamais `any`.
- Crée des types métier centralisés pour utilisateurs, permissions, équipes, joueurs, poules, matchs, événements, classements, statistiques, notifications, communiqués et discussions.
- Centralise les appels HTTP dans une couche de services.
- Utilise les variables d'environnement Vite pour l'URL de l'API.
- Ne place aucun secret dans le frontend.
- Gère les erreurs HTTP importantes, notamment 401, 403, 404, 409, 422 et 500.
- N'effectue aucun calcul métier sensible uniquement dans l'interface.
- Ne mélange pas DTO d'API, état de formulaire et modèle d'affichage lorsque leurs responsabilités diffèrent.

## États d'interface obligatoires

Chaque écran connecté aux données doit prendre en charge :

- chargement initial ;
- rechargement ;
- état vide ;
- erreur récupérable et bouton Réessayer ;
- absence de connexion ;
- permission insuffisante ;
- session expirée ;
- succès et échec des mutations ;
- contenu possiblement obsolète pendant une reconnexion au direct.

## Design, responsive et accessibilité

Respecte strictement les règles de `AGENTS.md`, notamment :

- mobile-first dès 320 px ;
- CSS Modules ;
- thème clair et sombre ;
- palette TikiScore ;
- composants autonomes ;
- contrôles tactiles d'au moins 44 × 44 px ;
- champs mobiles en 16 px minimum ;
- focus visible ;
- navigation clavier ;
- labels correctement associés ;
- attributs ARIA pertinents ;
- `aria-live` utilisé avec modération pour le direct ;
- prise en charge de `prefers-reduced-motion` ;
- absence de débordement horizontal ;
- aucun clic réservé à la souris ;
- confidentialité et minimisation des données.

## Réutilisation des composants

Tous les composants nécessaires sont supposés déjà créés. Avant d'ajouter un fichier :

1. cherche un composant ou utilitaire équivalent ;
2. lis son contrat et ses usages ;
3. réutilise-le ;
4. étends-le seulement si cette extension reste générique ;
5. ne duplique ni CSS, ni logique, ni types.

Crée uniquement les pages, layouts, configurations, adaptateurs et services qui manquent réellement.

## Qualité et validation

Avant de terminer :

1. exécute l'installation des dépendances uniquement si nécessaire ;
2. exécute le contrôle TypeScript ;
3. exécute ESLint si configuré ;
4. exécute les tests existants ;
5. ajoute des tests ciblés pour la navigation par permissions, les écrans critiques et les principales interactions si l'infrastructure de tests existe ;
6. exécute le build de production ;
7. corrige toutes les erreurs provenant de tes modifications ;
8. vérifie les vues à 320 px, 375 px, 768 px et 1024 px ou plus ;
9. vérifie les thèmes clair et sombre ;
10. vérifie la navigation clavier et les états de focus.

Ne supprime pas un test existant pour faire passer la validation. Ne désactive pas TypeScript, ESLint ou une règle d'accessibilité afin de masquer une erreur.

## Résultat final attendu

À la fin de l'exécution, fournis un compte rendu concis contenant :

- les fonctionnalités implémentées ;
- les principaux fichiers créés ou modifiés ;
- les routes disponibles ;
- les commandes de validation exécutées et leurs résultats ;
- les dépendances ajoutées avec leur justification ;
- les contrats backend manquants ou hypothèses temporaires ;
- les éventuels points restant bloqués.

Ne réponds pas uniquement avec du code dans le chat. Applique réellement les changements dans le dépôt. Ne t'arrête pas après la première page et ne demande pas de confirmation tant qu'une décision sûre peut être prise à partir de `AGENTS.md`, du code existant et de cette instruction.
