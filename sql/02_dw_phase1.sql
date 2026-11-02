-- =====================================================================
-- Couche dw : schéma en étoile pour la phase 1 (OPCVM + MASI)
-- Des VUES : elles se mettent à jour toutes seules après chaque rechargement
-- =====================================================================

-- ---------- Dimension date : un jour par ligne ----------
CREATE OR REPLACE VIEW dw.dim_date AS
SELECT
    d::date                                   AS date,
    EXTRACT(YEAR    FROM d)::int              AS annee,
    EXTRACT(QUARTER FROM d)::int              AS trimestre,
    EXTRACT(MONTH   FROM d)::int              AS mois,
    TO_CHAR(d, 'YYYY-MM')                     AS annee_mois,
    EXTRACT(WEEK    FROM d)::int              AS semaine_iso,
    EXTRACT(ISODOW  FROM d)::int              AS jour_semaine   -- 1 = lundi
FROM generate_series('2022-01-01'::date, '2027-12-31'::date, interval '1 day') AS d;

-- ---------- Dimension catégorie OPCVM ----------
CREATE OR REPLACE VIEW dw.dim_categorie AS
SELECT * FROM (VALUES
    ('Monétaire',       1, 'Prudent'),
    ('Obligations CT',  2, 'Prudent'),
    ('Obligations MLT', 3, 'Équilibré'),
    ('Diversifiés',     4, 'Équilibré'),
    ('Actions',         5, 'Dynamique'),
    ('Contractuel',     6, 'Autre')
) AS c(categorie, ordre_risque, profil);

-- ---------- Fait OPCVM : une ligne par semaine × catégorie ----------
CREATE OR REPLACE VIEW dw.fact_opcvm_hebdo AS
SELECT
    a.date,
    a.categorie,
    a.nb_opcvm,
    a.actif_net,
    f.souscriptions,
    f.rachats,
    f.souscriptions - f.rachats               AS flux_net,
    i.indice                                  AS indice_perf,
    i.var_hebdo_pct                           AS perf_hebdo_pct
FROM staging.ammc_actif_net a
LEFT JOIN staging.ammc_flux    f ON f.date = a.date AND f.categorie = a.categorie
LEFT JOIN staging.ammc_indices i ON i.date = a.date AND i.categorie = a.categorie
WHERE a.categorie <> 'Total';            -- le total se recalcule dans Power BI

-- ---------- Fait MASI quotidien ----------
CREATE OR REPLACE VIEW dw.fact_masi_quotidien AS
SELECT date, cloture, plus_haut, plus_bas, var_quotidienne_pct
FROM staging.bvc_indices
WHERE indice = 'MASI';

-- ---------- Fait MASI hebdo, aligné sur les dates AMMC ----------
-- Pour chaque date de publication AMMC : dernière clôture MASI connue à cette date
CREATE OR REPLACE VIEW dw.fact_masi_hebdo AS
WITH semaines AS (
    SELECT DISTINCT date FROM staging.ammc_actif_net
),
aligne AS (
    SELECT s.date, m.date AS date_seance, m.cloture
    FROM semaines s
    CROSS JOIN LATERAL (
        SELECT date, cloture
        FROM staging.bvc_indices
        WHERE indice = 'MASI' AND date <= s.date
        ORDER BY date DESC
        LIMIT 1
    ) m
    WHERE s.date >= (SELECT MIN(date) FROM staging.bvc_indices WHERE indice = 'MASI')
)
SELECT
    date,
    date_seance,
    cloture                                                    AS masi,
    (cloture / LAG(cloture) OVER (ORDER BY date) - 1) * 100    AS masi_perf_hebdo_pct
FROM aligne;

-- ---------- Analyse : flux OPCVM Actions face au MASI ----------
CREATE OR REPLACE VIEW dw.v_actions_vs_masi AS
WITH base AS (
    SELECT
        o.date,
        o.flux_net,
        o.actif_net,
        o.flux_net / NULLIF(LAG(o.actif_net) OVER (ORDER BY o.date), 0) * 100 AS flux_net_pct,
        m.masi
    FROM dw.fact_opcvm_hebdo o
    JOIN dw.fact_masi_hebdo m USING (date)
    WHERE o.categorie = 'Actions'
)
SELECT
    date,
    flux_net,
    flux_net_pct,
    masi,
    (masi / LAG(masi, 4)  OVER w - 1) * 100 AS masi_perf_4s_passees,
    (LEAD(masi, 4) OVER w / masi - 1) * 100 AS masi_perf_4s_futures
FROM base
WINDOW w AS (ORDER BY date);

-- ---------- KPI : timing des épargnants (OPCVM Actions vs MASI) ----------
CREATE OR REPLACE VIEW dw.v_kpi_timing AS
WITH mensuel AS (
    SELECT
        DATE_TRUNC('month', date)                  AS mois,
        SUM(flux_net)                              AS flux,
        (ARRAY_AGG(masi ORDER BY date DESC))[1]    AS masi_fin
    FROM dw.v_actions_vs_masi
    GROUP BY 1
)
SELECT
    (SELECT corr(flux_net_pct, masi_perf_4s_passees) FROM dw.v_actions_vs_masi) AS corr_passe,
    (SELECT corr(flux_net_pct, masi_perf_4s_futures) FROM dw.v_actions_vs_masi) AS corr_futur,
    SUM(masi_fin * flux) FILTER (WHERE flux > 0) / SUM(flux) FILTER (WHERE flux > 0) AS masi_moyen_achat,
    SUM(masi_fin * flux) FILTER (WHERE flux < 0) / SUM(flux) FILTER (WHERE flux < 0) AS masi_moyen_vente
FROM mensuel;