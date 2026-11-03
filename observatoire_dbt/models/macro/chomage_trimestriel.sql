-- Taux de chômage trimestriel (HCP), toutes tranches d'âge + focus jeunes 15-24 ans
select
    date_ref,
    extract(year from date_ref)::int    as annee,
    extract(quarter from date_ref)::int as trimestre,
    max(case when indicateur = 'chomage_ensemble_national' then valeur end) as chomage_national_pct,
    max(case when indicateur = 'chomage_ensemble_urbain'   then valeur end) as chomage_urbain_pct,
    max(case when indicateur = 'chomage_ensemble_rural'    then valeur end) as chomage_rural_pct,
    max(case when indicateur = 'chomage_15_24_national'    then valeur end) as chomage_jeunes_pct
from {{ source('staging', 'macro_indicateurs') }}
where indicateur like 'chomage_%'
group by date_ref