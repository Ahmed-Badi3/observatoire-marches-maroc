-- MASI nominal vs MASI réel (corrigé de l'inflation), en base 100, fréquence mensuelle
with masi_mensuel as (

    -- clôture de la dernière séance de chaque mois
    select distinct on (date_trunc('month', date))
        date_trunc('month', date)::date as mois,
        date    as derniere_seance,
        cloture as masi
    from {{ source('staging', 'bvc_indices') }}
    where indice = 'MASI'
    order by date_trunc('month', date), date desc

),

joint as (

    select m.mois, m.derniere_seance, m.masi, i.indice_general as ipc
    from masi_mensuel m
    join {{ ref('inflation_mensuelle') }} i on i.date_ref = m.mois

)

select
    mois,
    derniere_seance,
    masi,
    ipc,
    round((masi / first_value(masi) over w * 100)::numeric, 2)               as masi_nominal_base100,
    round(((masi / ipc) / first_value(masi / ipc) over w * 100)::numeric, 2) as masi_reel_base100
from joint
window w as (order by mois)