# Schéma des adhésions

`V2__championship_memberships.sql` ajoute les adhésions par championnat et migre les rôles métier existants de `user_roles` vers les adhésions correspondantes. Il ne modifie ni ne supprime les anciennes associations.

Le serveur n’utilise pas Flyway ou Liquibase actuellement. Avant de déployer une version avec `ddl-auto=validate`, sauvegarder la base puis exécuter ce script une fois sur la base existante. En développement, Hibernate (`ddl-auto=update`) crée les tables, mais ne réalise pas le transfert des rôles historiques; exécuter aussi le script sur une base de développement conservée.
