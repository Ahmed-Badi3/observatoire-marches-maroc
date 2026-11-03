-- Décisions de politique monétaire de Bank Al-Maghrib (dates d'entrée en vigueur)
with decisions as (

    select
        date_ref    as date_effet,
        valeur      as taux_directeur_pct,
        lag(valeur) over (order by date_ref) as taux_precedent
    from {{ source('staging', 'macro_indicateurs') }}
    where indicateur = 'taux_directeur'

)

select
    date_effet,
    taux_directeur_pct,
    round((taux_directeur_pct - taux_precedent) * 100) as variation_pb,
    case
        when taux_precedent is null              then 'initial'
        when taux_directeur_pct > taux_precedent then 'hausse'
        when taux_directeur_pct < taux_precedent then 'baisse'
        else 'maintien'
    end as type_decision
from decisions