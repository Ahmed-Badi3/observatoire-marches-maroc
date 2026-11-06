-- Moyenne, par type de décision de Bank Al-Maghrib, du rendement anormal du MASI
-- (écart avec une séance ordinaire) sur 5 et 20 séances après l'annonce.
select
    type_decision,
    count(*)                                          as nb_decisions,
    round(avg(rendement_anormal_5_pct), 2)            as rendement_anormal_5_moyen_pct,
    round(avg(rendement_anormal_20_pct), 2)           as rendement_anormal_20_moyen_pct
from {{ ref('masi_autour_decisions_bam') }}
group by type_decision
