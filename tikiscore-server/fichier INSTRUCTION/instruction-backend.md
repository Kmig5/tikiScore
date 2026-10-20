# Instruction d'implémentation complète du backend TikiScore V1

## Objectif

Implémente directement et intégralement le backend Spring Boot de **TikiScore V1** dans le projet `tikiscore-server`, en t'appuyant sur le code déjà présent et sur les besoins réels du frontend `tikiscore-appweb`.

La cible n'est pas une démonstration, mais une application utilisable de bout en bout. Ne te limite pas à une analyse, une architecture, une liste de tâches ou des extraits. Crée et modifie réellement les fichiers du dépôt, exécute les validations disponibles, corrige les erreurs introduites et poursuis automatiquement tant qu'une décision sûre peut être prise à partir du code existant et de cette instruction.

## Sources de vérité et ordre de lecture

Avant toute modification :

1. lis entièrement les fichiers `AGENTS.md`, `instruction.md`, les README et toute instruction spécifique au backend ;
2. inspecte `tikiscore-server/pom.xml` ou `build.gradle` ;
3. inspecte toute l'arborescence `tikiscore-server/src/main/java` ;
4. inspecte `src/main/resources`, notamment `application.properties`, `application.yml` et les migrations ;
5. inspecte les tests existants ;
6. inspecte dans `tikiscore-appweb` les routes, pages, types, données locales, `tikiScoreService.ts`, `liveTransport.ts`, le contexte des permissions et les composants déjà connectables ;
7. dresse un inventaire interne des entités, enums, repositories, services, DTO, mappers, contrôleurs, configurations de sécurité et contrats déjà présents ;
8. réutilise et corrige l'existant au lieu de créer un second modèle concurrent.

Le frontend existant représente le contrat fonctionnel à alimenter. Ne refais pas ses écrans. Construis les API dont il a besoin et conserve la possibilité de remplacer progressivement ses données locales.

## Mode d'exécution obligatoire

- Travaille par lots cohérents, mais ne demande pas de confirmation entre les lots.
- Ne supprime aucune logique correcte déjà présente.
- N'ajoute pas une nouvelle entité, enum ou couche si un équivalent existe déjà et peut être corrigé ou étendu.
- Ne renomme pas massivement les packages ou types sans nécessité démontrée.
- N'expose jamais directement les entités JPA dans les contrôleurs.
- N'utilise jamais `ddl-auto=create`, `create-drop` ou `update` en production.
- N'utilise jamais de secret codé en dur.
- N'utilise pas `Optional.get()` sans contrôle, de type brut, de `catch` silencieux ou d'exception générique pour les erreurs métier.
- Ne désactive pas Spring Security, les tests, la validation ou les règles de compilation pour contourner une erreur.
- Après chaque lot, exécute les tests et le build backend disponibles, puis corrige les erreurs avant de continuer.
- Si un contrat frontend est ambigu, choisis un DTO explicite, stable et documenté, puis note l'hypothèse dans le compte rendu final.

## Priorité zéro : réparer et valider le socle JPA

Un risque structurel a été détecté : plusieurs classes d'entité semblent `implements Entity` alors que `Entity` pourrait être une annotation JPA importée par erreur ou qu'une classe commune devrait fournir l'identifiant. Vérifie ce point dans le code réel avant toute autre implémentation.

Pour chaque entité :

- confirmer la présence d'un `@Id` reconnu par JPA ;
- si une classe de base métier existe, utiliser `@MappedSuperclass` et un nom non ambigu tel que `BaseEntity` ;
- ne jamais déclarer `implements jakarta.persistence.Entity` ;
- utiliser des identifiants cohérents, de préférence `UUID` si le projet les utilise déjà ;
- ajouter `@Version` aux agrégats soumis à des modifications concurrentes, notamment les matchs et événements si pertinent ;
- contrôler les `equals` et `hashCode` pour éviter les erreurs avec les entités transitoires ;
- contrôler les cardinalités, propriétaires de relations, cascades et suppressions orphelines ;
- limiter les relations `EAGER` ;
- éviter les boucles de sérialisation en passant exclusivement par des DTO ;
- vérifier les contraintes uniques, index, colonnes non nulles et longueurs ;
- harmoniser les dates avec `Instant` pour les instants techniques et un fuseau de championnat explicite pour l'affichage.

Exécute au minimum un test de démarrage du contexte avec une base de test et vérifie que le mapping Hibernate démarre sans erreur.

## Migrations de base de données

Mets en place **Flyway** si aucune solution de migration n'est déjà utilisée. Si **Liquibase** existe déjà, conserve-le et ne rajoute pas Flyway.

Les migrations doivent :

- créer le schéma à partir d'une base vide ;
- refléter les contraintes du modèle ;
- créer les index nécessaires ;
- ne pas contenir de données personnelles réelles ;
- prévoir un jeu minimal de données de développement séparé du profil de production ;
- être compatibles avec PostgreSQL, qui est la base cible de production ;
- documenter clairement toute transformation de colonnes ou de données existantes.

Configure Hibernate avec `ddl-auto=validate` dans les profils normaux après l'introduction des migrations.

## Périmètre fonctionnel V1

La V1 gère un seul championnat de vacances actif. Conserve néanmoins l'entité championnat et ses relations pour permettre plusieurs éditions ultérieurement.

Le backend doit couvrir :

- authentification et comptes ;
- rôles et permissions cumulables ;
- championnat actif ;
- équipes, joueurs et poules ;
- calendrier et résultats ;
- affectation des gestionnaires de match ;
- cycle de vie des matchs ;
- événements de match ;
- score et direct ;
- classements par poule ;
- buteurs, passeurs, cartons et statistiques ;
- annonces et communiqués ;
- notifications et préférences ;
- forum et modération ;
- QR code officiel unique généré par le backend ;
- partage et redirection du lien officiel ;
- audit des opérations sensibles.

## Architecture attendue

Respecte l'organisation existante lorsqu'elle est saine. Sinon, privilégie une organisation par fonctionnalité :

```text
com.tikiscore_server
├── auth
├── security
├── user
├── competition
├── team
├── player
├── group
├── match
│   ├── assignment
│   ├── event
│   └── live
├── standing
├── statistic
├── announcement
├── notification
├── forum
├── moderation
├── sharing
├── media
├── audit
└── common
    ├── error
    ├── pagination
    └── validation
```

Dans chaque fonctionnalité, sépare clairement contrôleurs, services applicatifs, repositories, DTO, mappers et règles métier. Évite un service gigantesque qui concentre toute l'application.

## Authentification et sécurité

Implémente ou complète :

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
GET  /api/users/me
PATCH /api/users/me
PATCH /api/users/me/password
```

Exigences :

- mots de passe hachés avec `PasswordEncoder` ;
- access token de courte durée si JWT est utilisé ;
- refresh token révocable et avec expiration ;
- préférer un cookie `HttpOnly`, `Secure` et `SameSite` pour le refresh token d'une application web ;
- secrets issus des variables d'environnement ;
- CORS restreint aux origines configurées ;
- CSRF configuré selon le mode réel d'authentification, pas désactivé arbitrairement ;
- limitation des tentatives de connexion si une infrastructure appropriée existe ;
- aucune donnée sensible dans les logs ;
- réponses différentes uniquement lorsque cela ne facilite pas l'énumération des comptes.

Les utilisateurs peuvent cumuler les rôles :

```text
USER
MATCH_MANAGER
COMPETITION_ADMIN
FORUM_MODERATOR
```

Construis les autorisations à partir de permissions explicites. Les contrôles doivent être appliqués aux services et endpoints, pas uniquement à l'affichage frontend.

Un gestionnaire de match ne peut agir que sur les matchs auxquels il est affecté. Le rôle seul ne suffit jamais.

## Utilisateur, profil et confidentialité

Expose uniquement les données nécessaires. Pour les profils publics de joueurs, ne révèle jamais :

- adresse ;
- téléphone ;
- e-mail ;
- pièce d'identité ;
- mot de passe ou token ;
- donnée médicale ;
- date de naissance complète d'un mineur.

Prévois des DTO distincts pour :

- profil public ;
- profil de l'utilisateur connecté ;
- vue administrative autorisée.

## Championnat actif unique

Expose le championnat actif directement, sans obliger le frontend à sélectionner un championnat :

```http
GET   /api/public/competition
GET   /api/admin/competition
PATCH /api/admin/competition
POST  /api/admin/competition/publish
```

Le championnat doit au minimum gérer : nom, édition, description, dates, statut, logo éventuel, fuseau horaire, règles de points, critères de départage, visibilité du forum et URL publique.

Prévois des statuts cohérents comme `DRAFT`, `REGISTRATION_OPEN`, `SCHEDULED`, `IN_PROGRESS`, `COMPLETED` et `SUSPENDED`, en adaptant les noms aux enums existants.

## Équipes, joueurs et poules

Implémente les lectures publiques et la gestion administrative :

```http
GET    /api/public/teams
GET    /api/public/teams/{teamId}
GET    /api/public/teams/{teamId}/players
GET    /api/public/players/{playerId}
GET    /api/public/groups
POST   /api/admin/teams
PATCH  /api/admin/teams/{teamId}
POST   /api/admin/teams/{teamId}/players
PATCH  /api/admin/players/{playerId}
POST   /api/admin/groups
PATCH  /api/admin/groups/{groupId}
PUT    /api/admin/groups/{groupId}/teams
```

Règles :

- un joueur participant à un événement doit appartenir à l'équipe concernée pour ce match ;
- un numéro de maillot doit respecter la règle métier définie dans le projet ;
- une équipe ne doit pas appartenir simultanément à plusieurs poules du même championnat sauf règle explicite ;
- les suppressions d'équipes ou joueurs déjà associés à des matchs doivent être protégées ou remplacées par un statut d'archivage.

## Matchs, calendrier et affectations

Implémente :

```http
GET  /api/public/matches
GET  /api/public/matches/today
GET  /api/public/matches/upcoming
GET  /api/public/matches/live
GET  /api/public/matches/{matchId}
GET  /api/public/matches/{matchId}/events
POST /api/admin/matches
PATCH /api/admin/matches/{matchId}
POST /api/admin/matches/{matchId}/assign-manager
POST /api/admin/matches/{matchId}/postpone
POST /api/admin/matches/{matchId}/cancel
GET  /api/match-manager/matches
GET  /api/match-manager/matches/{matchId}
```

Ajoute pagination et filtres utiles par date, statut, poule et équipe.

Modélise un cycle de vie cohérent, en adaptant les noms à l'existant :

```text
SCHEDULED
DELAYED
LIVE_FIRST_HALF
HALF_TIME
LIVE_SECOND_HALF
PAUSED
FINISHED
POSTPONED
CANCELLED
ABANDONED
```

Interdis les transitions illégales dans le service métier.

## Événements et console du gestionnaire

Les commandes de match minimales sont :

```http
POST /api/match-manager/matches/{matchId}/start
POST /api/match-manager/matches/{matchId}/half-time
POST /api/match-manager/matches/{matchId}/resume
POST /api/match-manager/matches/{matchId}/finish
POST /api/match-manager/matches/{matchId}/events
POST /api/match-manager/matches/{matchId}/events/{eventId}/cancel
```

Les événements doivent couvrir au minimum :

```text
MATCH_STARTED
MATCH_PAUSED
MATCH_RESUMED
HALF_TIME_STARTED
SECOND_HALF_STARTED
GOAL
OWN_GOAL
PENALTY_GOAL
PENALTY_MISSED
YELLOW_CARD
SECOND_YELLOW_CARD
RED_CARD
SUBSTITUTION
SCORE_CORRECTION
MATCH_ENDED
EVENT_CANCELLED
```

Chaque événement persistant doit permettre d'identifier :

- le match ;
- le type ;
- l'équipe ;
- le joueur principal ;
- le passeur éventuel ;
- les joueurs sortant et entrant pour un remplacement ;
- la minute et le temps additionnel ;
- l'heure serveur ;
- l'auteur ;
- le statut ;
- l'événement annulé ou remplacé ;
- un numéro de séquence croissant par match ;
- une version de concurrence si nécessaire.

Le frontend envoie un événement, pas un score final arbitraire. Le backend valide l'événement, calcule le score officiel et renvoie l'état du match.

## Idempotence, concurrence et audit du direct

Pour éviter les doubles buts ou cartons en cas de double clic ou de réseau instable :

- accepte un `Idempotency-Key` ou un `clientEventId` unique ;
- crée une contrainte unique appropriée ;
- renvoie le même résultat lorsque la même commande valide est rejouée ;
- encapsule la création de l'événement et le calcul du score dans une transaction ;
- utilise le verrouillage optimiste ou pessimiste de façon ciblée ;
- ne supprime jamais silencieusement un événement publié ;
- annule ou corrige avec une trace d'audit ;
- vérifie l'affectation du gestionnaire dans la transaction.

Audite obligatoirement : changement de score, annulation d'événement, affectation du gestionnaire, publication d'un communiqué, action de modération et attribution de rôles.

## Temps réel

Utilise la dépendance ou le mécanisme déjà présent. Si WebSocket/STOMP est déjà installé, complète-le plutôt que d'ajouter SSE. Si aucun mécanisme n'existe, privilégie WebSocket/STOMP pour les matchs en direct.

Canaux possibles :

```text
/topic/matches/{matchId}
/topic/competition/live
/topic/competition/announcements
/user/queue/notifications
```

Règle de publication : sauvegarder et valider la transaction avant de diffuser l'événement. Ne diffuse jamais comme définitive une mutation qui peut encore être annulée par la transaction.

Les messages temps réel doivent contenir au minimum :

- identifiant de message ;
- type ;
- match ;
- numéro de séquence ;
- horodatage serveur ;
- payload versionné ou clairement typé.

Conserve REST comme mécanisme de resynchronisation :

```http
GET /api/public/matches/{matchId}
GET /api/public/matches/{matchId}/events?afterSequence={sequence}
```

Sécurise les connexions et destinations. Seul un gestionnaire autorisé peut envoyer des commandes. Les spectateurs ne peuvent que s'abonner aux informations publiques.

## Classements et statistiques

Le backend est l'unique source de vérité des classements et statistiques. Implémente :

```http
GET /api/public/standings
GET /api/public/groups/{groupId}/standings
GET /api/public/statistics/top-scorers
GET /api/public/statistics/top-assists
GET /api/public/statistics/cards
GET /api/public/statistics/overview
```

Le classement par poule comprend : position, matchs joués, victoires, nuls, défaites, buts pour, buts contre, différence et points.

Les critères de départage doivent être explicites et configurables ou clairement codifiés, par exemple : points, différence de buts, buts marqués, confrontation directe et dernier critère administratif.

Recalcule ou invalide les résultats dérivés après création, correction ou annulation d'un événement et après changement de statut d'un match. N'invente aucune statistique pour laquelle les événements nécessaires ne sont pas stockés.

## Communiqués et annonces

Implémente :

```http
GET    /api/public/announcements
GET    /api/public/announcements/{id}
POST   /api/admin/announcements
PATCH  /api/admin/announcements/{id}
POST   /api/admin/announcements/{id}/publish
POST   /api/admin/announcements/{id}/archive
```

Gère brouillon, publication, archivage, priorité, affichage sur l'accueil et déclenchement éventuel d'une notification. Distingue strictement un communiqué officiel d'un message de forum.

## Notifications et préférences

Implémente au minimum les notifications internes :

```http
GET   /api/notifications
GET   /api/notifications/unread-count
PATCH /api/notifications/{id}/read
POST  /api/notifications/read-all
GET   /api/users/me/notification-preferences
PATCH /api/users/me/notification-preferences
```

Types minimaux : rappel de match, début, fin, but si activé, changement d'horaire, report, annulation, communiqué officiel et réponse forum.

Les préférences sont persistantes. N'envoie pas les notifications à forte fréquence par défaut. Prépare une abstraction de canal permettant d'ajouter plus tard push, e-mail ou SMS sans les rendre obligatoires pour la V1.

## Forum et modération

Implémente :

```http
GET  /api/public/forum/categories
GET  /api/public/forum/discussions
GET  /api/public/forum/discussions/{discussionId}
POST /api/forum/discussions
POST /api/forum/discussions/{discussionId}/replies
POST /api/forum/posts/{postId}/reports
GET  /api/moderation/reports
POST /api/moderation/discussions/{discussionId}/pin
POST /api/moderation/discussions/{discussionId}/close
POST /api/moderation/posts/{postId}/hide
```

Exigences : authentification pour publier, pagination, validation de taille, texte stocké sans HTML arbitraire, limitation de fréquence raisonnable, statut de discussion, signalement et audit des actions de modération.

## QR code officiel unique généré par le backend

Le backend génère, stocke et sert un unique QR code officiel pour le championnat actif. Le frontend ne génère pas de QR code concurrent.

Le QR code doit contenir une URL de redirection backend stable, par exemple :

```text
https://api.tikiscore.app/r/championnat
```

La route enregistre éventuellement l'ouverture puis redirige vers l'URL publique actuelle du frontend. Cela permet de conserver le même QR code imprimé lorsque la destination finale évolue.

Fonctionnalités minimales :

```http
GET  /api/public/competition/share
GET  /api/public/competition/qr-code
GET  /api/public/competition/qr-code/download
GET  /r/championnat
GET  /api/admin/competition/share
POST /api/admin/competition/share/initialize
POST /api/admin/competition/share/regenerate
POST /api/admin/competition/share/activate
POST /api/admin/competition/share/deactivate
```

Utilise une bibliothèque Java de génération QR déjà installée. Si aucune bibliothèque n'existe, ajoute ZXing `core` et `javase` avec une version compatible avec le projet.

Contraintes :

- un seul partage actif par championnat ;
- génération initiale idempotente ;
- PNG de qualité suffisante pour l'impression, par exemple 1024 × 1024 ;
- correction d'erreur élevée et marge blanche ;
- stockage abstrait derrière une interface afin de pouvoir utiliser le système de fichiers en V1 puis un stockage objet plus tard ;
- cache HTTP avec ETag pour l'image publique ;
- téléchargement avec un nom de fichier sûr ;
- régénération réservée à l'administrateur et auditée ;
- aucun JWT, mot de passe, secret ou donnée personnelle dans le QR code ;
- réponse de partage contenant titre, message, URL publique et URL du PNG.

Ne prétends pas que le backend peut ouvrir le menu natif de partage du téléphone. Il fournit le contenu officiel et peut envoyer des notifications serveur ; le frontend déclenche `navigator.share`.

## Médias

Si le projet gère logos ou images, crée ou complète une abstraction de stockage. Valide le type réel, la taille maximale et le nom côté serveur. N'accepte jamais un chemin système choisi par le client.

## Contrats REST et DTO

Utilise des DTO dédiés et `jakarta.validation`. Les réponses doivent être stables, documentées et adaptées au frontend.

Conventions :

- identifiants cohérents ;
- dates ISO 8601 ;
- `Instant` stocké en UTC ;
- pagination commune ;
- filtres explicites ;
- statuts HTTP corrects ;
- `Location` pour les créations lorsque pertinent ;
- aucune entité JPA sérialisée directement ;
- MapStruct si déjà présent, sinon mapping explicite simple sans introduire inutilement une dépendance.

## Erreurs uniformes

Crée un `@RestControllerAdvice` et un format commun, par exemple :

```json
{
  "timestamp": "2026-10-20T12:00:00Z",
  "status": 422,
  "code": "PLAYER_NOT_IN_TEAM",
  "message": "Le joueur sélectionné n'appartient pas à cette équipe.",
  "path": "/api/match-manager/matches/.../events",
  "fieldErrors": {
    "playerId": "Joueur invalide pour cette équipe."
  },
  "traceId": "..."
}
```

Prévois notamment les codes métier :

```text
MATCH_NOT_FOUND
MATCH_NOT_LIVE
MATCH_ALREADY_STARTED
MATCH_ALREADY_FINISHED
INVALID_MATCH_TRANSITION
MATCH_MANAGER_NOT_ASSIGNED
PLAYER_NOT_IN_TEAM
PLAYER_SUSPENDED
DUPLICATE_EVENT
EVENT_ALREADY_CANCELLED
DISCUSSION_CLOSED
FORUM_PERMISSION_DENIED
ANNOUNCEMENT_ALREADY_PUBLISHED
COMPETITION_NOT_FOUND
SHARE_ALREADY_INITIALIZED
```

Ne révèle pas les traces internes ou détails SQL au client.

## Documentation OpenAPI

Si springdoc-openapi est déjà présent, complète les annotations et groupes. Sinon, ajoute-le seulement si compatible avec la version Spring Boot du projet.

Documente :

- corps de requêtes ;
- réponses de succès ;
- erreurs communes ;
- authentification ;
- pagination ;
- filtres ;
- permissions ;
- messages WebSocket ou leur schéma dans une documentation dédiée.

Expose Swagger UI uniquement selon la configuration des environnements.

## Connexion progressive du frontend

Le backend doit permettre de remplacer progressivement les données locales de `tikiscore-appweb`.

Procède dans cet ordre :

1. championnat actif ;
2. équipes, joueurs et poules ;
3. matchs et résultats ;
4. classements et statistiques ;
5. authentification et profil ;
6. gestionnaire et événements ;
7. temps réel ;
8. communiqués ;
9. notifications ;
10. forum ;
11. partage et QR code.

Ne modifie le frontend que si nécessaire pour aligner un contrat ou vérifier un parcours. Dans ce cas, fais des modifications minimales et conserve le mode démo distinct du mode connecté jusqu'à ce que le remplacement soit complet.

Utilise une variable d'environnement pour l'URL de l'API et ne code pas l'URL de production en dur.

## Tests obligatoires

Ajoute ou complète des tests adaptés à l'infrastructure existante :

### Tests unitaires

- transitions du cycle de match ;
- validation d'un but ;
- appartenance du joueur à l'équipe ;
- calcul du score ;
- annulation d'un événement ;
- calcul du classement ;
- règles de départage ;
- permissions cumulables ;
- génération idempotente du QR code.

### Tests d'intégration

- démarrage du contexte ;
- mappings JPA ;
- migrations sur une base vide ;
- authentification ;
- accès public ;
- refus 401 et 403 ;
- gestionnaire affecté contre gestionnaire non affecté ;
- création idempotente d'un événement ;
- resynchronisation `afterSequence` ;
- publication d'un communiqué ;
- modération ;
- téléchargement du QR code ;
- redirection publique.

Utilise Testcontainers PostgreSQL si la dépendance ou l'environnement Docker est disponible. Sinon, conserve des tests reproductibles cohérents avec la base cible et documente la limite.

## Validation finale

Avant de terminer :

1. exécute les tests backend ;
2. exécute le build Maven ou Gradle complet ;
3. vérifie les migrations sur une base vide ;
4. vérifie le profil de développement ;
5. vérifie qu'aucun secret n'est versionné ;
6. vérifie que les endpoints publics fonctionnent sans authentification ;
7. vérifie que les endpoints privés renvoient 401 ou 403 correctement ;
8. vérifie que le gestionnaire ne peut modifier que ses matchs ;
9. vérifie l'idempotence des événements ;
10. vérifie la reconnexion et la resynchronisation du direct ;
11. vérifie que le QR code renvoyé est un PNG valide et que sa redirection fonctionne ;
12. vérifie la pagination et la validation des entrées ;
13. vérifie qu'aucune entité JPA n'est exposée directement ;
14. vérifie que le projet frontend peut consommer les DTO définis.

## Définition de terminé pour la V1

Le backend est considéré prêt lorsque le scénario suivant fonctionne réellement :

1. un administrateur se connecte ;
2. il configure le championnat actif ;
3. il crée les poules, équipes et joueurs ;
4. il programme un match ;
5. il affecte un gestionnaire ;
6. le gestionnaire consulte ses matchs ;
7. il démarre le match ;
8. il enregistre un but avec buteur et passeur ;
9. le backend valide, sauvegarde, calcule le score et diffuse l'événement ;
10. les spectateurs voient le score officiel ;
11. le gestionnaire ajoute un carton et un remplacement ;
12. il termine le match ;
13. le classement et les statistiques sont actualisés ;
14. l'administrateur publie un communiqué ;
15. les utilisateurs reçoivent une notification interne ;
16. un utilisateur participe au forum ;
17. un modérateur traite un signalement ;
18. un visiteur scanne le QR code officiel et atteint le championnat public.

## Ordre de réalisation imposé

### Lot 1 : fondations

- audit et correction JPA ;
- migrations ;
- erreurs uniformes ;
- configuration par profils ;
- tests de contexte.

### Lot 2 : sécurité et référentiel

- authentification ;
- rôles et permissions ;
- utilisateur connecté ;
- championnat actif ;
- équipes, joueurs et poules.

### Lot 3 : matchs

- calendrier ;
- affectations ;
- cycle de vie ;
- événements ;
- idempotence ;
- score officiel ;
- audit.

### Lot 4 : lecture sportive et direct

- WebSocket/STOMP ;
- resynchronisation REST ;
- classements ;
- buteurs ;
- passeurs ;
- cartons ;
- statistiques.

### Lot 5 : engagement

- communiqués ;
- notifications et préférences ;
- forum ;
- modération.

### Lot 6 : partage

- URL publique stable ;
- génération du QR officiel ;
- stockage ;
- téléchargement ;
- redirection ;
- audit des régénérations.

### Lot 7 : intégration et recette

- documentation OpenAPI ;
- connexion progressive du frontend ;
- tests de bout en bout disponibles ;
- build final ;
- rapport des contrats manquants.

## Résultat final attendu

À la fin, fournis un compte rendu concis contenant :

- fonctionnalités réellement implémentées ;
- fichiers et packages principaux créés ou modifiés ;
- corrections apportées au modèle JPA ;
- migrations ajoutées ;
- endpoints disponibles ;
- rôles et permissions appliqués ;
- fonctionnement du temps réel ;
- fonctionnement du QR code backend ;
- commandes de tests et build exécutées avec leurs résultats ;
- dépendances ajoutées et justification ;
- contrats frontend connectés ;
- hypothèses temporaires ;
- éléments encore bloqués avec la cause exacte.

Ne déclare jamais une fonctionnalité terminée si elle n'est qu'esquissée ou si les tests/build correspondants échouent. Ne t'arrête pas après la création des entités ou contrôleurs : poursuis jusqu'aux services, autorisations, migrations, tests et intégration nécessaires pour obtenir un backend TikiScore V1 réellement exploitable.
