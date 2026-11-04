-- Q3 : le marché anticipe-t-il les décisions de BAM ?
-- Pour chaque décision depuis sept. 2022 : position du taux 13 semaines par rapport au taux directeur
-- à la veille de l'annonce (annonce = date d'effet − 2 jours), et variation sur les 30 jours précédents
with taux_dir as (
    select
        date_ref                                     as date_effet,
        valeur::numeric                              as taux_apres,
        lag(valeur::numeric) over (order by date_ref) as taux_avant
    from {{ source('staging', 'macro_indicateurs') }}
    where indicateur = 'taux_directeur'
),

decisions as (
    select
        date_effet,
        taux_avant,
        taux_apres,
        case
            when taux_apres > taux_avant then 'Hausse'
            when taux_apres < taux_avant then 'Baisse'
            else 'Maintien'
        end as decision
    from taux_dir
    where date_effet >= '2022-09-01'
      and taux_avant is not null
),

courbe as (
    select
        date_courbe,
        max(taux_pct) filter (where maturite = '13 sem') as taux_13s,
        max(taux_pct) filter (where maturite = '10 ans') as taux_10a
    from {{ ref('courbe_taux_quotidienne') }}
    group by date_courbe
)

select
    d.date_effet,
    d.decision,
    d.taux_avant,
    d.taux_apres,
    veille.date_courbe                                       as date_courbe_veille,
    round(veille.taux_13s, 2)                                as taux_13s_veille,
    round((veille.taux_13s - d.taux_avant) * 100, 0)         as ecart_13s_vs_directeur_pb,
    round((veille.taux_13s - avant30.taux_13s) * 100, 0)     as var_13s_30j_pb,
    round(veille.taux_10a - veille.taux_13s, 2)              as pente_10a_13s_pt
from decisions d
left join lateral (
    select * from courbe c
    where c.date_courbe <= d.date_effet - 3
      and c.taux_13s is not null
    order by c.date_courbe desc
    limit 1
) veille on true
left join lateral (
    select * from courbe c
    where c.date_courbe <= d.date_effet - 33
      and c.taux_13s is not null
    order by c.date_courbe desc
    limit 1
) avant30 on true