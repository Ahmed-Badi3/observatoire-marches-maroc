-- Croissance du PIB en volume (HCP, CVS, prix chaînés, base 2014)
with pib as (

    select date_ref, valeur as pib_volume
    from {{ source('staging', 'macro_indicateurs') }}
    where indicateur = 'pib_produit_interieur_brut_pib'

)

select
    date_ref,
    extract(year from date_ref)::int    as annee,
    extract(quarter from date_ref)::int as trimestre,
    pib_volume,
    round((pib_volume / lag(pib_volume, 4) over (order by date_ref) - 1) * 100, 2) as croissance_annuelle_pct,
    round((pib_volume / lag(pib_volume, 1) over (order by date_ref) - 1) * 100, 2) as croissance_trimestrielle_pct
from pib