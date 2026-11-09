-- Q1 : bilan par année civile — rendement de chaque fonds de taux et variation du taux 10 ans
-- (2022 : du 30/09 au 30/12 ; dernière année : jusqu'à la dernière semaine AMMC disponible)
-- date_debut = semaine de BASE du calcul (fin de l'année précédente, ou 1re semaine de la série).
-- premiere_date = 1re semaine dont le rendement compte dans l'année : c'est elle qui sert à l'étiquette
-- « 2022 (oct.–déc.) » du site, avec derniere_date (= date_fin) et annee_partielle.
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
),

premiere_semaine as (
    -- 1re semaine de chaque année, sans la semaine de base de la série (elle n'a pas de rendement)
    select b.categorie, extract(year from b.date_semaine)::int as annee, min(b.date_semaine) as premiere_date
    from base b
    join debut_serie d using (categorie)
    where b.date_semaine > d.date_semaine
    group by b.categorie, extract(year from b.date_semaine)
)

select
    f.categorie,
    f.annee,
    coalesce(lag(f.date_semaine) over w, d.date_semaine)                       as date_debut,
    f.date_semaine                                                              as date_fin,
    round((f.indice / coalesce(lag(f.indice) over w, d.indice) - 1) * 100, 2)  as rendement_pct,
    round(coalesce(lag(f.taux_10a) over w, d.taux_10a), 2)                     as taux_10a_debut,
    round(f.taux_10a, 2)                                                        as taux_10a_fin,
    round((f.taux_10a - coalesce(lag(f.taux_10a) over w, d.taux_10a)) * 100, 0) as var_taux_10a_pb,
    p.premiere_date,
    f.date_semaine                                                              as derniere_date,
    {{ annee_partielle('p.premiere_date', 'f.date_semaine', 'f.annee') }}      as annee_partielle
from fin_annee f
join debut_serie d using (categorie)
join premiere_semaine p on p.categorie = f.categorie and p.annee = f.annee
window w as (partition by f.categorie order by f.annee)
