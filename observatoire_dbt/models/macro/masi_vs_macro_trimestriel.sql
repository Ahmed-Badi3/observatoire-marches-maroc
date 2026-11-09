-- MASI trimestriel face à la croissance du PIB et au chômage (HCP)
-- derniere_seance : séance qui sert de « fin de trimestre ». Si elle tombe avant les 10 derniers jours
-- du trimestre, le trimestre n'est pas fini (trimestre_en_cours) : le site écrit « 2026 T4 (en cours) ».
with masi_trim as (

    -- clôture de la dernière séance de chaque trimestre
    select distinct on (date_trunc('quarter', date))
        date_trunc('quarter', date)::date as date_ref,
        date                              as derniere_seance,
        cloture                           as masi_fin_trimestre
    from {{ source('staging', 'bvc_indices') }}
    where indice = 'MASI'
    order by date_trunc('quarter', date), date desc

),

masi_perf as (

    select
        date_ref,
        derniere_seance,
        masi_fin_trimestre,
        round(((masi_fin_trimestre / lag(masi_fin_trimestre, 1) over (order by date_ref) - 1) * 100)::numeric, 2) as perf_masi_trimestre_pct,
        round(((masi_fin_trimestre / lag(masi_fin_trimestre, 4) over (order by date_ref) - 1) * 100)::numeric, 2) as perf_masi_annuelle_pct
    from masi_trim

)

select
    m.date_ref,
    extract(year from m.date_ref)::int    as annee,
    extract(quarter from m.date_ref)::int as trimestre,
    m.masi_fin_trimestre,
    m.perf_masi_trimestre_pct,
    m.perf_masi_annuelle_pct,
    p.croissance_annuelle_pct as croissance_pib_pct,
    c.chomage_national_pct,
    m.derniere_seance,
    m.derniere_seance < (m.date_ref + interval '3 months' - interval '10 days')::date as trimestre_en_cours
from masi_perf m
left join {{ ref('croissance_pib') }}       p on p.date_ref = m.date_ref
left join {{ ref('chomage_trimestriel') }}  c on c.date_ref = m.date_ref
