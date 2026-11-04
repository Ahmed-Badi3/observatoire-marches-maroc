-- Rendement de chaque placement et portefeuille par année civile.
-- La 1re et la dernière année sont partielles (voir nb_semaines).

with r as (
    select * from {{ ref('synthese_rendements_hebdo') }}
)

select
    actif,
    extract(year from date)::int                                    as annee,
    count(*)                                                        as nb_semaines,
    round(((exp(sum(ln(1 + rendement_hebdo))) - 1) * 100)::numeric, 2) as rendement_pct
from r
group by actif, extract(year from date)
order by annee, rendement_pct desc
