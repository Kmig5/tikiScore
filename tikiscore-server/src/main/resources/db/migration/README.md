# Migrations SQL

`V2__championship_memberships.sql` ajoute les adhésions par championnat et migre les rôles métier existants de `user_roles` vers les adhésions correspondantes. Il ne modifie ni ne supprime les anciennes associations.

`V3__match_player_ratings.sql` ajoute les notes par match, joueur et utilisateur, avec une seule note modifiable par utilisateur pour chaque joueur du match.

Le serveur n’utilise pas Flyway ou Liquibase actuellement. Avant de déployer une version avec `ddl-auto=validate`, sauvegarder la base puis exécuter les scripts dans l’ordre (`V2`, puis `V3`) sur la base existante. En développement, Hibernate (`ddl-auto=update`) crée les tables, mais ne réalise pas le transfert des rôles historiques; exécuter aussi les scripts sur une base de développement conservée.
