-- Une ligne par placement ou portefeuille : rendement, risque, pire baisse.
-- Ratio rendement/risque (Sharpe) = (rendement annualisé − rendement du Monétaire) / volatilité annualisée.

with r as (
    select * from {{ ref('synthese_rendements_hebdo') }}
),

cumul as (
    select
        actif,
        date,
        exp(sum(ln(1 + rendement_hebdo)) over (partition by actif order by date)) as valeur
    from r
),

baisses as (
    select
        actif,
        valeur / greatest(1, max(valeur) over (partition by actif order by date)) - 1 as drawdown
    from cumul
),

stats as (
    select
        actif,
        count(*)                                                     as nb_semaines,
        min(date)                                                    as debut,
        max(date)                                                    as fin,
        exp(sum(ln(1 + rendement_hebdo))) - 1                        as rdt_cumule,
        exp(sum(ln(1 + rendement_hebdo)) * 52.0 / count(*)) - 1      as rdt_annualise,
        stddev_samp(rendement_hebdo) * sqrt(52::numeric)             as vol_annualisee,
        min(rendement_hebdo)                                         as pire_semaine,
        avg(case when rendement_hebdo < 0 then 1.0 else 0.0 end)     as part_semaines_negatives
    from r
    group by actif
),

pires as (
    select actif, min(drawdown) as pire_baisse
    from baisses
    group by actif
),

monetaire as (
    select rdt_annualise as rdt_mon
    from stats
    where actif = 'Monétaire'
)

select
    s.actif,
    s.nb_semaines,
    s.debut,
    s.fin,
    round((s.rdt_cumule * 100)::numeric, 2)                                   as rdt_cumule_pct,
    round((s.rdt_annualise * 100)::numeric, 2)                                as rdt_annualise_pct,
    round((s.vol_annualisee * 100)::numeric, 2)                               as volatilite_pct,
    round((p.pire_baisse * 100)::numeric, 2)                                  as pire_baisse_pct,
    round((s.pire_semaine * 100)::numeric, 2)                                 as pire_semaine_pct,
    round((s.part_semaines_negatives * 100)::numeric, 1)                      as semaines_negatives_pct,
    round(((s.rdt_annualise - m.rdt_mon) / nullif(s.vol_annualisee, 0))::numeric, 2) as ratio_rendement_risque
from stats s
join pires p using (actif)
cross join monetaire m
order by s.rdt_annualise desc
