-- Copie figée de la base locale (tâche B7). LOCAL SEULEMENT : ne s'exécute pas sur Supabase.
-- Photo des données au 03/11/2026, pour comparer le site aux valeurs de contrôle de docs/DATA.md
-- même quand Supabase aura évolué avec les mises à jour hebdomadaires.
-- Image : on photocopie le classeur et on met la copie sous verre.
--
-- PARTIE 1 : à exécuter connecté à la base `postgres`, avec personne connecté à `observatoire_maroc`.
-- (CREATE DATABASE ne tourne pas dans une transaction.)
CREATE DATABASE observatoire_fige TEMPLATE observatoire_maroc;

-- Le rôle existe pour tout le serveur local. Son mot de passe se définit à part (jamais dans ce fichier).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'site_lecture') THEN
        CREATE ROLE site_lecture NOLOGIN;
    END IF;
END
$$;
ALTER ROLE site_lecture SET default_transaction_read_only = on;

-- PARTIE 2 : à exécuter connecté à `observatoire_fige`.
-- Mêmes droits que sur Supabase (sql/07_site_lecture.sql) : lire dw et analytics, rien d'autre.
-- La vue des PER (créée sur Supabase en B6, sql/07) n'existait pas dans la base locale : on l'ajoute à la copie.
CREATE OR REPLACE VIEW dw.v_valorisation AS
SELECT annee, perimetre, per, rendement_dividende_pct, estimation, source,
       url_article, date_extraction, date_article
FROM staging.valorisation_marche;

REVOKE ALL ON SCHEMA staging FROM site_lecture;
GRANT USAGE ON SCHEMA dw, analytics TO site_lecture;
GRANT SELECT ON ALL TABLES IN SCHEMA dw, analytics TO site_lecture;

-- PARTIE 3 : à exécuter connecté à `postgres`. La copie refuse toute écriture, même par erreur.
ALTER DATABASE observatoire_fige SET default_transaction_read_only = on;
