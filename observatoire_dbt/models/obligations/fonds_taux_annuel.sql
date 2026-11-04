-- Q1 : bilan par année civile — rendement de chaque fonds de taux et variation du taux 10 ans
-- (2022 : du 30/09 au 30/12 ; dernière année : jusqu'à la dernière semaine AMMC disponible)
with base as (
    select * from {{ ref('obligations_vs_taux_hebdo') }}
),

fin_annee as (
    select distinct on (categorie, extract(year from date_semaine))
        categorie,
        extract(year from date_semaine)::int as annee,
        date_semaine,
        indice,
        taux_10a
    from base
    order by categorie, extract(year from date_semaine), date_semaine desc
),

debut_serie as (
    select distinct on (categorie)
        categorie,
        date_semaine,
        indice,
        taux_10a
    from base
    order by categorie, date_semaine
)

select
    f.categorie,
    f.annee,
    coalesce(lag(f.date_semaine) over w, d.date_semaine)                       as date_debut,
    f.date_semaine                                                              as date_fin,
    round((f.indice / coalesce(lag(f.indice) over w, d.indice) - 1) * 100, 2)  as rendement_pct,
    round(coalesce(lag(f.taux_10a) over w, d.taux_10a), 2)                     as taux_10a_debut,
    round(f.taux_10a, 2)                                                        as taux_10a_fin,
    round((f.taux_10a - coalesce(lag(f.taux_10a) over w, d.taux_10a)) * 100, 0) as var_taux_10a_pb
from fin_annee f
join debut_serie d using (categorie)
window w as (partition by f.categorie order by f.annee)