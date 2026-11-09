-- Rendement de chaque placement et portefeuille par année civile.
-- La 1re et la dernière année sont partielles (voir nb_semaines, et annee_partielle pour le site).
-- premiere_date = 1re semaine dont le rendement compte dans l'année (la semaine de base n'a pas de rendement).

with r as (
    select * from {{ ref('synthese_rendements_hebdo') }}
)

select
    actif,
    extract(year from date)::int                                    as annee,
    count(*)                                                        as nb_semaines,
    round(((exp(sum(ln(1 + rendement_hebdo))) - 1) * 100)::numeric, 2) as rendement_pct,
    min(date)                                                       as premiere_date,
    max(date)                                                       as derniere_date,
    {{ annee_partielle('min(date)', 'max(date)', 'extract(year from date)::int') }} as annee_partielle
from r
group by actif, extract(year from date)
order by annee, rendement_pct desc
