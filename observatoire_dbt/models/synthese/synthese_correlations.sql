-- Corrélation des rendements hebdomadaires entre chaque paire de placements (hors portefeuilles).

with r as (
    select *
    from {{ ref('synthese_rendements_hebdo') }}
    where actif not like 'Portefeuille%'
)

select
    a.actif                                                   as actif_1,
    b.actif                                                   as actif_2,
    count(*)                                                  as nb_semaines,
    round(corr(a.rendement_hebdo, b.rendement_hebdo)::numeric, 2) as correlation
from r a
join r b
  on a.date = b.date
 and a.actif < b.actif
group by a.actif, b.actif
order by correlation desc
