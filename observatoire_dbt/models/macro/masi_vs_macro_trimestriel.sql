-- MASI trimestriel face à la croissance du PIB et au chômage (HCP)
with masi_trim as (

    -- clôture de la dernière séance de chaque trimestre
    select distinct on (date_trunc('quarter', date))
        date_trunc('quarter', date)::date as date_ref,
        cloture as masi_fin_trimestre
    from {{ source('staging', 'bvc_indices') }}
    where indice = 'MASI'
    order by date_trunc('quarter', date), date desc

),

masi_perf as (

    select
        date_ref,
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
    c.chomage_national_pct
from masi_perf m
left join {{ ref('croissance_pib') }}       p on p.date_ref = m.date_ref
left join {{ ref('chomage_trimestriel') }}  c on c.date_ref = m.date_ref