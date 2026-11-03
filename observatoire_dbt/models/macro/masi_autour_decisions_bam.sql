-- Étude d'événement : performance du MASI après chaque décision de Bank Al-Maghrib
with masi as (

    select
        date as date_seance,
        cloture,
        row_number() over (order by date) as num_seance
    from {{ source('staging', 'bvc_indices') }}
    where indice = 'MASI'

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

    -- dernière séance AVANT l'annonce (le marché ne connaît pas encore la décision)
    select
        d.*,
        (select max(m.num_seance) from masi m where m.date_seance < d.date_annonce) as num_ref
    from decisions d

)

select
    r.date_annonce,
    r.type_decision,
    r.variation_pb,
    r.taux_directeur_pct,
    m0.date_seance as seance_reference,
    m0.cloture     as masi_avant,
    round(((m5.cloture  / m0.cloture - 1) * 100)::numeric, 2) as perf_5_seances_pct,
    round(((m20.cloture / m0.cloture - 1) * 100)::numeric, 2) as perf_20_seances_pct
from reference r
join masi m0       on m0.num_seance  = r.num_ref
left join masi m5  on m5.num_seance  = r.num_ref + 5
left join masi m20 on m20.num_seance = r.num_ref + 20