-- Ratios de valorisation du marché (PER, rendement), extraits d'articles par n8n + IA
-- Source de référence versionnée : data/processed/valorisation_marche.csv (chargé par scripts/10_charger_valorisation.py)
CREATE TABLE IF NOT EXISTS staging.valorisation_marche (
    id                       SERIAL PRIMARY KEY,
    annee                    INTEGER,
    perimetre                VARCHAR(80)   NOT NULL,
    per                      NUMERIC(6, 2),
    rendement_dividende_pct  NUMERIC(5, 2),
    estimation               BOOLEAN,
    source                   VARCHAR(120)  NOT NULL,
    url_article              TEXT          NOT NULL,
    date_extraction          DATE          NOT NULL DEFAULT CURRENT_DATE,
    date_article             DATE,         -- date de publication de l'étude (tâche A7)
    CONSTRAINT valorisation_unique UNIQUE NULLS NOT DISTINCT (annee, perimetre, source, url_article)
);

-- Base créée avant la tâche A7 : ajoute la colonne si elle manque (sans effet si elle existe déjà)
ALTER TABLE staging.valorisation_marche ADD COLUMN IF NOT EXISTS date_article DATE;
