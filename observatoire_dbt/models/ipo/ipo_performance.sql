-- Performance des introductions en bourse depuis le prix d'introduction, comparée au MASI.
-- Horizons en séances de bourse : J1 (1re clôture), J5, 1 mois (20), 6 mois (120), 1 an (250), dernier cours.
-- Rendement anormal = rendement du titre − rendement du MASI sur la même période
-- (MASI de référence = clôture de la veille de la 1re cotation).

with ipo as (
    select *
    from {{ ref('ipo_operations') }}
    where date_premiere_cotation is not null
),

cours as (
    select ticker, date_seance, cloture
    from {{ source('staging_ipo', 'bvc_cours_titres') }}
),

masi as (
    select date_seance, cloture
    from cours
    where ticker = 'MASI'
),

titre as (
    select
        c.ticker,
        c.date_seance,
        c.cloture,
        row_number() over (partition by c.ticker order by c.date_seance) as n_seance
    from cours c
    join ipo i
      on i.ticker = c.ticker
     and c.date_seance >= i.date_premiere_cotation
),

pivot as (
    select
        ticker,
        max(n_seance)                                        as nb_seances,
        max(case when n_seance = 1   then date_seance end)   as d_j1,
        max(case when n_seance = 1   then cloture end)       as c_j1,
        max(case when n_seance = 5   then date_seance end)   as d_j5,
        max(case when n_seance = 5   then cloture end)       as c_j5,
        max(case when n_seance = 20  then date_seance end)   as d_m1,
        max(case when n_seance = 20  then cloture end)       as c_m1,
        max(case when n_seance = 120 then date_seance end)   as d_m6,
        max(case when n_seance = 120 then cloture end)       as c_m6,
        max(case when n_seance = 250 then date_seance end)   as d_a1,
        max(case when n_seance = 250 then cloture end)       as c_a1,
        max(date_seance)                                     as d_dernier,
        (array_agg(cloture order by date_seance desc))[1]    as c_dernier
    from titre
    group by ticker
),

base as (
    select
        i.ticker,
        i.societe,
        i.date_premiere_cotation,
        i.prix_ipo,
        i.montant_mdh,
        i.type_operation,
        i.sursouscription,
        i.nb_souscripteurs,
        i.taux_satisfaction_pct,
        p.nb_seances,
        p.d_dernier,
        p.c_j1, p.c_j5, p.c_m1, p.c_m6, p.c_a1, p.c_dernier,
        mv.cloture   as masi_veille,
        mj1.cloture  as masi_j1,
        mj5.cloture  as masi_j5,
        mm1.cloture  as masi_m1,
        mm6.cloture  as masi_m6,
        ma1.cloture  as masi_a1,
        md.cloture   as masi_dernier
    from ipo i
    left join pivot p on p.ticker = i.ticker
    left join lateral (
        select cloture
        from masi
        where date_seance < i.date_premiere_cotation
        order by date_seance desc
        limit 1
    ) mv on true
    left join masi mj1 on mj1.date_seance = p.d_j1
    left join masi mj5 on mj5.date_seance = p.d_j5
    left join masi mm1 on mm1.date_seance = p.d_m1
    left join masi mm6 on mm6.date_seance = p.d_m6
    left join masi ma1 on ma1.date_seance = p.d_a1
    left join masi md  on md.date_seance  = p.d_dernier
)

select
    ticker,
    societe,
    date_premiere_cotation,
    prix_ipo,
    montant_mdh,
    type_operation,
    sursouscription,
    nb_souscripteurs,
    taux_satisfaction_pct,
    nb_seances,
    d_dernier                                              as date_dernier_cours,
    c_dernier                                              as dernier_cours,

    -- rendement depuis le prix d'introduction (%)
    round((c_j1      / prix_ipo - 1) * 100, 2)             as rdt_j1_pct,
    round((c_j5      / prix_ipo - 1) * 100, 2)             as rdt_j5_pct,
    round((c_m1      / prix_ipo - 1) * 100, 2)             as rdt_1m_pct,
    round((c_m6      / prix_ipo - 1) * 100, 2)             as rdt_6m_pct,
    round((c_a1      / prix_ipo - 1) * 100, 2)             as rdt_1a_pct,
    round((c_dernier / prix_ipo - 1) * 100, 2)             as rdt_depuis_ipo_pct,

    -- MASI sur la même période (%)
    round((masi_dernier / masi_veille - 1) * 100, 2)       as masi_depuis_ipo_pct,

    -- rendement anormal = titre − MASI (points)
    round((c_j1      / prix_ipo - masi_j1      / masi_veille) * 100, 2) as anormal_j1_pts,
    round((c_j5      / prix_ipo - masi_j5      / masi_veille) * 100, 2) as anormal_j5_pts,
    round((c_m1      / prix_ipo - masi_m1      / masi_veille) * 100, 2) as anormal_1m_pts,
    round((c_m6      / prix_ipo - masi_m6      / masi_veille) * 100, 2) as anormal_6m_pts,
    round((c_a1      / prix_ipo - masi_a1      / masi_veille) * 100, 2) as anormal_1a_pts,
    round((c_dernier / prix_ipo - masi_dernier / masi_veille) * 100, 2) as anormal_depuis_ipo_pts,

    -- gain réel d'un souscripteur pour 100 DH demandés (il n'est servi qu'au taux de satisfaction)
    round((c_dernier / prix_ipo - 1) * taux_satisfaction_pct, 3)        as gain_pour_100_dh_demandes,

    -- achat en bourse au cours de la 20e séance (≈ 1 mois), gardé jusqu'au dernier cours (%)
    c_m1                                                                as cours_j20,
    round((c_dernier / c_m1 - 1) * 100, 2)                              as rdt_achat_j20_pct
from base
order by date_premiere_cotation
