-- Rendements hebdomadaires de chaque placement et des 3 portefeuilles types.
-- Période commune : semaines AMMC (vendredis) couvertes par l'historique du MASI.
-- Portefeuilles : poids fixes, rééquilibrés chaque semaine.
--   prudent    = 50 % Monétaire, 40 % OMLT, 10 % fonds Actions
--   équilibré  = 20 % Monétaire, 40 % OMLT, 40 % fonds Actions
--   dynamique  = 10 % Monétaire, 20 % OMLT, 70 % fonds Actions

with ammc as (
    select date, categorie, indice::numeric as indice
    from {{ source('staging_synthese', 'ammc_indices') }}
),

masi_jour as (
    select date_seance, cloture
    from {{ source('staging_ipo', 'bvc_cours_titres') }}
    where ticker = 'MASI'
),

semaines as (
    select distinct date
    from ammc
    where date >= (select min(date_seance) from masi_jour)
      and date <= (select max(date_seance) from masi_jour)
),

niveaux as (
    select
        s.date,
        case a.categorie
            when 'Actions'         then 'Fonds Actions'
            when 'Diversifiés'     then 'Fonds Diversifiés'
            when 'Obligations MLT' then 'OMLT'
            when 'Obligations CT'  then 'OCT'
            when 'Monétaire'       then 'Monétaire'
        end        as actif,
        a.indice   as niveau
    from semaines s
    join ammc a on a.date = s.date

    union all

    select s.date, 'MASI' as actif, m.cloture as niveau
    from semaines s
    join lateral (
        select cloture
        from masi_jour
        where date_seance <= s.date
        order by date_seance desc
        limit 1
    ) m on true
),

rendements as (
    select
        date,
        actif,
        niveau / lag(niveau) over (partition by actif order by date) - 1 as r
    from niveaux
    where actif is not null
),

actifs as (
    select date, actif, r
    from rendements
    where r is not null
),

pivot as (
    select
        date,
        max(case when actif = 'Monétaire'     then r end) as mon,
        max(case when actif = 'OMLT'          then r end) as omlt,
        max(case when actif = 'Fonds Actions' then r end) as act
    from actifs
    group by date
),

portefeuilles as (
    select date, 'Portefeuille prudent'   as actif, 0.5 * mon + 0.4 * omlt + 0.1 * act as r from pivot
    union all
    select date, 'Portefeuille équilibré' as actif, 0.2 * mon + 0.4 * omlt + 0.4 * act as r from pivot
    union all
    select date, 'Portefeuille dynamique' as actif, 0.1 * mon + 0.2 * omlt + 0.7 * act as r from pivot
)

select date, actif, r as rendement_hebdo from actifs
union all
select date, actif, r as rendement_hebdo from portefeuilles where r is not null
