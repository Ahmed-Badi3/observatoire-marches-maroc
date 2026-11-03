-- Étude d'événement : performance du MASI après chaque décision de Bank Al-Maghrib,
-- comparée à la performance moyenne d'un jour ordinaire (rendement anormal)
with masi as (

    select
        date as date_seance,
        cloture,
        row_number() over (order by date) as num_seance,
        lead(cloture, 5)  over (order by date) as cloture_5,
        lead(cloture, 20) over (order by date) as cloture_20
    from {{ source('staging', 'bvc_indices') }}
    where indice = 'MASI'

),

reference_marche as (

    -- performance moyenne sur 5 et 20 séances, en partant de n'importe quel jour
    select
        avg((cloture_5  / cloture - 1) * 100) as ref_5,
        avg((cloture_20 / cloture - 1) * 100) as ref_20
    from masi

),

decisions as (

    select
        date_effet,
        date_effet - 2 as date_annonce,   -- conseil le mardi, entrée en vigueur le jeudi
        taux_directeur_pct,
        variation_pb,
        type_decision
    from {{ ref('decisions_bam') }}

),

reference as (

    -- dernière séance AVANT l'annonce
    select
        d.*,
        (select max(m.num_seance) from masi m where m.date_seance < d.date_annonce) as num_ref
    from decisions d

),

evenements as (

    select
        r.date_annonce,
        r.type_decision,
        r.variation_pb,
        r.taux_directeur_pct,
        m0.date_seance as seance_reference,
        m0.cloture     as masi_avant,
        (m0.cloture_5  / m0.cloture - 1) * 100 as perf_5,
        (m0.cloture_20 / m0.cloture - 1) * 100 as perf_20
    from reference r
    join masi m0 on m0.num_seance = r.num_ref

)

select
    e.date_annonce,
    e.type_decision,
    e.variation_pb,
    e.taux_directeur_pct,
    e.seance_reference,
    e.masi_avant,
    round(e.perf_5::numeric, 2)                 as perf_5_seances_pct,
    round(e.perf_20::numeric, 2)                as perf_20_seances_pct,
    round(rm.ref_5::numeric, 2)                 as reference_5_seances_pct,
    round(rm.ref_20::numeric, 2)                as reference_20_seances_pct,
    round((e.perf_5  - rm.ref_5)::numeric, 2)   as rendement_anormal_5_pct,
    round((e.perf_20 - rm.ref_20)::numeric, 2)  as rendement_anormal_20_pct
from evenements e
cross join reference_marche rm