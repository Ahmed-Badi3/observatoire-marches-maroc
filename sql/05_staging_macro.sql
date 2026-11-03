-- Indicateurs macroéconomiques (HCP, BAM) au format long : une ligne = une date x un indicateur
CREATE TABLE IF NOT EXISTS staging.macro_indicateurs (
    date_ref          DATE          NOT NULL,
    indicateur        VARCHAR(80)   NOT NULL,
    libelle           VARCHAR(150)  NOT NULL,
    valeur            NUMERIC(10,2) NOT NULL,
    frequence         VARCHAR(15)   NOT NULL,
    source            VARCHAR(30)   NOT NULL,
    fichier           VARCHAR(200),
    date_chargement   TIMESTAMP     DEFAULT now(),
    CONSTRAINT macro_unique UNIQUE (date_ref, indicateur)
);