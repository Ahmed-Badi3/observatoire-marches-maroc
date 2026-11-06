-- Courbe des taux de référence des bons du Trésor (BAM, marché secondaire)
-- Valeurs brutes publiées : une ligne par date de courbe et par ligne de BDT
-- Relançable sans perte : CREATE TABLE IF NOT EXISTS ne touche pas à une table déjà remplie.
-- Les droits de l'agent IA (local seulement) sont dans sql/local/01_droits_agent_lecture.sql.

CREATE TABLE IF NOT EXISTS staging.bam_courbe_taux (
    date_courbe      DATE           NOT NULL,   -- date demandée à BAM (jour de la courbe)
    date_echeance    DATE           NOT NULL,   -- "Date d'échéance" du BDT
    transaction_mmad NUMERIC(14,2),             -- "Transaction" (millions MAD)
    taux_pct         NUMERIC(8,4)   NOT NULL,   -- "Taux moyen pondéré" en %
    date_valeur      DATE,                      -- "Date de la valeur" (date du taux retenu)
    source           TEXT           DEFAULT 'BAM - courbe des taux de référence BDT',
    date_chargement  TIMESTAMP      DEFAULT now(),
    PRIMARY KEY (date_courbe, date_echeance)
);
