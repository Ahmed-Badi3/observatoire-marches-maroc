-- Rôle de lecture du site public (tâche B6) et vue des PER. À exécuter sur Supabase, dans l'éditeur SQL.
-- Relançable sans risque. Aucun mot de passe ici : il se définit à part (Database > Roles dans Supabase).
--
-- Image : on donne au site une clé qui n'ouvre que la vitrine (dw et analytics) et ne permet
-- que de regarder. Les arrière-salles (staging) restent fermées.

-- 1) Vue des PER et dividendes, avec la date de publication de chaque étude
CREATE OR REPLACE VIEW dw.v_valorisation AS
SELECT
    annee,
    perimetre,
    per,
    rendement_dividende_pct,
    estimation,
    source,
    url_article,
    date_extraction,
    date_article
FROM staging.valorisation_marche;

-- 2) Le rôle : créé sans connexion possible (NOLOGIN) tant qu'on ne lui a pas donné de mot de passe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'site_lecture') THEN
        CREATE ROLE site_lecture NOLOGIN;
    END IF;
END
$$;

-- Ceinture et bretelles : même par erreur, ce rôle ne peut écrire nulle part
ALTER ROLE site_lecture SET default_transaction_read_only = on;

-- 3) Droits : entrer dans dw et analytics, lire ce qui s'y trouve, rien d'autre
REVOKE ALL ON SCHEMA staging FROM site_lecture;
GRANT USAGE ON SCHEMA dw, analytics TO site_lecture;
GRANT SELECT ON ALL TABLES IN SCHEMA dw, analytics TO site_lecture;

-- 4) Les vues que dbt (re)crée plus tard sont lisibles automatiquement.
--    dbt supprime et recrée les vues : sans cette ligne, le site perdrait l'accès à chaque build.
--    Valable pour les objets créés par le rôle qui exécute ce script (postgres), comme dbt.
ALTER DEFAULT PRIVILEGES IN SCHEMA dw GRANT SELECT ON TABLES TO site_lecture;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT SELECT ON TABLES TO site_lecture;
