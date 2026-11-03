-- Inflation mensuelle au Maroc (HCP, IPC base 2017)
with ipc as (

    select
        date_ref,
        max(case when indicateur = 'ipc_indice_general'          then valeur end) as indice_general,
        max(case when indicateur = 'ipc_alimentation'            then valeur end) as indice_alimentaire,
        max(case when indicateur = 'ipc_produits_non_alimentaires' then valeur end) as indice_non_alimentaire
    from {{ source('staging', 'macro_indicateurs') }}
    where indicateur in ('ipc_indice_general', 'ipc_alimentation', 'ipc_produits_non_alimentaires')
    group by date_ref

)

select
    date_ref,
    indice_general,
    round((indice_general / lag(indice_general, 12) over (order by date_ref) - 1) * 100, 2)              as inflation_annuelle_pct,
    round((indice_general / lag(indice_general, 1)  over (order by date_ref) - 1) * 100, 2)              as inflation_mensuelle_pct,
    round((indice_alimentaire / lag(indice_alimentaire, 12) over (order by date_ref) - 1) * 100, 2)      as inflation_alimentaire_pct,
    round((indice_non_alimentaire / lag(indice_non_alimentaire, 12) over (order by date_ref) - 1) * 100, 2) as inflation_non_alimentaire_pct
from ipc
order by date_ref