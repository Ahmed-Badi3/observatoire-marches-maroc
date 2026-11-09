-- =====================================================================
-- Module 2 : marché actions — rendement, volatilité, drawdown du MASI
-- =====================================================================

-- ---------- Quotidien : rendement du jour et chute depuis le sommet ----------
CREATE OR REPLACE VIEW dw.v_masi_drawdown AS
SELECT
    date,
    cloture,
    cloture / LAG(cloture) OVER (ORDER BY date) - 1                AS rendement_jour,
    MAX(cloture) OVER (ORDER BY date)                              AS plus_haut_atteint,
    (cloture / MAX(cloture) OVER (ORDER BY date) - 1) * 100        AS drawdown_pct
FROM dw.fact_masi_quotidien;

-- ---------- Annuel : rendement, volatilité, pire drawdown ----------
-- premiere_date, derniere_date, annee_partielle : pour l'étiquette « 2026 (jan.–oct.) » du site.
-- Règle « partielle » identique à la macro dbt annee_partielle : début après le 10/01 ou fin avant le 20/12.
-- Les nouvelles colonnes sont À LA FIN : CREATE OR REPLACE VIEW n'accepte que des colonnes ajoutées en fin.
CREATE OR REPLACE VIEW dw.v_masi_annuel AS
WITH par_annee AS (
    SELECT
        EXTRACT(YEAR FROM date)::int                       AS annee,
        COUNT(*)                                           AS nb_seances,
        (ARRAY_AGG(cloture ORDER BY date))[1]              AS premiere_cloture,
        (ARRAY_AGG(cloture ORDER BY date DESC))[1]         AS derniere_cloture,
        STDDEV_SAMP(rendement_jour) * SQRT(252) * 100      AS volatilite_annualisee_pct,
        MIN(drawdown_pct)                                  AS pire_drawdown_pct,
        MIN(date)                                          AS premiere_date,
        MAX(date)                                          AS derniere_date
    FROM dw.v_masi_drawdown
    GROUP BY 1
)
SELECT
    annee,
    nb_seances,
    ROUND(derniere_cloture::numeric, 2)                                          AS cloture_fin,
    ROUND(((derniere_cloture / COALESCE(LAG(derniere_cloture) OVER (ORDER BY annee),
                                        premiere_cloture) - 1) * 100)::numeric, 1) AS rendement_pct,
    ROUND(volatilite_annualisee_pct::numeric, 1)                                 AS volatilite_annualisee_pct,
    ROUND(pire_drawdown_pct::numeric, 1)                                         AS pire_drawdown_pct,
    premiere_date,
    derniere_date,
    (premiere_date > MAKE_DATE(annee, 1, 10) OR derniere_date < MAKE_DATE(annee, 12, 20)) AS annee_partielle
FROM par_annee
ORDER BY annee;

-- =====================================================================
-- Tous les indices (MASI, MASI 20, secteurs...) : même calcul par indice
-- =====================================================================

-- ---------- Quotidien : rendement, base 100, drawdown, par indice ----------
CREATE OR REPLACE VIEW dw.v_indices_quotidien AS
SELECT
    indice,
    date,
    cloture,
    cloture / LAG(cloture) OVER w - 1                                     AS rendement_jour,
    cloture / FIRST_VALUE(cloture) OVER w * 100                           AS base_100,
    (cloture / MAX(cloture) OVER (PARTITION BY indice ORDER BY date) - 1) * 100 AS drawdown_pct
FROM staging.bvc_indices
WINDOW w AS (PARTITION BY indice ORDER BY date);

-- ---------- Annuel, par indice ----------
CREATE OR REPLACE VIEW dw.v_indices_annuel AS
WITH par_annee AS (
    SELECT
        indice,
        EXTRACT(YEAR FROM date)::int                       AS annee,
        COUNT(*)                                           AS nb_seances,
        (ARRAY_AGG(cloture ORDER BY date))[1]              AS premiere_cloture,
        (ARRAY_AGG(cloture ORDER BY date DESC))[1]         AS derniere_cloture,
        STDDEV_SAMP(rendement_jour) * SQRT(252) * 100      AS volatilite_annualisee_pct,
        MIN(drawdown_pct)                                  AS pire_drawdown_pct
    FROM dw.v_indices_quotidien
    GROUP BY indice, annee
)
SELECT
    indice,
    annee,
    nb_seances,
    ROUND(derniere_cloture::numeric, 2)                                          AS cloture_fin,
    ROUND(((derniere_cloture / COALESCE(LAG(derniere_cloture) OVER (PARTITION BY indice ORDER BY annee),
                                        premiere_cloture) - 1) * 100)::numeric, 1) AS rendement_pct,
    ROUND(volatilite_annualisee_pct::numeric, 1)                                 AS volatilite_annualisee_pct,
    ROUND(pire_drawdown_pct::numeric, 1)                                         AS pire_drawdown_pct
FROM par_annee;

-- ---------- Synthèse sur toute la période, une ligne par indice ----------
CREATE OR REPLACE VIEW dw.v_indices_synthese AS
SELECT
    indice,
    MIN(date)                                                         AS debut,
    MAX(date)                                                         AS fin,
    ROUND(((ARRAY_AGG(cloture ORDER BY date DESC))[1]
         / (ARRAY_AGG(cloture ORDER BY date))[1] * 100 - 100)::numeric, 1) AS rendement_total_pct,
    ROUND((STDDEV_SAMP(rendement_jour) * SQRT(252) * 100)::numeric, 1) AS volatilite_annualisee_pct,
    ROUND(MIN(drawdown_pct)::numeric, 1)                              AS pire_drawdown_pct,
    ROUND(((ARRAY_AGG(drawdown_pct ORDER BY date DESC))[1])::numeric, 1) AS drawdown_actuel_pct
FROM dw.v_indices_quotidien
GROUP BY indice;