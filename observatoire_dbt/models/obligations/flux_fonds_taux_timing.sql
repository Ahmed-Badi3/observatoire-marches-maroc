-- Q4 : les épargnants achètent-ils les fonds de taux au bon moment ?
-- Corrélation du flux net hebdomadaire avec la performance / la variation des taux
-- des 4 semaines PASSÉES (suivi de tendance) et des 4 semaines SUIVANTES (bon timing)
-- Deux mesures du flux : en dirhams (flux_net), et en % de l'actif net de la semaine précédente
-- (flux_net_pct), comme pour les fonds Actions (dw.v_kpi_timing) : seule la seconde se compare à leur 0,43.
with flux as (
    select
        date                      as date_semaine,
        categorie,
        souscriptions - rachats   as flux_net
    from {{ source('staging', 'ammc_flux') }}
    where categorie in ('Monétaire', 'Obligations CT', 'Obligations MLT')
),

actif as (
    select date as date_semaine, categorie, actif_net
    from {{ source('staging', 'ammc_actif_net') }}
),

base as (
    select
        f.date_semaine,
        f.categorie,
        f.flux_net,
        f.flux_net / nullif(lag(a.actif_net) over (partition by f.categorie order by f.date_semaine), 0) * 100
                                  as flux_net_pct,
        o.indice,
        o.taux_10a
    from flux f
    left join actif a
        on a.date_semaine = f.date_semaine
       and a.categorie = f.categorie
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
    round(corr(flux_net::float8, var_taux_future_4s_pb::float8)::numeric, 3)    as corr_flux_taux_futur,
    round(corr(flux_net_pct::float8, rend_passe_4s_pct::float8)::numeric, 3)    as corr_flux_pct_rend_passe,
    round(corr(flux_net_pct::float8, rend_futur_4s_pct::float8)::numeric, 3)    as corr_flux_pct_rend_futur
from fenetres
group by categorie