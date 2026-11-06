-- Tables AMMC (statistiques hebdomadaires des OPCVM), couche staging.
-- Structure relevée sur la base locale (tâche A5). Chargées par scripts/04_charger_postgres.py,
-- qui les VIDE (TRUNCATE) puis les remplit depuis data/processed/ : elles doivent donc exister avant.
-- Le schéma `staging` se crée à part (CREATE SCHEMA IF NOT EXISTS staging;).

-- Actif net par catégorie : une ligne par semaine x catégorie (y compris la catégorie 'Total')
CREATE TABLE IF NOT EXISTS staging.ammc_actif_net (
    date               DATE             NOT NULL,
    categorie          VARCHAR(30)      NOT NULL,
    nb_opcvm           INTEGER,
    actif_net          NUMERIC(20, 2),
    structure_pct      DOUBLE PRECISION,
    var_hebdo_pct      DOUBLE PRECISION,
    var_mensuelle_pct  DOUBLE PRECISION,
    var_annuelle_pct   DOUBLE PRECISION,
    PRIMARY KEY (date, categorie)
);

-- Indices de performance par catégorie : une ligne par semaine x catégorie
CREATE TABLE IF NOT EXISTS staging.ammc_indices (
    date               DATE             NOT NULL,
    categorie          VARCHAR(30)      NOT NULL,
    indice             DOUBLE PRECISION,
    var_hebdo_pct      DOUBLE PRECISION,
    var_mensuelle_pct  DOUBLE PRECISION,
    var_annuelle_pct   DOUBLE PRECISION,
    PRIMARY KEY (date, categorie)
);

-- Souscriptions et rachats par catégorie : une ligne par semaine x catégorie
CREATE TABLE IF NOT EXISTS staging.ammc_flux (
    date               DATE             NOT NULL,
    categorie          VARCHAR(30)      NOT NULL,
    souscriptions      NUMERIC(20, 2),
    rachats            NUMERIC(20, 2),
    PRIMARY KEY (date, categorie)
);

-- Composition de l'actif des OPCVM par poste : une ligne par semaine x poste
CREATE TABLE IF NOT EXISTS staging.ammc_actif_valeurs (
    date               DATE             NOT NULL,
    poste              VARCHAR(80)      NOT NULL,
    montant            NUMERIC(20, 2),
    structure_pct      DOUBLE PRECISION,
    var_hebdo_pct      DOUBLE PRECISION,
    var_mensuelle_pct  DOUBLE PRECISION,
    var_annuelle_pct   DOUBLE PRECISION,
    PRIMARY KEY (date, poste)
);
