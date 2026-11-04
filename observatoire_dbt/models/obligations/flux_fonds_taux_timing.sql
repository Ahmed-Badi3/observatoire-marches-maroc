-- Q4 : les épargnants achètent-ils les fonds de taux au bon moment ?
-- Corrélation du flux net hebdomadaire avec la performance / la variation des taux
-- des 4 semaines PASSÉES (suivi de tendance) et des 4 semaines SUIVANTES (bon timing)
with flux as (
    select
        date                      as date_semaine,
        categorie,
        souscriptions - rachats   as flux_net
    from {{ source('staging', 'ammc_flux') }}
    where categorie in ('Monétaire', 'Obligations CT', 'Obligations MLT')
),

base as (
    select
        f.date_semaine,
        f.categorie,
        f.flux_net,
        o.indice,
        o.taux_10a
    from flux f
    join {{ ref('obligations_vs_taux_hebdo') }} o
        on o.date_semaine = f.date_semaine
       and o.categorie = f.categorie
),

fenetres as (
    select
        *,
        (indice / lag(indice, 4) over w - 1) * 100    as rend_passe_4s_pct,
        (lead(indice, 4) over w / indice - 1) * 100   as rend_futur_4s_pct,
        (taux_10a - lag(taux_10a, 4) over w) * 100    as var_taux_passee_4s_pb,
        (lead(taux_10a, 4) over w - taux_10a) * 100   as var_taux_future_4s_pb
    from base
    window w as (partition by categorie order by date_semaine)
)

select
    categorie,
    count(*)                                                                    as nb_semaines,
    round(corr(flux_net::float8, rend_passe_4s_pct::float8)::numeric, 3)        as corr_flux_rend_passe,
    round(corr(flux_net::float8, rend_futur_4s_pct::float8)::numeric, 3)        as corr_flux_rend_futur,
    round(corr(flux_net::float8, var_taux_passee_4s_pb::float8)::numeric, 3)    as corr_flux_taux_passe,
    round(corr(flux_net::float8, var_taux_future_4s_pb::float8)::numeric, 3)    as corr_flux_taux_futur
from fenetres
group by categorie