-- Q2 : sensibilité implicite des fonds de taux au taux 10 ans
-- Régression : rendement hebdo (%) = a + b × variation du taux 10 ans (en points)
-- Sensibilité implicite = −b : perte en % du fonds pour +1 point de taux 10 ans
with base as (
    select
        categorie,
        date_semaine,
        rendement_hebdo_pct::float8           as y,
        (var_taux_10a_pb / 100.0)::float8     as x
    from {{ ref('obligations_vs_taux_hebdo') }}
    where rendement_hebdo_pct is not null
      and var_taux_10a_pb is not null
),

periodes as (
    select 'Toute la période' as periode, b.* from base b
    union all
    select 'Depuis le 24/03/2023 (nouvelle méthode BAM)' as periode, b.* from base b
    where b.date_semaine >= '2023-03-24'
)

select
    periode,
    categorie,
    count(*)                               as nb_semaines,
    round((-regr_slope(y, x))::numeric, 2) as sensibilite_implicite,
    round(corr(y, x)::numeric, 3)          as correlation,
    round(regr_r2(y, x)::numeric, 3)       as r2
from periodes
group by periode, categorie