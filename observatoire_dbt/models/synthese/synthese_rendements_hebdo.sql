-- Rendements hebdomadaires de chaque placement et des 3 portefeuilles types.
-- Période commune : semaines AMMC (vendredis) couvertes par l'historique du MASI.
-- Portefeuilles : poids fixes, rééquilibrés chaque semaine, lus dans le seed compositions_portefeuilles
-- (prudent 50/40/10, équilibré 20/40/40, dynamique 10/20/70 en Monétaire / OMLT / fonds Actions).
-- Rendement d'un portefeuille = somme des (poids × rendement de la semaine) de ses placements ;
-- une semaine où un placement manque n'a pas de rendement de portefeuille (comme avant).

with ammc as (
    select date, categorie, indice::numeric as indice
    from {{ ref('ammc_indices_corriges') }}
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

compositions as (
    select portefeuille, placement, poids_pct / 100.0 as poids
    from {{ ref('compositions_portefeuilles') }}
),

nb_placements as (
    select portefeuille, count(*) as n
    from compositions
    group by portefeuille
),

portefeuilles as (
    select a.date, c.portefeuille as actif, sum(c.poids * a.r) as r
    from actifs a
    join compositions c on c.placement = a.actif
    join nb_placements n on n.portefeuille = c.portefeuille
    group by a.date, c.portefeuille, n.n
    having count(*) = n.n          -- tous les placements du portefeuille ont un rendement cette semaine
)

select date, actif, r as rendement_hebdo from actifs
union all
select date, actif, r as rendement_hebdo from portefeuilles where r is not null
