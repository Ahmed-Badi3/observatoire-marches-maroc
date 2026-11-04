-- Courbe des taux de référence des bons du Trésor (BAM, marché secondaire)
-- Valeurs brutes publiées : une ligne par date de courbe et par ligne de BDT

DROP TABLE IF EXISTS staging.bam_courbe_taux;

CREATE TABLE staging.bam_courbe_taux (
    date_courbe      DATE           NOT NULL,   -- date demandée à BAM (jour de la courbe)
    date_echeance    DATE           NOT NULL,   -- "Date d'échéance" du BDT
    transaction_mmad NUMERIC(14,2),             -- "Transaction" (millions MAD)
    taux_pct         NUMERIC(8,4)   NOT NULL,   -- "Taux moyen pondéré" en %
    date_valeur      DATE,                      -- "Date de la valeur" (date du taux retenu)
    source           TEXT           DEFAULT 'BAM - courbe des taux de référence BDT',
    date_chargement  TIMESTAMP      DEFAULT now(),
    PRIMARY KEY (date_courbe, date_echeance)
);

-- Lecture seule pour l'agent IA (comme les autres tables)
GRANT SELECT ON staging.bam_courbe_taux TO agent_lecture;