-- Ratios de valorisation du marché (PER, rendement), extraits d'articles par n8n + IA
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
    CONSTRAINT valorisation_unique UNIQUE NULLS NOT DISTINCT (annee, perimetre, source, url_article)
);