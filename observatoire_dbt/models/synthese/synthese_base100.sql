-- Valeur de chaque placement et portefeuille en base 100 au début de la période commune (vendredis AMMC).
-- Image : 100 DH placés le premier vendredi, et ce qu'ils valent chaque semaine ensuite.
-- Sert au graphique « fonds Actions et MASI dans le temps » du site (CORRECTIONS.md, Résultat 18).

with r as (
    select * from {{ ref('synthese_rendements_hebdo') }}
)

select
    actif,
    date,
    round((100 * exp(sum(ln(1 + rendement_hebdo)) over (partition by actif order by date)))::numeric, 2) as base_100
from r
