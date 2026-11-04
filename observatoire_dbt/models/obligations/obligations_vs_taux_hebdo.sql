-- Une ligne par semaine AMMC (vendredi) et par catégorie de fonds de taux :
-- rendement hebdomadaire du fonds + niveau et variation des taux BAM
with indices as (
    select date, categorie, indice
    from {{ source('staging', 'ammc_indices') }}
    where categorie in ('Monétaire', 'Obligations CT', 'Obligations MLT')
),

semaines as (
    select distinct date as date_semaine
    from indices
),

-- courbe retenue pour chaque semaine : la plus récente, au plus tard le vendredi
-- (jusqu'à 6 jours avant si le vendredi est férié)
courbe_semaine as (
    select distinct on (s.date_semaine, c.maturite)
        s.date_semaine,
        c.maturite,
        c.date_courbe,
        c.taux_pct
    from semaines s
    join {{ ref('courbe_taux_quotidienne') }} c
        on c.date_courbe <= s.date_semaine
       and c.date_courbe > s.date_semaine - 7
    order by s.date_semaine, c.maturite, c.date_courbe desc
),

-- une ligne par semaine, une colonne par maturité
taux as (
    select
        s.date_semaine,
        max(cs.date_courbe)                                     as date_courbe,
        max(cs.taux_pct) filter (where cs.maturite = '13 sem')  as taux_13s,
        max(cs.taux_pct) filter (where cs.maturite = '2 ans')   as taux_2a,
        max(cs.taux_pct) filter (where cs.maturite = '5 ans')   as taux_5a,
        max(cs.taux_pct) filter (where cs.maturite = '10 ans')  as taux_10a
    from semaines s
    left join courbe_semaine cs on cs.date_semaine = s.date_semaine
    group by s.date_semaine
),

taux_var as (
    select
        *,
        taux_10a - lag(taux_10a) over (order by date_semaine)  as var_taux_10a_pt,
        taux_5a  - lag(taux_5a)  over (order by date_semaine)  as var_taux_5a_pt,
        taux_10a - taux_13s                                     as pente_10a_13s_pt
    from taux
),

rendements as (
    select
        date,
        categorie,
        indice,
        (indice / lag(indice) over (partition by categorie order by date) - 1) * 100
            as rendement_hebdo_pct
    from indices
)

select
    r.date                                   as date_semaine,
    r.categorie,
    round(r.indice::numeric, 4)              as indice,
    round(r.rendement_hebdo_pct::numeric, 4) as rendement_hebdo_pct,
    t.date_courbe,
    round(t.taux_13s, 4)                     as taux_13s,
    round(t.taux_2a, 4)                      as taux_2a,
    round(t.taux_5a, 4)                      as taux_5a,
    round(t.taux_10a, 4)                     as taux_10a,
    round(t.var_taux_10a_pt * 100, 1)        as var_taux_10a_pb,
    round(t.var_taux_5a_pt * 100, 1)         as var_taux_5a_pb,
    round(t.pente_10a_13s_pt, 4)             as pente_10a_13s_pt
from rendements r
left join taux_var t on t.date_semaine = r.date