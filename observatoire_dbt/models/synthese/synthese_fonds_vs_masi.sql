-- Les fonds Actions face à leur indice de référence, le MASI (CORRECTIONS.md, Résultat 18) :
-- deux indicateurs classiques pour juger un gérant face à son indice.
-- - tracking error = volatilité annualisée de l'écart hebdomadaire (fonds − MASI) : à quel point le fonds
--   s'écarte de l'indice, dans un sens ou dans l'autre ;
-- - ratio d'information = écart moyen annualisé ÷ tracking error : ce que l'écart a rapporté (ou coûté)
--   par unité d'écart pris. Négatif = le fonds a fait moins bien que l'indice.
-- Limite : le MASI est hors dividendes et les fonds les encaissent ; l'écart réel de gestion est donc
-- plus défavorable aux fonds que ces chiffres ne le montrent.

with r as (
    select date,
           max(case when actif = 'Fonds Actions' then rendement_hebdo end) as fonds,
           max(case when actif = 'MASI'          then rendement_hebdo end) as masi
    from {{ ref('synthese_rendements_hebdo') }}
    group by date
),

ecarts as (
    select date, fonds - masi as ecart
    from r
    where fonds is not null and masi is not null
)

select
    count(*)                                                                         as nb_semaines,
    min(date)                                                                        as debut,
    max(date)                                                                        as fin,
    round((avg(ecart) * 52 * 100)::numeric, 2)                                       as ecart_moyen_annualise_pts,
    round((stddev_samp(ecart) * sqrt(52::numeric) * 100)::numeric, 2)               as tracking_error_pct,
    round((avg(ecart) * 52 / nullif(stddev_samp(ecart) * sqrt(52::numeric), 0))::numeric, 2) as ratio_information
from ecarts
